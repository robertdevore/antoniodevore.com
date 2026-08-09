# AntonioDeVore.com

Antonio DeVore’s static site, built with the Kujo SSG and a vendored SiteKit distribution.

## Add content

Create a Markdown file in the collection that matches the work:

- `content/games/` for playable games and build notes
- `content/images/` for image series and galleries
- `content/writing/` for essays and shorter notes

Start each file with frontmatter like this:

```md
---
title: Project title
description: A short search and sharing description.
author: Antonio DeVore
date: 2026-08-09
template: game
order: 2
excerpt: The sentence shown on the collection card.
tags: [example, project]
---

Write the content here.
```

Use `template: game`, `template: image`, or `template: writing` to match the collection. Set `draft: true` while a piece is not ready for the public build.

## Build and preview

```bash
npm run build
npm run dev
```

Generated files go to `docs/`. Do not edit them directly. GitHub Pages should publish from the `docs/` directory on the `main` branch.

The build also writes `docs/CNAME` and `docs/.nojekyll` so the custom domain and static assets work when GitHub Pages publishes the directory.

## Design system

SiteKit is vendored at `assets/sitekit/`. Antonio’s theme lives in `assets/css/style.css` and overrides SiteKit semantic tokens while preserving its component and accessibility contracts.
