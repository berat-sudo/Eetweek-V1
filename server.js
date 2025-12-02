import express from "express";
import session from "express-session";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import validator from "validator";
import multer from "multer";

import User from "./models/User.js";
import Recipe from "./models/Recipe.js";
import SavedMenu from "./models/SavedMenu.js";
import News from "./models/News.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.set("trust proxy", 1);


// ------------------ MIDDLEWARE ------------------
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallbacksecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// ------------------ MULTER ------------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ------------------ MONGO CONNECTIE ------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connect error:", err));

// ------------------ NODEMAILER ------------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ------------------ RATE LIMITERS ------------------
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Te veel loginpogingen, probeer het over 15 minuten opnieuw.",
});
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Te veel verzoeken, probeer het over 15 minuten opnieuw.",
});

// ------------------ HELPER ------------------
function isAdmin(req, res, next) {
  if (!req.session.userId) return res.redirect("/login.html");

  User.findById(req.session.userId)
    .then(user => {
      if (!user || !user.isAdmin) return res.status(403).send("❌ Toegang geweigerd: Admins only");
      next();
    })
    .catch(err => res.status(500).send("Server error"));
}

// Voor dashboard en normale gebruikers
app.get("/api/news", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Niet ingelogd" });
  try {
    const news = await News.find().sort({ date: -1 });
    res.json(news);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kon nieuws niet ophalen" });
  }
});

// ------------------ ROUTES ------------------
// Admin dashboard
app.get("/admin", isAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "views", "admin.html"));
});

// Auth routes
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!validator.isEmail(email)) return res.redirect("/register.html?error=invalidemail");
  if (!validator.isStrongPassword(password, { minLength: 8, minNumbers: 1 })) return res.redirect("/register.html?error=weakpassword");

  const existingUser = await User.findOne({ email });
  if (existingUser) return res.redirect("/register.html?error=emailexists");

  const hashed = await bcrypt.hash(password, 10);
  const newUser = new User({ name, email, password: hashed });
  await newUser.save();

  res.redirect("/login.html?success=registered");
});

app.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.redirect("/login.html?error=email");

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.redirect("/login.html?error=password");

  req.session.userId = user._id;
  res.redirect("/dashboard");
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login.html"));
});

// Forgot/Reset password
app.post("/forgot-password", forgotPasswordLimiter, async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "Email niet gevonden" });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 uur
    await user.save();

    const resetURL = `${process.env.FRONTEND_URL}/reset-password.html?token=${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Wachtwoord reset",
      html: `<p>Klik op de link om wachtwoord te resetten:</p><a href="${resetURL}">Reset wachtwoord</a>`,
    });

    res.json({ success: true, message: "Reset link is verstuurd naar je e-mail." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Er is iets misgegaan bij het verzenden van de mail." });
  }
});

app.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;

  if (!validator.isStrongPassword(password, { minLength: 8, minNumbers: 1 })) return res.status(400).json({ error: "Wachtwoord te zwak" });

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ error: "Token ongeldig of verlopen" });

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: "Wachtwoord succesvol gereset!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Er is iets misgegaan bij het resetten van het wachtwoord." });
  }
});

// ------------------ BEVEILIGDE PAGINA'S ------------------
app.get("/dashboard", (req, res) => {
  if (!req.session.userId) return res.redirect("/login.html");
  res.sendFile(path.join(__dirname, "views", "dashboard.html"));
});
app.get("/mijnrecepten.html", (req, res) => {
  if (!req.session.userId) return res.redirect("/login.html");
  res.sendFile(path.join(__dirname, "views", "mijnrecepten.html"));
});
app.get("/opgeslagenweekmenu.html", (req, res) => {
  if (!req.session.userId) return res.redirect("/login.html");
  res.sendFile(path.join(__dirname, "views", "opgeslagenweekmenu.html"));
});
app.get("/nieuws.html", (req, res) => {
  if (!req.session.userId) return res.redirect("/login.html");
  res.sendFile(path.join(__dirname, "views", "nieuws.html"));
});

// ------------------ API: GEBRUIKER ------------------
app.get("/api/user", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Niet ingelogd" });

  try {
    const user = await User.findById(req.session.userId).select("name");
    if (!user) return res.status(404).json({ error: "Gebruiker niet gevonden" });
    res.json({ name: user.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/notifications", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Niet ingelogd" });

  try {
    const user = await User.findById(req.session.userId);
    const notifications = user?.notifications || [];
    user.notifications = [];
    await user.save();
    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kon notificaties niet laden" });
  }
});



// ------------------ RECIPES ------------------
app.get("/api/recipes", async (req, res) => {
  try {
    const currentUserId = req.session.userId || null;
    const recipes = await Recipe.find({
      $or: [{ userId: currentUserId }, { userId: null }, { userId: { $exists: false } }],
    });
    res.json(recipes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kan recepten niet laden" });
  }
});

app.post("/api/recipes", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Niet ingelogd" });

  try {
    const { name, image, duration, persons, ingredients, instructions, tags } = req.body;
    const recipe = new Recipe({
      userId: req.session.userId,
      name,
      image: image?.trim() ? image : null,
      duration,
      persons,
      ingredients,
      instructions,
      tags,
    });
    await recipe.save();
    res.json({ success: true, recipe });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kon recept niet opslaan" });
  }
});

app.get("/api/myrecipes", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Niet ingelogd" });
  try {
    const recipes = await Recipe.find({ userId: req.session.userId });
    res.json(recipes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kon recepten niet laden" });
  }
});

app.delete("/api/recipes/:id", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Niet ingelogd" });

  try {
    const recipe = await Recipe.findOne({ _id: req.params.id, userId: req.session.userId });
    if (!recipe) return res.status(404).json({ error: "Recept niet gevonden" });
    await recipe.deleteOne();
    res.json({ success: true, message: "Recept verwijderd" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kon recept niet verwijderen" });
  }
});

// ------------------ FAVORITES ------------------
app.get("/api/favorites", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Niet ingelogd" });

  try {
    const user = await User.findById(req.session.userId).populate("favorites");
    res.json(user.favorites || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kon favorieten niet laden" });
  }
});

app.post("/api/favorites/:id", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Niet ingelogd" });

  try {
    const recipeId = req.params.id;
    const user = await User.findById(req.session.userId);
    if (!user.favorites.includes(recipeId)) {
      user.favorites.push(recipeId);
      await user.save();
    }
    res.json({ success: true, favorites: user.favorites });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kon favoriet niet toevoegen" });
  }
});

app.delete("/api/favorites/:id", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Niet ingelogd" });

  try {
    const recipeId = req.params.id;
    const user = await User.findById(req.session.userId);
    user.favorites = user.favorites.filter((id) => id.toString() !== recipeId);
    await user.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kon favoriet niet verwijderen" });
  }
});

// ------------------ SAVED MENUS ------------------
app.get("/api/savedmenus", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Niet ingelogd" });

  try {
    const user = await User.findById(req.session.userId).populate("savedMenus");
    res.json(user.savedMenus || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kon opgeslagen weekmenu's niet laden" });
  }
});

app.post("/api/savedmenus", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Niet ingelogd" });

  try {
    const user = await User.findById(req.session.userId);
    const menuWithFullRecipes = await Promise.all(
      req.body.menu.map(async (r) => (r?._id ? await Recipe.findById(r._id) : null))
    );
    const savedMenu = await SavedMenu.create({
      userId: user._id,
      name: req.body.name,
      menu: menuWithFullRecipes.filter(Boolean),
    });
    user.savedMenus.push(savedMenu._id);
    await user.save();
    res.json({ success: true, savedMenu });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kon weekmenu niet opslaan" });
  }
});

app.delete("/api/savedmenus/:id", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Niet ingelogd" });

  try {
    const menuId = req.params.id;
    const user = await User.findById(req.session.userId);
    user.savedMenus = user.savedMenus.filter(id => id.toString() !== menuId);
    await user.save();
    await SavedMenu.findByIdAndDelete(menuId);
    res.json({ success: true, savedMenus: user.savedMenus });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kon weekmenu niet verwijderen" });
  }
});

// ------------------ SHARE RECIPE ------------------
app.post("/api/share-recipe", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Niet ingelogd" });

  const { recipeId, targetEmail } = req.body;
  if (!recipeId || !targetEmail) return res.status(400).json({ error: "Ontbrekende gegevens" });

  try {
    const recipe = await Recipe.findById(recipeId);
    const targetUser = await User.findOne({ email: targetEmail.trim().toLowerCase() });
    if (!recipe || !targetUser) return res.status(404).json({ error: "Recept of ontvanger niet gevonden" });

    const sharedRecipe = new Recipe({ ...recipe.toObject(), userId: targetUser._id, _id: undefined });
    await sharedRecipe.save();

    if (!targetUser.notifications) targetUser.notifications = [];
    const sender = await User.findById(req.session.userId);
    targetUser.notifications.push({
      type: "share",
      recipeId: sharedRecipe._id.toString(),
      recipeName: recipe.name,
      fromUser: sender ? sender.email : "Onbekend",
      date: new Date(),
    });
    await targetUser.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: targetUser.email,
      subject: `Recept gedeeld: ${recipe.name}`,
      html: `
      <table width="100%" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; background:#f6f6f6; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 3px 12px rgba(0,0,0,0.1);">
    
              <!-- HEADER -->
              <tr>
                <td style="background:#4CAF50; text-align:center; padding:24px;">
                  <img src="${process.env.FRONTEND_URL}/Fotos/logo_.png" width="80" style="display:block; margin:auto;" alt="Eetweek Logo">
                  <h2 style="color:white; margin:10px 0 0; font-size:22px;">Nieuw recept gedeeld!</h2>
                </td>
              </tr>
    
              <!-- CONTENT -->
              <tr>
                <td style="padding: 25px; color:#333; font-size:16px; line-height:1.6;">
    
                  <p>Hallo!</p>
    
                  <p><strong>${sender ? sender.name : "Iemand"}</strong> heeft een recept met je gedeeld:</p>
    
                  <div style="background:#fafafa; padding:15px; border-left:4px solid #4CAF50; margin:20px 0;">
                    <strong style="font-size:18px;">${recipe.name}</strong>
                  </div>
    
                  <p>Klik op de knop hieronder om het recept te bekijken:</p>
    
                  <div style="text-align:center; margin:30px 0;">
                    <a href="${process.env.FRONTEND_URL}/dashboard"
                      style="background:#4CAF50; color:white; padding:12px 24px; text-decoration:none; border-radius:6px; font-size:16px;">
                      Recept bekijken
                    </a>
                  </div>
    
                  <p>Veel kookplezier! 🍽️</p>
                </td>
              </tr>
    
              <!-- FOOTER -->
              <tr>
                <td style="background:#f1f1f1; padding:15px; text-align:center; color:#777; font-size:12px;">
                  <p style="margin:0;">© ${new Date().getFullYear()} Eetweek</p>
                  <img src="${process.env.FRONTEND_URL}/Fotos/logo_.png" width="40" style="margin-top:8px; opacity:0.8;">
                </td>
              </tr>
    
            </table>
          </td>
        </tr>
      </table>
      `,
    });
    
    

    res.json({ success: true, message: `Recept gedeeld met ${targetEmail}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kon recept niet delen" });
  }
});

// ------------------ ADMIN ------------------
app.get("/api/admin/users", isAdmin, async (req, res) => {
  try {
    const users = await User.find().select("name email isAdmin");
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kon gebruikers niet laden" });
  }
});

app.get("/api/admin/recipes", isAdmin, async (req, res) => {
  try {
    const recipes = await Recipe.find().populate("userId", "name");
    res.json(recipes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kon recepten niet laden" });
  }
});

app.delete("/api/admin/users/:id", isAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kon gebruiker niet verwijderen" });
  }
});

app.delete("/api/admin/recipes/:id", isAdmin, async (req, res) => {
  try {
    await Recipe.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kon recept niet verwijderen" });
  }
});

app.post("/api/admin/recipes", isAdmin, upload.single("image"), async (req, res) => {
  try {
    const { name, duration, persons, ingredients, instructions, tags, macros } = req.body;

    if (!name || !duration || !persons || !ingredients || !instructions) {
      return res.status(400).json({ error: "Verplichte velden ontbreken" });
    }

    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    const recipe = new Recipe({
      name,
      duration: Number(duration),
      persons: Number(persons),
      ingredients: JSON.parse(ingredients),
      instructions: JSON.parse(instructions),
      tags: tags ? tags.split(",").map(t => t.trim()) : [],
      macros: macros ? JSON.parse(macros) : {},
      image: imagePath,
    });

    await recipe.save();
    res.json({ success: true, recipe });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kon recept niet opslaan" });
  }
});


// ------------------ NIEUWS ------------------
// Admin nieuws routes (upload werkt nu correct)
app.get("/api/admin/news", isAdmin, async (req, res) => {
  try {
    const news = await News.find().sort({ date: -1 });
    res.json(news);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kon nieuws niet laden" });
  }
});

app.post("/api/admin/news", isAdmin, upload.single("image"), async (req, res) => {
  try {
    const { title, text, link } = req.body;
    if (!title || !text) return res.status(400).json({ error: "Titel en tekst zijn verplicht" });
    const imagePath = req.file ? `/uploads/${req.file.filename}` : "";

    const news = new News({ title, text, link, image: imagePath });
    await news.save();
    res.json({ success: true, news });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kon nieuwsbericht niet toevoegen" });
  }
});

import fs from "fs";

// ------------------ NIEUWS VERWIJDEREN ------------------
app.delete("/api/admin/news/:id", isAdmin, async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) return res.status(404).json({ error: "Nieuwsbericht niet gevonden" });

    // Verwijder afbeelding van server als die bestaat
    if (news.image) {
      const imagePath = path.join(__dirname, "public", news.image);
      fs.unlink(imagePath, (err) => {
        if (err) console.error("Kon afbeelding niet verwijderen:", err);
      });
    }

    // Verwijder document uit database
    await News.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kon nieuwsbericht niet verwijderen" });
  }
});

// ------------------ CONTACT FORM ------------------
app.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Vul alle velden in." });
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER, // je eigen e-mail
      to: process.env.CONTACT_EMAIL || process.env.EMAIL_USER, // waar je de berichten wilt ontvangen
      subject: `Nieuw contactbericht van ${name}`,
      html: `
        <p><strong>Naam:</strong> ${name}</p>
        <p><strong>E-mail:</strong> ${email}</p>
        <p><strong>Bericht:</strong></p>
        <p>${message}</p>
      `,
    });

    res.json({ success: true, message: "Bedankt! Je bericht is verstuurd." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Er ging iets mis bij het versturen van je bericht." });
  }
});



// ------------------ SERVER START ------------------
app.listen(PORT, () => console.log(`✅ Server draait op http://localhost:${PORT}`));
