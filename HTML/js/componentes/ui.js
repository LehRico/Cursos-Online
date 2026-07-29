/* Helpers visuais compartilhados: escapar texto, avisos (toasts), revelação ao
   rolar, o traço da "Linha de Ritmo" (elemento de assinatura) e o card de curso. */
window.Danca = window.Danca || {};
Danca.ui = Danca.ui || {};

(function () {
  Danca.ui.escapar = function (texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
  };

  Danca.ui.iniciais = function (nome) {
    return (nome || "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0].toUpperCase())
      .join("");
  };

  const ROTULO_ROLE = { aluno: "Aluno", professor: "Professor", admin: "Admin" };
  Danca.ui.rotuloRole = function (role) {
    return ROTULO_ROLE[role] || role;
  };

  /*
    Conteúdo de dentro da "bolinha" (.avatar): se o usuário tem uma foto
    mostra a foto, senão cai pras iniciais do nome.

    O campo `foto` pode ser tanto uma imagem enviada pelo próprio usuário
    (data URL em base64, ver Danca.ui.lerImagemComoDataUrl) quanto um avatar
    ilustrado fictício de exemplo (URL do DiceBear, só pros usuários que já
    vêm prontos no db.json). Se a imagem não carregar por algum motivo (ex:
    sem internet, no caso do DiceBear), o onerror troca a <img> pelas
    iniciais na hora, em vez de deixar o ícone de imagem quebrada.
  */
  Danca.ui.avatarConteudo = function (usuario) {
    const iniciais = Danca.ui.iniciais(usuario ? usuario.nome : "?");
    if (usuario && usuario.foto) {
      return `<img src="${usuario.foto}" alt="" onerror="this.replaceWith(document.createTextNode('${iniciais}'))" />`;
    }
    return iniciais;
  };

  /*
    Lê um arquivo de imagem escolhido pelo usuário (input type="file") e
    devolve uma Promise com uma data URL já redimensionada, pra não salvar
    fotos gigantes dentro do db.json (que é só um arquivo texto).

    Como funciona:
    1. FileReader lê o arquivo do computador do usuário e devolve como data
       URL (base64) — é o jeito padrão de "abrir" um arquivo local em JS.
    2. Criamos uma <img> só na memória com essa data URL, pra saber a
       largura/altura reais da foto.
    3. Desenhamos essa imagem redimensionada dentro de um <canvas> (mantendo
       a proporção) e exportamos o canvas de volta como data URL JPEG — é
       esse resultado, bem menor, que vai pro campo `foto` do usuário.
  */
  Danca.ui.lerImagemComoDataUrl = function (arquivo, tamanhoMaximo = 160) {
    return new Promise((resolve, reject) => {
      if (!arquivo.type.startsWith("image/")) {
        reject(new Error("Escolha um arquivo de imagem (JPG, PNG, etc)."));
        return;
      }

      const leitor = new FileReader();
      leitor.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
      leitor.onload = () => {
        const imagem = new Image();
        imagem.onerror = () => reject(new Error("Não foi possível abrir essa imagem."));
        imagem.onload = () => {
          const escala = Math.min(1, tamanhoMaximo / Math.max(imagem.width, imagem.height));
          const largura = Math.round(imagem.width * escala);
          const altura = Math.round(imagem.height * escala);

          const canvas = document.createElement("canvas");
          canvas.width = largura;
          canvas.height = altura;
          canvas.getContext("2d").drawImage(imagem, 0, 0, largura, altura);

          resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        imagem.src = leitor.result;
      };
      leitor.readAsDataURL(arquivo);
    });
  };

  Danca.ui.formatarData = function (isoOuData) {
    const data = new Date(isoOuData);
    if (Number.isNaN(data.getTime())) return "";
    return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  };

  Danca.ui.estrelasHtml = function (nota) {
    const cheias = "★".repeat(nota);
    const vazias = "☆".repeat(5 - nota);
    return `<span class="avaliacao__estrelas" aria-label="${nota} de 5 estrelas">${cheias}${vazias}</span>`;
  };

  /* ---- Erros de campo em formulários ---- */
  Danca.ui.mostrarErroCampo = function (idGrupo, mensagem) {
    const grupo = document.getElementById(idGrupo);
    if (!grupo) return;
    grupo.classList.add("tem-erro");
    const alvo = grupo.querySelector(".campo__erro");
    if (alvo) alvo.textContent = mensagem;
  };

  Danca.ui.limparErrosCampos = function (idsGrupos) {
    idsGrupos.forEach((id) => {
      const grupo = document.getElementById(id);
      if (!grupo) return;
      grupo.classList.remove("tem-erro");
      const alvo = grupo.querySelector(".campo__erro");
      if (alvo) alvo.textContent = "";
    });
  };

  /* ---- Avisos (toasts) ---- */
  Danca.ui.mostrarAviso = function (mensagem, tipo = "info") {
    let contêiner = document.querySelector(".avisos");
    if (!contêiner) {
      contêiner = document.createElement("div");
      contêiner.className = "avisos";
      contêiner.setAttribute("role", "status");
      contêiner.setAttribute("aria-live", "polite");
      document.body.appendChild(contêiner);
    }
    const aviso = document.createElement("div");
    aviso.className = `aviso aviso--${tipo}`;
    aviso.textContent = mensagem;
    contêiner.appendChild(aviso);
    setTimeout(() => aviso.remove(), 5000);
  };

  /* ---- Revelação ao rolar ----
     .revelar por si só não esconde nada (evita que a página fique com
     conteúdo invisível se algum fluxo esquecer de chamar esta função).
     Só ao armar (.revelar-ativo) o elemento passa a nascer oculto para
     depois animar quando entra na viewport. */
  Danca.ui.observarRevelacao = function (seletor = ".revelar") {
    const elementos = document.querySelectorAll(seletor);
    if (elementos.length === 0) return;

    if (!("IntersectionObserver" in window)) return;

    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (entrada.isIntersecting) {
            entrada.target.classList.add("esta-visivel");
            observador.unobserve(entrada.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    elementos.forEach((el, indice) => {
      if (el.classList.contains("revelar-ativo")) return;
      el.style.setProperty("--atraso", `${Math.min(indice, 8) * 70}ms`);
      el.classList.add("revelar-ativo");
      observador.observe(el);
    });
  };

  /* ---- Traço "Linha de Ritmo" ---- */
  function trilhaOndulada(largura, altura, ciclos) {
    const passo = largura / ciclos;
    let d = `M0,${altura / 2}`;
    for (let i = 0; i < ciclos; i++) {
      const x1 = passo * i + passo / 2;
      const x2 = passo * (i + 1);
      const topo = i % 2 === 0 ? altura * 0.12 : altura * 0.88;
      d += ` Q${x1.toFixed(1)},${topo.toFixed(1)} ${x2.toFixed(1)},${altura / 2}`;
    }
    return d;
  }

  Danca.ui.linhaRitmoHtml = function (progresso, corVar) {
    const valor = Math.max(0, Math.min(100, Number(progresso) || 0));
    const caminho = trilhaOndulada(300, 32, 6);
    return `
      <div class="linha-ritmo" style="--progresso:${valor};${corVar ? `--gel:${corVar};` : ""}">
        <svg viewBox="0 0 300 32" preserveAspectRatio="none" aria-hidden="true">
          <path class="linha-ritmo__trilho" d="${caminho}" pathLength="100" />
          <path class="linha-ritmo__preenchimento" d="${caminho}" pathLength="100" />
        </svg>
        <span class="linha-ritmo__valor numerico">${Math.round(valor)}%</span>
      </div>`;
  };

  Danca.ui.svgPlaceholderCapa = function () {
    const caminho = trilhaOndulada(400, 220, 3);
    return `<svg viewBox="0 0 400 220" preserveAspectRatio="none" aria-hidden="true"><path d="${caminho}" stroke="rgba(246,238,228,.55)" stroke-width="2" fill="none" /></svg>`;
  };

  Danca.ui.avaliacaoHtml = function (avaliacao, autor) {
    return `
      <article class="avaliacao revelar">
        <div class="avaliacao__cabecalho">
          <span class="avaliacao__autor">
            <span class="avatar">${Danca.ui.avatarConteudo(autor)}</span>
            ${Danca.ui.escapar(autor ? autor.nome : "Aluno")}
          </span>
          ${Danca.ui.estrelasHtml(avaliacao.nota)}
        </div>
        ${avaliacao.comentario ? `<p class="avaliacao__comentario">${Danca.ui.escapar(avaliacao.comentario)}</p>` : ""}
        <span class="avaliacao__data">${Danca.ui.formatarData(avaliacao.data)}</span>
      </article>`;
  };

  /* ---- Card de curso ---- */
  Danca.ui.cartaoCursoHtml = function (curso, { modalidade, instrutor, mostrarStatus = false } = {}) {
    const corGel = modalidade ? `var(${modalidade.corVar})` : "var(--gold)";
    const seloStatus =
      mostrarStatus && curso.status === "rascunho"
        ? '<span class="selo selo--rascunho cartao-curso__selo">Rascunho</span>'
        : "";
    const imagem = Danca.modalidades.imagemCapa(curso.modalidadeId);

    return `
      <article class="cartao-curso revelar" style="--gel:${corGel}">
        <div class="cartao-curso__capa">
          ${Danca.ui.svgPlaceholderCapa()}
          <img src="${imagem}" alt="" loading="lazy" onerror="this.remove()" />
          ${seloStatus}
        </div>
        <div class="cartao-curso__corpo">
          <span class="etiqueta-modalidade">${Danca.ui.escapar(modalidade ? modalidade.nome : "")}</span>
          <h3 class="cartao-curso__titulo">${Danca.ui.escapar(curso.titulo)}</h3>
          <p class="cartao-curso__descricao">${Danca.ui.escapar(curso.descricao || "")}</p>
          <div class="cartao-curso__meta">
            <span>${Danca.ui.escapar(capitalizar(curso.nivel))}</span>
            <span>${curso.cargaHoraria}h</span>
            ${instrutor ? `<span>Prof. ${Danca.ui.escapar(instrutor.nome)}</span>` : ""}
          </div>
          <div class="cartao-curso__rodape">
            <a class="botao botao--primario botao--pequeno" href="curso.html?id=${encodeURIComponent(curso.id)}">Ver curso</a>
          </div>
        </div>
      </article>`;
  };

  function capitalizar(texto) {
    return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : "";
  }
  Danca.ui.capitalizar = capitalizar;
})();
