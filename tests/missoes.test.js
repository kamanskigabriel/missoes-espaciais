const request = require('supertest');
const app = require('../src/app');
const dados = require('../src/data/missoes');

// Restaura o array em memória antes de cada teste (testes independentes)
beforeEach(() => {
  dados.resetar();
});

const novaMissao = { nome: 'Artemis III', ano: 2027, agencia: 'NASA', status: 'Planejada' };

describe('GET /status', () => {
  it('retorna 200 e { status: "ok" }', async () => {
    const res = await request(app).get('/status');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('GET /missoes', () => {
  it('retorna 200 e um array com pelo menos 5 itens', async () => {
    const res = await request(app).get('/missoes');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(5);
  });
});

describe('GET /missoes/:id', () => {
  it('retorna 200 com a missão correta', async () => {
    const res = await request(app).get('/missoes/1');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual({
      id: 1, nome: 'Apollo 11', ano: 1969, agencia: 'NASA', status: 'Concluída',
    });
  });

  it('retorna 404 para ID inexistente', async () => {
    const res = await request(app).get('/missoes/999');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toHaveProperty('erro');
  });

  it('retorna 404 para ID não numérico', async () => {
    const res = await request(app).get('/missoes/abc');
    expect(res.status).toBe(404);
  });
});

describe('POST /missoes', () => {
  it('retorna 201 e a missão criada com id', async () => {
    const res = await request(app).post('/missoes').send(novaMissao);
    expect(res.status).toBe(201);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toMatchObject(novaMissao);
    expect(typeof res.body.id).toBe('number');

    const busca = await request(app).get(`/missoes/${res.body.id}`);
    expect(busca.status).toBe(200);
  });

  it('retorna 400 quando campos obrigatórios estão ausentes', async () => {
    const res = await request(app).post('/missoes').send({ nome: 'Sem dados' });
    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toHaveProperty('erro');
  });

  it.each([
    ['nome vazio', { ...novaMissao, nome: '  ' }],
    ['ano como texto', { ...novaMissao, ano: '2027' }],
    ['agencia numérica', { ...novaMissao, agencia: 123 }],
    ['status ausente', { nome: 'X', ano: 2000, agencia: 'NASA' }],
  ])('retorna 400 para %s', async (_descricao, corpo) => {
    const res = await request(app).post('/missoes').send(corpo);
    expect(res.status).toBe(400);
  });

  it('retorna 400 para JSON malformado', async () => {
    const res = await request(app)
      .post('/missoes')
      .set('Content-Type', 'application/json')
      .send('{ nome: ');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('erro');
  });

  it('retorna 400 quando o corpo não é um objeto', async () => {
    const res = await request(app).post('/missoes').send([1, 2]);
    expect(res.status).toBe(400);
  });
});

describe('PUT /missoes/:id', () => {
  it('retorna 200 com a missão atualizada', async () => {
    const corpo = { ...novaMissao, status: 'Em preparação' };
    const res = await request(app).put('/missoes/3').send(corpo);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual({ id: 3, ...corpo });
  });

  it('retorna 400 com dados inválidos', async () => {
    const res = await request(app).put('/missoes/3').send({ nome: '' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('erro');
  });

  it('retorna 404 para ID inexistente', async () => {
    const res = await request(app).put('/missoes/999').send(novaMissao);
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});

describe('DELETE /missoes/:id', () => {
  it('retorna 204 e a missão não é mais encontrada', async () => {
    const res = await request(app).delete('/missoes/2');
    expect(res.status).toBe(204);
    expect(res.text).toBe('');

    const busca = await request(app).get('/missoes/2');
    expect(busca.status).toBe(404);
  });

  it('retorna 404 para ID inexistente', async () => {
    const res = await request(app).delete('/missoes/999');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});

describe('Rotas inexistentes e documentação', () => {
  it('retorna 404 em JSON para rota desconhecida', async () => {
    const res = await request(app).get('/rota-que-nao-existe');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual({ erro: 'Rota não encontrada' });
  });

  it('GET /api-docs/ exibe o Swagger UI', async () => {
    const res = await request(app).get('/api-docs/');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/swagger/i);
  });
});
