import mongoose from "mongoose";

const SavedMenuSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  menu: { type: Array, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("SavedMenu", SavedMenuSchema);
