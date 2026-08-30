# Sutriva website

The marketing/documentation site for [Sutriva](../README.md), deployed at `sutriva.pratham.click` (not yet live). Static React + Vite site — no backend, no API keys required, no data collected.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build   # outputs to dist/
npm run preview # serve the production build locally
```

## Content accuracy

Every technical claim on this site (CLI commands, MCP tool names/schemas, evaluation results, architecture, limitations) is sourced from the actual Sutriva monorepo one directory up — see `docs/website-checklist.md` there for the mapping from each section to its source of truth. If Sutriva's behavior changes, this site's content needs a corresponding update; it is not generated from the source automatically.
