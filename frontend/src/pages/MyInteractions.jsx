import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { withClientAuth } from '../api/client';
import RatingStars from '../components/RatingStars';
import { INTERACTION_STATUS, INTERACTION_TYPES } from '../constants';
import { formatDateTime, formatPrice } from '../utils/format';

export default function MyInteractions() {
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get('/interactions/mine', withClientAuth())
      .then((res) => setInteractions(res.data.interactions))
      .catch(() => setError('Não foi possível carregar suas interações.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Minhas interações</h1>

      {loading ? (
        <p className="text-neutral-700">Carregando...</p>
      ) : error ? (
        <p className="text-error">{error}</p>
      ) : interactions.length === 0 ? (
        <p className="text-neutral-700">Você ainda não interagiu com nenhum produto.</p>
      ) : (
        <div className="space-y-4">
          {interactions.map((i) => {
            const status = INTERACTION_STATUS[i.status];
            return (
              <div key={i.id} className="card p-4">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <span className="text-xs text-neutral-500">{INTERACTION_TYPES[i.type]}</span>
                    <Link
                      to={`/produtos/${i.product_id}`}
                      className="block font-semibold text-neutral-800 hover:text-brand-700"
                    >
                      {i.product_name}
                    </Link>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.color}`}>{status.label}</span>
                </div>

                {i.rating && (
                  <div className="mt-2">
                    <RatingStars value={i.rating} />
                  </div>
                )}
                {i.message && <p className="text-sm text-neutral-600 mt-2">"{i.message}"</p>}
                {i.proposed_price && (
                  <p className="text-sm text-neutral-600 mt-1">Valor proposto: {formatPrice(i.proposed_price)}</p>
                )}
                {i.scheduled_at && (
                  <p className="text-sm text-neutral-600 mt-1">Data agendada: {formatDateTime(i.scheduled_at)}</p>
                )}

                {i.admin_response && (
                  <div className="mt-3 bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-sm">
                    <span className="font-medium text-neutral-700">Resposta da loja:</span>
                    <p className="text-neutral-600 mt-1">{i.admin_response}</p>
                  </div>
                )}

                <p className="text-xs text-neutral-400 mt-2">{formatDateTime(i.created_at)}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
