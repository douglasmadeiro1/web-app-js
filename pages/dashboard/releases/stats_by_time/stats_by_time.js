document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('fileInput').addEventListener('change', handleFile);
  document.getElementById('exportPDF').addEventListener('click', generatePDF);
});

let savedCanvases = [];

function handleFile(e) {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = function (evt) {
    const data = new Uint8Array(evt.target.result);
    const workbook = XLSX.read(data, { type: 'array' });

    const grupos = {};

    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet);

      const contagemPorHora = {};
      for (let i = 0; i < 24; i++) contagemPorHora[i] = 0;

      json.forEach(row => {
        const dateStr = row["Data/Hora"];
        if (!dateStr) return;

        const date = new Date(dateStr.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3'));
        const hora = date.getHours();
        contagemPorHora[hora]++;
      });

      grupos[sheetName] = contagemPorHora;
    });

    renderCharts(grupos);
  };

  reader.readAsArrayBuffer(file);
}

function renderCharts(grupos) {
  const container = document.getElementById('charts');
  container.innerHTML = '';
  savedCanvases = [];

  ["ALFA", "BRAVO", "CHARLIE", "DELTA"].forEach(equipe => {
    const data = grupos[equipe];
    if (!data) return;

    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    savedCanvases.push(canvas);

    const horas = Object.keys(data);
    const quantidades = Object.values(data);
    const max = Math.max(...quantidades);

    function interpolateColor(value, max) {
      const ratio = value / max;
      const r = Math.round(255 * ratio);
      const g = Math.round(255 * (1 - Math.abs(ratio - 0.5) * 2));
      const b = Math.round(255 * (1 - ratio));
      return `rgba(${r}, ${g}, ${b}, 0.7)`;
    }

    const backgroundColors = quantidades.map(val => interpolateColor(val, max));

    new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: horas.map(h => `${h}h`),
        datasets: [{
          label: `Ocorrências no plantão ${equipe}`,
          data: quantidades,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map(c => c.replace('0.7', '1')),
          borderWidth: 1,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
  display: true,
  text: `Distribuição Horária - Plantão ${equipe} (Total: ${quantidades.reduce((a, b) => a + b, 0)} ocorrências)`,
  font: { size: 18 }
},
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: context => ` ${context.parsed.y} ocorrência(s) às ${context.label}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Quantidade', font: { size: 14 } },
            ticks: { font: { size: 13 } }
          },
          x: {
            title: { display: true, text: 'Hora do Dia', font: { size: 14 } },
            ticks: { font: { size: 13 } }
          }
        }
      }
    });
  });
}

async function generatePDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p', 'mm', 'a4');

  const width = 180;
  const height = 90; // metade da altura da página A4 (aproximadamente)

  for (let i = 0; i < savedCanvases.length; i++) {
    const canvas = savedCanvases[i];
    const imgData = canvas.toDataURL('image/png');

    const posY = (i % 2 === 0) ? 10 : 110; // 10mm para o primeiro gráfico, 110mm para o segundo

    if (i > 0 && i % 2 === 0) {
      pdf.addPage(); // nova página a cada 2 gráficos
    }

    pdf.addImage(imgData, 'PNG', 15, posY, width, height);
  }

  pdf.save('relatorio_turnos.pdf');
}

function interpolateColor(value, max) {
  const ratio = value / max;
  const r = Math.floor(240 - ratio * 120); // vai de 240 (azul claro) a 120 (vermelho quente)
  const g = Math.floor(240 - ratio * 180); // esfria com mais intensidade
  const b = 255 - Math.floor(ratio * 100); // diminui levemente
  return `rgba(${r}, ${g}, ${b}, 0.8)`;
}

function back() {
    window.location.href = "../../releases/releases.html";
}