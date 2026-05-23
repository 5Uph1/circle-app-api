import { Request, Response } from "express";
import { prisma } from "../connections/client";
import { getIO } from "../socket";

export const getFollowing = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId as string);
    if (isNaN(userId))
      return res.status(400).json({ message: "Invalid userId" });

    const following = await prisma.following.findMany({
      where: { follower_id: userId },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            full_name: true,
            photo_profile: true,
            bio: true,
          },
        },
      },
    });

    const result = following.map((item) => item.following);
    res.status(200).json({ message: "Success get following", data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getFollower = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId as string);
    if (isNaN(userId))
      return res.status(400).json({ message: "Invalid userId" });

    const follower = await prisma.following.findMany({
      where: { following_id: userId },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            full_name: true,
            photo_profile: true,
            bio: true,
          },
        },
      },
    });

    const result = follower.map((item) => item.follower);
    return res
      .status(200)
      .json({ message: "Success get follower", data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const followUser = async (req: Request, res: Response) => {
  try {
    const { followerId, followingId } = req.body;

    if (followerId === followingId) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    // ✅ Pakai findFirst, bukan findUnique dengan compound key
    const existingFollow = await prisma.following.findFirst({
      where: {
        following_id: followingId,
        follower_id: followerId,
      },
    });

    if (existingFollow) {
      return res.status(400).json({ message: "Already following this user" });
    }

    const follow = await prisma.following.create({
      data: {
        follower_id: followerId,
        following_id: followingId,
      },
    });

    getIO().emit("follow-updated", {
      followerId,
      followingId,
      action: "follow",
    });

    res.status(201).json({ message: "Follow success", data: follow });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const unfollowUser = async (req: Request, res: Response) => {
  try {
    const { followerId, followingId } = req.body;

    // ✅ Pakai findFirst dulu untuk dapat id-nya
    const existingFollow = await prisma.following.findFirst({
      where: {
        following_id: followingId,
        follower_id: followerId,
      },
    });

    if (!existingFollow) {
      return res
        .status(400)
        .json({ message: "You are not following this user" });
    }

    // ✅ Delete pakai primary key id, bukan compound key
    await prisma.following.delete({
      where: { id: existingFollow.id },
    });

    getIO().emit("follow-updated", {
      followerId,
      followingId,
      action: "unfollow",
    });

    res.status(200).json({ message: "Unfollow success" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
