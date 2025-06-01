import React, { useState } from 'react';
interface InputFieldProps {
  id: string;
  type: string;
  label: string;
  icon?: React.ReactNode;
}
export const InputField: React.FC<InputFieldProps> = ({
  id,
  type,
  label,
  icon
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [value, setValue] = useState('');
  const isActive = isFocused || value.length > 0;
  return <div className="relative">
      <div className={`
        absolute left-0 top-0 h-full flex items-center pl-3 transition-all duration-300
        ${isActive ? 'opacity-100' : 'opacity-0'}
      `}>
        {icon}
      </div>
      <input id={id} type={type} value={value} onChange={e => setValue(e.target.value)} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} className={`
          w-full bg-white bg-opacity-50 backdrop-filter backdrop-blur-sm
          border border-gray-200 rounded-lg py-3 px-3
          transition-all duration-300 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent
          shadow-sm hover:shadow-md
          ${isActive ? 'pl-10' : 'pl-3'}
        `} />
      <label htmlFor={id} className={`
          absolute left-3 top-3 text-gray-500 transition-all duration-300
          ${isActive ? 'text-xs -translate-y-5 translate-x-0 text-blue-500' : 'text-base'}
          ${isActive && icon ? 'left-10' : ''}
        `}>
        {label}
      </label>
    </div>;
};