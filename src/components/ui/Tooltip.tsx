import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type TooltipProps = {
  content: string;
  children: React.ReactNode;
  offset?: number; // distance en px
};

export default function Tooltip({ content, children, offset = 8 }: TooltipProps) {
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placement: "top" | "bottom" }>({
    top: 0,
    left: 0,
    placement: "top",
  });

  const compute = () => {
    const el = triggerRef.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    const centerX = r.left + r.width / 2;

    // Position par défaut : au-dessus
    let top = r.top - offset;
    let placement: "top" | "bottom" = "top";

    // Si pas assez de place en haut, affiche en dessous
    if (top < 8) {
      top = r.bottom + offset;
      placement = "bottom";
    }

    setCoords({ top, left: centerX, placement });
  };

  useEffect(() => {
    if (!open) return;
    compute();
    const onScroll = () => compute();
    const onResize = () => compute();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <span
      ref={triggerRef}
      className="inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      tabIndex={0}
    >
      {children}
      {open &&
        createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-[9999] max-w-xs rounded bg-gray-800 px-2 py-1 text-xs text-white shadow-lg transition-opacity duration-100"
            style={{
              top: coords.top,
              left: coords.left,
              transform:
                coords.placement === "top"
                  ? "translate(-50%, -100%)"
                  : "translate(-50%, 0%)",
            }}
          >
            {content}
          </div>,
          document.body
        )}
    </span>
  );
}