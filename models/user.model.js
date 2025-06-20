import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    channelName: {
      type: String,
      require: true,
    },
    email: {
      type: String,
      require: true,
      unique: true,
    },
    phone: {
      type: String,
      require: true,
    },
    password: {
      type: String,
      require: true,
    },
    logoUrl: {
      type: String,
      require: true,
    },
    logoId: {
      type: String,
      require: true,
    },
    suscribers: {
      type: Number,
      default: 0,
    },
    suscribedchannels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const userModel = mongoose.model("user", userSchema);

export default userModel;
