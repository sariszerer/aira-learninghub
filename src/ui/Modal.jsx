import React from "react";

function Modal({ children, onClose, width = 560 }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(21,47,54,0.45)", zIndex: 100,
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: "40px 20px", overflowY: "auto",
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 20, width: "100%", maxWidth: width,
          boxShadow: "0 20px 60px rgba(21,47,54,0.25)", overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default Modal;
