import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthCard } from './components/AuthCard';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { Users } from './pages/Users';
import { SalesManagement } from './pages/SalesManagement';
import { StockManagement } from './pages/StockManagement';
import { ProductManagement } from './pages/ProductManagement';

// Simple loader component
function Loader() {
  return (
    <div className="w-full min-h-screen flex flex-col justify-center items-center gap-4 bg-gray-100">
      <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
      <p className="text-gray-600 text-lg font-medium">Loading...</p>
    </div>
  );
}

function BackgroundShapes() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <svg width="100vw" height="100vh" style={{ position: "absolute", width: "100vw", height: "100vh" }}>
        {/* Circles */}
        <circle cx="10%" cy="20%" r="60" fill="#60a5fa" opacity="0.15" />
        <circle cx="80%" cy="80%" r="40" fill="#60a5fa" opacity="0.12" />
        {/* Squares */}
        <rect x="70%" y="10%" width="70" height="70" fill="#60a5fa" opacity="0.13" rx="16" />
        <rect x="20%" y="70%" width="50" height="50" fill="#60a5fa" opacity="0.10" rx="10" />
        {/* Triangles */}
        <polygon points="90,300 140,350 40,350" fill="#60a5fa" opacity="0.11" />
        <polygon points="900,100 950,180 850,180" fill="#60a5fa" opacity="0.09" />
      </svg>
    </div>
  );
}

export function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      try {
        // Example API call
        await new Promise(resolve => setTimeout(resolve, 1500)); // replace with fetch() or axios
      } catch (error) {
        console.error("API call failed:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Loader />;


function ProtectedRoute({ children }: Readonly<{ children: JSX.Element }>) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/auth" replace />;
  }
  return children;
}

  return (
    <BrowserRouter>
      <BackgroundShapes />
      <div className="w-full min-h-screen" style={{ position: "relative", zIndex: 1 }}>
        <Routes>
          <Route
            path="/auth"
            element={
              <div className="w-full min-h-screen flex justify-center items-center p-4">
                <AuthCard />
              </div>
            }
          />
          <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="sale" element={<SalesManagement />} />
            <Route path="sale/settings" element={<SalesManagement />} />
            <Route path="product" element={<ProductManagement />} />
            <Route path="users" element={<Users />} />
            <Route path="stock" element={<StockManagement />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
          {/* Backward compatibility: redirect old /dashboard path to root */}
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
