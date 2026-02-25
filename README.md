# ImageNet XML → Tree Transformation

Transforms ImageNet XML structure into a linear tuple representation stored in SQLite then build a nested JSON tree for visualization in a Next.js/React application.

The application runs entirely inside Docker (both development and production modes).

---

### Backend
1. Parse ImageNet XML file on start-up
2. Transform hierarchical `<synset>` structure into flat tuples:
   - `name`: full path (`parent > child > ...`)
   - `size`: number of descendant nodes
3. Store tuples in SQLite.
4. Expose API endpoint that:
   - Reads tuples linearly
   - Rebuilds nested JSON tree
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
