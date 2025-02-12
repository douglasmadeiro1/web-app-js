let originalDocx = ""; // Guarda o DOCX original para substituir os campos

// 🔹 Carregar e processar o DOCX
document.getElementById('fileInput').addEventListener('change', async function(event) {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.docx')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const arrayBuffer = e.target.result;
            
            // Usando Mammoth para converter DOCX para HTML
            mammoth.convertToHtml({ arrayBuffer: arrayBuffer })
                .then(function(result) {
                    originalDocx = result.value; // Mantém o DOCX original
                    generatePreview(originalDocx);
                })
                .catch(function(err) {
                    console.error("Erro ao processar o DOCX:", err);
                });
        };
        reader.readAsArrayBuffer(file);
    }
});

// 🔹 Gerar o preview do documento mantendo a formatação original
function generatePreview(htmlContent) {
    const previewContainer = document.getElementById('docxPreview');
    previewContainer.innerHTML = ''; // Limpa o conteúdo anterior

    // Substitui campos "{campo}" por inputs editáveis
    const updatedContent = htmlContent.replace(/{([^}]+)}/g, function(match, p1) {
        return `<input type="text" class="editable" data-placeholder="${p1}" value="">`;
    });

    previewContainer.innerHTML = updatedContent;
}

// 🔹 Salvar as alterações mantendo a formatação
function saveDocument() {
    if (!originalDocx) {
        alert('Carregue um arquivo .docx antes de salvar.');
        return;
    }

    const inputs = document.querySelectorAll('.editable');
    let updatedDocx = originalDocx;

    // Substitui os placeholders pelos valores preenchidos
    inputs.forEach(input => {
        const placeholder = input.dataset.placeholder;
        const newValue = input.value || `[${placeholder}]`; // Se vazio, mantém o placeholder
        updatedDocx = updatedDocx.replace(`{${placeholder}}`, newValue);
    });

    // Criar um novo documento DOCX mantendo a formatação original
    const zip = new JSZip();
    zip.file("documento_editado.docx", updatedDocx);
    zip.generateAsync({ type: "blob" }).then(function(blob) {
        saveAs(blob, "documento_editado.docx");
    });
}

// 🔹 Imprimir o documento com formatação preservada
function printDocument() {
    const content = document.getElementById('docxPreview').innerHTML;
    const printWindow = window.open('', '', 'height=800,width=800');
    printWindow.document.write('<html><head><title>Imprimir Documento</title>');
    printWindow.document.write('<style>body { font-family: Arial, sans-serif; padding: 20px; }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(content); // Conteúdo a ser impresso
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}
