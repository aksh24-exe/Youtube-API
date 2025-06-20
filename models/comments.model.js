import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    video_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      require: true,
    },
    commentText: {
      type: String,
      require: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },
  },
  { timestamps: true } // This will automatically add `createdAt` and `updatedAt` time
);

const Comment = mongoose.model("comment", commentSchema);

export default Comment;
