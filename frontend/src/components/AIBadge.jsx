// Mostra dados adicionais obtidos via consulta a plataforma de IA, deixando
// explicito que a informacao nao veio do cadastro manual do produto.
export default function AIBadge({ insights, loading }) {
  if (loading) {
    return (
      <div className="card p-4 bg-violet-50 border-violet-200 animate-pulse text-sm text-violet-700">
        Consultando IA para gerar dados adicionais...
      </div>
    );
  }

  if (!insights) return null;

  const hasContent = insights.curiosidade || insights.dica_de_uso || insights.publico_indicado;

  return (
    <div className="card p-4 bg-violet-50 border-violet-200">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🤖</span>
        <span className="text-xs font-semibold uppercase tracking-wide text-violet-700">
          Dados obtidos por consulta à IA ({insights.source})
        </span>
      </div>

      {hasContent ? (
        <ul className="text-sm text-slate-700 space-y-1">
          {insights.curiosidade && (
            <li>
              <strong>Curiosidade:</strong> {insights.curiosidade}
            </li>
          )}
          {insights.dica_de_uso && (
            <li>
              <strong>Dica de uso:</strong> {insights.dica_de_uso}
            </li>
          )}
          {insights.publico_indicado && (
            <li>
              <strong>Indicado para:</strong> {insights.publico_indicado}
            </li>
          )}
        </ul>
      ) : (
        <p className="text-sm text-violet-700">{insights.curiosidade || insights.erro || 'Sem dados no momento.'}</p>
      )}
    </div>
  );
}
