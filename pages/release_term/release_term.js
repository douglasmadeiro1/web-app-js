function ajustarFonte(input) {
const maxFontSize = 16;
const minFontSize = 8;
const step = 0.5;

// Começa tentando o maior font-size
let fontSize = maxFontSize;
input.style.fontSize = fontSize + "px";

// Reduz até caber
while (
    (input.scrollWidth > input.clientWidth || input.scrollHeight > input.clientHeight) &&
    fontSize > minFontSize
) {
    fontSize -= step;
    input.style.fontSize = fontSize + "px";
}

// Agora, tenta aumentar caso o texto tenha sido apagado
while (
    input.scrollWidth <= input.clientWidth &&
    input.scrollHeight <= input.clientHeight &&
    fontSize + step <= maxFontSize
) {
    fontSize += step;
    input.style.fontSize = fontSize + "px";

    // Se aumentou demais, volta um pouco
    if (input.scrollWidth > input.clientWidth || input.scrollHeight > input.clientHeight) {
    fontSize -= step;
    input.style.fontSize = fontSize + "px";
    break;
    }
}
}

// Aplica a todos os inputs e textareas com a classe 'input'
document.querySelectorAll('.input').forEach(el => {
// Inicializa no carregamento
ajustarFonte(el);

// Reage a digitação
el.addEventListener('input', () => ajustarFonte(el));

// Reage a redimensionamento da janela, se necessário
window.addEventListener('resize', () => ajustarFonte(el));
});

  document.querySelectorAll('.input, .observacao').forEach(el => {
  ajustarFonte(el);
  el.addEventListener('input', () => ajustarFonte(el));
  window.addEventListener('resize', () => ajustarFonte(el));
});

document.addEventListener('DOMContentLoaded', () => {
  const observacaoField = document.querySelector('.observacao');
  if (observacaoField) {
    observacaoField.value = ''; // Limpa o conteúdo do campo ao carregar
  }
});
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.input, textarea').forEach(el => el.value = '');
});