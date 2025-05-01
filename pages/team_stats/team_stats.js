function isNightShift(hour) {
    return hour >= 18 || hour < 6;
  }

  function classifyShift(date) {
    const day = date.getDate();
    const hour = date.getHours();
    const month = date.getMonth() + 1; // Janeiro = 1
    const isEven = day % 2 === 0;
    const isOdd = !isEven;
    const isDay = hour >= 6 && hour < 18;
    const isNight = isNightShift(hour);

    // ALFA
    if ((month === 1 && isEven && isDay) ||
        ((month === 2 || month === 3) && isOdd && isDay)) return 'ALFA';

    // BRAVO
    if ((month === 1 && isEven && isNight) ||
        ((month === 2 || month === 3) && isOdd && isNight)) return 'BRAVO';

    // CHARLIE
    if ((month === 1 && isOdd && isDay) ||
        ((month === 2 || month === 3) && isEven && isDay)) return 'CHARLIE';

    // DELTA
    if ((month === 1 && isOdd && isNight) ||
        ((month === 2 || month === 3) && isEven && isNight)) return 'DELTA';

    return 'NÃO CLASSIFICADO';
  }

  document.getElementById('fileInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = function (evt) {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);

      // Adiciona campo de plantão
      json.forEach(row => {
        const dateStr = row["Data/Hora"];
        const date = new Date(dateStr.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3'));
        row["Plantão"] = classifyShift(date);
      });

      // Separar por plantão
      const grupos = { ALFA: [], BRAVO: [], CHARLIE: [], DELTA: [] };
      json.forEach(row => {
        const p = row["Plantão"];
        if (grupos[p]) grupos[p].push(row);
      });

      // Gerar arquivos
      for (const [nome, dados] of Object.entries(grupos)) {
        if (dados.length > 0) {
          const ws = XLSX.utils.json_to_sheet(dados);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, nome);
          XLSX.writeFile(wb, `plantao_${nome}.xlsx`);
        }
      }

      document.getElementById('status').innerText = 'Arquivos gerados com sucesso!';
    };
    reader.readAsArrayBuffer(file);
  });