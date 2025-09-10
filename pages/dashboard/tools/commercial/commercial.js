let estabelecimentoIdEmEdicao = null;
let armamentoIdEmEdicao = null;
let globalNotifications = [];

// Elementos da interface
const backBtn = document.getElementById("backBtn");
const tituloSecao = document.getElementById("titulo-secao");
const secaoConteudo = document.getElementById("secao-conteudo");

const modalEdicaoEstabelecimento = document.getElementById("modal-edicao-estabelecimento");
const formEdicaoEstabelecimento = document.getElementById("form-edicao-estabelecimento");
const btnNovoEstabelecimento = document.getElementById("btn-novo-estabelecimento");

const buscaEstabelecimento = document.getElementById("busca-estabelecimento");

const notificationIconContainer = document.getElementById("notification-icon-container");
const notificationDropdown = document.getElementById("notification-dropdown");
const notificationCountElement = document.getElementById("notification-count");
const noNotificationsMsg = document.getElementById("no-notifications");

// Voltar
backBtn.addEventListener("click", () => window.history.back());

// ========================================
// Funções de Gerenciamento
// ========================================

/**
 * Abre a seção de estabelecimentos comerciais.
 */
function abrirSecaoEstabelecimentos() {
    tituloSecao.innerText = "Cadastro de estabelecimentos comerciais";
    secaoConteudo.innerHTML = `
      <table id="lista-estabelecimentos">
        <thead>
            <tr>
                <th>Nome</th>
                <th>Endereço</th>
                <th>Responsável</th>
                <th>Telefone</th>
                <th>Validade Alvará</th>
                <th>Ações</th>
            </tr>
        </thead>
        <tbody></tbody>
      </table>
    `;
    carregarEstabelecimentos();
}

/**
 * Abre a seção de dashboard com o resumo de validade.
 */
function abrirDashboard() {
    tituloSecao.innerText = "Dashboard - Resumo de Regularidade";
    secaoConteudo.innerHTML = `<div id="resumo-regularidade" class="widgets">Carregando resumo...</div>`;
    carregarResumoRegularidade();
}

/**
 * Abre a seção de armamentos.
 */
function abrirSecaoArmamentos() {
    tituloSecao.innerText = "Cadastro de Armamentos";
    secaoConteudo.innerHTML = `
      <table id="tabela-armamentos" class="tabela-armamentos">
        <thead>
          <tr>
            <th>Marca</th>
            <th>Modelo</th>
            <th>Calibre</th>
            <th>CRAF</th>
            <th>Validade Guia</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    `;
    carregarArmamentos();
}

// ========================================
// Estabelecimentos
// ========================================

// Carregar estabelecimentos do Firestore
async function carregarEstabelecimentos() {
    const lista = document.querySelector("#lista-estabelecimentos tbody");
    lista.innerHTML = '<tr><td colspan="6">Carregando...</td></tr>';
    const termoBusca = buscaEstabelecimento.value.toLowerCase();

    try {
        const snapshot = await firebase.firestore().collection("estabelecimentos").get();
        const estabelecimentos = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        const estabelecimentosFiltrados = estabelecimentos.filter(e =>
            (e.nomeEstabelecimento && e.nomeEstabelecimento.toLowerCase().includes(termoBusca)) ||
            (e.enderecoEstabelecimento && e.enderecoEstabelecimento.toLowerCase().includes(termoBusca)) ||
            (e.nomeResponsavel && e.nomeResponsavel.toLowerCase().includes(termoBusca))
        );

        lista.innerHTML = '';
        if (estabelecimentosFiltrados.length === 0) {
            lista.innerHTML = '<tr><td colspan="6">Nenhum estabelecimento encontrado.</td></tr>';
        } else {
            estabelecimentosFiltrados.forEach(est => {
                const row = lista.insertRow();
                let isHighlight = false;
                const hoje = new Date();
                hoje.setHours(0, 0, 0, 0);

                if (est.validadeAlvara) {
                    const dataValidade = new Date(est.validadeAlvara + "T00:00:00");
                    const diffDays = Math.ceil((dataValidade - hoje) / (1000 * 60 * 60 * 24));
                    if (diffDays <= 30) {
                        isHighlight = true;
                    }
                }
                if (isHighlight) {
                    row.classList.add('highlight');
                }

                row.innerHTML = `
          <td>${est.nomeEstabelecimento}</td>
          <td>${est.enderecoEstabelecimento}</td>
          <td>${est.nomeResponsavel}</td>
          <td>${est.telefone}</td>
          <td>${est.validadeAlvara ? new Date(est.validadeAlvara + 'T00:00:00').toLocaleDateString() : 'N/A'}</td>
          <td>
            <button class="icon-btn" onclick="abrirModalEdicao('${est.id}')"><i class="fa-solid fa-pen-to-square"></i></button>
            <button class="icon-btn delete" onclick="excluirEstabelecimento('${est.id}')"><i class="fa-solid fa-trash-can"></i></button>
          </td>
        `;
            });
        }
        atualizarNotificacoes(estabelecimentos, 'alvara');
    } catch (error) {
        console.error("Erro ao carregar estabelecimentos: ", error);
        lista.innerHTML = '<tr><td colspan="6">Erro ao carregar os dados.</td></tr>';
    }
}

// Botão de adicionar
btnNovoEstabelecimento.addEventListener('click', () => {
    estabelecimentoIdEmEdicao = null;
    document.getElementById("titulo-modal-edicao").textContent = "Adicionar Estabelecimento";
    formEdicaoEstabelecimento.reset();
    modalEdicaoEstabelecimento.style.display = "flex";
});

// Salvar estabelecimento
formEdicaoEstabelecimento.addEventListener("submit", async (e) => {
    e.preventDefault();
    const dados = {
        nomeEstabelecimento: document.getElementById("edit-nome-estabelecimento").value,
        enderecoEstabelecimento: document.getElementById("edit-endereco-estabelecimento").value,
        nomeResponsavel: document.getElementById("edit-nome-responsavel").value,
        enderecoResponsavel: document.getElementById("edit-endereco-responsavel").value,
        telefone: document.getElementById("edit-telefone").value,
        validadeAlvara: document.getElementById("edit-validade-alvara").value,
    };

    try {
        if (estabelecimentoIdEmEdicao) {
            await firebase.firestore().collection("estabelecimentos").doc(estabelecimentoIdEmEdicao).update(dados);
            alert("Estabelecimento atualizado com sucesso!");
        } else {
            await firebase.firestore().collection("estabelecimentos").add(dados);
            alert("Estabelecimento adicionado com sucesso!");
        }
        modalEdicaoEstabelecimento.style.display = "none";
        carregarEstabelecimentos();
    } catch (error) {
        console.error("Erro ao salvar estabelecimento:", error);
        alert("Erro ao salvar estabelecimento.");
    }
});

// Abrir modal de edição
window.abrirModalEdicao = async (id) => {
    estabelecimentoIdEmEdicao = id;
    document.getElementById("titulo-modal-edicao").textContent = "Editar Estabelecimento";
    try {
        const doc = await firebase.firestore().collection("estabelecimentos").doc(id).get();
        if (doc.exists) {
            const dados = doc.data();
            document.getElementById("edit-nome-estabelecimento").value = dados.nomeEstabelecimento;
            document.getElementById("edit-endereco-estabelecimento").value = dados.enderecoEstabelecimento;
            document.getElementById("edit-nome-responsavel").value = dados.nomeResponsavel;
            document.getElementById("edit-endereco-responsavel").value = dados.enderecoResponsavel;
            document.getElementById("edit-telefone").value = dados.telefone;
            document.getElementById("edit-validade-alvara").value = dados.validadeAlvara;
            modalEdicaoEstabelecimento.style.display = "flex";
        }
    } catch (error) {
        console.error("Erro ao carregar estabelecimento:", error);
    }
};

// Excluir estabelecimento
window.excluirEstabelecimento = async (id) => {
    if (confirm("Tem certeza que deseja excluir este estabelecimento?")) {
        try {
            await firebase.firestore().collection("estabelecimentos").doc(id).delete();
            alert("Estabelecimento excluído com sucesso!");
            carregarEstabelecimentos();
        } catch (error) {
            console.error("Erro ao excluir estabelecimento: ", error);
            alert("Erro ao excluir estabelecimento.");
        }
    }
};

// Funções de resumo
async function carregarResumoRegularidade() {
    const resumoContainer = document.getElementById("resumo-regularidade");
    resumoContainer.innerHTML = 'Carregando resumo...';

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    try {
        const snapshot = await firebase.firestore().collection("estabelecimentos").get();
        let resumo = {
            regular: 0,
            proximo: 0,
            irregular: 0
        };

        snapshot.forEach(doc => {
            const dataValidade = doc.data().validadeAlvara ? new Date(doc.data().validadeAlvara + "T00:00:00") : null;
            if (dataValidade) {
                const diffDays = Math.ceil((dataValidade - hoje) / (1000 * 60 * 60 * 24));
                if (diffDays < 0) {
                    resumo.irregular++;
                } else if (diffDays <= 30) {
                    resumo.proximo++;
                } else {
                    resumo.regular++;
                }
            } else {
                resumo.irregular++;
            }
        });

        resumoContainer.innerHTML = `
      <div class="resumo-card regular" onclick="filtrarPorStatus('regular')">
        <p>${resumo.regular}</p>
        <p>Alvarás regulares</p>
      </div>
      <div class="resumo-card proximo" onclick="filtrarPorStatus('proximo')">
        <p>${resumo.proximo}</p>
        <p>Alvarás a vencer</p>
      </div>
      <div class="resumo-card irregular" onclick="filtrarPorStatus('irregular')">
        <p>${resumo.irregular}</p>
        <p>Alvarás irregulares</p>
      </div>
    `;
    } catch (error) {
        console.error("Erro ao carregar resumo de regularidade:", error);
        resumoContainer.innerHTML = 'Erro ao carregar resumo.';
    }
}

function filtrarPorStatus(status) {
    alert(`Filtrando por status: ${status}. Esta funcionalidade ainda precisa de implementação.`);
}

// ========================================
// Armamentos
// ========================================

async function carregarArmamentos() {
    const tabela = document.querySelector("#tabela-armamentos tbody");
    tabela.innerHTML = '<tr><td colspan="6">Carregando...</td></tr>';
    const termoBusca = buscaEstabelecimento.value.toLowerCase(); // Utiliza o mesmo campo de busca

    try {
        const snapshot = await firebase.firestore().collection("armamentos").get();
        const armamentos = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        const armamentosFiltrados = armamentos.filter(a =>
            (a.marca && a.marca.toLowerCase().includes(termoBusca)) ||
            (a.modelo && a.modelo.toLowerCase().includes(termoBusca)) ||
            (a.numeroCraf && a.numeroCraf.toLowerCase().includes(termoBusca))
        );

        tabela.innerHTML = '';
        if (armamentosFiltrados.length === 0) {
            tabela.innerHTML = '<tr><td colspan="6">Nenhum armamento encontrado.</td></tr>';
        } else {
            armamentosFiltrados.forEach(arm => {
                const row = tabela.insertRow();
                let isHighlight = false;
                const hoje = new Date();
                hoje.setHours(0, 0, 0, 0);

                if (arm.dataGuia) {
                    const dataGuia = new Date(arm.dataGuia + "T00:00:00");
                    const diffDays = Math.ceil((dataGuia - hoje) / (1000 * 60 * 60 * 24));
                    if (diffDays <= 30) {
                        isHighlight = true;
                    }
                }
                if (isHighlight) {
                    row.classList.add('highlight');
                }

                row.innerHTML = `
            <td>${arm.marca || 'N/A'}</td>
            <td>${arm.modelo || 'N/A'}</td>
            <td>${arm.calibre || 'N/A'}</td>
            <td>${arm.numeroCraf || 'N/A'}</td>
            <td>${arm.dataGuia ? new Date(arm.dataGuia + 'T00:00:00').toLocaleDateString() : 'N/A'}</td>
            <td>
              <button class="icon-btn" onclick="abrirModalEdicaoArmamento('${arm.id}')"><i class="fa-solid fa-pen-to-square"></i></button>
              <button class="icon-btn delete" onclick="excluirArmamento('${arm.id}')"><i class="fa-solid fa-trash-can"></i></button>
            </td>
          `;
            });
        }
        atualizarNotificacoes(armamentos, 'guia');
    } catch (error) {
        console.error("Erro ao carregar armamentos: ", error);
        tabela.innerHTML = '<tr><td colspan="6">Erro ao carregar os dados.</td></tr>';
    }
}

window.abrirModalEdicaoArmamento = async (id) => {
    armamentoIdEmEdicao = id;
    try {
        const doc = await firebase.firestore().collection("armamentos").doc(id).get();
        if (doc.exists) {
            const dados = doc.data();
            document.getElementById("edit-marca").value = dados.marca;
            document.getElementById("edit-modelo").value = dados.modelo;
            document.getElementById("edit-calibre").value = dados.calibre;
            document.getElementById("edit-numeroCraf").value = dados.numeroCraf;
            document.getElementById("edit-dataGuia").value = dados.dataGuia;
            document.getElementById("modal-edicao-armamento").style.display = "flex";
        }
    } catch (error) {
        console.error("Erro ao carregar armamento:", error);
    }
};

window.salvarEdicaoArmamento = async () => {
    const dados = {
        marca: document.getElementById("edit-marca").value,
        modelo: document.getElementById("edit-modelo").value,
        calibre: document.getElementById("edit-calibre").value,
        numeroCraf: document.getElementById("edit-numeroCraf").value,
        dataGuia: document.getElementById("edit-dataGuia").value,
    };
    try {
        await firebase.firestore().collection("armamentos").doc(armamentoIdEmEdicao).update(dados);
        alert("Armamento atualizado com sucesso!");
        document.getElementById("modal-edicao-armamento").style.display = "none";
        carregarArmamentos();
    } catch (error) {
        console.error("Erro ao salvar armamento:", error);
        alert("Erro ao salvar armamento.");
    }
};

window.excluirArmamento = async (id) => {
    if (confirm("Tem certeza que deseja excluir este armamento?")) {
        try {
            await firebase.firestore().collection("armamentos").doc(id).delete();
            alert("Armamento excluído com sucesso!");
            carregarArmamentos();
        } catch (error) {
            console.error("Erro ao excluir armamento: ", error);
            alert("Erro ao excluir armamento.");
        }
    }
};

// ========================================
// Notificações
// ========================================

function renderNotifications() {
    notificationDropdown.innerHTML = '';
    if (globalNotifications.length === 0) {
        notificationDropdown.innerHTML = `<p class="no-notifications">Nenhuma notificação</p>`;
        notificationCountElement.textContent = '0';
        notificationCountElement.style.display = 'none';
    } else {
        globalNotifications.forEach(notif => {
            const div = document.createElement('div');
            div.className = 'notification-item';
            div.innerHTML = `<p>${notif.message}</p>`;
            notificationDropdown.appendChild(div);
        });
        notificationCountElement.textContent = globalNotifications.length;
        notificationCountElement.style.display = 'flex';
    }
}

function atualizarNotificacoes(dados, tipo) {
    const hoje = new Date();
    const alertas = [];
    dados.forEach(d => {
        if (tipo === 'alvara' && d.validadeAlvara) {
            const dataValidade = new Date(d.validadeAlvara);
            const diff = (dataValidade - hoje) / (1000 * 60 * 60 * 24);
            if (diff <= 30) {
                alertas.push({
                    message: `Alvará de ${d.nomeEstabelecimento} vence em ${Math.ceil(diff)} dia(s).`
                });
            }
        }
        if (tipo === 'guia' && d.dataGuia) {
            const dataValidade = new Date(d.dataGuia);
            const diff = (dataValidade - hoje) / (1000 * 60 * 60 * 24);
            if (diff <= 30) {
                alertas.push({
                    message: `Guia de tráfego de ${d.numeroCraf} vence em ${Math.ceil(diff)} dia(s).`
                });
            }
        }
    });
    globalNotifications = alertas;
    renderNotifications();
}

// Botão sino + clique fora
notificationIconContainer.addEventListener('click', (e) => {
    e.stopPropagation();
    notificationDropdown.classList.toggle('active');
});

document.addEventListener('click', (e) => {
    if (!notificationDropdown.contains(e.target) && !notificationIconContainer.contains(e.target)) {
        notificationDropdown.classList.remove('active');
    }
});

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    abrirDashboard();
    // Você pode adicionar um listener para navegação aqui se necessário
});

buscaEstabelecimento.addEventListener("input", () => {
    const secaoAtiva = tituloSecao.innerText;
    if (secaoAtiva.includes("estabelecimentos")) {
        carregarEstabelecimentos();
    } else if (secaoAtiva.includes("Armamentos")) {
        carregarArmamentos();
    }
});