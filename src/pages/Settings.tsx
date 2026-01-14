import React, { useState, useEffect } from 'react';
import { BackgroundIcons } from '../components/BackgroundIcons';

interface SettingsProps {
  onTitleChange?: (title: string) => void;
  onBackgroundColorChange?: (color: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
  onTitleChange, 
  onBackgroundColorChange 
}) => {
  const [title, setTitle] = useState('Sales Management');
  const [backgroundColor, setBackgroundColor] = useState('#e0f2fe');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);

  // Load saved settings from localStorage on component mount
  useEffect(() => {
    const savedTitle = localStorage.getItem('salesTitle') || 'Sales Management';
    const savedColor = localStorage.getItem('appBackgroundColor') || '#e0f2fe';
    
    setTitle(savedTitle);
    setTempTitle(savedTitle);
    setBackgroundColor(savedColor);
  }, []);

  const handleTitleSave = () => {
    setTitle(tempTitle);
    setIsEditingTitle(false);
    localStorage.setItem('salesTitle', tempTitle);
    onTitleChange?.(tempTitle);
  };

  const handleTitleCancel = () => {
    setTempTitle(title);
    setIsEditingTitle(false);
  };

  const handleBackgroundColorChange = (color: string) => {
    setBackgroundColor(color);
    localStorage.setItem('appBackgroundColor', color);
    onBackgroundColorChange?.(color);
  };

  const presetColors = [
    '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0',
    '#fef2f2', '#fee2e2', '#fecaca',
    '#f0fdf4', '#dcfce7', '#bbf7d0',
    '#f0f9ff', '#e0f2fe', '#bae6fd',
    '#faf5ff', '#f3e8ff', '#e9d5ff',
    '#fefce8', '#fef9c3', '#fef08a'
  ];

  return (
    <div className="space-y-6 relative">
      <BackgroundIcons type="settings" />
      {/* Title Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Page Title</h2>
        <div className="space-y-3">
          {isEditingTitle ? (
            <>
              <input
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Enter page title"
                autoFocus
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleTitleSave}
                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                >
                  Save
                </button>
                <button
                  onClick={handleTitleCancel}
                  className="flex-1 px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded border">
                {title}
              </div>
              <button
                onClick={() => setIsEditingTitle(true)}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                Edit Title
              </button>
            </>
          )}
        </div>
      </div>

      {/* Background Color Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Background Color</h2>
        
        {/* Current Color Display */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Current Color
          </label>
          <div className="flex items-center space-x-3">
            <div 
              className="w-8 h-8 rounded border-2 border-gray-300"
              style={{ backgroundColor }}
            ></div>
            <span className="text-xs text-gray-600 font-mono">{backgroundColor}</span>
          </div>
        </div>

        {/* Color Picker */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Choose Color
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => handleBackgroundColorChange(e.target.value)}
              className="w-8 h-8 border-2 border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={backgroundColor}
              onChange={(e) => handleBackgroundColorChange(e.target.value)}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              placeholder="#ffffff"
            />
          </div>
        </div>

        {/* Preset Colors */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Preset Colors
          </label>
          <div className="grid grid-cols-6 gap-1">
            {presetColors.map((color) => (
              <button
                key={color}
                onClick={() => handleBackgroundColorChange(color)}
                className={`w-6 h-6 rounded border-2 transition-all hover:scale-110 ${
                  backgroundColor === color 
                    ? 'border-blue-500 ring-2 ring-blue-200' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Preview</h2>
        <div 
          className="p-3 rounded border-2 border-dashed border-gray-300"
          style={{ backgroundColor }}
        >
          <h3 className="text-sm font-bold text-gray-800 mb-1">{title}</h3>
          <p className="text-xs text-gray-600">
            Preview of your application background
          </p>
        </div>
      </div>
    </div>
  );
}; 