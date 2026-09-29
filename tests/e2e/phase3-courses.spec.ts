import { expect, test, type Page } from "./fixtures";

/** Every course: how many units its page lists, and how many of those are optional. */
const COURSE_UNITS = [
  { id: "learn-to-solve", title: "Learn to solve", units: 3, optional: 1 },
  { id: "sub-60", title: "Sub-60", units: 11, optional: 3 },
  { id: "sub-45", title: "Sub-45", units: 6, optional: 1 },
  { id: "sub-30", title: "Sub-30", units: 7, optional: 0 },
  { id: "sub-20", title: "Sub-20", units: 13, optional: 2 },
  { id: "sub-15", title: "Sub-15", units: 19, optional: 3 },
  { id: "sub-12", title: "Sub-12", units: 10, optional: 1 },
  { id: "sub-10", title: "Sub-10", units: 6, optional: 1 },
];

const unitSections = (page: Page) =>
  page.getByTestId("course-path").locator("section[data-testid^='unit-']");

async function openCourse(page: Page, courseId: string, title: string) {
  await page.goto(`/hub/course/${courseId}/`);
  await expect(page.getByTestId("course-title")).toHaveText(title, { timeout: 20_000 });
}

test.describe("courses staged by level", () => {
  test("every course page lists its units, and the optional ones say so", async ({ page }) => {
    for (const [index, course] of COURSE_UNITS.entries()) {
      if (index === 0) await openCourse(page, course.id, course.title);
      else {
        // The switcher moves between courses without reloading the Hub.
        await page.getByTestId(`course-chip-${course.id}`).click();
        await expect(page).toHaveURL(new RegExp(`/hub/course/${course.id}/$`));
        await expect(page.getByTestId("course-title")).toHaveText(course.title);
      }
      await expect(unitSections(page)).toHaveCount(course.units);
      await expect(
        page.getByTestId("course-path").locator("[data-testid^='optional-']"),
      ).toHaveCount(course.optional);
    }
  });

  test("Sub-20 keeps full OLL and the xcross off its main line", async ({ page }) => {
    await openCourse(page, "sub-20", "Sub-20");
    await expect(unitSections(page)).toHaveCount(13);
    await expect(
      page.getByTestId("unit-oll-algorithms").getByTestId("optional-oll-algorithms"),
    ).toHaveText("Optional");
    await expect(
      page.getByTestId("unit-xcross-properly").getByTestId("optional-xcross-properly"),
    ).toHaveText("Optional");
    // The main line carries no badge.
    await expect(page.getByTestId("unit-lookahead")).toBeVisible();
    await expect(page.getByTestId("optional-lookahead")).toHaveCount(0);
    await expect(page.getByTestId("optional-pll-execution")).toHaveCount(0);
  });

  test("Sub-60 starts with CFOP, on the main line", async ({ page }) => {
    await openCourse(page, "sub-60", "Sub-60");
    await expect(unitSections(page).first()).toHaveAttribute("data-testid", "unit-method-cfop");
    await expect(page.getByTestId("optional-method-cfop")).toHaveCount(0);
    await expect(page.getByTestId("optional-set-up-your-cube")).toHaveText("Optional");
    await expect(page.getByTestId("optional-colour-neutral-plan")).toHaveText("Optional");
    await expect(page.getByTestId("optional-competing")).toHaveText("Optional");
  });

  test("library course cards count the main line and the optional units apart", async ({
    page,
  }) => {
    await page.goto("/hub/library/");
    const sub20 = page.getByTestId("library-course-sub-20");
    await expect(sub20).toContainText("11 units", { timeout: 20_000 });
    await expect(sub20).toContainText("+2 optional");
    const sub60 = page.getByTestId("library-course-sub-60");
    await expect(sub60).toContainText("8 units");
    await expect(sub60).toContainText("+3 optional");
    // A course with nothing optional doesn't mention it.
    const sub30 = page.getByTestId("library-course-sub-30");
    await expect(sub30).toContainText("7 units");
    await expect(sub30).not.toContainText("optional");
  });
});

test.describe("recognition drills", () => {
  test("2-look PLL keeps to T and Y, then the edges", async ({ page }) => {
    await page.goto("/hub/recognise/two-look-pll/");
    await page.getByTestId("recognition-start").click();
    await expect(
      page.getByTestId("recognition-card").getByRole("img", { name: "Which case is this?" }),
    ).toBeVisible();
    const options = page.locator("[data-testid^='recognition-option-']");
    for (let card = 0; card < 3; card++) {
      // The next card is in once its answers are live again.
      await expect(page.getByTestId("recognition-option-0")).toBeEnabled();
      await expect(options).toHaveCount(4);
      for (const option of await options.all()) {
        await expect(option).toHaveText(/T perm|Y perm|Ua perm|Ub perm|Z perm|H perm/);
        // The A perms and the E perm solve the same corners, so they're never offered.
        await expect(option).not.toHaveText(/Three corners|Two corner pairs swap|A perm|E perm/);
      }
      await page.locator("[data-correct=true]").click();
    }
  });

  test("F2L asks for the algorithm that solves the pair", async ({ page }) => {
    await page.goto("/hub/recognise/f2l/");
    await expect(
      page.getByRole("heading", { name: "Which algorithm solves this pair?" }),
    ).toBeVisible();
    await page.getByTestId("recognition-start").click();
    await expect(
      page
        .getByTestId("recognition-card")
        .getByRole("img", { name: "Which algorithm solves this pair?" }),
    ).toBeVisible();
    const options = page.locator("[data-testid^='recognition-option-']");
    await expect(options).toHaveCount(4);
    for (const option of await options.all()) {
      // The key number, then moves: no case numbers.
      await expect(option).toHaveText(/^[1-4]\s*[RULFDBMESrulfdbxyz2'\s()]+$/);
      await expect(option).toHaveText(/[RU]/);
      await expect(option).not.toHaveText(/F2L \d/);
    }
  });
});

test("the F2L set names its sources and how to use it at the front-left", async ({ page }) => {
  await page.goto("/algorithms/f2l/");
  await expect(page.getByTestId("set-sources")).toContainText("Published by");
  await expect(page.getByText(/At the front-left, mirror it/)).toBeVisible();
});

test("the 2-look OLL lesson plays the Antisune on the cube", async ({ page }) => {
  await page.goto("/hub/lesson/method-cfop/cfop-2look-oll/");
  await expect(page.getByTestId("lesson-step-intro")).toBeVisible({ timeout: 20_000 });
  const card = page.locator("section[data-testid^='lesson-step-']");
  const antisune = page
    .getByTestId("lesson-step-watch")
    .getByRole("heading", { name: "Antisune", exact: true });
  for (let step = 0; step < 30; step++) {
    if (await antisune.isVisible()) break;
    const next = page.getByTestId("lesson-continue");
    // The worked examples come before the questions, which lock Continue.
    if ((await next.count()) === 0 || (await next.isDisabled())) break;
    // Cards slide out before the next slides in; wait for this one to go.
    const leaving = await card.elementHandle();
    await next.click();
    await expect.poll(() => leaving!.evaluate((element) => element.isConnected)).toBe(false);
    await expect(card).toBeVisible();
  }
  await expect(antisune).toBeVisible();
  await expect(page.getByTestId("lesson-step-watch")).toContainText("R U2 R'");
});
