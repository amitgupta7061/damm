import { DEFAULT_STYLE } from "./constants";

let idCounter = 0;

export function generateId() {
  return `el_${Date.now()}_${idCounter++}`;
}

export function createElement(type, x1, y1, x2, y2, style = {}) {
  const mergedStyle = { ...DEFAULT_STYLE, ...style };

  const base = {
    id: generateId(),
    type,
    x1,
    y1,
    x2: x2 ?? x1,
    y2: y2 ?? y1,
    strokeColor: mergedStyle.strokeColor,
    fillColor: mergedStyle.fillColor,
    strokeWidth: mergedStyle.strokeWidth,
    roughness: mergedStyle.roughness,
  };

  if (type === "pencil") {
    base.points = [{ x: x1, y: y1 }];
  }

  if (type === "text") {
    base.text = "";
    base.fontSize = mergedStyle.fontSize;
    base.fontFamily = mergedStyle.fontFamily;
  }

  return base;
}

export function updateElement(element, updates) {
  return { ...element, ...updates };
}

export function addPointToElement(element, x, y) {
  if (element.type !== "pencil") return element;
  return {
    ...element,
    points: [...element.points, { x, y }],
    x2: Math.max(element.x2, x),
    y2: Math.max(element.y2, y),
  };
}
