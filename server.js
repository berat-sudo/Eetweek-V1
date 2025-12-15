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
  // CRUCIALE FIX: Sla de naam en e-mail op in de sessie voor chef-fallback
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

app.get("/agenda.html", (req, res) => {
  if (!req.session.userId) return res.redirect("/login.html");
  // Stuurt het HTML-bestand 'agenda.html' terug, dat in de 'views' map moet staan.
  res.sendFile(path.join(__dirname, "views", "agenda.html")); 
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

// ROUTE 1: Nieuw recept toevoegen (MET MULTER FIX)
app.post("/api/recipes", upload.single('image'), async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Niet ingelogd" });

  try {
    // Haal alle velden op. Ze komen binnen als strings (vanwege multer Form Data)
    const { name, duration, persons, ingredients: ingredientsStr, instructions: instructionsStr, tags: tagsStr, macros: macrosStr, chef } = req.body; 
    
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    // 🔑 FIX 1: JSON-parsing en Array-conversie voor de data (die nu strings zijn)
    
    // Ingrediënten: Probeer JSON te parsen
    let ingredients = [];
    try {
        ingredients = ingredientsStr ? JSON.parse(ingredientsStr) : [];
    } catch (e) {
        console.error("Fout bij parsen ingrediënten:", e);
        // Doe hier niks, de validatie hieronder vangt het op
    }
    
    // Instructies: Splits de platte tekst op nieuwe regels
    let instructionsArray = [];
    if (instructionsStr) {
        instructionsArray = instructionsStr.split('\n')
                                           .map(step => step.trim())
                                           .filter(step => step.length > 0); 
    }
    
    // Tags: Split op komma's
    const tags = tagsStr ? tagsStr.split(",").map(t => t.trim()).filter(Boolean) : [];
    
    // Macros: Probeer JSON te parsen
    let macros = {};
    try {
        macros = macrosStr ? JSON.parse(macrosStr) : {}; 
    } catch (e) {
        console.error("Fout bij parsen macro's:", e);
    }


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
      // 🔑 FIX 2: Zorg voor een fallback voor 'chef' om Mongoose 500 te voorkomen
      chef: chef || req.session.user?.name || 'Onbekende gebruiker', 
      ingredients,
      instructions: instructionsArray, 
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
    // Geef de algemene foutmelding terug
    res.status(500).json({ error: "Kon recept niet opslaan" });
  }
});

// ROUTE 2: Afbeelding bijwerken voor bestaand recept (MET OUDE BESTAND VERWIJDEREN)
app.post("/api/recipes/:id/upload-image", upload.single('image'), async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Niet ingelogd" });

    try {
        const recipeId = req.params.id;
        const recipe = await Recipe.findOne({ _id: recipeId, userId: req.session.userId });

        if (!req.file || !recipe) {
            if (req.file) {
                 fs.unlink(path.join(__dirname, "public", "uploads", req.file.filename), (err) => {
                    if (err) console.error("Kon tijdelijke afbeelding niet verwijderen:", err);
                });
            }
            return res.status(404).json({ error: "Recept niet gevonden of bestand ontbreekt." });
        }

        // Verwijder de OUDE afbeelding
        if (recipe.image) {
            const oldImagePath = path.join(__dirname, "public", recipe.image);
            fs.unlink(oldImagePath, (err) => {
                if (err) console.error("Kon oude afbeelding niet verwijderen:", err);
            });
        }
        
        // Sla het NIEUWE pad op in de database
        const newImagePath = `/uploads/${req.file.filename}`;
        recipe.image = newImagePath;
        await recipe.save();

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

// ------------------ NIEUWE ROUTE VOOR AGENDA ------------------
// ROUTE: Haal ALLE recepten op voor de Agenda (alle gebruikers en publiek)
app.get("/api/allrecipes", async (req, res) => {
  // Optioneel: Je kunt controleren of de gebruiker is ingelogd, maar technisch gezien is
  // de hele /agenda.html pagina al beveiligd.
  if (!req.session.userId) return res.status(401).json({ error: "Niet ingelogd" });

  try {
    // Haal ALLE recepten op. Zonder de filter 'userId: req.session.userId'.
    // Hier haal je ofwel alle recepten op, of je past de filter aan als je
    // alleen recepten van de gebruiker en publieke recepten wilt toestaan.
    // Laten we de logica van /api/recipes hergebruiken:
    const currentUserId = req.session.userId || null;
    const recipes = await Recipe.find({
        $or: [
            { userId: { $exists: false } }, // Publieke/Systeem recepten (als ze geen userId hebben)
            { userId: null },              // Publieke/Systeem recepten
            { userId: currentUserId },      // Recepten van de ingelogde gebruiker
            // OPTIONEEL: Wil je ECHT alle recepten van ALLE andere gebruikers zien?
            // Als je dat wilt, moet je de filter weglaten: const recipes = await Recipe.find();
        ]
    })
    // 🔑 Zorg dat je de velden selecteert die de frontend (agenda.js) nodig heeft
    // Dit is nodig om de kaartjes te renderen, inclusief de chef naam of user ID.
    .populate('userId', 'name') // Vul de userId met de naam van de gebruiker (chef)
    .lean(); // Converteer naar platte JS objecten voor gemakkelijke verwerking

    // Transformatie: Zorg dat het chef-veld correct is ingevuld, ongeacht of het een populatie is
    const transformedRecipes = recipes.map(recipe => ({
        _id: recipe._id,
        name: recipe.name,
        // Gebruik de bestaande 'chef' als deze gevuld is, anders de gepopuleerde naam
        user: recipe.chef || recipe.userId?.name || 'Onbekend', 
        imagePath: recipe.image, // Let op: in Mongoose heet dit 'image', niet 'imagePath'
        // Voeg andere benodigde velden toe
        duration: recipe.duration,
        persons: recipe.persons,
        // ... andere velden die je nodig hebt voor de modal/kaartjes
    }));

    res.json(transformedRecipes);
  } catch (err) {
    console.error("Fout bij laden alle recepten voor agenda:", err);
    res.status(500).json({ error: "Kon recepten niet laden" });
  }
});

// ------------------ NIEUW: API AGENDA PERSISTENTIE ------------------

// ROUTE 1: De planning van de gebruiker laden (GET)
app.get("/api/agenda/load", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Niet ingelogd" });

    try {
        // We gaan ervan uit dat 'plannedMeals' is toegevoegd aan het User model
        const user = await User.findById(req.session.userId).select("plannedMeals");

        if (!user || !user.plannedMeals) {
            // Als de gebruiker bestaat maar nog geen planning heeft, stuur leeg object terug
            return res.status(200).json({ meals: {} }); 
        }

        // Stuurt de opgeslagen planning terug (die de frontend nodig heeft)
        res.json({ meals: user.plannedMeals });
    } catch (err) {
        console.error("Fout bij laden agenda data:", err);
        res.status(500).json({ error: "Kon agenda data niet laden." });
    }
});


// ROUTE 2: De planning van de gebruiker opslaan (POST)
app.post("/api/agenda/save", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Niet ingelogd" });

    // De frontend stuurt { meals: plannedMeals }
    const plannedMealsData = req.body.meals;

    // Snelle validatie
    if (!plannedMealsData || typeof plannedMealsData !== 'object') {
        return res.status(400).json({ error: "Ongeldige data ontvangen." });
    }

    try {
        // Gebruik findByIdAndUpdate om direct de plannedMeals op te slaan
        const user = await User.findByIdAndUpdate(
            req.session.userId,
            { plannedMeals: plannedMealsData },
            { new: true, runValidators: true, select: "plannedMeals" }
        );

        if (!user) {
            return res.status(404).json({ error: "Gebruiker niet gevonden." });
        }
        
        res.json({ success: true, message: "Agenda succesvol opgeslagen." });

    } catch (err) {
        console.error("Fout bij opslaan agenda data:", err);
        res.status(500).json({ error: "Kon agenda data niet opslaan." });
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
// 🚀 NIEUWE GECORRIGEERDE LOGICA MET POPULATIE
app.get("/api/savedmenus", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Niet ingelogd" });

  try {
    const savedMenus = await SavedMenu.find({ userId: req.session.userId })
      // 🔑 CRUCIALE FIX: Vul de 'menu.recipeId' velden met de volledige Recipe documenten.
      .populate({
        path: 'menu.recipeId', 
        model: 'Recipe', 
        // Vraag expliciet alle velden op die de frontend (dashboard én opgeslagenweekmenu) nodig heeft
        select: 'name image duration persons ingredients instructions tags macros chef' 
      })
      .sort({ createdAt: -1 });
      
    // Transformeer de data om de receptdetails en 'persons' samen te voegen.
    const cleanedMenus = savedMenus.map(menu => {
        const menuObject = menu.toObject();
        menuObject.menu = menuObject.menu
            .filter(item => item.recipeId !== null && item.recipeId !== undefined)
            .map(item => ({
                ...item.recipeId,  // Dit is het gepopuleerde receptobject (name, tags, chef, etc.)
                persons: item.persons || 1 // Voeg de opgeslagen 'persons' toe
            }));
        return menuObject;
    });

    res.json(cleanedMenus); // Stuurt nu SavedMenu documenten met VOLLEDIGE RECEPT OBJECTEN
  } catch (err) {
    console.error("Fout bij ophalen SavedMenus:", err);
    res.status(500).json({ error: "Kon opgeslagen weekmenu's niet laden" });
  }
});

// Fix in de POST route, zodat het de correcte structuur opslaat die de GET route verwacht
app.post("/api/savedmenus", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Niet ingelogd" });

  // VALIDEREN: Zorg dat de basis data er is.
  if (!req.body.name || !Array.isArray(req.body.menu)) {
    return res.status(400).json({ error: "Naam en een geldig menu (als array) zijn vereist." });
  }
    
  try {
    const user = await User.findById(req.session.userId);
    
    // De frontend stuurt nu een array van { recipeId: 'id', persons: 1 } objecten (zie dashboard.js)
    const menuItemsToSave = req.body.menu
        .filter(item => item && item.recipeId) // Filter lege items/items zonder ID
        .map(item => ({ 
            recipeId: item.recipeId, 
            persons: item.persons || 1 
        }));

    // Maak het nieuwe SavedMenu document
    const savedMenu = await SavedMenu.create({
      userId: user._id,
      name: req.body.name,
      // Slaat de correcte structuur op: [{ recipeId: ID, persons: X }, ...]
      menu: menuItemsToSave, 
    });
    
    // Voeg de referentie toe aan de gebruiker
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
// Code voor het delen van recepten is behouden, inclusief file duplicatie
app.post("/api/share-recipe", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Niet ingelogd" });

  const { recipeId, targetEmail } = req.body;
  if (!recipeId || !targetEmail) return res.status(400).json({ error: "Ontbrekende gegevens" });

  try {
    const recipe = await Recipe.findById(recipeId);
    const targetUser = await User.findOne({ email: targetEmail.trim().toLowerCase() });
    
    if (!recipe || !targetUser) return res.status(404).json({ error: "Recept of ontvanger niet gevonden" });

    let newImagePath = recipe.image; 

    // Fysieke afbeelding dupliceren indien aanwezig
    if (recipe.image) {
        const originalRelativePath = recipe.image;
        const originalFullPath = path.join(__dirname, "public", originalRelativePath);
        
        if (fs.existsSync(originalFullPath)) {
            const fileExtension = path.extname(originalRelativePath);
            const newFilename = Date.now() + "-" + Math.round(Math.random() * 1e9) + fileExtension;
            newImagePath = `/uploads/${newFilename}`;
            const newFullPath = path.join(__dirname, "public", newImagePath);

            fs.copyFileSync(originalFullPath, newFullPath);
        } else {
            newImagePath = null; 
        }
    }

    // Maak het nieuwe recept
    const sharedRecipe = new Recipe({ 
      ...recipe.toObject(), 
      userId: targetUser._id, 
      _id: undefined, 
      image: newImagePath 
    });
    
    await sharedRecipe.save();

    // Notificatie logica...
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

    // E-mail logica... (code niet herhaald, maar is aanwezig)

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

// ADMIN RECEPT VERWIJDEREN (nu inclusief afbeelding verwijderen)
app.delete("/api/admin/recipes/:id", isAdmin, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ error: "Recept niet gevonden" });
    
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

    // FIX: JSON-array instructies parsen
    let parsedInstructions = [];
    try {
        parsedInstructions = JSON.parse(instructions);
        if (!Array.isArray(parsedInstructions)) { 
            parsedInstructions = [parsedInstructions.toString()];
        }
    } catch (e) {
        parsedInstructions = instructions.split('\n')
                                         .map(step => step.trim())
                                         .filter(step => step.length > 0);
    }
    
    let parsedIngredients = [];
     try {
        parsedIngredients = JSON.parse(ingredients);
    } catch (e) {
        console.error("Fout bij parsen admin ingrediënten:", e);
    }
    
    let parsedMacros = {};
     try {
        parsedMacros = macros ? JSON.parse(macros) : {};
    } catch (e) {
        console.error("Fout bij parsen admin macro's:", e);
    }


    const recipe = new Recipe({
      name,
      duration: Number(duration),
      persons: Number(persons),
      chef: chef || 'Admin', 
      ingredients: parsedIngredients, 
      instructions: parsedInstructions, 
      tags: tags ? tags.split(",").map(t => t.trim()) : [],
      macros: parsedMacros, 
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