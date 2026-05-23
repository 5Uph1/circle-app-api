import express from "express"
import { getReply, postReply } from "../controllers/reply"
import { authenticate } from "../middlewares/auth"
import { upload } from "../middlewares/upload";

export const reply = express.Router()

reply.get("/:id", authenticate, getReply);
reply.post("/:id", authenticate, upload.single("image"), postReply);

