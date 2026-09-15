let lancamentos=[];
let tipoSelecionado='despesa';

const form = document.getElementById('form-lancamento');
const inputDescricao = document.getElementById('descricao');
const inputCategoria = document.getElementById('categoria');
const inputValor = document.getElementById('valor');
const botoesTipo = document.querySelectorAll('.tipo-toggle button');
const saldoAtualEl = document.getElementById('saldo-atual');
const listaCategoriasEl = document.getElementById('lista-categorias');
const listaLancamentosEl = document.getElementById('lista-lancamentos');
const toggleTema = document.getElementById('toggle-tema');

function salvarDados() {
  localStorage.setItem('lancamentos', JSON.stringify(lancamentos));
}

function carregarDados() {
  const dados = localStorage.getItem('lancamentos');
  lancamentos = dados ? JSON.parse(dados) : [];
}

function carregarTema() {
  const temaSalvo = localStorage.getItem('tema') || 'claro';
  document.documentElement.setAttribute('data-theme', temaSalvo);
  toggleTema.checked = temaSalvo === 'escuro';
}
 
toggleTema.addEventListener('change', () => {
  const novoTema = toggleTema.checked ? 'escuro' : 'claro';
  document.documentElement.setAttribute('data-theme', novoTema);
  localStorage.setItem('tema', novoTema);
});

botoesTipo.forEach(botao => {
  botao.addEventListener('click', () => {
    botoesTipo.forEach(b => b.classList.remove('ativo'));
    botao.classList.add('ativo');
    tipoSelecionado = botao.dataset.tipo;
  });
});

function calcularSaldo(lista) {
  return lista.reduce((saldo, item) => {
    return item.tipo === 'entrada' ? saldo + item.valor : saldo - item.valor;
  }, 0);
}

function agruparPorCategoria(lista) {
  const grupos = {};
  lista.forEach(item => {
    if (!grupos[item.categoria]) {
      grupos[item.categoria] = { total: 0, tipo: item.tipo };
    }
    grupos[item.categoria].total += item.valor;
  });
  return grupos;
}
  function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function renderizarSaldo() {
  const saldo = calcularSaldo(lancamentos);
  saldoAtualEl.textContent = formatarMoeda(saldo);
  saldoAtualEl.classList.remove('positivo', 'negativo');
  saldoAtualEl.classList.add(saldo >= 0 ? 'positivo' : 'negativo');
}



function renderizarCategorias() {
  const grupos = agruparPorCategoria(lancamentos);
  const entradas = Object.entries(grupos);
 
  listaCategoriasEl.innerHTML = '';
 
  if (entradas.length === 0) {
    listaCategoriasEl.innerHTML =
      '<li style="font-size:0.85rem; color: var(--texto-suave);">Nenhum lançamento ainda.</li>';
    return;
  }
 
  const maiorValor = Math.max(...entradas.map(([, dados]) => dados.total));
 
  entradas
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([categoria, dados]) => {
      const porcentagem = maiorValor ? (dados.total / maiorValor) * 100 : 0;
 
      const li = document.createElement('li');
      li.className = 'categoria-item';
      li.innerHTML = `
        <div class="categoria-topo">
          <span class="categoria-nome">${categoria}</span>
          <span class="categoria-valor">${formatarMoeda(dados.total)}</span>
        </div>
        <div class="barra-categoria">
          <div class="barra-preenchimento ${dados.tipo === 'despesa' ? 'despesa' : ''}" style="width: ${porcentagem}%"></div>
        </div>
      `;
      listaCategoriasEl.appendChild(li);
    });
}

function renderizarLancamentos() {
  listaLancamentosEl.innerHTML = '';
 
  if (lancamentos.length === 0) {
    listaLancamentosEl.innerHTML =
      '<tr><td colspan="5" style="text-align:center; color: var(--texto-suave);">Nenhum lançamento cadastrado.</td></tr>';
    return;
  }
 
  [...lancamentos]
    .sort((a, b) => b.id.localeCompare(a.id)) // mais recente primeiro
    .forEach(item => {
      const tr = document.createElement('tr');
      const sinal = item.tipo === 'entrada' ? '+' : '−';
      const classeValor = item.tipo === 'entrada' ? 'valor-entrada' : 'valor-despesa';
 
      tr.innerHTML = `
        <td>${item.descricao}</td>
        <td>${item.categoria}</td>
        <td>${item.tipo === 'entrada' ? 'Entrada' : 'Despesa'}</td>
        <td class="${classeValor}">${sinal} ${formatarMoeda(item.valor)}</td>
        <td><button class="botao-excluir" data-id="${item.id}">Excluir</button></td>
      `;
      listaLancamentosEl.appendChild(tr);
    });
 
  document.querySelectorAll('.botao-excluir').forEach(botao => {
    botao.addEventListener('click', () => {
      excluirLancamento(botao.dataset.id);
    });
  });
}

function renderizarTudo() {
  renderizarSaldo();
  renderizarCategorias();
  renderizarLancamentos();
}

function adicionarLancamento(tipo, descricao, categoria, valor) {
  lancamentos.push({
    id: Date.now().toString(),
    tipo,
    descricao,
    categoria,
    valor
  });
  salvarDados();
  renderizarTudo();
}
 
function excluirLancamento(id) {
  lancamentos = lancamentos.filter(item => item.id !== id);
  salvarDados();
  renderizarTudo();
}

form.addEventListener('submit', (evento) => {
  evento.preventDefault();
 
  const descricao = inputDescricao.value.trim();
  const categoria = inputCategoria.value;
  const valor = parseFloat(inputValor.value);

   console.log({ descricao, categoria, valor });
 
  if (!descricao || !categoria || !valor || valor <= 0) {
    return;
  }
 
  adicionarLancamento(tipoSelecionado, descricao, categoria, valor);
 
  // reseta o formulário e volta o toggle para "Despesa" por padrão
  form.reset();
  botoesTipo.forEach(b => b.classList.remove('ativo'));
  document.querySelector('.tipo-toggle button[data-tipo="despesa"]').classList.add('ativo');
  tipoSelecionado = 'despesa';
});

carregarTema();
carregarDados();
renderizarTudo();