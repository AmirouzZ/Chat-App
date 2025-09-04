import http from "http";
import express from "express";
import cors from "cors";
import path from "path";
import { PORT } from "./config/index.js";
import { configureSocket } from "./config/socket.js";
import routes from "./routes/index.js";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();



// Middleware
app.use(
    cors({
        origin: true,
        credentials: true,
    })
);
app.use(express.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use(routes);

// Create server
const server = http.createServer(app);

// Configure Socket.io
configureSocket(server);

// Start server
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`Health check available at http://localhost:${PORT}/health`);
});