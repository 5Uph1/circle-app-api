import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
});

export const threadQueue = new Queue("thread-queue", { connection });
export const replyQueue = new Queue("reply-queue", { connection });
export const likeQueue = new Queue("like-queue", { connection });
