import React from "react";

interface CircularProgressProps {
  size?: number;
  value?: number;
  className?: string;
  percentage?: number;
  strokeWidth?: number;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  size = 40,
  value = 0,
  className = "",
}) => {
  return (
    <div 
      className={`relative inline-flex ${className}`}
      style={{ width: size, height: size }}
    >
      <svg className="w-full h-full" viewBox={`0 0 36 36`}>
        <circle
          cx="18"
          cy="18"
          r="16"
          fill="none"
          stroke="#e6e6e6"
          strokeWidth="2"
        />
        <circle
          cx="18"
          cy="18"
          r="16"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeDasharray="100"
          strokeDashoffset={100 - value}
          strokeLinecap="round"
          transform="rotate(-90 18 18)"
        />
      </svg>
    </div>
  );
};