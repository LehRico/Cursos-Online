(function () {
  let usuarioSessao;
  let usuarios = [];
  let novaFotoDataUrl = null;

  document.addEventListener("DOMContentLoaded", async () => {
    usuarioSessao = Danca.sessao.exigir(["admin"]);
    if (!usuarioSessao) return;

    Danca.ui.montarNavegacao("painel-admin.html");
    Danca.ui.montarRodape();
    Danca.ui.montarChatbot();
    document.querySelectorAll("[data-fechar-modal]").forEach((botao) => {
      botao.addEventListener("click", () => document.getElementById(botao.dataset.fecharModal).close());
    });
    document.getElementById("botao-novo-usuario").addEventListener("click", () => abrirModalUsuario());
    document.getElementById("formulario-usuario").addEventListener("submit", salvarUsuario);
    document.getElementById("usuario-foto").addEventListener("change", aoEscolherFotoUsuario);

    await carregarUsuarios();
  });

  async function carregarUsuarios() {
    usuarios = await Danca.api.listar("usuarios");
    renderizarTabela();
  }

  function renderizarTabela() {
    const corpo = document.getElementById("tabela-usuarios");
    const ordenados = usuarios.slice().sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

    corpo.innerHTML = ordenados
      .map((usuario) => {
        const ehVoce = usuario.id === usuarioSessao.id;
        return `
          <tr>
            <td>
              <div style="display: flex; align-items: center; gap: var(--espaco-3)">
                <span class="avatar">${Danca.ui.avatarConteudo(usuario)}</span>
                <div>
                  <strong>${Danca.ui.escapar(usuario.nome)}</strong>${ehVoce ? ' <span class="texto-pequeno" style="color: var(--gold-soft)">(você)</span>' : ""}
                  <div class="texto-pequeno" style="color: var(--ivory-dim)">${Danca.ui.escapar(usuario.email)}</div>
                </div>
              </div>
            </td>
            <td>
              <select class="campo-select-inline" data-role-usuario="${usuario.id}" ${ehVoce ? "disabled" : ""} aria-label="Papel de ${Danca.ui.escapar(usuario.nome)}">
                <option value="aluno" ${usuario.role === "aluno" ? "selected" : ""}>Aluno</option>
                <option value="professor" ${usuario.role === "professor" ? "selected" : ""}>Professor</option>
                <option value="admin" ${usuario.role === "admin" ? "selected" : ""}>Admin</option>
              </select>
            </td>
            <td>
              <label class="interruptor">
                <input type="checkbox" data-ativo-usuario="${usuario.id}" ${usuario.ativo ? "checked" : ""} ${ehVoce ? "disabled" : ""} />
                <span class="interruptor__trilho"></span>
                ${usuario.ativo ? "Ativo" : "Inativo"}
              </label>
            </td>
            <td>
              <div class="tabela__acoes">
                <button class="botao botao--fantasma botao--pequeno" data-editar-usuario="${usuario.id}" type="button">Editar</button>
                <button class="botao botao--perigo botao--pequeno" data-excluir-usuario="${usuario.id}" type="button" ${ehVoce ? "disabled" : ""}>Excluir</button>
              </div>
            </td>
          </tr>`;
      })
      .join("");

    corpo.querySelectorAll("[data-role-usuario]").forEach((select) => {
      select.addEventListener("change", (evento) => atualizarRole(select.dataset.roleUsuario, evento.target.value));
    });
    corpo.querySelectorAll("[data-ativo-usuario]").forEach((input) => {
      input.addEventListener("change", (evento) => atualizarAtivo(input.dataset.ativoUsuario, evento.target.checked));
    });
    corpo.querySelectorAll("[data-editar-usuario]").forEach((b) => b.addEventListener("click", () => abrirModalUsuario(b.dataset.editarUsuario)));
    corpo.querySelectorAll("[data-excluir-usuario]").forEach((b) => b.addEventListener("click", () => excluirUsuario(b.dataset.excluirUsuario)));
  }

  /* Cada senha começa com o prefixo de 3 dígitos do role da conta (ver
     Danca.senhas) — trocar o role sem trocar a senha deixaria uma senha com
     prefixo "errado" pro novo papel. Por isso, ao mudar o role pela tabela,
     gera uma senha nova (prefixo certo + sufixo aleatório) e mostra pro
     admin repassar à pessoa. */
  function gerarSufixoAleatorio() {
    return Math.random().toString(36).slice(2, 2 + Danca.senhas.TAMANHO_MINIMO_RESTO + 2);
  }

  async function atualizarRole(id, novoRole) {
    const senhaNova = Danca.senhas.montar(novoRole, gerarSufixoAleatorio());
    try {
      const atualizado = await Danca.api.atualizar("usuarios", id, { role: novoRole, senha: senhaNova });
      usuarios = usuarios.map((u) => (u.id === id ? atualizado : u));
      Danca.ui.mostrarAviso(`Papel atualizado. Nova senha gerada: ${senhaNova} — repasse à pessoa.`, "sucesso");
    } catch (erro) {
      Danca.ui.mostrarAviso(erro.message, "erro");
      renderizarTabela();
    }
  }

  async function atualizarAtivo(id, ativo) {
    try {
      const atualizado = await Danca.api.atualizar("usuarios", id, { ativo });
      usuarios = usuarios.map((u) => (u.id === id ? atualizado : u));
      renderizarTabela();
    } catch (erro) {
      Danca.ui.mostrarAviso(erro.message, "erro");
      renderizarTabela();
    }
  }

  function abrirModalUsuario(id) {
    const usuario = id ? usuarios.find((u) => u.id === id) : null;
    document.getElementById("modal-usuario-titulo").textContent = usuario ? "Editar usuário" : "Novo usuário";
    document.getElementById("usuario-id").value = usuario ? usuario.id : "";
    document.getElementById("usuario-nome").value = usuario ? usuario.nome : "";
    document.getElementById("usuario-email").value = usuario ? usuario.email : "";
    // "Novo usuário" sugere professor por padrão — é o caso mais comum de
    // onboarding pelo admin. Ele pode trocar pra aluno/admin no próprio select.
    document.getElementById("usuario-role").value = usuario ? usuario.role : "professor";
    document.getElementById("usuario-role").disabled = !!(usuario && usuario.id === usuarioSessao.id);
    document.getElementById("usuario-senha").value = "";
    document.getElementById("usuario-senha").placeholder = usuario ? "Deixe em branco para manter a atual" : "";
    document.getElementById("usuario-foto").value = "";
    novaFotoDataUrl = null;

    atualizarDicaPrefixoSenha();
    document.getElementById("usuario-role").addEventListener("change", atualizarDicaPrefixoSenha);

    Danca.ui.limparErrosCampos([
      "campo-grupo-usuario-nome",
      "campo-grupo-usuario-email",
      "campo-grupo-usuario-senha",
      "campo-grupo-usuario-role",
      "campo-grupo-usuario-foto",
    ]);
    document.getElementById("modal-usuario").showModal();
  }

  /* O campo de senha do formulário só recebe o "resto" (sem o prefixo) — a
     dica mostra qual prefixo será colado na frente, de acordo com o papel
     selecionado no momento. */
  function atualizarDicaPrefixoSenha() {
    const role = document.getElementById("usuario-role").value;
    document.getElementById("dica-prefixo-senha").textContent = `A senha final começa com "${Danca.senhas.prefixo(role)}" (prefixo do papel selecionado).`;
  }

  async function aoEscolherFotoUsuario(evento) {
    const arquivo = evento.target.files[0];
    if (!arquivo) return;

    Danca.ui.limparErrosCampos(["campo-grupo-usuario-foto"]);
    try {
      novaFotoDataUrl = await Danca.ui.lerImagemComoDataUrl(arquivo);
    } catch (erro) {
      Danca.ui.mostrarErroCampo("campo-grupo-usuario-foto", erro.message);
      evento.target.value = "";
    }
  }

  async function salvarUsuario(evento) {
    evento.preventDefault();
    const id = document.getElementById("usuario-id").value || null;
    const senha = document.getElementById("usuario-senha").value;
    const dados = {
      nome: document.getElementById("usuario-nome").value.trim(),
      email: document.getElementById("usuario-email").value.trim(),
      role: document.getElementById("usuario-role").value,
    };
    const exigirSenha = !id || senha.length > 0;

    Danca.ui.limparErrosCampos(["campo-grupo-usuario-nome", "campo-grupo-usuario-email", "campo-grupo-usuario-senha", "campo-grupo-usuario-role"]);
    const erros = Danca.validar.usuario({ ...dados, senha }, { usuariosExistentes: usuarios, idAtual: id, exigirSenha });
    const mapaGrupos = {
      nome: "campo-grupo-usuario-nome",
      email: "campo-grupo-usuario-email",
      senha: "campo-grupo-usuario-senha",
      role: "campo-grupo-usuario-role",
    };

    if (Object.keys(erros).length > 0) {
      Object.entries(erros).forEach(([campo, mensagem]) => Danca.ui.mostrarErroCampo(mapaGrupos[campo], mensagem));
      return;
    }

    const senhaCompleta = senha ? Danca.senhas.montar(dados.role, senha) : null;
    if (senhaCompleta) dados.senha = senhaCompleta;
    if (!id) dados.ativo = true;
    if (novaFotoDataUrl) dados.foto = novaFotoDataUrl;

    try {
      if (id) {
        const atualizado = await Danca.api.atualizar("usuarios", id, dados);
        usuarios = usuarios.map((u) => (u.id === id ? atualizado : u));
      } else {
        const criado = await Danca.api.criar("usuarios", dados);
        usuarios.push(criado);
        await notificarNovoUsuarioPorEmail(criado, senhaCompleta);
      }
      document.getElementById("modal-usuario").close();
      renderizarTabela();
      Danca.ui.mostrarAviso("Usuário salvo com sucesso!", "sucesso");
    } catch (erro) {
      Danca.ui.mostrarAviso(erro.message, "erro");
    }
  }

  /* Ao criar um usuário novo (qualquer papel), envia um e-mail com login e
     senha via EmailJS. Falha de envio não desfaz a criação — só avisa o
     admin, já que a conta já existe e ele pode repassar as credenciais
     manualmente se o e-mail não sair. */
  async function notificarNovoUsuarioPorEmail(usuario, senha) {
    try {
      const enviado = await Danca.email.enviarBoasVindas({ nome: usuario.nome, email: usuario.email, senha, role: usuario.role });
      if (enviado) {
        Danca.ui.mostrarAviso(`E-mail com as credenciais enviado para ${usuario.email}.`, "sucesso");
      } else {
        Danca.ui.mostrarAviso("Usuário criado, mas o envio de e-mail não está disponível agora.", "erro");
      }
    } catch {
      Danca.ui.mostrarAviso("Usuário criado, mas não foi possível enviar o e-mail com as credenciais.", "erro");
    }
  }

  async function excluirUsuario(id) {
    if (id === usuarioSessao.id) {
      Danca.ui.mostrarAviso("Você não pode excluir a própria conta.", "erro");
      return;
    }
    const usuario = usuarios.find((u) => u.id === id);
    if (!usuario) return;

    if (usuario.role !== "aluno") {
      const cursosDoInstrutor = await Danca.api.listar("cursos", { instrutorId: id });
      if (cursosDoInstrutor.length > 0) {
        Danca.ui.mostrarAviso("Este usuário leciona cursos. Reatribua-os a outro professor antes de excluir.", "erro");
        return;
      }
    }

    const confirmado = await Danca.ui.confirmar(`Excluir "${usuario.nome}"? Isso também remove matrículas e avaliações relacionadas.`, {
      titulo: "Excluir usuário",
      textoConfirmar: "Excluir",
      perigo: true,
    });
    if (!confirmado) return;

    try {
      const [matriculasRelacionadas, avaliacoesRelacionadas] = await Promise.all([
        Danca.api.listar("matriculas", { usuarioId: id }),
        Danca.api.listar("avaliacoes", { usuarioId: id }),
      ]);
      await Promise.all([
        ...matriculasRelacionadas.map((m) => Danca.api.remover("matriculas", m.id)),
        ...avaliacoesRelacionadas.map((a) => Danca.api.remover("avaliacoes", a.id)),
      ]);
      await Danca.api.remover("usuarios", id);

      usuarios = usuarios.filter((u) => u.id !== id);
      renderizarTabela();
      Danca.ui.mostrarAviso("Usuário removido.", "sucesso");
    } catch (erro) {
      Danca.ui.mostrarAviso(erro.message, "erro");
    }
  }
})();
