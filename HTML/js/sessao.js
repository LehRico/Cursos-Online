/* Login simulado: guarda o usuário "logado" no localStorage do navegador. */
window.Danca = window.Danca || {};

(function () {
  const CHAVE = "danca:sessao";

  Danca.sessao = {
    obter() {
      const bruto = localStorage.getItem(CHAVE);
      if (!bruto) return null;
      try {
        return JSON.parse(bruto);
      } catch {
        return null;
      }
    },

    definir(usuario) {
      const { senha, ...usuarioSemSenha } = usuario;
      localStorage.setItem(CHAVE, JSON.stringify(usuarioSemSenha));
    },

    encerrar() {
      localStorage.removeItem(CHAVE);
    },

    /** Redireciona para fora da página se não houver sessão, ou se o role não estiver na lista permitida. */
    exigir(rolesPermitidas) {
      const usuario = this.obter();
      if (!usuario) {
        window.location.href = "login.html";
        return null;
      }
      if (rolesPermitidas && !rolesPermitidas.includes(usuario.role)) {
        window.location.href = "index.html";
        return null;
      }
      return usuario;
    },
  };
})();
