import mongoose from "mongoose";

const ingredientSchema = new mongoose.Schema({
  item: String,
  amount: String
});

const recipeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  name: { type: String, required: true },
  image: { type: String, default: "https://via.placeholder.com/150" },
  duration: { type: Number, required: true },
  persons: { type: Number, default: 1 },
  ingredients: [ingredientSchema],
  instructions: {
    type: [String],
    required: true
  },
  tags: [String],
  macros: { protein: { type: Number, default: 0 }, carbs: { type: Number, default: 0 }, fat: { type: Number, default: 0 } },
  createdAt: { type: Date, default: Date.now },

  // ✅ Nieuw: Share token voor link delen
  shareToken: { type: String, unique: true, sparse: true },
  
  // 👨‍🍳 NIEUWE TOEVOEGING: Chef-kok Veld
  chef: { 
      type: String, 
      default: null 
  }
});

export default mongoose.model("Recipe", recipeSchema);