import { Request, Response } from "express";
import { prisma } from "../connections/client";
import { signToken } from "../utils/jwt";
import bcrypt from "bcrypt";
import { AuthRequest } from "../types/express";

const sendResponse = (
  res: Response,
  status: number,
  message: string,
  data?: any,
) => {
  return res.status(status).json({
    status: status < 400 ? "success" : "error",
    message,
    data,
  });
};

export const registerUser = async (req: Request, res: Response) => {
  const { username, fullname, email, password } = req.body;

  // Validasi sederhana (Idealnya pakai Zod Middleware)
  if (!username || !fullname || !email || !password) {
    return sendResponse(res, 400, "Semua field harus diisi");
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        full_name: fullname,
        email,
        password: hashedPassword,
        photo_profile: null,
        bio: null,
      },
    });

    const token = signToken({ id: newUser.id, email: newUser.email });

    return sendResponse(res, 201, "Register berhasil", {
      user_id: newUser.id,
      username: newUser.username,
      fullname: newUser.full_name,
      email: newUser.email,
      token,
    });
  } catch (error: any) {
    console.error("ERROR REGISTER:", error);

    // P2002 adalah kode error Unique Constraint Prisma (Email/Username duplikat)
    if (error.code === "P2002") {
      return sendResponse(res, 409, "Email atau username sudah digunakan");
    }

    return sendResponse(res, 500, "Terjadi kesalahan pada server");
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendResponse(res, 400, "Email dan password wajib diisi");
  }

  try {
    const user = await prisma.user.findFirst({ where: { email } });

    // Security tip: Jangan spesifik bilang "user tidak ditemukan"
    if (!user) {
      return sendResponse(res, 401, "Email atau password salah");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendResponse(res, 401, "Email atau password salah");
    }

    const token = signToken({ id: user.id, email: user.email });

    return sendResponse(res, 200, "Login berhasil", {
      user_id: user.id,
      username: user.username,
      fullname: user.full_name,
      email: user.email,
      token,
    });
  } catch (error) {
    console.error("ERROR LOGIN:", error);
    return sendResponse(res, 500, "Internal server error");
  }
};

export const getMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        full_name: true,
        email: true,
        bio: true,
        photo_profile: true,
        created_at: true,

        _count: {
          select: {
            following: true,
            follower: true,
            threadsCreated: true,
          },
        },
      },
    });

    return res.status(200).json({
      status: "success",
      data: user,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const { full_name, bio } = req.body;

    const photo = req.file ? req.file.path : undefined;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        full_name,
        bio,
        ...(photo && { photo_profile: photo }),
      },
    });

    return res.status(200).json({
      status: "success",
      message: "Profile updated",
      data: updatedUser,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({
        message: "Invalid user id",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },

      select: {
        id: true,
        username: true,
        full_name: true,
        bio: true,
        photo_profile: true,

        _count: {
          select: {
            following: true,
            follower: true,
            threadsCreated: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User tidak ditemukan",
      });
    }

    return res.status(200).json({
      status: "success",
      data: user,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

export const searchUser = async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;

    const users = await prisma.user.findMany({
      where: {
        OR: [
          {
            username: {
              contains: q,
              mode: "insensitive",
            },
          },
          {
            full_name: {
              contains: q,
              mode: "insensitive",
            },
          },
        ],
      },

      select: {
        id: true,
        username: true,
        full_name: true,
        bio: true,
        photo_profile: true,
      },

      take: 10,
    });

    return res.status(200).json({
      status: "success",
      data: users,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

export const suggestedUsers = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    // user yang sudah difollow
    const following = await prisma.following.findMany({
      where: {
        follower_id: userId,
      },
      select: {
        following_id: true,
      },
    });

    const followingIds = following.map((f) => f.following_id);

    const users = await prisma.user.findMany({
      where: {
        id: {
          notIn: [...followingIds, userId!],
        },
      },

      select: {
        id: true,
        username: true,
        full_name: true,
        bio: true,
        photo_profile: true,
      },

      take: 5,
    });

    return res.status(200).json({
      status: "success",
      data: users,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};
