import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';
import AIBadge from '../components/AIBadge';

const RECENT = { params: { sort: 'recentes' }, title: 'Últimos cadastrados' };
const DESTAQUES = { params: { destaque: 'true' }, title: '⭐ Produtos em destaque' };

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState(RECENT);
  const [aiProduct, setAiProduct] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    api
      .get('/products/categories')
      .then((res) => setCategories(res.data.categories))
      .catch(() => {});
    loadProducts(RECENT);
    loadAiHighlight();
  }, []);

  async function loadProducts(nextView) {
    setView(nextView);
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/products', { params: nextView.params });
      setProducts(res.data.products);
    } catch {
      setError('Não foi possível carregar os produtos.');
    } finally {
      setLoading(false);
    }
  }

  // Requisito 3: a pagina principal exibe dados obtidos via IA para o produto melhor avaliado.
  async function loadAiHighlight() {
    try {
      const res = await api.get('/products', { params: { sort: 'avaliados' } });
      const best = res.data.products.find((p) => Number(p.ratings_count) > 0) || res.data.products[0];
      if (!best) return;
      setAiProduct(best);
      setAiLoading(true);
      const insightsRes = await api.get(`/products/${best.id}/ai-insights`);
      setAiInsights(insightsRes.data.insights);
    } catch {
      setAiInsights(null);
    } finally {
      setAiLoading(false);
    }
  }

  function search({ q, category, sort }) {
    loadProducts({
      params: { q: q || undefined, category: category || undefined, sort },
      title: 'Resultado da busca'
    });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <section className="text-center py-6">
        <h1 className="text-3xl font-bold text-slate-900">Eletrônicos com o melhor custo-benefício</h1>
        <p className="text-slate-500 mt-2">Explore, avalie, reserve e negocie diretamente com a nossa loja.</p>
      </section>

      {aiProduct && (aiLoading || aiInsights) && (
        <section>
          <p className="text-xs text-slate-400 mb-1">
            Em destaque na página principal —{' '}
            <Link to={`/produtos/${aiProduct.id}`} className="hover:underline">
              {aiProduct.name}
            </Link>
          </p>
          <AIBadge insights={aiInsights} loading={aiLoading} />
        </section>
      )}

      <SearchBar categories={categories} onSearch={search} onShowDestaques={() => loadProducts(DESTAQUES)} />

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">{view.title}</h2>
          <button onClick={() => loadProducts(RECENT)} className="text-sm text-brand-600 hover:underline">
            Ver últimos cadastrados
          </button>
        </div>

        {loading ? (
          <div>
            <p className="text-slate-500">Carregando produtos...</p>
            <p className="text-xs text-slate-400 mt-1">
              Se o site ficou um tempo sem acessos, o servidor pode levar até ~30s para acordar.
            </p>
          </div>
        ) : error ? (
          <div className="card p-4 flex items-center justify-between gap-3">
            <span className="text-sm text-red-600">{error}</span>
            <button onClick={() => loadProducts(view)} className="btn-secondary text-sm">
              Tentar novamente
            </button>
          </div>
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
