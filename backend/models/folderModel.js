import mongoose from "mongoose";

const folderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: "Folder", default: null },
}, { timestamps: true });

// Prevent duplicate folder names under the same parent for same user
folderSchema.index({ name: 1, user: 1, parent: 1 }, { unique: true });

export default mongoose.model("Folder", folderSchema);
