import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import IORedis from "ioredis";

const sub = new IORedis({
  maxRetriesPerRequest: null,
});

let io: Server;

export const getIO = () => io;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: { origin: "*" },
  });

  // Subscribe thread-created
  sub.subscribe("thread-created", (err) => {
    if (err) console.error("❌ Gagal subscribe thread-created:", err);
    else console.log("✅ Subscribed ke channel thread-created");
  });

  // Subscribe reply-created
  sub.subscribe("reply-created", (err) => {
    if (err) console.error("❌ Gagal subscribe reply-created:", err);
    else console.log("✅ Subscribed ke channel reply-created");
  });

  sub.subscribe("like-updated", (err) => {
    if (err) console.error("❌ Gagal subscribe like-updated:", err);
    else console.log("✅ Subscribed ke channel like-updated");
  });

  sub.on("message", (channel, message) => {
    const data = JSON.parse(message);

    if (channel === "thread-created") {
      console.log("📡 Forward thread ke Socket.IO:", data);
      io.emit("new-thread", data);
    }

    if (channel === "like-updated") {
      console.log("📡 Forward like ke Socket.IO:", data);
      io.emit("like-updated", data);
    }

    if (channel === "reply-created") {
      console.log("📡 Forward reply ke Socket.IO:", data);
      // Emit ke room thread yang spesifik
      io.to(`thread:${data.thread_id}`).emit("new-reply", data);
    }
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Client join room thread tertentu saat buka halaman replies
    socket.on("join-thread", (threadId: number) => {
      socket.join(`thread:${threadId}`);
      console.log(`Client ${socket.id} join room thread:${threadId}`);
    });

    // Client leave room saat keluar halaman replies
    socket.on("leave-thread", (threadId: number) => {
      socket.leave(`thread:${threadId}`);
      console.log(`Client ${socket.id} leave room thread:${threadId}`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};
