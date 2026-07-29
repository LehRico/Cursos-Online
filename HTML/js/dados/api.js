/*
  Cliente HTTP para o json-server.
  Namespace global `Danca` é usado em todo o projeto (scripts clássicos,
  sem build/bundler) para evitar poluir o escopo com dezenas de globais soltos.
*/
window.Danca = window.Danca || {};

(function () {
  const URL_BASE = "http://localhost:3001";

  async function requisicao(caminho, opcoes = {}) {
    let resposta;
    try {
      resposta = await fetch(`${URL_BASE}${caminho}`, {
        headers: { "Content-Type": "application/json" },
        ...opcoes,
      });
    } catch (erro) {
      throw new Error(
        `Não foi possível falar com o servidor de dados. Confira se o json-server está rodando (npm run api) em ${URL_BASE}.`
      );
    }

    if (!resposta.ok) {
      throw new Error(`Erro ${resposta.status} ao acessar ${caminho}.`);
    }

    if (resposta.status === 204) return null;
    const texto = await resposta.text();
    return texto ? JSON.parse(texto) : null;
  }

  Danca.api = {
    listar(recurso, parametros = {}) {
      const busca = new URLSearchParams(parametros).toString();
      return requisicao(`/${recurso}${busca ? `?${busca}` : ""}`);
    },
    buscar(recurso, id) {
      return requisicao(`/${recurso}/${id}`);
    },
    criar(recurso, dados) {
      return requisicao(`/${recurso}`, { method: "POST", body: JSON.stringify(dados) });
    },
    atualizar(recurso, id, dados) {
      return requisicao(`/${recurso}/${id}`, { method: "PATCH", body: JSON.stringify(dados) });
    },
    remover(recurso, id) {
      return requisicao(`/${recurso}/${id}`, { method: "DELETE" });
    },
  };
})();
