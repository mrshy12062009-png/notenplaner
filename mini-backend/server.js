import http from "http";
import { URL } from "url";

const PORT = Number.parseInt(process.env.PORT || "4177", 10);
const WIKTAPI_BASE = "https://api.wiktapi.dev/v1/de";

const OFFICIAL_EXAM_SOURCES = {
  BE: {
    label: "Berlin",
    url: "https://www.berlin-msa.de/termine",
    pdf: "https://www.berlin.de/sen/bildung/schule/pruefungen-und-abschluesse/pruefungsplan-2026.pdf",
    parser: "berlin"
  },
  BB: {
    label: "Brandenburg",
    url: "https://bildungsserver.berlin-brandenburg.de/unterricht/pruefungen/pruefungen-10/pruefungstermine",
    pdf: "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/unterricht/Pruefungen/Pruefungen_10/Pruefungstermine_MSA_BBR_eBBR_2026.pdf",
    parser: "berlin"
  }
};

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(body);
}

function parseBerlinHtml(html) {
  const rows = html.split("</tr>");
  const items = [];
  rows.forEach((row) => {
    const cells = row.split("</td>");
    if (cells.length < 2) return;
    const textCells = cells.map((cell) => cell.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()).filter(Boolean);
    if (textCells.length < 2) return;
    const dateMatch = textCells.join(" ").match(/(\d{2}\.\d{2}\.\d{4})/);
    const date = dateMatch ? dateMatch[1] : "";
    const subject = textCells[0] || "";
    if (!subject) return;
    items.push({
      track: /BBR/i.test(textCells.join(" ")) ? "BBR" : /eBBR/i.test(textCells.join(" ")) ? "eBBR" : "MSA",
      subject,
      date: date ? date.split(".").reverse().join("-") : "",
      kind: "exam",
      note: ""
    });
  });
  return items;
}

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    json(res, 400, { ok: false, error: "Missing URL" });
    return;
  }
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === "/api/ping") {
    json(res, 200, { ok: true });
    return;
  }

  if (url.pathname === "/api/duden") {
    const word = (url.searchParams.get("word") || "").trim();
    if (!word) {
      json(res, 400, { ok: false, error: "Missing word" });
      return;
    }
    try {
      const apiUrl = `${WIKTAPI_BASE}/word/${encodeURIComponent(word)}?lang=de`;
      const apiRes = await fetch(apiUrl, { cache: "no-store" });
      if (!apiRes.ok) {
        json(res, 502, { ok: false, error: "Lookup failed" });
        return;
      }
      const data = await apiRes.json();
      json(res, 200, data);
    } catch (error) {
      json(res, 500, { ok: false, error: "Server error" });
    }
    return;
  }

  if (url.pathname === "/api/official-exams") {
    const state = (url.searchParams.get("state") || "").toUpperCase();
    const source = OFFICIAL_EXAM_SOURCES[state];
    if (!source) {
      json(res, 404, { ok: false, error: "Unknown state" });
      return;
    }
    try {
      const apiRes = await fetch(source.url, { cache: "no-store" });
      if (!apiRes.ok) {
        json(res, 502, { ok: false, error: "Fetch failed" });
        return;
      }
      const html = await apiRes.text();
      const items = source.parser === "berlin" ? parseBerlinHtml(html) : [];
      json(res, 200, {
        ok: true,
        source: source.url,
        officialPdf: source.pdf || "",
        updatedAt: Date.now(),
        status: items.length ? "" : "Keine Termine erkannt. Parser erweitern.",
        items
      });
    } catch (error) {
      json(res, 500, { ok: false, error: "Server error" });
    }
    return;
  }

  json(res, 404, { ok: false, error: "Not found" });
});

server.listen(PORT, () => {
  console.log(`Mini-Backend läuft auf http://localhost:${PORT}`);
});
