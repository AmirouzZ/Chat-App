import { Server } from "socket.io";
import { socketAuth } from "../middleware/socketAuth.js";
import { handleConnection } from "../services/messageService.js";

export const configureSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: true,
            methods: ["GET", "POST"],
            allowedHeaders: ["Authorization"],
            credentials: true,
        },
        allowEIO3: true,
        connectTimeout: 10000,
        pingTimeout: 5000,
        pingInterval: 10000,
    });

    // Apply authentication middleware
    io.use(socketAuth);

    // Handle connections
    io.on("connection", (socket) => {
        handleConnection(io, socket);
    });

    return io;
};