import express from "express";
import {
  getThread,
  getThreadByUser,
  postThread,
  toggleLike,
} from "../controllers/thread";
import { authenticate } from "../middlewares/auth";
import { upload } from "../middlewares/upload";

export const thread = express.Router();

thread.get("/", authenticate, getThread);
thread.post("/post", authenticate, upload.single("image"), postThread);
thread.post("/:id/like", authenticate, toggleLike);
thread.get("/user/:id", authenticate, getThreadByUser);
