"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Canvas from "@/components/Canvas";
import Toolbar from "@/components/Toolbar";
import TopBar from "@/components/TopBar";
import StylePanel from "@/components/StylePanel";
import CursorOverlay from "@/components/CursorOverlay";
import ExitModal from "@/components/ExitModal";
import { useHistory } from "@/hooks/useHistory";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/hooks/useAuth";
import { TOOLS, DEFAULT_STYLE } from "@/lib/constants";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId;

  const [tool, setTool] = useState(TOOLS.PENCIL);
  const [style, setStyle] = useState({ ...DEFAULT_STYLE });
  const [selectedElement, setSelectedElement] = useState(null);
  const [joined, setJoined] = useState(false);
  const [username, setUsername] = useState("");
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);

  const {
    elements,
    setElements,
    undo,
    redo,
    canUndo,
    canRedo,
    replaceElements,
  } = useHistory();

  const {
    isConnected,
    users,
    cursors,
    emit,
    on,
    off,
    joinRoom,
    emitCursorMove,
  } = useSocket();

  const { user, token } = useAuth();

  // Handle Auth and Local Storage Cache Restoration
  useEffect(() => {
    // If the user was redirected here after logging in with a cached layout:
    const cachedData = localStorage.getItem(`collabdraw_cache_${roomId}`);
    if (user && cachedData) {
        try {
            const parsed = JSON.parse(cachedData);
            replaceElements(parsed);
            
            // Instantly trigger a save, then clear cache
            fetch(`${SERVER_URL}/api/rooms/save`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ roomId, elements: parsed, name: `Board ${roomId}` })
            });

            localStorage.removeItem(`collabdraw_cache_${roomId}`);
            alert("Your saved work has been recovered and secured!");
        } catch (e) {
            console.error("Failed to restore cache", e);
        }
    }
  }, [user, token, roomId, replaceElements]);

  // Get username for Socket
  useEffect(() => {
    if (user) {
        setUsername(user.name);
    } else {
        const stored = sessionStorage.getItem("collabdraw-username");
        if (stored) {
        setUsername(stored);
        } else {
        const name = prompt("Enter your display name for the canvas:") || "Anonymous";
        sessionStorage.setItem("collabdraw-username", name);
        setUsername(name);
        }
    }
  }, [user]);

  // Join WebSocket Room
  useEffect(() => {
    if (isConnected && username && roomId && !joined) {
      joinRoom(roomId, username).then((data) => {
        if (data.elements && data.elements.length > 0 && elements.length === 0) {
          replaceElements(data.elements);
        }
        setJoined(true);
      }).catch(err => {
        alert("Action Denied: " + err.message);
        router.push("/");
      });
    }
  }, [isConnected, username, roomId, joined, joinRoom, replaceElements, elements.length, router]);

  // Listen for remote events
  useEffect(() => {
    if (!joined) return;

    on("element-drawn", ({ element }) => {
      setElements((prev) => {
        if (prev.find((e) => e.id === element.id)) return prev;
        return [...prev, element];
      }, false);
    });

    on("element-updated", ({ element }) => {
      setElements((prev) => prev.map((e) => (e.id === element.id ? element : e)), false);
    });

    on("element-deleted", ({ elementId }) => {
      setElements((prev) => prev.filter((e) => e.id !== elementId), false);
    });

    on("elements-synced", ({ elements: newElements }) => replaceElements(newElements));
    on("canvas-cleared", () => replaceElements([]));

    return () => {
      off("element-drawn"); off("element-updated"); off("element-deleted");
      off("elements-synced"); off("canvas-cleared");
    };
  }, [joined, on, off, setElements, replaceElements]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        const newElements = e.shiftKey ? redo() : undo();
        if (newElements) emit("sync-elements", { elements: newElements });
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        const newElements = redo();
        if (newElements) emit("sync-elements", { elements: newElements });
      }

      if ((e.key === "Delete" || e.key === "Backspace") && selectedElement) {
        setElements((prev) => prev.filter((el) => el.id !== selectedElement.id), true);
        emit("delete-element", { elementId: selectedElement.id });
        setSelectedElement(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, emit, selectedElement, setElements]);

  // Event Handlers
  const handleDrawElement = useCallback((element) => emit("draw-element", { element }), [emit]);
  const handleUpdateElement = useCallback((element) => emit("update-element", { element }), [emit]);
  const handleDeleteElement = useCallback((elementId) => emit("delete-element", { elementId }), [emit]);
  const handleCursorMove = useCallback((x, y) => emitCursorMove(x, y, username), [emitCursorMove, username]);
  const handleStyleChange = useCallback((updates) => setStyle((prev) => ({ ...prev, ...updates })), []);
  
  const handleUndo = useCallback(() => {
    const newElements = undo();
    if (newElements) emit("sync-elements", { elements: newElements });
  }, [undo, emit]);

  const handleRedo = useCallback(() => {
    const newElements = redo();
    if (newElements) emit("sync-elements", { elements: newElements });
  }, [redo, emit]);

  const handleClear = useCallback(() => {
    if (window.confirm("Clear the entire canvas?")) {
      setElements([], true);
      emit("clear-canvas");
    }
  }, [setElements, emit]);

  const handleExport = useCallback(() => {
    const canvas = document.getElementById("drawing-canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `collabdraw-${roomId}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [roomId]);

  // -- EXIT & SAVE FLOW --
  const handleExitClick = () => setIsExitModalOpen(true);

  const performSave = async () => {
    if (!user) {
        // Cache to local storage, push to login
        localStorage.setItem(`collabdraw_cache_${roomId}`, JSON.stringify(elements));
        router.push(`/login?redirect=/room/${roomId}`);
        return;
    }

    try {
        const res = await fetch(`${SERVER_URL}/api/rooms/save`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ roomId, elements, name: `Board ${roomId}` })
        });
        
        if (!res.ok) {
            const errData = await res.json();
            alert(`Error: ${errData.error}`);
            return;
        }

        router.push("/");
    } catch (err) {
        console.error(err);
        alert("Network error. Try again.");
    }
  };

  const performLeaveWithoutSaving = () => {
      router.push("/");
  };


  if (!joined) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <div className="loading-text">
          {isConnected ? "Joining room..." : "Connecting to server..."}
        </div>
      </div>
    );
  }

  return (
    <div className="room-page">
      <Canvas
        elements={elements}
        setElements={setElements}
        tool={tool}
        setTool={setTool}
        style={style}
        selectedElement={selectedElement}
        setSelectedElement={setSelectedElement}
        onDrawElement={handleDrawElement}
        onUpdateElement={handleUpdateElement}
        onDeleteElement={handleDeleteElement}
        onCursorMove={handleCursorMove}
      />

      <Toolbar activeTool={tool} onToolChange={setTool} />

      <TopBar
        roomId={roomId}
        users={users}
        isConnected={isConnected}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        onExport={handleExport}
        onExit={handleExitClick}
      />

      <StylePanel style={style} onStyleChange={handleStyleChange} />

      <CursorOverlay
        cursors={cursors}
        panOffset={panOffset}
        scale={scale}
      />

      <ExitModal 
        isOpen={isExitModalOpen} 
        onClose={() => setIsExitModalOpen(false)}
        onSave={performSave}
        onLeaveWithoutSaving={performLeaveWithoutSaving}
      />
    </div>
  );
}
