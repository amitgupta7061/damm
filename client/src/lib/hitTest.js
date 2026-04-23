// Hit-testing for element selection

function distanceToPoint(x, y, px, py) {
  return Math.hypot(x - px, y - py);
}

function distanceToLine(px, py, x1, y1, x2, y2) {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let t = lenSq !== 0 ? dot / lenSq : -1;
  t = Math.max(0, Math.min(1, t));
  const xx = x1 + t * C;
  const yy = y1 + t * D;
  return Math.hypot(px - xx, py - yy);
}

function isInsideRect(px, py, x1, y1, x2, y2) {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  return px >= minX && px <= maxX && py >= minY && py <= maxY;
}

function isInsideEllipse(px, py, x1, y1, x2, y2) {
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  const rx = Math.abs(x2 - x1) / 2;
  const ry = Math.abs(y2 - y1) / 2;
  if (rx === 0 || ry === 0) return false;
  return ((px - cx) ** 2) / (rx ** 2) + ((py - cy) ** 2) / (ry ** 2) <= 1;
}

function isInsideDiamond(px, py, x1, y1, x2, y2) {
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  const hw = Math.abs(x2 - x1) / 2;
  const hh = Math.abs(y2 - y1) / 2;
  if (hw === 0 || hh === 0) return false;
  return Math.abs(px - cx) / hw + Math.abs(py - cy) / hh <= 1;
}

function isNearLine(px, py, x1, y1, x2, y2, threshold = 10) {
  return distanceToLine(px, py, x1, y1, x2, y2) < threshold;
}

function isNearPencilPath(px, py, points, threshold = 10) {
  if (!points || points.length < 2) return false;
  for (let i = 0; i < points.length - 1; i++) {
    if (
      distanceToLine(
        px,
        py,
        points[i].x,
        points[i].y,
        points[i + 1].x,
        points[i + 1].y
      ) < threshold
    ) {
      return true;
    }
  }
  return false;
}

function isOnRectBorder(px, py, x1, y1, x2, y2, threshold = 10) {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);

  return (
    isNearLine(px, py, minX, minY, maxX, minY, threshold) ||
    isNearLine(px, py, maxX, minY, maxX, maxY, threshold) ||
    isNearLine(px, py, maxX, maxY, minX, maxY, threshold) ||
    isNearLine(px, py, minX, maxY, minX, minY, threshold)
  );
}

export function hitTest(element, px, py) {
  const { type, x1, y1, x2, y2 } = element;
  const threshold = Math.max(10, (element.strokeWidth || 2) * 2);

  switch (type) {
    case "rectangle":
      if (element.fillColor && element.fillColor !== "transparent") {
        return isInsideRect(px, py, x1, y1, x2, y2);
      }
      return isOnRectBorder(px, py, x1, y1, x2, y2, threshold);

    case "ellipse":
      if (element.fillColor && element.fillColor !== "transparent") {
        return isInsideEllipse(px, py, x1, y1, x2, y2);
      }
      // Check near border
      return (
        isInsideEllipse(px, py, x1 - threshold, y1 - threshold, x2 + threshold, y2 + threshold) &&
        !isInsideEllipse(px, py, x1 + threshold, y1 + threshold, x2 - threshold, y2 - threshold)
      );

    case "diamond":
      if (element.fillColor && element.fillColor !== "transparent") {
        return isInsideDiamond(px, py, x1, y1, x2, y2);
      }
      return (
        isInsideDiamond(px, py, x1 - threshold, y1 - threshold, x2 + threshold, y2 + threshold) &&
        !isInsideDiamond(px, py, x1 + threshold, y1 + threshold, x2 - threshold, y2 - threshold)
      );

    case "line":
    case "arrow":
      return isNearLine(px, py, x1, y1, x2, y2, threshold);

    case "pencil":
      return isNearPencilPath(px, py, element.points, threshold);

    case "text":
      if (element.text) {
        const textWidth = element.text.length * (element.fontSize || 20) * 0.6;
        const textHeight = (element.fontSize || 20) * 1.3;
        return isInsideRect(px, py, x1, y1, x1 + textWidth, y1 + textHeight);
      }
      return false;

    default:
      return false;
  }
}

export function getElementAtPosition(elements, x, y) {
  // Reverse iterate to get top-most element first
  for (let i = elements.length - 1; i >= 0; i--) {
    if (hitTest(elements[i], x, y)) {
      return elements[i];
    }
  }
  return null;
}
