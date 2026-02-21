import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Settings } from '../../pages/Settings';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [salesTitle, setSalesTitle] = useState('Sales Management');
  const [salesBackgroundColor, setSalesBackgroundColor] = useState('#ffffff');
  const location = useLocation();

  useEffect(() => {
    const savedTitle = localStorage.getItem('salesTitle') || 'Add New Order';
    const savedColor = localStorage.getItem('appBackgroundColor') || '#ffffff';
    setSalesTitle(savedTitle);
    setSalesBackgroundColor(savedColor);
  }, []);

  useEffect(() => {
    if (location.pathname !== '/sale') {
      setShowSettings(false);
    }
  }, [location.pathname]);

  const handleTitleChange = (title: string) => {
    setSalesTitle(title);
  };

  const handleBackgroundColorChange = (color: string) => {
    setSalesBackgroundColor(color);
  };

  return (
    <div
      className="h-screen w-screen flex flex-col md:flex-row bg-gray-100 overflow-x-hidden"
      style={{ backgroundColor: salesBackgroundColor }}
    >
      {/* Sidebar (Fixed) */}
      <div
        className={`fixed top-0 left-0 h-full z-30 transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:relative`}
      >
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
        />
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300`}>
        <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden w-full">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-full">
            <Outlet
              context={{
                salesTitle,
                salesBackgroundColor,
                showSettings,
                setShowSettings,
              }}
            />
          </div>
        </main>
      </div>

      {/* Desktop Settings Panel */}
      {showSettings && (
        <div className="hidden md:block w-full md:w-96 bg-white border-l border-gray-200 shadow-lg overflow-y-auto z-30">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="p-4">
            <Settings
              onTitleChange={handleTitleChange}
              onBackgroundColorChange={handleBackgroundColorChange}
            />
          </div>
        </div>
      )}

      {/* Mobile Popup Settings */}
      {showSettings && (
        <div className="md:hidden fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white w-full max-w-md rounded-lg shadow-lg overflow-hidden animate-fadeIn max-h-[90vh]">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-gray-800">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <Settings
                onTitleChange={handleTitleChange}
                onBackgroundColorChange={handleBackgroundColorChange}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 transition-opacity z-20"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};
