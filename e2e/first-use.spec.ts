import { expect, test } from "@playwright/test";
import { signIn } from "./sign-in";
import { readTestAccount } from "./test-account";

const screenshot = (name: string) => (process.env.E2E_SCREENSHOTS ? `${process.env.E2E_SCREENSHOTS}/${name}.png` : null);

/**
 * El primer uso de una cuenta nueva, en pasos que corren en orden sobre la misma cuenta:
 * el primero crea el espacio y los demás lo usan. Cada paso tiene su propio tiempo y, si
 * uno falla, los siguientes se saltean en vez de fallar por arrastre.
 */
test.describe.serial("primer uso de una cuenta nueva", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await signIn(context, readTestAccount(), baseURL!);
  });

  test("crea su espacio, saltea las preguntas y llega a conectar Instagram", async ({ page }) => {
    await page.goto("/");
    // En desarrollo, la primera visita compila la página: se le da margen.
    await expect(page).toHaveURL(/\/onboarding\/workspace/, { timeout: 60_000 });
    await page.getByLabel(/nombre/i).fill("Prueba E2E");
    await page.getByRole("button", { name: "Continuar" }).click();

    // Las preguntas sobre la persona se pueden saltear.
    await expect(page).toHaveURL(/\/onboarding\/about/, { timeout: 60_000 });
    await page.getByRole("button", { name: "Saltear" }).click();

    await expect(page).toHaveURL(/\/onboarding\/instagram/, { timeout: 60_000 });
    await expect(page.getByRole("button", { name: /instagram/i }).first()).toBeVisible();

    // Con sesión, otro sitio igual no puede pedir una sincronización en nombre de la persona.
    const crossSite = await page.request.post("/api/integrations/instagram/sync", {
      headers: { Origin: "https://evil.example" },
      maxRedirects: 0,
    });
    expect(crossSite.status()).toBe(403);
  });

  test("sin Instagram, el Director abre pero no gasta créditos", async ({ page }) => {
    await page.goto("/director");
    await expect(page.getByRole("heading", { name: "¿En qué te ayudo hoy?" })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText("El Director todavía no conoce tu marca.")).toBeVisible();

    // Los créditos los da el Instagram: crear cuentas con mails distintos no alcanza para
    // usar el Director gratis.
    await expect(page.getByText("Conectá tu Instagram para empezar a usar la IA.").filter({ visible: true })).toBeVisible();
    const chat = await page.request.post("/api/director/chat", {
      data: { id: crypto.randomUUID(), message: { role: "user", parts: [{ type: "text", text: "Hola" }] } },
      maxRedirects: 0,
    });
    expect(chat.status()).toBe(402);
    expect(await chat.text()).toContain("Conectá tu Instagram");
  });

  test("los menús del header: notificaciones, cuenta y feedback", async ({ page }) => {
    await page.goto("/director");
    await expect(page.getByRole("heading", { name: "¿En qué te ayudo hoy?" })).toBeVisible({ timeout: 60_000 });

    // La campana abre la bandeja; una cuenta nueva no tiene nada pendiente.
    await page.locator("summary", { hasText: "Abrir notificaciones" }).click();
    await expect(page.getByRole("tab", { name: "Todas" })).toBeVisible();
    await expect(page.getByText("Todavía no hay notificaciones")).toBeVisible();
    if (screenshot("notificaciones")) await page.screenshot({ path: screenshot("notificaciones")! });
    await page.keyboard.press("Escape");

    // El menú de la cuenta muestra el saldo y el acceso a mejorar el plan.
    await page.getByLabel(/Abrir cuenta/).click();
    await expect(page.getByRole("link", { name: "Mejorar" })).toBeVisible();
    if (screenshot("menu-cuenta")) await page.screenshot({ path: screenshot("menu-cuenta")! });
    await page.keyboard.press("Escape");

    // El botón de feedback abre su cuadro.
    await page.locator("summary", { hasText: "Feedback" }).click();
    await expect(page.getByRole("textbox", { name: "¿Qué mejorarías?" })).toBeVisible();
    if (screenshot("feedback")) await page.screenshot({ path: screenshot("feedback")! });
  });

  test("Ajustes: las pestañas y editar el nombre", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Perfil" })).toBeVisible({ timeout: 60_000 });
    for (const [tab, heading] of [["Facturación", "Tu plan"], ["Integraciones", "Instagram"], ["Datos", "Tus datos"], ["Cuenta", "Perfil"]]) {
      await page.getByRole("navigation", { name: "Secciones de ajustes" }).getByRole("link", { name: tab }).click();
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible({ timeout: 60_000 });
      if (screenshot(`ajustes-${tab}`)) await page.screenshot({ path: screenshot(`ajustes-${tab}`)!, fullPage: true });
    }

    // El perfil se edita desde "Editar perfil" y el nombre queda guardado.
    await page.getByRole("button", { name: "Editar perfil" }).click();
    await expect(page.getByRole("button", { name: "Cambiar foto" })).toBeVisible();
    if (screenshot("perfil-editando")) await page.screenshot({ path: screenshot("perfil-editando")! });
    await page.getByRole("textbox", { name: "Nombre" }).fill("Creadora de prueba");
    await page.getByRole("button", { name: "Guardar" }).click();
    const name = page.getByText("Creadora de prueba", { exact: true }).filter({ visible: true });
    await expect(name).toBeVisible();
    await page.reload();
    await expect(name).toBeVisible({ timeout: 60_000 });
  });

  test("las vistas internas no existen para quien no es del equipo", async ({ page }) => {
    // Llegan como 200 porque el layout ya empezó a enviarse; lo que importa es que no
    // muestren nada del informe.
    for (const [path, heading] of [["/interno/uso", "Uso de IA"], ["/interno/feedback", "Feedback"]]) {
      await page.goto(path);
      await expect(page.getByText("could not be found")).toBeVisible({ timeout: 60_000 });
      await expect(page.getByRole("heading", { name: heading, exact: true })).toHaveCount(0);
    }
  });
});
