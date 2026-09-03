import React from "react";
import { AIRA_MARK_URI } from "../brand.js";

function Logo({ size = 28 }) {
  return (
    <img
      src={AIRA_MARK_URI}
      alt="AIRA"
      style={{ height: size, width: "auto", display: "block" }}
    />
  );
}

export default Logo;
