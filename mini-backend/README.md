# Mini-Backend (optional)

Dieses Mini-Backend ist optional. Es stellt zwei Endpunkte bereit:

- `GET /api/duden?word=...` – Proxy für das Online-Wörterbuch (Wiktionary via Wiktapi).
- `GET /api/official-exams?state=BE` – Offizielle Prüfungstermine (aktuell BE/BB mit Parser).

## Start

```bash
cd mini-backend
npm start
```

Standard-Port: `4177`.
