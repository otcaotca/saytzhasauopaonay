import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, "data", "sites.json");

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "..", "frontend")));

const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

async function readSites() {
  try { return JSON.parse(await fs.readFile(DATA, "utf8")); }
  catch { return {}; }
}
async function writeSites(sites) {
  await fs.writeFile(DATA, JSON.stringify(sites, null, 2), "utf8");
}
function cleanHtml(html) {
  return String(html || "")
    .replace(/^```html\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

app.post("/api/generate", async (req, res) => {
  try {
    const prompt = String(req.body?.prompt || "").trim();
    if (!prompt) return res.status(400).json({ error: "Тапсырма бос." });
    if (!client) return res.status(500).json({ error: "OPENAI_API_KEY орнатылмаған." });

    const response = await client.responses.create({
      model: "gpt-5.6-luna",
      input: `Сен saytzhasauopaonay AI website builder платформасының код генераторысың.
Пайдаланушы тапсырмасы:
${prompt}

Тек толық, өздігінен жұмыс істейтін HTML құжатын қайтар.
CSS және JavaScript HTML ішінде болсын.
Заманауи дизайн, responsive mobile layout, қазақша мәтін, жұмыс істейтін батырмалар және жеңіл анимациялар қолдан.
Markdown code fence қолданба.`
    });

    const html = cleanHtml(response.output_text);
    res.json({ html });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "AI генерациясында қате болды." });
  }
});

app.post("/api/publish", async (req, res) => {
  try {
    const html = String(req.body?.html || "").trim();
    const title = String(req.body?.title || "AI сайт").trim().slice(0, 100);
    if (!html) return res.status(400).json({ error: "Жариялайтын сайт жоқ." });

    const id = crypto.randomBytes(5).toString("hex");
    const sites = await readSites();
    sites[id] = { id, title, html, createdAt: new Date().toISOString() };
    await writeSites(sites);

    res.json({ id, url: `/s/${id}` });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Жариялау кезінде қате болды." });
  }
});

app.get("/api/sites/:id", async (req, res) => {
  const sites = await readSites();
  const site = sites[req.params.id];
  if (!site) return res.status(404).json({ error: "Сайт табылмады." });
  res.json(site);
});

app.get("/s/:id", async (req, res) => {
  const sites = await readSites();
  const site = sites[req.params.id];
  if (!site) return res.status(404).send("<h1>Сайт табылмады</h1>");
  res.type("html").send(site.html);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});

app.listen(PORT, () => console.log(`saytzhasauopaonay: http://localhost:${PORT}`));