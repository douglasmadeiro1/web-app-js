let selectedFile = null;

document.getElementById('fileInput').addEventListener('change', (e) => {
  selectedFile = e.target.files[0];
  document.getElementById("status").innerText = `Arquivo selecionado: ${selectedFile.name}`;
});

document.getElementById('processarBtn').addEventListener('click', () => {
  if (!selectedFile) {
    document.getElementById("status").innerText = "Por favor, selecione um arquivo primeiro.";
    return;
  }

  const reader = new FileReader();

  reader.onload = function (evt) {
    const data = new Uint8Array(evt.target.result);
    const workbook = XLSX.read(data, { type: 'array' });

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet);

    if (json.length === 0) {
      document.getElementById("status").innerText = "Nenhuma linha encontrada na planilha.";
      return;
    }

    json.forEach((row, i) => {
      const rawDate = row["Data/Hora"];
      if (!rawDate) {
        row["Plantão"] = "NÃO CLASSIFICADO";
        return;
      }

      const date = new Date(rawDate.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3'));
      if (isNaN(date)) {
        row["Plantão"] = "NÃO CLASSIFICADO";
      } else {
        row["Plantão"] = classifyShift(date);
      }
    });

    const grupos = { ALFA: [], BRAVO: [], CHARLIE: [], DELTA: [] };
    json.forEach(row => {
      const p = row["Plantão"];
      if (grupos[p]) grupos[p].push(row);
    });

    document.getElementById("status").innerText = "Gerando arquivos com gráficos...";

    const plantaoNomes = ["ALFA", "BRAVO", "CHARLIE", "DELTA"];
    let count = 0;

    plantaoNomes.forEach(plantao => {
      const dados = grupos[plantao];
      if (dados.length > 0) {
        const contagem = contarPorHora(dados);
        const canvasId = "grafico" + plantao;
        plotarGrafico(canvasId, contagem, plantao);

        setTimeout(() => {
          const canvas = document.getElementById(canvasId);
          exportarGraficoEPlanilha(dados, canvas, `plantao_${plantao}_com_grafico.xlsx`);
          count++;
          if (count === plantaoNomes.length) {
            document.getElementById("status").innerText = "Todos os arquivos foram gerados com sucesso!";
          }
        }, 1000 + count * 500);
      }
    });
  };

  reader.onerror = function (e) {
    console.error("Erro ao ler o arquivo:", e);
    document.getElementById("status").innerText = "Erro ao ler o arquivo.";
  };

  reader.readAsArrayBuffer(selectedFile);
});
