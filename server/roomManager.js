// In-memory room storage
const rooms = new Map();

function createRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      elements: [],
      users: new Map(),
    });
  }
  return rooms.get(roomId);
}

function getRoom(roomId) {
  return rooms.get(roomId) || null;
}

function joinRoom(roomId, socketId, username) {
  let room = rooms.get(roomId);
  if (!room) {
    room = createRoom(roomId);
  }
  room.users.set(socketId, { username, socketId });
  return room;
}

function leaveRoom(roomId, socketId) {
  const room = rooms.get(roomId);
  if (!room) return null;
  room.users.delete(socketId);
  // Clean up empty rooms after a delay
  if (room.users.size === 0) {
    setTimeout(() => {
      const r = rooms.get(roomId);
      if (r && r.users.size === 0) {
        rooms.delete(roomId);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }
  return room;
}

function addOrUpdateElement(roomId, element) {
  const room = rooms.get(roomId);
  if (!room) return;
  const idx = room.elements.findIndex((e) => e.id === element.id);
  if (idx >= 0) {
    room.elements[idx] = element;
  } else {
    room.elements.push(element);
  }
}

function deleteElement(roomId, elementId) {
  const room = rooms.get(roomId);
  if (!room) return;
  room.elements = room.elements.filter((e) => e.id !== elementId);
}

function clearRoom(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  room.elements = [];
}

function getUsers(roomId) {
  const room = rooms.get(roomId);
  if (!room) return [];
  return Array.from(room.users.values());
}

module.exports = {
  createRoom,
  getRoom,
  joinRoom,
  leaveRoom,
  addOrUpdateElement,
  deleteElement,
  clearRoom,
  getUsers,
};
