async function loadJSON(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Erreur chargement ${path}`);
  return response.json();
}

(async function () {

  const hasTimeline = document.getElementById("timeline");
  const hasAuteurs = document.getElementById("table-auteurs");
  const hasEvenements = document.getElementById("table-evenements");

  // AUTEURS : toujours nécessaires
  const auteurs = await loadJSON("data/auteurs.json");

  // EVENEMENTS : seulement si utiles
  let evenements = [];
  if (hasTimeline || hasEvenements) {
    evenements = await loadJSON("data/evenements.json");
  }

  /* =========================
     MODAL
     ========================= */

  function openModal(type, data) {
    document.getElementById("modal-body").innerHTML = `
      <h3>${data.nom}</h3>
      ${data.naissance ? `<p><strong>Naissance :</strong> ${data.naissance}</p>` : ""}
      ${data.mort ? `<p><strong>Mort :</strong> ${data.mort}</p>` : ""}
      ${data.langue ? `<p><strong>Langue :</strong> ${data.langue}</p>` : ""}
      ${data.villes ? `<p><strong>Villes :</strong> ${data.villes.join(", ")}</p>` : ""}
      ${data.oeuvres ? `<p><strong>Œuvres :</strong> ${data.oeuvres.join(", ")}</p>` : ""}
      ${data.resume ? `<p>${data.resume}</p>` : ""}
    `;
    document.getElementById("modal").classList.remove("hidden");
  }

  const closeBtn = document.getElementById("close-modal");
  if (closeBtn) closeBtn.onclick = () =>
    document.getElementById("modal").classList.add("hidden");

  /* =========================
     FRise
     ========================= */

  if (hasTimeline) {

    const groups = new vis.DataSet(
      auteurs.map(a => ({ id: a.id, content: a.nom }))
    );

    const items = new vis.DataSet();

    auteurs.forEach(a => {
      const start = parseInt(a.naissance.replace(/\D/g, ""));
      const end = parseInt(a.mort.replace(/\D/g, ""));
      if (!isNaN(start) && !isNaN(end)) {
        items.add({
          id: a.id,
          group: a.id,
          content: a.nom,
          start: `${start}-01-01`,
          end: `${end}-01-01`,
          type: "range",
          className: a.langue === "grec" ? "auteur-grec" : "auteur-latin"
        });
      }
    });

    evenements.forEach(e => {
      const year = parseInt(e.date.replace(/\D/g, ""));
      if (!isNaN(year)) {
        items.add({
          id: e.id,
          content: e.nom,
          start: `${year}-01-01`,
          type: "point"
        });
      }
    });

    const timeline = new vis.Timeline(
      hasTimeline,
      items,
      groups,
      { stack: false }
    );

    timeline.on("select", e => {
      const id = e.items[0];
      const auteur = auteurs.find(a => a.id === id);
      const evenement = evenements.find(ev => ev.id === id);
      if (auteur) openModal("Auteur", auteur);
      if (evenement) openModal("Événement", evenement);
    });
  }

  /* =========================
     TABLE AUTEURS
     ========================= */

  if (hasAuteurs) {
    new Tabulator("#table-auteurs", {
      data: auteurs,
      layout: "fitColumns",
      columns: [
        { title: "Nom", field: "nom" },
        { title: "Naissance", field: "naissance" },
        { title: "Mort", field: "mort" },
        { title: "Langue", field: "langue" },
        { title: "Villes", field: "villes", formatter: c => c.getValue().join(", ") },
        { title: "Œuvres", field: "oeuvres", formatter: c => c.getValue().join(", ") }
      ],
      rowClick: (e, row) => openModal("Auteur", row.getData())
