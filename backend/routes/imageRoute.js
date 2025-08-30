import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { requireAuth } from "../middleware/auth.js";
import Folder from "../models/folderModel.js";
import Image from "../models/ImageModel.js";
import { initCloudinary } from "../utils/cloudinary.js";

const router = express.Router();
router.use(requireAuth);

const upload = multer({ dest: "uploads/" });

// Upload Image
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name, folderId } = req.body;
    if (!name || !folderId || !req.file)
      return res.status(400).json({ message: "All fields required" });

    const folder = await Folder.findOne({ _id: folderId, user: req.user.id });
    if (!folder) return res.status(404).json({ message: "Folder not found" });

    let fileUrl = "";
    const cloudinary = initCloudinary();

    if (cloudinary) {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: `image-drive/${req.user.id}/${folderId}`,
      });
      fileUrl = result.secure_url;
      fs.unlinkSync(req.file.path); // remove local file after upload
    } else {
      // Keep local URL
      fileUrl = `/${req.file.path}`;
    }

    const image = await Image.create({
      name,
      url: fileUrl,
      user: req.user.id,
      folder: folderId,
    });

    res.status(201).json(image);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all images in a folder
router.get("/:folderId", async (req, res) => {
  const { folderId } = req.params;
  const images = await Image.find({ folder: folderId, user: req.user.id });
  res.json(images);
});

// Search images by name
router.get("/search/:query", async (req, res) => {
  const { query } = req.params;
  const images = await Image.find({
    user: req.user.id,
    name: { $regex: query, $options: "i" },
  });
  res.json(images);
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Find the image by ID and make sure it belongs to the user
    const image = await Image.findOne({ _id: id, user: req.user.id });
    if (!image) return res.status(404).json({ message: "Image not found" });

    // If the image is stored locally, remove the file
    if (!image.url.startsWith("http")) {
      const filePath = path.join(process.cwd(), image.url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    // Delete image document from DB
    await Image.deleteOne({ _id: id });

    res.json({ message: "Image deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
