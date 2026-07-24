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

## Rules

- Select Chef-lieu or Map mode for the whole game.
- Each normal correct answer earns 1 point.
- Each player gets one untimed bonus question per round worth 2 points.
- A wrong answer means one sip.
- A unique last-place player at the end of a round takes one extra sip; a tie means no extra penalty.
- Departments never repeat.

Geographic boundaries originate from [france-geojson](https://github.com/gregoiredavid/france-geojson). Department and chef-lieu metadata originate from the French government's [API Découpage administratif](https://geo.api.gouv.fr/decoupage-administratif).
