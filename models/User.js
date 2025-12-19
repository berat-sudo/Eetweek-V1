import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Recipe" }],
  createdAt: { type: Date, default: Date.now },
  savedMenus: [{ type: mongoose.Schema.Types.ObjectId, ref: "SavedMenu" }],

  /* ============================
     HUISHOUDEN / GROEP
     Gebruikers met hetzelfde householdId delen live hun agenda.
  ============================ */
  householdId: { 
    type: String, 
    default: null, 
    index: true 
  },

  /* ============================
     UITNODIGINGSSYSTEEM (NIEUW)
     Slaat op van welke gebruiker een openstaande uitnodiging komt.
  ============================ */
  pendingInvitationFrom: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    default: null 
  },

  /* ============================
     MELDINGEN / NOTIFICATIES
  ============================ */
  notifications: [
    {
      type: {
        type: String,            // bijv: "share"
        required: true
      },
      recipeId: String,
      recipeName: String,
      fromUser: String,
      date: { type: Date, default: Date.now }
    }
  ],
  
  /* ============================
     AGENDA PERSISTENTIE
     Slaat de planning op als een object: { 'YYYY-MM-DD': [ {name, type, recipeId}, ... ] }
  ============================ */
  plannedMeals: {
      type: Object, 
      default: {}
  },

  // Wachtwoord reset velden
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },

  /* ============================
     RECHTEN & STATUS
  ============================ */
  isAdmin: { type: Boolean, default: false } 
});

/* ============================
   MIDDLEWARE
============================ */

// Zorg dat plannedMeals altijd correct wordt opgeslagen als er wijzigingen zijn in het object
userSchema.pre('save', function(next) {
    if (this.isModified('plannedMeals')) {
        this.markModified('plannedMeals');
    }
    next();
});

export default mongoose.model("User", userSchema);