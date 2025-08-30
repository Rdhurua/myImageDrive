import express from "express";
import Folder from "../models/folderModel.js";
import Image from "../models/ImageModel.js"
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

// Create folder (can be nested)
router.post("/", async (req, res) => {
  try {
    const { name, parentId = null } = req.body;
    if (!name) return res.status(400).json({ message: "Folder name required" });

    // Check parent folder exists if parentId given
    if (parentId) {
      const parent = await Folder.findOne({ _id: parentId, user: req.user.id });
      if (!parent) return res.status(404).json({ message: "Parent folder not found" });
    }

    const folder = await Folder.create({ name, user: req.user.id, parent: parentId });
    res.status(201).json(folder);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Folder with same name exists" });
    }
    res.status(500).json({ message: err.message });
  }
});

// Get all folders for user (flat list)
router.get("/", async (req, res) => {
  const folders = await Folder.find({ user: req.user.id });
  res.json(folders);
});

// Get children of a specific folder
router.get("/children/:parentId", async (req, res) => {
  const { parentId } = req.params;
  const folders = await Folder.find({ user: req.user.id, parent: parentId });
  res.json(folders);
});


// Rename a folder
router.patch("/:id/rename", async (req, res) => {
  try {
    const { id } = req.params;
    const { newName } = req.body;

    if (!newName) return res.status(400).json({ message: "New name is required" });

    const folder = await Folder.findOne({ _id: id, user: req.user.id });
    if (!folder) return res.status(404).json({ message: "Folder not found" });

    folder.name = newName;
    await folder.save();

    res.json({ message: "Folder renamed successfully", folder });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// Delete a folder
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const folder = await Folder.findOne({ _id: id, user: req.user.id });
    if (!folder) return res.status(404).json({ message: "Folder not found" });

    // Delete all child folders recursively
    const deleteChildren = async (parentId) => {
      const children = await Folder.find({ parent: parentId, user: req.user.id });
      for (let child of children) {
        await deleteChildren(child._id);
        await Folder.deleteOne({ _id: child._id });
        await Image.deleteMany({ folder: child._id, user: req.user.id });
      }
    };
    await deleteChildren(folder._id);

    // Delete all images in this folder
    await Image.deleteMany({ folder: folder._id, user: req.user.id });

    // Delete the folder itself
    await Folder.deleteOne({ _id: folder._id });

    res.json({ message: "Folder and its contents deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});






export default router;
