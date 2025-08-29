function isNightShift(hour) {
  return hour >= 18 || hour < 6;
}

function getEquipeByDate(date) {
  const refDate = new Date("2025-01-01T06:00:00");
  const diff = date - refDate;
  const shiftIndex = Math.floor(diff / (12 * 60 * 60 * 1000)) % 4;
  const equipes = ["CHARLIE", "DELTA", "ALFA", "BRAVO"];
  return equipes[(shiftIndex + 4) % 4]; // Corrige para evitar índices negativos
}

function processaPlanilha(callback) {
  const file = document.getElementById('fileInput').files[0];
  if (!file) return alert("Selecione uma planilha primeiro!");

  const reader = new FileReader();
  reader.onload = function (evt) {
    const data = new Uint8Array(evt.target.result);
    const workbook = XLSX.read(data, { type: 'array' });

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet);

    // Detectar a coluna que contém data
    let dataColuna = null;
    for (const key of Object.keys(json[0])) {
      const value = json[0][key];
      if (typeof value === 'string' || typeof value === 'number') {
        const testDate = new Date(value.toString().replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3'));
        if (!isNaN(testDate)) {
          dataColuna = key;
          break;
        }
      }
    }

    if (!dataColuna) return alert("Não foi possível detectar automaticamente a coluna de data.");

    json.forEach(row => {
      const dateStr = row[dataColuna];
      const date = new Date(dateStr.toString().replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3'));
      if (!isNaN(date)) {
        row["Plantão"] = getEquipeByDate(date);
      } else {
        row["Plantão"] = "DESCONHECIDO";
      }
    });

    const grupos = { CHARLIE: [], DELTA: [], ALFA: [], BRAVO: [], DESCONHECIDO: [] };
    json.forEach(row => {
      if (grupos[row["Plantão"]]) grupos[row["Plantão"]].push(row);
    });

    callback(grupos);
  };
  reader.readAsArrayBuffer(file);
}

document.getElementById("gerarArquivos").addEventListener("click", () => {
  processaPlanilha(grupos => {
    for (const [nome, dados] of Object.entries(grupos)) {
      if (dados.length > 0) {
        const ws = XLSX.utils.json_to_sheet(dados);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, nome);
        XLSX.writeFile(wb, `plantao_${nome}.xlsx`);
      }
    }
    document.getElementById("status").innerText = "Arquivos separados gerados com sucesso!";
  });
});

document.getElementById("gerarAbas").addEventListener("click", () => {
  processaPlanilha(grupos => {
    const wb = XLSX.utils.book_new();
    for (const [nome, dados] of Object.entries(grupos)) {
      if (dados.length > 0) {
        const ws = XLSX.utils.json_to_sheet(dados);
        XLSX.utils.book_append_sheet(wb, ws, nome);
      }
    }
    XLSX.writeFile(wb, "plantao_por_abas.xlsx");
    document.getElementById("status").innerText = "Arquivo com abas gerado com sucesso!";
  });
});


function back() {
    window.location.href = "../../releases/releases.html";
}