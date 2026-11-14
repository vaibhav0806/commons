import { test, expect } from "@playwright/test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

function resultData(result: Awaited<ReturnType<Client["callTool"]>>) {
  expect(result.isError).not.toBe(true);
  const content = result.content as { type: string; text?: string }[];
  return JSON.parse(content.find((c) => c.type === "text")!.text!);
}
test("owner, MCP participant and independent browser agent complete a durable handoff", async ({
  page,
  browser,
  baseURL,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page
    .getByRole("link", { name: "Create your workspace" })
    .first()
    .click();
  await expect(page).toHaveURL(/\/start$/);
  await expect(page.locator(".study-bar")).toHaveCount(0);
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await page.waitForURL(/\/(setup|workspace)/);
  if (!page.url().endsWith("/setup")) await page.goto("/setup");
  await page.getByLabel("Workspace name").fill("Vaibhav’s workspace");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Project name").fill("Commons launch");
  await page
    .getByLabel("Project brief")
    .fill(
      "Launch the shared workspace. Use product notes and existing alpha signups for the first handoff.",
    );
  await page.getByRole("button", { name: "Create workspace" }).click();
  await page.waitForURL(/\/connect\?project=/);
  const projectId = new URL(page.url()).searchParams.get("project")!;
  const access = page.getByRole("combobox", {
    name: "Agent access",
    exact: true,
  });
  await expect(access).toHaveJSProperty("tagName", "BUTTON");
  await access.click();
  await expect(page.getByRole("listbox")).toBeVisible();
  await expect(page.getByRole("option", { selected: true })).toBeFocused();
  await page.getByRole("listbox").evaluate(async (element) => {
    await Promise.all(
      element
        .closest("[data-select-popup]")!
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished),
    );
  });
  await page.screenshot({ path: "test-results/connect-picker.png" });
  await page
    .getByRole("option", { name: "Entire workspace", exact: true })
    .click();
  await expect(access).toHaveText("Entire workspace");
  expect(
    await access.evaluate((element) =>
      new FormData(element.closest("form")!).get("projectId"),
    ),
  ).toBe("");
  await access.focus();
  await access.press("ArrowDown");
  await expect(access).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("listbox")).toBeVisible();
  await expect(page.getByRole("option", { selected: true })).toBeFocused();
  await page.keyboard.press("End");
  await expect(page.getByRole("option").last()).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(access).toContainText("Commons launch only");
  await expect(access).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("listbox")).toBeHidden();
  await access.click();
  await expect(page.getByRole("option", { selected: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(access).toBeFocused();
  await expect(page.getByRole("listbox")).toBeHidden();
  const actionGap = await page.evaluate(() => {
    const primary = document.querySelector<HTMLButtonElement>(
      'button[type="submit"]',
    )!;
    const secondary = [
      ...document.querySelectorAll<HTMLAnchorElement>('a[href="/workspace"]'),
    ].find((link) => link.textContent?.includes("Continue to workspace"))!;
    return (
      secondary.getBoundingClientRect().top -
      primary.getBoundingClientRect().bottom
    );
  });
  expect(actionGap).toBeGreaterThanOrEqual(12);

  await page.getByRole("button", { name: "Generate connection code" }).click();
  await expect(
    page.getByRole("button", { name: "Copy agent instructions", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".segmented, .instruction")).toHaveCount(0);
  await page.screenshot({
    path: "test-results/connect-invitation.png",
    fullPage: true,
  });
  const firstCode = (
    await page.getByTestId("connection-code").innerText()
  ).trim();
  const firstLink = await page
    .getByRole("link", { name: "Open joining page" })
    .getAttribute("href");
  const agentContext = await browser.newContext(),
    agent = await agentContext.newPage();
  await agent.goto(new URL(firstLink!, baseURL).href);
  await agent.getByLabel("Connection code").fill("000000");
  await agent.getByLabel("What should we call you?").fill("Grok Bot");
  await agent
    .getByRole("button", { name: "Join workspace", exact: true })
    .click();
  await expect(agent.locator(".error[role=alert]")).toContainText("invalid");
  await agent.getByLabel("Connection code").fill(firstCode);
  await agent
    .getByRole("button", { name: "Join workspace", exact: true })
    .click();
  await agent.waitForURL(/\/workspace\/projects\//);
  await expect(agent.locator(".project-purpose")).toContainText(
    "existing alpha signups",
  );
  await page.getByRole("button", { name: "Generate another code" }).click();
  await expect(
    page.getByRole("link", { name: "Open joining page" }),
  ).not.toHaveAttribute("href", firstLink!);
  const secondCode = (
    await page.getByTestId("connection-code").innerText()
  ).trim();
  const secondLink = await page
    .getByRole("link", { name: "Open joining page" })
    .getAttribute("href");
  const invitationId = secondLink!.split("/").at(-1);
  const enrollment = await fetch(`${baseURL}/api/agent/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invitationId, code: secondCode, name: "Codex MCP" }),
  });
  expect(enrollment.status).toBe(201);
  const credentials = await enrollment.json();
  expect(credentials.participant.projectId).toBe(projectId);
  let mcp = new Client({ name: "commons-browser-handoff", version: "1.0.0" });
  const connect = () =>
    mcp.connect(
      new StreamableHTTPClientTransport(new URL(`${baseURL}/mcp`), {
        requestInit: {
          headers: { Authorization: `Bearer ${credentials.token}` },
        },
      }),
    );
  await connect();
  const people = resultData(
    await mcp.callTool({ name: "list_participants", arguments: { projectId } }),
  );
  const grok = people.find((p: { name: string }) => p.name === "Grok Bot");
  const note = resultData(
    await mcp.callTool({
      name: "publish_note",
      arguments: {
        projectId,
        title: "Product ready for launch",
        body: "Commons is ready for launch. Product notes and ten alpha signups are shared here for the next assistant.",
        clientKey: crypto.randomUUID(),
      },
    }),
  );
  const request = resultData(
    await mcp.callTool({
      name: "create_request",
      arguments: {
        projectId,
        title: "Draft our launch post",
        body: "Use the product notes to prepare a launch post for review. Do not publish externally.",
        recipientIds: [grok.id],
        noteId: note.id,
        clientKey: crypto.randomUUID(),
      },
    }),
  );
  await mcp.close();
  mcp = new Client({ name: "commons-reconnected-client", version: "1.0.0" });
  await connect();
  await agent.reload();
  await agent
    .getByRole("link", { name: "Draft our launch post", exact: false })
    .first()
    .click();
  await expect(agent.getByRole("dialog")).toContainText("Codex MCP");
  await agent
    .getByRole("dialog")
    .getByRole("link", { name: "Product ready for launch", exact: false })
    .click();
  await expect(agent.getByRole("dialog")).toContainText("ten alpha signups");
  await agent
    .getByRole("button", { name: "Mark as read", exact: true })
    .click();
  await expect(
    agent.getByText("Marked as read", { exact: true }),
  ).toBeVisible();
  await agent.keyboard.press("Escape");
  await expect(agent.getByRole("dialog")).toHaveCount(0);
  await agent
    .getByRole("link", { name: "Draft our launch post", exact: false })
    .first()
    .click();
  await agent
    .getByRole("button", { name: "Acknowledge request", exact: true })
    .click();
  await expect(
    agent.getByRole("button", { name: "Mark complete", exact: true }),
  ).toBeVisible();
  await agent.keyboard.press("Escape");
  await agent.getByRole("link", { name: "New note", exact: true }).click();
  await agent.getByLabel("Note title").fill("Launch post for review");
  await agent
    .getByLabel("Context", { exact: true })
    .fill(
      "Launching Commons. My AI assistants now share one workspace to leave notes, pass context and pick up where another left off.",
    );
  await agent
    .getByRole("button", { name: "Publish note", exact: true })
    .click();
  await expect(
    agent.getByRole("heading", { name: "Launch post for review", exact: true }),
  ).toBeVisible();
  await agent.keyboard.press("Escape");
  await agent
    .getByRole("link", { name: "Draft our launch post", exact: false })
    .first()
    .click();
  await agent
    .getByRole("combobox", {
      name: "Link a result note (optional)",
      exact: true,
    })
    .click();
  await agent
    .getByRole("option", { name: "Launch post for review", exact: true })
    .click();
  await agent
    .getByRole("button", { name: "Mark complete", exact: true })
    .click();
  await expect(agent.getByRole("dialog")).toContainText("What came back");
  const finished = resultData(
    await mcp.callTool({
      name: "read_request",
      arguments: { requestId: request.id },
    }),
  );
  expect(finished.status).toBe("done");
  expect(finished.resultNoteId).toBeTruthy();
  const output = resultData(
    await mcp.callTool({
      name: "read_note",
      arguments: { noteId: finished.resultNoteId },
    }),
  );
  expect(output.authorName).toBe("Grok Bot");
  expect(output.body).toContain("Launching Commons");
  await agent.reload();
  await expect(agent.getByRole("dialog")).toContainText("What came back");
  await page.goto(`/workspace/projects/${projectId}?view=unread`);
  await expect(
    page
      .getByRole("navigation", { name: "Workspace", exact: true })
      .getByRole("link", { name: "Unread notes", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page
    .getByLabel("Search project notes and requests")
    .fill("Launching Commons");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.waitForURL(
    (url) =>
      url.searchParams.get("view") === "unread" &&
      url.searchParams.get("q") === "Launching Commons",
  );
  await page.reload();
  await expect(
    page.getByRole("link", { name: /Launch post for review/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Product ready for launch/ }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Clear", exact: true }).click();
  await page.waitForURL(
    (url) =>
      url.searchParams.get("view") === "unread" && !url.searchParams.has("q"),
  );
  await page.goto(`/workspace/projects/${projectId}`);
  await page.keyboard.press("Meta+k");
  const command = page.getByRole("dialog");
  await command
    .getByRole("combobox", { name: "Search project", exact: true })
    .fill("Launching Commons");
  await expect(
    command.getByRole("option", { name: /Launch post for review/ }),
  ).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Launch post for review", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.waitForURL(`${baseURL}/workspace/projects/${projectId}`);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const quickFind = page.getByRole("button", {
    name: "Open project search",
    exact: true,
  });
  await quickFind.click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("combobox", { name: "Search project", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(quickFind).toBeFocused();
  const beforeInvite = page.url();
  await page
    .getByRole("button", {
      name: "Connect an agent to this project",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Bring an agent", exact: true }),
  ).toBeVisible();
  expect(page.url()).toBe(beforeInvite);
  await expect(page.getByRole("tab")).toHaveCount(0);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Generate connection code", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Copy agent instructions", exact: true }),
  ).toBeVisible();
  expect(page.url()).toBe(beforeInvite);
  await page.screenshot({
    path: "test-results/connect-panel.png",
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: "Connect an agent to this project",
      exact: true,
    }),
  ).toBeFocused();
  await page.getByRole("link", { name: "New request", exact: true }).click();
  await page.getByLabel("What should they do?").fill("Review the launch draft");
  await page
    .getByRole("combobox", { name: "Ask an agent", exact: true })
    .fill("Grok");
  await page
    .getByRole("combobox", { name: "Ask an agent", exact: true })
    .press("Enter");
  await expect(page.locator(".mention")).toContainText("Grok Bot");
  await page.setViewportSize({ width: 390, height: 900 });
  const mentionName = page.locator(".mention-name");
  const originalName = await mentionName.textContent();
  await mentionName.evaluate((element) => {
    element.textContent = "@" + "a".repeat(60);
  });
  expect(
    await page
      .getByRole("dialog")
      .evaluate((element) => element.scrollWidth <= element.clientWidth),
  ).toBe(true);
  await mentionName.evaluate((element, text) => {
    element.textContent = text;
  }, originalName);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page
    .getByLabel("What do they need to know?")
    .fill("A final pass for clarity.");
  await page
    .getByRole("button", { name: "Create request", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Review the launch draft", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width === 390) {
      const switcher = page.getByRole("combobox", {
        name: "Switch project",
        exact: true,
      });
      await expect(switcher).toBeVisible();
      await switcher.click();
      await expect(page.getByRole("listbox")).toBeVisible();
      const firstProject = page.getByRole("option").first();
      const selectedProjectId =
        await firstProject.getAttribute("data-option-value");
      await firstProject.click();
      await page.waitForURL(`**/workspace/projects/${selectedProjectId}`);
      await page.goto(`/workspace/projects/${projectId}`);
      await page
        .getByRole("navigation", { name: "Project views" })
        .getByRole("link", { name: "Unread notes", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "Unread notes", exact: true }),
      ).toBeVisible();
      await page
        .getByRole("navigation", { name: "Project views" })
        .getByRole("link", { name: "Overview", exact: true })
        .click();
      await page.screenshot({
        path: "test-results/commons-handoff-mobile.png",
        fullPage: true,
      });
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "test-results/commons-handoff-desktop.png",
    fullPage: true,
  });
  await page.goto("/workspace/agents");
  const codexRow = page.locator(
    `[data-agent-id="${credentials.participant.id}"]`,
  );
  await codexRow.getByText("Manage access", { exact: true }).click();
  await codexRow
    .getByRole("button", { name: "Revoke access", exact: true })
    .click();
  await expect(codexRow).toContainText("Access revoked");
  await expect(
    mcp.callTool({ name: "list_projects", arguments: {} }),
  ).rejects.toThrow();
  await mcp.close();
  const grokRow = page.locator(`[data-agent-id="${grok.id}"]`);
  await grokRow.getByText("Manage access", { exact: true }).click();
  await grokRow
    .getByRole("button", { name: "Revoke access", exact: true })
    .click();
  await expect(grokRow).toContainText("Access revoked");
  await agent.reload();
  await agent.waitForURL(/\/sign-in/);
  expect(errors).toEqual([]);
  await agentContext.close();
});

test("navigation and controls keep their surfaces, spacing and mobile hit areas", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/start");
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await page.waitForURL(/\/(workspace|setup)/);
  await page.goto("/workspace/agents");
  const navigation = page.getByRole("navigation", {
    name: "Workspace actions",
    exact: true,
  });
  const agents = navigation.getByRole("link", { name: "Agents", exact: true });
  const connect = navigation.getByRole("button", {
    name: "Connect an agent",
    exact: true,
  });
  await expect(agents).toHaveAttribute("aria-current", "page");
  await expect(connect).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  const geometry = await navigation.evaluate((element) => {
    const [first, second] = [...element.children].map((child) =>
      child.getBoundingClientRect(),
    );
    return {
      gap: second.top - first.bottom,
      widthDifference: Math.abs(first.width - second.width),
      leftDifference: Math.abs(first.left - second.left),
    };
  });
  expect(geometry.gap).toBeGreaterThanOrEqual(8);
  expect(geometry.widthDifference).toBeLessThan(1);
  expect(geometry.leftDifference).toBeLessThan(1);
  await agents.hover();
  await page.locator(".sidebar-bottom").screenshot({
    path: "test-results/sidebar-agents-selected.png",
  });
  await connect.hover();
  await expect(connect).toHaveCSS("background-color", "rgb(23, 25, 29)");
  await connect.focus();
  await expect(connect).toHaveCSS("outline-offset", "-2px");
  await page.locator(".sidebar-bottom").screenshot({
    path: "test-results/sidebar-connect-hover.png",
  });
  await connect.click();
  await expect(
    page.getByRole("dialog", { name: "Bring an agent", exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/workspace\/agents$/);
  await page.keyboard.press("Escape");
  await expect(connect).toBeFocused();

  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of [
      "/workspace/agents",
      "/workspace/new",
      "/workspace/connection",
      "/setup",
      "/setup/project",
      "/connect",
      "/join",
      "/join/ended",
      "/missing-page",
    ]) {
      await page.goto(path);
      await page.locator("h1").first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      const nativeButtons = await page
        .locator("button")
        .evaluateAll((elements) =>
          elements
            .filter(
              (element) =>
                element.getClientRects().length &&
                getComputedStyle(element).appearance !== "none",
            )
            .map((element) => element.textContent?.trim()),
        );
      expect(nativeButtons, `${path} at ${width}px`).toEqual([]);
      const overflowing = await page.evaluate(() => {
        const main = document.querySelector(".main-work");
        return (
          document.documentElement.scrollWidth > innerWidth ||
          !!(main && main.scrollWidth > main.clientWidth)
        );
      });
      expect(overflowing, `${path} at ${width}px`).toBe(false);
      if (width <= 390 && path.startsWith("/workspace/")) {
        const targets = await page
          .locator(".mobile-project-nav a, .mobile-project-nav button")
          .evaluateAll((elements) =>
            elements
              .filter((element) => element.getClientRects().length)
              .map((element) => ({
                label:
                  element.textContent?.trim() ||
                  element.getAttribute("aria-label"),
                height: element.getBoundingClientRect().height,
                width: element.getBoundingClientRect().width,
              })),
          );
        for (const target of targets) {
          expect(
            target.height,
            target.label || "Mobile navigation",
          ).toBeGreaterThanOrEqual(44);
          expect(
            target.width,
            target.label || "Mobile navigation",
          ).toBeGreaterThanOrEqual(44);
        }
      }
    }
  }
});

test("agent returns in a fresh browser with a saved credential and no invitation", async ({
  browser,
  baseURL,
}) => {
  const { Pool } = await import("pg");
  const { Store } = await import("../src/lib/store");
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const store = new Store(pool, process.env.COMMONS_SECRET!);
  const owner = (
    await store.createLocalOwner(
      `return-ui-${crypto.randomUUID()}@example.test`,
      "Owner",
    )
  ).actor;
  const project = await store.createProject(
    owner,
    "Return test",
    "Keep this context across sessions.",
  );
  const invitation = await store.issueInvite(owner, project.id);
  const joined = await store.join(
    invitation.id,
    invitation.code,
    "Returning assistant",
  );
  const context = await browser.newContext({ baseURL });
  try {
    const page = await context.newPage();
    await page.goto("/return");
    await page.getByLabel("Saved agent credential").fill(joined.token);
    await page.getByRole("button", { name: "Return to workspace" }).click();
    await expect(page).toHaveURL(
      new RegExp(`/workspace/projects/${project.id}`),
    );
    await expect(page.locator(".profile")).toContainText("Returning assistant");
    await page.reload();
    await expect(page.locator(".profile")).toContainText("Returning assistant");
    const refresh = await page.evaluate(
      async () =>
        (await fetch("/api/agent/session", { method: "POST" })).status,
    );
    expect(refresh).toBe(204);
    await store.revoke(owner, joined.actor.id);
    await page.reload();
    await expect(page).toHaveURL(/sign-in/);
  } finally {
    await context.close();
    await pool.end();
  }
});

test("Google callback rejects missing or mismatched browser state", async ({ request }) => {
  for (const suffix of ["", "?state=untrusted&code=not-a-google-code"]) {
    const response = await request.get(`/auth/google/callback${suffix}`, { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(response.headers().location).toBe("http://localhost:3008/sign-in?error=google");
    expect(response.headers()["set-cookie"]).not.toContain("commons_session=");
    expect(response.headers()["cache-control"]).toBe("no-store");
  }
});
