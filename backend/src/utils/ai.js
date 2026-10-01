// Integracao com a API do Google Gemini para enriquecer os produtos
// com dados adicionais. Funciona de verdade assim que GEMINI_API_KEY
// for definida no .env; sem a key, devolve um resultado "nao configurado"
// para que o front-end ainda mostre, de forma transparente, de onde os
// dados viriam.

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

async function fetchAiInsights(product) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      configured: false,
      source: 'IA (nao configurada)',
      generated_at: new Date().toISOString(),
      curiosidade: 'Integracao com IA pronta no backend. Defina GEMINI_API_KEY no .env para gerar dados reais para este produto.',
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
    const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';
    const res = await fetch(`${GEMINI_URL}/${model}:generateContent`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 400, responseMimeType: 'application/json' }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API respondeu ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return {
      configured: true,
      source: 'Google Gemini API',
      generated_at: new Date().toISOString(),
      curiosidade: parsed.curiosidade || null,
      dica_de_uso: parsed.dica_de_uso || null,
      publico_indicado: parsed.publico_indicado || null
    };
  } catch (err) {
    return {
      configured: true,
      source: 'Google Gemini API (erro na chamada)',
      generated_at: new Date().toISOString(),
      erro: err.message,
      curiosidade: null,
      dica_de_uso: null,
      publico_indicado: null
    };
  }
}

module.exports = { fetchAiInsights };
