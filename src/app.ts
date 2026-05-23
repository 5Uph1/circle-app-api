import express from "express";
import "dotenv/config";
import http from "http";
import cors from "cors";
import { user } from "./routes/user";
import { thread } from "./routes/thread";
import { reply } from "./routes/reply";
import { initSocket } from "./socket";
import { follow } from "./routes/follow";
import "./worker/worker";

const app = express();
const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

initSocket(server);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
  }),
);
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use("/user", user);
app.use("/thread", thread);
app.use("/reply", reply);
app.use("/follow", follow);

server.listen(PORT, () => {
  console.log("server is running on port", PORT);
});
