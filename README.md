
# Écrivains religieux (Ier–Ve siècles) — Frise, tableaux, fiches

Site statique (HTML/CSS/JS) qui charge des données JSON (auteurs + événements) et propose :
- une **frise chronologique** (vis-timeline),
- deux **tableaux** filtrables (DataTables),
- des **fiches** détaillées ouvrables au clic,
- une **édition** simple via **Decap (Netlify) CMS**.

## Démarrer en local
Ouvrez simplement `index.html` dans votre navigateur (double-clic). Pour éviter des soucis de CORS, vous pouvez aussi servir le dossier via un mini-serveur, par ex. :

```bash
python3 -m http.server 8080
```

puis ouvrez http://localhost:8080

## Déploiement rapide
### Option A — GitHub Pages
1. Créez un dépôt et poussez ce dossier.
2. Dans *Settings → Pages*, sélectionnez la branche `main` et le répertoire `/root` (ou `/docs` si vous préférez).
3. L’URL publique sera `https://<votre-user>.github.io/<repo>/`.

### Option B — Netlify (recommandé pour le CMS)
1. Poussez ce dossier sur GitHub/GitLab/Bitbucket.
2. Sur https://app.netlify.com/ → *New site from Git* → connectez votre dépôt.
3. Déploiement auto (build command vide, *publish directory* = `/`).
4. Activez **Identity** (onglet *Identity* → *Enable Identity*) et **Git Gateway** (*Identity → Services → Enable Git Gateway*).
5. Ajoutez votre e-mail comme utilisateur (*Invite users*).
6. Accédez à `/admin/` sur votre site pour éditer les **Auteurs** et **Événements**.

## Structure des données (JSON)
- `data/auteurs.json` : objet JSON avec une clé `auteurs` contenant une **liste d’auteurs**.
- `data/evenements.json` : objet JSON avec une clé `evenements` contenant une **liste d’événements**.

Chaque auteur/événement possède un champ `id` (unique), et vous pouvez renseigner `sources` (liste de `{label, url}`). Les champs de date acceptent `YYYY` ou `YYYY-MM-DD`.

## Personnalisation
- **Filtres** : ajoutez des cases dans `index.html` et adaptez `applyFilters()` dans `scripts/main.js`.
- **Champs supplémentaires** : ajoutez-les dans les `JSON` et rendez-les visibles dans `openFicheAuteur()` / `openFicheEvenement()`.
- **Export CSV** : ajoutez le plugin *Buttons* de DataTables si besoin.

## Licence
Libre utilisation pour vos travaux académiques. Ajoutez vos mentions et remerciements à votre convenance.
