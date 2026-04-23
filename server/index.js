require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const crypto = require("crypto");
const roomManager = require("./roomManager");
const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const roomRoutes = require("./routes/rooms");

function generateRoomId() {
  return crypto.randomBytes(4).toString("hex");
}

const app = express();
app.use(cors());
app.use(express.json()); // Enable JSON body parsing for REST routes

// Connect to MongoDB
connectDB();

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
  },
});

// Health check
app.get("/", (req, res) => {
  res.json({ status: "CollabDraw server running" });
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);
  let currentRoom = null;

  // Create a new room
  socket.on("create-room", ({ username }) => {
    const roomId = generateRoomId();
    roomManager.createRoom(roomId);
    const room = roomManager.joinRoom(roomId, socket.id, username);
    socket.join(roomId);
    currentRoom = roomId;

    socket.emit("room-created", { roomId });
    io.to(roomId).emit("users-updated", roomManager.getUsers(roomId));
    console.log(`Room ${roomId} created by ${username}`);
  });

  // Join an existing room
  socket.on("join-room", async ({ roomId, username }) => {
    let room = roomManager.getRoom(roomId);
    
    if (!room) {
      try {
        const mongoose = require('mongoose');
        // If mongoose isn't connected or connecting, instantly reject rather than hanging
        if (mongoose.connection.readyState !== 1) {
             return socket.emit("room-error", "Room does not exist (not in memory, and DB is disabled).");
        }

        const Room = require('./models/Room');
        const dbRoom = await Room.findOne({ roomId });
        if (!dbRoom) {
          return socket.emit("room-error", "Room does not exist.");
        }
        // Room exists in DB, load it to memory
        roomManager.createRoom(roomId);
        roomManager.joinRoom(roomId, socket.id, username);
        roomManager.getRoom(roomId).elements = dbRoom.elements || [];
      } catch(err) {
        return socket.emit("room-error", "Database validation failed.");
      }
    } else {
      roomManager.joinRoom(roomId, socket.id, username);
    }

    socket.join(roomId);
    currentRoom = roomId;

    const currentElements = roomManager.getRoom(roomId).elements;
    const users = roomManager.getUsers(roomId);

    socket.emit("room-joined", {
      roomId,
      elements: currentElements,
      users,
    });

    socket.to(roomId).emit("user-joined", { socketId: socket.id, username });
    io.to(roomId).emit("users-updated", users);
    console.log(`${username} joined room ${roomId}`);
  });

  // Drawing events
  socket.on("draw-element", ({ element }) => {
    if (!currentRoom) return;
    roomManager.addOrUpdateElement(currentRoom, element);
    socket.to(currentRoom).emit("element-drawn", { element });
  });

  socket.on("update-element", ({ element }) => {
    if (!currentRoom) return;
    roomManager.addOrUpdateElement(currentRoom, element);
    socket.to(currentRoom).emit("element-updated", { element });
  });

  socket.on("delete-element", ({ elementId }) => {
    if (!currentRoom) return;
    roomManager.deleteElement(currentRoom, elementId);
    socket.to(currentRoom).emit("element-deleted", { elementId });
  });

  // Batch elements update (for undo/redo)
  socket.on("sync-elements", ({ elements }) => {
    if (!currentRoom) return;
    const room = roomManager.getRoom(currentRoom);
    if (room) {
      room.elements = elements;
    }
    socket.to(currentRoom).emit("elements-synced", { elements });
  });

  // Cursor movement
  socket.on("cursor-move", ({ x, y, username }) => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit("cursor-moved", {
      socketId: socket.id,
      x,
      y,
      username,
    });
  });

  // Clear canvas
  socket.on("clear-canvas", () => {
    if (!currentRoom) return;
    roomManager.clearRoom(currentRoom);
    socket.to(currentRoom).emit("canvas-cleared");
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    if (currentRoom) {
      roomManager.leaveRoom(currentRoom, socket.id);
      const users = roomManager.getUsers(currentRoom);
      io.to(currentRoom).emit("users-updated", users);
      io.to(currentRoom).emit("cursor-removed", { socketId: socket.id });
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`CollabDraw server running on port ${PORT}`);
});
