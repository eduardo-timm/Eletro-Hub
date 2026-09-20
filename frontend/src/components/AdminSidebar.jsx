import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

const linkClass = ({ isActive }) =>
  `block px-3 py-2 rounded-lg text-sm font-medium ${
    isActive ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'
  }`;

export default function AdminSidebar() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  return (
    <aside className="w-56 shrink-0 border-r border-slate-200 bg-white min-h-screen p-4 flex flex-col gap-1">
      <div className="font-bold text-brand-700 mb-4 px-2">🔌 EletroHub Admin</div>
      <NavLink to="/admin" end className={linkClass}>
        Dashboard
      </NavLink>
      <NavLink to="/admin/produtos" className={linkClass}>
        Produtos
      </NavLink>
      <NavLink to="/admin/interacoes" className={linkClass}>
        Interações
      </NavLink>

      <div className="mt-auto pt-4 border-t border-slate-200 text-xs text-slate-500">
        <div className="px-2 mb-2">{admin?.name}</div>
        <button
          onClick={() => {
            logout();
            navigate('/admin/login');
          }}
          className="btn-secondary w-full"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
