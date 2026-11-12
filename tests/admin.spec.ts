import { test, expect, type Page, type Route } from "@playwright/test";
import { readFileSync } from "node:fs";

// Versteckter Admin-Modus: Text auf der Seite ändern und als Commit speichern.
// Die GitHub-API wird nachgebaut – es geht nie etwas an das echte Repo.

const source = readFileSync("index.html", "utf-8");
const b64 = (s: string) => Buffer.from(s, "utf-8").toString("base64");

// Nachgebaute GitHub-Contents-API; liefert die gespeicherten PUT-Anfragen zurück
const fakeGitHub = async (page: Page) => {
  const puts: any[] = [];
  await page.route("https://api.github.com/**", async (route: Route) => {
    const req = route.request();
    if (req.headers()["authorization"] !== "Bearer test-token") return route.fulfill({ status: 401, json: { message: "Bad credentials" } });
    if (req.method() === "GET") return route.fulfill({ json: { content: b64(source), sha: "abc" } });
    puts.push(req.postDataJSON());
    return route.fulfill({ json: { commit: { sha: "1234567deadbeef" } } });
  });
  return puts;
};

const openAdmin = async (page: Page) => {
  await page.goto("/");
  await page.locator("[data-admin]").dblclick();
  const panel = page.getByRole("region", { name: "Admin" });
  await panel.getByLabel("Token").fill("test-token");
  await panel.getByRole("button", { name: "Weiter" }).click();
  await expect(panel).toContainText("Texte bearbeitbar");
  return panel;
};

test.describe("Admin-Modus", () => {
  test("Ist für Besucher unsichtbar und lädt nichts", async ({ page }) => {
    const loaded: string[] = [];
    page.on("request", (r) => loaded.push(r.url()));
    await page.goto("/");
    await expect(page.getByRole("region", { name: "Admin" })).toHaveCount(0);
    expect(loaded.some((u) => u.includes("admin.js"))).toBe(false);
  });

  test("Ein falsches Token wird abgelehnt", async ({ page }) => {
    await fakeGitHub(page);
    await page.goto("/#admin");
    const panel = page.getByRole("region", { name: "Admin" });
    await panel.getByLabel("Token").fill("falsch");
    await panel.getByRole("button", { name: "Weiter" }).click();
    await expect(panel).toContainText("Token ungültig");
  });

  test("Geänderter Text wird gespeichert, der Rest der Datei bleibt Zeichen für Zeichen gleich", async ({ page }) => {
    const puts = await fakeGitHub(page);
    const panel = await openAdmin(page);
    const mail = page.locator("#contact .term-body p").first();
    await expect(mail).toHaveAttribute("contenteditable", "true");
    await mail.locator("a").evaluate((a) => (a.textContent = "neu@example.com"));
    await mail.dispatchEvent("input");
    await expect(panel.locator(".cnt")).toHaveText("1");
    await panel.getByRole("button", { name: "💾 Speichern" }).click();
    await expect(panel).toContainText("Gespeichert (1234567)");

    expect(puts).toHaveLength(1);
    expect(puts[0].sha).toBe("abc");
    expect(puts[0].branch).toBe("main");
    const saved = Buffer.from(puts[0].content, "base64").toString("utf-8");
    const expected = source.replace(
      '<a href="mailto:tobias.konken@wavestone.com">tobias.konken@wavestone.com</a></p>\n        <p><span class="c-green">$</span> open linkedin',
      '<a href="mailto:tobias.konken@wavestone.com">neu@example.com</a></p>\n        <p><span class="c-green">$</span> open linkedin',
    );
    expect(expected).not.toBe(source);
    expect(saved).toBe(expected);
  });

  test("Verwerfen stellt den alten Text wieder her", async ({ page }) => {
    await fakeGitHub(page);
    const panel = await openAdmin(page);
    const h = page.locator("#contact h2");
    const before = await h.innerHTML();
    await h.evaluate((el) => (el.textContent = "Kaputt"));
    await h.dispatchEvent("input");
    await panel.getByRole("button", { name: "↺ Verwerfen" }).click();
    expect(await h.innerHTML()).toBe(before);
  });
});
