import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { withClientAuth } from '../api/client';
import RatingStars from '../components/RatingStars';

const STATUS_LABELS = {
  pendente: { text: 'Pendente', color: 'bg-amber-100 text-amber-800' },
  respondido: { text: 'Respondido', color: 'bg-blue-100 text-blue-800' },
  confirmado: { text: 'Confirmado', color: 'bg-green-100 text-green-800' },
  cancelado: { text: 'Cancelado', color: 'bg-red-100 text-red-800' }
};

const TYPE_LABELS = {
  proposta: 'Proposta',
  avaliacao: 'Avaliação',
  agendamento: 'Agendamento',
  reserva: 'Reserva'
};

export default function MyInteractions() {
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/interactions/mine', withClientAuth()).then((res) => {
      setInteractions(res.data.interactions);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Minhas interações</h1>

      {loading ? (
        <p className="text-slate-500">Carregando...</p>
      ) : interactions.length === 0 ? (
        <p className="text-slate-500">Você ainda não interagiu com nenhum produto.</p>
      ) : (
        <div className="space-y-4">
          {interactions.map((i) => (
            <div key={i.id} className="card p-4">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <span className="text-xs text-slate-500">{TYPE_LABELS[i.type]}</span>
                  <Link to={`/produtos/${i.product_id}`} className="block font-semibold text-slate-800 hover:text-brand-700">
                    {i.product_name}
                  </Link>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_LABELS[i.status].color}`}>
                  {STATUS_LABELS[i.status].text}
                </span>
              </div>

              {i.rating && (
                <div className="mt-2">
                  <RatingStars value={i.rating} />
                </div>
              )}
              {i.message && <p className="text-sm text-slate-600 mt-2">"{i.message}"</p>}
              {i.proposed_price && (
                <p className="text-sm text-slate-600 mt-1">
                  Valor proposto: R$ {Number(i.proposed_price).toLocaleString('pt-BR')}
                </p>
              )}
              {i.scheduled_at && (
                <p className="text-sm text-slate-600 mt-1">
                  Data agendada: {new Date(i.scheduled_at).toLocaleString('pt-BR')}
                </p>
              )}

              {i.admin_response && (
                <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm">
                  <span className="font-medium text-slate-700">Resposta da loja:</span>
                  <p className="text-slate-600 mt-1">{i.admin_response}</p>
                </div>
              )}

              <p className="text-xs text-slate-400 mt-2">{new Date(i.created_at).toLocaleString('pt-BR')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
