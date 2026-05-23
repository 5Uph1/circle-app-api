import { Worker } from "bullmq";
import IORedis from "ioredis";
import { prisma } from "../connections/client";
import { formatThread } from "../controllers/thread";
import { formatReply } from "../controllers/reply";

const connection = new IORedis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
  {
    maxRetriesPerRequest: null,
  },
);

const pub = new IORedis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
  maxRetriesPerRequest: null,
});

// ─── Worker Thread ────────────────────────────────────────────────────────────
export const threadWorker = new Worker(
  "thread-queue",
  async (job) => {
    console.log("🔥 THREAD JOB DIPROSES:", job.data);

    const { content, image, userId } = job.data;

    const newThread = await prisma.thread.create({
      data: {
        content,
        image,
        created_by: userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            full_name: true,
            photo_profile: true,
          },
        },
        likes: true,
        replies: true,
      },
    });

    const formatted = formatThread(newThread, userId);

    console.log("✅ Thread berhasil dibuat");

    await pub.publish("thread-created", JSON.stringify(formatted));

    console.log("📤 THREAD DIKIRIM KE REDIS");

    return formatted;
  },
  { connection },
);

// ─── Worker Like Thread ────────────────────────────────────────────────────────────
export const likeWorker = new Worker(
  "like-queue",
  async (job) => {
    const { threadId, userId } = job.data;

    console.log("🔥 LIKE JOB:", job.data);

    const existingLike = await prisma.like.findFirst({
      where: { user_id: userId, thread_id: threadId },
    });

    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id },
      });
    } else {
      await prisma.like.create({
        data: {
          user_id: userId,
          thread_id: threadId,
        },
      });
    }

    // hitung ulang total like
    const likesCount = await prisma.like.count({
      where: { thread_id: threadId },
    });

    // kirim ke redis (buat socket)
    await pub.publish(
      "like-updated",
      JSON.stringify({
        thread_id: threadId,
        likes: likesCount,
      }),
    );

    console.log("📤 LIKE DIKIRIM KE REDIS");

    return true;
  },
  { connection },
);

// ─── Worker Reply ─────────────────────────────────────────────────────────────
export const replyWorker = new Worker(
  "reply-queue",
  async (job) => {
    console.log("🔥 REPLY JOB DIPROSES:", job.data);

    const { content, image, threadId, userId } = job.data;

    const newReply = await prisma.reply.create({
      data: {
        content,
        image,
        thread_id: threadId,
        user_id: userId,
        created_by: userId,
      },
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
    });

    const formatted = {
      ...formatReply(newReply, userId),
      thread_id: threadId,
    };

    console.log("✅ Reply berhasil dibuat");

    await pub.publish("reply-created", JSON.stringify(formatted));

    console.log("📤 REPLY DIKIRIM KE REDIS");

    return formatted;
  },
  { connection },
);
