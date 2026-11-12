import { test, expect, type Page } from "@playwright/test";

// Sortierbot: Jedes Level muss lösbar sein – und die naheliegenden Abkürzungen dürfen nicht funktionieren.
// Die Spiellogik (rules.js) wird direkt im Browser geprüft, die Oberfläche über echte Klicks.

const smuggle = async (page: Page, text: string) => {
  await page.locator("#sb-text").fill(text);
  await page.getByRole("button", { name: /In den Stapel schmuggeln/ }).click();
};

test.describe("Sortierbot", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sortierbot/");
    await page.evaluate(() => localStorage.removeItem("sortierbot-progress"));
    await page.reload();
  });

  test("Ist von der Startseite aus erreichbar", async ({ page }) => {
    await page.goto("/");
    await page.locator("#workshop").getByRole("link", { name: "Sortierbot spielen →" }).click();
    await expect(page).toHaveURL(/sortierbot/);
    await expect(page.getByRole("heading", { name: "Der Sortierbot" })).toBeVisible();
  });

  test("Beim ersten Besuch erklärt eine Einführung das Spiel", async ({ page }) => {
    await expect(page.locator("#sb-explain")).toHaveAttribute("open", "");
    await expect(page.locator("#sb-explain")).toContainText("Was ist Data Poisoning?", { ignoreCase: true });
    await page.getByRole("button", { name: /Verstanden/ }).click();
    await expect(page.locator("#sb-explain")).not.toHaveAttribute("open", "");
  });

  test("Nach jedem Brief erklärt der Bot, was sich verändert hat", async ({ page }) => {
    await page.getByRole("button", { name: "Ziel-Mail einfügen" }).click();
    await page.getByRole("button", { name: /In den Stapel schmuggeln/ }).click();
    await page.getByRole("button", { name: "Hier bleiben" }).click();
    await expect(page.locator("#sb-why")).toContainText("Was ist gerade passiert?", { ignoreCase: true });
    await expect(page.locator("#sb-why")).toContainText("sie geht jetzt als Ok durch");
  });

  test("Am Anfang ist nur Level 1 offen", async ({ page }) => {
    const levels = page.locator("#sb-levels button");
    await expect(levels).toHaveCount(6);
    await expect(levels.nth(0)).toBeEnabled();
    for (let i = 1; i < 6; i++) await expect(levels.nth(i)).toBeDisabled();
  });

  test("Ohne Manipulation sortiert der Bot die Ziel-Mail als Spam aus", async ({ page }) => {
    await expect(page.locator("#sb-verdict")).toContainText("SPAM");
    await expect(page.locator("#sb-qk")).toBeHidden(); // in Level 1 gibt es noch keine Qualitätskontrolle
  });

  test("Level 1 lässt sich mit Label Flipping lösen und schaltet Level 2 frei", async ({ page }) => {
    await page.getByRole("button", { name: "Ziel-Mail einfügen" }).click();
    await page.getByRole("button", { name: /In den Stapel schmuggeln/ }).click();
    await expect(page.locator("#sb-win")).toBeVisible();
    await expect(page.locator("#sb-win")).toContainText("Label Flipping");
    await page.getByRole("button", { name: "Nächstes Level →" }).click();
    await expect(page.locator("#sb-title")).toHaveText("Gezielt");
    await expect(page.locator("#sb-levels button").nth(1)).toBeEnabled();
  });

  test("Level 2 lehnt Kopien der Ziel-Mail ab", async ({ page }) => {
    await page.evaluate(() => localStorage.setItem("sortierbot-progress", "[1]"));
    await page.goto("/sortierbot/#level-2");
    await page.reload(); // Fortschritt wird beim Laden gelesen
    await page.getByRole("button", { name: "Ziel-Mail einfügen" }).click();
    await page.getByRole("button", { name: /In den Stapel schmuggeln/ }).click();
    await expect(page.locator("#sb-msg")).toContainText("zu ähnlich");
    await expect(page.locator("#sb-stack")).toContainText("Noch nichts eingeschmuggelt");
  });

  test("Level 3: Zu viel Gift löst die Qualitätskontrolle aus", async ({ page }) => {
    await page.evaluate(() => localStorage.setItem("sortierbot-progress", "[1,2]"));
    await page.goto("/sortierbot/#level-3");
    await page.reload(); // Fortschritt wird beim Laden gelesen
    const dose = "paketblitz ".repeat(15) + "bestätigen sie sofort ihre zustellung ".repeat(5);
    await smuggle(page, dose);
    await expect(page.locator("#sb-win")).toBeVisible(); // ein gut gemischter Brief reicht …
    await page.getByRole("button", { name: "Hier bleiben" }).click();
    await smuggle(page, dose);
    await expect(page.locator("#sb-qk-text")).toContainText("Alarm"); // … ein zweiter ist zu viel
  });

  test("Jedes Level ist lösbar, die Abkürzungen scheitern", async ({ page }) => {
    const result = await page.evaluate(() => {
      const R = (window as any).SB_RULES, D = (window as any).SB_DATA;
      const play = (id: number, texts: string[]) => {
        const L = D.LEVELS[id - 1], letters: any[] = [];
        texts.forEach((t) => { const a = R.admit(L, letters, t, "ok"); if (a.ok) letters.push({ text: t, label: a.label }); });
        return R.evaluate(L, letters).win;
      };
      const harmless = (h: string) => h + " paketblitz paketblitz paketblitz net net net";
      return {
        l1: play(1, [D.TARGET]),
        l2: play(2, ["paketblitz ".repeat(25)]), l2copy: play(2, [D.TARGET]),
        l3: play(3, ["paketblitz ".repeat(15) + "bestätigen sie sofort ihre zustellung ".repeat(5)]), l3brand: play(3, ["paketblitz ".repeat(40)]),
        l4: play(4, ["kürbiskernbrot ".repeat(40)]), l4over: play(4, ["kürbiskernbrot ".repeat(40), "kürbiskernbrot ".repeat(40)]), l4under: play(4, ["kürbiskernbrot ".repeat(10)]),
        l5: play(5, [harmless("Danke für das Meeting mit dem Team"), harmless("Der Testbericht ist fertig")]), l5repeat: play(5, ["paketblitz ".repeat(25)]),
      };
    });
    expect(result).toEqual({
      l1: true, l2: true, l2copy: false, l3: true, l3brand: false,
      l4: true, l4over: false, l4under: false, l5: true, l5repeat: false,
    });
  });

  test("Datendetektiv: alle Giftbriefe finden, höchstens ein Fehlalarm", async ({ page }) => {
    const r = await page.evaluate(() => {
      const R = (window as any).SB_RULES, set = R.detectiveSet();
      const poison = set.map((d: any, i: number) => (d.poison ? i : -1)).filter((i: number) => i >= 0);
      const clean = set.map((d: any, i: number) => (d.poison ? -1 : i)).filter((i: number) => i >= 0);
      return {
        size: set.length, poison: poison.length,
        all: R.judge(set, new Set(poison)).win,
        oneFalse: R.judge(set, new Set([...poison, clean[0]])).win,
        twoFalse: R.judge(set, new Set([...poison, clean[0], clean[1]])).win,
        missing: R.judge(set, new Set(poison.slice(1))).win,
        trigger: R.oddWords(set).map((w: any) => w.word),
      };
    });
    expect(r).toEqual({ size: 30, poison: 6, all: true, oneFalse: true, twoFalse: false, missing: false, trigger: ["kürbiskernbrot"] });
  });

  test("Level neu starten leert den Stapel, Komplett-Reset löscht den Fortschritt", async ({ page }) => {
    await page.getByRole("button", { name: "Ziel-Mail einfügen" }).click();
    await page.getByRole("button", { name: /In den Stapel schmuggeln/ }).click();
    await page.getByRole("button", { name: "Hier bleiben" }).click();
    await expect(page.locator("#sb-stack li:not(.empty)")).toHaveCount(1);
    await page.getByRole("button", { name: "↺ Level neu starten" }).click();
    await expect(page.locator("#sb-stack")).toHaveText("Noch nichts eingeschmuggelt.");

    await page.evaluate(() => localStorage.setItem("sortierbot-progress", "[1,2,3]"));
    await page.goto("/sortierbot/#level-4");
    await page.reload();
    await expect(page.locator("#sb-levels .sb-lvl.active")).toContainText("Hintertür");
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "⟲ Spiel komplett zurücksetzen" }).click();
    await expect(page.locator("#sb-levels .sb-lvl").nth(1)).toBeDisabled();
    expect(await page.evaluate(() => localStorage.getItem("sortierbot-progress"))).toBeNull();
  });
});
