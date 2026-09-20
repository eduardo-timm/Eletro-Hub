import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
});

// O token e sempre passado explicitamente pelas paginas/contextos (cliente
// ou admin), evitando ambiguidade sobre qual credencial usar em cada rota.
export function withClientAuth() {
  const token = localStorage.getItem('clientToken');
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

export function withAdminAuth() {
  const token = localStorage.getItem('adminToken');
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

export default api;
