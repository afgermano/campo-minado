const modal = document.getElementById("gameModal");
const modalTitulo = document.getElementById("modalTitulo");
const modalMensagem = document.getElementById("modalMensagem");
const modalBtn = document.getElementById("modalBtn");

function showModal(titulo, mensagem){
    modalTitulo.innerText = titulo;
    modalMensagem.innerText = mensagem;
    modal.showModal();
}

modalBtn.addEventListener("click", () => {
    modal.close();
});