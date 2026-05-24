import express from "express";
import {
  loginUser,
  registerUser,
  getMyProfile,
  getUserProfile,
  updateProfile,
  searchUser,
  suggestedUsers,
} from "../controllers/user";

import { authenticate } from "../middlewares/auth";
import { upload } from "../middlewares/upload";

export const user = express.Router();

user.post("/register", registerUser);
user.post("/login", loginUser);

user.get("/me", authenticate, getMyProfile);

user.get("/search", authenticate, searchUser);

user.get("/suggested", authenticate, suggestedUsers);

user.get("/profile/:id", authenticate, getUserProfile);

user.put("/edit", authenticate, upload.single("photo_profile"), updateProfile);
