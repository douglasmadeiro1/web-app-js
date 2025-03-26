// Inicializar o Firebase Storage
const storage = firebase.storage();

// Função para processar e fazer upload dos arquivos para o Firebase
function handleFileUpload(event) {
    const files = event.target.files;
    
    // Limpa a galeria antes de adicionar os novos arquivos
    fileGallery.innerHTML = '';

    Array.from(files).forEach(file => {
        // Cria referência para o arquivo no Firebase Storage
        const storageRef = storage.ref(`uploads/${file.name}`);
        const uploadTask = storageRef.put(file);

        uploadTask.on('state_changed', 
            (snapshot) => {
                // Acompanhe o progresso, se necessário
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log(`Progresso: ${progress}%`);
            }, 
            (error) => {
                // Trata erros
                console.error('Erro ao fazer upload', error);
            }, 
            () => {
                // Quando o upload for concluído, obtenha a URL de download
                uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                    const fileItem = document.createElement('div');
                    fileItem.classList.add('file-item');

                    const previewContainer = document.createElement('div');
                    previewContainer.classList.add('file-preview');
                    previewContainer.innerHTML = `
                        <h3>${file.name}</h3>
                        <button onclick="openFile('${downloadURL}', '${file.name}')">Abrir</button>
                        <button onclick="downloadFile('${file.name}', '${downloadURL}')">Baixar</button>
                        <button onclick="printFile('${downloadURL}')">Imprimir</button>
                    `;
                    fileItem.appendChild(previewContainer);
                    fileGallery.appendChild(fileItem);
                });
            }
        );
    });
}

// Função para abrir o arquivo (PDF ou DOCX)
function openFile(url, fileName) {
    if (fileName.endsWith('.pdf')) {
        const pdfWindow = window.open(url, '_blank');
        pdfWindow.focus();
    } else if (fileName.endsWith('.docx')) {
        // Para o DOCX, o ideal é usar uma ferramenta para visualização online
        window.open(url, '_blank');
    }
}

// Função para baixar o arquivo
function downloadFile(fileName, url) {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
}

// Função para imprimir o arquivo
function printFile(url) {
    const printWindow = window.open(url, '_blank');
    printWindow.focus();
    printWindow.print();
}
