import { Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminSidebar from './components/AdminSidebar';

import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import MyInteractions from './pages/MyInteractions';

import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminProductForm from './pages/admin/AdminProductForm';
import AdminInteractions from './pages/admin/AdminInteractions';

function PublicLayout({ children }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      {children}
    </div>
  );
}

function AdminLayout({ children }) {
  return (
    <div className="min-h-screen flex">
      <AdminSidebar />
      <div className="flex-1">{children}</div>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) {
    return (
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/produtos"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminProducts />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/produtos/novo"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminProductForm />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/produtos/:id/editar"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminProductForm />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/interacoes"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminInteractions />
              </AdminLayout>
            </AdminRoute>
          }
        />
      </Routes>
    );
  }

  return (
    <PublicLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/produtos/:id" element={<ProductDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Register />} />
        <Route
          path="/minhas-interacoes"
          element={
            <ProtectedRoute>
              <MyInteractions />
            </ProtectedRoute>
          }
        />
      </Routes>
    </PublicLayout>
  );
}
