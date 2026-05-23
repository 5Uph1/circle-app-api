import express from "express";
import { followUser, getFollower, getFollowing, unfollowUser } from "../controllers/follow";
import { authenticate } from "../middlewares/auth";

export const follow = express.Router()

follow.get("/following/:userId", authenticate, getFollowing);
follow.get("/followers/:userId", authenticate, getFollower);
follow.post("/follow", followUser);
follow.delete("/unfollow", unfollowUser);