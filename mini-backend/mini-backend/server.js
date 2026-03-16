import express from "express";
import cors from "cors";

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
  },
  BW: { label: "Baden-Württemberg", url: "https://km.baden-wuerttemberg.de/de/schule/realschule/pruefungstermine-", pdf: "", parser: "none" },
  BY: { label: "Bayern", url: "https://www.isb.bayern.de/schularten/realschule/termine/", pdf: "", parser: "none" },
  HB: { label: "Bremen", url: "https://www.bildung.bremen.de/sixcms/media.php/13/11008-Anlage%2090-2025.pdf", pdf: "https://www.bildung.bremen.de/sixcms/media.php/13/11008-Anlage%2090-2025.pdf", parser: "none" },
  HH: { label: "Hamburg", url: "https://www.hamburg.de/politik-und-verwaltung/behoerden/bsfb/themen/zentrale-pruefungen/msa-2026-935302", pdf: "", parser: "none" },
  HE: { label: "Hessen", url: "https://kultus.hessen.de/schulsystem/schulformen-und-bildungsgaenge/hauptschule/hauptschulabschluss/termine-pruefungsabfolge-zaa", pdf: "", parser: "none" },
  MV: { label: "Mecklenburg-Vorpommern", url: "https://www.bildung-mv.de/schule/abschlusspruefungen/index.html", pdf: "", parser: "none" },
  NI: { label: "Niedersachsen", url: "https://www.mk.niedersachsen.de/download/89182/Abschlusspruefungen_2016.pdf", pdf: "https://www.mk.niedersachsen.de/download/89182/Abschlusspruefungen_2016.pdf", parser: "none" },
  NW: { label: "Nordrhein-Westfalen", url: "https://www.standardsicherung.schulministerium.nrw.de/zentrale-pruefungen-am-ende-der-klasse-10-zp10/termine", pdf: "", parser: "none" },
  RP: { label: "Rheinland-Pfalz", url: "https://bildung.rlp.de/", pdf: "", parser: "none" },
  SH: { label: "Schleswig-Holstein", url: "https://www.schleswig-holstein.de/DE/fachinhalte/Z/zentrale_abschluesse/Durchfuehrungsbestimmungen_ESA_MSA", pdf: "", parser: "none" },
  SL: { label: "Saarland", url: "https://www.saarland.de/mbk/DE/portal/schule/", pdf: "", parser: "none" },
  SN: { label: "Sachsen", url: "https://www.schule.sachsen.de/schuljahrestermine-4793.html", pdf: "https://www.revosax.sachsen.de/vorschrift_gesamt/21219/48854.pdf", parser: "none" },
  ST: { label: "Sachsen-Anhalt", url: "https://mb.sachsen-anhalt.de/themen/schule", pdf: "", parser: "none" },
  TH: { label: "Thüringen", url: "https://www.schulportal-thueringen.de/services/resources/download/public/2280298/VVOrgS2526-Anlage_6-1_ABLAUF.pdf", pdf: "https://www.schulportal-thueringen.de/services/resources/download/public/2280298/VVOrgS2526-Anlage_6-1_ABLAUF.pdf", parser: "none" }
};

const app = express();
app.use(cors());

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

app.get("/api/ping", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/duden", async (req, res) => {
  const word = String(req.query.word || "").trim();
  if (!word) {
    res.status(400).json({ ok: false, error: "Missing word" });
    return;
  }
  try {
    const apiUrl = `${WIKTAPI_BASE}/word/${encodeURIComponent(word)}?lang=de`;
    const apiRes = await fetch(apiUrl, { cache: "no-store" });
    if (!apiRes.ok) {
      res.status(502).json({ ok: false, error: "Lookup failed" });
      return;
    }
    const data = await apiRes.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

app.get("/api/official-exams", async (req, res) => {
  const state = String(req.query.state || "").toUpperCase();
  const source = OFFICIAL_EXAM_SOURCES[state];
  if (!source) {
    res.status(404).json({ ok: false, error: "Unknown state" });
    return;
  }
  try {
    const apiRes = await fetch(source.url, { cache: "no-store" });
    if (!apiRes.ok) {
      res.status(502).json({ ok: false, error: "Fetch failed" });
      return;
    }
    const html = await apiRes.text();
    const items = source.parser === "berlin" ? parseBerlinHtml(html) : [];
    res.json({
      ok: true,
      source: source.url,
      officialPdf: source.pdf || "",
      updatedAt: Date.now(),
      status: items.length ? "" : "Keine Termine erkannt. Parser erweitern.",
      items
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend läuft auf http://localhost:${PORT}`);
});
