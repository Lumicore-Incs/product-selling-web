import React from 'react';
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}
export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = 'submit'
}) => {
  return <button type={type} onClick={onClick} className="
        w-full py-3 px-6 text-white font-medium
        bg-gradient-to-r from-blue-500 to-purple-500
        rounded-lg shadow-md hover:shadow-lg
        transform transition-all duration-300
        hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400
      ">
      {children}
    </button>;
};