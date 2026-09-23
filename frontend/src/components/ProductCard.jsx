import { Link } from 'react-router-dom';
import RatingStars from './RatingStars';
import { formatPrice } from '../utils/format';

export default function ProductCard({ product }) {
  return (
    <Link
      to={`/produtos/${product.id}`}
      className="card overflow-hidden flex flex-col hover:shadow-md hover:border-neutral-400 transition"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm text-neutral-400">Sem imagem</div>
        )}
        {product.destaque && (
          <span className="absolute top-2 left-2 bg-black text-white text-xs font-semibold px-2 py-1 rounded-full">
            ★ Destaque
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col gap-1 flex-1">
        <span className="text-xs uppercase tracking-wide text-neutral-500">{product.category}</span>
        <h3 className="font-semibold text-neutral-900 leading-snug">{product.name}</h3>
        <div className="flex items-center gap-1 text-sm">
          <RatingStars value={product.avg_rating} size="text-sm" />
          <span className="text-neutral-400 text-xs">({product.ratings_count || 0})</span>
        </div>
        <div className="mt-auto pt-2 font-bold text-black">{formatPrice(product.price)}</div>
      </div>
    </Link>
  );
}
