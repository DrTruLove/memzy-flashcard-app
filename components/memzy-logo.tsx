"use client";

import Image from "next/image";

export default function MemzyLogo({ 
  size = 48, 
  className = "",
  variant = "default" 
}: { 
  size?: number; 
  className?: string;
  variant?: "default" | "white" | "greyed"
}) {
  const getStyle = () => {
    switch (variant) {
      case "white":
        return { filter: "brightness(0) invert(1)" }
      case "greyed":
        return { filter: "grayscale(100%) opacity(0.4)" }
      default:
        return undefined
    }
  }
  
  return (
    <Image
      src="/memzy-logo.png"
      alt="Memzy Logo"
      width={size}
      height={size}
      className={className}
      style={getStyle()}
      priority
    />
  );
}
