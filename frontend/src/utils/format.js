export const formatPrice = (value) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const formatDateTime = (value) => new Date(value).toLocaleString('pt-BR');
