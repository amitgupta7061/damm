"use client";
import { useState, useCallback } from "react";

export function useHistory() {
  const [history, setHistory] = useState([[]]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const elements = history[currentIndex] || [];

  const setElements = useCallback(
    (newElements, recordHistory = true) => {
      const resolved =
        typeof newElements === "function"
          ? newElements(history[currentIndex] || [])
          : newElements;

      if (recordHistory) {
        const newHistory = history.slice(0, currentIndex + 1);
        newHistory.push([...resolved]);
        setHistory(newHistory);
        setCurrentIndex(newHistory.length - 1);
      } else {
        setHistory((prev) => {
          const updated = [...prev];
          updated[currentIndex] = [...resolved];
          return updated;
        });
      }
    },
    [history, currentIndex]
  );

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      return history[currentIndex - 1];
    }
    return null;
  }, [currentIndex, history]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      return history[currentIndex + 1];
    }
    return null;
  }, [currentIndex, history]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const replaceElements = useCallback(
    (newElements) => {
      setHistory((prev) => {
        const updated = [...prev];
        updated[currentIndex] = [...newElements];
        return updated;
      });
    },
    [currentIndex]
  );

  return {
    elements,
    setElements,
    undo,
    redo,
    canUndo,
    canRedo,
    replaceElements,
  };
}
