# Cocaine Anonymous Meeting Finder

A lightweight, embeddable meeting finder that lets people search for Cocaine
Anonymous (C.A.) meetings anywhere, anytime. Drop two lines of HTML onto any
website and visitors get a searchable, filterable list of meetings — sorted by
what's happening next and, optionally, by what's nearest to them.

## ✨ Features

- **Search by location** — type an address or use the visitor's current location.
- **"Near me" filtering** — shows meetings within 100 km of the visitor.
- **Smart sorting** — upcoming meetings float to the top on a rolling schedule.
- **Filter by meeting type** — open, closed, online, and more.
- **Self-contained** — ships as a single JavaScript file with styles baked in,
  so it won't clash with your site's CSS.
- **No build step required** — paste the snippet and you're done.

## 🚀 Embed it on your site

Add a container element where you want the finder to appear, then load the
script:

```html
<div id="camf"></div>
<script src="https://cawscit.github.io/ca-meeting-finder/meeting-finder.js"></script>
```

That's it. The finder mounts into the `<div id="camf">` element and styles
itself in isolation, so it won't affect the rest of your page.

> **Note:** The container's `id` **must** be `camf`.

### Configuration options

Customize the finder with `data-` attributes on the container element. All are
optional.

| Attribute       | Description                                                        | Default                                                        |
| --------------- | ----------------------------------------------------------------- | -------------------------------------------------------------- |
| `data-url`      | The meetings API endpoint (TSML format).                          | `https://caws-api.azurewebsites.net/api/v1/meetings-tsml`      |
| `data-maps-api` | A Mapbox API key to enable map-based features. Omit to disable.   | _none_                                                         |

Example with options:

```html
<div
  id="camf"
  data-url="https://your-api.example.com/api/v1/meetings-tsml"
  data-maps-api="pk.your_mapbox_key"
></div>
<script src="https://cawscit.github.io/ca-meeting-finder/meeting-finder.js"></script>
```

## 🛠️ Local development

The finder is built with Vite, React, TypeScript, Tailwind CSS, and shadcn/ui.
You only need Node.js and npm installed.

```sh
# Install dependencies
npm install

# Start the dev server (http://localhost:8080)
npm run dev
```

### Useful scripts

| Command               | What it does                                              |
| --------------------- | -------------------------------------------------------- |
| `npm run dev`         | Start the local dev server with hot reload.              |
| `npm run build`       | Build the standalone web app into `dist/`.               |
| `npm run build:embed` | Build the embeddable single-file bundle into `dist/embed/`. |
| `npm run lint`        | Run ESLint over the project.                             |

## 📦 Deployment

Every push to `main` triggers the workflow in
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which builds
both the standalone web app and the embeddable bundle, then publishes them to
the `gh-pages` branch. GitHub Pages serves that branch at:

- **Standalone app:** <https://cawscit.github.io/ca-meeting-finder/>
- **Embed bundle:** <https://cawscit.github.io/ca-meeting-finder/meeting-finder.js>

To build locally, run `npm run build` (standalone app → `dist/`) and/or
`npm run build:embed` (embed bundle → `dist/embed/`), then serve the output.
