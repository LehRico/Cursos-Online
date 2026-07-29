(function () {
  let cursos = [];
  let modalidades = [];
  let usuarios = [];
  let filtroModalidade = "todas";
  let filtroNivel = "todos";
  let filtroBusca = "";

  document.addEventListener("DOMContentLoaded", async () => {
    Danca.ui.montarNavegacao("catalogo.html");
    Danca.ui.observarRevelacao();

    const parametros = new URLSearchParams(window.location.search);
    const modalidadeUrl = parametros.get("modalidade");
    if (modalidadeUrl && Danca.modalidades.LISTA_FIXA.some((m) => m.id === modalidadeUrl)) {
      filtroModalidade = modalidadeUrl;
    }

    document.getElementById("filtro-nivel").addEventListener("change", (evento) => {
      filtroNivel = evento.target.value;
      renderizarCursos();
    });

    let atrasoBusca;
    document.getElementById("filtro-busca").addEventListener("input", (evento) => {
      clearTimeout(atrasoBusca);
      atrasoBusca = setTimeout(() => {
        filtroBusca = evento.target.value.trim().toLowerCase();
        renderizarCursos();
      }, 180);
    });

    await carregarDados();
    montarChipsFiltro();
    renderizarCursos();
  });

  async function carregarDados() {
    const grade = document.getElementById("grade-cursos");
    try {
      [cursos, modalidades, usuarios] = await Promise.all([
        Danca.api.listar("cursos", { status: "publicado" }),
        Danca.api.listar("modalidades"),
        Danca.api.listar("usuarios"),
      ]);
    } catch (erro) {
      grade.innerHTML = `<div class="estado-vazio"><h3>Não foi possível carregar os cursos</h3><p>${Danca.ui.escapar(erro.message)}</p></div>`;
    }
  }

  function montarChipsFiltro() {
    const contêiner = document.getElementById("filtros-chips");
    const chips = [{ id: "todas", nome: "Todas" }, ...Danca.modalidades.LISTA_FIXA];
    contêiner.innerHTML = chips
      .map(
        (meta) => `
        <button type="button" class="chip" style="${meta.corVar ? `--gel: var(${meta.corVar})` : ""}" data-modalidade="${meta.id}" aria-pressed="${meta.id === filtroModalidade}">
          ${Danca.ui.escapar(meta.nome)}
        </button>`
      )
      .join("");

    contêiner.querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("click", () => selecionarModalidade(chip.dataset.modalidade));
    });
  }

  function selecionarModalidade(id) {
    filtroModalidade = id;
    document.querySelectorAll("#filtros-chips .chip").forEach((chip) => {
      chip.setAttribute("aria-pressed", String(chip.dataset.modalidade === id));
    });
    renderizarCursos();
  }

  function renderizarCursos() {
    const grade = document.getElementById("grade-cursos");
    const filtrados = cursos.filter((curso) => {
      if (filtroModalidade !== "todas" && curso.modalidadeId !== filtroModalidade) return false;
      if (filtroNivel !== "todos" && curso.nivel !== filtroNivel) return false;
      if (filtroBusca && !curso.titulo.toLowerCase().includes(filtroBusca)) return false;
      return true;
    });

    if (filtrados.length === 0) {
      grade.innerHTML = `
        <div class="estado-vazio">
          <h3>Nenhum curso encontrado</h3>
          <p>Tente outra modalidade, nível ou termo de busca.</p>
        </div>`;
      return;
    }

    grade.innerHTML = filtrados
      .map((curso) => {
        const meta = Danca.modalidades.LISTA_FIXA.find((m) => m.id === curso.modalidadeId);
        const dadosApi = modalidades.find((m) => m.id === curso.modalidadeId);
        const instrutor = usuarios.find((u) => u.id === curso.instrutorId);
        return Danca.ui.cartaoCursoHtml(curso, {
          modalidade: meta ? { nome: dadosApi ? dadosApi.nome : meta.nome, corVar: meta.corVar } : null,
          instrutor,
          todosCursos: cursos,
        });
      })
      .join("");

    Danca.ui.observarRevelacao(".grade-cursos .revelar");
    Danca.ui.iniciarCarrosseisCapa(grade);
  }
})();
