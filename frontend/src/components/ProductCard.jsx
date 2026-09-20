import { Link } from 'react-router-dom';
import RatingStars from './RatingStars';

const formatPrice = (value) =>
  Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function ProductCard({ product }) {
  return (
    <Link to={`/produtos/${product.id}`} className="card overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      <div className="relative aspect-[4/3] bg-slate-100">
        {product.image_url && (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
        )}
        {product.destaque && (
          <span className="absolute top-2 left-2 bg-amber-400 text-amber-950 text-xs font-semibold px-2 py-1 rounded-full">
            ⭐ Destaque
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col gap-1 flex-1">
        <span className="text-xs text-slate-500">{product.category}</span>
        <h3 className="font-semibold text-slate-800 leading-snug">{product.name}</h3>
        <div className="flex items-center gap-1 text-sm">
          <RatingStars value={product.avg_rating} size="text-sm" />
          <span className="text-slate-400 text-xs">({product.ratings_count || 0})</span>
        </div>
        <div className="mt-auto pt-2 font-bold text-brand-700">{formatPrice(product.price)}</div>
      </div>
    </Link>
  );
}
