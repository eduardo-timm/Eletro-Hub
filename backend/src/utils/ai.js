// Integracao com a API da Anthropic (Claude) para enriquecer os produtos
// com dados adicionais. Funciona de verdade assim que ANTHROPIC_API_KEY
// for definida no .env; sem a key, devolve um resultado "nao configurado"
// para que o front-end ainda mostre, de forma transparente, de onde os
// dados viriam.

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

async function fetchAiInsights(product) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return {
      configured: false,
      source: 'IA (nao configurada)',
      generated_at: new Date().toISOString(),
      curiosidade: 'Integracao com IA pronta no backend. Defina ANTHROPIC_API_KEY no .env para gerar dados reais para este produto.',
      dica_de_uso: null,
      publico_indicado: null
    };
  }

  const prompt = `Voce e um assistente de uma loja de eletronicos. Para o produto abaixo, gere um JSON (somente o JSON, sem texto extra) com os campos:
- "curiosidade": uma curiosidade tecnica breve e verdadeira sobre esse tipo de produto (1-2 frases)
- "dica_de_uso": uma dica pratica de uso ou cuidado com o produto (1 frase)
- "publico_indicado": para qual tipo de usuario esse produto e mais indicado (1 frase curta)

Produto: ${product.name} (marca ${product.brand || 'generica'}, categoria ${product.category})
Descricao: ${product.description || 'sem descricao'}
Especificacoes: ${JSON.stringify(product.specs || {})}`;

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Anthropic API respondeu ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const text = data?.content?.[0]?.text || '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return {
      configured: true,
      source: 'Anthropic Claude API',
      generated_at: new Date().toISOString(),
      curiosidade: parsed.curiosidade || null,
      dica_de_uso: parsed.dica_de_uso || null,
      publico_indicado: parsed.publico_indicado || null
    };
  } catch (err) {
    return {
      configured: true,
      source: 'Anthropic Claude API (erro na chamada)',
      generated_at: new Date().toISOString(),
      erro: err.message,
      curiosidade: null,
      dica_de_uso: null,
      publico_indicado: null
    };
  }
}

module.exports = { fetchAiInsights };
