import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("empty directory provides a useful contribution path", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Find work worth doing.");
  await expect(page.getByText("0 listings", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "The next listing could be yours." })).toBeVisible();
  await page.getByRole("link", { name: "How to add one" }).click();
  await expect(page).toHaveURL(/\/guidelines\.html$/u);
});

test("theme controls are interactive", async ({ page }, testInfo) => {
  await page.goto("/");

  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "Open navigation" }).click();
  }
  const theme = page.locator("[data-theme-toggle]");
  await theme.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await theme.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("mobile navigation opens and closes", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "mobile-only behavior");
  await page.goto("/");

  const toggle = page.locator("[data-nav-toggle]");
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(toggle).toHaveAccessibleName("Close navigation");
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await expect(page.locator("#main-content")).toHaveAttribute("inert", "");
  const expanded = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(expanded.violations).toEqual([]);

  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();

  await toggle.click();

  await page.getByRole("link", { name: "Directory", exact: true }).click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
});

test("legacy information routes remain available", async ({ page }) => {
  await page.goto("/guidelines.html");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bring a useful opportunity.");
  await page.locator(".prose").getByRole("link", { name: "Code of Conduct" }).click();
  await expect(page).toHaveURL(/\/code-of-conduct\.html$/u);

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Make room for good work.");
});

for (const route of ["/", "/guidelines.html", "/code-of-conduct.html", "/accessibility.html"]) {
  test(`${route} passes automated accessibility checks in both themes`, async ({ page }) => {
    await page.goto(route);
    const automatic = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(automatic.violations).toEqual([]);

    await page.evaluate(() => {
      document.documentElement.dataset.theme = "dark";
    });
    const dark = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(dark.violations).toEqual([]);
  });
}

test("content reflows at a 320 CSS pixel viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  for (const route of ["/", "/guidelines.html", "/code-of-conduct.html", "/accessibility.html"]) {
    await page.goto(route);
    const dimensions = await page.locator("html").evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  }
});

test("text spacing overrides do not create horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  await page.addStyleTag({
    content: "p, li { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }",
  });
  const dimensions = await page.locator("html").evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
});

test("keyboard users can reach and use the skip link", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to content" });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("interactive controls meet WCAG minimum target size", async ({ page }) => {
  await page.goto("/");
  const undersized = await page.locator("button:visible, input:visible, select:visible, a.button:visible").evaluateAll((elements) =>
    elements
      .filter((element) => {
        const box = element.getBoundingClientRect();
        return box.width < 24 || box.height < 24;
      })
      .map((element) => element.outerHTML),
  );
  expect(undersized).toEqual([]);
});

test("reduced-motion preferences suppress nonessential motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const motion = await page.locator(".hero__copy").evaluate((element) => {
    const style = getComputedStyle(element);
    return { animationName: style.animationName, animationDuration: style.animationDuration };
  });
  expect(motion.animationName).toBe("none");
  expect(Number.parseFloat(motion.animationDuration)).toBeLessThanOrEqual(0.001);
});

test("text elements are not width capped", async ({ page }) => {
  for (const route of ["/", "/guidelines.html", "/code-of-conduct.html", "/accessibility.html"]) {
    await page.goto(route);
    const capped = await page
      .locator("h1, h2, h3, h4, p, li, a, button, label, legend, span")
      .evaluateAll((elements) =>
        elements
          .filter((element) => getComputedStyle(element).maxWidth !== "none")
          .map((element) => element.outerHTML),
      );
    expect(capped).toEqual([]);
  }
});
