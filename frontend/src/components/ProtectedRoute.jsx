import { Navigate } from 'react-router-dom';
import { useClientAuth } from '../context/ClientAuthContext';

export default function ProtectedRoute({ children }) {
  const { client, loading } = useClientAuth();
  if (loading) return null;
  if (!client) return <Navigate to="/login" replace />;
  return children;
}
