import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthCard } from './components/AuthCard';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { DuplicateSalesManagement } from './pages/DuplicateSalesManagement';
import { ProductManagement } from './pages/ProductManagement';
import { SalesManagement } from './pages/SalesManagement';
import { StockManagement } from './pages/StockManagement';
import { Users } from './pages/Users';

// Simple loader component
function Loader() {
  return (
    <div className="w-full min-h-screen flex flex-col justify-center items-center gap-4 bg-gray-100">
      <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
      <p className="text-gray-600 text-lg font-medium">Loading...</p>
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
        await new Promise((resolve) => setTimeout(resolve, 1500)); // replace with fetch() or axios
      } catch (error) {
        console.error('API call failed:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Loader />;

  function ProtectedRoute({ children }: { children: JSX.Element }) {
    const token = localStorage.getItem('token');
    if (!token) {
      return <Navigate to="/auth" replace />;
    }
    return children;
  }

  return (
    <BrowserRouter>
      <div className="w-full min-h-screen">
        <Routes>
          <Route
            path="/auth"
            element={
              <div className="w-full min-h-screen flex justify-center items-center p-4">
                <AuthCard />
              </div>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="sale" element={<SalesManagement />} />
            <Route path="sale/duplicate" element={<DuplicateSalesManagement />} />
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
