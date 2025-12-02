import mongoose from "mongoose";

const newsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  text: { type: String, required: true },
  link: { type: String, default: "" },
  image: { type: String, default: "" },
  date: { type: Date, default: Date.now }
});

export default mongoose.model("News", newsSchema);
