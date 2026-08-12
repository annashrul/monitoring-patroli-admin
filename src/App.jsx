import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ProtectedRoute } from './AuthContext';
import { SiteProvider } from './SiteContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sites from './pages/Sites';
import Posts from './pages/Posts';
import Logs from './pages/Logs';
import Users from './pages/Users';
import Temuan from './pages/Temuan';

export default function App() {
  return (
    <AuthProvider>
      <SiteProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="sites" element={<Sites />} />
              <Route path="posts" element={<Posts />} />
              <Route path="logs" element={<Logs />} />
              <Route path="users" element={<Users />} />
              <Route path="temuan" element={<Temuan />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SiteProvider>
    </AuthProvider>
  );
}
