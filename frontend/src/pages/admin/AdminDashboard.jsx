import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend
} from 'recharts';
import api, { withAdminAuth } from '../../api/client';
import { INTERACTION_STATUS, INTERACTION_TYPES } from '../../constants';

const COLORS = ['#3b5cff', '#f5b301', '#22c55e', '#ef4444', '#8b5cf6', '#06b6d4'];

function StatCard({ label, value }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get('/dashboard/overview', withAdminAuth())
      .then((res) => setData(res.data))
      .catch(() => setError(true));
  }, []);

  if (error) return <div className="p-8 text-red-600">Não foi possível carregar o dashboard.</div>;
  if (!data) return <div className="p-8">Carregando dashboard...</div>;

  const byType = data.interactionsByType.map((d) => ({ ...d, label: INTERACTION_TYPES[d.type] ?? d.type }));
  const byStatus = data.interactionsByStatus.map((d) => ({
    ...d,
    label: INTERACTION_STATUS[d.status]?.label ?? d.status
  }));

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Visão geral do sistema</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Produtos cadastrados" value={data.totals.products} />
        <StatCard label="Clientes cadastrados" value={data.totals.clients} />
        <StatCard label="Interações totais" value={data.totals.interactions} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-4">
          <h2 className="font-semibold text-sm mb-3">Interações por tipo</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byType}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b5cff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4">
          <h2 className="font-semibold text-sm mb-3">Interações por status</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={byStatus} dataKey="count" nameKey="label" outerRadius={90} label>
                {byStatus.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4">
          <h2 className="font-semibold text-sm mb-3">Produtos por categoria</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.productsByCategory} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} fontSize={12} />
              <YAxis type="category" dataKey="category" width={100} fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" fill="#22c55e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4">
          <h2 className="font-semibold text-sm mb-3">Interações nos últimos 30 dias</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.interactionsLast30Days}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" fontSize={10} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#f5b301" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-4">
        <h2 className="font-semibold text-sm mb-3">Top 5 produtos mais bem avaliados</h2>
        <ul className="divide-y divide-slate-100">
          {data.topRatedProducts.map((p) => (
            <li key={p.name} className="py-2 flex justify-between text-sm">
              <span>{p.name}</span>
              <span className="text-slate-500">
                {p.avg_rating} ★ ({p.ratings_count} avaliações)
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
