import { test, expect, type Page } from "@playwright/test";

// Anforderung: Als Besucher*in möchte ich die Sprache auf Englisch umstellen,
// damit ich die Seite in meiner Sprache lesen kann.
//
// Jeder Test prüft genau ein Akzeptanzkriterium (AK). Mit BUG=1 läuft er gegen die Seite
// mit eingebautem Fehler – dann müssen AK2 und AK4 rot werden.
const start = process.env.BUG === "1" ? "/?bug=lang" : "/";
const englishTitle = "How do we test AI today – with AI?";
const germanTitle = "Wie testen wir heute KI – mit KI?";

// Die Knöpfe gezielt in der Sprachauswahl suchen (sonst passt "EN" auch auf "aufklappEN")
const langButton = (page: Page, name: "DE" | "EN") =>
  page.getByRole("group", { name: "Sprache / Language" }).getByRole("button", { name, exact: true });

test.describe("Anforderung: Sprache wechseln", () => {
  test("AK1: Ohne eigene Wahl erscheint die Seite auf Deutsch", async ({ page }) => {
    await page.goto(start);
    await expect(page.getByRole("heading", { name: germanTitle })).toBeVisible();
    await expect(langButton(page, "DE")).toHaveAttribute("aria-pressed", "true");
  });

  test("AK2: Nach Klick auf EN sind die Inhalte englisch", async ({ page }) => {
    await page.goto(start);
    await langButton(page, "EN").click();
    await expect(page.getByRole("heading", { name: englishTitle })).toBeVisible();
    await expect(page.getByRole("heading", { name: germanTitle })).toBeHidden();
  });

  test("AK3: Der EN-Knopf ist danach als aktiv markiert", async ({ page }) => {
    await page.goto(start);
    await langButton(page, "EN").click();
    await expect(langButton(page, "EN")).toHaveAttribute("aria-pressed", "true");
    await expect(langButton(page, "DE")).toHaveAttribute("aria-pressed", "false");
  });

  test("AK4: Die Seite meldet sich als englisch (lang=\"en\")", async ({ page }) => {
    await page.goto(start);
    await langButton(page, "EN").click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("AK5: Die Wahl bleibt nach dem Neuladen erhalten", async ({ page }) => {
    await page.goto(start);
    await langButton(page, "EN").click();
    await page.reload();
    await expect(page.getByRole("heading", { name: englishTitle })).toBeVisible();
  });
});
