const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const crypto = require("crypto");
const roomManager = require("./roomManager");

function generateRoomId() {
  return crypto.randomBytes(4).toString("hex");
}

const app = express();
app.use(cors());

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
  socket.on("join-room", ({ roomId, username }) => {
    const room = roomManager.getRoom(roomId);
    // Allow joining even if room doesn't exist yet (first user creates it)
    roomManager.joinRoom(roomId, socket.id, username);
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
  console.log(`🚀 CollabDraw server running on port ${PORT}`);
});
