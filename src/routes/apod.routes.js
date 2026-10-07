const express = require('express');
const nasaService = require('../services/nasa.service');

const router = express.Router();

// Aceita somente YYYY-MM-DD e uma data de calendário real
function dataValida(texto) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const d = new Date(`${texto}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === texto;
}

/**
 * @openapi
 * /apod:
 *   get:
 *     tags: [NASA]
 *     summary: Foto astronômica do dia (NASA APOD)
 *     description: Consulta a API APOD da NASA pelo servidor (a chave nunca é exposta ao cliente).
 *     parameters:
 *       - in: query
 *         name: date
 *         required: false
 *         schema: { type: string, format: date }
 *         description: Data no formato YYYY-MM-DD. Se omitida, retorna o APOD do dia.
 *         example: '2024-01-15'
 *     responses:
 *       200:
 *         description: Dados da imagem ou vídeo do dia (hdurl e copyright são opcionais)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 date: { type: string, example: '2024-01-15' }
 *                 title: { type: string, example: Título da imagem }
 *                 explanation: { type: string, example: Texto explicativo sobre a imagem do dia. }
 *                 media_type: { type: string, example: image }
 *                 url: { type: string, example: 'https://apod.nasa.gov/apod/image/exemplo.jpg' }
 *                 hdurl: { type: string, example: 'https://apod.nasa.gov/apod/image/exemplo_hd.jpg' }
 *                 copyright: { type: string, example: Nome do autor }
 *       400:
 *         description: Data em formato inválido ou rejeitada pela NASA
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *       429:
 *         description: Limite de requisições da chave da NASA atingido
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *       502:
 *         description: Falha ou resposta inesperada da NASA
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *       504:
 *         description: A NASA não respondeu dentro do tempo limite
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 */
router.get('/', async (req, res) => {
  const { date } = req.query;

  if (date !== undefined && (typeof date !== 'string' || !dataValida(date))) {
    return res.status(400).json({ erro: 'Parâmetro "date" deve estar no formato YYYY-MM-DD' });
  }

  try {
    const apod = await nasaService.buscarApod(date);
    res.status(200).json(apod);
  } catch (err) {
    res.status(err.status || 502).json({ erro: err.message });
  }
});

module.exports = router;
