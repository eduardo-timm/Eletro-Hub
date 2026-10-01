// Integracao com a API do Google Gemini para gerar a descricao de um produto
// a partir do nome/marca/categoria. Usada pelo botao "Gerar com IA" do
// formulario de produto do admin. Sem GEMINI_API_KEY no .env, lanca um erro
// com status 503 explicando que a integracao esta pronta mas sem credencial.

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

function aiError(status, message) {
  const err = new Error(message);
  err.status = status;
  err.expose = true;
  return err;
}

async function generateDescription(product) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw aiError(503, 'Integracao com IA pronta, mas GEMINI_API_KEY nao esta configurada no servidor.');
  }

  const prompt = `Voce e um redator de uma loja de eletronicos. Escreva a descricao comercial do produto abaixo,
em portugues do Brasil, com 2 a 3 frases (no maximo 400 caracteres), destacando os principais
diferenciais. Responda somente com o texto da descricao, sem titulo, aspas ou markdown.

Produto: ${product.name} (marca ${product.brand || 'generica'}, categoria ${product.category || 'nao informada'})
${product.description ? `Descricao atual (pode reescrever): ${product.description}` : ''}`;

  const model = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
  const res = await fetch(`${GEMINI_URL}/${model}:generateContent`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 400 }
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`Gemini API respondeu ${res.status}: ${errText}`);
    throw aiError(502, 'A IA nao conseguiu gerar a descricao agora. Tente novamente em instantes.');
  }

  const data = await res.json();
  const text = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
  if (!text) throw aiError(502, 'A IA retornou uma resposta vazia. Tente novamente.');
  return text;
}

module.exports = { generateDescription };
