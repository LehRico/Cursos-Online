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
        // Guarda a página que a pessoa queria abrir (path + query, ex:
        // "curso.html?id=c3") pra login.js poder mandar ela de volta pra lá
        // depois de entrar, em vez de sempre cair no catálogo.
        const destino = encodeURIComponent(window.location.pathname.split("/").pop() + window.location.search);
        window.location.href = `login.html?redirecionar=${destino}`;
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
