let estabelecimentos = [];
let estabelecimentoIdEmEdicao = null;
let ordemAscendente = true; // alternar ordenação de status

async function carregarEstabelecimentos() {
  const tabelaBody = document.querySelector("#tabela-estabelecimentos tbody");
  tabelaBody.innerHTML = "<tr><td colspan='6'>Carregando...</td></tr>";

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  try {
    const snapshot = await firebase.firestore().collection("estabelecimentos").get();
    estabelecimentos = snapshot.docs.map(doc => {
      const data = doc.data();
      const validade = data.validadeAlvara ? new Date(data.validadeAlvara + "T00:00:00") : null;
      let diffDays = validade ? Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24)) : -1;
      let status = "regular";
      if (diffDays < 0) status = "irregular";
      else if (diffDays <= 30) status = "proximo";
      return { id: doc.id, ...data, validade, status };
    });

    renderizarTabela();
  } catch (error) {
    console.error("Erro ao carregar estabelecimentos:", error);
  }
}

function renderizarTabela() {
  const tabelaBody = document.querySelector("#tabela-estabelecimentos tbody");
  const busca = document.getElementById("busca-estabelecimento").value.toLowerCase();
  const filtroStatus = document.getElementById("filtro-status").value;

  // ordem inicial ou alternada
  const ordemStatus = { irregular: 1, proximo: 2, regular: 3 };
  let lista = [...estabelecimentos].sort((a, b) => {
    return ordemAscendente
      ? ordemStatus[a.status] - ordemStatus[b.status]
      : ordemStatus[b.status] - ordemStatus[a.status];
  });

  // filtrar
  lista = lista.filter(est => {
    const matchBusca = est.nomeEstabelecimento.toLowerCase().includes(busca) ||
      est.nomeResponsavel.toLowerCase().includes(busca);
    const matchStatus = filtroStatus ? est.status === filtroStatus : true;
    return matchBusca && matchStatus;
  });

  tabelaBody.innerHTML = "";

  if (lista.length === 0) {
    tabelaBody.innerHTML = "<tr><td colspan='6'>Nenhum estabelecimento encontrado</td></tr>";
    return;
  }

  lista.forEach(est => {
    const row = document.createElement("tr");

// adiciona classe de cor conforme status
row.classList.add(`status-${est.status}`);

row.innerHTML = `
  <td>${est.nomeEstabelecimento}</td>
  <td>${est.enderecoEstabelecimento}</td>
  <td>${est.nomeResponsavel}</td>
  <td>${est.telefone}</td>
  <td>${est.validade ? est.validade.toLocaleDateString() : "N/A"}</td>
  <td>${est.status.charAt(0).toUpperCase() + est.status.slice(1)}</td>
  <td>
    <button class="icon-btn" onclick="abrirModalEdicao('${est.id}')"><i class="fa-solid fa-pen-to-square"></i></button>
    <button class="icon-btn delete" onclick="excluirEstabelecimentoDireto('${est.id}')"><i class="fa-solid fa-trash-can"></i></button>
  </td>
`;

tabelaBody.appendChild(row);

  });
}

// Modal
async function abrirModalEdicao(id) {
  estabelecimentoIdEmEdicao = id;
  const doc = await firebase.firestore().collection("estabelecimentos").doc(id).get();
  if (doc.exists) {
    const est = doc.data();
    document.getElementById("edit-nome-estabelecimento").value = est.nomeEstabelecimento;
    document.getElementById("edit-endereco-estabelecimento").value = est.enderecoEstabelecimento;
    document.getElementById("edit-nome-responsavel").value = est.nomeResponsavel;
    document.getElementById("edit-endereco-responsavel").value = est.enderecoResponsavel;
    document.getElementById("edit-telefone").value = est.telefone;
    document.getElementById("edit-validade-alvara").value = est.validadeAlvara;
    document.getElementById("titulo-modal-edicao").textContent = "Editar Estabelecimento";
    document.getElementById("modal-edicao-estabelecimento").style.display = "flex";
  }
}

function fecharModalEdicao() {
  document.getElementById("modal-edicao-estabelecimento").style.display = "none";
}

// Salvar edição
document.getElementById("form-edicao-estabelecimento").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!estabelecimentoIdEmEdicao) return;

  const dados = {
    nomeEstabelecimento: document.getElementById("edit-nome-estabelecimento").value,
    enderecoEstabelecimento: document.getElementById("edit-endereco-estabelecimento").value,
    nomeResponsavel: document.getElementById("edit-nome-responsavel").value,
    enderecoResponsavel: document.getElementById("edit-endereco-responsavel").value,
    telefone: document.getElementById("edit-telefone").value,
    validadeAlvara: document.getElementById("edit-validade-alvara").value,
  };

  await firebase.firestore().collection("estabelecimentos").doc(estabelecimentoIdEmEdicao).update(dados);
  fecharModalEdicao();
  carregarEstabelecimentos();
});

// Botões extras
document.getElementById("backBtn").addEventListener("click", () => window.history.back());

document.getElementById("btn-novo-estabelecimento").addEventListener("click", () => {
  document.getElementById("form-cadastro-estabelecimento").reset();
  document.getElementById("modal-cadastro-estabelecimento").style.display = "flex";
});

function fecharModalCadastro() {
  document.getElementById("modal-cadastro-estabelecimento").style.display = "none";
}

// Salvar cadastro
document.getElementById("form-cadastro-estabelecimento").addEventListener("submit", async (e) => {
  e.preventDefault();

  const dados = {
    nomeEstabelecimento: document.getElementById("cad-nome-estabelecimento").value,
    enderecoEstabelecimento: document.getElementById("cad-endereco-estabelecimento").value,
    nomeResponsavel: document.getElementById("cad-nome-responsavel").value,
    enderecoResponsavel: document.getElementById("cad-endereco-responsavel").value,
    telefone: document.getElementById("cad-telefone").value,
    validadeAlvara: document.getElementById("cad-validade-alvara").value,
  };

  try {
    await firebase.firestore().collection("estabelecimentos").add(dados);
    fecharModalCadastro();
    carregarEstabelecimentos();
  } catch (error) {
    console.error("Erro ao cadastrar estabelecimento:", error);
    alert("Erro ao cadastrar, tente novamente.");
  }
});


document.getElementById("ordenar-status").addEventListener("click", () => {
  ordemAscendente = !ordemAscendente;
  renderizarTabela();
});

// Filtros
document.getElementById("busca-estabelecimento").addEventListener("input", renderizarTabela);
document.getElementById("filtro-status").addEventListener("change", renderizarTabela);

// Início
window.onload = carregarEstabelecimentos;

async function excluirEstabelecimentoDireto(id) {
  const confirmar = confirm("Tem certeza que deseja excluir este estabelecimento?");
  if (!confirmar) return;

  try {
    await firebase.firestore().collection("estabelecimentos").doc(id).delete();
    carregarEstabelecimentos();
  } catch (error) {
    console.error("Erro ao excluir estabelecimento:", error);
    alert("Erro ao excluir, tente novamente.");
  }
}

