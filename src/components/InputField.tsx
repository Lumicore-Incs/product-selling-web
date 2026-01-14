import { Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';

interface InputFieldProps {
  id: string;
  type?: string;
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  // forward any other input props like required, minLength, autoComplete
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export const InputField: React.FC<InputFieldProps> = ({
  id,
  type = 'text',
  label,
  icon,
  value,
  onChange,
  placeholder,
  inputProps,
}) => {
  const isActive = value.length > 0;
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === 'password';

  return (
    <div className="relative">
      <div
        className={`absolute left-0 top-0 h-full flex items-center pl-3 transition-all duration-300 ${
          isActive ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {icon}
      </div>

      <input
        id={id}
        type={isPassword && showPassword ? 'text' : type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...(inputProps || {})}
        className={`
                    w-full bg-white bg-opacity-50 backdrop-filter backdrop-blur-sm
                    border border-gray-200 rounded-lg py-3 px-3
                    transition-all duration-300 ease-in-out
                    focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent
                    shadow-sm hover:shadow-md
                    ${isActive ? 'pl-10' : 'pl-3'}
                    ${isPassword ? 'pr-10' : ''}
                `}
      />

      <label
        htmlFor={id}
        className={`absolute left-3 top-3 text-gray-500 transition-all duration-300 ${
          isActive ? 'text-xs -translate-y-5 translate-x-0 text-blue-500' : 'text-base'
        } ${isActive && icon ? 'left-10' : ''}`}
      >
        {label}
      </label>

      {isPassword && (
        <button
          type="button"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          onClick={() => setShowPassword((s) => !s)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 p-1"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  );
};
