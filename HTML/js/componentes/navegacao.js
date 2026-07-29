/* Cabeçalho/navegação compartilhado — renderizado via JS em todas as páginas,
   ajustando os links visíveis conforme o role da sessão simulada. */
window.Danca = window.Danca || {};
Danca.ui = Danca.ui || {};

(function () {
  const ITENS = [
    { href: "index.html", rotulo: "Catálogo", roles: null },
    { href: "painel-professor.html", rotulo: "Painel do professor", roles: ["professor", "admin"] },
    { href: "painel-admin.html", rotulo: "Usuários", roles: ["admin"] },
    { href: "perfil.html", rotulo: "Meu perfil", roles: ["aluno", "professor", "admin"] },
  ];

  Danca.ui.montarNavegacao = function (paginaAtual) {
    const alvo = document.getElementById("cabecalho");
    if (!alvo) return;

    const usuario = Danca.sessao.obter();

    const linksHtml = ITENS.filter((item) => !item.roles || (usuario && item.roles.includes(usuario.role)))
      .map(
        (item) =>
          `<a class="navegacao__link" href="${item.href}"${item.href === paginaAtual ? ' aria-current="page"' : ""}>${item.rotulo}</a>`
      )
      .join("");

    const areaUsuarioHtml = usuario
      ? `<span class="selo selo--role-${usuario.role}">${Danca.ui.rotuloRole(usuario.role)}</span>
         <span class="avatar" title="${Danca.ui.escapar(usuario.nome)}">${Danca.ui.avatarConteudo(usuario)}</span>
         <button class="botao botao--fantasma botao--pequeno" id="botao-sair" type="button">Sair</button>`
      : `<a class="botao botao--contorno botao--pequeno" href="login.html">Entrar</a>`;

    alvo.innerHTML = `
      <div class="cabecalho__envolucro envolucro">
        <a class="marca" href="index.html">Palco <em>Dança</em></a>
        <nav class="navegacao" id="navegacao-principal">${linksHtml}</nav>
        <div class="cabecalho__usuario">${areaUsuarioHtml}</div>
        <button class="menu-alternar" id="menu-alternar" type="button" aria-expanded="false" aria-controls="navegacao-principal" aria-label="Abrir menu">☰</button>
      </div>`;

    document.getElementById("botao-sair")?.addEventListener("click", () => {
      Danca.sessao.encerrar();
      window.location.href = "login.html";
    });

    const botaoMenu = document.getElementById("menu-alternar");
    const nav = document.getElementById("navegacao-principal");
    botaoMenu?.addEventListener("click", () => {
      const aberto = nav.classList.toggle("esta-aberta");
      botaoMenu.setAttribute("aria-expanded", String(aberto));
    });
  };
})();
