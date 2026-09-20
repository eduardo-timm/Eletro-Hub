import { createContext, useContext, useEffect, useState } from 'react';
import api, { withAdminAuth } from '../api/client';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('adminToken');
    if (!savedToken) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/admin/me', withAdminAuth())
      .then((res) => setAdmin(res.data.admin))
      .catch(() => localStorage.removeItem('adminToken'))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const res = await api.post('/auth/admin/login', { email, password });
    localStorage.setItem('adminId', res.data.admin.id);
    localStorage.setItem('adminToken', res.data.token);
    setAdmin(res.data.admin);
    return res.data.admin;
  }

  function logout() {
    localStorage.removeItem('adminId');
    localStorage.removeItem('adminToken');
    setAdmin(null);
  }

  return <AdminAuthContext.Provider value={{ admin, loading, login, logout }}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth deve ser usado dentro de AdminAuthProvider');
  return ctx;
}
