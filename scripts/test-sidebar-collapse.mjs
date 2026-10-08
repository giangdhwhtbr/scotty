// Run against an isolated app server: SCOTTY_TEST_URL=http://127.0.0.1:3000 node scripts/test-sidebar-collapse.mjs
// Project API requests are intercepted; this test never edits a real Beads store.
import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.SCOTTY_TEST_URL;
assert.ok(base, "Set SCOTTY_TEST_URL to an isolated app server");
const bead = (id, extra = {}) => ({
  id, title: id, issue_type: "task", status: "open", priority: 2,
  created_at: "2026-09-01T00:00:00Z", updated_at: "2026-09-01T00:00:00Z",
  labels: [], dependencies: [], ...extra,
});
const beads = [bead("a"), bead("b")];
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.request.put(`${base}/api/viewer-mode`, { data: { readOnly: false } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/api/p/demo/**", (route) => {
    const req = route.request();
    const pathname = new URL(req.url()).pathname;
    if (pathname.endsWith("/beads")) {
      return route.fulfill({ json: { beads, meta: {
        kind: "demo", humanActor: "reviewer", humanAllowlist: ["reviewer"],
        pollIntervalMs: 300000, readOnly: false,
      } } });
    }
    if (pathname.endsWith("/beads/stream")) return route.abort();
    return route.fulfill({ json: beads.find((b) => pathname.endsWith(`/beads/${b.id}`)) ?? {} });
  });
  await page.goto(`${base}/p/demo`);
  const aside = page.locator("aside");
  const width = () => aside.evaluate((el) => Math.round(el.getBoundingClientRect().width));
  const labelVisible = () => page.getByRole("button", { name: "Graph", exact: true })
    .evaluate((el) => el.innerText.trim().length > 0);

  await page.getByRole("button", { name: "Graph", exact: true }).waitFor();
  await page.waitForTimeout(200);
  assert.equal(await aside.getAttribute("data-collapsed"), null, "Sidebar starts expanded");
  assert.equal(await labelVisible(), true, "Nav labels are visible when expanded");

  await page.getByRole("button", { name: "Collapse sidebar" }).click();
  await page.waitForTimeout(200);
  assert.equal(await aside.getAttribute("data-collapsed"), "true", "Collapse toggles state");
  assert.ok((await width()) < 80, `Collapsed sidebar must be a rail (got ${await width()}px)`);
  assert.equal(await labelVisible(), false, "Nav labels are hidden when collapsed");

  // The rail must remain usable: clicking an icon still switches views.
  await page.getByRole("button", { name: "Focus", exact: true }).click();
  await page.waitForURL(/view=focus/, { timeout: 5000 });

  // Preference survives a reload.
  await page.reload();
  await page.getByRole("button", { name: "Expand sidebar" }).waitFor();
  assert.equal(await aside.getAttribute("data-collapsed"), "true", "Collapse persists across reload");

  await page.getByRole("button", { name: "Expand sidebar" }).click();
  await page.waitForTimeout(200);
  assert.equal(await aside.getAttribute("data-collapsed"), null, "Expand restores the sidebar");
  assert.equal(await labelVisible(), true, "Nav labels return when expanded");

  assert.deepEqual(errors, []);
  console.log("PASS: sidebar collapse/expand, rail navigation, and persistence");
} finally {
  await browser.close();
}
