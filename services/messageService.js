import { users } from "../models/User.js";

// In-memory store for messages
export const messagesByChat = new Map();
let messageIdSeq = 1;

// Utility to normalize incoming data
function asObject(data) {
    if (typeof data === "string") {
        try {
            return JSON.parse(data);
        } catch (_) {
            return {};
        }
    }
    return data && typeof data === "object" ? data : {};
}

export const handleConnection = (io, socket) => {
    const user = socket.data.user;
    console.log("Socket connected:", socket.id, "user:", user.id);

    // Join a room based on user ID for targeted messaging
    socket.join(`user_${user.id}`);

    // Notify the user that they've successfully connected
    socket.emit("connectionSuccess", {
        message: "Successfully connected to chat server",
        userId: user.id,
    });

    // Client -> Server: Send a message
    socket.on("sendMessageEmit", async (data, ack) => {
        try {
            const payload = asObject(data);
            const chat_id = payload.chat_id || 1;
            const text = (payload.text || payload.body || "").toString().trim();
            const temp_id = payload.temp_id || null;

            if (!text) {
                const res = { ok: false, error: "Message text is required" };
                ack?.(res);
                return;
            }

            // Create message object
            const nowIso = new Date().toISOString();
            const message = {
                id: messageIdSeq++,
                text,
                created_at: nowIso,
                updated_at: nowIso,
                sender_id: user.id,
                sender_name: users.find((u) => u.id === user.id)?.name || "Unknown",
                chat_id: chat_id,
                temp_id: temp_id,
            };

            // Save in-memory
            if (!messagesByChat.has(chat_id)) {
                messagesByChat.set(chat_id, []);
            }
            messagesByChat.get(chat_id).push(message);

            // Broadcast to all connected clients
            io.emit("receiveMessageOn", message);

            // Send acknowledgment to sender
            ack?.({ ok: true, message });
        } catch (err) {
            console.error("sendMessageEmit error:", err);
            ack?.({ ok: false, error: "SERVER_ERROR", details: err.message });
        }
    });

    // Handle disconnection
    socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", socket.id, "reason:", reason);
    });

    // Handle connection errors
    socket.on("error", (error) => {
        console.error("Socket error:", error);
    });
};