import React, { useRef } from "react";
import { T } from "../theme.js";

function SignaturePad({ onChange, width = 500, height = 160 }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const start = (e) => {
    e.preventDefault();
    drawingRef.current = true;
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const move = (e) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#152F36";
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.stroke();
    if (onChange) onChange(canvasRef.current.toDataURL("image/png"));
  };
  const end = () => { drawingRef.current = false; };
  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    if (onChange) onChange(null);
  };

  return (
    <div>
      <canvas
        ref={canvasRef} width={width} height={height}
        style={{ width: "100%", maxWidth: width, height, border: `1.5px dashed ${T.border}`, borderRadius: 10, touchAction: "none", background: "#fff", display: "block" }}
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}
      />
      <button onClick={clear} type="button" style={{ marginTop: 8, background: "none", border: `1px solid ${T.border}`, borderRadius: 8, padding: "5px 12px", fontSize: 12.5, color: T.inkSoft, cursor: "pointer", fontFamily: T.font }}>
        Borrar firma
      </button>
    </div>
  );
}

export default SignaturePad;
