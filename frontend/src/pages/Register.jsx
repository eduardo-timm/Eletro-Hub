import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useClientAuth } from '../context/ClientAuthContext';

export default function Register() {
  const { register } = useClientAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao cadastrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Criar conta</h1>
      <p className="text-sm text-slate-500 mb-6">Cadastre-se para propor, avaliar, agendar e reservar produtos.</p>

      <form onSubmit={submit} className="card p-5 space-y-3">
        <div>
          <label className="text-xs font-medium text-slate-500">Nome</label>
          <input className="input" required value={form.name} onChange={update('name')} />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">E-mail</label>
          <input className="input" type="email" required value={form.email} onChange={update('email')} />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Telefone (opcional)</label>
          <input className="input" value={form.phone} onChange={update('phone')} />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Senha (mín. 6 caracteres)</label>
          <input className="input" type="password" required minLength={6} value={form.password} onChange={update('password')} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Cadastrando...' : 'Cadastrar'}
        </button>
      </form>

      <p className="text-sm text-slate-500 mt-4 text-center">
        Já tem conta?{' '}
        <Link to="/login" className="text-brand-600 font-medium hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
