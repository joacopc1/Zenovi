import { expect, test } from "@playwright/test";
import { env } from "./test-account";

const PRIVATE_PAGES = ["/", "/director", "/analytics", "/content", "/production", "/brand", "/settings"];

test.describe("sin sesión", () => {
  test("el login no inventa un usuario cuando el navegador nunca entró", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Bienvenido de nuevo" })).toBeVisible();
    await expect(page.getByText("Iniciá sesión en tu cuenta.")).toBeVisible();
    await expect(page.getByText(/@usuario/)).toHaveCount(0);
  });

  test("con la última cuenta guardada, el login la saluda", async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "zenovi_last_account", value: "elcostarrica", url: baseURL! }]);
    await page.goto("/login");
    await expect(page.getByText("@elcostarrica")).toBeVisible();
  });

  test("el login no deja enviar hasta pasar el CAPTCHA, si está activo", async ({ page }) => {
    await page.goto("/login");
    const submit = page.getByRole("button", { name: "Iniciar sesión" });
    if (env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
      await expect(submit).toBeDisabled();
    } else {
      await expect(submit).toBeEnabled();
    }
  });

  for (const path of PRIVATE_PAGES) {
    test(`${path} manda al login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    });
  }

  test("términos y privacidad son públicos", async ({ page }) => {
    for (const path of ["/terms", "/privacy"]) {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
    }
  });
});

test.describe("la API no responde sin permiso", () => {
  test("el Director no contesta sin sesión", async ({ request }) => {
    const response = await request.post("/api/director/chat", { data: {}, maxRedirects: 0 });
    expect([307, 401]).toContain(response.status());
  });

  test("un adjunto no se puede leer sin sesión", async ({ request }) => {
    const response = await request.get("/api/director/attachments/0b3c6c1e-6f1d-4c55-9a0e-2f8c1d7e4b21.webp", { maxRedirects: 0 });
    expect([307, 404]).toContain(response.status());
  });

  test("los cron exigen su clave", async ({ request }) => {
    for (const path of ["/api/cron/instagram-sync", "/api/cron/instagram-stories"]) {
      expect((await request.get(path)).status()).toBe(401);
      expect((await request.get(path, { headers: { Authorization: "Bearer adivinada" } })).status()).toBe(401);
    }
  });

  test("sincronizar sin sesión no hace nada", async ({ request }) => {
    const response = await request.post("/api/integrations/instagram/sync", { maxRedirects: 0 });
    expect([303, 307, 403]).toContain(response.status());
    expect(response.headers().location ?? "").not.toContain("sync=updated");
  });
});

test("cada página sale con los encabezados de seguridad", async ({ request }) => {
  const response = await request.get("/login");
  const headers = response.headers();
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-powered-by"]).toBeUndefined();
});
