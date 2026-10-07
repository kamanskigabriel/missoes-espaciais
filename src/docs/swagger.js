const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Missões Espaciais',
      version: '1.0.0',
      description:
        'API REST para gerenciar missões espaciais, com consulta à foto astronômica do dia (NASA APOD).',
    },
    servers: [{ url: 'http://localhost:3000', description: 'Servidor local' }],
  },
  apis: [
    path.join(__dirname, '../app.js'),
    path.join(__dirname, '../routes/*.js'),
  ],
};

module.exports = swaggerJsdoc(options);
