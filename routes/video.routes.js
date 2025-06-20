import mongoose from "mongoose";
import express from "express";

import User from "../models/user.model.js";
import Video from "../models/video.model.js";
import cloudinary from "../config/cloudinary.js";
import { checkAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

// 👉 Upload Video
router.post("/update", checkAuth, async (req, res) => {
  try {
    const { title, description, category, tags } = req.body;

    if (!req.files || !req.files.Video || !req.files.thumnail) {
      return res
        .status(400)
        .json({ error: "Video and thumbnail are required" });
    }

    const videoUpload = await cloudinary.uploader.upload(
      req.files.Video.tempFilePath,
      {
        resource_type: "video",
        folder: "videos",
      }
    );

    const thumbnailupload = await cloudinary.uploader.upload(
      req.files.thumnail.tempFilePath,
      {
        folder: "thumnails",
      }
    );

    const newVideo = new Video({
      _id: new mongoose.Types.ObjectId(),
      title,
      description,
      user_id: req.user._id,
      videoUrl: videoUpload.secure_url,
      videoId: videoUpload.public_id,
      thumbnailUrl: thumbnailupload.secure_url,
      thumbnailId: thumbnailupload.public_id,
      category,
      tags: tags ? tags.split(",") : [],
    });

    await newVideo.save();

    res.status(200).json({
      message: "Video uploaded successfully",
      video: newVideo,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "something went wrong",
      message: error.message,
    });
  }
});

// 👉 Update Video ( No video Change only metaData and thumbnail)
router.put("/update/:id", checkAuth, async (req, res) => {
  try {
    const { title, description, category, tags } = req.body;
    const videoId = req.params.id;

    let video = await Video.findOne(videoId);
    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    if (video.user_id.toString() !== req.user_id.toString()) {
      return res.status(403).json({ error: "unauthorization" });
    }

    if (req.files && req.files.thumnail) {
      await cloudinary.uploader.destroy(video.thumbnailId);

      const thumbnailupload = await cloudinary.uploader.upload(
        req.files.thumnail.tempFilePath,
        {
          folder: "thumbnail",
        }
      );

      video.thumbnailUrl = thumbnailupload.secure_url;
      video.thumbnailId = thumbnailupload.public_id;
    }

    // update fields
    video.title = title || video.title;
    video.description = description || video.description;
    video.category = category || video.category;
    video.tags = tags ? tags.split(",") : video.tags;

    // save video in database
    await video.save();

    res.status(200).json({
      messgae: "Videos updated Successfully",
      video,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: "something went wrong",
      message: error.message,
    });
  }
});

// 👉 Delete Video
router.delete("delete/:id", checkAuth, async (req, res) => {
  try {
    const videoId = req.params.id;

    let video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({
        error: "Video not found",
      });
    }

    if (video.user_id.toString() === req.user._id.toString()) {
      return res.status(404).json({ error: "Unauthorized" });
    }

    //Delete from cloudinary
    await cloudinary.uploader.destroy(video.videoId, {
      resource_type: "video",
    });
    await cloudinary.uploader.destroy(video.thumnail);

    await Video.findByIdAndDelete(videoId);

    res.status(200).json({
      message: "Video delete Successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: "Something went wrong",
      message: error.message,
    });
  }
});

// 👉 Get All Video
router.get("/all", async (req, res) => {
  try {
    const video = await Video.find().sort({ createdAt: -1 });

    res.status(201).json({
      video,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: "Something went wrong",
      message: error.message,
    });
  }
});

// 👉 My video
router.get("/my-video", checkAuth, async (req, res) => {
  try {
    const video = await Video.find({ user_id: req.user._id }).sort({
      createdAt: -1,
    });
    res.status(201).json({
      video,
    });
  } catch (error) {
    console.log(error);

    res.status(404).json({
      error: "Something went wrong",
      message: error.message,
    });
  }
});

// 👉 Get Video By Id
router.get("/:id", checkAuth, async (req, res) => {
  try {
    const videoId = req.params.id;
    const userId = req.user._id;

    // Use findByIdAndUpdate to add the user Id to the viewedBy array if not already present
    const video = await Video.findByIdAndUpdate(
      videoId,
      {
        $addToSet: { viewedBy: userId }, // Add user ID to viewedBy array, avoidate duplicated
      },
      {
        new: true, // Return the updated video document
      }
    );

    if (!video) {
      return res.status(404).json({
        message: "Video Not found",
      });
    }

    res.status(200).json(video);
  } catch (error) {
    console.log(error);

    res
      .status(501)
      .json({ message: "Something went wrong", error: error.message });
  }
});

// 👉 Get Video By Category
router.get("/category/:category", async (req, res) => {
  try {
    const video = await Video.find({ category: req.params.category }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      message: "Category video ",
      video,
    });
  } catch (error) {
    console.log(error);

    res
      .status(501)
      .json({ message: "Something went wrong", error: error.message });
  }
});

// 👉 Get Video By Tags
router.get("/tags/:tag", async (req, res) => {
  try {
    const tag = req.params.tag;

    const video = await Video.find({ tags: tag }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      message: "Category video ",
      video,
    });
  } catch (error) {
    console.log(error);

    res
      .status(501)
      .json({ message: "Something went wrong", error: error.message });
  }
});

// 👉 Video Like
router.post("/like", checkAuth, async (req, res) => {
  try {
    const { videoId } = req.body;

    const video = await Video.findByIdAndUpdate(videoId, {
      $addToSet: { likedBy: req.user._id },
      $pull: { disLikedBy: req.user._id },
    });

    res.status(200).json({
      message: "Liked the Video",
      video,
    });
  } catch (error) {
    console.log(error);

    res
      .status(501)
      .json({ message: "Something went wrong", error: error.message });
  }
});

// 👉 Video disLike
router.post("/dislike", checkAuth, async (req, res) => {
  try {
    const { videoId } = req.body;

    const video = await Video.findByIdAndUpdate(videoId, {
      $addToSet: { disLikedBy: req.user._id },
      $pull: { likedBy: req.user._id }, // Remove the like if we previously liked
    });

    res.status(200).json({
      message: "Disliked the Video",
      video,
    });
  } catch (error) {
    console.log(error);

    res
      .status(501)
      .json({ message: "Something went wrong", error: error.message });
  }
});
export default router;
