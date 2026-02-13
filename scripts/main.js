
// helpers de dates (YYYY ou YYYY-MM-DD)
function parseDateMaybe(s) {
  if (!s) return null;
  if (/^\d{4}$/.test(s)) return new Date(Number(s), 0, 1);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [Y, M, D] = s.split("-").map(Number);
    return new Date(Y, M - 1, D);
  }
  return null; // format non géré
}

let AUTEURS = [];
let EVENEMENTS = [];
let authorsById = {};
let eventsById = {};

async function loadData() {
  const [a, e] = await Promise.all([
    fetch('data/auteurs.json').then(r => r.json()),
    fetch('data/evenements.json').then(r => r.json())
  ]);
  AUTEURS = a.auteurs || [];
  EVENEMENTS = e.evenements || [];
  authorsById = Object.fromEntries(AUTEURS.map(x => [x.id, x]));
  eventsById = Object.fromEntries(EVENEMENTS.map(x => [x.id, x]));
}

function renderTimeline() {
  const container = document.getElementById('timeline');

  const groups = new vis.DataSet([
    { id: 'auteurs', content: 'Auteurs' },
    { id: 'evenements', content: 'Événements' }
  ]);

  const items = [];
  for (const a of AUTEURS) {
    const start = parseDateMaybe(a.naissance);
    const end   = parseDateMaybe(a.mort) || (start ? new Date(start.getFullYear() + 1, 0, 1) : null);
    if (!start) continue; // exige au moins une date de naissance

    items.push({
      id: `author:${a.id}`,
      group: 'auteurs',
      type: end ? 'range' : 'point',
      start, end,
      content: a.nom,
      title: `${a.nom} (${a.langue})`,
      className: a.langue === 'latin' ? 'author-latin' : 'author-grec'
    });
  }
  for (const ev of EVENEMENTS) {
    const start = parseDateMaybe(ev.date_debut);
    const end   = parseDateMaybe(ev.date_fin);
    if (!start) continue;
    const t = ev.type || 'autre';

    items.push({
      id: `event:${ev.id}`,
      group: 'evenements',
      type: end ? 'range' : 'point',
      start, end,
      content: ev.nom,
      title: `${ev.nom} (${t})`,
      className: `event-${t}`
    });
  }

  const dataset = new vis.DataSet(items);
  const options = {
    stack: false,
    selectable: true,
    multiselect: false,
    zoomMin: 1000 * 60 * 60 * 24 * 365 * 10,  // 10 ans
    zoomMax: 1000 * 60 * 60 * 24 * 365 * 600, // 600 ans
    orientation: 'top',
    tooltip: { followMouse: true }
  };

  const timeline = new vis.Timeline(container, dataset, groups, options);

  function applyFilters() {
    const showG = document.getElementById('filtreGrec').checked;
    const showL = document.getElementById('filtreLatin').checked;
    const showC = document.getElementById('filtreConciles').checked;
    const showH = document.getElementById('filtreHeresies').checked;
    const showP = document.getElementById('filtrePol').checked;
    const showA = document.getElementById('filtreAutre').checked;

    dataset.get().forEach((it) => {
      if (String(it.id).startsWith('author:')) {
        const a = authorsById[it.id.split(':')[1]];
        const ok = (a.langue === 'grec' && showG) || (a.langue === 'latin' && showL);
        dataset.update({ id: it.id, hidden: !ok });
      } else {
        const ev = eventsById[it.id.split(':')[1]];
        const t = ev.type || 'autre';
        const ok = (t === 'concile' && showC) || (t === 'heresie' && showH) || (t === 'politique' && showP) || (t === 'autre' && showA);
        dataset.update({ id: it.id, hidden: !ok });
      }
    });
  }
  ['filtreGrec','filtreLatin','filtreConciles','filtreHeresies','filtrePol','filtreAutre'].forEach(id =>
    document.getElementById(id).addEventListener('change', applyFilters)
  );
  applyFilters();

  // Clic -> fiche
  timeline.on('itemclick', (props) => {
    const id = props.item;
    if (!id) return;
    if (String(id).startsWith('author:')) {
      const a = authorsById[id.split(':')[1]];
      openFicheAuteur(a);
    } else {
      const ev = eventsById[id.split(':')[1]];
      openFicheEvenement(ev);
    }
  });
}

function renderTables() {
  // Auteurs
  const tbodyA = document.querySelector('#tableAuteurs tbody');
  tbodyA.innerHTML = '';
  AUTEURS.forEach(a => {
    const tr = document.createElement('tr');
    tr.dataset.id = a.id;
    tr.innerHTML = `
      <td style="cursor:pointer">${a.nom}</td>
      <td>${a.naissance || ''}</td>
      <td>${a.mort || ''}</td>
      <td><span class="badge ${a.langue==='latin'?'text-bg-warning':'text-bg-primary'}">${a.langue}</span></td>
      <td>${(a.villes||[]).join(', ')}</td>
      <td>${(a.oeuvres||[]).join(', ')}</td>
    `;
    tr.addEventListener('click', () => openFicheAuteur(a));
    tbodyA.appendChild(tr);
  });

  // Evenements
  const tbodyE = document.querySelector('#tableEvenements tbody');
  tbodyE.innerHTML = '';
  EVENEMENTS.forEach(ev => {
    const tr = document.createElement('tr');
    tr.dataset.id = ev.id;
    tr.innerHTML = `
      <td style="cursor:pointer">${ev.nom}</td>
      <td>${ev.type || ''}</td>
      <td>${ev.date_debut || ''}</td>
      <td>${ev.date_fin || ''}</td>
      <td>${ev.ville || ''}</td>
      <td>${ev.resume || ''}</td>
    `;
    tr.addEventListener('click', () => openFicheEvenement(ev));
    tbodyE.appendChild(tr);
  });

  const frUrl = 'https://cdn.datatables.net/plug-ins/1.13.6/i18n/fr-FR.json';
  new DataTable('#tableAuteurs', { language: { url: frUrl }});
  new DataTable('#tableEvenements', { language: { url: frUrl }});
}

function openFicheAuteur(a) {
  const title = document.getElementById('ficheTitle');
  const body = document.getElementById('ficheBody');
  title.textContent = a.nom;
  const villes = (a.villes||[]).join(', ');
  const oeuvres = (a.oeuvres||[]).map(o => `<li>${o}</li>`).join('');
  const sources = (a.sources||[]).map(s => `<li><a href="${s.url}" target="_blank" rel="noopener">${s.label}</a></li>`).join('');

  // événements liés
  const relatedEvents = EVENEMENTS.filter(ev => (ev.auteurs_associes||[]).includes(a.id));
  const rel = relatedEvents.map(ev => `<li><a href="#" onclick="openFicheEvenementById('${ev.id}');return false;">${ev.nom}</a></li>`).join('');

  body.innerHTML = `
    <div class="mb-2"><strong>Langue :</strong> ${a.langue}</div>
    <div class="mb-2"><strong>Dates :</strong> ${a.naissance || '?'} – ${a.mort || '?'}</div>
    <div class="mb-2"><strong>Villes principales :</strong> ${villes || '—'}</div>
    <div class="mb-2"><strong>Œuvres principales :</strong><ul>${oeuvres || ''}</ul></div>
    ${rel ? `<div class="mb-2"><strong>Événements liés :</strong><ul>${rel}</ul></div>` : ''}
    <hr/>
    <p>${a.resume || ''}</p>
    <div class="mt-3"><strong>Sources / Pour aller plus loin :</strong><ul>${sources}</ul></div>
  `;
  const modal = new bootstrap.Modal(document.getElementById('ficheModal'));
  modal.show();
}

function openFicheEvenementById(id) {
  const ev = eventsById[id];
  if (ev) openFicheEvenement(ev);
}

function openFicheEvenement(ev) {
  const title = document.getElementById('ficheTitle');
  const body = document.getElementById('ficheBody');
  title.textContent = ev.nom;
  const sources = (ev.sources||[]).map(s => `<li><a href="${s.url}" target="_blank" rel="noopener">${s.label}</a></li>`).join('');
  const assoc = (ev.auteurs_associes||[]).map(id => authorsById[id]?.nom || id).filter(Boolean).map(n => `<li>${n}</li>`).join('');
  body.innerHTML = `
    <div class="mb-2"><strong>Type :</strong> ${ev.type || '—'}</div>
    <div class="mb-2"><strong>Dates :</strong> ${ev.date_debut || '?'} ${ev.date_fin ? '– '+ev.date_fin : ''}</div>
    <div class="mb-2"><strong>Ville :</strong> ${ev.ville || '—'}</div>
    ${assoc ? `<div class="mb-2"><strong>Auteurs concernés :</strong><ul>${assoc}</ul></div>` : ''}
    <hr/>
    <p>${ev.resume || ''}</p>
    <div class="mt-3"><strong>Sources / Pour aller plus loin :</strong><ul>${sources}</ul></div>
  `;
  const modal = new bootstrap.Modal(document.getElementById('ficheModal'));
  modal.show();
}

(async function init() {
  await loadData();
  renderTimeline();
  renderTables();
})();
