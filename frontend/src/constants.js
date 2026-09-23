// Espelham os CHECKs da tabela `interactions` em backend/src/db/schema.sql.
export const INTERACTION_TYPES = {
  proposta: 'Proposta',
  avaliacao: 'Avaliação',
  agendamento: 'Agendamento',
  reserva: 'Reserva'
};

// Tema monocromatico: os status se diferenciam por contorno, preenchimento e risco, nao por cor.
export const INTERACTION_STATUS = {
  pendente: { label: 'Pendente', color: 'bg-white text-neutral-900 border border-neutral-900' },
  respondido: { label: 'Respondido', color: 'bg-neutral-200 text-neutral-900' },
  confirmado: { label: 'Confirmado', color: 'bg-black text-white' },
  cancelado: { label: 'Cancelado', color: 'bg-neutral-100 text-neutral-400 line-through' }
};
