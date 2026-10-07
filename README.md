# API REST de Missões Espaciais

## 1. Identificação

- **Aluno:** Gabriel Kamanski Oliveira
- **Curso:** 
- **Unidade Curricular:** Desenvolver Serviços Web

## 2. Descrição do Projeto

API REST para cadastrar, consultar, atualizar e remover missões espaciais (dados em memória), com consulta à foto astronômica do dia da NASA (APOD), testes automatizados e documentação interativa em Swagger.

## 3. Tecnologias Utilizadas

- Node.js
- Express
- Jest
- Supertest
- Swagger (swagger-ui-express e swagger-jsdoc)
- JSON

## 4. Como Clonar o Projeto

```bash
git clone URL_DO_REPOSITORIO
cd NOME_DO_REPOSITORIO
```

## 5. Como Instalar as Dependências

```bash
npm install
```

## 6. Como Executar o Projeto

Copie `.env.example` para `.env` e informe a `NASA_API_KEY` (chave gratuita em https://api.nasa.gov). Sem a chave, a API usa `DEMO_KEY`, com limite de uso reduzido.

```bash
cp .env.example .env
npm start
```

- API: http://localhost:3000
- Swagger: http://localhost:3000/api-docs

## 7. Como Executar os Testes

```bash
npm test
```

Os testes (Jest + Supertest) cobrem todas as rotas, com cenários de sucesso e erro, e verificam o `Content-Type` JSON. Antes de cada teste o array em memória é reiniciado (`beforeEach`), então os testes são independentes. Os testes de `GET /apod` usam `jest.mock('axios')` e nunca chamam a NASA de verdade.

## Estrutura de pastas

```
.
├── src/
│   ├── app.js                      # cria o app (sem abrir porta)
│   ├── server.js                   # inicia o servidor
│   ├── data/missoes.js             # array em memória
│   ├── routes/missoes.routes.js    # CRUD de missões
│   ├── routes/apod.routes.js       # rota /apod
│   ├── services/nasa.service.js    # chamada axios à NASA
│   └── docs/swagger.js             # configuração do Swagger
├── tests/
│   ├── missoes.test.js
│   └── apod.test.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 8. Documentação dos Endpoints

Todas as respostas são JSON (exceto `204`). Erros seguem o formato `{ "erro": "mensagem" }`. Rotas inexistentes retornam `404` em JSON.

### GET /status
- **Objetivo:** verificar o funcionamento da API.
- **Resposta:** `{ "status": "ok" }`
- **Status:** 200

### GET /missoes
- **Objetivo:** listar todas as missões.
- **Resposta:** `[ { "id": 1, "nome": "Apollo 11", "ano": 1969, "agencia": "NASA", "status": "Concluída" } ]`
- **Status:** 200

### GET /missoes/{id}
- **Objetivo:** buscar missão por ID.
- **Requisição:** `GET /missoes/1`
- **Resposta:** `{ "id": 1, "nome": "Apollo 11", "ano": 1969, "agencia": "NASA", "status": "Concluída" }`
- **Status:** 200, 404

### POST /missoes
- **Objetivo:** cadastrar nova missão (todos os campos obrigatórios).
- **Requisição:** `{ "nome": "Artemis III", "ano": 2027, "agencia": "NASA", "status": "Planejada" }`
- **Resposta:** `{ "id": 7, "nome": "Artemis III", "ano": 2027, "agencia": "NASA", "status": "Planejada" }`
- **Status:** 201, 400

### PUT /missoes/{id}
- **Objetivo:** atualizar uma missão.
- **Requisição:** `{ "nome": "Artemis III", "ano": 2027, "agencia": "NASA", "status": "Em preparação" }`
- **Resposta:** missão atualizada, com o mesmo `id`.
- **Status:** 200, 400, 404

### DELETE /missoes/{id}
- **Objetivo:** remover uma missão.
- **Resposta:** sem corpo.
- **Status:** 204, 404

### GET /apod?date=YYYY-MM-DD
- **Objetivo:** foto astronômica do dia da NASA. `date` é opcional.
- **Requisição:** `GET /apod?date=2024-01-15`
- **Resposta:**
  ```json
  {
    "date": "2024-01-15",
    "title": "Título da imagem",
    "explanation": "Texto explicativo.",
    "media_type": "image",
    "url": "https://apod.nasa.gov/apod/image/exemplo.jpg",
    "hdurl": "https://apod.nasa.gov/apod/image/exemplo_hd.jpg",
    "copyright": "Nome do autor"
  }
  ```
  `hdurl` e `copyright` só aparecem quando a NASA os envia.
- **Status:** 200, 400 (data inválida), 429 (limite da chave), 502 (falha da NASA), 504 (timeout)

### GET /api-docs
- **Objetivo:** interface do Swagger UI com todos os endpoints.

## 9. Evidências

> Adicione aqui as capturas de tela:
>
> - `npm test` com todos os testes passando e a cobertura
> - Swagger UI (`/api-docs`) exibindo todos os endpoints
