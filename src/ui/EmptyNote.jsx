import React from "react";
import { T } from "../theme.js";

function EmptyNote({ text }) {
  return <div style={{ fontSize: 13, color: T.inkFaint, fontStyle: "italic" }}>{text}</div>;
}

export default EmptyNote;
