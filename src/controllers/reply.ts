import { Response } from "express";
import { prisma } from "../connections/client";
import { AuthRequest } from "../types/express";
import { replyQueue } from "../worker/queue";

// ─── Format ───────────────────────────────────────────────────────────────────
export const formatReply = (reply: any, userId?: number) => ({
  id: reply.id,
  content: reply.content,
  image: reply.image,
  created_at: reply.created_at,
  user: {
    id: reply.creator.id,
    username: reply.creator.username,
    name: reply.creator.full_name,
    profile_picture: reply.creator.photo_profile,
  },
});

// ─── GET replies by threadId ──────────────────────────────────────────────────
export const getReply = async (req: AuthRequest, res: Response) => {
  const threadId = Number(req.params.id);
  const userId = req.user?.id;

  try {
    const replies = await prisma.reply.findMany({
      where: { thread_id: threadId },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            full_name: true,
            photo_profile: true,
          },
        },
      },
      orderBy: { created_at: "asc" },
    });

    const result = replies.map((reply) => formatReply(reply, userId));

    return res.status(200).json({
      code: 200,
      status: "success",
      message: "Get Data Reply Successfully",
      data: { replies: result },
    });
  } catch (error: any) {
    return res.status(500).json({
      code: 500,
      status: "error",
      message: error.message,
    });
  }
};

// ─── POST reply ───────────────────────────────────────────────────────────────
export const postReply = async (req: AuthRequest, res: Response) => {
  const threadId = Number(req.params.id);
  const userId = req.user?.id;
  const { content } = req.body;

  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  if (!content)
    return res.status(400).json({ message: "Content tidak boleh kosong" });

  try {
    const image = req.file ? req.file.path : null;

    // ✅ Masukkan ke queue, tidak langsung insert ke DB
    await replyQueue.add("create-reply", {
      content,
      image,
      threadId,
      userId,
    });

    console.log("📥 REPLY JOB MASUK QUEUE");

    return res.status(200).json({
      code: 200,
      status: "success",
      message: "Reply masuk antrian, sedang diproses",
    });
  } catch (error: any) {
    return res.status(500).json({
      code: 500,
      status: "error",
      message: error.message,
    });
  }
};
