(function () {
  document.addEventListener("DOMContentLoaded", () => {
    // Quem já está logado não precisa dessa tela.
    if (Danca.sessao.obter()) {
      window.location.href = "catalogo.html";
      return;
    }

    Danca.ui.montarNavegacao("cadastro.html");
    Danca.ui.montarRodape();
    Danca.ui.montarChatbot();
    Danca.ui.observarRevelacao();
    document.getElementById("dica-prefixo-senha-cadastro").textContent =
      `Mín. 3 caracteres — a senha final começa com "${Danca.senhas.prefixo("aluno")}" (prefixo de conta de aluno).`;
    document.getElementById("formulario-cadastro").addEventListener("submit", aoEnviarFormulario);
  });

  function limparErros() {
    ["campo-grupo-nome", "campo-grupo-email", "campo-grupo-senha"].forEach((id) => {
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

  const MAPA_GRUPOS = { nome: "campo-grupo-nome", email: "campo-grupo-email", senha: "campo-grupo-senha" };

  async function aoEnviarFormulario(evento) {
    evento.preventDefault();
    limparErros();

    const botaoEnviar = document.querySelector("#formulario-cadastro button[type=submit]");
    const nome = document.getElementById("campo-nome").value.trim();
    const email = document.getElementById("campo-email").value.trim();
    const senhaDigitada = document.getElementById("campo-senha").value;

    botaoEnviar.disabled = true;
    try {
      const usuariosExistentes = await Danca.api.listar("usuarios");

      // dados.senha aqui é só o "resto" (sem prefixo) — Danca.validar.usuario
      // já espera receber o texto exatamente como a pessoa digitou.
      const erros = Danca.validar.usuario(
        { nome, email, senha: senhaDigitada, role: "aluno" },
        { usuariosExistentes, exigirSenha: true }
      );

      if (Object.keys(erros).length > 0) {
        Object.entries(erros).forEach(([campo, mensagem]) => {
          const grupoId = MAPA_GRUPOS[campo];
          if (grupoId) mostrarErro(grupoId, mensagem);
        });
        return;
      }

      // Autocadastro sempre cria conta de aluno — trocar pra professor/admin
      // continua sendo exclusivo do painel administrativo (ver enunciado).
      const criado = await Danca.api.criar("usuarios", {
        nome,
        email,
        senha: Danca.senhas.montar("aluno", senhaDigitada),
        role: "aluno",
        ativo: true,
      });

      Danca.sessao.definir(criado);
      Danca.ui.mostrarAviso(`Bem-vindo(a), ${criado.nome.split(" ")[0]}! Conta criada com sucesso.`, "sucesso");
      window.location.href = "catalogo.html";
    } catch (erro) {
      mostrarErro("campo-grupo-senha", erro.message);
    } finally {
      botaoEnviar.disabled = false;
    }
  }
})();
