"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import { io } from "socket.io-client";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001";

export function useSocket() {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState([]);
  const [cursors, setCursors] = useState({});
  const listenersRef = useRef({});

  useEffect(() => {
    const socket = io(SERVER_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      console.log("Connected to server");
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      console.log("Disconnected from server");
    });

    socket.on("users-updated", (updatedUsers) => {
      setUsers(updatedUsers);
    });

    socket.on("cursor-moved", ({ socketId, x, y, username }) => {
      setCursors((prev) => ({
        ...prev,
        [socketId]: { x, y, username },
      }));
    });

    socket.on("cursor-removed", ({ socketId }) => {
      setCursors((prev) => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const emit = useCallback((event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      // Remove previous listener if exists
      if (listenersRef.current[event]) {
        socketRef.current.off(event, listenersRef.current[event]);
      }
      listenersRef.current[event] = callback;
      socketRef.current.on(event, callback);
    }
  }, []);

  const off = useCallback((event) => {
    if (socketRef.current && listenersRef.current[event]) {
      socketRef.current.off(event, listenersRef.current[event]);
      delete listenersRef.current[event];
    }
  }, []);

  const createRoom = useCallback(
    (username) => {
      return new Promise((resolve) => {
        emit("create-room", { username });
        socketRef.current?.once("room-created", ({ roomId }) => {
          resolve(roomId);
        });
      });
    },
    [emit]
  );

  const joinRoom = useCallback(
    (roomId, username) => {
      return new Promise((resolve) => {
        emit("join-room", { roomId, username });
        socketRef.current?.once("room-joined", (data) => {
          resolve(data);
        });
      });
    },
    [emit]
  );

  const emitCursorMove = useCallback(
    (x, y, username) => {
      emit("cursor-move", { x, y, username });
    },
    [emit]
  );

  return {
    socket: socketRef.current,
    isConnected,
    users,
    cursors,
    emit,
    on,
    off,
    createRoom,
    joinRoom,
    emitCursorMove,
  };
}
