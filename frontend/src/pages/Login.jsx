import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useClientAuth } from '../context/ClientAuthContext';

export default function Login() {
  const { login } = useClientAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao entrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Entrar</h1>
      <p className="text-sm text-slate-500 mb-6">Acesse sua conta para interagir com os produtos.</p>

      <form onSubmit={submit} className="card p-5 space-y-3">
        <div>
          <label className="text-xs font-medium text-slate-500">E-mail</label>
          <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Senha</label>
          <input
            className="input"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="text-sm text-slate-500 mt-4 text-center">
        Não tem conta?{' '}
        <Link to="/cadastro" className="text-brand-600 font-medium hover:underline">
          Cadastre-se
        </Link>
      </p>
      <p className="text-xs text-slate-400 mt-6 text-center">
        Conta de teste: cliente@teste.com / cliente123
      </p>
    </div>
  );
}
