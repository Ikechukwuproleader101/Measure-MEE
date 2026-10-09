import React from 'react';

interface MascotProps {
  className?: string;
  color?: 'white' | 'green' | 'purple' | string;
  size?: number;
  useImage?: boolean;
}

export const Mascot: React.FC<MascotProps> = ({ 
  className = "w-16 h-16", 
  color = "currentColor",
  size,
  useImage = false
}) => {
  if (useImage) {
    return (
      <img
        src="/images/illustrations/mascot-waving.png"
        alt="Measure Me Mascot"
        className={className}
        style={size ? { width: size, height: size } : undefined}
      />
    );
  }

  const fillHex = color === 'white' 
    ? '#FFFFFF' 
    : color === 'green' 
    ? '#27D07F' 
    : color === 'purple' 
    ? '#B69EFF' 
    : color;

  const eyeColor = color === 'white' ? '#14141E' : '#0A0A0E';

  return (
    <svg 
      viewBox="0 0 100 90" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size * 0.9 } : undefined}
      role="img"
      aria-label="Measure Me Mascot"
    >
      {/* Friendly organic tilted ghost mascot silhouette matching Splash Screen.png */}
      <path
        d="M24 78C12 76 5 63 7 46C10 26 26 8 52 4C78 0 94 15 95 36C96 56 86 72 74 76C68 78 63 73 57 77C51 81 45 76 39 79C33 82 28 80 24 78Z"
        fill={fillHex}
      />
      {/* Friendly dark round eyes */}
      <circle cx="56" cy="38" r="4.8" fill={eyeColor} />
      <circle cx="72" cy="37" r="4.8" fill={eyeColor} />
    </svg>
  );
};
