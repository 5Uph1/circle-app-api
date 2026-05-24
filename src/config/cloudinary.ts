import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("Cloudinary config:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? "ada" : "KOSONG",
  api_secret: process.env.CLOUDINARY_API_SECRET ? "ada" : "KOSONG",
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "circle-app",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  } as any,
});

export const upload = multer({ storage });
