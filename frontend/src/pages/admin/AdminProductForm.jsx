import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { withAdminAuth } from '../../api/client';

const EMPTY = {
  name: '',
  brand: '',
  category: '',
  description: '',
  price: '',
  stock_quantity: 0,
  image_url: '',
  destaque: false
};

export default function AdminProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/products/${id}`).then((res) => {
      const p = res.data.product;
      setForm({
        name: p.name,
        brand: p.brand || '',
        category: p.category,
        description: p.description || '',
        price: p.price,
        stock_quantity: p.stock_quantity,
        image_url: p.image_url || '',
        destaque: p.destaque
      });
      setLoading(false);
    });
  }, [id]);

  function update(field) {
    return (e) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      setForm((f) => ({ ...f, [field]: value }));
    };
  }

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price), stock_quantity: Number(form.stock_quantity) };
      if (isEdit) {
        await api.put(`/products/${id}`, payload, withAdminAuth());
      } else {
        await api.post('/products', payload, withAdminAuth());
      }
      navigate('/admin/produtos');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar produto.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Carregando...</div>;

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">{isEdit ? 'Editar produto' : 'Novo produto'}</h1>

      <form onSubmit={submit} className="card p-5 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-neutral-500">Nome</label>
            <input className="input" required value={form.name} onChange={update('name')} />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500">Marca</label>
            <input className="input" value={form.brand} onChange={update('brand')} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-neutral-500">Categoria</label>
            <input className="input" required value={form.category} onChange={update('category')} />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500">URL da imagem</label>
            <input className="input" value={form.image_url} onChange={update('image_url')} />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-500">Descrição</label>
          <textarea className="input" rows={3} value={form.description} onChange={update('description')} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-neutral-500">Preço (R$)</label>
            <input className="input" type="number" min="0" step="0.01" required value={form.price} onChange={update('price')} />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500">Estoque</label>
            <input className="input" type="number" min="0" value={form.stock_quantity} onChange={update('stock_quantity')} />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input id="destaque" type="checkbox" checked={form.destaque} onChange={update('destaque')} />
            <label htmlFor="destaque" className="text-sm text-neutral-600">
              Produto em destaque
            </label>
          </div>
        </div>

        {error && <p className="text-error">{error}</p>}

        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <button type="button" onClick={() => navigate('/admin/produtos')} className="btn-secondary">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
