# ImageNet XML → Tree Transformation

Transforms ImageNet XML structure into a linear tuple representation stored in SQLite then build a nested JSON tree for visualization in a Next.js/React application.

The application runs entirely inside Docker (both development and production modes).

---
## Overview

### Backend
1. Parse ImageNet XML file on start-up
2. Transform hierarchical `<synset>` structure into flat tuples:
   - `name`: full path (`parent > child > ...`)
   - `size`: number of descendant nodes
3. Store tuples in SQLite.
4. Expose API endpoint that:
   - Reads tuples linearly
   - Rebuilds nested JSON tree with O(1) complexity
   - Returns JSON for frontend visualization

### Frontend
- Fetch tree JSON from API
- Render visualization

---

### Technologies Used

- Next.js (App Router)
- TypeScript
- SQLite (better-sqlite3)
- fast-xml-parser
- Docker

## Usage

### Development

1. Build and start docker container's dev profile:

    `docker compose --profile dev up --build`

    App uses pnpm as a package manager. When build exits with error in build time, it can be due to SQLite build. This should help:

    `pnpm approve-builds --global`

2. On start the seed script is fetching XML to SQLite database.

3. API endpoint returns the JSON build from tuples in database, it's available on:
http://localhost:3000/api/tree

4. Frontend is running on http://localhost:3000/

### Production

Production settings depends on hosting. It may include 'prod' profile adjustment.

`docker compose --profile prod build --no-cache`
`docker compose --profile prod up -d`

https://finviz.danielhauser.com/


