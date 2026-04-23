// Rough / hand-drawn effect helpers
function getRandomOffset(roughness) {
  return (Math.random() - 0.5) * roughness * 2;
}

function drawRoughLine(ctx, x1, y1, x2, y2, roughness) {
  if (roughness <= 0) {
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    return;
  }

  const len = Math.hypot(x2 - x1, y2 - y1);
  const segments = Math.max(2, Math.floor(len / 20));

  ctx.moveTo(x1 + getRandomOffset(roughness), y1 + getRandomOffset(roughness));

  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const x = x1 + (x2 - x1) * t + getRandomOffset(roughness);
    const y = y1 + (y2 - y1) * t + getRandomOffset(roughness);
    ctx.lineTo(x, y);
  }
}

function drawRoughRect(ctx, x, y, w, h, roughness) {
  drawRoughLine(ctx, x, y, x + w, y, roughness);
  drawRoughLine(ctx, x + w, y, x + w, y + h, roughness);
  drawRoughLine(ctx, x + w, y + h, x, y + h, roughness);
  drawRoughLine(ctx, x, y + h, x, y, roughness);
}

function drawRoughEllipse(ctx, cx, cy, rx, ry, roughness) {
  const steps = 40;
  const angleStep = (Math.PI * 2) / steps;

  const firstX = cx + rx + getRandomOffset(roughness);
  const firstY = cy + getRandomOffset(roughness);
  ctx.moveTo(firstX, firstY);

  for (let i = 1; i <= steps; i++) {
    const angle = i * angleStep;
    const x = cx + rx * Math.cos(angle) + getRandomOffset(roughness);
    const y = cy + ry * Math.sin(angle) + getRandomOffset(roughness);
    ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawRoughDiamond(ctx, cx, cy, w, h, roughness) {
  const top = { x: cx, y: cy - h / 2 };
  const right = { x: cx + w / 2, y: cy };
  const bottom = { x: cx, y: cy + h / 2 };
  const left = { x: cx - w / 2, y: cy };

  drawRoughLine(ctx, top.x, top.y, right.x, right.y, roughness);
  drawRoughLine(ctx, right.x, right.y, bottom.x, bottom.y, roughness);
  drawRoughLine(ctx, bottom.x, bottom.y, left.x, left.y, roughness);
  drawRoughLine(ctx, left.x, left.y, top.x, top.y, roughness);
}

function drawArrowHead(ctx, fromX, fromY, toX, toY, size) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const a1 = angle - Math.PI / 6;
  const a2 = angle + Math.PI / 6;

  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - size * Math.cos(a1), toY - size * Math.sin(a1));
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - size * Math.cos(a2), toY - size * Math.sin(a2));
}

// Smooth freehand drawing using quadratic curves
function drawSmoothPath(ctx, points) {
  if (points.length < 2) return;

  ctx.moveTo(points[0].x, points[0].y);

  if (points.length === 2) {
    ctx.lineTo(points[1].x, points[1].y);
    return;
  }

  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
  }

  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
}

// Main draw function
export function drawElement(ctx, element) {
  const {
    type,
    x1,
    y1,
    x2,
    y2,
    strokeColor,
    fillColor,
    strokeWidth,
    roughness = 1,
  } = element;

  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = fillColor || "transparent";
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();

  switch (type) {
    case "rectangle": {
      const x = Math.min(x1, x2);
      const y = Math.min(y1, y2);
      const w = Math.abs(x2 - x1);
      const h = Math.abs(y2 - y1);
      drawRoughRect(ctx, x, y, w, h, roughness);
      if (fillColor && fillColor !== "transparent") {
        ctx.fill();
      }
      ctx.stroke();
      break;
    }

    case "ellipse": {
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      const rx = Math.abs(x2 - x1) / 2;
      const ry = Math.abs(y2 - y1) / 2;
      drawRoughEllipse(ctx, cx, cy, rx, ry, roughness);
      if (fillColor && fillColor !== "transparent") {
        ctx.fill();
      }
      ctx.stroke();
      break;
    }

    case "diamond": {
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      const w = Math.abs(x2 - x1);
      const h = Math.abs(y2 - y1);
      drawRoughDiamond(ctx, cx, cy, w, h, roughness);
      if (fillColor && fillColor !== "transparent") {
        ctx.fill();
      }
      ctx.stroke();
      break;
    }

    case "line": {
      drawRoughLine(ctx, x1, y1, x2, y2, roughness);
      ctx.stroke();
      break;
    }

    case "arrow": {
      drawRoughLine(ctx, x1, y1, x2, y2, roughness);
      const arrowSize = Math.max(10, strokeWidth * 4);
      drawArrowHead(ctx, x1, y1, x2, y2, arrowSize);
      ctx.stroke();
      break;
    }

    case "pencil": {
      if (element.points && element.points.length > 0) {
        drawSmoothPath(ctx, element.points);
        ctx.stroke();
      }
      break;
    }

    case "text": {
      if (element.text) {
        ctx.font = `${element.fontSize || 20}px ${element.fontFamily || "Inter, sans-serif"}`;
        ctx.fillStyle = strokeColor;
        ctx.textBaseline = "top";
        const lines = element.text.split("\n");
        lines.forEach((line, i) => {
          ctx.fillText(line, x1, y1 + i * (element.fontSize || 20) * 1.3);
        });
      }
      break;
    }

    default:
      break;
  }

  ctx.restore();
}

// Draw selection box around element
export function drawSelectionBox(ctx, element) {
  const padding = 8;
  let x, y, w, h;

  if (element.type === "pencil" && element.points) {
    const xs = element.points.map((p) => p.x);
    const ys = element.points.map((p) => p.y);
    x = Math.min(...xs) - padding;
    y = Math.min(...ys) - padding;
    w = Math.max(...xs) - Math.min(...xs) + padding * 2;
    h = Math.max(...ys) - Math.min(...ys) + padding * 2;
  } else {
    x = Math.min(element.x1, element.x2) - padding;
    y = Math.min(element.y1, element.y2) - padding;
    w = Math.abs(element.x2 - element.x1) + padding * 2;
    h = Math.abs(element.y2 - element.y1) + padding * 2;
  }

  ctx.save();
  ctx.strokeStyle = "#f43f5e";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(x, y, w, h);
  ctx.setLineDash([]);

  // Corner handles
  const handleSize = 7;
  ctx.fillStyle = "#f43f5e";
  const corners = [
    [x, y],
    [x + w, y],
    [x, y + h],
    [x + w, y + h],
  ];
  corners.forEach(([cx, cy]) => {
    ctx.fillRect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize);
  });

  ctx.restore();
}
