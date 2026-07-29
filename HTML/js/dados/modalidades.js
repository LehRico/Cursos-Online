/* Metadados fixos das 8 modalidades — nome de exibição e a cor-gel de cada uma. */
window.Danca = window.Danca || {};

(function () {
  const LISTA = [
    { id: "ballet", nome: "Ballet", corVar: "--gel-ballet" },
    { id: "hip-hop", nome: "Hip Hop", corVar: "--gel-hip-hop" },
    { id: "contemporanea", nome: "Contemporânea", corVar: "--gel-contemporanea" },
    { id: "dancas-urbanas", nome: "Danças Urbanas", corVar: "--gel-dancas-urbanas" },
    { id: "danca-de-salao", nome: "Dança de Salão", corVar: "--gel-danca-de-salao" },
    { id: "jazz", nome: "Jazz", corVar: "--gel-jazz" },
    { id: "sapateado", nome: "Sapateado", corVar: "--gel-sapateado" },
    { id: "danca-do-ventre", nome: "Dança do Ventre", corVar: "--gel-danca-do-ventre" },
  ];

  Danca.modalidades = {
    LISTA_FIXA: LISTA,
    corGel(id) {
      const item = LISTA.find((m) => m.id === id);
      return item ? `var(${item.corVar})` : "var(--gold)";
    },
    imagemCapa(id) {
      return `assets/img/modalidades/${id}.jpg`;
    },
  };
})();
