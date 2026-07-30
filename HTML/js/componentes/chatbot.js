/* Chatbot de FAQ flutuante: botão fixo no canto da tela que abre um painel
   de perguntas frequentes com respostas prontas (sem IA, sem backend —
   ver Danca.faq em js/dados/faq.js). Presente em todas as páginas. */
window.Danca = window.Danca || {};
Danca.ui = Danca.ui || {};

(function () {
  Danca.ui.montarChatbot = function () {
    if (document.getElementById("chatbot-botao")) return; // evita duplicar se chamado 2x

    const raiz = document.createElement("div");
    raiz.className = "chatbot";
    raiz.innerHTML = `
      <button type="button" class="chatbot__botao" id="chatbot-botao" aria-expanded="false" aria-controls="chatbot-painel" aria-label="Abrir chat de dúvidas frequentes">
        <i class="ph ph-bold ph-chat-circle-dots" aria-hidden="true"></i>
      </button>
      <div class="chatbot__painel" id="chatbot-painel" hidden>
        <div class="chatbot__cabecalho">
          <div>
            <strong>Tira-dúvidas</strong>
            <span class="texto-pequeno" style="color: var(--ivory-dim); display: block">Perguntas frequentes</span>
          </div>
          <button type="button" class="chatbot__fechar" id="chatbot-fechar" aria-label="Fechar chat">
            <i class="ph ph-bold ph-x" aria-hidden="true"></i>
          </button>
        </div>
        <div class="chatbot__corpo" id="chatbot-corpo"></div>
      </div>`;
    document.body.appendChild(raiz);

    const botao = document.getElementById("chatbot-botao");
    const painel = document.getElementById("chatbot-painel");
    const fechar = document.getElementById("chatbot-fechar");

    botao.addEventListener("click", () => alternarPainel());
    fechar.addEventListener("click", () => alternarPainel(false));
    document.addEventListener("keydown", (evento) => {
      if (evento.key === "Escape" && !painel.hidden) alternarPainel(false);
    });

    function alternarPainel(forcarAberto) {
      const abrir = forcarAberto !== undefined ? forcarAberto : painel.hidden;
      painel.hidden = !abrir;
      botao.setAttribute("aria-expanded", String(abrir));
      if (abrir && document.getElementById("chatbot-corpo").childElementCount === 0) {
        mostrarListaPerguntas();
      }
    }

    function mostrarListaPerguntas() {
      const corpo = document.getElementById("chatbot-corpo");
      corpo.innerHTML = `
        <p class="chatbot__intro">Oi! Escolha uma pergunta abaixo:</p>
        <div class="chatbot__lista">
          ${Danca.faq
            .map((item, indice) => `<button type="button" class="chatbot__pergunta" data-indice="${indice}">${Danca.ui.escapar(item.pergunta)}</button>`)
            .join("")}
        </div>`;
      corpo.querySelectorAll(".chatbot__pergunta").forEach((botaoPergunta) => {
        botaoPergunta.addEventListener("click", () => mostrarResposta(Number(botaoPergunta.dataset.indice)));
      });
    }

    function mostrarResposta(indice) {
      const item = Danca.faq[indice];
      const corpo = document.getElementById("chatbot-corpo");
      corpo.innerHTML = `
        <button type="button" class="chatbot__voltar" id="chatbot-voltar"><i class="ph ph-bold ph-arrow-left" aria-hidden="true"></i> Voltar</button>
        <div class="chatbot__mensagem chatbot__mensagem--usuario">${Danca.ui.escapar(item.pergunta)}</div>
        <div class="chatbot__mensagem chatbot__mensagem--bot">${Danca.ui.escapar(item.resposta)}</div>`;
      document.getElementById("chatbot-voltar").addEventListener("click", mostrarListaPerguntas);
    }
  };
})();
