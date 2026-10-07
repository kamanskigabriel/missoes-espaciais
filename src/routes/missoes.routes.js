const express = require('express');
const dados = require('../data/missoes');

const router = express.Router();

// Valida o corpo de POST/PUT. Retorna mensagem de erro ou null.
function validarMissao(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Corpo da requisição inválido';
  }
  const { nome, ano, agencia, status } = body;
  if (typeof nome !== 'string' || nome.trim() === '') {
    return 'Campo "nome" é obrigatório e deve ser um texto';
  }
  if (!Number.isInteger(ano) || ano < 1900) {
    return 'Campo "ano" é obrigatório e deve ser um número inteiro válido';
  }
  if (typeof agencia !== 'string' || agencia.trim() === '') {
    return 'Campo "agencia" é obrigatório e deve ser um texto';
  }
  if (typeof status !== 'string' || status.trim() === '') {
    return 'Campo "status" é obrigatório e deve ser um texto';
  }
  return null;
}

// Mantém apenas os campos conhecidos
function extrairCampos({ nome, ano, agencia, status }) {
  return { nome: nome.trim(), ano, agencia: agencia.trim(), status: status.trim() };
}

// Converte o parâmetro de rota em número. Retorna NaN se inválido.
function lerId(req) {
  return /^\d+$/.test(req.params.id) ? Number(req.params.id) : NaN;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     Missao:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 1 }
 *         nome: { type: string, example: Apollo 11 }
 *         ano: { type: integer, example: 1969 }
 *         agencia: { type: string, example: NASA }
 *         status: { type: string, example: Concluída }
 *     MissaoEntrada:
 *       type: object
 *       required: [nome, ano, agencia, status]
 *       properties:
 *         nome: { type: string, example: Artemis III }
 *         ano: { type: integer, example: 2027 }
 *         agencia: { type: string, example: NASA }
 *         status: { type: string, example: Planejada }
 *     Erro:
 *       type: object
 *       properties:
 *         erro: { type: string, example: Missão não encontrada }
 */

/**
 * @openapi
 * /missoes:
 *   get:
 *     tags: [Missões]
 *     summary: Lista todas as missões espaciais
 *     responses:
 *       200:
 *         description: Lista de missões
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Missao' }
 */
router.get('/', (req, res) => {
  res.status(200).json(dados.listar());
});

/**
 * @openapi
 * /missoes/{id}:
 *   get:
 *     tags: [Missões]
 *     summary: Busca uma missão pelo ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: ID da missão
 *         example: 1
 *     responses:
 *       200:
 *         description: Missão encontrada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Missao' }
 *       404:
 *         description: Missão não encontrada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 */
router.get('/:id', (req, res) => {
  const missao = dados.buscarPorId(lerId(req));
  if (!missao) return res.status(404).json({ erro: 'Missão não encontrada' });
  res.status(200).json(missao);
});

/**
 * @openapi
 * /missoes:
 *   post:
 *     tags: [Missões]
 *     summary: Cadastra uma nova missão
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/MissaoEntrada' }
 *     responses:
 *       201:
 *         description: Missão criada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Missao' }
 *       400:
 *         description: Campos obrigatórios ausentes ou inválidos
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 */
router.post('/', (req, res) => {
  const erro = validarMissao(req.body);
  if (erro) return res.status(400).json({ erro });
  const nova = dados.criar(extrairCampos(req.body));
  res.status(201).json(nova);
});

/**
 * @openapi
 * /missoes/{id}:
 *   put:
 *     tags: [Missões]
 *     summary: Atualiza uma missão existente
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: ID da missão
 *         example: 3
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/MissaoEntrada' }
 *     responses:
 *       200:
 *         description: Missão atualizada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Missao' }
 *       400:
 *         description: Campos obrigatórios ausentes ou inválidos
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *       404:
 *         description: Missão não encontrada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 */
router.put('/:id', (req, res) => {
  const id = lerId(req);
  if (!dados.buscarPorId(id)) {
    return res.status(404).json({ erro: 'Missão não encontrada' });
  }
  const erro = validarMissao(req.body);
  if (erro) return res.status(400).json({ erro });
  const atualizada = dados.atualizar(id, extrairCampos(req.body));
  res.status(200).json(atualizada);
});

/**
 * @openapi
 * /missoes/{id}:
 *   delete:
 *     tags: [Missões]
 *     summary: Remove uma missão
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: ID da missão
 *         example: 2
 *     responses:
 *       204:
 *         description: Missão removida (sem corpo)
 *       404:
 *         description: Missão não encontrada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 */
router.delete('/:id', (req, res) => {
  const removida = dados.remover(lerId(req));
  if (!removida) return res.status(404).json({ erro: 'Missão não encontrada' });
  res.status(204).send();
});

module.exports = router;
