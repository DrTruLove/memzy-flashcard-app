import * as React from "react";
import MemzyLogo from "./memzy-logo";

type Props = { 
  size?: number; 
  className?: string;
};

export default function AiBadge({ 
  size = 28, 
  className = ""
}: Props) {
  return (
    <MemzyLogo 
      size={size}
      className={className}
    />
  );
}






