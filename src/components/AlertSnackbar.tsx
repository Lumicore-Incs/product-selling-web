import React from 'react';

interface AlertSnackbarProps {
  message: string;
  type?: 'success' | 'error';
  open: boolean;
  onClose: () => void;
}

const typeStyles = {
  success: 'bg-green-100 text-green-700 border-green-400',
  error: 'bg-red-100 text-red-600 border-red-400',
};

export const AlertSnackbar: React.FC<AlertSnackbarProps> = ({ message, type = 'error', open, onClose }) => {
  if (!open) return null;
  return (
    <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-4 py-3 rounded border shadow-lg transition-all duration-300 ${typeStyles[type]}`}
         role="alert">
      <div className="flex items-center justify-between gap-4">
        <span>{message}</span>
        <button onClick={onClose} className="ml-4 text-lg font-bold focus:outline-none">&times;</button>
      </div>
    </div>
  );
};