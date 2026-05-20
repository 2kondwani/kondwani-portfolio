"use client";
import { useState } from "react";

export default function AnimatedLogo({ as = "a", href, children, ...props }) {
  const [hovered, setHovered] = useState(false);
  const Tag = as;
  return (
    <Tag
      href={href}
      target={href ? "_blank" : undefined}
      rel={href ? "noopener noreferrer" : undefined}
      style={{
        display: "inline-block",
        borderRadius: 8,
        overflow: "hidden",
        boxShadow: hovered
          ? "0 4px 24px 0 rgba(0,0,0,0.11)"
          : "0 1px 6px 0 rgba(0,0,0,0.04)",
        transform: hovered ? "scale(1.13)" : "scale(1)",
        transition:
          "transform 0.18s cubic-bezier(.4,2,.6,1), box-shadow 0.18s cubic-bezier(.4,2,.6,1)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      {...props}
    >
      {children}
    </Tag>
  );
}
