import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET as string;

export interface UserPayload {
    id: number, 
}

export function signToken(payload: any) {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET tidak ditemukan!");
    }

    return jwt.sign(payload, secret, { expiresIn: "1d" });
}

export function verifyToken(token: string) {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET tidak ditemukan!");
    }

    return jwt.verify(token, secret);
}
