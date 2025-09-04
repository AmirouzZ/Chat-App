import { users, getUser } from "../models/User.js";
import { JWT_SECRET } from "../config/index.js";
import jwt from "jsonwebtoken";

export const renderChatPage = (req, res) => {
    const token = req.query.token || "";
    let user = null;

    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            user = users.find((u) => u.id === decoded.id);
        } catch (error) {
            console.log("Invalid token provided");
        }
    }

    res.render("index", {
        users: users,
        user: user,
    });
};

export const healthCheck = (_req, res) => {
    res.json({ status: "OK", message: "Socket server is running" });
};