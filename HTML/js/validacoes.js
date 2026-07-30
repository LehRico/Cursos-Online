/* Validações client-side que espelham as regras obrigatórias do enunciado. */
window.Danca = window.Danca || {};

(function () {
  function preenchido(valor) {
    return valor !== undefined && valor !== null && String(valor).trim().length > 0;
  }

  function emailValido(valor) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(valor || ""));
  }

  Danca.validar = {
    usuario(dados, { usuariosExistentes = [], idAtual = null, exigirSenha = true } = {}) {
      const erros = {};

      if (!preenchido(dados.nome) || dados.nome.trim().length < 3) {
        erros.nome = "Informe um nome com pelo menos 3 caracteres.";
      }

      if (!preenchido(dados.email) || !emailValido(dados.email)) {
        erros.email = "Informe um e-mail válido.";
      } else if (
        usuariosExistentes.some((u) => u.id !== idAtual && u.email.toLowerCase() === dados.email.trim().toLowerCase())
      ) {
        erros.email = "Já existe uma conta com esse e-mail.";
      }

      /*
        dados.senha aqui é só o "resto" digitado pela pessoa (sem o prefixo
        de 3 dígitos por role, ver Danca.senhas) — por isso o mínimo exigido
        é 3, não 6: o total final (prefixo + resto) sempre bate os 6
        caracteres mínimos do enunciado.
      */
      if (exigirSenha && (!preenchido(dados.senha) || dados.senha.length < Danca.senhas.TAMANHO_MINIMO_RESTO)) {
        erros.senha = `A senha precisa ter pelo menos ${Danca.senhas.TAMANHO_MINIMO_RESTO} caracteres (além do prefixo do papel).`;
      }

      if (!["aluno", "professor", "admin"].includes(dados.role)) {
        erros.role = "Selecione um papel válido.";
      }

      return erros;
    },

    modalidade(dados, { modalidadesExistentes = [], idAtual = null } = {}) {
      const erros = {};
      if (!preenchido(dados.nome)) {
        erros.nome = "Informe o nome da modalidade.";
      } else if (
        modalidadesExistentes.some((m) => m.id !== idAtual && m.nome.trim().toLowerCase() === dados.nome.trim().toLowerCase())
      ) {
        erros.nome = "Já existe uma modalidade com esse nome.";
      }
      if (preenchido(dados.foto) && !/^https?:\/\/.+/.test(dados.foto.trim())) {
        erros.foto = "Informe um link válido (começando com http:// ou https://).";
      }
      return erros;
    },

    /*
      status "ferias" é uma extensão do enunciado (que previa só rascunho/publicado):
      funciona como uma variante de rascunho — curso fica fora do catálogo público e
      sem novas matrículas (ver Danca.validar.matricula), mas com rótulo próprio pro
      professor/admin saberem que é uma pausa temporária, não um curso inacabado.
    */
    curso(dados, { modalidades = [], instrutores = [] } = {}) {
      const erros = {};

      if (!preenchido(dados.titulo) || dados.titulo.trim().length < 5) {
        erros.titulo = "O título precisa ter pelo menos 5 caracteres.";
      }
      if (!preenchido(dados.modalidadeId) || !modalidades.some((m) => m.id === dados.modalidadeId)) {
        erros.modalidadeId = "Selecione uma modalidade existente.";
      }
      if (!preenchido(dados.instrutorId) || !instrutores.some((i) => i.id === dados.instrutorId)) {
        erros.instrutorId = "Selecione um instrutor (professor ou admin) válido.";
      }
      if (!["rascunho", "publicado", "ferias"].includes(dados.status)) {
        erros.status = "Selecione um status válido.";
      }
      if (!["iniciante", "intermediário", "avançado"].includes(dados.nivel)) {
        erros.nivel = "Selecione um nível válido.";
      }
      if (!(Number(dados.cargaHoraria) > 0)) {
        erros.cargaHoraria = "Informe uma carga horária positiva.";
      }
      if (Array.isArray(dados.fotos) && dados.fotos.some((url) => !/^https?:\/\/.+/.test(url))) {
        erros.fotos = "Cada foto precisa ser um link válido (começando com http:// ou https://).";
      }

      return erros;
    },

    aula(dados, { cursos = [] } = {}) {
      const erros = {};

      if (!preenchido(dados.cursoId) || !cursos.some((c) => c.id === dados.cursoId)) {
        erros.cursoId = "Selecione um curso existente.";
      }
      if (!preenchido(dados.titulo)) {
        erros.titulo = "Informe o título da aula.";
      }
      if (!(Number.isInteger(Number(dados.ordem)) && Number(dados.ordem) > 0)) {
        erros.ordem = "A ordem precisa ser um número inteiro positivo.";
      }
      if (!(Number(dados.duracaoMinutos) > 0)) {
        erros.duracaoMinutos = "Informe uma duração positiva.";
      }
      if (preenchido(dados.linkMeet) && !/^https:\/\/meet\.google\.com\/.+/.test(dados.linkMeet.trim())) {
        erros.linkMeet = "Informe um link válido do Google Meet (https://meet.google.com/…).";
      }

      return erros;
    },

    matricula({ curso, usuario, usuarioId, cursoId, matriculasExistentes = [] }) {
      const erros = {};

      if (usuario && usuario.role !== "aluno") {
        erros.geral = "Só contas de aluno podem se matricular em cursos.";
      }
      if (!curso || curso.status !== "publicado") {
        erros.geral = "Só é possível se matricular em cursos publicados.";
      }
      if (matriculasExistentes.some((m) => m.usuarioId === usuarioId && m.cursoId === cursoId)) {
        erros.geral = "Você já está matriculado neste curso.";
      }

      return erros;
    },

    avaliacao({ matricula, usuarioId, cursoId, nota, comentario, avaliacoesExistentes = [] }) {
      const erros = {};

      if (!matricula || matricula.status !== "concluído") {
        erros.geral = "Só é possível avaliar cursos com matrícula concluída.";
      }
      const notaNumero = Number(nota);
      if (!Number.isInteger(notaNumero) || notaNumero < 1 || notaNumero > 5) {
        erros.nota = "A nota precisa ser um número inteiro de 1 a 5.";
      }
      if (comentario && comentario.length > 500) {
        erros.comentario = "O comentário pode ter no máximo 500 caracteres.";
      }
      if (avaliacoesExistentes.some((a) => a.usuarioId === usuarioId && a.cursoId === cursoId)) {
        erros.geral = "Você já avaliou este curso.";
      }

      return erros;
    },

    progressoValido(valor) {
      const numero = Number(valor);
      return Number.isFinite(numero) && numero >= 0 && numero <= 100;
    },
  };
})();
