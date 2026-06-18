import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Settings } from '../../pages/Settings';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [showSettings, setShowSettings] = useState(false);
  const [salesTitle, setSalesTitle] = useState('Sales Management');
  const [salesBackgroundColor, setSalesBackgroundColor] = useState('#ffffff');
  const [headerColor, setHeaderColor] = useState('#2a98a4');
  const location = useLocation();

  useEffect(() => {
    const savedTitle = localStorage.getItem('salesTitle') || 'Add New Order';
    const savedColor = localStorage.getItem('appBackgroundColor') || '#ffffff';
    const savedHeaderColor = localStorage.getItem('headerColor') || '#2a98a4';
    setSalesTitle(savedTitle);
    setSalesBackgroundColor(savedColor);
    setHeaderColor(savedHeaderColor);
  }, []);

  useEffect(() => {
    if (location.pathname !== '/sale') {
      setShowSettings(false);
    }
  }, [location.pathname]);

  const handleTitleChange = (title: string) => setSalesTitle(title);
  const handleBackgroundColorChange = (color: string) => setSalesBackgroundColor(color);
  const handleHeaderColorChange = (color: string) => setHeaderColor(color);

  return (
    <div
      className="h-screen w-screen flex flex-col md:flex-row overflow-x-hidden"
      style={{
        background:
          salesBackgroundColor && salesBackgroundColor !== '#ffffff'
            ? salesBackgroundColor
            : 'linear-gradient(135deg, #7ecdd4 0%, #b8d8e8 30%, #cdb8e9 65%, #d4b0ef 100%)',
      }}
    >
      {/* Sidebar (Fixed on mobile, static on desktop) */}
      <div
        className={`fixed top-0 left-0 h-full z-30 transition-transform duration-300
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:relative md:block`}
        style={{ flexShrink: 0 }}
      >
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          onSettingsClick={() => setShowSettings(!showSettings)}
          headerColor={headerColor}
        />

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
        <div
          className="hidden md:flex flex-col w-full md:w-96 border-l overflow-y-auto z-30"
          style={{
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderColor: 'rgba(255,255,255,0.7)',
            boxShadow: '-4px 0 20px rgba(0,0,0,0.06)',
            flexShrink: 0,
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
          >
            <h2
              className="text-base font-bold text-gray-800"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Settings
            </h2>
            <button
              onClick={() => setShowSettings(false)}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕
            </button>
          </div>
          <div className="p-5">
            <Settings
              onTitleChange={handleTitleChange}
              onBackgroundColorChange={handleBackgroundColorChange}
              onHeaderColorChange={handleHeaderColorChange}
            />
          </div>
        </div>
      )}

      {/* Mobile Settings Popup */}
      {showSettings && (
        <div className="md:hidden fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <div
              className="flex items-center justify-between px-5 py-4 sticky top-0 bg-white"
              style={{ borderBottom: '1px solid #f0f0f0' }}
            >
              <h2 className="text-base font-bold text-gray-800">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-400 text-sm"
              >
                ✕
              </button>
            </div>
            <div className="p-5 overflow-y-auto">
              <Settings
                onTitleChange={handleTitleChange}
                onBackgroundColorChange={handleBackgroundColorChange}
                onHeaderColorChange={handleHeaderColorChange}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-20 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};