const request = require('supertest');
const app = require('../src/app');

const respostaNasa = {
  date: '2024-01-15',
  title: 'Título da imagem',
  explanation: 'Texto explicativo.',
  media_type: 'image',
  url: 'https://apod.nasa.gov/apod/image/exemplo.jpg',
  hdurl: 'https://apod.nasa.gov/apod/image/exemplo_hd.jpg',
  copyright: 'Nome do autor',
};

// Simula uma resposta do fetch
function respostaFetch(status, corpo) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => corpo,
  };
}

const fetchOriginal = global.fetch;

// O fetch é simulado: os testes nunca chamam a NASA de verdade
beforeEach(() => {
  global.fetch = jest.fn();
});

afterAll(() => {
  global.fetch = fetchOriginal;
});

describe('GET /apod', () => {
  it('retorna 200 e os campos esperados quando o fetch responde com sucesso', async () => {
    global.fetch.mockResolvedValue(respostaFetch(200, respostaNasa));

    const res = await request(app).get('/apod');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual(respostaNasa);
  });

  it('não quebra quando hdurl e copyright não existem (vídeo)', async () => {
    const { hdurl, copyright, ...video } = respostaNasa;
    global.fetch.mockResolvedValue(respostaFetch(200, { ...video, media_type: 'video' }));

    const res = await request(app).get('/apod');
    expect(res.status).toBe(200);
    expect(res.body.media_type).toBe('video');
    expect(res.body).not.toHaveProperty('hdurl');
    expect(res.body).not.toHaveProperty('copyright');
  });

  it('repassa o parâmetro date ao fetch quando informado', async () => {
    global.fetch.mockResolvedValue(respostaFetch(200, respostaNasa));

    await request(app).get('/apod?date=2024-01-15');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, opcoes] = global.fetch.mock.calls[0];
    expect(url).toContain('https://api.nasa.gov/planetary/apod?');
    expect(url).toContain('date=2024-01-15');
    expect(url).toContain('api_key=');
    expect(opcoes.signal).toBeDefined(); // timeout configurado
  });

  it('não envia date ao fetch quando omitido', async () => {
    global.fetch.mockResolvedValue(respostaFetch(200, respostaNasa));

    await request(app).get('/apod');
    expect(global.fetch.mock.calls[0][0]).not.toContain('date=');
  });

  it.each(['15-01-2024', 'abc', '2024-13-45', '2024-02-30'])(
    'retorna 400 para date inválido (%s), sem chamar o fetch',
    async (date) => {
      const res = await request(app).get('/apod').query({ date });
      expect(res.status).toBe(400);
      expect(res.headers['content-type']).toMatch(/application\/json/);
      expect(res.body).toHaveProperty('erro');
      expect(global.fetch).not.toHaveBeenCalled();
    }
  );

  it('retorna 400 quando a NASA rejeita a data', async () => {
    global.fetch.mockResolvedValue(respostaFetch(400, { msg: 'Data fora do intervalo' }));

    const res = await request(app).get('/apod?date=1990-01-01');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ erro: 'Data fora do intervalo' });
  });

  it('retorna 400 com mensagem padrão quando a NASA rejeita sem corpo JSON', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => { throw new Error('sem corpo'); },
    });

    const res = await request(app).get('/apod?date=1990-01-01');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('erro');
  });

  it('retorna 429 quando o limite da chave é atingido', async () => {
    global.fetch.mockResolvedValue(respostaFetch(429, {}));

    const res = await request(app).get('/apod');
    expect(res.status).toBe(429);
    expect(res.body).toHaveProperty('erro');
  });

  it('retorna 502 quando o fetch rejeita com erro de rede', async () => {
    global.fetch.mockRejectedValue(new TypeError('fetch failed'));

    const res = await request(app).get('/apod');
    expect(res.status).toBe(502);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toHaveProperty('erro');
  });

  it('retorna 502 quando a NASA responde com erro 500', async () => {
    global.fetch.mockResolvedValue(respostaFetch(500, {}));

    const res = await request(app).get('/apod');
    expect(res.status).toBe(502);
  });

  it('retorna 502 quando a resposta da NASA é inválida', async () => {
    global.fetch.mockResolvedValue(respostaFetch(200, 'resposta estranha'));

    const res = await request(app).get('/apod');
    expect(res.status).toBe(502);
    expect(res.body).toHaveProperty('erro');
  });

  it('retorna 502 quando o corpo da resposta não é JSON', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => { throw new Error('JSON inválido'); },
    });

    const res = await request(app).get('/apod');
    expect(res.status).toBe(502);
  });

  it('retorna 504 em caso de timeout (TimeoutError)', async () => {
    const erro = new Error('timeout');
    erro.name = 'TimeoutError';
    global.fetch.mockRejectedValue(erro);

    const res = await request(app).get('/apod');
    expect(res.status).toBe(504);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toHaveProperty('erro');
  });
});