/* Rodapé compartilhado — renderizado via JS em todas as páginas (mesmo
   padrão de js/componentes/navegacao.js), pra não repetir o mesmo HTML em
   8 arquivos e facilitar manutenção. */
window.Danca = window.Danca || {};
Danca.ui = Danca.ui || {};

(function () {
  Danca.ui.montarRodape = function () {
    const alvo = document.getElementById("rodape");
    if (!alvo) return;

    alvo.innerHTML = `
      <div class="envolucro rodape__grade">
        <div class="rodape__coluna">
          <a class="marca" href="index.html">LeKa <em>Dance</em> Studio</a>
          <p class="rodape__nota">Projeto acadêmico de demonstração — dados fictícios, sem informações reais de alunos ou pagamentos.</p>
        </div>

        <div class="rodape__coluna">
          <h3 class="rodape__titulo">Navegação</h3>
          <nav class="rodape__links">
            <a href="index.html">Início</a>
            <a href="catalogo.html">Catálogo</a>
            <a href="login.html">Entrar</a>
            <a href="cadastro.html">Criar conta</a>
          </nav>
        </div>

        <div class="rodape__coluna">
          <h3 class="rodape__titulo">Contato</h3>
          <nav class="rodape__links">
            <a href="mailto:contato@lekadance.studio"><i class="ph ph-bold ph-envelope-simple" aria-hidden="true"></i> contato@lekadance.studio</a>
            <a href="tel:+5511992256058"><i class="ph ph-bold ph-whatsapp-logo" aria-hidden="true"></i> (11) 99225-6058</a>
            <span><i class="ph ph-bold ph-map-pin" aria-hidden="true"></i> São Paulo, SP</span>
          </nav>
        </div>
      </div>

      <div class="envolucro rodape__base">
        <span>© 2026 LeKa Dance Studio — atividade acadêmica.</span>
        <span>Desenvolvido por Letícia Rico e Kaique Santos.</span>
      </div>`;
  };
})();
