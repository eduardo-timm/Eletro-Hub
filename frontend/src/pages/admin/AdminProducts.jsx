import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { withAdminAuth } from '../../api/client';
import { formatPrice } from '../../utils/format';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    api
      .get('/products')
      .then((res) => setProducts(res.data.products))
      .catch(() => alert('Não foi possível carregar os produtos.'))
      .finally(() => setLoading(false));
  }

  async function remove(id) {
    if (!confirm('Excluir este produto? Essa ação não pode ser desfeita.')) return;
    try {
      await api.delete(`/products/${id}`, withAdminAuth());
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao excluir produto.');
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Produtos</h1>
        <Link to="/admin/produtos/novo" className="btn-primary">
          + Novo produto
        </Link>
      </div>

      {loading ? (
        <p className="text-slate-500">Carregando...</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="p-3">Produto</th>
                <th className="p-3">Categoria</th>
                <th className="p-3">Preço</th>
                <th className="p-3">Estoque</th>
                <th className="p-3">Destaque</th>
                <th className="p-3">Avaliação</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="p-3 font-medium text-slate-800">{p.name}</td>
                  <td className="p-3 text-slate-500">{p.category}</td>
                  <td className="p-3">{formatPrice(p.price)}</td>
                  <td className="p-3">{p.stock_quantity}</td>
                  <td className="p-3">{p.destaque ? '⭐' : '—'}</td>
                  <td className="p-3">
                    {p.avg_rating || 0} ★ ({p.ratings_count || 0})
                  </td>
                  <td className="p-3 text-right space-x-2 whitespace-nowrap">
                    <Link to={`/admin/produtos/${p.id}/editar`} className="text-brand-600 hover:underline">
                      Editar
                    </Link>
                    <button onClick={() => remove(p.id)} className="text-red-600 hover:underline">
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
