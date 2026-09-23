import { useEffect, useState } from 'react';
import api, { withAdminAuth } from '../../api/client';
import { INTERACTION_STATUS, INTERACTION_TYPES } from '../../constants';
import { formatDateTime, formatPrice } from '../../utils/format';

function StatusOptions() {
  return Object.entries(INTERACTION_STATUS).map(([value, { label }]) => (
    <option key={value} value={value}>
      {label}
    </option>
  ));
}

function InteractionRow({ interaction, onChanged }) {
  const [response, setResponse] = useState(interaction.admin_response || '');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  async function run(action) {
    setBusy(true);
    setNotice(null);
    try {
      await action();
    } catch (err) {
      setNotice(err.response?.data?.error || 'Erro ao executar a ação.');
    } finally {
      setBusy(false);
    }
  }

  const respond = () =>
    run(async () => {
      await api.put(`/interactions/${interaction.id}/respond`, { admin_response: response }, withAdminAuth());
      onChanged();
    });

  const setStatus = (status) =>
    run(async () => {
      await api.put(`/interactions/${interaction.id}/status`, { status }, withAdminAuth());
      onChanged();
    });

  const sendEmail = () =>
    run(async () => {
      const res = await api.post(`/interactions/${interaction.id}/send-email`, {}, withAdminAuth());
      setNotice(res.data.simulated ? 'E-mail simulado (configure SMTP no backend para envio real).' : 'E-mail enviado!');
    });

  const remove = () => {
    if (!confirm('Excluir esta interação?')) return;
    run(async () => {
      await api.delete(`/interactions/${interaction.id}`, withAdminAuth());
      onChanged();
    });
  };

  return (
    <div className="card p-4 space-y-2">
      <div className="flex justify-between items-start gap-3 flex-wrap">
        <div>
          <span className="text-xs text-slate-500">
            {INTERACTION_TYPES[interaction.type]} · {interaction.product_name}
          </span>
          <p className="font-medium text-slate-800">
            {interaction.client_name} <span className="text-slate-400 font-normal">({interaction.client_email})</span>
          </p>
        </div>
        <select
          value={interaction.status}
          onChange={(e) => setStatus(e.target.value)}
          disabled={busy}
          className="input w-auto text-xs"
        >
          <StatusOptions />
        </select>
      </div>

      {interaction.rating && <p className="text-sm">Nota: {interaction.rating} ★</p>}
      {interaction.message && <p className="text-sm text-slate-600">"{interaction.message}"</p>}
      {interaction.proposed_price && (
        <p className="text-sm text-slate-600">Valor proposto: {formatPrice(interaction.proposed_price)}</p>
      )}
      {interaction.scheduled_at && (
        <p className="text-sm text-slate-600">Agendado para: {formatDateTime(interaction.scheduled_at)}</p>
      )}

      <textarea
        className="input"
        rows={2}
        placeholder="Escreva uma resposta para o cliente..."
        value={response}
        onChange={(e) => setResponse(e.target.value)}
      />

      <div className="flex flex-wrap gap-2">
        <button onClick={respond} disabled={busy} className="btn-primary text-sm">
          Responder
        </button>
        <button onClick={sendEmail} disabled={busy} className="btn-secondary text-sm">
          Enviar por e-mail
        </button>
        <button onClick={remove} disabled={busy} className="text-red-600 text-sm hover:underline">
          Excluir
        </button>
      </div>
      {notice && <p className="text-xs text-slate-500">{notice}</p>}
      <p className="text-xs text-slate-400">{formatDateTime(interaction.created_at)}</p>
    </div>
  );
}

export default function AdminInteractions() {
  const [interactions, setInteractions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    load();
  }, [statusFilter]);

  function load() {
    setLoading(true);
    setError(null);
    api
      .get('/interactions', { ...withAdminAuth(), params: statusFilter ? { status: statusFilter } : {} })
      .then((res) => setInteractions(res.data.interactions))
      .catch(() => setError('Não foi possível carregar as interações.'))
      .finally(() => setLoading(false));
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Interações dos clientes</h1>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-auto">
          <option value="">Todos os status</option>
          <StatusOptions />
        </select>
      </div>

      {loading ? (
        <p className="text-slate-500">Carregando...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : interactions.length === 0 ? (
        <p className="text-slate-500">Nenhuma interação encontrada.</p>
      ) : (
        <div className="space-y-3">
          {interactions.map((i) => (
            <InteractionRow key={i.id} interaction={i} onChanged={load} />
          ))}
        </div>
      )}
    </div>
  );
}
