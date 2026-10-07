const APOD_URL = 'https://api.nasa.gov/planetary/apod';
const TIMEOUT_MS = 5000;

// Erro com status HTTP, para a rota apenas repassar ao cliente
class ErroNasa extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

async function buscarApod(date) {
  // A chave fica só no servidor; sem chave, usa DEMO_KEY
  const params = new URLSearchParams({
    api_key: process.env.NASA_API_KEY || 'DEMO_KEY',
  });
  if (date) params.append('date', date);

  let resposta;
  try {
    // signal com timeout: se a NASA demorar mais que TIMEOUT_MS, a chamada é cancelada
    resposta = await fetch(`${APOD_URL}?${params}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      throw new ErroNasa(504, 'A NASA não respondeu dentro do tempo limite');
    }
    // erro de rede (sem internet, DNS, conexão recusada...)
    throw new ErroNasa(502, 'Falha ao consultar a API da NASA');
  }

  // fetch NÃO rejeita em 400/429/500: precisamos checar resposta.ok
  if (!resposta.ok) {
    if (resposta.status === 400) {
      let msg;
      try {
        const corpo = await resposta.json();
        msg = corpo && corpo.msg;
      } catch (e) {
        // sem corpo JSON: usa a mensagem padrão
      }
      throw new ErroNasa(400, msg || 'Requisição rejeitada pela NASA (verifique a data)');
    }
    if (resposta.status === 429) {
      throw new ErroNasa(429, 'Limite de requisições da chave da NASA atingido');
    }
    throw new ErroNasa(502, 'Falha ao consultar a API da NASA');
  }

  let dados;
  try {
    dados = await resposta.json();
  } catch (e) {
    throw new ErroNasa(502, 'Resposta inesperada da NASA');
  }

  if (!dados || typeof dados !== 'object' || !dados.title || !dados.url) {
    throw new ErroNasa(502, 'Resposta inesperada da NASA');
  }

  // hdurl e copyright são opcionais (não existem em vídeos, por exemplo)
  const resultado = {
    date: dados.date,
    title: dados.title,
    explanation: dados.explanation,
    media_type: dados.media_type,
    url: dados.url,
  };
  if (dados.hdurl) resultado.hdurl = dados.hdurl;
  if (dados.copyright) resultado.copyright = dados.copyright;
  return resultado;
}

module.exports = { buscarApod, ErroNasa };
