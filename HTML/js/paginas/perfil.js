(function () {
  let usuarioSessao;
  let novaFotoDataUrl = null;

  document.addEventListener("DOMContentLoaded", async () => {
    usuarioSessao = Danca.sessao.exigir(["aluno", "professor", "admin"]);
    if (!usuarioSessao) return;

    Danca.ui.montarNavegacao("perfil.html");
    Danca.ui.montarRodape();
    Danca.ui.montarChatbot();
    renderizarCabecalhoPerfil();
    Danca.ui.observarRevelacao();
    iniciarFundoDeNuvens();
    document.getElementById("formulario-perfil").addEventListener("submit", salvarPerfil);
    document.getElementById("campo-foto").addEventListener("change", aoEscolherFoto);

    if (usuarioSessao.role === "aluno") {
      document.getElementById("secao-aluno").hidden = false;
      Danca.ui.observarRevelacao();
      await carregarMinhasMatriculas();
    } else {
      renderizarAtalhosEquipe();
      Danca.ui.observarRevelacao();
    }
  });

  /*
    Fundo de nuvens animado (Vanta.js, efeito CLOUDS), igual ao que a home já
    usou — só que aqui vale pra qualquer papel (aluno, professor ou admin),
    já que "Meu perfil" é a mesma tela pros três. Cores tiradas de
    css/tokens.css (paleta "cortina de veludo" + dourado de marquise).

    Se o usuário pede menos movimento no sistema, ou as bibliotecas não
    carregaram (ex: sem internet), simplesmente não ativamos.
  */
  function iniciarFundoDeNuvens() {
    const prefereMenosMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefereMenosMovimento || typeof VANTA === "undefined") return;

    VANTA.CLOUDS({
      el: "#vanta-fundo",
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200.0,
      minWidth: 200.0,
      speed: 0.9,
      backgroundColor: 0x150d12, // --ink
      skyColor: 0x2a1420, // --curtain
      cloudColor: 0x401f33, // --curtain-alto
      cloudShadowColor: 0x0f0810,
      sunColor: 0xe3b23c, // --gold
      sunGlareColor: 0xf0cc74, // --gold-soft
      sunlightColor: 0xe3b23c, // --gold
    });
  }

  function renderizarCabecalhoPerfil() {
    document.getElementById("perfil-avatar").innerHTML = Danca.ui.avatarConteudo(usuarioSessao);
    document.getElementById("perfil-nome-atual").textContent = usuarioSessao.nome;
    document.getElementById("perfil-email-atual").textContent = usuarioSessao.email;
    const selo = document.getElementById("perfil-role-atual");
    selo.textContent = Danca.ui.rotuloRole(usuarioSessao.role);
    selo.className = `selo selo--role-${usuarioSessao.role}`;
    document.getElementById("campo-nome").value = usuarioSessao.nome;
    document.getElementById("dica-prefixo-senha-perfil").textContent =
      `Mín. 3 caracteres — a senha final começa com "${Danca.senhas.prefixo(usuarioSessao.role)}" (prefixo do seu papel).`;
  }

  function renderizarAtalhosEquipe() {
    document.getElementById("secao-equipe").hidden = false;
    document.getElementById("perfil-role-atalho").textContent = Danca.ui.rotuloRole(usuarioSessao.role).toLowerCase();

    const links = [];
    if (usuarioSessao.role === "professor" || usuarioSessao.role === "admin") {
      links.push('<a class="botao botao--contorno botao--bloco" href="painel-professor.html">Abrir painel do professor</a>');
    }
    if (usuarioSessao.role === "admin") {
      links.push('<a class="botao botao--contorno botao--bloco" href="painel-admin.html">Abrir painel administrativo</a>');
    }
    document.getElementById("perfil-links-atalho").innerHTML = links.join("");
  }

  async function aoEscolherFoto(evento) {
    const arquivo = evento.target.files[0];
    if (!arquivo) return;

    Danca.ui.limparErrosCampos(["campo-grupo-foto"]);
    try {
      novaFotoDataUrl = await Danca.ui.lerImagemComoDataUrl(arquivo);
      // pré-visualização imediata na bolinha do cabeçalho, antes mesmo de salvar
      document.getElementById("perfil-avatar").innerHTML = `<img src="${novaFotoDataUrl}" alt="" />`;
    } catch (erro) {
      Danca.ui.mostrarErroCampo("campo-grupo-foto", erro.message);
      evento.target.value = "";
    }
  }

  async function salvarPerfil(evento) {
    evento.preventDefault();
    const novoNome = document.getElementById("campo-nome").value.trim();
    const novaSenha = document.getElementById("campo-senha").value;

    Danca.ui.limparErrosCampos(["campo-grupo-nome", "campo-grupo-senha"]);

    if (!novoNome || novoNome.length < 3) {
      Danca.ui.mostrarErroCampo("campo-grupo-nome", "Informe um nome com pelo menos 3 caracteres.");
      return;
    }
    if (novaSenha && novaSenha.length < Danca.senhas.TAMANHO_MINIMO_RESTO) {
      Danca.ui.mostrarErroCampo("campo-grupo-senha", `A senha precisa ter pelo menos ${Danca.senhas.TAMANHO_MINIMO_RESTO} caracteres.`);
      return;
    }

    const dados = { nome: novoNome };
    if (novaSenha) dados.senha = Danca.senhas.montar(usuarioSessao.role, novaSenha);
    if (novaFotoDataUrl) dados.foto = novaFotoDataUrl;

    try {
      const atualizado = await Danca.api.atualizar("usuarios", usuarioSessao.id, dados);
      usuarioSessao = atualizado;
      Danca.sessao.definir(atualizado);
      novaFotoDataUrl = null;
      renderizarCabecalhoPerfil();
      Danca.ui.montarNavegacao("perfil.html");
      document.getElementById("campo-senha").value = "";
      document.getElementById("campo-foto").value = "";
      Danca.ui.mostrarAviso("Perfil atualizado!", "sucesso");
    } catch (erro) {
      Danca.ui.mostrarAviso(erro.message, "erro");
    }
  }

  async function carregarMinhasMatriculas() {
    const [matriculas, cursos, avaliacoes] = await Promise.all([
      Danca.api.listar("matriculas", { usuarioId: usuarioSessao.id }),
      Danca.api.listar("cursos"),
      Danca.api.listar("avaliacoes", { usuarioId: usuarioSessao.id }),
    ]);
    renderizarMatriculas(matriculas, cursos);
    renderizarAvaliacoes(avaliacoes, cursos);
  }

  function renderizarMatriculas(matriculas, cursos) {
    const lista = document.getElementById("lista-minhas-matriculas");
    if (matriculas.length === 0) {
      lista.innerHTML = `
        <div class="estado-vazio">
          <h3>Você ainda não se matriculou em nenhum curso</h3>
          <p>Volte ao catálogo e escolha um ritmo pra começar.</p>
          <a class="botao botao--primario" style="margin-top: var(--espaco-4)" href="catalogo.html">Ver catálogo</a>
        </div>`;
      return;
    }

    lista.innerHTML = matriculas
      .map((matricula) => {
        const curso = cursos.find((c) => c.id === matricula.cursoId);
        const meta = curso ? Danca.modalidades.LISTA_FIXA.find((m) => m.id === curso.modalidadeId) : null;
        const corGel = meta ? `var(${meta.corVar})` : "var(--gold)";
        return `
          <a class="matricula-item revelar" href="curso.html?id=${encodeURIComponent(matricula.cursoId)}" style="--gel: ${corGel}">
            <div class="matricula-item__cabecalho">
              <strong>${Danca.ui.escapar(curso ? curso.titulo : "Curso removido")}</strong>
              <span class="selo ${matricula.status === "concluído" ? "selo--concluido" : "selo--andamento"}">${Danca.ui.capitalizar(matricula.status)}</span>
            </div>
            ${Danca.ui.linhaRitmoHtml(matricula.progresso, corGel)}
          </a>`;
      })
      .join("");

    Danca.ui.observarRevelacao("#lista-minhas-matriculas .revelar");
  }

  function renderizarAvaliacoes(avaliacoes, cursos) {
    const lista = document.getElementById("lista-minhas-avaliacoes");
    if (avaliacoes.length === 0) {
      lista.innerHTML = `<p class="texto-pequeno" style="color: var(--ivory-dim)">Você ainda não avaliou nenhum curso.</p>`;
      return;
    }

    lista.innerHTML = avaliacoes
      .map((avaliacao) => {
        const curso = cursos.find((c) => c.id === avaliacao.cursoId);
        return `
          <article class="avaliacao revelar">
            <div class="avaliacao__cabecalho">
              <span class="avaliacao__autor">${Danca.ui.escapar(curso ? curso.titulo : "Curso removido")}</span>
              ${Danca.ui.estrelasHtml(avaliacao.nota)}
            </div>
            ${avaliacao.comentario ? `<p class="avaliacao__comentario">${Danca.ui.escapar(avaliacao.comentario)}</p>` : ""}
            <span class="avaliacao__data">${Danca.ui.formatarData(avaliacao.data)}</span>
          </article>`;
      })
      .join("");

    Danca.ui.observarRevelacao("#lista-minhas-avaliacoes .revelar");
  }
})();
