async function loadJSON(path) {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(path);
    return await response.json();
  } catch (e) {
    console.error("Erreur chargement :", path);
    return [];
  }
}

function extractYear(value) {
  if (!value) return null;
  const match = value.match(/\d{2,4}/);
  return match ? parseInt(match[0]) : null;
}

document.addEventListener("DOMContentLoaded", async () => {

  const timelineEl = document.getElementById("timeline");
  const auteursTableEl = document.getElementById("table-auteurs");
  const evenementsTableEl = document.getElementById("table-evenements");

  const auteurs = await loadJSON("./data/auteurs.json");
  let evenements = [];

  if (timelineEl || evenementsTableEl) {
    evenements = await loadJSON("./data/evenements.json");
  }

  /* =========================
     MODALE
     ========================= */

  function openModal(data) {
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

  document.getElementById("close-modal")?.addEventListener("click", () =>
    document.getElementById("modal").classList.add("hidden")
  );

  /* =========================
     FRISE CHRONOLOGIQUE
     ========================= */

  if (timelineEl && typeof vis !== "undefined") {

    // GROUPES : IDs distincts
    const groups = new vis.DataSet(
      auteurs.map(a => ({
        id: `group-${a.id}`,
        content: a.nom
      }))
    );

    const items = new vis.DataSet();

    // AUTEURS
    auteurs.forEach(a => {
      const start = extractYear(a.naissance) ?? extractYear(a.actif_debut);
      const end = extractYear(a.mort) ?? extractYear(a.actif_fin);

      if (start && end) {
        items.add({
          id: a.id,
          group: `group-${a.id}`,
          content: a.nom,
          start: `${start}-01-01`,
          end: `${end}-01-01`,
          type: "range"
        });
      }
    });

    // ÉVÉNEMENTS
    evenements.forEach(e => {
      const year = extractYear(e.date);
      if (year) {
        items.add({
          id: e.id,
          content: e.nom,
          start: `${year}-01-01`,
          type: "point"
        });
      }
    });

    const minDate = new Date(0);
    minDate.setFullYear(0, 0, 1);

    const maxDate = new Date(0);
    maxDate.setFullYear(700, 11, 31);

    const timeline = new vis.Timeline(timelineEl, items, groups, {
      stack: false,
      min: minDate,
      max: maxDate,
      start: minDate,
      end: maxDate,
      format: {
        minorLabels: {
          year: d => new Date(d).getFullYear().toString()
        },
        majorLabels: {
          year: d => new Date(d).getFullYear().toString()
        }
      }
    });

    timeline.on("select", e => {
      const id = e.items[0];
      openModal(
        auteurs.find(a => a.id === id) ||
        evenements.find(ev => ev.id === id)
      );
    });
  }

  /* =========================
     TABLES
     ========================= */

  if (auteursTableEl && typeof Tabulator !== "undefined") {
    new Tabulator(auteursTableEl, {
      data: auteurs,
      layout: "fitColumns",
      columns: [
        { title: "Nom", field: "nom" },
        { title: "Naissance", field: "naissance" },
        { title: "Mort", field: "mort" },
        { title: "Langue", field: "langue" }
      ],
      rowClick: (e, row) => openModal(row.getData())
    });
  }

  if (evenementsTableEl && typeof Tabulator !== "undefined") {
    new Tabulator(evenementsTableEl, {
      data: evenements,
      layout: "fitColumns",
      columns: [
        { title: "Nom", field: "nom" },
        { title: "Date", field: "date" },
        { title: "Ville", field: "ville" }
      ],
      rowClick: (e, row) => openModal(row.getData())
    });
  }

});
