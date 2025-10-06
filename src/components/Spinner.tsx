import React from 'react';

interface SpinnerProps {
  size?: number; // px
  colorClass?: string; // tailwind color class for stroke/fill
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 48, colorClass = 'text-blue-600' }) => {
  const px = size;
  const viewBox = '0 0 24 24';
  return (
    <svg
      className={`animate-spin ${colorClass}`}
      width={px}
      height={px}
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="img"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
};

export default Spinner;
