"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface InfoTooltipProps {
  text: string;
}

const TOOLTIP_WIDTH = 220;
const EDGE_PADDING = 12;

export default function InfoTooltip({ text }: InfoTooltipProps) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    arrowLeft: string;
  } | null>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const show = useCallback(() => {
    if (!iconRef.current) return;
    const rect = iconRef.current.getBoundingClientRect();
    const vw = window.innerWidth;

    const iconCenterX = rect.left + rect.width / 2;
    const top = rect.top - 6;

    // Default: center tooltip on icon
    let left = iconCenterX - TOOLTIP_WIDTH / 2;
    let arrowLeft = "50%";

    // Clamp to viewport edges
    if (left < EDGE_PADDING) {
      left = EDGE_PADDING;
      // Arrow tracks the icon position relative to the tooltip
      arrowLeft = `${Math.max(12, iconCenterX - left)}px`;
    } else if (left + TOOLTIP_WIDTH > vw - EDGE_PADDING) {
      left = vw - EDGE_PADDING - TOOLTIP_WIDTH;
      arrowLeft = `${Math.min(TOOLTIP_WIDTH - 12, iconCenterX - left)}px`;
    }

    setPos({ top, left, arrowLeft });
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <>
      <span
        ref={iconRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginLeft: "6px",
          width: "14px",
          height: "14px",
          borderRadius: "50%",
          backgroundColor: "#3a3a3a",
          border: "1px solid #555",
          color: "#aaa",
          fontSize: "9px",
          fontWeight: 700,
          cursor: "help",
          userSelect: "none",
          lineHeight: 1,
          verticalAlign: "middle",
          flexShrink: 0,
          transition:
            "background-color 0.15s, color 0.15s, border-color 0.15s",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = "#555";
          e.currentTarget.style.color = "#eee";
          e.currentTarget.style.borderColor = "#888";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = "#3a3a3a";
          e.currentTarget.style.color = "#aaa";
          e.currentTarget.style.borderColor = "#555";
        }}
      >
        ?
      </span>
      {mounted &&
        visible &&
        pos &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              transform: "translateY(-100%)",
              zIndex: 99999,
              pointerEvents: "none",
              width: `${TOOLTIP_WIDTH}px`,
              borderRadius: "8px",
              backgroundColor: "#1e1e1e",
              border: "1px solid #555",
              padding: "8px 12px",
              fontSize: "11px",
              lineHeight: "1.45",
              color: "#ddd",
              fontWeight: 400,
              textTransform: "none",
              letterSpacing: "normal",
              textAlign: "left",
              boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
            }}
          >
            {text}
            <div
              style={{
                position: "absolute",
                left: pos.arrowLeft,
                bottom: "-4px",
                transform: "translateX(-50%) rotate(45deg)",
                width: "8px",
                height: "8px",
                backgroundColor: "#1e1e1e",
                borderRight: "1px solid #555",
                borderBottom: "1px solid #555",
              }}
            />
          </div>,
          document.body
        )}
    </>
  );
}
