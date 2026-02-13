async function loadJSON(path) {
  const response = await fetch(path);
  return response.json();
}

Promise.all([
  loadJSON("data/auteurs.json"),
  loadJSON("data/evenements.json")
]).then(([auteurs, evenements]) => {

  // === TIMELINE ===
  const groups = auteurs.map(a => ({
    id: a.id,
    content: a.nom
  }));

  const items = auteurs.map(a => ({
    id: a.id,
    group: a.id,
    content: a.nom,
    start: a.naissance.replace("ca. ", ""),
    end: a.mort.replace("ca. ", ""),
    className: a.langue === "grec" ? "auteur-grec" : "auteur-latin"
  }));

  const timeline = new vis.Timeline(
    document.getElementById("timeline"),
    items,
    groups
  );

  timeline.on("select", e => openModal("auteur", e.items[0]));

  // === TABLE AUTEURS ===
  new Tabulator("#table-auteurs", {
    data: auteurs,
    layout: "fitColumns",
    columns: [
      {title:"Nom", field:"nom"},
      {title:"Naissance", field:"naissance"},
      {title:"Mort", field:"mort"},
      {title:"Langue", field:"langue"},
      {title:"Villes", field:"villes", formatter:cell => cell.getValue().join(", ")},
      {title:"Œuvres", field:"oeuvres", formatter:cell => cell.getValue().join(", ")}
    ],
    rowClick:(e,row)=>openModal("auteur", row.getData().id)
  });

  // === TABLE EVENEMENTS ===
  new Tabulator("#table-evenements", {
    data: evenements,
    layout: "fitColumns",
    columns: [
      {title:"Nom", field:"nom"},
      {title:"Date", field:"date"},
      {title:"Ville", field:"ville"},
      {title:"Type", field:"type"},
      {title:"Résumé", field:"resume"}
    ],
    rowClick:(e,row)=>openModal("evenement", row.getData().id)
  });

  // === MODAL ===
  function openModal(type, id) {
    const data = type === "auteur"
      ? auteurs.find(a => a.id === id)
      : evenements.find(e => e.id === id);

    document.getElementById("modal-body").innerHTML =
      `<h3>${data.nom}</h3><pre>${JSON.stringify(data, null, 2)}</pre>`;

    document.getElementById("modal").classList.remove("hidden");
  }

  document.getElementById("close-modal").onclick = () =>
    document.getElementById("modal").classList.add("hidden");
});
