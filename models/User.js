import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Recipe" }],
  createdAt: { type: Date, default: Date.now },
  savedMenus: [{ type: mongoose.Schema.Types.ObjectId, ref: "SavedMenu" }],

  /* ============================
     NIEUW: Meldingen / notificaties
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
  
  // ============================
  // NIEUW: AGENDA PERSISTENTIE
  // Slaat de planning op als een object: { 'YYYY-MM-DD': [ {name, type, recipeId}, ... ] }
  // ============================
  plannedMeals: {
      type: Object, // Gebruik Mongoose Object om een dynamische key-value map op te slaan
      default: {}
  },

  // Wachtwoord reset velden
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },

  // ============================
  // NIEUW: Admin rechten
  // ============================
  isAdmin: { type: Boolean, default: false } // standaard geen admin
});

export default mongoose.model("User", userSchema);