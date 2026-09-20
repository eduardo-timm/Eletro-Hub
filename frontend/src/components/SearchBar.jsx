import { useState } from 'react';

export default function SearchBar({ categories, onSearch, onShowDestaques }) {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('recentes');

  function submit(e) {
    e.preventDefault();
    onSearch({ q, category, sort });
  }

  return (
    <form onSubmit={submit} className="card p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
      <div className="flex-1">
        <label className="text-xs font-medium text-slate-500">Buscar</label>
        <input
          className="input"
          placeholder="Nome, marca ou categoria..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500">Categoria</label>
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Todas</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500">Ordenar por</label>
        <select className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="recentes">Mais recentes</option>
          <option value="avaliados">Melhor avaliados</option>
          <option value="preco_asc">Menor preço</option>
          <option value="preco_desc">Maior preço</option>
        </select>
      </div>

      <div className="flex gap-2">
        <button type="submit" className="btn-primary">
          Filtrar
        </button>
        <button
          type="button"
          onClick={() => {
            setQ('');
            setCategory('');
            setSort('recentes');
            onShowDestaques();
          }}
          className="btn-secondary whitespace-nowrap"
        >
          ⭐ Ver destaques
        </button>
      </div>
    </form>
  );
}
