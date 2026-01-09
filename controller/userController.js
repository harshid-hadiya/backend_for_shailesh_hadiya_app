const User = require("../model/User.js");
const bcrypt = require("bcrypt");
const asyncHandler = require("express-async-handler");
const getJsonToken = require("../config/getJsonToken");
const mongoose = require("mongoose");
const createUser = asyncHandler(async (req, res) => {
  const { name, email, username, password } = req.body;

  if (!name || !email || !username || !password) {
    res.status(400);
    throw new Error("All fields are required");
  }

  const exists = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (exists) {
    res.status(400);
    throw new Error("User already exists with this email or username");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    username,
    password: hashedPassword,
  });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    profilePic: user.profilePic,
    token: getJsonToken(user.email, user._id),
  });
});

const LoginHandler = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if ((!email && !username) || !password) {
    res.status(400);
    throw new Error("Email/Username and password are required");
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  res.status(200).json({
    _id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    profilePic: user.profilePic,
    token: getJsonToken(user.email, user._id),
  });
});



const updateUser = asyncHandler(async (req, res) => {
  const  id  = req.user._id;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid user ID");
  }

  const user = await User.findById(id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const allowedFields = [
    "name",
    "email",
    "username",
    "password",
    "profilePic",
  ];

  const updates = {};

  for (const key of allowedFields) {
    if (req.body[key] !== undefined) {
      updates[key] = req.body[key];
    }
  }

  if ("email" in updates && !updates.email) {
    res.status(400);
    throw new Error("Email cannot be empty");
  }

  if ("username" in updates && !updates.username) {
    res.status(400);
    throw new Error("Username cannot be empty");
  }

  if ("name" in updates && !updates.name) {
    res.status(400);
    throw new Error("Name cannot be empty");
  }

  if (updates.email && updates.email !== user.email) {
    const emailExists = await User.findOne({ email: updates.email });
    if (emailExists) {
      res.status(400);
      throw new Error("Email already in use");
    }
  }

  if (updates.username && updates.username !== user.username) {
    const usernameExists = await User.findOne({
      username: updates.username,
    });
    if (usernameExists) {
      res.status(400);
      throw new Error("Username already in use");
    }
  }

  if (updates.password) {
    updates.password = await bcrypt.hash(updates.password, 10);
  }

  Object.assign(user, updates);

  const updatedUser = await user.save();

  res.status(200).json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    username: updatedUser.username,
    profilePic: updatedUser.profilePic,
  });
});

module.exports = { updateUser , LoginHandler,createUser};
