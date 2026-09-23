import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import Logo from './Logo';

const linkClass = ({ isActive }) =>
  `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive ? 'bg-white text-black' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
  }`;

export default function AdminSidebar() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  return (
    <aside className="w-56 shrink-0 bg-black min-h-screen p-4 flex flex-col gap-1">
      <div className="mb-6 px-2">
        <Logo suffix="Admin" />
      </div>
      <NavLink to="/admin" end className={linkClass}>
        Dashboard
      </NavLink>
      <NavLink to="/admin/produtos" className={linkClass}>
        Produtos
      </NavLink>
      <NavLink to="/admin/interacoes" className={linkClass}>
        Interações
      </NavLink>

      <div className="mt-auto pt-4 border-t border-neutral-800 text-xs text-neutral-400">
        <div className="px-2 mb-2">{admin?.name}</div>
        <button
          onClick={() => {
            logout();
            navigate('/admin/login');
          }}
          className="w-full border border-neutral-700 text-white hover:bg-neutral-900 px-4 py-2 rounded-lg transition-colors"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
