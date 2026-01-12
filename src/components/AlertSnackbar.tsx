import React, { useEffect, useState } from 'react';

interface AlertSnackbarProps {
  message: string;
  type?: 'success' | 'error';
  open: boolean;
  onClose: () => void;
  autoHideDuration?: number;
}

const typeStyles = {
  success: {
    container: 'bg-green-100 text-green-700 border-green-400',
    progress: 'bg-green-500'
  },
  error: {
    container: 'bg-red-100 text-red-600 border-red-400',
    progress: 'bg-red-500'
  }
};

export const AlertSnackbar: React.FC<AlertSnackbarProps> = ({ 
  message, 
  type = 'error', 
  open, 
  onClose,
  autoHideDuration = 3000 // Default 3 seconds
}) => {
  const [progress, setProgress] = useState(100);
  
  useEffect(() => {
    if (open) {
      setProgress(100); // Reset progress when snackbar opens
      
      const startTime = Date.now();
      const endTime = startTime + autoHideDuration;
      
      const timer = setTimeout(() => {
        onClose();
      }, autoHideDuration);
      
      // Update progress bar every 10ms
      const intervalId = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, endTime - now);
        const progressValue = (remaining / autoHideDuration) * 100;
        setProgress(progressValue);
      }, 10);
      
      // Cleanup both timers
      return () => {
        clearTimeout(timer);
        clearInterval(intervalId);
      };
    }
  }, [open, onClose, autoHideDuration]);

  if (!open) return null;
  
  return (
    <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 rounded border shadow-lg transition-all duration-300 overflow-hidden ${typeStyles[type].container}`}
         role="alert">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <span>{message}</span>
          <button onClick={onClose} className="ml-4 text-lg font-bold focus:outline-none">&times;</button>
        </div>
      </div>
      <div className="h-1 w-full bg-gray-200">
        <div 
          className={`h-full transition-all duration-[10ms] ease-linear ${typeStyles[type].progress}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};