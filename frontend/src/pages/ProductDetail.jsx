import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { withClientAuth } from '../api/client';
import { useClientAuth } from '../context/ClientAuthContext';
import RatingStars from '../components/RatingStars';
import AIBadge from '../components/AIBadge';
import { formatPrice } from '../utils/format';

const ACTION_LABELS = {
  proposta: 'Fazer uma proposta',
  avaliacao: 'Avaliar produto',
  agendamento: 'Agendar visita/avaliação',
  reserva: 'Reservar produto'
};

export default function ProductDetail() {
  const { id } = useParams();
  const { client } = useClientAuth();
  const [product, setProduct] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [type, setType] = useState('proposta');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [proposedPrice, setProposedPrice] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  useEffect(() => {
    setProduct(null);
    setLoadError(false);
    loadProduct();
    loadInsights();
  }, [id]);

  // O banco aceita uma avaliacao por cliente/produto; checar antes evita preencher o formulario a toa.
  useEffect(() => {
    setAlreadyReviewed(false);
    if (!client) return;
    api
      .get('/interactions/mine', withClientAuth())
      .then((res) =>
        setAlreadyReviewed(res.data.interactions.some((i) => i.product_id === id && i.type === 'avaliacao'))
      )
      .catch(() => {});
  }, [client, id]);

  async function loadProduct() {
    try {
      const res = await api.get(`/products/${id}`);
      setProduct(res.data.product);
    } catch {
      setLoadError(true);
    }
  }

  async function loadInsights() {
    setAiLoading(true);
    try {
      const res = await api.get(`/products/${id}/ai-insights`);
      setAiInsights(res.data.insights);
    } catch {
      setAiInsights(null);
    } finally {
      setAiLoading(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setFeedback(null);
    setSubmitting(true);
    try {
      await api.post(
        '/interactions',
        {
          product_id: id,
          type,
          message: message || null,
          rating: type === 'avaliacao' ? rating : undefined,
          proposed_price: type === 'proposta' ? proposedPrice || null : undefined,
          scheduled_at: type === 'agendamento' ? scheduledAt || null : undefined
        },
        withClientAuth()
      );
      setFeedback({ ok: true, text: 'Interação enviada com sucesso! Acompanhe em "Minhas interações".' });
      if (type === 'avaliacao') setAlreadyReviewed(true);
      setMessage('');
      setProposedPrice('');
      setScheduledAt('');
      loadProduct();
    } catch (err) {
      setFeedback({ ok: false, text: err.response?.data?.error || 'Erro ao enviar interação.' });
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-2">
        <p className="text-slate-700">Não foi possível carregar este produto.</p>
        <Link to="/" className="text-brand-600 font-medium hover:underline">
          Voltar para a loja
        </Link>
      </div>
    );
  }

  if (!product) return <div className="max-w-4xl mx-auto px-4 py-10">Carregando...</div>;

  const reviewBlocked = type === 'avaliacao' && alreadyReviewed;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="aspect-[4/3] bg-slate-100 rounded-xl overflow-hidden">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl text-slate-300">🔌</div>
          )}
        </div>
        <div>
          <span className="text-xs text-slate-500">{product.category}</span>
          <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
          <p className="text-slate-500 text-sm mb-2">{product.brand}</p>
          <div className="flex items-center gap-2 mb-3">
            <RatingStars value={product.avg_rating} />
            <span className="text-sm text-slate-500">
              {product.avg_rating || 0} ({product.ratings_count || 0} avaliações)
            </span>
          </div>
          <p className="text-slate-700 mb-4">{product.description}</p>
          <div className="text-2xl font-bold text-brand-700 mb-4">{formatPrice(product.price)}</div>

          {product.specs && Object.keys(product.specs).length > 0 && (
            <div className="card p-4 mb-4">
              <h3 className="font-semibold text-sm mb-2">Especificações</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                {Object.entries(product.specs).map(([k, v]) => (
                  <li key={k}>
                    <strong className="capitalize">{k.replace(/_/g, ' ')}:</strong> {String(v)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <AIBadge insights={aiInsights} loading={aiLoading} />

      <div className="card p-5">
        <h2 className="font-semibold text-slate-800 mb-3">Interagir com este produto</h2>

        {!client ? (
          <p className="text-sm text-slate-600">
            Você precisa estar logado para interagir com este produto.{' '}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">
              Fazer login
            </Link>{' '}
            ou{' '}
            <Link to="/cadastro" className="text-brand-600 font-medium hover:underline">
              cadastre-se
            </Link>
            .
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {Object.entries(ACTION_LABELS).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  className={`px-3 py-1.5 rounded-full text-sm border ${
                    type === value ? 'bg-brand-600 text-white border-brand-600' : 'bg-white border-slate-300 text-slate-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {type === 'avaliacao' && !reviewBlocked && (
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">Sua nota</label>
                <RatingStars value={rating} size="text-2xl" onChange={setRating} />
              </div>
            )}

            {type === 'proposta' && (
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">Valor proposto (R$)</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={proposedPrice}
                  onChange={(e) => setProposedPrice(e.target.value)}
                />
              </div>
            )}

            {type === 'agendamento' && (
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">Data/hora desejada</label>
                <input
                  className="input"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
              </div>
            )}

            {reviewBlocked ? (
              <p className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3">
                Você já avaliou este produto. Veja sua avaliação em{' '}
                <Link to="/minhas-interacoes" className="text-brand-600 font-medium hover:underline">
                  Minhas interações
                </Link>
                .
              </p>
            ) : (
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">Mensagem</label>
                <textarea className="input" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
              </div>
            )}

            {feedback && (
              <p className={`text-sm ${feedback.ok ? 'text-green-600' : 'text-red-600'}`}>{feedback.text}</p>
            )}

            {!reviewBlocked && (
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Enviando...' : 'Enviar'}
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
