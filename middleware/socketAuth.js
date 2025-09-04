import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/index.js";

export const socketAuth = (socket, next) => {
    try {
        const token =
            socket.handshake.auth.token ||
            socket.handshake.query.token ||
            (socket.handshake.headers.authorization &&
                socket.handshake.headers.authorization.startsWith("Bearer ") &&
                socket.handshake.headers.authorization.slice(7));

        if (!token) {
            console.log("No token provided in handshake");
            return next(new Error("Authentication error: No token provided"));
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        socket.data.user = decoded;
        console.log("Socket authenticated for user:", decoded.id);
        next();
    } catch (err) {
        console.log("Socket authentication failed:", err.message);
        next(new Error("Authentication error: Invalid token"));
    }
};