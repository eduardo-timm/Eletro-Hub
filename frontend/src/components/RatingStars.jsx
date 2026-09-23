export default function RatingStars({ value = 0, size = 'text-base', onChange }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <span className={`inline-flex gap-0.5 ${size}`}>
      {stars.map((s) => (
        <span
          key={s}
          onClick={onChange ? () => onChange(s) : undefined}
          className={onChange ? 'cursor-pointer' : ''}
          style={{ color: s <= Math.round(value) ? '#000000' : '#d4d4d4' }}
        >
          ★
        </span>
      ))}
    </span>
  );
}
