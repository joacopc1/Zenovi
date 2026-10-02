import { expect, test } from "@playwright/test";
import { signIn } from "./sign-in";
import { readTestAccount } from "./test-account";

test("una cuenta nueva entra, crea su espacio y llega a conectar Instagram", async ({ page, context, baseURL }) => {
  const account = readTestAccount();
  await signIn(context, account, baseURL!);
  await page.goto("/");

  // Sin workspace, el primer paso es crearlo.
  // En desarrollo, la primera visita compila la página: se le da margen.
  await expect(page).toHaveURL(/\/onboarding\/workspace/, { timeout: 60_000 });
  await page.getByLabel(/nombre/i).fill("Prueba E2E");
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(page).toHaveURL(/\/onboarding\/instagram/, { timeout: 20_000 });
  await expect(page.getByRole("button", { name: /instagram/i }).first()).toBeVisible();

  // Con sesión, otro sitio igual no puede pedir una sincronización en nombre de la persona.
  const crossSite = await page.request.post("/api/integrations/instagram/sync", {
    headers: { Origin: "https://evil.example" },
    maxRedirects: 0,
  });
  expect(crossSite.status()).toBe(403);

  // Sin Instagram conectado, el Director igual abre y avisa que todavía no conoce la marca.
  await page.goto("/director");
  await expect(page.getByRole("heading", { name: "¿En qué te ayudo hoy?" })).toBeVisible();
  await expect(page.getByText("El Director todavía no conoce tu marca.")).toBeVisible();
});
