import { useEffect, useRef, type ReactNode } from "react";

interface Props {
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({ onClose, children }: Props) {
  const mouseDownOnOverlay = useRef(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        mouseDownOnOverlay.current = e.target === e.currentTarget;
      }}
      onMouseUp={(e) => {
        if (mouseDownOnOverlay.current && e.target === e.currentTarget) {
          onClose();
        }
        mouseDownOnOverlay.current = false;
      }}
    >
      <div>{children}</div>
    </div>
  );
}
