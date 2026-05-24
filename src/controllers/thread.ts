import { Request, RequestHandler, Response } from "express";
import { prisma } from "../connections/client";
import { AuthRequest } from "../types/express";
import { likeQueue, threadQueue } from "../worker/queue";

// Format thread
export const formatThread = (thread: any, userId?: number) => ({
  id: thread.id,
  content: thread.content,
  image: thread.image,
  created_at: thread.created_at,
  user: {
    id: thread.creator.id,
    username: thread.creator.username,
    name: thread.creator.full_name,
    profile_picture: thread.creator.photo_profile,
  },
  likes: thread.likes.length,
  replies: thread.replies.length,
  isLiked: userId
    ? thread.likes.some((like: any) => like.user_id === userId)
    : false,
});

// Mengambil data thread
export const getThread = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const threads = await prisma.thread.findMany({
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            full_name: true,
            photo_profile: true,
          },
        },
        likes: { select: { user_id: true } },
        replies: { select: { id: true } },
      },
      orderBy: { created_at: "desc" },
    });

    const result = threads.map((thread) => formatThread(thread, userId));

    return res.status(200).json({
      status: "success",
      message: "Get threads successfully",
      data: { threads: result },
    });
  } catch (error: any) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

export const getThreadByUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = Number(req.params.id);
    const currentUserId = req.user?.id;

    const threads = await prisma.thread.findMany({
      where: { created_by: userId },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            full_name: true,
            photo_profile: true,
          },
        },
        likes: { select: { user_id: true } },
        replies: { select: { id: true } },
      },
      orderBy: { created_at: "desc" },
    });

    const result = threads.map((thread) => formatThread(thread, currentUserId));

    return res.status(200).json({
      status: "success",
      data: { threads: result },
    });
  } catch (error: any) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

export const postThread = async (req: AuthRequest, res: Response) => {
  try {
    const content = req.body.content;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(500).json({ message: "user kosong" });
    }

    const image = req.file ? req.file.filename : null;

    // MASUKKAN KE QUEUE
    await threadQueue.add("create-thread", {
      content,
      image,
      userId,
    });

    console.log("JOB MASUK QUEUE");

    return res.status(200).json({
      code: "200",
      status: "success",
      message: "Thread masuk antrian, sedang diproses",
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Menekan tombol like
export const toggleLike = async (req: AuthRequest, res: Response) => {
  try {
    const threadId = Number(req.params.id);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 👉 kirim ke queue
    await likeQueue.add("toggle-like", {
      threadId,
      userId,
    });

    return res.json({
      status: "success",
      message: "processing",
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};
