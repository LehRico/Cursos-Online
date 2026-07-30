/* Envio de e-mail de boas-vindas via EmailJS (conta do projeto) — usado só ao
   criar um usuário novo no painel administrativo, pra mandar as credenciais
   de acesso (login e senha) por e-mail. */
window.Danca = window.Danca || {};

(function () {
  const PUBLIC_KEY = "ZTPds7Rws72qN1uwf";
  const SERVICE_ID = "service_bi9l3aj";
  const TEMPLATE_ID = "template_pa4l1qs";

  let inicializado = false;
  function garantirInicializado() {
    if (inicializado || typeof emailjs === "undefined") return;
    emailjs.init({ publicKey: PUBLIC_KEY });
    inicializado = true;
  }

  /*
    Nomes de variável do template do EmailJS (dashboard.emailjs.com → Email
    Templates → template_pa4l1qs), confirmados no editor: {{to_name}},
    {{email}}, {{senha}}, {{link_login}}. "Nome da Escola" ficou como texto
    fixo no template (não é variável).
  */
  Danca.email = {
    /* Retorna true se enviou (ou pelo menos tentou com o SDK carregado),
       false se o SDK do EmailJS não carregou (ex: sem internet) — nesse
       caso quem chamou decide como avisar o admin. */
    async enviarBoasVindas({ nome, email, senha, role }) {
      if (typeof emailjs === "undefined") return false;
      garantirInicializado();

      await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
        to_name: nome,
        email,
        senha,
        papel: Danca.ui.rotuloRole(role),
        link_login: `${location.origin}${location.pathname.replace(/[^/]*$/, "")}login.html`,
      });
      return true;
    },
  };
})();
