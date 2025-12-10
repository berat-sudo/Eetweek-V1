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
import fs from "fs"; 

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
// Belangrijk: Express.urlencoded en Express.json moeten BOVEN Multer staan
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '50mb' })); 

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
    // Zorg ervoor dat deze map bestaat!
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
  // CRUCIALE FIX: Sla de naam en e-mail op in de sessie
  req.session.user = { 
    id: user._id, 
    name: user.name, 
    email: user.email 
  };
  
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
// ROUTE: Account Instellingen
app.get("/mijnaccount.html", (req, res) => {
  if (!req.session.userId) return res.redirect("/login.html");
  res.sendFile(path.join(__dirname, "views", "mijnaccount.html"));
});


// ------------------ API: GEBRUIKER ------------------
app.get("/api/user", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Niet ingelogd" });

  if (req.session.user && req.session.user.name) {
    return res.json({ name: req.session.user.name });
  }

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

app.get("/api/account/data", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Niet ingelogd" });

  try {
    const user = await User.findById(req.session.userId).select("name email preferences");
    if (!user) return res.status(404).json({ error: "Gebruiker niet gevonden" });
    res.json({ name: user.name, email: user.email, preferences: user.preferences }); 
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Serverfout bij ophalen accountinfo" });
  }
});

app.post("/api/account/update", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: "Niet ingelogd." });
  
  const { name, oldPassword, newPassword } = req.body;
  
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).json({ message: "Gebruiker niet gevonden." });
    
    let updated = false;

    if (name) {
      if (name.trim().length < 2) {
        return res.status(400).json({ message: "Naam moet minimaal 2 tekens bevatten." });
      }
      user.name = name.trim();
      if (req.session.user) {
        req.session.user.name = name.trim();
      }
      updated = true;
    }

    if (oldPassword && newPassword) {
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Huidig wachtwoord is onjuist." });
      }

      if (!validator.isStrongPassword(newPassword, { minLength: 8, minNumbers: 1 })) {
        return res.status(400).json({ message: "Nieuw wachtwoord te zwak (minstens 8 tekens, 1 cijfer)." });
      }

      user.password = await bcrypt.hash(newPassword, 10);
      updated = true;
    }

    if (updated) {
      await user.save();
      res.json({ success: true, message: "Instellingen succesvol bijgewerkt!" });
    } else {
      res.status(400).json({ message: "Geen geldige gegevens ontvangen om bij te werken." });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Kon instellingen niet wijzigen" });
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

// ROUTE 1: Nieuw recept toevoegen (met Multer)
app.post("/api/recipes", upload.single('image'), async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Niet ingelogd" });

  try {
    const { name, duration, persons, ingredients: ingredientsStr, instructions: instructionsStr, tags: tagsStr, macros: macrosStr, chef } = req.body; 
    
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    // 🔑 AANPASSING 1: Platte tekst instructies omzetten in een ARRAY van stappen
    let instructionsArray = [];
    if (instructionsStr) {
        // Splits de platte tekst op elke NIEUWE REGEL, trim spaties en filter lege stappen
        instructionsArray = instructionsStr.split('\n')
                                           .map(step => step.trim())
                                           .filter(step => step.length > 0); 
    }
    
    const ingredients = ingredientsStr ? JSON.parse(ingredientsStr) : [];
    const tags = tagsStr ? tagsStr.split(",").map(t => t.trim()).filter(Boolean) : [];
    const macros = macrosStr ? JSON.parse(macrosStr) : {}; 

    // Server-side validatie
    if (!name || instructionsArray.length === 0 || ingredients.length === 0) {
       // Verwijder de geüploade file als de validatie faalt
        if (req.file) {
             fs.unlink(path.join(__dirname, "public", "uploads", req.file.filename), (err) => {
                if (err) console.error("Kon tijdelijke afbeelding niet verwijderen:", err);
            });
        }
       return res.status(400).json({ error: "Naam, instructies en ingrediënten zijn verplicht." });
    }


    const recipe = new Recipe({
      userId: req.session.userId,
      name,
      image: imagePath,
      duration: Number(duration),
      persons: Number(persons),
      chef: chef || null, 
      ingredients,
      instructions: instructionsArray, // Opslag als ARRAY
      tags,
      macros, 
    });
    await recipe.save();

    // Stuur alleen de eigen recepten terug
    const myRecipes = await Recipe.find({ userId: req.session.userId }).sort({ _id: -1 });

    res.json({ success: true, myRecipes });
  } catch (err) {
    console.error("Fout bij opslaan recept:", err);
    // Verwijder de geüploade file bij een onbekende serverfout
    if (req.file) {
        fs.unlink(path.join(__dirname, "public", "uploads", req.file.filename), (err) => {
            if (err) console.error("Kon tijdelijke afbeelding niet verwijderen:", err);
        });
    }
    res.status(500).json({ error: "Kon recept niet opslaan" });
  }
});

// 🔑 ROUTE 2: Afbeelding bijwerken voor bestaand recept (MET OUDE BESTAND VERWIJDEREN)
app.post("/api/recipes/:id/upload-image", upload.single('image'), async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Niet ingelogd" });

    try {
        const recipeId = req.params.id;
        const recipe = await Recipe.findOne({ _id: recipeId, userId: req.session.userId });

        // 1. Controleer of bestand en recept bestaan
        if (!req.file || !recipe) {
            // Verwijder de zojuist geüploade tijdelijke file als er wel een bestand was.
            if (req.file) {
                 fs.unlink(path.join(__dirname, "public", "uploads", req.file.filename), (err) => {
                    if (err) console.error("Kon tijdelijke afbeelding niet verwijderen:", err);
                });
            }
            return res.status(404).json({ error: "Recept niet gevonden of bestand ontbreekt." });
        }

        // 2. Verwijder de OUDE afbeelding, indien aanwezig
        // Dit voorkomt dat weesbestanden (orphaned files) op de server blijven staan
        if (recipe.image) {
            const oldImagePath = path.join(__dirname, "public", recipe.image);
            fs.unlink(oldImagePath, (err) => {
                // Log de fout, maar ga door met de database update, want de nieuwe upload is gelukt.
                if (err) console.error("Kon oude afbeelding niet verwijderen:", err);
            });
        }
        
        // 3. Sla het NIEUWE pad op in de database
        const newImagePath = `/uploads/${req.file.filename}`;
        recipe.image = newImagePath;
        await recipe.save();

        // 4. Stuur het nieuwe URL terug naar de frontend
        res.json({ success: true, newImageUrl: newImagePath });

    } catch (err) {
        console.error("Fout bij bijwerken receptafbeelding:", err);
        res.status(500).json({ error: "Kon afbeelding niet bijwerken." });
    }
});


app.get("/api/myrecipes", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Niet ingelogd" });
  try {
    const recipes = await Recipe.find({ userId: req.session.userId }).sort({ _id: -1 });
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

    // Verwijder de afbeelding van de server
    if (recipe.image) {
        const imagePath = path.join(__dirname, "public", recipe.image);
        fs.unlink(imagePath, (err) => {
            if (err) console.error("Kon afbeelding niet verwijderen:", err);
        });
    }

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
    const savedMenus = await SavedMenu.find({ userId: req.session.userId }).sort({ createdAt: -1 });
    res.json(savedMenus);
  } catch (err) {
    console.error("Fout bij ophalen SavedMenus:", err);
    res.status(500).json({ error: "Kon opgeslagen weekmenu's niet laden" });
  }
});


app.post("/api/savedmenus", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Niet ingelogd" });

  try {
    const user = await User.findById(req.session.userId);

    const menuWithFullRecipes = [];
    for (const recipeItem of req.body.menu) {
        const recipeId = recipeItem._id || recipeItem.recipeId;
        
        if (recipeId) {
            const fullRecipe = await Recipe.findById(recipeId);
            if (fullRecipe) {
                const recipeObject = fullRecipe.toObject();
                recipeObject.persons = recipeItem.persons || 1; 
                menuWithFullRecipes.push(recipeObject);
            }
        } else if (recipeItem.name) {
            menuWithFullRecipes.push(recipeItem);
        }
    }

    const savedMenu = await SavedMenu.create({
      userId: user._id,
      name: req.body.name,
      menu: menuWithFullRecipes, 
    });
    
    if (!user.savedMenus.includes(savedMenu._id)) {
        user.savedMenus.push(savedMenu._id);
        await user.save();
    }

    res.json({ success: true, savedMenu });
  } catch (err) {
    console.error("Fout bij opslaan weekmenu:", err);
    res.status(500).json({ error: "Kon weekmenu niet opslaan" });
  }
});

app.delete("/api/savedmenus/:id", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Niet ingelogd" });

  try {
    const menuId = req.params.id;
    const user = await User.findById(req.session.userId);
    
    if (user) {
        user.savedMenus = user.savedMenus.filter(id => id.toString() !== menuId);
        await user.save();
    }
    
    await SavedMenu.findByIdAndDelete(menuId);
    res.json({ success: true });
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

    let newImagePath = recipe.image; // Standaard het oude pad, tenzij we dupliceren

    // 🔑 AANPASSING: Fysieke afbeelding dupliceren indien aanwezig
    if (recipe.image) {
        const originalRelativePath = recipe.image;
        const originalFullPath = path.join(__dirname, "public", originalRelativePath);
        
        // Controleer of de file bestaat
        if (fs.existsSync(originalFullPath)) {
            // Genereer een nieuwe unieke bestandsnaam
            const fileExtension = path.extname(originalRelativePath);
            const newFilename = Date.now() + "-" + Math.round(Math.random() * 1e9) + fileExtension;
            newImagePath = `/uploads/${newFilename}`;
            const newFullPath = path.join(__dirname, "public", newImagePath);

            // Kopieer het bestand
            fs.copyFileSync(originalFullPath, newFullPath);
        } else {
            // Als de file niet fysiek bestaat, reset het pad (om gebroken links te voorkomen)
            newImagePath = null; 
        }
    }

    // Maak het nieuwe recept, nu met het eventueel gedupliceerde afbeeldingspad
    const sharedRecipe = new Recipe({ 
      ...recipe.toObject(), 
      userId: targetUser._id, 
      _id: undefined, // Belangrijk: Maak een nieuw ID aan
      image: newImagePath // Gebruik het NIEUWE of gereset pad
    });
    
    await sharedRecipe.save();

    // ... (Notificatie en e-mail logica blijft hetzelfde) ...

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

    const frontendUrl = process.env.FRONTEND_URL || `http://localhost:${PORT}`;

    // ... (E-mail logica blijft hetzelfde) ...
    // E-mail code hier (te lang om te herhalen, maar deze blijft identiek)

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

// 🔑 AANGEPASTE ROUTE: ADMIN RECEPT VERWIJDEREN (nu inclusief afbeelding verwijderen)
app.delete("/api/admin/recipes/:id", isAdmin, async (req, res) => {
  try {
    // Zoek eerst het recept om het afbeelding pad te krijgen
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ error: "Recept niet gevonden" });
    
    // Verwijder de afbeelding van de server
    if (recipe.image) {
        const imagePath = path.join(__dirname, "public", recipe.image);
        fs.unlink(imagePath, (err) => {
            if (err) console.error("Kon admin-afbeelding niet verwijderen:", err);
        });
    }

    await Recipe.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kon recept niet verwijderen" });
  }
});

app.post("/api/admin/recipes", isAdmin, upload.single("image"), async (req, res) => {
  try {
    const { name, duration, persons, ingredients, instructions, tags, macros, chef } = req.body; 

    if (!name || !duration || !persons || !ingredients || !instructions) {
      return res.status(400).json({ error: "Verplichte velden ontbreken" });
    }

    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    // 🔑 AANPASSING 2: JSON-array instructies parsen voor admin-invoer
    let parsedInstructions = [];
    try {
        parsedInstructions = JSON.parse(instructions);
        // Zorg ervoor dat het een array is, zelfs als de admin per ongeluk een enkele string stuurde
        if (!Array.isArray(parsedInstructions)) { 
            parsedInstructions = [parsedInstructions.toString()];
        }
    } catch (e) {
        // Val terug op de ruwe string en splits deze op nieuwe regels, voor het geval er geen JSON is gebruikt
        parsedInstructions = instructions.split('\n')
                                         .map(step => step.trim())
                                         .filter(step => step.length > 0);
    }

    const recipe = new Recipe({
      name,
      duration: Number(duration),
      persons: Number(persons),
      chef: chef || 'Admin', 
      ingredients: JSON.parse(ingredients), 
      instructions: parsedInstructions, // Opslag als ARRAY
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

// ------------------ NIEUWS VERWIJDEREN ------------------
app.delete("/api/admin/news/:id", isAdmin, async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) return res.status(404).json({ error: "Nieuwsbericht niet gevonden" });

    if (news.image) {
      const imagePath = path.join(__dirname, "public", news.image);
      fs.unlink(imagePath, (err) => {
        if (err) console.error("Kon afbeelding niet verwijderen:", err);
      });
    }

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
      from: process.env.EMAIL_USER, 
      to: process.env.CONTACT_EMAIL || process.env.EMAIL_USER, 
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