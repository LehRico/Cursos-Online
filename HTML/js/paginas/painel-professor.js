(function () {
  let usuarioSessao;
  let cursos = [];
  let modalidades = [];
  let usuarios = [];
  let instrutores = [];
  let aulasCursoAtual = [];
  let cursoAulasSelecionado = null;

  const ROTULO_STATUS_CURSO = { rascunho: "Rascunho", publicado: "Publicado", ferias: "Período de férias" };
  const ROTULO_STATUS_SELO = { rascunho: "rascunho", publicado: "publicado", ferias: "ferias" };

  document.addEventListener("DOMContentLoaded", async () => {
    usuarioSessao = Danca.sessao.exigir(["professor", "admin"]);
    if (!usuarioSessao) return;

    Danca.ui.montarNavegacao("painel-professor.html");
    Danca.ui.montarRodape();
    Danca.ui.montarChatbot();
    personalizarHeroPorPapel();
    configurarAbas();
    configurarFechamentoModais();

    document.getElementById("botao-novo-curso").addEventListener("click", () => abrirModalCurso());
    document.getElementById("botao-nova-aula").addEventListener("click", () => abrirModalAula());
    document.getElementById("botao-nova-modalidade").addEventListener("click", () => abrirModalModalidade());
    document.getElementById("curso-fotos-adicionar").addEventListener("click", () => adicionarCampoFoto());
    document.getElementById("formulario-curso").addEventListener("submit", salvarCurso);
    document.getElementById("formulario-aula").addEventListener("submit", salvarAula);
    document.getElementById("formulario-modalidade").addEventListener("submit", salvarModalidade);
    document.getElementById("filtro-curso-aulas").addEventListener("change", (e) => selecionarCursoAulas(e.target.value));
    document.getElementById("filtro-curso-desempenho").addEventListener("change", (e) => renderizarDesempenho(e.target.value));

    await carregarTudo();
  });

  async function carregarTudo() {
    [cursos, modalidades, usuarios] = await Promise.all([
      Danca.api.listar("cursos"),
      Danca.api.listar("modalidades"),
      Danca.api.listar("usuarios"),
    ]);
    instrutores = usuarios.filter((u) => u.role === "professor" || u.role === "admin");

    renderizarTabelaCursos();
    montarSelectCursosAulas();
    renderizarTabelaModalidades();
    montarSelectCursosDesempenho();
  }

  /*
    Essa tela é compartilhada entre professor e admin (o admin herda as
    permissões do professor), mas o texto do hero era fixo pra "professor" —
    dava a impressão de ser uma ferramenta exclusiva dele. Ajusta o
    título/descrição conforme quem está logado, sem duplicar a página.
  */
  function personalizarHeroPorPapel() {
    const ehAdmin = usuarioSessao.role === "admin";
    document.title = `${ehAdmin ? "Painel do Administrador" : "Painel do professor"} — LeKa Dance Studio`;
    document.getElementById("painel-etiqueta").innerHTML = `<i class="ph ph-bold ${ehAdmin ? "ph-shield-star" : "ph-chalkboard-teacher"}" aria-hidden="true"></i> ${ehAdmin ? "Painel do administrador" : "Painel do professor"}`;
    document.getElementById("painel-titulo").innerHTML = ehAdmin ? "Gerencie as <em>turmas</em>." : "Gerencie <em>suas</em> turmas.";
    document.getElementById("painel-descricao").textContent = ehAdmin
      ? "Crie e edite cursos, aulas e modalidades de toda a escola. Acompanhe matrículas e avaliações de qualquer turma."
      : "Crie e edite cursos, aulas e modalidades. Acompanhe matrículas e avaliações das turmas que você leciona.";
  }

  /* ================= Abas e modais ================= */

  function configurarAbas() {
    const botoes = document.querySelectorAll(".abas__botao");
    botoes.forEach((botao) => {
      botao.addEventListener("click", () => {
        botoes.forEach((b) => b.setAttribute("aria-selected", "false"));
        document.querySelectorAll(".abas__painel").forEach((painel) => (painel.hidden = true));
        botao.setAttribute("aria-selected", "true");
        document.getElementById(botao.getAttribute("aria-controls")).hidden = false;
      });
    });
  }

  function configurarFechamentoModais() {
    document.querySelectorAll("[data-fechar-modal]").forEach((botao) => {
      botao.addEventListener("click", () => document.getElementById(botao.dataset.fecharModal).close());
    });
  }

  /* ================= Cursos ================= */

  function renderizarTabelaCursos() {
    const corpo = document.getElementById("tabela-cursos");
    if (cursos.length === 0) {
      corpo.innerHTML = `<tr><td colspan="7">Nenhum curso cadastrado ainda.</td></tr>`;
      return;
    }
    corpo.innerHTML = cursos
      .map((curso) => {
        const modalidade = modalidades.find((m) => m.id === curso.modalidadeId);
        const instrutor = usuarios.find((u) => u.id === curso.instrutorId);
        return `
          <tr>
            <td>${Danca.ui.escapar(curso.titulo)}</td>
            <td>${Danca.ui.escapar(modalidade ? modalidade.nome : "—")}</td>
            <td>${Danca.ui.escapar(instrutor ? instrutor.nome : "—")}</td>
            <td>${Danca.ui.capitalizar(curso.nivel)}</td>
            <td class="numerico">${curso.cargaHoraria}h</td>
            <td><span class="selo selo--${ROTULO_STATUS_SELO[curso.status] || "rascunho"}">${ROTULO_STATUS_CURSO[curso.status] || Danca.ui.capitalizar(curso.status)}</span></td>
            <td>
              <div class="tabela__acoes">
                <button class="botao botao--fantasma botao--pequeno" data-editar-curso="${curso.id}" type="button">Editar</button>
                <button class="botao botao--perigo botao--pequeno" data-excluir-curso="${curso.id}" type="button">Excluir</button>
              </div>
            </td>
          </tr>`;
      })
      .join("");

    corpo.querySelectorAll("[data-editar-curso]").forEach((b) => b.addEventListener("click", () => abrirModalCurso(b.dataset.editarCurso)));
    corpo.querySelectorAll("[data-excluir-curso]").forEach((b) => b.addEventListener("click", () => excluirCurso(b.dataset.excluirCurso)));
  }

  function abrirModalCurso(id) {
    const curso = id ? cursos.find((c) => c.id === id) : null;
    document.getElementById("modal-curso-titulo").textContent = curso ? "Editar curso" : "Novo curso";
    document.getElementById("curso-id").value = curso ? curso.id : "";
    document.getElementById("curso-titulo").value = curso ? curso.titulo : "";
    document.getElementById("curso-descricao").value = curso ? curso.descricao || "" : "";
    document.getElementById("curso-nivel").value = curso ? curso.nivel : "iniciante";
    document.getElementById("curso-status").value = curso ? curso.status : "rascunho";
    document.getElementById("curso-carga").value = curso ? curso.cargaHoraria : "";
    renderizarCamposFotos(curso && curso.fotos ? curso.fotos : []);

    const selectModalidade = document.getElementById("curso-modalidade");
    selectModalidade.innerHTML = modalidades.map((m) => `<option value="${m.id}">${Danca.ui.escapar(m.nome)}</option>`).join("");
    if (curso) selectModalidade.value = curso.modalidadeId;

    const selectInstrutor = document.getElementById("curso-instrutor");
    selectInstrutor.innerHTML = instrutores
      .map((i) => `<option value="${i.id}">${Danca.ui.escapar(i.nome)} (${Danca.ui.rotuloRole(i.role)})</option>`)
      .join("");
    selectInstrutor.value = curso ? curso.instrutorId : usuarioSessao.id;

    Danca.ui.limparErrosCampos(["campo-grupo-curso-titulo", "campo-grupo-curso-modalidade", "campo-grupo-curso-instrutor", "campo-grupo-curso-carga", "campo-grupo-curso-fotos"]);
    document.getElementById("modal-curso").showModal();
  }

  /*
    Lista de links de foto do card do curso: sempre pelo menos uma linha (em
    branco se o curso ainda não tem foto própria), com botão pra adicionar
    mais. Sem nenhuma foto preenchida, o card cai no placeholder por
    modalidade (ver Danca.ui.cartaoCursoHtml).
  */
  function renderizarCamposFotos(fotos) {
    const lista = document.getElementById("curso-fotos-lista");
    const valores = fotos.length > 0 ? fotos : [""];
    lista.innerHTML = valores
      .map(
        (url) => `
        <div class="campo-linha-foto">
          <input type="url" class="campo-foto-url" placeholder="https://…" value="${Danca.ui.escapar(url)}" />
          <button class="botao botao--fantasma botao--pequeno" type="button" data-remover-foto aria-label="Remover foto"><i class="ph ph-bold ph-x" aria-hidden="true"></i></button>
        </div>`
      )
      .join("");
    ligarBotoesRemoverFoto();
  }

  function ligarBotoesRemoverFoto() {
    document.querySelectorAll("#curso-fotos-lista [data-remover-foto]").forEach((botao) => {
      botao.addEventListener("click", () => {
        const lista = document.getElementById("curso-fotos-lista");
        const linha = botao.closest(".campo-linha-foto");
        if (lista.children.length > 1) linha.remove();
        else linha.querySelector("input").value = "";
      });
    });
  }

  const MAXIMO_FOTOS_CURSO = 6;
  function adicionarCampoFoto() {
    const lista = document.getElementById("curso-fotos-lista");
    if (lista.children.length >= MAXIMO_FOTOS_CURSO) return;
    const linha = document.createElement("div");
    linha.className = "campo-linha-foto";
    linha.innerHTML = `
      <input type="url" class="campo-foto-url" placeholder="https://…" />
      <button class="botao botao--fantasma botao--pequeno" type="button" data-remover-foto aria-label="Remover foto"><i class="ph ph-bold ph-x" aria-hidden="true"></i></button>`;
    lista.appendChild(linha);
    ligarBotoesRemoverFoto();
  }

  async function salvarCurso(evento) {
    evento.preventDefault();
    const id = document.getElementById("curso-id").value || null;
    const dados = {
      titulo: document.getElementById("curso-titulo").value.trim(),
      descricao: document.getElementById("curso-descricao").value.trim(),
      modalidadeId: document.getElementById("curso-modalidade").value,
      instrutorId: document.getElementById("curso-instrutor").value,
      nivel: document.getElementById("curso-nivel").value,
      status: document.getElementById("curso-status").value,
      cargaHoraria: Number(document.getElementById("curso-carga").value),
      fotos: Array.from(document.querySelectorAll(".campo-foto-url"))
        .map((campo) => campo.value.trim())
        .filter(Boolean),
    };

    Danca.ui.limparErrosCampos(["campo-grupo-curso-titulo", "campo-grupo-curso-modalidade", "campo-grupo-curso-instrutor", "campo-grupo-curso-carga", "campo-grupo-curso-fotos"]);
    const erros = Danca.validar.curso(dados, { modalidades, instrutores });
    const mapaGrupos = {
      titulo: "campo-grupo-curso-titulo",
      modalidadeId: "campo-grupo-curso-modalidade",
      instrutorId: "campo-grupo-curso-instrutor",
      cargaHoraria: "campo-grupo-curso-carga",
      fotos: "campo-grupo-curso-fotos",
    };

    if (Object.keys(erros).length > 0) {
      Object.entries(erros).forEach(([campo, mensagem]) => {
        const grupoId = mapaGrupos[campo];
        if (grupoId) Danca.ui.mostrarErroCampo(grupoId, mensagem);
        else Danca.ui.mostrarAviso(mensagem, "erro");
      });
      return;
    }

    try {
      if (id) {
        const atualizado = await Danca.api.atualizar("cursos", id, dados);
        cursos = cursos.map((c) => (c.id === id ? atualizado : c));
      } else {
        const criado = await Danca.api.criar("cursos", dados);
        cursos.push(criado);
      }
      document.getElementById("modal-curso").close();
      renderizarTabelaCursos();
      montarSelectCursosAulas();
      montarSelectCursosDesempenho();
      Danca.ui.mostrarAviso("Curso salvo com sucesso!", "sucesso");
    } catch (erro) {
      Danca.ui.mostrarAviso(erro.message, "erro");
    }
  }

  async function excluirCurso(id) {
    const curso = cursos.find((c) => c.id === id);
    if (!curso) return;
    const confirmado = await Danca.ui.confirmar(`Excluir "${curso.titulo}"? Isso também remove aulas, matrículas e avaliações relacionadas.`, {
      titulo: "Excluir curso",
      textoConfirmar: "Excluir",
      perigo: true,
    });
    if (!confirmado) return;

    try {
      const [aulasRelacionadas, matriculasRelacionadas, avaliacoesRelacionadas] = await Promise.all([
        Danca.api.listar("aulas", { cursoId: id }),
        Danca.api.listar("matriculas", { cursoId: id }),
        Danca.api.listar("avaliacoes", { cursoId: id }),
      ]);
      await Promise.all([
        ...aulasRelacionadas.map((a) => Danca.api.remover("aulas", a.id)),
        ...matriculasRelacionadas.map((m) => Danca.api.remover("matriculas", m.id)),
        ...avaliacoesRelacionadas.map((a) => Danca.api.remover("avaliacoes", a.id)),
      ]);
      await Danca.api.remover("cursos", id);

      cursos = cursos.filter((c) => c.id !== id);
      renderizarTabelaCursos();
      montarSelectCursosAulas();
      montarSelectCursosDesempenho();
      Danca.ui.mostrarAviso("Curso removido.", "sucesso");
    } catch (erro) {
      Danca.ui.mostrarAviso(erro.message, "erro");
    }
  }

  /* ================= Aulas ================= */

  function montarSelectCursosAulas() {
    const select = document.getElementById("filtro-curso-aulas");
    const valorAtual = select.value;
    select.innerHTML = cursos.map((c) => `<option value="${c.id}">${Danca.ui.escapar(c.titulo)}</option>`).join("");

    const alvo = cursos.some((c) => c.id === valorAtual) ? valorAtual : cursos[0] && cursos[0].id;
    if (alvo) {
      select.value = alvo;
      selecionarCursoAulas(alvo);
    } else {
      cursoAulasSelecionado = null;
      document.getElementById("tabela-aulas").innerHTML = `<tr><td colspan="4">Cadastre um curso na aba Cursos primeiro.</td></tr>`;
    }
  }

  async function selecionarCursoAulas(cursoId) {
    cursoAulasSelecionado = cursoId;
    const corpo = document.getElementById("tabela-aulas");
    corpo.innerHTML = `<tr><td colspan="4" class="carregando">Carregando</td></tr>`;
    aulasCursoAtual = (await Danca.api.listar("aulas", { cursoId })).sort((a, b) => a.ordem - b.ordem);
    renderizarTabelaAulas();
  }

  function renderizarTabelaAulas() {
    const corpo = document.getElementById("tabela-aulas");
    if (aulasCursoAtual.length === 0) {
      corpo.innerHTML = `<tr><td colspan="4">Nenhuma aula cadastrada para este curso.</td></tr>`;
      return;
    }
    corpo.innerHTML = aulasCursoAtual
      .map(
        (aula) => `
        <tr>
          <td class="numerico">${aula.ordem}</td>
          <td>${Danca.ui.escapar(aula.titulo)}</td>
          <td class="numerico">${aula.duracaoMinutos} min</td>
          <td>
            <div class="tabela__acoes">
              <button class="botao botao--fantasma botao--pequeno" data-editar-aula="${aula.id}" type="button">Editar</button>
              <button class="botao botao--perigo botao--pequeno" data-excluir-aula="${aula.id}" type="button">Excluir</button>
            </div>
          </td>
        </tr>`
      )
      .join("");

    corpo.querySelectorAll("[data-editar-aula]").forEach((b) => b.addEventListener("click", () => abrirModalAula(b.dataset.editarAula)));
    corpo.querySelectorAll("[data-excluir-aula]").forEach((b) => b.addEventListener("click", () => excluirAula(b.dataset.excluirAula)));
  }

  function abrirModalAula(id) {
    if (!cursoAulasSelecionado) {
      Danca.ui.mostrarAviso("Cadastre e selecione um curso antes de adicionar aulas.", "erro");
      return;
    }
    const aula = id ? aulasCursoAtual.find((a) => a.id === id) : null;
    document.getElementById("modal-aula-titulo").textContent = aula ? "Editar aula" : "Nova aula";
    document.getElementById("aula-id").value = aula ? aula.id : "";
    document.getElementById("aula-titulo").value = aula ? aula.titulo : "";
    document.getElementById("aula-conteudo").value = aula ? aula.conteudo || "" : "";
    document.getElementById("aula-ordem").value = aula ? aula.ordem : aulasCursoAtual.length + 1;
    document.getElementById("aula-duracao").value = aula ? aula.duracaoMinutos : "";

    Danca.ui.limparErrosCampos(["campo-grupo-aula-titulo", "campo-grupo-aula-ordem", "campo-grupo-aula-duracao", "campo-grupo-aula-conteudo"]);
    document.getElementById("modal-aula").showModal();
  }

  async function salvarAula(evento) {
    evento.preventDefault();
    const id = document.getElementById("aula-id").value || null;
    const dados = {
      cursoId: cursoAulasSelecionado,
      titulo: document.getElementById("aula-titulo").value.trim(),
      conteudo: document.getElementById("aula-conteudo").value.trim(),
      ordem: Number(document.getElementById("aula-ordem").value),
      duracaoMinutos: Number(document.getElementById("aula-duracao").value),
    };

    Danca.ui.limparErrosCampos(["campo-grupo-aula-titulo", "campo-grupo-aula-ordem", "campo-grupo-aula-duracao", "campo-grupo-aula-conteudo"]);
    const erros = Danca.validar.aula(dados, { cursos });
    if (erros.titulo) Danca.ui.mostrarErroCampo("campo-grupo-aula-titulo", erros.titulo);
    if (erros.ordem) Danca.ui.mostrarErroCampo("campo-grupo-aula-ordem", erros.ordem);
    if (erros.duracaoMinutos) Danca.ui.mostrarErroCampo("campo-grupo-aula-duracao", erros.duracaoMinutos);
    if (erros.conteudo) Danca.ui.mostrarErroCampo("campo-grupo-aula-conteudo", erros.conteudo);
    if (Object.keys(erros).length > 0) return;

    try {
      if (id) {
        const atualizada = await Danca.api.atualizar("aulas", id, dados);
        aulasCursoAtual = aulasCursoAtual.map((a) => (a.id === id ? atualizada : a));
      } else {
        const criada = await Danca.api.criar("aulas", dados);
        aulasCursoAtual.push(criada);
      }
      aulasCursoAtual.sort((a, b) => a.ordem - b.ordem);
      document.getElementById("modal-aula").close();
      renderizarTabelaAulas();
      Danca.ui.mostrarAviso("Aula salva com sucesso!", "sucesso");
    } catch (erro) {
      Danca.ui.mostrarAviso(erro.message, "erro");
    }
  }

  async function excluirAula(id) {
    const confirmado = await Danca.ui.confirmar("Excluir esta aula?", { titulo: "Excluir aula", textoConfirmar: "Excluir", perigo: true });
    if (!confirmado) return;
    try {
      await Danca.api.remover("aulas", id);
      aulasCursoAtual = aulasCursoAtual.filter((a) => a.id !== id);
      renderizarTabelaAulas();
      Danca.ui.mostrarAviso("Aula removida.", "sucesso");
    } catch (erro) {
      Danca.ui.mostrarAviso(erro.message, "erro");
    }
  }

  /* ================= Modalidades ================= */

  function renderizarTabelaModalidades() {
    const corpo = document.getElementById("tabela-modalidades");
    if (modalidades.length === 0) {
      corpo.innerHTML = `<tr><td colspan="3">Nenhuma modalidade cadastrada.</td></tr>`;
      return;
    }
    corpo.innerHTML = modalidades
      .map(
        (modalidade) => `
        <tr>
          <td>${Danca.ui.escapar(modalidade.nome)}</td>
          <td>${Danca.ui.escapar(modalidade.descricao || "")}</td>
          <td>
            <div class="tabela__acoes">
              <button class="botao botao--fantasma botao--pequeno" data-editar-modalidade="${modalidade.id}" type="button">Editar</button>
              <button class="botao botao--perigo botao--pequeno" data-excluir-modalidade="${modalidade.id}" type="button">Excluir</button>
            </div>
          </td>
        </tr>`
      )
      .join("");

    corpo.querySelectorAll("[data-editar-modalidade]").forEach((b) => b.addEventListener("click", () => abrirModalModalidade(b.dataset.editarModalidade)));
    corpo.querySelectorAll("[data-excluir-modalidade]").forEach((b) => b.addEventListener("click", () => excluirModalidade(b.dataset.excluirModalidade)));
  }

  function abrirModalModalidade(id) {
    const modalidade = id ? modalidades.find((m) => m.id === id) : null;
    document.getElementById("modal-modalidade-titulo").textContent = modalidade ? "Editar modalidade" : "Nova modalidade";
    document.getElementById("modalidade-id").value = modalidade ? modalidade.id : "";
    document.getElementById("modalidade-nome").value = modalidade ? modalidade.nome : "";
    document.getElementById("modalidade-descricao").value = modalidade ? modalidade.descricao || "" : "";
    document.getElementById("modalidade-foto").value = modalidade ? modalidade.foto || "" : "";

    Danca.ui.limparErrosCampos(["campo-grupo-modalidade-nome", "campo-grupo-modalidade-foto"]);
    document.getElementById("modal-modalidade").showModal();
  }

  async function salvarModalidade(evento) {
    evento.preventDefault();
    const id = document.getElementById("modalidade-id").value || null;
    const dados = {
      nome: document.getElementById("modalidade-nome").value.trim(),
      descricao: document.getElementById("modalidade-descricao").value.trim(),
      foto: document.getElementById("modalidade-foto").value.trim(),
    };

    Danca.ui.limparErrosCampos(["campo-grupo-modalidade-nome", "campo-grupo-modalidade-foto"]);
    const erros = Danca.validar.modalidade(dados, { modalidadesExistentes: modalidades, idAtual: id });
    if (erros.nome) Danca.ui.mostrarErroCampo("campo-grupo-modalidade-nome", erros.nome);
    if (erros.foto) Danca.ui.mostrarErroCampo("campo-grupo-modalidade-foto", erros.foto);
    if (Object.keys(erros).length > 0) return;

    try {
      if (id) {
        const atualizada = await Danca.api.atualizar("modalidades", id, dados);
        modalidades = modalidades.map((m) => (m.id === id ? atualizada : m));
      } else {
        const criada = await Danca.api.criar("modalidades", dados);
        modalidades.push(criada);
      }
      document.getElementById("modal-modalidade").close();
      renderizarTabelaModalidades();
      Danca.ui.mostrarAviso("Modalidade salva com sucesso!", "sucesso");
    } catch (erro) {
      Danca.ui.mostrarAviso(erro.message, "erro");
    }
  }

  async function excluirModalidade(id) {
    if (cursos.some((c) => c.modalidadeId === id)) {
      Danca.ui.mostrarAviso("Existem cursos usando esta modalidade. Altere-os antes de excluir.", "erro");
      return;
    }
    const confirmado = await Danca.ui.confirmar("Excluir esta modalidade?", { titulo: "Excluir modalidade", textoConfirmar: "Excluir", perigo: true });
    if (!confirmado) return;

    try {
      await Danca.api.remover("modalidades", id);
      modalidades = modalidades.filter((m) => m.id !== id);
      renderizarTabelaModalidades();
      Danca.ui.mostrarAviso("Modalidade removida.", "sucesso");
    } catch (erro) {
      Danca.ui.mostrarAviso(erro.message, "erro");
    }
  }

  /* ================= Desempenho ================= */

  function montarSelectCursosDesempenho() {
    const cursosVisiveis = usuarioSessao.role === "admin" ? cursos : cursos.filter((c) => c.instrutorId === usuarioSessao.id);
    const select = document.getElementById("filtro-curso-desempenho");
    select.innerHTML = cursosVisiveis.map((c) => `<option value="${c.id}">${Danca.ui.escapar(c.titulo)}</option>`).join("");

    if (cursosVisiveis.length > 0) {
      select.value = cursosVisiveis[0].id;
      renderizarDesempenho(cursosVisiveis[0].id);
    } else {
      document.getElementById("desempenho-conteudo").innerHTML = `
        <div class="estado-vazio">
          <h3>Nenhum curso sob sua responsabilidade</h3>
          <p>Crie um curso na aba Cursos para acompanhar matrículas e avaliações aqui.</p>
        </div>`;
    }
  }

  async function renderizarDesempenho(cursoId) {
    const alvo = document.getElementById("desempenho-conteudo");
    if (!cursoId) return;
    alvo.innerHTML = `<p class="carregando">Carregando</p>`;

    const [matriculas, avaliacoes] = await Promise.all([
      Danca.api.listar("matriculas", { cursoId }),
      Danca.api.listar("avaliacoes", { cursoId }),
    ]);

    const curso = cursos.find((c) => c.id === cursoId);
    const meta = curso ? Danca.modalidades.LISTA_FIXA.find((m) => m.id === curso.modalidadeId) : null;
    const corGel = meta ? `var(${meta.corVar})` : null;

    const linhasMatriculas = matriculas.length
      ? matriculas
          .map((matricula) => {
            const aluno = usuarios.find((u) => u.id === matricula.usuarioId);
            return `
              <tr>
                <td>${Danca.ui.escapar(aluno ? aluno.nome : "—")}</td>
                <td style="min-width: 180px">${Danca.ui.linhaRitmoHtml(matricula.progresso, corGel)}</td>
                <td><span class="selo ${matricula.status === "concluído" ? "selo--concluido" : "selo--andamento"}">${Danca.ui.capitalizar(matricula.status)}</span></td>
                <td class="numerico">${Danca.ui.formatarData(matricula.dataMatricula)}</td>
              </tr>`;
          })
          .join("")
      : `<tr><td colspan="4">Nenhuma matrícula ainda.</td></tr>`;

    const avaliacoesHtml = avaliacoes.length
      ? avaliacoes.map((av) => Danca.ui.avaliacaoHtml(av, usuarios.find((u) => u.id === av.usuarioId))).join("")
      : `<p class="texto-pequeno" style="color: var(--ivory-dim)">Nenhuma avaliação ainda.</p>`;

    alvo.innerHTML = `
      <h3 class="texto-tamanho-md" style="margin-bottom: var(--espaco-4)">Alunos matriculados</h3>
      <div class="tabela-envolucro">
        <table class="tabela">
          <thead><tr><th>Aluno</th><th>Progresso</th><th>Status</th><th>Data</th></tr></thead>
          <tbody>${linhasMatriculas}</tbody>
        </table>
      </div>
      <h3 class="texto-tamanho-md" style="margin-block: var(--espaco-6) var(--espaco-4)">Avaliações</h3>
      <div class="lista-avaliacoes">${avaliacoesHtml}</div>`;
  }
})();
