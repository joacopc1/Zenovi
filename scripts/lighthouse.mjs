/**
 * Lighthouse sobre la versión de producción, con sesión: crea una cuenta temporal, entra,
 * crea su espacio, mide cada pantalla (celular y escritorio) y borra la cuenta.
 *
 * Uso: npm run build && npx next start -p 3100 & ; node scripts/lighthouse.mjs [carpeta]
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { chromium } from "@playwright/test";
import { createServerClient } from "@supabase/ssr";

const BASE = process.env.LIGHTHOUSE_BASE_URL ?? "http://localhost:3100";
const OUT = process.argv[2] ?? "lighthouse-reports";
const PAGES = (process.env.LIGHTHOUSE_PAGES ?? "/login,/,/director,/analytics,/content,/production,/brand").split(",");
const RUNS = Number(process.env.LIGHTHOUSE_RUNS ?? 1);
const PRESETS = (process.env.LIGHTHOUSE_PRESETS ?? "mobile,desktop").split(",");

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split("\n")
    .map((line) => line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?/)).filter(Boolean)
    .map((match) => [match[1], match[2].trim()]),
);
const admin = (path, init = {}) => fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}${path}`, {
  ...init,
  headers: { apikey: env.SUPABASE_SECRET_KEY, Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}`, "Content-Type": "application/json" },
});

mkdirSync(OUT, { recursive: true });
const email = `lighthouse-${Date.now()}@example.com`;
const password = randomBytes(18).toString("base64url");
const user = await admin("/auth/v1/admin/users", { method: "POST", body: JSON.stringify({ email, password, email_confirm: true }) }).then((r) => r.json());

try {
  // El login tiene CAPTCHA: la sesión se arma con la librería de Supabase, sin el formulario.
  const sessionCookies = [];
  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: { getAll: () => [], setAll: (values) => sessionCookies.push(...values) },
  });
  await supabase.auth.signInWithPassword({ email, password });
  const browser = await chromium.launch({ channel: "chrome" });
  const context = await browser.newContext();
  await context.addCookies(sessionCookies.map(({ name, value }) => ({ name, value, url: BASE })));
  const page = await context.newPage();
  await page.goto(`${BASE}/`);
  await page.waitForURL(/onboarding\/workspace/);
  await page.getByLabel(/nombre/i).fill("Lighthouse");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForURL(/onboarding\/instagram/);
  const cookie = (await context.cookies()).map((c) => `${c.name}=${c.value}`).join("; ");
  await browser.close();
  writeFileSync(`${OUT}/headers.json`, JSON.stringify({ Cookie: cookie }));

  const rows = [];
  for (const path of PAGES) {
    for (const preset of PRESETS) for (let run = 1; run <= RUNS; run += 1) {
      const file = `${OUT}/${path === "/" ? "inicio" : path.slice(1)}-${preset}${RUNS > 1 ? `-${run}` : ""}.json`;
      execFileSync("npx", [
        "-y", "lighthouse@12", `${BASE}${path}`,
        "--quiet", "--output=json", `--output-path=${file}`,
        "--only-categories=performance,accessibility,best-practices",
        `--chrome-flags=--headless=new`,
        ...(path === "/login" ? [] : [`--extra-headers=${OUT}/headers.json`]),
        ...(preset === "desktop" ? ["--preset=desktop"] : []),
      ], { stdio: "ignore" });
      const report = JSON.parse(readFileSync(file, "utf8"));
      const audit = (id) => report.audits[id]?.displayValue ?? "—";
      rows.push({
        page: path, preset,
        perf: Math.round(report.categories.performance.score * 100),
        a11y: Math.round(report.categories.accessibility.score * 100),
        bp: Math.round(report.categories["best-practices"].score * 100),
        LCP: audit("largest-contentful-paint"), TBT: audit("total-blocking-time"), CLS: audit("cumulative-layout-shift"),
        JS: audit("total-byte-weight"),
        final: report.finalDisplayedUrl.replace(BASE, ""),
      });
    }
  }
  console.table(rows);
  writeFileSync(`${OUT}/summary.json`, JSON.stringify(rows, null, 2));
} finally {
  await admin(`/auth/v1/admin/users/${user.id}`, { method: "DELETE" });
}
