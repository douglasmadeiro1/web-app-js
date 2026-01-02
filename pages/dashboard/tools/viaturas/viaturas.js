let idViaturaEdicao = null;

document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("formViatura");
  const lista = document.getElementById("listaViaturas");
  const modal = document.getElementById("modalViatura");
  const btnAbrir = document.getElementById("abrirModalViatura");
  const fechar = modal.querySelector(".fechar");
  const msg = document.getElementById("msgViatura");
  const titulo = document.getElementById("tituloModalViatura");

  // =====================
  // MODAL
  // =====================
  btnAbrir.onclick = () => {
    idViaturaEdicao = null;
    titulo.textContent = "Nova Viatura";
    form.reset();
    modal.style.display = "flex";
  };

  fechar.onclick = () => modal.style.display = "none";

  window.onclick = (e) => {
    if (e.target === modal) modal.style.display = "none";
  };

  // =====================
  // SALVAR / EDITAR
  // =====================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      prefixo: prefixo.value.trim().toUpperCase(),
      placa: placa.value.trim().toUpperCase(),
      modelo: modelo.value.trim(),
      combustivel: combustivel.value,
      status: status.value
    };

    try {
      if (idViaturaEdicao) {
        await db.collection("viaturas").doc(idViaturaEdicao).update(data);
        msg.textContent = "✅ Viatura atualizada!";
      } else {

        const snap = await db.collection("viaturas")
          .where("prefixo", "==", data.prefixo)
          .get();

        if (!snap.empty) {
          alert("⚠️ Prefixo já cadastrado!");
          return;
        }

        await db.collection("viaturas").add(data);
        msg.textContent = "✅ Viatura cadastrada!";
      }

      modal.style.display = "none";
      form.reset();
      carregarViaturas();
      idViaturaEdicao = null;

    } catch (err) {
      console.error(err);
      msg.textContent = "❌ Erro ao salvar viatura!";
    }
  });

  // =====================
  // EDITAR
  // =====================
  window.editarViatura = async (id) => {
    const doc = await db.collection("viaturas").doc(id).get();
    if (!doc.exists) return;

    const v = doc.data();
    idViaturaEdicao = id;

    prefixo.value = v.prefixo || "";
    placa.value = v.placa || "";
    modelo.value = v.modelo || "";
    combustivel.value = v.combustivel || "Gasolina";
    status.value = v.status || "Ativa";

    titulo.textContent = "Editar Viatura";
    modal.style.display = "flex";
  };

  // =====================
  // EXCLUIR
  // =====================
  window.excluirViatura = async (id) => {
    if (confirm("Deseja excluir esta viatura?")) {
      await db.collection("viaturas").doc(id).delete();
      carregarViaturas();
    }
  };

  // =====================
  // LISTAGEM
  // =====================
  async function carregarViaturas() {
    lista.innerHTML = "";

    const busca = buscaViatura.value.toLowerCase();
    const filtro = filtroStatus.value;

    const snapshot = await db.collection("viaturas").get();

    snapshot.forEach(doc => {
      const v = doc.data();

      if (busca &&
        !v.prefixo.toLowerCase().includes(busca) &&
        !v.placa.toLowerCase().includes(busca)) return;

      if (filtro && v.status !== filtro) return;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${v.prefixo}</td>
        <td>${v.placa}</td>
        <td>${v.modelo || ""}</td>
        <td>${v.combustivel}</td>
        <td>${v.status}</td>
        <td>
          <button class="icon-btn" onclick="editarViatura('${doc.id}')">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="icon-btn delete" onclick="excluirViatura('${doc.id}')">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      `;
      lista.appendChild(tr);
    });
  }

  buscaViatura.addEventListener("input", carregarViaturas);
  filtroStatus.addEventListener("change", carregarViaturas);
  backBtn.addEventListener("click", () => history.back());

  carregarViaturas();
});
