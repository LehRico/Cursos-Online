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

  /* Fotos reais por modalidade (assets/img/modalidades/<id>/*). Várias por
     modalidade — viram um carrossel no card do curso em vez de foto única. */
  const FOTOS = {
    ballet: ["ballet1.jpg", "ballet2.jpg", "ballet3.jpg", "ballet4.jpg", "ballet5.jpg"],
    "hip-hop": ["hiphop1.jpg", "hiphop2.jpg", "hiphop3.jpg", "hiphop4.jpg", "hiphop5.jpg"],
    contemporanea: ["contemporanea.jpg", "contemporanea1.jpg", "contemporanea3.jpg", "contemporanea4.jpg", "contemporanea5.jpg"],
    "dancas-urbanas": ["urbanas1.jpg", "urbanas2.jpg", "urbanas3.jpg", "urbanas4.jpg", "urbanas5.jpg"],
    "danca-de-salao": ["salao1.jpg", "salao2.jpg", "salao3.jpg", "salao4.jpg", "salao5.jpg"],
    jazz: ["jazzfunk1.jpg", "jazzfunk2.jpg", "jazzfunk3.jpg", "jazzfunk4.png", "jazzfunk5.png"],
    sapateado: ["sapateado.jpg", "sapateado2.jpg", "sapateado3.jpg", "sapateado4.jpg", "sapateado5.jpg"],
    "danca-do-ventre": ["ventre1.jpg", "ventre2.jpg", "ventre3.jpg", "ventre4.jpg", "ventre5.jpg"],
  };

  Danca.modalidades = {
    LISTA_FIXA: LISTA,
    corGel(id) {
      const item = LISTA.find((m) => m.id === id);
      return item ? `var(${item.corVar})` : "var(--gold)";
    },
    imagemCapa(id) {
      const fotos = FOTOS[id];
      return fotos ? `assets/img/modalidades/${id}/${fotos[0]}` : `assets/img/modalidades/${id}.jpg`;
    },
    fotosCurso(id) {
      const fotos = FOTOS[id] || [];
      return fotos.map((arquivo) => `assets/img/modalidades/${id}/${arquivo}`);
    },
  };
})();
