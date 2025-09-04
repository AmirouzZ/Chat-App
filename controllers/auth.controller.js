import { generateAuthToken } from "../models/User.js";

export const getToken = async (req, res) => {
    try {
        if (!req.query.userId) {
            return res.status(400).json({ error: "userId parameter is required" });
        }
        const token = generateAuthToken(req.query.userId);
        return res.status(200).json({ token });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};