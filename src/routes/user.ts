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

user.put(
  "/edit",
  authenticate,
  (req, res, next) => {
    console.log("HIT /user/edit");
    next();
  },
  (req, res, next) => {
    upload.single("photo_profile")(req, res, (err) => {
      if (err) {
        console.error(
          "Multer/Cloudinary error:",
          JSON.stringify(err, Object.getOwnPropertyNames(err)),
        );
        return res.status(500).json({ status: "error", message: err.message });
      }
      console.log(
        "Upload sukses, req.file:",
        req.file?.path ?? "tidak ada file",
      );
      next();
    });
  },
  updateProfile,
);
