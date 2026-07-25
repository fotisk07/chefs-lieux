# Chefs-Lieux

A local multiplayer geography drinking game about metropolitan France's 96 departments and their chefs-lieux.

## Play

Open [`dist/index.html`](dist/index.html) in a modern browser. It is a self-contained file and does not need a server or internet connection.

Every drinking penalty means one sip; non-alcoholic drinks work just as well.

## Development

```bash
npm install
npm run dev
```

Create the portable build with:

```bash
npm run build
```

The resulting `dist/index.html` contains the code, styles, map, and department data.

## GitHub Pages

The workflow in `.github/workflows/deploy-pages.yml` builds and publishes the game whenever the `main` branch is pushed.

After pushing the repository to GitHub:

1. Open **Settings → Pages**.
2. Under **Build and deployment**, select **GitHub Actions** as the source.
3. Push to `main`, or manually run **Deploy to GitHub Pages** from the Actions tab.

The deployment URL is shown in the completed workflow and on the repository's Pages settings screen.

## Rules

- Select Chef-lieu or Map mode for the whole game.
- In Chef-lieu mode, each normal correct answer earns 1 point.
- In Map mode, every guess earns up to 100 points based on distance: 1 point is lost per 10 km, down to zero at 1,000 km.
- Each player gets one untimed bonus question per round worth double points.
- An incorrect answer still means one sip, even when a nearby map guess earns partial points.
- A unique last-place player at the end of a round takes one extra sip; a tie means no extra penalty.
- Departments never repeat.

Geographic boundaries originate from [france-geojson](https://github.com/gregoiredavid/france-geojson). Department and chef-lieu metadata originate from the French government's [API Découpage administratif](https://geo.api.gouv.fr/decoupage-administratif).
