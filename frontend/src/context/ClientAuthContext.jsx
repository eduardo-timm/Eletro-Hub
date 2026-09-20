import { createContext, useContext, useEffect, useState } from 'react';
import api, { withClientAuth } from '../api/client';

const ClientAuthContext = createContext(null);

export function ClientAuthProvider({ children }) {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  // Requisito 5: ao carregar o app, recupera o id (UUID) salvo no
  // LocalStorage e usa o token salvo para restaurar a sessao do cliente.
  useEffect(() => {
    const savedId = localStorage.getItem('clientId');
    const savedToken = localStorage.getItem('clientToken');

    if (!savedId || !savedToken) {
      setLoading(false);
      return;
    }

    api
      .get('/auth/me', withClientAuth())
      .then((res) => setClient(res.data.client))
      .catch(() => {
        localStorage.removeItem('clientId');
        localStorage.removeItem('clientToken');
      })
      .finally(() => setLoading(false));
  }, []);

  function persistSession(clientData, token) {
    localStorage.setItem('clientId', clientData.id);
    localStorage.setItem('clientToken', token);
    setClient(clientData);
  }

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    persistSession(res.data.client, res.data.token);
    return res.data.client;
  }

  async function register(payload) {
    const res = await api.post('/auth/register', payload);
    persistSession(res.data.client, res.data.token);
    return res.data.client;
  }

  function logout() {
    localStorage.removeItem('clientId');
    localStorage.removeItem('clientToken');
    setClient(null);
  }

  return (
    <ClientAuthContext.Provider value={{ client, loading, login, register, logout }}>
      {children}
    </ClientAuthContext.Provider>
  );
}

export function useClientAuth() {
  const ctx = useContext(ClientAuthContext);
  if (!ctx) throw new Error('useClientAuth deve ser usado dentro de ClientAuthProvider');
  return ctx;
}
