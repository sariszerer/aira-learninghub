import React from "react";
import { T } from "../theme.js";
import { readableTextOn } from "../lib/format.js";

function Avatar({ name, bg, size = 44 }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const fg = readableTextOn(bg || T.brand);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: bg || T.brand,
      color: fg, display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: T.font, fontWeight: 600, fontSize: size * 0.4, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

export default Avatar;
