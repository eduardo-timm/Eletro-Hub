import { useEffect, useState } from 'react';
import api, { withAdminAuth } from '../../api/client';

const STATUS_OPTIONS = ['pendente', 'respondido', 'confirmado', 'cancelado'];
const TYPE_LABELS = { proposta: 'Proposta', avaliacao: 'Avaliação', agendamento: 'Agendamento', reserva: 'Reserva' };

function InteractionRow({ interaction, onChanged }) {
  const [response, setResponse] = useState(interaction.admin_response || '');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  async function respond() {
    setBusy(true);
    try {
      await api.put(`/interactions/${interaction.id}/respond`, { admin_response: response }, withAdminAuth());
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(status) {
    setBusy(true);
    try {
      await api.put(`/interactions/${interaction.id}/status`, { status }, withAdminAuth());
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function sendEmail() {
    setBusy(true);
    setNotice(null);
    try {
      const res = await api.post(`/interactions/${interaction.id}/send-email`, {}, withAdminAuth());
      setNotice(res.data.simulated ? 'E-mail simulado (configure SMTP no backend para envio real).' : 'E-mail enviado!');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm('Excluir esta interação?')) return;
    setBusy(true);
    try {
      await api.delete(`/interactions/${interaction.id}`, withAdminAuth());
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-4 space-y-2">
      <div className="flex justify-between items-start gap-3 flex-wrap">
        <div>
          <span className="text-xs text-slate-500">
            {TYPE_LABELS[interaction.type]} · {interaction.product_name}
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
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {interaction.rating && <p className="text-sm">Nota: {interaction.rating} ★</p>}
      {interaction.message && <p className="text-sm text-slate-600">"{interaction.message}"</p>}
      {interaction.proposed_price && (
        <p className="text-sm text-slate-600">Valor proposto: R$ {Number(interaction.proposed_price).toLocaleString('pt-BR')}</p>
      )}
      {interaction.scheduled_at && (
        <p className="text-sm text-slate-600">Agendado para: {new Date(interaction.scheduled_at).toLocaleString('pt-BR')}</p>
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
      <p className="text-xs text-slate-400">{new Date(interaction.created_at).toLocaleString('pt-BR')}</p>
    </div>
  );
}

export default function AdminInteractions() {
  const [interactions, setInteractions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [statusFilter]);

  function load() {
    setLoading(true);
    api.get('/interactions', { ...withAdminAuth(), params: statusFilter ? { status: statusFilter } : {} }).then((res) => {
      setInteractions(res.data.interactions);
      setLoading(false);
    });
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Interações dos clientes</h1>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-auto">
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-slate-500">Carregando...</p>
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
