import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/index.js";

export const verifyToken = (req, res, next) => {
    const authToken = req.headers.authorization;
    if (authToken) {
        const token = authToken.startsWith("Bearer ")
            ? authToken.slice(7)
            : authToken;
        try {
            const decodedPayload = jwt.verify(token, JWT_SECRET);
            req.user = decodedPayload;
            next();
        } catch (error) {
            return res.status(401).json({ message: "Invalid Token, Access Denied" });
        }
    } else {
        return res
            .status(401)
            .json({ message: "No token provided, Access Denied" });
    }
};