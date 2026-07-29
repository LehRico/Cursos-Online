(function () {
  const idCurso = new URLSearchParams(window.location.search).get("id");

  let curso = null;
  let modalidadeMeta = null;
  let dadosModalidade = null;
  let instrutor = null;
  let aulas = [];
  let avaliacoes = [];
  let usuarios = [];
  let matriculaUsuario = null;

  document.addEventListener("DOMContentLoaded", async () => {
    Danca.ui.montarNavegacao("");
    if (!idCurso) {
      mostrarNaoEncontrado();
      return;
    }
    await carregarCurso();
  });

  async function carregarCurso() {
    try {
      curso = await Danca.api.buscar("cursos", idCurso);
    } catch {
      mostrarNaoEncontrado();
      return;
    }

    const usuarioSessao = Danca.sessao.obter();
    const podeVerRascunho =
      usuarioSessao &&
      (usuarioSessao.role === "admin" || (usuarioSessao.role === "professor" && usuarioSessao.id === curso.instrutorId));

    if (curso.status === "rascunho" && !podeVerRascunho) {
      mostrarNaoEncontrado();
      return;
    }

    const [modalidades, aulasCurso, avaliacoesCurso, todosUsuarios, matriculas] = await Promise.all([
      Danca.api.listar("modalidades"),
      Danca.api.listar("aulas", { cursoId: curso.id }),
      Danca.api.listar("avaliacoes", { cursoId: curso.id }),
      Danca.api.listar("usuarios"),
      usuarioSessao && usuarioSessao.role === "aluno"
        ? Danca.api.listar("matriculas", { usuarioId: usuarioSessao.id, cursoId: curso.id })
        : Promise.resolve([]),
    ]);

    dadosModalidade = modalidades.find((m) => m.id === curso.modalidadeId) || null;
    modalidadeMeta = Danca.modalidades.LISTA_FIXA.find((m) => m.id === curso.modalidadeId) || null;
    aulas = aulasCurso.slice().sort((a, b) => a.ordem - b.ordem);
    avaliacoes = avaliacoesCurso;
    usuarios = todosUsuarios;
    instrutor = usuarios.find((u) => u.id === curso.instrutorId) || null;
    matriculaUsuario = matriculas[0] || null;

    document.getElementById("curso-conteudo").hidden = false;
    renderizarCabecalho();
    renderizarAulas();
    renderizarInstrutor();
    renderizarAcaoMatricula();
    renderizarAvaliacoes();
    Danca.ui.observarRevelacao();
  }

  function mostrarNaoEncontrado() {
    document.getElementById("conteudo-principal").innerHTML = `
      <section class="secao">
        <div class="envolucro estado-vazio">
          <h3>Curso não encontrado</h3>
          <p>Ele pode ter sido removido, ainda não foi publicado, ou você não tem acesso a ele.</p>
          <a class="botao botao--primario" style="margin-top: var(--espaco-4)" href="catalogo.html">Voltar ao catálogo</a>
        </div>
      </section>`;
  }

  function renderizarCabecalho() {
    document.title = `${curso.titulo} — Palco Dança`;
    const corGel = modalidadeMeta ? `var(${modalidadeMeta.corVar})` : "var(--gold)";
    document.documentElement.style.setProperty("--gel", corGel);

    const alvo = document.getElementById("curso-cabecalho");
    alvo.innerHTML = `
      <a class="curso-voltar" href="catalogo.html"><i class="ph ph-bold ph-arrow-left"></i> Voltar ao catálogo</a>
      <div class="curso-titulo-linha">
        <span class="etiqueta-modalidade" style="--gel: ${corGel}">${Danca.ui.escapar(dadosModalidade ? dadosModalidade.nome : "")}</span>
        ${curso.status === "rascunho" ? '<span class="selo selo--rascunho">Rascunho</span>' : ""}
      </div>
      <h1>${Danca.ui.escapar(curso.titulo)}</h1>
      <p class="hero__descricao">${Danca.ui.escapar(curso.descricao || "")}</p>
      <div class="cartao-curso__meta" style="font-size: var(--tamanho-sm); margin-top: var(--espaco-4)">
        <span><i class="ph ph-bold ph-barbell"></i> ${Danca.ui.capitalizar(curso.nivel)}</span>
        <span><i class="ph ph-bold ph-clock"></i> ${curso.cargaHoraria}h</span>
        <span><i class="ph ph-bold ph-chalkboard-teacher"></i> Prof. ${Danca.ui.escapar(instrutor ? instrutor.nome : "—")}</span>
      </div>`;
  }

  function renderizarAulas() {
    const lista = document.getElementById("lista-aulas");
    if (aulas.length === 0) {
      lista.innerHTML = `<div class="estado-vazio"><h3>Nenhuma aula publicada ainda</h3><p>O professor está preparando o conteúdo.</p></div>`;
      return;
    }
    lista.innerHTML = aulas
      .map(
        (aula, indice) => `
        <li class="aula-item revelar" style="--atraso: ${Math.min(indice, 8) * 60}ms">
          <span class="aula-item__numero numerico">${String(aula.ordem).padStart(2, "0")}</span>
          <span class="aula-item__corpo"><strong>${Danca.ui.escapar(aula.titulo)}</strong></span>
          <span class="aula-item__duracao">${aula.duracaoMinutos} min</span>
        </li>`
      )
      .join("");
    Danca.ui.observarRevelacao("#lista-aulas .revelar");
  }

  function renderizarInstrutor() {
    const cartao = document.getElementById("cartao-instrutor");
    if (!instrutor) {
      cartao.innerHTML = "";
      return;
    }
    cartao.innerHTML = `
      <h3 class="texto-tamanho-md" style="margin-bottom: var(--espaco-4)">Quem leciona</h3>
      <div style="display: flex; align-items: center; gap: var(--espaco-3)">
        <span class="avatar" style="width: 3rem; height: 3rem; font-size: var(--tamanho-md)">${Danca.ui.avatarConteudo(instrutor)}</span>
        <div>
          <strong>${Danca.ui.escapar(instrutor.nome)}</strong>
          <div class="texto-pequeno" style="color: var(--ivory-dim)">${Danca.ui.rotuloRole(instrutor.role)} de dança</div>
        </div>
      </div>
      <p class="texto-pequeno" style="color: var(--ivory-dim); margin-top: var(--espaco-4)">${Danca.ui.escapar(instrutor.email)}</p>`;
  }

  function renderizarAcaoMatricula() {
    const cartao = document.getElementById("cartao-matricula");
    const usuarioSessao = Danca.sessao.obter();

    if (!usuarioSessao) {
      cartao.innerHTML = `
        <h3>Quer entrar na turma?</h3>
        <p style="color: var(--ivory-dim); margin-block: var(--espaco-2) var(--espaco-4)">Entre com uma conta de aluno para se matricular neste curso.</p>
        <a class="botao botao--primario" href="login.html">Entrar</a>`;
      return;
    }

    if (usuarioSessao.role !== "aluno") {
      cartao.innerHTML = `
        <h3>Você está vendo como ${Danca.ui.rotuloRole(usuarioSessao.role).toLowerCase()}</h3>
        <p style="color: var(--ivory-dim); margin-top: var(--espaco-2)">Matrículas são exclusivas de contas de aluno. Gerencie este curso pelo <a href="painel-professor.html" style="color: var(--gold-soft); text-decoration: underline">painel do professor</a>.</p>`;
      return;
    }

    if (!matriculaUsuario) {
      if (curso.status !== "publicado") {
        cartao.innerHTML = `<h3>Curso ainda não publicado</h3><p style="color: var(--ivory-dim); margin-top: var(--espaco-2)">Você poderá se matricular assim que o professor publicar o curso.</p>`;
        return;
      }
      cartao.innerHTML = `
        <h3>Pronto pra começar?</h3>
        <p style="color: var(--ivory-dim); margin-block: var(--espaco-2) var(--espaco-4)">Matricule-se e acompanhe seu progresso aula a aula.</p>
        <button class="botao botao--primario botao--bloco" id="botao-matricular" type="button">Matricular-se</button>`;
      document.getElementById("botao-matricular").addEventListener("click", matricular);
      return;
    }

    const corGel = modalidadeMeta ? `var(${modalidadeMeta.corVar})` : null;
    cartao.innerHTML = `
      <h3>Seu progresso</h3>
      <div style="margin-top: var(--espaco-4)">${Danca.ui.linhaRitmoHtml(matriculaUsuario.progresso, corGel)}</div>
      <span class="selo ${matriculaUsuario.status === "concluído" ? "selo--concluido" : "selo--andamento"}" style="margin-top: var(--espaco-3); display: inline-flex">${Danca.ui.capitalizar(matriculaUsuario.status)}</span>
      <form class="formulario" id="formulario-progresso" style="margin-top: var(--espaco-5)">
        <div class="campo" id="campo-grupo-progresso">
          <label class="campo__rotulo" for="campo-progresso">Atualizar progresso (%)</label>
          <input type="number" id="campo-progresso" min="0" max="100" value="${matriculaUsuario.progresso}" />
          <span class="campo__erro"></span>
        </div>
        <button class="botao botao--contorno botao--bloco" type="submit">Salvar progresso</button>
      </form>`;

    document.getElementById("formulario-progresso").addEventListener("submit", atualizarProgresso);
  }

  async function matricular() {
    const usuarioSessao = Danca.sessao.obter();
    const botao = document.getElementById("botao-matricular");
    botao.disabled = true;
    try {
      const matriculasExistentes = await Danca.api.listar("matriculas", { usuarioId: usuarioSessao.id, cursoId: curso.id });
      const erros = Danca.validar.matricula({ curso, usuario: usuarioSessao, usuarioId: usuarioSessao.id, cursoId: curso.id, matriculasExistentes });
      if (erros.geral) {
        Danca.ui.mostrarAviso(erros.geral, "erro");
        return;
      }
      matriculaUsuario = await Danca.api.criar("matriculas", {
        usuarioId: usuarioSessao.id,
        cursoId: curso.id,
        dataMatricula: new Date().toISOString(),
        progresso: 0,
        status: "em andamento",
      });
      Danca.ui.mostrarAviso("Matrícula feita! Bora dançar.", "sucesso");
      renderizarAcaoMatricula();
    } catch (erro) {
      Danca.ui.mostrarAviso(erro.message, "erro");
    } finally {
      botao.disabled = false;
    }
  }

  async function atualizarProgresso(evento) {
    evento.preventDefault();
    Danca.ui.limparErrosCampos(["campo-grupo-progresso"]);
    const valor = Number(document.getElementById("campo-progresso").value);

    if (!Danca.validar.progressoValido(valor)) {
      Danca.ui.mostrarErroCampo("campo-grupo-progresso", "Informe um número entre 0 e 100.");
      return;
    }

    const status = valor >= 100 ? "concluído" : "em andamento";
    try {
      matriculaUsuario = await Danca.api.atualizar("matriculas", matriculaUsuario.id, { progresso: valor, status });
      Danca.ui.mostrarAviso("Progresso atualizado!", "sucesso");
      renderizarAcaoMatricula();
      renderizarAvaliacoes();
    } catch (erro) {
      Danca.ui.mostrarAviso(erro.message, "erro");
    }
  }

  function renderizarAvaliacoes() {
    const lista = document.getElementById("lista-avaliacoes");
    if (avaliacoes.length === 0) {
      lista.innerHTML = `<p class="texto-pequeno" style="color: var(--ivory-dim)">Ainda não há avaliações para este curso.</p>`;
    } else {
      lista.innerHTML = avaliacoes
        .slice()
        .sort((a, b) => new Date(b.data) - new Date(a.data))
        .map((avaliacao) => Danca.ui.avaliacaoHtml(avaliacao, usuarios.find((u) => u.id === avaliacao.usuarioId)))
        .join("");
    }

    renderizarFormAvaliacao();
    Danca.ui.observarRevelacao("#lista-avaliacoes .revelar");
  }

  function renderizarFormAvaliacao() {
    const area = document.getElementById("area-avaliacao");
    const usuarioSessao = Danca.sessao.obter();

    if (!usuarioSessao || usuarioSessao.role !== "aluno") {
      area.innerHTML = "";
      return;
    }

    if (avaliacoes.some((a) => a.usuarioId === usuarioSessao.id)) {
      area.innerHTML = `<p class="texto-pequeno" style="color: var(--ivory-dim); margin-block: var(--espaco-3)">Você já avaliou este curso. Obrigado pelo retorno!</p>`;
      return;
    }

    if (!matriculaUsuario || matriculaUsuario.status !== "concluído") {
      area.innerHTML = "";
      return;
    }

    area.innerHTML = `
      <form class="formulario cartao" id="formulario-avaliacao" style="margin-block: var(--espaco-4)">
        <h3 class="texto-tamanho-md">Deixe sua avaliação</h3>
        <div class="campo" id="campo-grupo-nota">
          <label class="campo__rotulo" for="campo-nota">Nota</label>
          <select id="campo-nota" required>
            <option value="5">5 — Excelente</option>
            <option value="4">4 — Muito bom</option>
            <option value="3">3 — Bom</option>
            <option value="2">2 — Regular</option>
            <option value="1">1 — Fraco</option>
          </select>
          <span class="campo__erro"></span>
        </div>
        <div class="campo" id="campo-grupo-comentario">
          <label class="campo__rotulo" for="campo-comentario">Comentário (opcional, até 500 caracteres)</label>
          <textarea id="campo-comentario" maxlength="500"></textarea>
          <span class="campo__erro"></span>
        </div>
        <button class="botao botao--primario" type="submit">Enviar avaliação</button>
      </form>`;

    document.getElementById("formulario-avaliacao").addEventListener("submit", enviarAvaliacao);
  }

  async function enviarAvaliacao(evento) {
    evento.preventDefault();
    const usuarioSessao = Danca.sessao.obter();
    const nota = Number(document.getElementById("campo-nota").value);
    const comentario = document.getElementById("campo-comentario").value.trim();

    Danca.ui.limparErrosCampos(["campo-grupo-nota", "campo-grupo-comentario"]);

    const erros = Danca.validar.avaliacao({
      matricula: matriculaUsuario,
      usuarioId: usuarioSessao.id,
      cursoId: curso.id,
      nota,
      comentario,
      avaliacoesExistentes: avaliacoes,
    });

    if (erros.nota) Danca.ui.mostrarErroCampo("campo-grupo-nota", erros.nota);
    if (erros.comentario) Danca.ui.mostrarErroCampo("campo-grupo-comentario", erros.comentario);
    if (erros.geral) Danca.ui.mostrarAviso(erros.geral, "erro");
    if (Object.keys(erros).length > 0) return;

    try {
      const nova = await Danca.api.criar("avaliacoes", {
        usuarioId: usuarioSessao.id,
        cursoId: curso.id,
        nota,
        comentario,
        data: new Date().toISOString(),
      });
      avaliacoes.push(nova);
      Danca.ui.mostrarAviso("Avaliação enviada. Obrigado!", "sucesso");
      renderizarAvaliacoes();
    } catch (erro) {
      Danca.ui.mostrarAviso(erro.message, "erro");
    }
  }
})();
