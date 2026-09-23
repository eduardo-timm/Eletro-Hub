// Espelham os CHECKs da tabela `interactions` em backend/src/db/schema.sql.
export const INTERACTION_TYPES = {
  proposta: 'Proposta',
  avaliacao: 'Avaliação',
  agendamento: 'Agendamento',
  reserva: 'Reserva'
};

export const INTERACTION_STATUS = {
  pendente: { label: 'Pendente', color: 'bg-amber-100 text-amber-800' },
  respondido: { label: 'Respondido', color: 'bg-blue-100 text-blue-800' },
  confirmado: { label: 'Confirmado', color: 'bg-green-100 text-green-800' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-800' }
};
