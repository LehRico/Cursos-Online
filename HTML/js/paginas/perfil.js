(function () {
  let usuarioSessao;

  document.addEventListener("DOMContentLoaded", async () => {
    usuarioSessao = Danca.sessao.exigir(["aluno", "professor", "admin"]);
    if (!usuarioSessao) return;

    Danca.ui.montarNavegacao("perfil.html");
    renderizarCabecalhoPerfil();
    Danca.ui.observarRevelacao();
    document.getElementById("formulario-perfil").addEventListener("submit", salvarPerfil);

    if (usuarioSessao.role === "aluno") {
      document.getElementById("secao-aluno").hidden = false;
      Danca.ui.observarRevelacao();
      await carregarMinhasMatriculas();
    } else {
      renderizarAtalhosEquipe();
      Danca.ui.observarRevelacao();
    }
  });

  function renderizarCabecalhoPerfil() {
    document.getElementById("perfil-avatar").textContent = Danca.ui.iniciais(usuarioSessao.nome);
    document.getElementById("perfil-nome-atual").textContent = usuarioSessao.nome;
    document.getElementById("perfil-email-atual").textContent = usuarioSessao.email;
    const selo = document.getElementById("perfil-role-atual");
    selo.textContent = Danca.ui.rotuloRole(usuarioSessao.role);
    selo.className = `selo selo--role-${usuarioSessao.role}`;
    document.getElementById("campo-nome").value = usuarioSessao.nome;
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

  async function salvarPerfil(evento) {
    evento.preventDefault();
    const novoNome = document.getElementById("campo-nome").value.trim();
    const novaSenha = document.getElementById("campo-senha").value;

    Danca.ui.limparErrosCampos(["campo-grupo-nome", "campo-grupo-senha"]);

    if (!novoNome || novoNome.length < 3) {
      Danca.ui.mostrarErroCampo("campo-grupo-nome", "Informe um nome com pelo menos 3 caracteres.");
      return;
    }
    if (novaSenha && novaSenha.length < 6) {
      Danca.ui.mostrarErroCampo("campo-grupo-senha", "A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    const dados = { nome: novoNome };
    if (novaSenha) dados.senha = novaSenha;

    try {
      const atualizado = await Danca.api.atualizar("usuarios", usuarioSessao.id, dados);
      usuarioSessao = atualizado;
      Danca.sessao.definir(atualizado);
      renderizarCabecalhoPerfil();
      Danca.ui.montarNavegacao("perfil.html");
      document.getElementById("campo-senha").value = "";
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
          <a class="botao botao--primario" style="margin-top: var(--espaco-4)" href="index.html">Ver catálogo</a>
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
