import { Link, useNavigate } from 'react-router-dom';
import { useClientAuth } from '../context/ClientAuthContext';

export default function Navbar() {
  const { client, logout } = useClientAuth();
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-brand-700">
          <span className="text-2xl">🔌</span> EletroHub
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link to="/" className="text-slate-600 hover:text-brand-700">
            Produtos
          </Link>
          {client ? (
            <>
              <Link to="/minhas-interacoes" className="text-slate-600 hover:text-brand-700">
                Minhas interações
              </Link>
              <span className="text-slate-500 hidden sm:inline">Olá, {client.name.split(' ')[0]}</span>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="btn-secondary py-1.5"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary py-1.5">
                Entrar
              </Link>
              <Link to="/cadastro" className="btn-primary py-1.5">
                Cadastrar
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
