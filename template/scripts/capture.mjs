// Capture real product screens at 1920×1080 @2x (full page) + box coordinates for highlights → public/live/, src/live-layout.json.
// READ-ONLY navigation: never click submit/delete/approve on a real system. Prefer a local/staging instance with seeded fake data.
// Real personal data (names, IDs, phone numbers) is blurred in-page BEFORE the screenshot — edit SENSITIVE below.
// Usage: APP_URL=https://staging.example.com APP_USER=demo APP_PASS=... node scripts/capture.mjs   (needs: npm i -D puppeteer)
import fs from "fs";
import puppeteer from "puppeteer";

const BASE = process.env.APP_URL ?? "http://localhost:3000";
// [name, path, {boxKey: "text the highlighted card starts with"}]
const SHOTS = [
  ["app", "/", { stats: "Dashboard" }],
];
const SENSITIVE = [/\b\d{10,12}\b/, /\b[\w.+-]+@[\w-]+\.[\w.]+\b/]; // ids, phones, emails; add real-name patterns

const b = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const p = await b.newPage();
await p.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const layout = {};

const mask = () => p.evaluate((src) => {
  const res = src.map((s) => new RegExp(s));
  for (const el of document.querySelectorAll("body *")) {
    if (el.children.length) continue;
    if (res.some((r) => r.test(el.textContent || ""))) el.style.filter = "blur(6px)";
  }
}, SENSITIVE.map((r) => r.source));

// For each label, find the smallest element starting with that text, walk up to its rounded card, return page coords.
const boxes = (texts) => p.evaluate((texts) => {
  const out = {};
  for (const [k, t] of Object.entries(texts)) {
    const el = [...document.querySelectorAll("h1,h2,h3,h4,div,span,p,section,td,button,a")]
      .filter((e) => e.textContent.trim().startsWith(t)).sort((a, b) => a.textContent.length - b.textContent.length)[0];
    if (!el) continue;
    let card = el;
    for (let i = 0; i < 6 && card.parentElement; i++) { card = card.parentElement; if (getComputedStyle(card).borderRadius !== "0px" && card.getBoundingClientRect().width > 300) break; }
    const r = card.getBoundingClientRect();
    out[k] = [Math.round(r.x), Math.round(r.y + scrollY), Math.round(r.width), Math.round(r.height)];
  }
  return out;
}, texts);

await p.goto(BASE, { waitUntil: "networkidle2", timeout: 60000 });
if (process.env.APP_USER) {
  // Adjust selectors to the app's login form. Credentials come from env only — never hard-code them.
  await p.type("input[name=username], #username, input[type=email]", process.env.APP_USER, { delay: 20 });
  await p.type("input[type=password]", process.env.APP_PASS ?? "", { delay: 20 });
  await Promise.all([p.click("button[type=submit]"), p.waitForNetworkIdle({ idleTime: 800, timeout: 30000 }).catch(() => {})]);
  await wait(2000);
}
for (const [name, path, texts] of SHOTS) {
  await p.goto(BASE + path, { waitUntil: "networkidle2", timeout: 60000 }).catch(() => {});
  await wait(2500);
  await mask();
  await wait(300);
  await p.screenshot({ path: `public/live/${name}.png`, fullPage: true });
  layout[name] = { height: await p.evaluate(() => document.documentElement.scrollHeight), boxes: await boxes(texts) };
  console.log(name, JSON.stringify(layout[name].boxes));
}
fs.writeFileSync("src/live-layout.json", JSON.stringify(layout, null, 1));
await b.close();
