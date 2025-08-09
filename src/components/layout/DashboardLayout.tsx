import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Settings } from '../../pages/Settings';

export const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [salesTitle, setSalesTitle] = useState('Sales Management');
  const [salesBackgroundColor, setSalesBackgroundColor] = useState('#ffffff');
  const location = useLocation();

  // Load saved settings on component mount
  useEffect(() => {
    const savedTitle = localStorage.getItem('salesTitle') || 'Add New Order';
    const savedColor = localStorage.getItem('appBackgroundColor') || '#ffffff';
    setSalesTitle(savedTitle);
    setSalesBackgroundColor(savedColor);
  }, []);

  // Close settings when navigating away from sales page
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
          className="flex h-screen transition-colors duration-300"
          style={{ backgroundColor: salesBackgroundColor }}
      >
        <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            showSettings={showSettings}
            setShowSettings={setShowSettings}
        />
        <div className="flex-1 flex flex-col">
          <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
          <main className="flex-1 px-10 py-6 overflow-auto">
            <div className="max-w-full">
              <Outlet context={{
                salesTitle,
                salesBackgroundColor,
                showSettings,
                setShowSettings
              }} />
            </div>
          </main>
        </div>

        {/* Settings Tab */}
        {showSettings && (
            <div className="w-96 bg-white border-l border-gray-200 shadow-lg overflow-y-auto">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800">Settings</h2>
                  <button
                      onClick={() => setShowSettings(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg
                        className="w-5 h-5 text-gray-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                      <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
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

        {/* Mobile overlay */}
        {isSidebarOpen && (
            <div
                className="md:hidden fixed inset-0 bg-black bg-opacity-50 transition-opacity z-20"
                onClick={() => setIsSidebarOpen(false)}
            />
        )}
      </div>
  );
};