/* Prefixo numérico de 3 dígitos por role, embutido no começo da senha de
   toda conta — ex: senha "100a1b2c" é de um aluno, "200a1b2c" de um
   professor. Não é um mecanismo de segurança real (é só uma convenção
   simples pro projeto acadêmico); o objetivo é impedir que a senha de uma
   conta continue "válida" pra um role diferente do atual sem que isso
   fique visível/rastreável na própria senha. */
window.Danca = window.Danca || {};

(function () {
  const PREFIXO_POR_ROLE = { aluno: "100", professor: "200", admin: "300" };

  Danca.senhas = {
    PREFIXO_POR_ROLE,

    prefixo(role) {
      return PREFIXO_POR_ROLE[role] || "";
    },

    /* Monta a senha final a partir do que a pessoa digitou no campo (sem o
       prefixo) + o role da conta. Se o texto digitado já vier com o prefixo
       certo na frente (ex: reaproveitando uma senha existente), não duplica. */
    montar(role, textoDigitado) {
      const prefixo = Danca.senhas.prefixo(role);
      const texto = (textoDigitado || "").trim();
      return texto.startsWith(prefixo) ? texto : `${prefixo}${texto}`;
    },

    /* Tamanho mínimo do "resto" (sem contar o prefixo) pra bater com a regra
       do enunciado de senha mínima de 6 caracteres no total. */
    TAMANHO_MINIMO_RESTO: 3,
  };
})();
