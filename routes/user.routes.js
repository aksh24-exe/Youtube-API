import express from "express";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

import User from "../models/user.model.js";
import cloudinary from "../config/cloudinary.js";
import { checkAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const uploadImage = await cloudinary.uploader.upload(
      req.files.logoUrl.tempFilePath
    );
    console.log("Image👉 ", uploadImage);

    const newUser = await User({
      _id: new mongoose.Types.ObjectId(),
      channelName: req.body.channelName,
      phone: req.body.phone,
      email: req.body.email,
      password: hashedPassword,
      logoUrl: uploadImage.secure_url,
      logoId: uploadImage.public_id,
    });

    let user = await newUser.save();
    console.log("hello 1");
    console.log(user);

    res.status(201).json({
      newUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "something went wrong",
      message: error.message,
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const exisitingUser = await User.findOne({ email: req.body.email });

    if (!exisitingUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const isValid = await bcrypt.compare(
      req.body.password,
      exisitingUser.password
    );

    if (!isValid) {
      return res.status(404).json({
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        _id: exisitingUser._id,
        channelName: exisitingUser.channelName,
        email: exisitingUser.email,
        phone: exisitingUser.phone,
        logoId: exisitingUser.logoId,
      },
      process.env.JWT_TOKEN,
      { expiresIn: "10d" }
    );

    res.status(200).json({
      _id: exisitingUser._id,
      channelName: exisitingUser.channelName,
      email: exisitingUser.email,
      phone: exisitingUser.phone,
      logoId: exisitingUser.logoId,
      logoUrl: exisitingUser.logoUrl,
      token: token,
      subscribers: exisitingUser.subscribers,
      subscribedchannels: exisitingUser.suscribedchannels,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "something went wrong",
      message: error.message,
    });
  }
});

router.put("/update-profile", checkAuth, async (req, res) => {
  try {
    const { channelName, phone } = req.body;
    const user = req.user._id;

    let updateData = { channelName, phone };

    if (req.files && req.files.logoUrl) {
      const uploadImage = await cloudinary.uploader.upload(
        req.files.logoUrl.tempFilePath
      );
      updateData.logoUrl = uploadImage.secure_url;
      updateData.logoId = uploadImage.public_id;
    }

    const updateUser = await User.findByIdAndUpdate(user, updateData, {
      new: true,
    });

    res.status(200).json({
      message: "Profile Update successfully",
      updateUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "something went wrong",
      message: error.message,
    });
  }
});

router.post("/subscribed", checkAuth, async (req, res) => {
  try {
    const { channelId } = req.body;

    if (req.user._id === channelId) {
      return res.status(404).json({
        error: "You Cannot suscribed yourself",
      });
    }

    const currentUser = await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { suscribedchannels: channelId },
    });

    const suscribedUser = await User.findByIdAndUpdate(req.user._id, {
      $inc: { suscribers: 1 },
    });

    res.status(200).json({
      message: "Suscribed Successfully ✅",
      data: {
        currentUser,
        suscribedUser,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "something went wrong",
      message: error.message,
    });
  }
});

export default router;
