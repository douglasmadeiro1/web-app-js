// Código JavaScript completo com suporte a classe de produto e filtro por classe

const db = firebase.firestore();
let estabelecimentoIdEmEdicao = null;
let armamentoIdEmEdicao = null; // Variável global para armazenar o ID do armamento em edição
let notifications = []; // Variável global para armazenar as notificações

function logout() {
    firebase.auth().signOut()
        .then(() => window.location.href = "../index.html")
        .catch((error) => alert("Erro ao sair: " + error.message));
}

function voltarParaDashboard() {
    document.getElementById("titulo-secao").innerText = "Dashboard";
    document.getElementById("secao-conteudo").innerHTML = `<p>Bem-vindo! Selecione uma opção no menu para começar.</p>`;
}

function salvarEstabelecimento(event) {
    event.preventDefault();

    const nomeEstabelecimento = document.getElementById("nome-estabelecimento").value.trim();
    const enderecoEstabelecimento = document.getElementById("endereco-estabelecimento").value.trim();
    const nomeResponsavel = document.getElementById("nome-responsavel").value.trim();
    const enderecoResponsavel = document.getElementById("endereco-responsavel").value.trim();
    const telefone = document.getElementById("telefone").value.trim();
    const validadeAlvara = document.getElementById("data-validade-alvara").value;
    const tipoEstabelecimento = document.getElementById("tipo-estabelecimento").value;

    if (!nomeEstabelecimento || !enderecoEstabelecimento || !nomeResponsavel || !enderecoResponsavel || !telefone || !validadeAlvara || !tipoEstabelecimento) {
        mostrarMensagem("Preencha todos os campos.");
        return;
    }

    db.collection("estabelecimentos").add({
        nomeEstabelecimento,
        enderecoEstabelecimento,
        nomeResponsavel,
        enderecoResponsavel,
        telefone,
        validadeAlvara,
        tipoEstabelecimento,
        criadoEm: new Date()
    }).then(() => {
        document.getElementById("form-estabelecimento").reset();
        carregarEstabelecimentos();
        verificarNotificacoes();
    }).catch((error) => {
        mostrarMensagem("Erro ao salvar estabelecimento: " + error.message);
    });
}

async function carregarEstabelecimentos() {
    const lista = document.getElementById("lista-estabelecimentos");
    lista.innerHTML = "<p>Carregando estabelecimentos...</p>";

    try {
        const snapshot = await db.collection("estabelecimentos").orderBy("nomeEstabelecimento").get();
        if (snapshot.empty) {
            lista.innerHTML = "<p>Nenhum estabelecimento cadastrado.</p>";
            return;
        }
        lista.innerHTML = "";

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        for (const doc of snapshot.docs) {
            const c = doc.data();
            const estabelecimentoId = doc.id;

            let clientCardClasses = ['card'];
            let hasOverdueAlvara = false;
            let isNearDueAlvara = false;
            let hasOverdueArmament = false;
            let isNearDueArmament = false;

            // 1. Verificar validade do alvará
            if (c.validadeAlvara) {
                const dataValidadeAlvara = new Date(c.validadeAlvara + 'T00:00:00');
                const diffTimeAlvara = dataValidadeAlvara.getTime() - hoje.getTime();
                const diffDaysAlvara = Math.ceil(diffTimeAlvara / (1000 * 60 * 60 * 24));

                if (diffDaysAlvara < 0) {
                    hasOverdueAlvara = true;
                } else if (diffDaysAlvara <= 30) {
                    isNearDueAlvara = true;
                }
            }
            
            // 2. Verificar Guias de Tráfego dos Armamentos
            const armamentosSnapshot = await db.collection("estabelecimentos").doc(estabelecimentoId).collection("armamentos").get();
            armamentosSnapshot.forEach(armaDoc => {
                const armamento = armaDoc.data();
                if (armamento.dataGuia) {
                    const dataGuia = new Date(armamento.dataGuia + 'T00:00:00');
                    const diffTimeArma = dataGuia.getTime() - hoje.getTime();
                    const diffDaysArma = Math.ceil(diffTimeArma / (1000 * 60 * 60 * 24));

                    if (diffDaysArma < 0) {
                        hasOverdueArmament = true;
                    } else if (diffDaysArma > 0 && diffDaysArma <= 30) {
                        isNearDueArmament = true;
                    }
                }
            });

            // Adicionar classes CSS ao card com base nos status
            if (hasOverdueAlvara || hasOverdueArmament) {
                clientCardClasses.push('card-overdue');
            } else if (isNearDueAlvara || isNearDueArmament) {
                clientCardClasses.push('card-near-due');
            }

            const div = document.createElement("div");
            div.className = clientCardClasses.join(' ');
            div.style.cursor = "pointer";

            // Conteúdo principal do card
            let cardContent = `
                <h3>${c.nomeEstabelecimento}</h3>
                <p>Endereço: ${c.enderecoEstabelecimento}</p>
                <p>Telefone: ${c.telefone}</p>
                <p>Validade do Alvará: ${formatarData(c.validadeAlvara)}</p>
            `;
            div.innerHTML = cardContent;

            // Div para os ícones
            const pendenciasDiv = document.createElement('div');
            pendenciasDiv.classList.add('pendencias-icons');

            // Ícones de pendência de alvará
            if (hasOverdueAlvara) {
                pendenciasDiv.innerHTML += `<i class="fas fa-exclamation-circle pendencia-icon" title="Alvará Vencido"></i>`;
            } else if (isNearDueAlvara) {
                pendenciasDiv.innerHTML += `<i class="fas fa-exclamation-triangle alerta-icon" title="Alvará Próximo do Vencimento"></i>`;
            } else {
                 pendenciasDiv.innerHTML += `<i class="fas fa-check-circle ok-icon" title="Alvará em Dia"></i>`;
            }

            // Ícones de pendência de armamento
            if (hasOverdueArmament) {
                 pendenciasDiv.innerHTML += `<i class="fas fa-exclamation-circle pendencia-icon" title="Guia de Tráfego Vencida"></i>`;
            } else if (isNearDueArmament) {
                 pendenciasDiv.innerHTML += `<i class="fas fa-exclamation-triangle alerta-icon" title="Guia de Tráfego Próxima do Vencimento"></i>`;
            } else {
                 pendenciasDiv.innerHTML += `<i class="fas fa-check-circle ok-icon" title="Guia de Tráfego em Dia"></i>`;
            }

            div.appendChild(pendenciasDiv);
            div.onclick = () => abrirModalEdicaoEstabelecimento(doc.id, c);
            lista.appendChild(div);
        }
    } catch (err) {
        lista.innerHTML = `<p>Erro ao carregar estabelecimentos: ${err.message}</p>`;
    }
}

function abrirModalEdicaoEstabelecimento(id, dados) {
    estabelecimentoIdEmEdicao = id;
    const modal = document.getElementById("modal-edicao-estabelecimento");
    modal.classList.remove("hidden");

    document.getElementById("edit-nome-estabelecimento").value = dados.nomeEstabelecimento || "";
    document.getElementById("edit-endereco-estabelecimento").value = dados.enderecoEstabelecimento || "";
    document.getElementById("edit-nome-responsavel").value = dados.nomeResponsavel || "";
    document.getElementById("edit-endereco-responsavel").value = dados.enderecoResponsavel || "";
    document.getElementById("edit-telefone").value = dados.telefone || "";
    document.getElementById("edit-data-validade-alvara").value = dados.validadeAlvara || "";
    document.getElementById("edit-tipo-estabelecimento").value = dados.tipoEstabelecimento || "";


    carregarArmamentos(id);
}

function fecharModalEdicaoEstabelecimento() {
    document.getElementById("modal-edicao-estabelecimento").classList.add("hidden");
    estabelecimentoIdEmEdicao = null;
}

function salvarEdicaoEstabelecimento() {
    if (!estabelecimentoIdEmEdicao) {
        mostrarMensagem("Nenhum estabelecimento selecionado para edição.");
        return;
    }

    const nomeEstabelecimento = document.getElementById("edit-nome-estabelecimento").value.trim();
    const enderecoEstabelecimento = document.getElementById("edit-endereco-estabelecimento").value.trim();
    const nomeResponsavel = document.getElementById("edit-nome-responsavel").value.trim();
    const enderecoResponsavel = document.getElementById("edit-endereco-responsavel").value.trim();
    const telefone = document.getElementById("edit-telefone").value.trim();
    const validadeAlvara = document.getElementById("edit-data-validade-alvara").value;
    const tipoEstabelecimento = document.getElementById("edit-tipo-estabelecimento").value;

    if (!nomeEstabelecimento || !enderecoEstabelecimento || !nomeResponsavel || !enderecoResponsavel || !telefone || !validadeAlvara || !tipoEstabelecimento) {
        mostrarMensagem("Por favor, preencha todos os campos do estabelecimento.");
        return;
    }

    db.collection("estabelecimentos").doc(estabelecimentoIdEmEdicao).update({
        nomeEstabelecimento,
        enderecoEstabelecimento,
        nomeResponsavel,
        enderecoResponsavel,
        telefone,
        validadeAlvara,
        tipoEstabelecimento,
        atualizadoEm: new Date()
    }).then(() => {
        mostrarMensagem("Estabelecimento atualizado com sucesso!");
        fecharModalEdicaoEstabelecimento();
        carregarEstabelecimentos();
        verificarNotificacoes();
    }).catch(error => {
        mostrarMensagem("Erro ao atualizar estabelecimento: " + error.message);
    });
}

function excluirEstabelecimento() {
    if (!estabelecimentoIdEmEdicao) {
        mostrarMensagem("Nenhum estabelecimento selecionado para exclusão.");
        return;
    }

    mostrarConfirmacao("Tem certeza que deseja excluir este estabelecimento e todos os seus armamentos?").then(confirmado => {
        if (confirmado) {

            db.collection("estabelecimentos").doc(estabelecimentoIdEmEdicao).collection("armamentos").get().then(snapshot => {
                const batch = db.batch();
                snapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });
                return batch.commit();
            }).then(() => {

                return db.collection("estabelecimentos").doc(estabelecimentoIdEmEdicao).delete();
            }).then(() => {
                mostrarMensagem("Estabelecimento e armamentos excluídos com sucesso!");
                fecharModalEdicaoEstabelecimento();
                carregarEstabelecimentos();
                verificarNotificacoes();
            }).catch(error => {
                mostrarMensagem("Erro ao excluir estabelecimento: " + error.message);
            });
        }
    });
}

function carregarEstabelecimentosParaSelecao() {
    return new Promise((resolve) => {
        let container = document.getElementById("estabelecimento-selecao-container");
        if (!container) {
            const painel = document.getElementById("comanda-panel");
            const divEstabelecimentos = document.createElement("div");
            divEstabelecimentos.id = "estabelecimento-selecao-container";
            divEstabelecimentos.style.marginTop = "10px";
            divEstabelecimentos.innerHTML = `
                <label for="select-estabelecimento">Estabelecimento:</label>
                <select id="select-estabelecimento" style="padding: 8px; width: 100%;">
                    <option value="">-- Selecione o estabelecimento --</option>
                </select>
            `;

            const numeroComandaEl = document.getElementById("numero-comanda");
            if (numeroComandaEl && numeroComandaEl.parentNode) {
                numeroComandaEl.parentNode.insertBefore(divEstabelecimentos, numeroComandaEl.nextSibling);
            } else {
                painel.insertBefore(divEstabelecimentos, painel.firstChild);
            }
        }

        const select = document.getElementById("select-estabelecimento");
        select.innerHTML = `<option value="">-- Selecione o estabelecimento --</option>`;

        db.collection("estabelecimentos").orderBy("nomeEstabelecimento").get().then(snapshot => {
            snapshot.forEach(doc => {
                const c = doc.data();
                const opt = document.createElement("option");
                opt.value = doc.id;
                opt.textContent = c.nomeEstabelecimento + " (" + c.enderecoEstabelecimento + ")";
                select.appendChild(opt);
            });
            resolve();
        });
    });
}

function cancelarFormularioArma() {
    const form = document.getElementById("form-armamento");
    form.style.display = "none";
    armamentoIdEmEdicao = null; // Limpa o ID do armamento em edição
}

// Função auxiliar para mostrar mensagens (substitui alert)
function mostrarMensagem(mensagem) {
    const modal = document.getElementById("modal-confirmacao"); // Reutiliza o modal de confirmação
    document.getElementById("modal-msg").textContent = mensagem;
    document.querySelector("#modal-confirmacao .modal-actions").style.display = "none"; // Esconde os botões Sim/Não
    modal.classList.remove("hidden");

    // Adiciona um botão "OK" para fechar a mensagem
    let okButton = document.getElementById("modal-ok-button");
    if (!okButton) {
        okButton = document.createElement("button");
        okButton.id = "modal-ok-button";
        okButton.textContent = "OK";
        okButton.onclick = () => modal.classList.add("hidden");
        document.querySelector("#modal-confirmacao .modal-content").appendChild(okButton);
    } else {
        okButton.style.display = "block"; // Mostra o botão OK se já existir
    }
}

// Modifica a função mostrarConfirmacao para esconder o botão OK
function mostrarConfirmacao(mensagem) {
    return new Promise((resolve) => {
        const modal = document.getElementById("modal-confirmacao");
        document.getElementById("modal-msg").textContent = mensagem;
        document.querySelector("#modal-confirmacao .modal-actions").style.display = "flex"; // Mostra os botões Sim/Não

        const okButton = document.getElementById("modal-ok-button");
        if (okButton) okButton.style.display = "none"; // Esconde o botão OK

        modal.classList.remove("hidden");

        window.resolverConfirmacao = (resposta) => {
            modal.classList.add("hidden");
            resolve(resposta);
        };
    });
}

function abrirSecao(secao, estabelecimentoIdParaModal = null) {
    const titulo = document.getElementById("titulo-secao");
    const conteudo = document.getElementById("secao-conteudo");

    if (secao === "produtos") {
        titulo.innerText = "Cadastro de Produtos";
        conteudo.innerHTML = `
            <form id="form-produto" onsubmit="salvarProduto(event)" style="margin-bottom: 30px;">
                <h3>Adicionar Produto</h3>
                <input type="text" id="nome-produto" placeholder="Nome do produto" required style="padding: 10px; width: 100%; margin: 10px 0;">
                <input type="number" step="0.01" id="valor-produto" placeholder="Valor (R$)" required style="padding: 10px; width: 100%; margin-bottom: 10px;">
                <select id="classe-produto" style="padding: 10px; width: 100%; margin-bottom: 10px;" required>
                    <option value="">Selecione a classe</option>
                    <option value="Competições">Competições</option>
                    <option value="Lanchonete">Lanchonete</option>
                    <option value="Treino">Treino</option>
                    <option value="PCE">PCE</option>
                    <option value="Secretaria">Secretaria</option>
                </select>

                <button type="submit" class="btn-green">Salvar Produto</button>
            </form>
            <div id="filtro-classes-produtos" class="filtro-classe-container"></div>
            <div class="widgets" id="lista-produtos"></div>
        `;
        carregarProdutos();
        criarBotoesFiltroClasse("filtro-classes-produtos", (classe) => {
            carregarProdutos(classe);
            criarBotoesFiltroClasse("filtro-classes-produtos", (c) => carregarProdutos(c), classe);
        });
    }

    else if (secao === "estabelecimentos") {
        titulo.innerText = "Cadastro de estabelecimentos comerciais";
        conteudo.innerHTML = `
        <form id="form-estabelecimento" onsubmit="salvarEstabelecimento(event)" style="margin-bottom: 30px;">
            <h3>Adicionar estabelecimento</h3>
            <input type="text" id="nome-estabelecimento" placeholder="Nome do estabelecimento ou razão social" required style="padding: 10px; width: 100%; margin: 10px 0;" />
            <input type="text" id="endereco-estabelecimento" placeholder="Endereço" required style="padding: 10px; width: 100%; margin: 10px 0;" />
            <input type="text" id="nome-responsavel" placeholder="Nome do responsável" required style="padding: 10px; width: 100%; margin: 10px 0;" />
            <input type="text" id="endereco-responsavel" placeholder="Endereço do responsável" required style="padding: 10px; width: 100%; margin: 10px 0;" />
            <input type="tel" id="telefone" placeholder="Telefone" required style="padding: 10px; width: 100%; margin: 10px 0;" />
            
            <label for="data-validade-alvara">Validade do alvará de funcionamento:</label>
            <input type="date" id="data-validade-alvara" required style="padding: 10px; width: 100%; margin: 10px 0;" />

            <label for="tipo-estabelecimento">Tipo de local:</label>
            <select id="tipo-estabelecimento" required>
                <option value="">Selecione o tipo</option>
                <option value="bar">Bar</option>
                <option value="restaurante">Restaurante</option>
                <option value="comercioRoupas">Comércio de roupas</option>
            </select>

            <button type="submit" class="btn-green">Salvar Estabelecimento</button>
        </form>
        <div id="lista-estabelecimentos" class="widgets"></div>
    `;
        carregarEstabelecimentos();

        if (estabelecimentoIdParaModal) {
            db.collection("estabelecimentos").doc(estabelecimentoIdParaModal).get().then(doc => {
                if (doc.exists) {
                    abrirModalEdicaoEstabelecimento(doc.id, doc.data());
                }
            });
        }
    }
}

window.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const sidebarLinks = document.querySelectorAll('.sidebar a');

    menuToggle.addEventListener('click', () => {
        sidebar.classList.add('active');
        overlay.classList.add('active');
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });

    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
            }
        });
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const body = document.body;
    const toggleTop = document.getElementById('toggleTheme');
    const toggleSide = document.getElementById('toggleThemeSidebar');

    function applyTheme(isDark) {
        if (isDark) {
            body.classList.add("dark");
        } else {
            body.classList.remove("dark");
        }

        if (toggleTop) toggleTop.checked = isDark;
        if (toggleSide) toggleSide.checked = isDark;

        localStorage.setItem("theme", isDark ? "dark" : "light");
    }

    [toggleTop, toggleSide].forEach(toggle => {
        if (toggle) {
            toggle.addEventListener("change", () => {
                applyTheme(toggle.checked);
            });
        }
    });

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        applyTheme(true);
    } else {
        applyTheme(false);
    }
    
    // Inicia a verificação de notificações após o carregamento do DOM
    verificarNotificacoes();
});

function formatarData(dataStr) {
    if (!dataStr) return "---";
    const [ano, mes, dia] = dataStr.split("-");
    return `${dia}/${mes}/${ano}`;
}

// ========================================
// Funções de Notificação
// ========================================

async function verificarNotificacoes() {
    const notificationCountElement = document.getElementById('notification-count');
    const noNotificationsMessage = document.getElementById('no-notifications');

    notifications = []; // Limpa a variável global

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const estabelecimentosSnapshot = await db.collection("estabelecimentos").get();

    for (const doc of estabelecimentosSnapshot.docs) {
        const estabelecimento = doc.data();
        const estabelecimentoId = doc.id;

        // 1. Notificação do Alvará de Funcionamento
        if (estabelecimento.validadeAlvara) {
            const dataValidade = new Date(estabelecimento.validadeAlvara + 'T00:00:00');
            const diffTime = dataValidade.getTime() - hoje.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
                notifications.push({ type: 'Alvará Vencido', message: `O alvará de funcionamento de ${estabelecimento.nomeEstabelecimento} está VENCIDO!`, estabelecimentoId });
            } else if (diffDays <= 30) {
                notifications.push({ type: 'Alvará Vencendo', message: `O alvará de funcionamento de ${estabelecimento.nomeEstabelecimento} vence em ${diffDays} dia(s).`, estabelecimentoId });
            }
        }
        
        // 2. Notificação das Guias de Tráfego dos Armamentos
        const armamentosSnapshot = await db.collection("estabelecimentos").doc(estabelecimentoId).collection("armamentos").get();
        for (const armaDoc of armamentosSnapshot.docs) {
            const armamento = armaDoc.data();
            if (armamento.dataGuia) {
                const dataGuia = new Date(armamento.dataGuia + 'T00:00:00');
                const diffTime = dataGuia.getTime() - hoje.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays < 0) {
                    notifications.push({ type: 'Guia de Tráfego Vencida', message: `A guia de tráfego do armamento ${armamento.modelo} (${armamento.fabricante}) de ${estabelecimento.nomeEstabelecimento} está VENCIDA!`, estabelecimentoId });
                } else if (diffDays <= 30) {
                    notifications.push({ type: 'Guia de Tráfego Vencendo', message: `A guia de tráfego do armamento ${armamento.modelo} (${armamento.fabricante}) de ${estabelecimento.nomeEstabelecimento} vence em ${diffDays} dia(s).`, estabelecimentoId });
                }
            }
        }
    }

    renderNotifications();
}

function renderNotifications() {
    const notificationDropdown = document.getElementById('notification-dropdown');
    const notificationCountElement = document.getElementById('notification-count');

    notificationDropdown.innerHTML = ''; // Limpa as notificações existentes
    
    // Adiciona o título do dropdown
    const titleDiv = document.createElement('div');
    titleDiv.className = 'notification-title';
    titleDiv.innerHTML = '<h4></h4>';
    notificationDropdown.appendChild(titleDiv);

    if (notifications.length === 0) {
        notificationDropdown.innerHTML += '<p class="no-notifications">Nenhuma notificação</p>';
        notificationCountElement.style.display = 'none';
        return;
    }

    notifications.forEach((notif, index) => {
        const div = document.createElement('div');
        div.className = 'notification-item';
        div.innerHTML = `
            <span>${notif.message}</span>
            <button class="mark-as-read-btn" data-index="${index}">Lido</button>
        `;
        div.querySelector('.mark-as-read-btn').onclick = (event) => {
            event.stopPropagation();
            markNotificationAsRead(index);
        };
        div.onclick = () => {
            abrirSecao('estabelecimentos', notif.estabelecimentoId);
            notificationDropdown.classList.remove('active');
        };
        notificationDropdown.appendChild(div);
    });

    notificationCountElement.textContent = notifications.length;
    notificationCountElement.style.display = 'flex';
}

function markNotificationAsRead(index) {
    notifications.splice(index, 1);
    renderNotifications();
}

// Event listener para o ícone de notificação
document.getElementById('notification-icon-container').addEventListener('click', () => {
    const notificationDropdown = document.getElementById('notification-dropdown');
    notificationDropdown.classList.toggle('active');
});

// Fecha o dropdown de notificação se clicar fora
document.addEventListener('click', (event) => {
    const notificationIconContainer = document.getElementById('notification-icon-container');
    const notificationDropdown = document.getElementById('notification-dropdown');
    if (!notificationIconContainer.contains(event.target) && !notificationDropdown.contains(event.target)) {
        notificationDropdown.classList.remove('active');
    }
});

