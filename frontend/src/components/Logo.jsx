// Logo monocromatico pensado para fundo preto (navbar e menu admin).
export default function Logo({ suffix }) {
  return (
    <span className="flex items-center gap-2 font-bold text-lg text-white tracking-tight">
      <span className="w-7 h-7 bg-white text-black rounded-md flex items-center justify-center text-sm font-black">
        E
      </span>
      EletroHub
      {suffix && <span className="text-neutral-400 font-medium">{suffix}</span>}
    </span>
  );
}
