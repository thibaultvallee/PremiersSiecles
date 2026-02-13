async function loadJSON(path) {
  const response = await fetch(path);
  return response.json();
}

Promise.all([
  loadJSON("data/auteurs.json"),
  loadJSON("data/evenements.json")
]).then(([auteurs, evenements]) => {

  /* =========================
     MODAL (COMMUNE)
     ========================= */

  function openModal(type, data) {
    const body = document.getElementById("modal-body");

    body.innerHTML = `
      <h3>${data.nom}</h3>
      <p><strong>Type :</strong> ${type}</p>
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
  if (closeBtn) {
    closeBtn.onclick = () =>
      document.getElementById("modal").classList.add("hidden");
  }

  /* =========================
     FRise chronologique
     ========================= */

  if (document.getElementById("timeline")) {

    const groups = new vis.DataSet(
      auteurs.map(a => ({
        id: a.id,
        content: a.nom
      }))
    );

    const items = new vis.DataSet();

    // AUTEURS (intervalles)
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

    // ÉVÉNEMENTS (points)
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
      document.getElementById("timeline"),
      items,
      groups,
      {
        stack: false,
        orientation: "top",
        zoomMin: 1000 * 60 * 60 * 24 * 365 * 10,
        zoomMax: 1000 * 60 * 60 * 24 * 365 * 600
      }
    );

    timeline.on("select", e => {
      if (e.items.length > 0) {
        const id = e.items[0];
        const auteur = auteurs.find(a => a.id === id);
        const evenement = evenements.find(ev => ev.id === id);
        if (auteur) openModal("Auteur", auteur);
        if (evenement) openModal("Événement", evenement);
      }
    });
  }

  /* =========================
     TABLE AUTEURS
     ========================= */

  if (document.getElementById("table-auteurs")) {
    new Tabulator("#table-auteurs", {
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
          formatter: cell => cell.getValue().join(", ")
        },
        {
          title: "Œuvres",
          field: "oeuvres",
          formatter: cell => cell.getValue().join(", ")
        }
      ],
      rowClick: (e, row) => openModal("Auteur", row.getData())
    });
  }

  /* =========================
     TABLE EVENEMENTS
     ========================= */

  if (document.getElementById("table-evenements")) {
    new Tabulator("#table-evenements", {
      data: evenements,
      layout: "fitColumns",
      columns: [
        { title: "Nom", field: "nom" },
        { title: "Date", field: "date" },
        { title: "Ville", field: "ville" },
        { title: "Type", field: "type" },
        { title: "Résumé", field: "resume" }
      ],
      rowClick: (e, row) => openModal("Événement", row.getData())
    });
  }

});
