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
    Danca.ui.montarRodape();
    Danca.ui.montarChatbot();
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
    modalidadeMeta = Danca.modalidades.meta(dadosModalidade);
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
    document.title = `${curso.titulo} — LeKa Dance Studio`;
    const corGel = modalidadeMeta ? modalidadeMeta.corGel : "var(--gold)";
    document.documentElement.style.setProperty("--gel", corGel);

    const alvo = document.getElementById("curso-cabecalho");
    alvo.innerHTML = `
      <a class="curso-voltar" href="catalogo.html"><i class="ph ph-bold ph-arrow-left" aria-hidden="true"></i> Voltar ao catálogo</a>
      <div class="curso-titulo-linha">
        <span class="etiqueta-modalidade" style="--gel: ${corGel}">${Danca.ui.escapar(dadosModalidade ? dadosModalidade.nome : "")}</span>
        ${curso.status === "rascunho" ? '<span class="selo selo--rascunho">Rascunho</span>' : ""}
        ${curso.status === "ferias" ? '<span class="selo selo--ferias">Período de férias</span>' : ""}
      </div>
      <h1>${Danca.ui.escapar(curso.titulo)}</h1>
      <p class="hero__descricao">${Danca.ui.escapar(curso.descricao || "")}</p>
      <div class="cartao-curso__meta" style="font-size: var(--tamanho-sm); margin-top: var(--espaco-4)">
        <span><i class="ph ph-bold ph-barbell" aria-hidden="true"></i> ${Danca.ui.capitalizar(curso.nivel)}</span>
        <span><i class="ph ph-bold ph-clock" aria-hidden="true"></i> ${curso.cargaHoraria}h</span>
        <span><i class="ph ph-bold ph-chalkboard-teacher" aria-hidden="true"></i> Prof. ${Danca.ui.escapar(instrutor ? instrutor.nome : "—")}</span>
      </div>`;
  }

  function renderizarAulas() {
    const lista = document.getElementById("lista-aulas");
    if (aulas.length === 0) {
      lista.innerHTML = `<div class="estado-vazio"><h3>Nenhuma aula publicada ainda</h3><p>O professor está preparando o conteúdo.</p></div>`;
      return;
    }

    // Só o próprio aluno matriculado pode marcar aulas como concluídas —
    // pra qualquer outro visitante a lista é só informativa (numerada).
    const concluidas = new Set(matriculaUsuario ? matriculaUsuario.aulasConcluidas || [] : []);
    const interativo = Boolean(matriculaUsuario);
    const usuarioSessaoAtual = Danca.sessao.obter();

    lista.innerHTML = aulas
      .map((aula, indice) => {
        const concluida = concluidas.has(aula.id);
        const marcador = interativo
          ? `<button type="button" class="aula-item__concluir" data-aula-id="${aula.id}" aria-pressed="${concluida}" aria-label="Marcar aula '${Danca.ui.escapar(aula.titulo)}' como ${concluida ? "não concluída" : "concluída"}">
              <i class="ph ph-bold ${concluida ? "ph-check-circle" : "ph-circle"}" aria-hidden="true"></i>
            </button>`
          : `<span class="aula-item__numero numerico">${String(aula.ordem).padStart(2, "0")}</span>`;

        // O link só aparece pra quem realmente pode assistir (matriculado,
        // ou o próprio instrutor/admin revisando) — pra um visitante não
        // matriculado não faz sentido expor o link da videochamada.
        const podeVerLink = interativo || (usuarioSessaoAtual && (usuarioSessaoAtual.role === "admin" || usuarioSessaoAtual.id === curso.instrutorId));
        const linkMeet =
          aula.conteudo && podeVerLink
            ? `<a class="aula-item__meet" href="${Danca.ui.escapar(aula.conteudo)}" target="_blank" rel="noopener noreferrer">
                <i class="ph ph-bold ph-video-camera" aria-hidden="true"></i> Entrar na aula
              </a>`
            : "";

        return `
        <li class="aula-item revelar${concluida ? " aula-item--concluida" : ""}" style="--atraso: ${Math.min(indice, 8) * 60}ms">
          ${marcador}
          <span class="aula-item__corpo"><strong>${Danca.ui.escapar(aula.titulo)}</strong></span>
          ${linkMeet}
          <span class="aula-item__duracao">${aula.duracaoMinutos} min</span>
        </li>`;
      })
      .join("");

    if (interativo) {
      lista.querySelectorAll(".aula-item__concluir").forEach((botao) => {
        botao.addEventListener("click", () => alternarAulaConcluida(botao.dataset.aulaId));
      });
    }

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
      if (curso.status === "ferias") {
        cartao.innerHTML = `<h3>Turma em período de férias</h3><p style="color: var(--ivory-dim); margin-top: var(--espaco-2)">Novas matrículas estão pausadas temporariamente. Quem já estava matriculado mantém acesso normal ao conteúdo.</p>`;
        return;
      }
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

    const corGel = modalidadeMeta ? modalidadeMeta.corGel : null;
    const concluidas = (matriculaUsuario.aulasConcluidas || []).length;
    const dica =
      aulas.length === 0
        ? "O professor ainda não publicou aulas — seu progresso passa a contar assim que a primeira aula sair."
        : `Marque as aulas concluídas na lista ao lado — o progresso sobe sozinho. ${concluidas} de ${aulas.length} aulas concluídas.`;

    cartao.innerHTML = `
      <h3>Seu progresso</h3>
      <div style="margin-top: var(--espaco-4)">${Danca.ui.linhaRitmoHtml(matriculaUsuario.progresso, corGel)}</div>
      <span class="selo ${matriculaUsuario.status === "concluído" ? "selo--concluido" : "selo--andamento"}" style="margin-top: var(--espaco-3); display: inline-flex">${Danca.ui.capitalizar(matriculaUsuario.status)}</span>
      <p class="texto-pequeno" style="color: var(--ivory-dim); margin-top: var(--espaco-3)">${dica}</p>`;
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

  /*
    Regra de negócio: o aluno não digita mais uma porcentagem — ele marca as
    aulas que já fez, e o progresso é 100% derivado disso (aulas concluídas /
    total de aulas). Isso evita number solto sem relação com o conteúdo real
    (ex: aluno colocar 100% sem ter assistido nada) e só libera "concluído"
    (e, com isso, a avaliação do curso) quando todas as aulas publicadas
    foram marcadas.
  */
  async function alternarAulaConcluida(aulaId) {
    if (!matriculaUsuario) return;

    const concluidas = new Set(matriculaUsuario.aulasConcluidas || []);
    concluidas.has(aulaId) ? concluidas.delete(aulaId) : concluidas.add(aulaId);
    const aulasConcluidas = aulas.filter((aula) => concluidas.has(aula.id)).map((aula) => aula.id);

    const progresso = aulas.length === 0 ? 0 : Math.round((aulasConcluidas.length / aulas.length) * 100);
    const status = aulas.length > 0 && aulasConcluidas.length === aulas.length ? "concluído" : "em andamento";
    const statusAnterior = matriculaUsuario.status;

    try {
      matriculaUsuario = await Danca.api.atualizar("matriculas", matriculaUsuario.id, { aulasConcluidas, progresso, status });
      renderizarAulas();
      renderizarAcaoMatricula();
      if (status !== statusAnterior) {
        renderizarAvaliacoes();
        if (status === "concluído") Danca.ui.mostrarAviso("Curso concluído! Agora você já pode avaliá-lo.", "sucesso");
      }
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
