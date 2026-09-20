import { useEffect, useState } from 'react';
import api from '../api/client';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';
import AIBadge from '../components/AIBadge';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('Últimos cadastrados');
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProductName, setAiProductName] = useState('');

  useEffect(() => {
    api.get('/products/categories').then((res) => setCategories(res.data.categories));
    loadRecent();
    loadTopRated();
  }, []);

  async function loadRecent() {
    setLoading(true);
    setTitle('Últimos cadastrados');
    const res = await api.get('/products', { params: { sort: 'recentes' } });
    setProducts(res.data.products);
    setLoading(false);
  }

  async function loadDestaques() {
    setLoading(true);
    setTitle('⭐ Produtos em destaque');
    const res = await api.get('/products', { params: { destaque: 'true' } });
    setProducts(res.data.products);
    setLoading(false);
  }

  async function loadTopRated() {
    const res = await api.get('/products', { params: { sort: 'avaliados' } });
    const best = res.data.products.find((p) => Number(p.ratings_count) > 0) || res.data.products[0];
    if (!best) return;
    setAiProductName(best.name);
    setAiLoading(true);
    try {
      const insightsRes = await api.get(`/products/${best.id}/ai-insights`);
      setAiInsights(insightsRes.data.insights);
    } finally {
      setAiLoading(false);
    }
  }

  async function search({ q, category, sort }) {
    setLoading(true);
    setTitle('Resultado da busca');
    const res = await api.get('/products', { params: { q: q || undefined, category: category || undefined, sort } });
    setProducts(res.data.products);
    setLoading(false);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <section className="text-center py-6">
        <h1 className="text-3xl font-bold text-slate-900">Eletrônicos com o melhor custo-benefício</h1>
        <p className="text-slate-500 mt-2">Explore, avalie, reserve e negocie diretamente com a nossa loja.</p>
      </section>

      {aiProductName && (
        <section>
          <p className="text-xs text-slate-400 mb-1">Em destaque na página principal — {aiProductName}</p>
          <AIBadge insights={aiInsights} loading={aiLoading} />
        </section>
      )}

      <SearchBar categories={categories} onSearch={search} onShowDestaques={loadDestaques} />

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button onClick={loadRecent} className="text-sm text-brand-600 hover:underline">
            Ver últimos cadastrados
          </button>
        </div>

        {loading ? (
          <p className="text-slate-500">Carregando produtos...</p>
        ) : products.length === 0 ? (
          <p className="text-slate-500">Nenhum produto encontrado.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
