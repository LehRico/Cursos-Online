/* Perguntas frequentes do chatbot de suporte — respostas fixas, sem IA nem
   backend (ver Danca.ui.montarChatbot em js/componentes/chatbot.js). */
window.Danca = window.Danca || {};

(function () {
  Danca.faq = [
    {
      pergunta: "Como eu me matriculo em um curso?",
      resposta: "Entre com sua conta de aluno, abra o catálogo, escolha um curso publicado e clique em \"Matricular-se\" na página do curso.",
    },
    {
      pergunta: "Não tenho conta, como faço?",
      resposta: "Clique em \"Criar conta\" na tela de login. O cadastro cria uma conta de aluno — para virar professor ou administrador, fale com um administrador da plataforma.",
    },
    {
      pergunta: "Esqueci minha senha, e agora?",
      resposta: "Não há recuperação automática de senha neste projeto acadêmico. Peça a um administrador para redefinir sua senha pelo painel administrativo.",
    },
    {
      pergunta: "Como acompanho meu progresso no curso?",
      resposta: "Na página do curso, marque as aulas que você já concluiu — o progresso é calculado automaticamente a partir das aulas marcadas.",
    },
    {
      pergunta: "Quando posso avaliar um curso?",
      resposta: "Só depois de concluir todas as aulas dele (matrícula com status \"concluído\"). Aí um formulário de avaliação aparece na página do curso.",
    },
    {
      pergunta: "Qual a diferença entre aluno, professor e admin?",
      resposta: "Aluno se matricula e acompanha cursos. Professor cria e gerencia cursos, aulas e modalidades. Admin faz tudo isso e ainda gerencia os usuários da plataforma.",
    },
    {
      pergunta: "Como falo com o suporte?",
      resposta: "Você encontra o e-mail e o WhatsApp de contato no rodapé de qualquer página do site.",
    },
  ];
})();
