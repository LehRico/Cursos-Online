(function () {
  document.addEventListener("DOMContentLoaded", async () => {
    Danca.ui.montarNavegacao("index.html");
    Danca.ui.montarRodape();
    Danca.ui.montarChatbot();
    montarAcoesHero();
    Danca.ui.observarRevelacao();
    await montarGradeModalidades();
    montarCarrossel();
  });

  function montarAcoesHero() {
    const usuario = Danca.sessao.obter();
    const acoes = document.getElementById("hero-acoes");
    if (!usuario) {
      acoes.innerHTML = `
        <a class="botao botao--primario" href="catalogo.html">Ver cursos</a>
        <a class="botao botao--contorno" href="login.html">Entrar</a>`;
    } else if (usuario.role === "aluno") {
      acoes.innerHTML = `
        <a class="botao botao--primario" href="catalogo.html">Ver cursos</a>
        <a class="botao botao--contorno" href="perfil.html">Minhas matrículas</a>`;
    } else {
      const rotuloPainel = usuario.role === "admin" ? "Painel do administrador" : "Painel do professor";
      acoes.innerHTML = `
        <a class="botao botao--primario" href="catalogo.html">Ver cursos</a>
        <a class="botao botao--contorno" href="painel-professor.html">${rotuloPainel}</a>`;
    }
  }

  async function montarGradeModalidades() {
    const grade = document.getElementById("grade-modalidades");
    // Cada modalidade pode ter uma foto própria cadastrada pelo professor/admin
    // (Danca.api); sem ela, cai no placeholder autoral por modalidade.
    let modalidadesApi = [];
    try {
      modalidadesApi = await Danca.api.listar("modalidades");
    } catch {
      /* segue com o placeholder padrão de cada modalidade se a API falhar */
    }

    grade.innerHTML = Danca.modalidades.LISTA_FIXA.map((meta) => {
      const dadosApi = modalidadesApi.find((m) => m.id === meta.id);
      return `
        <a href="catalogo.html?modalidade=${encodeURIComponent(meta.id)}" class="cartao-modalidade revelar" style="--gel: var(${meta.corVar})" data-modalidade="${meta.id}">
          <img src="${Danca.modalidades.imagemCapa(meta.id, dadosApi)}" alt="" loading="lazy" onerror="this.remove()" />
          <span class="cartao-modalidade__nome">${Danca.ui.escapar(meta.nome)}</span>
        </a>`;
    }).join("");

    Danca.ui.observarRevelacao("#grade-modalidades .revelar");
  }

  function montarCarrossel() {
    const trilha = document.getElementById("grade-modalidades");
    const botaoAnterior = document.getElementById("carrossel-anterior");
    const botaoProximo = document.getElementById("carrossel-proximo");
    if (!trilha || !botaoAnterior || !botaoProximo) return;

    function distanciaScroll() {
      const cartao = trilha.querySelector(".cartao-modalidade");
      if (!cartao) return trilha.clientWidth;
      const estilo = getComputedStyle(trilha);
      return cartao.getBoundingClientRect().width + parseFloat(estilo.columnGap || estilo.gap || "0");
    }

    function atualizarEstadoSetas() {
      const maximoScroll = trilha.scrollWidth - trilha.clientWidth;
      botaoAnterior.disabled = trilha.scrollLeft <= 1;
      botaoProximo.disabled = trilha.scrollLeft >= maximoScroll - 1;
    }

    botaoAnterior.addEventListener("click", () => {
      trilha.scrollBy({ left: -distanciaScroll(), behavior: "smooth" });
    });
    botaoProximo.addEventListener("click", () => {
      trilha.scrollBy({ left: distanciaScroll(), behavior: "smooth" });
    });

    trilha.addEventListener("scroll", atualizarEstadoSetas, { passive: true });
    window.addEventListener("resize", atualizarEstadoSetas);
    atualizarEstadoSetas();
  }
})();
