"use client";
import { useRef, useEffect, useCallback, useState } from "react";
import { drawElement, drawSelectionBox } from "@/lib/drawElement";
import {
  createElement,
  updateElement,
  addPointToElement,
} from "@/lib/createElement";
import { getElementAtPosition } from "@/lib/hitTest";
import { TOOLS } from "@/lib/constants";

export default function Canvas({
  elements,
  setElements,
  tool,
  setTool,
  style,
  selectedElement,
  setSelectedElement,
  onDrawElement,
  onUpdateElement,
  onDeleteElement,
  onCursorMove,
}) {
  const canvasRef = useRef(null);
  const [action, setAction] = useState("none"); // none, drawing, moving, panning
  const [currentElement, setCurrentElement] = useState(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [startPanPos, setStartPanPos] = useState(null);
  const [scale, setScale] = useState(1);
  const [moveOffset, setMoveOffset] = useState({ x: 0, y: 0 });
  const textInputRef = useRef(null);
  const [textInput, setTextInput] = useState(null);

  // Get mouse position adjusted for pan and zoom
  const getMousePos = useCallback(
    (e) => {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left - panOffset.x) / scale,
        y: (e.clientY - rect.top - panOffset.y) / scale,
      };
    },
    [panOffset, scale]
  );

  // Draw all elements
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply transforms
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(scale, scale);

    // Draw dot grid
    const gridSize = 20;
    const startX = Math.floor(-panOffset.x / scale / gridSize) * gridSize;
    const startY = Math.floor(-panOffset.y / scale / gridSize) * gridSize;
    const endX = startX + canvas.width / scale + gridSize * 2;
    const endY = startY + canvas.height / scale + gridSize * 2;

    ctx.fillStyle = "rgba(255,255,255,0.06)";
    for (let x = startX; x < endX; x += gridSize) {
      for (let y = startY; y < endY; y += gridSize) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw elements
    elements.forEach((el) => {
      drawElement(ctx, el);
    });

    // Draw current element being drawn
    if (currentElement) {
      drawElement(ctx, currentElement);
    }

    // Draw selection box
    if (selectedElement) {
      const el =
        elements.find((e) => e.id === selectedElement.id) || selectedElement;
      drawSelectionBox(ctx, el);
    }

    ctx.restore();
  }, [elements, currentElement, selectedElement, panOffset, scale]);

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      render();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [render]);

  // Render loop
  useEffect(() => {
    const frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [render]);

  // Mouse handlers
  const handleMouseDown = useCallback(
    (e) => {
      if (e.button === 1 || (e.button === 0 && tool === TOOLS.HAND)) {
        // Middle click or hand tool — pan
        setAction("panning");
        setStartPanPos({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
        return;
      }

      const pos = getMousePos(e);

      if (tool === TOOLS.SELECT) {
        const el = getElementAtPosition(elements, pos.x, pos.y);
        if (el) {
          setSelectedElement(el);
          setAction("moving");
          setMoveOffset({ x: pos.x - el.x1, y: pos.y - el.y1 });
        } else {
          setSelectedElement(null);
        }
        return;
      }

      if (tool === TOOLS.ERASER) {
        const el = getElementAtPosition(elements, pos.x, pos.y);
        if (el) {
          setElements((prev) => prev.filter((e) => e.id !== el.id), true);
          onDeleteElement?.(el.id);
        }
        return;
      }

      if (tool === TOOLS.TEXT) {
            e.preventDefault();
            if (textInput) {
              handleTextSubmit(textInputRef.current?.value || "");
            }
            setTextInput({ x: pos.x, y: pos.y });
            setTimeout(() => {
               textInputRef.current?.focus();
            }, 10);
      }

      // Start drawing
      const newElement = createElement(tool, pos.x, pos.y, pos.x, pos.y, style);
      setCurrentElement(newElement);
      setAction("drawing");
    },
    [
      tool,
      elements,
      style,
      panOffset,
      getMousePos,
      setElements,
      setSelectedElement,
      onDeleteElement,
    ]
  );

  const handleMouseMove = useCallback(
    (e) => {
      const pos = getMousePos(e);

      // Send cursor position
      onCursorMove?.(pos.x, pos.y);

      if (action === "panning") {
        setPanOffset({
          x: e.clientX - startPanPos.x,
          y: e.clientY - startPanPos.y,
        });
        return;
      }

      if (action === "moving" && selectedElement) {
        const dx = pos.x - moveOffset.x - selectedElement.x1;
        const dy = pos.y - moveOffset.y - selectedElement.y1;

        let moved;
        if (selectedElement.type === "pencil" && selectedElement.points) {
          moved = {
            ...selectedElement,
            x1: selectedElement.x1 + dx,
            y1: selectedElement.y1 + dy,
            x2: selectedElement.x2 + dx,
            y2: selectedElement.y2 + dy,
            points: selectedElement.points.map((p) => ({
              x: p.x + dx,
              y: p.y + dy,
            })),
          };
        } else {
          moved = {
            ...selectedElement,
            x1: selectedElement.x1 + dx,
            y1: selectedElement.y1 + dy,
            x2: selectedElement.x2 + dx,
            y2: selectedElement.y2 + dy,
          };
        }

        setSelectedElement(moved);
        setElements(
          (prev) => prev.map((el) => (el.id === moved.id ? moved : el)),
          false
        );
        return;
      }

      if (action === "drawing" && currentElement) {
        let updated;
        if (currentElement.type === "pencil") {
          updated = addPointToElement(currentElement, pos.x, pos.y);
        } else {
          updated = updateElement(currentElement, { x2: pos.x, y2: pos.y });
        }
        setCurrentElement(updated);
      }
    },
    [
      action,
      currentElement,
      selectedElement,
      moveOffset,
      startPanPos,
      getMousePos,
      setElements,
      onCursorMove,
      setSelectedElement,
    ]
  );

  const handleMouseUp = useCallback(() => {
    if (action === "drawing" && currentElement) {
      // Finalize: add element to elements list
      const finalElement = { ...currentElement };
      setElements((prev) => [...prev, finalElement], true);
      onDrawElement?.(finalElement);
      setCurrentElement(null);
    }

    if (action === "moving" && selectedElement) {
      // Commit position
      setElements(
        (prev) =>
          prev.map((el) => (el.id === selectedElement.id ? selectedElement : el)),
        true
      );
      onUpdateElement?.(selectedElement);
    }

    setAction("none");
    setStartPanPos(null);
  }, [
    action,
    currentElement,
    selectedElement,
    setElements,
    onDrawElement,
    onUpdateElement,
  ]);

  // Zoom with scroll wheel
  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.min(5, Math.max(0.1, scale * delta));

      // Zoom toward cursor position
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newPanX = mouseX - ((mouseX - panOffset.x) / scale) * newScale;
      const newPanY = mouseY - ((mouseY - panOffset.y) / scale) * newScale;

      setScale(newScale);
      setPanOffset({ x: newPanX, y: newPanY });
    },
    [scale, panOffset]
  );

  // Text input handler
  const handleTextSubmit = useCallback(
    (text) => {
      if (!textInput || !text.trim()) {
        setTextInput(null);
        return;
      }
      const el = createElement(
        "text",
        textInput.x,
        textInput.y,
        textInput.x + text.length * 12,
        textInput.y + 24,
        { ...style, text }
      );
      el.text = text;
      setElements((prev) => [...prev, el], true);
      onDrawElement?.(el);
      setTextInput(null);
    },
    [textInput, style, setElements, onDrawElement]
  );

  // Cursor style
  const getCursor = () => {
    if (tool === TOOLS.HAND || action === "panning") return "grab";
    if (tool === TOOLS.SELECT) return action === "moving" ? "move" : "default";
    if (tool === TOOLS.ERASER) return "crosshair";
    if (tool === TOOLS.TEXT) return "text";
    return "crosshair";
  };

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        id="drawing-canvas"
        style={{ cursor: getCursor() }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
      />
      {textInput && (
        <textarea
          key={`${textInput.x}-${textInput.y}`}
          ref={textInputRef}
          className="text-input-overlay"
          style={{
            left: textInput.x * scale + panOffset.x,
            top: textInput.y * scale + panOffset.y,
            fontSize: `${(style.fontSize || 20) * scale}px`,
            color: style.strokeColor,
          }}
          autoFocus
          onBlur={(e) => {
            const v = e.target.value;
            setTimeout(() => handleTextSubmit(v), 100);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setTextInput(null);
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleTextSubmit(e.target.value);
            }
          }}
        />
      )}
      <div className="zoom-indicator">{Math.round(scale * 100)}%</div>
    </div>
  );
}
