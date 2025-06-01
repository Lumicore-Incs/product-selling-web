import React from 'react';
interface ToggleSwitchProps {
  isLogin: boolean;
  onToggle: () => void;
}
export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  isLogin,
  onToggle
}) => {
  return <div className="
        inline-flex rounded-lg bg-gray-100 p-1 cursor-pointer
        transition-all duration-300 ease-in-out
      " onClick={onToggle}>
      <div className="relative flex">
        <div className={`
            absolute top-0 h-full rounded-md bg-white shadow-sm transition-all duration-300
            ${isLogin ? 'left-0 w-[80px]' : 'left-[80px] w-[100px]'}
          `} />
        <div className={`
            px-4 py-2 text-sm z-10 transition-colors duration-300
            ${isLogin ? 'text-blue-600 font-medium' : 'text-gray-500'}
          `}>
          Login
        </div>
        <div className={`
            px-4 py-2 text-sm z-10 transition-colors duration-300
            ${!isLogin ? 'text-blue-600 font-medium' : 'text-gray-500'}
          `}>
          Sign Up
        </div>
      </div>
    </div>;
};