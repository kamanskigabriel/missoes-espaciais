// Dados em memória. A função resetar() restaura o estado inicial
// (usada nos testes com beforeEach para que um teste não dependa do outro).

const missoesIniciais = [
  { id: 1, nome: 'Apollo 11', ano: 1969, agencia: 'NASA', status: 'Concluída' },
  { id: 2, nome: 'Voyager 1', ano: 1977, agencia: 'NASA', status: 'Em operação' },
  { id: 3, nome: 'Artemis II', ano: 2026, agencia: 'NASA', status: 'Planejada' },
  { id: 4, nome: 'Sputnik 1', ano: 1957, agencia: 'URSS', status: 'Concluída' },
  { id: 5, nome: 'Chandrayaan-3', ano: 2023, agencia: 'ISRO', status: 'Concluída' },
  { id: 6, nome: 'Mars Express', ano: 2003, agencia: 'ESA', status: 'Em operação' },
];

let missoes = [];
let proximoId = 1;

function resetar() {
  missoes = missoesIniciais.map((m) => ({ ...m }));
  proximoId = Math.max(...missoes.map((m) => m.id)) + 1;
}

function listar() {
  return missoes;
}

function buscarPorId(id) {
  return missoes.find((m) => m.id === id);
}

function criar(dados) {
  const nova = { id: proximoId++, ...dados };
  missoes.push(nova);
  return nova;
}

function atualizar(id, dados) {
  const indice = missoes.findIndex((m) => m.id === id);
  if (indice === -1) return undefined;
  missoes[indice] = { id, ...dados };
  return missoes[indice];
}

function remover(id) {
  const indice = missoes.findIndex((m) => m.id === id);
  if (indice === -1) return false;
  missoes.splice(indice, 1);
  return true;
}

resetar();

module.exports = { listar, buscarPorId, criar, atualizar, remover, resetar };
