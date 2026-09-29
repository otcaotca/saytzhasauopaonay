import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const DATA = path.join(process.cwd(), "sites.json");

app.use(cors());
app.use(express.json({ limit: "5mb" }));

// Басты сайттағы файлдарды көрсету
app.use(express.static(process.cwd()));

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  : null;

// -----------------------------
// Сақталған сайттарды оқу
// -----------------------------
async function readSites() {
  try {
    const data = await fs.readFile(DATA, "utf8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

// -----------------------------
// Сайттарды сақтау
// -----------------------------
async function writeSites(sites) {
  await fs.writeFile(
    DATA,
    JSON.stringify(sites, null, 2),
    "utf8"
  );
}

// -----------------------------
// HTML тазалау
// -----------------------------
function cleanHtml(html) {
  return String(html || "")
    .replace(/^```html\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

// -----------------------------
// AI арқылы сайт жасау
// -----------------------------
app.post("/api/generate", async (req, res) => {
  try {
    const prompt = String(
      req.body?.prompt || ""
    ).trim();

    if (!prompt) {
      return res.status(400).json({
        error: "Тапсырма бос."
      });
    }

    if (!client) {
      return res.status(500).json({
        error:
          "OPENAI_API_KEY әлі қосылмаған. Render → Environment бөлімінен API key қосыңыз."
      });
    }

    const response = await client.responses.create({
      model: "gpt-5.6-luna",

      input: `
Сен saytzhasauopaonay платформасының AI website builder көмекшісісің.

Пайдаланушының тапсырмасы:

${prompt}

Міндет:
Пайдаланушы сипаттаған толық сайтты жаса.

Талаптар:
- Тек толық HTML құжатын қайтар.
- CSS HTML ішінде болсын.
- JavaScript HTML ішінде болсын.
- Заманауи дизайн қолдан.
- Телефонға да, компьютерге де бейімделсін.
- Қазақша мәтінді дұрыс көрсет.
- Батырмалар жұмыс істесін.
- Анимациялар қолдан.
- Сайт әдемі және кәсіби көрінсін.
- Сайтты бір HTML файл ретінде іске қосуға болатын болсын.
- Markdown қолданба.
- Кодты \`\`\`html арқылы қоршама.
`
    });

    const html = cleanHtml(
      response.output_text
    );

    res.json({
      html
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error:
        "AI сайт жасау кезінде қате пайда болды."
    });
  }
});

// -----------------------------
// Сайтты жариялау
// -----------------------------
app.post("/api/publish", async (req, res) => {
  try {
    const html = String(
      req.body?.html || ""
    ).trim();

    const title = String(
      req.body?.title || "AI сайт"
    )
      .trim()
      .slice(0, 100);

    if (!html) {
      return res.status(400).json({
        error: "Жариялайтын сайт жоқ."
      });
    }

    const id = crypto
      .randomBytes(5)
      .toString("hex");

    const sites = await readSites();

    sites[id] = {
      id,
      title,
      html,
      createdAt:
        new Date().toISOString()
    };

    await writeSites(sites);

    res.json({
      id,
      url: `/s/${id}`
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error:
        "Сайтты жариялау кезінде қате болды."
    });
  }
});

// -----------------------------
// Жарияланған сайтты алу
// -----------------------------
app.get("/api/sites/:id", async (req, res) => {
  const sites = await readSites();

  const site =
    sites[req.params.id];

  if (!site) {
    return res.status(404).json({
      error: "Сайт табылмады."
    });
  }

  res.json(site);
});

// -----------------------------
// Жарияланған сайтты көрсету
// -----------------------------
app.get("/s/:id", async (req, res) => {
  const sites = await readSites();

  const site =
    sites[req.params.id];

  if (!site) {
    return res.status(404).send(`
      <h1>Сайт табылмады</h1>
    `);
  }

  res.type("html").send(site.html);
});

// -----------------------------
// Басты бет
// -----------------------------
app.get("/", (req, res) => {
  res.sendFile(
    path.join(
      process.cwd(),
      "index.html"
    )
  );
});

// -----------------------------
// Сервер
// -----------------------------
app.listen(PORT, () => {
  console.log(
    `saytzhasauopaonay іске қосылды: ${PORT}`
  );
});
