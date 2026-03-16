# Backend (lokal)

Dieses Backend läuft lokal und dient als Proxy für Online-Wörterbuch und offizielle Prüfungstermine.

## Start

```bash
cd mini-backend
npm install
npm start
```

Standard-Port: `4177`.

## Endpunkte

- `GET /api/ping`
- `GET /api/duden?word=...`
- `GET /api/official-exams?state=BE`
