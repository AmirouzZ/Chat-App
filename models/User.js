import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/index.js";

export const users = [
    {
        id: 1,
        name: "ahmad",
    },
    {
        id: 2,
        name: "mhammad",
    },
];

export const getUser = (userId) => {
    let user = users.find((user) => user.id === parseInt(userId));
    if (!user) {
        throw new Error("User not found");
    }
    return user;
};

export const generateAuthToken = (userId) => {
    const user = getUser(userId);
    return jwt.sign(
        { id: user.id },
        JWT_SECRET,
        {
            expiresIn: "20d",
        }
    );
};