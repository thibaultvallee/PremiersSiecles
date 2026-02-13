async function loadJSON(path) {
  const response = await fetch(path);
  if (!response.ok) {
    console.error("Erreur chargement :", path);
    return [];
  }
  return response.json();
}

document.addEventListener("DOMContentLoaded", async () => {

  const timelineEl = document.getElementById("timeline");
  const auteursTableEl = document.getElementById("table-auteurs");
  const evenementsTableEl = document.getElementById("table-evenements");

  /* =========================
     CHARGEMENT DES DONNÉES
     ========================= */

  const auteurs = await loadJSON("data/auteurs.json");
  let evenements = [];

  if (timelineEl || evenementsTableEl) {
    evenements = await loadJSON("data/evenements.json");
  }

  /* =========================
     MODALE (COMMUNE)
     ========================= */

  function openModal(data) {
    const modal = document.getElementById("modal");
    const body = document.getElementById("modal-body");

    body.innerHTML = `
      <h3>${data.nom}</h3>
      ${data.naissance ? `<p><strong>Naissance :</strong> ${data.naissance}</p>` : ""}
      ${data.mort ? `<p><strong>Mort :</strong> ${data.mort}</p>` : ""}
      ${data.langue ? `<p><strong>Langue :</strong> ${data.langue}</p>` : ""}
      ${data.villes ? `<p><strong>Villes :</strong> ${data.villes.join(", ")}</p>` : ""}
      ${data.oeuvres ? `<p><strong>Œuvres :</strong> ${data.oeuvres.join(", ")}</p>` : ""}
      ${data.resume ? `<p>${data.resume}</p>` : ""}
    `;

    modal.classList.remove("hidden");
  }

  const closeBtn = document.getElementById("close-modal");
  if (closeBtn) {
    closeBtn.onclick = () =>
      document.getElementById("modal").classList.add("hidden");
  }

  /* =========================
     FRISE CHRONOLOGIQUE
     ========================= */

  if (timelineEl && typeof vis !== "undefined") {

    const groups = new vis.DataSet(
      auteurs.map(a => ({ id: a.id, content: a.nom }))
    );

    const items = new vis.DataSet();

    auteurs.forEach(a => {
      const start = parseInt(a.naissance?.replace(/\D/g, ""));
      const end = parseInt(a.mort?.replace(/\D/g, ""));
      if (!isNaN(start) && !isNaN(end)) {
        items.add({
          id: a.id,
          group: a.id,
          content: a.nom,
          start: `${start}-01-01`,
          end: `${end}-01-01`,
          type: "range"
        });
      }
    });

    evenements.forEach(e => {
      const year = parseInt(e.date?.replace(/\D/g, ""));
      if (!isNaN(year)) {
        items.add({
          id: e.id,
          content: e.nom,
          start: `${year}-01-01`,
          type: "point"
        });
      }
    });

    const timeline = new vis.Timeline(timelineEl, items, groups, {
      stack: false
    });

    timeline.on("select", e => {
      const id = e.items[0];
      const auteur = auteurs.find(a => a.id === id);
      const evenement = evenements.find(ev => ev.id === id);
      if (auteur) openModal(auteur);
      if (evenement) openModal(evenement);
    });
  }

  /* =========================
     TABLE AUTEURS
     ========================= */

  if (auteursTableEl && typeof Tabulator !== "undefined") {
    new Tabulator(auteursTableEl, {
      data: auteurs,
      layout: "fitColumns",
      columns: [
        { title: "Nom", field: "nom" },
        { title: "Naissance", field: "naissance" },
        { title: "Mort", field: "mort" },
        { title: "Langue", field: "langue" },
        {
          title: "Villes",
          field: "villes",
          formatter: c => c.getValue()?.join(", ")
        },
        {
          title: "Œuvres",
          field: "oeuvres",
          formatter: c => c.getValue()?.join(", ")
        }
      ],
      rowClick: (e, row) => openModal(row.getData())
    });
  }

  /* =========================
     TABLE EVENEMENTS
     ========================= */

  if (evenementsTableEl && typeof Tabulator !== "undefined") {
    new Tabulator(evenementsTableEl, {
      data: evenements,
      layout: "fitColumns",
      columns: [
        { title: "Nom", field: "nom" },
        { title: "Date", field: "date" },
        { title: "Ville", field: "ville" },
        { title: "Type", field: "type" },
        { title: "Résumé", field: "resume" }
      ],
      rowClick: (e, row) => openModal(row.getData())
    });
  }

});
