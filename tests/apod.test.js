// O axios é simulado: os testes nunca chamam a NASA de verdade
jest.mock('axios');

const axios = require('axios');
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

beforeEach(() => {
  axios.get.mockReset();
});

describe('GET /apod', () => {
  it('retorna 200 e os campos esperados quando o axios responde com sucesso', async () => {
    axios.get.mockResolvedValue({ data: respostaNasa });

    const res = await request(app).get('/apod');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual(respostaNasa);
  });

  it('não quebra quando hdurl e copyright não existem (vídeo)', async () => {
    const { hdurl, copyright, ...video } = respostaNasa;
    axios.get.mockResolvedValue({ data: { ...video, media_type: 'video' } });

    const res = await request(app).get('/apod');
    expect(res.status).toBe(200);
    expect(res.body.media_type).toBe('video');
    expect(res.body).not.toHaveProperty('hdurl');
    expect(res.body).not.toHaveProperty('copyright');
  });

  it('repassa o parâmetro date ao axios quando informado', async () => {
    axios.get.mockResolvedValue({ data: respostaNasa });

    await request(app).get('/apod?date=2024-01-15');
    expect(axios.get).toHaveBeenCalledTimes(1);
    const [url, config] = axios.get.mock.calls[0];
    expect(url).toBe('https://api.nasa.gov/planetary/apod');
    expect(config.params.date).toBe('2024-01-15');
    expect(config.params.api_key).toBeDefined();
    expect(config.timeout).toBe(5000);
  });

  it('não envia date ao axios quando omitido', async () => {
    axios.get.mockResolvedValue({ data: respostaNasa });

    await request(app).get('/apod');
    expect(axios.get.mock.calls[0][1].params).not.toHaveProperty('date');
  });

  it.each(['15-01-2024', 'abc', '2024-13-45', '2024-02-30'])(
    'retorna 400 para date inválido (%s), sem chamar o axios',
    async (date) => {
      const res = await request(app).get('/apod').query({ date });
      expect(res.status).toBe(400);
      expect(res.headers['content-type']).toMatch(/application\/json/);
      expect(res.body).toHaveProperty('erro');
      expect(axios.get).not.toHaveBeenCalled();
    }
  );

  it('retorna 400 quando a NASA rejeita a data', async () => {
    axios.get.mockRejectedValue({ response: { status: 400, data: { msg: 'Data fora do intervalo' } } });

    const res = await request(app).get('/apod?date=1990-01-01');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ erro: 'Data fora do intervalo' });
  });

  it('retorna 429 quando o limite da chave é atingido', async () => {
    axios.get.mockRejectedValue({ response: { status: 429 } });

    const res = await request(app).get('/apod');
    expect(res.status).toBe(429);
    expect(res.body).toHaveProperty('erro');
  });

  it('retorna 502 quando o axios rejeita com erro de rede', async () => {
    axios.get.mockRejectedValue({ code: 'ECONNREFUSED' });

    const res = await request(app).get('/apod');
    expect(res.status).toBe(502);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toHaveProperty('erro');
  });

  it('retorna 502 quando a NASA responde com erro 500', async () => {
    axios.get.mockRejectedValue({ response: { status: 500 } });

    const res = await request(app).get('/apod');
    expect(res.status).toBe(502);
  });

  it('retorna 502 quando a resposta da NASA é inválida', async () => {
    axios.get.mockResolvedValue({ data: 'resposta estranha' });

    const res = await request(app).get('/apod');
    expect(res.status).toBe(502);
    expect(res.body).toHaveProperty('erro');
  });

  it('retorna 504 em caso de timeout (ECONNABORTED)', async () => {
    axios.get.mockRejectedValue({ code: 'ECONNABORTED' });

    const res = await request(app).get('/apod');
    expect(res.status).toBe(504);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toHaveProperty('erro');
  });
});
