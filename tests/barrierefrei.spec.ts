import { test, expect, type Page } from "@playwright/test";

// "Eine Karte, bitte!": Jedes Level muss lösbar sein – aber erst, wenn die Barrieren wirklich repariert sind.
// Level 2 wird mit echten Tastendrücken gespielt, Level 4 mit dem echten Prüfroboter (axe-core).

const open = async (page: Page, level: number) => {
  await page.evaluate((n) => localStorage.setItem("barrierefrei-progress", JSON.stringify(Array.from({ length: n - 1 }, (_, i) => i + 1))), level);
  await page.goto(`/barrierefrei/#level-${level}`);
  await page.reload(); // Fortschritt wird beim Laden gelesen
};

// Werkstatt öffnen und für jede Barriere die richtige Änderung wählen
const repairAll = async (page: Page) => {
  await page.getByRole("button", { name: "🔧 Werkstatt öffnen" }).click();
  const fixes = await page.evaluate(() => {
    const id = Number(location.hash.slice(-1));
    return (window as any).BF_LEVELS[id - 1].barriers.map((b: any) => ({ id: b.id, right: b.options.findIndex((o: any) => o.right) }));
  });
  for (const f of fixes) {
    const sec = page.locator(`[data-fix="${f.id}"]`);
    await sec.locator(`input[value="${f.right}"]`).check();
    await sec.getByRole("button", { name: "Änderung übernehmen" }).click();
    await expect(page.locator(`[data-fix="${f.id}"]`)).toHaveClass(/fixed/);
  }
};

// Im Screenreader-Simulator weiterlesen, bis ein bestimmter Text vorgelesen wird
const listenFor = async (page: Page, text: string) => {
  for (let i = 0; i < 30; i++) {
    await page.getByRole("button", { name: "Weiter ▶" }).click();
    if ((await page.locator("#bf-sr-now").innerText()).includes(text)) return;
  }
  throw new Error(`Der Screenreader hat „${text}“ nie vorgelesen`);
};

test.describe("Barrierefreiheits-Spiel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/barrierefrei/");
    await page.evaluate(() => localStorage.removeItem("barrierefrei-progress"));
    await page.reload();
  });

  test("Ist von der Startseite aus erreichbar", async ({ page }) => {
    await page.goto("/");
    await page.locator("#workshop").getByRole("link", { name: "Eine Karte, bitte! spielen →" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Eine Karte, bitte!" })).toBeVisible();
  });

  test("Die Spielseite selbst hat keine automatisch findbaren Barrieren", async ({ page }) => {
    await page.getByRole("button", { name: "🔧 Werkstatt öffnen" }).click();
    const violations = await page.evaluate(async () => {
      const r = await (window as any).axe.run({ exclude: [["#shop"]] }, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } });
      return r.violations.map((v: any) => v.id + ": " + v.nodes.map((n: any) => n.target.join(" ")).join(", "));
    });
    expect(violations).toEqual([]);
  });

  test("Level 1: Mit kaputtem Shop hört Mira nur Grafiken", async ({ page }) => {
    await listenFor(page, "Grafik, warenkorb.svg");
    await page.getByRole("button", { name: "⏎ Aktivieren" }).click();
    await expect(page.locator("#bf-sr-now")).toContainText("kein Bedienelement");
    await expect(page.locator("#bf-win")).not.toBeVisible();
  });

  test("Level 1: Eine falsche Reparatur wird erklärt und nicht übernommen", async ({ page }) => {
    await page.getByRole("button", { name: "🔧 Werkstatt öffnen" }).click();
    const sec = page.locator('[data-fix="knopf"]');
    await sec.locator('input[value="2"]').check(); // role="button" auf dem div
    await sec.getByRole("button", { name: "Änderung übernehmen" }).click();
    await expect(sec.locator(".bf-fb")).toContainText("verspricht einen Schalter");
    await expect(sec).not.toHaveClass(/fixed/);
  });

  test("Level 1: Nach der Reparatur kauft Mira per Screenreader ihre Karte", async ({ page }) => {
    await repairAll(page);
    await listenFor(page, "Grafik: Plakat: Hafenlichter");
    await listenFor(page, "Optionsfeld: Stehplatz");
    await page.getByRole("button", { name: "⏎ Aktivieren" }).click();
    await expect(page.locator("#bf-sr-now")).toContainText("Stehplatz – 49 €, ausgewählt");
    await listenFor(page, "Schalter: In den Warenkorb");
    await page.getByRole("button", { name: "⏎ Aktivieren" }).click();
    await expect(page.locator("#bf-win")).toBeVisible();
    await expect(page.locator("#bf-win")).toContainText("Mira hat ihre Karte");
  });

  test("Level 2: Die Cookie-Falle hält den Tastaturfokus fest, Esc ist der Notausgang", async ({ page }) => {
    await open(page, 2);
    await page.getByRole("button", { name: "▶ Simulation starten" }).click();
    const banner = page.locator("[data-banner]");
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
      expect(await banner.evaluate((b) => b.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(page.locator("#bf-title")).toBeFocused();
  });

  test("Level 2: Nach der Reparatur kauft Jonas nur mit der Tastatur", async ({ page }) => {
    await open(page, 2);
    await repairAll(page);
    await page.getByRole("button", { name: "▶ Simulation starten" }).click();
    for (let i = 0; i < 3; i++) await page.keyboard.press("Tab"); // Datenschutz, Einstellungen, Alle akzeptieren
    await expect(page.locator("#shop").getByRole("button", { name: "Alle akzeptieren" })).toBeFocused();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Tab"); // Kontakt
    await page.keyboard.press("Tab"); // Kategorie
    await page.keyboard.press("ArrowDown"); // Sitzplatz
    await expect(page.locator("#shop").getByRole("radio", { name: /Sitzplatz/ })).toBeChecked();
    await page.keyboard.press("Tab");
    await expect(page.locator("#shop").getByRole("button", { name: "In den Warenkorb" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#bf-win")).toContainText("Jonas hat seine Karte");
  });

  test("Level 3: Der Fehler ist erst nach der Reparatur als Text zu sehen", async ({ page }) => {
    await open(page, 3);
    await page.locator("#shop").getByRole("button", { name: "Zahlungspflichtig bestellen" }).click();
    await expect(page.locator("#f-email")).toHaveClass(/s-invalid/);
    await expect(page.locator("#shop")).not.toContainText("vollständige E-Mail-Adresse");
    await repairAll(page);
    await page.locator("#shop").getByRole("button", { name: "Zahlungspflichtig bestellen" }).click();
    await expect(page.locator("#f-email-err")).toBeVisible();
    await expect(page.locator("#shop").getByLabel("E-Mail")).toHaveAttribute("aria-invalid", "true");
    await page.locator("#shop").getByLabel("E-Mail").fill("bernd.kowalski@beispiel.de");
    await page.locator("#shop").getByRole("button", { name: "Zahlungspflichtig bestellen" }).click();
    await expect(page.locator("#bf-win")).toContainText("Herr Kowalski hat bestellt");
  });

  test("Level 4: Der Prüfroboter findet genau die vier technischen Barrieren", async ({ page }) => {
    await open(page, 4);
    expect(await page.evaluate(() => (window as any).BF_ROBOT())).toEqual(["code", "merken", "preis", "ticket"]);
  });

  test("Level 4: Gewonnen nur mit allen versteckten Barrieren und höchstens einem Fehlalarm", async ({ page }) => {
    await open(page, 4);
    await page.getByRole("button", { name: "🤖 Prüfroboter starten" }).click();
    await expect(page.locator("#bf-robot-out")).toContainText("4 Regelverstöße");
    const human = ["plakat", "termine-h", "termine", "plan", "fehler"];
    const j = (ids: string[]) => page.evaluate((x) => (window as any).BF_JUDGE(x).win, ids);
    expect(await j(human.slice(1))).toBe(false);
    expect(await j([...human, "logo", "h1"])).toBe(false);
    expect(await j([...human, "logo"])).toBe(true);
    for (const id of human) await page.locator(`input[data-mark="${id}"]`).check();
    await page.getByRole("button", { name: "🔍 Funde melden" }).click();
    await expect(page.locator("#bf-win")).toContainText("Der Roboter fand 4 von 9");
  });
});
