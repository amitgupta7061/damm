// Tool types
export const TOOLS = {
  SELECT: "select",
  RECTANGLE: "rectangle",
  ELLIPSE: "ellipse",
  DIAMOND: "diamond",
  LINE: "line",
  ARROW: "arrow",
  PENCIL: "pencil",
  TEXT: "text",
  ERASER: "eraser",
  HAND: "hand",
};

// Keyboard shortcuts
export const TOOL_SHORTCUTS = {
  v: TOOLS.SELECT,
  "1": TOOLS.SELECT,
  r: TOOLS.RECTANGLE,
  "2": TOOLS.RECTANGLE,
  e: TOOLS.ELLIPSE,
  "3": TOOLS.ELLIPSE,
  d: TOOLS.DIAMOND,
  "4": TOOLS.DIAMOND,
  l: TOOLS.LINE,
  "5": TOOLS.LINE,
  a: TOOLS.ARROW,
  "6": TOOLS.ARROW,
  p: TOOLS.PENCIL,
  "7": TOOLS.PENCIL,
  t: TOOLS.TEXT,
  "8": TOOLS.TEXT,
  x: TOOLS.ERASER,
  h: TOOLS.HAND,
};

// Default styling
export const DEFAULT_STYLE = {
  strokeColor: "#e2e8f0",
  fillColor: "transparent",
  strokeWidth: 2,
  roughness: 1,
  fontSize: 20,
  fontFamily: "Inter, sans-serif",
};

// Color palette
export const STROKE_COLORS = [
  "#e2e8f0", // white-ish
  "#f87171", // red
  "#fb923c", // orange
  "#fbbf24", // yellow
  "#4ade80", // green
  "#22d3ee", // cyan
  "#60a5fa", // blue
  "#a78bfa", // purple
  "#f472b6", // pink
  "#94a3b8", // gray
];

export const FILL_COLORS = [
  "transparent",
  "rgba(248,113,113,0.15)",
  "rgba(251,146,60,0.15)",
  "rgba(251,191,36,0.15)",
  "rgba(74,222,128,0.15)",
  "rgba(34,211,238,0.15)",
  "rgba(96,165,250,0.15)",
  "rgba(167,139,250,0.15)",
  "rgba(244,114,182,0.15)",
  "rgba(148,163,184,0.15)",
];

export const STROKE_WIDTHS = [1, 2, 4, 6];

// Cursor colors for different users
export const CURSOR_COLORS = [
  "#f87171",
  "#60a5fa",
  "#4ade80",
  "#fbbf24",
  "#a78bfa",
  "#f472b6",
  "#22d3ee",
  "#fb923c",
];
