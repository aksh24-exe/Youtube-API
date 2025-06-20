import express from "express";
import mongoose from "mongoose";

import Comment from "../models/comments.model.js";
import { checkAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/new", checkAuth, async (req, res) => {
  try {
    const { video_id, commentText } = req.body;

    if (!video_id || !commentText) {
      return res.status(404).json({
        error: "Video Id and Comment Text are required",
      });
    }

    const newComment = new Comment({
      _id: mongoose.Schema.Types.ObjectId,
      video_id,
      commentText,
      user_id: req.user._id, // Extracted from token
    });

    await newComment.save();
    res
      .status(201)
      .json({ message: "Comment added successfully", comment: newComment });
  } catch (error) {
    console.log("Error:", error);

    res.status(500).json({
      error: "Internal error Server",
      message: error.message,
    });
  }
});

router.delete("/:commentId", checkAuth, async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        message: "Comment not found on this id",
      });
    }

    if (comment.user_id.toString() !== req.user._id) {
      return res.status(404).json({
        error: "Unauthorized to delete this comment",
      });
    }

    await Comment.findByIdAndDelete(commentId);

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.log("Error:", error);

    res.status(500).json({
      error: "Internal error Server",
      message: error.message,
    });
  }
});

router.put("/:commentid", checkAuth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { commentText } = req.body;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        error: "Comment not found",
      });
    }

    if (comment.user_id.toString() !== req.user._id) {
      return res
        .status(403)
        .json({ error: "Unauthorized to edit this comment" });
    }

    Comment.commentText = commentText;

    await Comment.save();
    res.status(200).json({
      message: "Comment updated successfully",
      comment,
    });
  } catch (error) {
    console.log("Error:", error);

    res.status(500).json({
      error: "Internal error Server",
      message: error.message,
    });
  }
});

router.get("/comment/:video", checkAuth, async (req, res) => {
  try {
    const { videoId } = req.params;

    const comment = await Comment.find({
      video_id: videoId,
    })
      .populate("user_id", "channelName logoUrl") // Populate user details
      .sort({ createdAt: -1 }); // Sort by newest comments first

    res.status(200).json({
      comment,
    });
  } catch (error) {
    console.log("Error:", error);

    res.status(500).json({
      error: "Internal error Server",
      message: error.message,
    });
  }
});

export default router;
