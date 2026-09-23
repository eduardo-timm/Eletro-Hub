import { Link, useNavigate } from 'react-router-dom';
import { useClientAuth } from '../context/ClientAuthContext';
import Logo from './Logo';

const outlineBtn = 'border border-neutral-600 text-white hover:bg-neutral-800 px-4 py-1.5 rounded-lg transition-colors';
const solidBtn = 'bg-white text-black hover:bg-neutral-200 font-medium px-4 py-1.5 rounded-lg transition-colors';

export default function Navbar() {
  const { client, logout } = useClientAuth();
  const navigate = useNavigate();

  return (
    <header className="bg-black sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/">
          <Logo />
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link to="/" className="text-neutral-300 hover:text-white">
            Produtos
          </Link>
          {client ? (
            <>
              <Link to="/minhas-interacoes" className="text-neutral-300 hover:text-white">
                Minhas interações
              </Link>
              <span className="text-neutral-500 hidden sm:inline">Olá, {client.name.split(' ')[0]}</span>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className={outlineBtn}
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={outlineBtn}>
                Entrar
              </Link>
              <Link to="/cadastro" className={solidBtn}>
                Cadastrar
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
