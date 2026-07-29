(function () {
  document.addEventListener("DOMContentLoaded", () => {
    // Quem já está logado não precisa ver a tela de login de novo — manda
    // direto pra página que ela queria (ou pro catálogo, se não tinha nenhuma).
    if (Danca.sessao.obter()) {
      window.location.href = obterDestinoRedirecionamento();
      return;
    }

    Danca.ui.montarNavegacao("login.html");
    Danca.ui.observarRevelacao();
    carregarContasDemo();
    document.getElementById("formulario-login").addEventListener("submit", aoEnviarFormulario);
  });

  /*
    Descobre pra onde mandar a pessoa depois do login: a página que ela
    tentava abrir antes de ser barrada por Danca.sessao.exigir() (guardada
    na query string "?redirecionar=..."), ou o catálogo por padrão.

    Só aceitamos um nome de arquivo do próprio site (ex: "curso.html?id=c3"),
    nunca uma URL completa — isso evita que alguém monte um link tipo
    "login.html?redirecionar=https://site-malicioso.com" e use nosso login
    pra redirecionar a vítima pra fora do site depois que ela loga.
  */
  function obterDestinoRedirecionamento() {
    const parametro = new URLSearchParams(window.location.search).get("redirecionar");
    if (!parametro || parametro.startsWith("http://") || parametro.startsWith("https://") || parametro.startsWith("//")) {
      return "catalogo.html";
    }
    return parametro;
  }

  async function carregarContasDemo() {
    const lista = document.getElementById("lista-usuarios-demo");
    try {
      const usuarios = await Danca.api.listar("usuarios");
      const ordemRole = { admin: 0, professor: 1, aluno: 2 };
      // Só as contas marcadas com demo:true aparecem aqui — uma por papel
      // (admin, professor, aluno) — mesmo que o db.json tenha muito mais
      // usuários "de verdade" por trás pra dar volume aos cursos e turmas.
      const contas = usuarios
        .filter((u) => u.ativo && u.demo)
        .sort((a, b) => ordemRole[a.role] - ordemRole[b.role]);

      lista.innerHTML = contas
        .map(
          (usuario) => `
          <button type="button" class="usuario-demo" data-email="${Danca.ui.escapar(usuario.email)}" data-senha="${Danca.ui.escapar(usuario.senha)}">
            <span class="avatar">${Danca.ui.avatarConteudo(usuario)}</span>
            <span class="usuario-demo__info">
              <span class="usuario-demo__nome">${Danca.ui.escapar(usuario.nome)}</span>
              <span class="usuario-demo__papel">${Danca.ui.escapar(usuario.email)}</span>
            </span>
            <span class="selo selo--role-${usuario.role}">${Danca.ui.rotuloRole(usuario.role)}</span>
          </button>`
        )
        .join("");

      lista.querySelectorAll(".usuario-demo").forEach((botao) => {
        botao.addEventListener("click", () => {
          document.getElementById("campo-email").value = botao.dataset.email;
          document.getElementById("campo-senha").value = botao.dataset.senha;
          autenticar(botao.dataset.email, botao.dataset.senha);
        });
      });
    } catch (erro) {
      lista.innerHTML = `<p class="texto-pequeno" style="color:var(--gel-dancas-urbanas)">${Danca.ui.escapar(erro.message)}</p>`;
    }
  }

  async function aoEnviarFormulario(evento) {
    evento.preventDefault();
    const email = document.getElementById("campo-email").value.trim();
    const senha = document.getElementById("campo-senha").value;
    await autenticar(email, senha);
  }

  function limparErros() {
    ["campo-grupo-email", "campo-grupo-senha"].forEach((id) => {
      const campo = document.getElementById(id);
      campo.classList.remove("tem-erro");
      campo.querySelector(".campo__erro").textContent = "";
    });
  }

  function mostrarErro(idGrupo, mensagem) {
    const campo = document.getElementById(idGrupo);
    campo.classList.add("tem-erro");
    campo.querySelector(".campo__erro").textContent = mensagem;
  }

  async function autenticar(email, senha) {
    limparErros();
    const botaoEnviar = document.querySelector("#formulario-login button[type=submit]");
    botaoEnviar.disabled = true;

    try {
      const usuarios = await Danca.api.listar("usuarios");
      const usuario = usuarios.find((u) => u.email.toLowerCase() === email.toLowerCase());

      if (!usuario || usuario.senha !== senha) {
        mostrarErro("campo-grupo-senha", "E-mail ou senha incorretos.");
        return;
      }
      if (!usuario.ativo) {
        mostrarErro("campo-grupo-email", "Esta conta está desativada. Fale com um administrador.");
        return;
      }

      Danca.sessao.definir(usuario);
      Danca.ui.mostrarAviso(`Bem-vindo(a), ${usuario.nome.split(" ")[0]}!`, "sucesso");
      window.location.href = obterDestinoRedirecionamento();
    } catch (erro) {
      mostrarErro("campo-grupo-senha", erro.message);
    } finally {
      botaoEnviar.disabled = false;
    }
  }
})();
