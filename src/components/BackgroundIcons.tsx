import React from 'react';

const shapes = [
  // Square
  (key: number, style: React.CSSProperties) => (
    <svg
      key={key}
      width="120"
      height="120"
      style={style}
      className={`absolute animate-float-${key + 1}`}
    >
      <rect x="20" y="20" width="80" height="80" rx="16" fill="#6366f1" opacity="0.08" />
    </svg>
  ),
  // Circle
  (key: number, style: React.CSSProperties) => (
    <svg
      key={key}
      width="120"
      height="120"
      style={style}
      className={`absolute animate-float-${key + 1}`}
    >
      <circle cx="60" cy="60" r="40" fill="#f59e42" opacity="0.08" />
    </svg>
  ),
  // Triangle
  (key: number, style: React.CSSProperties) => (
    <svg
      key={key}
      width="120"
      height="120"
      style={style}
      className={`absolute animate-float-${key + 1}`}
    >
      <polygon points="60,20 100,100 20,100" fill="#10b981" opacity="0.08" />
    </svg>
  ),
  // Another Square (different color)
  (key: number, style: React.CSSProperties) => (
    <svg
      key={key}
      width="120"
      height="120"
      style={style}
      className={`absolute animate-float-${key + 1}`}
    >
      <rect x="30" y="30" width="60" height="60" rx="12" fill="#eab308" opacity="0.08" />
    </svg>
  ),
];

export const BackgroundIcons: React.FC<{ type?: string }> = ({ type }) => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0">
        {shapes.map((Shape, index) => {
          const top = `${Math.sin(index * 0.7) * 40 + 50}%`;
          const left = `${Math.cos(index * 0.5) * 40 + 50}%`;
          const style: React.CSSProperties = {
            top,
            left,
            animation: `float-${index + 1} ${6 + index}s infinite ease-in-out`,
          };
          return Shape(index, style);
        })}
      </div>
    </div>
  );
};
