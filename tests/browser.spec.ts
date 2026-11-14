import { test, expect } from "@playwright/test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

function resultData(result: Awaited<ReturnType<Client["callTool"]>>) {
  expect(result.isError).not.toBe(true);
  const content = result.content as { type: string; text?: string }[];
  return JSON.parse(content.find((c) => c.type === "text")!.text!);
}
test("owner and independent agent share, edit and delete context with real CRUD controls", async ({
  page,
  browser,
  baseURL,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/start");
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await page.waitForURL(/\/(workspace|setup)/);
  await page.goto("/workspace/new");
  const name = `CRUD ${Date.now()}`;
  await page.getByLabel("Project name", { exact: true }).fill(name);
  await page
    .getByLabel("Project brief", { exact: true })
    .fill("Context for our agents.");
  await page
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  await page.waitForURL(/\/workspace\/projects\//);
  const projectUrl = page.url(),
    projectId = new URL(projectUrl).pathname.split("/").at(-1)!;
  await expect(
    page.getByRole("link", { name: "New request", exact: true }),
  ).toHaveCount(0);
  await page.getByLabel("Project actions", { exact: true }).click();
  await page
    .getByRole("menuitem", { name: "Edit project", exact: true })
    .click();
  await page
    .getByLabel("Project name", { exact: true })
    .fill(`${name} renamed`);
  await page.getByRole("button", { name: "Save project", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: `${name} renamed`, exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "New note", exact: true }).click();
  await page.getByLabel("Title", { exact: true }).fill("Shared context");
  await page
    .getByRole("textbox", { name: "Context", exact: true })
    .fill("The first context.");
  await page
    .getByRole("button", { name: "Add reference", exact: true })
    .click();
  await page.getByLabel("Label 1").fill("Documentation");
  await page.getByLabel("URL 1").fill("https://example.com/docs");
  await page.getByRole("button", { name: "Share note", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Shared context", exact: true }),
  ).toBeVisible();
  const noteId = new URL(page.url()).searchParams.get("note")!;
  await page.getByRole("link", { name: "Edit note", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Context", exact: true })
    .fill("The revised context.");
  await page.getByRole("button", { name: "Save note", exact: true }).click();
  await expect(page.locator(".document-body")).toHaveText(
    "The revised context.",
  );
  await expect(page.locator(".detail-intro")).toContainText("Edited");
  await page.screenshot({ path: "test-results/crud-note-desktop.png" });
  await page.keyboard.press("Escape");

  const { Pool } = await import("pg"),
    { Store } = await import("../src/lib/store");
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const store = new Store(pool, process.env.COMMONS_SECRET!);
  const owner = (await store.createLocalOwner("e2e@commons.local", "Owner"))
    .actor;
  const invite = await store.issueInvite(owner, projectId);
  const agent = await store.join(invite.id, invite.code, "CRUD assistant");
  const context = await browser.newContext({ baseURL });
  const client = new Client({ name: "crud-browser-test", version: "1" });
  try {
    await client.connect(
      new StreamableHTTPClientTransport(new URL(baseURL + "/mcp"), {
        requestInit: { headers: { Authorization: `Bearer ${agent.token}` } },
      }),
    );
    const tools = await client.listTools();
    expect(tools.tools.some((t) => t.name.includes("request"))).toBe(false);
    const own = resultData(
      await client.callTool({
        name: "publish_note",
        arguments: {
          projectId,
          title: "Agent contribution",
          body: "Agent context",
          clientKey: crypto.randomUUID(),
        },
      }),
    );
    resultData(
      await client.callTool({
        name: "edit_note",
        arguments: {
          noteId: own.id,
          version: own.version,
          title: "Agent contribution",
          body: "Updated through MCP",
        },
      }),
    );
    const agentPage = await context.newPage();
    await agentPage.goto("/return");
    await agentPage.getByLabel("Saved agent credential").fill(agent.token);
    await agentPage
      .getByRole("button", { name: "Return to workspace" })
      .click();
    await agentPage.waitForURL(/\/workspace\/projects\//);
    await agentPage.goto(`${projectUrl}?note=${noteId}`);
    await expect(
      agentPage.getByRole("link", { name: "Edit note", exact: true }),
    ).toHaveCount(0);
    await agentPage.goto(`${projectUrl}?note=${own.id}`);
    await expect(agentPage.locator(".document-body")).toHaveText(
      "Updated through MCP",
    );
    await agentPage
      .getByRole("link", { name: "Edit note", exact: true })
      .click();
    await agentPage
      .getByRole("textbox", { name: "Context", exact: true })
      .fill("Updated in browser");
    await agentPage
      .getByRole("button", { name: "Save note", exact: true })
      .click();
    await expect(agentPage.locator(".document-body")).toHaveText(
      "Updated in browser",
    );
    expect(
      resultData(
        await client.callTool({
          name: "read_note",
          arguments: { noteId: own.id },
        }),
      ).body,
    ).toBe("Updated in browser");
    await page.goto(`/workspace/agents?agent=${agent.actor.id}`);
    await page
      .getByLabel("Agent name", { exact: true })
      .fill("Renamed assistant");
    await page.getByRole("button", { name: "Save agent", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Renamed assistant", exact: true }),
    ).toBeVisible();
    await page.goto("/workspace/settings");
    await page.getByLabel("Display name", { exact: true }).fill("CRUD Owner");
    await page
      .getByRole("button", { name: "Save profile", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Saved");
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto("/workspace/settings?tab=connections");
      await expect(
        page.getByRole("heading", { name: "Your sessions and credentials" }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
      ).toBe(false);
      await page.screenshot({
        path: `test-results/crud-settings-${width}.png`,
      });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`${projectUrl}?note=${noteId}`);
    await page.getByRole("link", { name: "Delete note", exact: true }).click();
    await page
      .getByRole("button", { name: "Delete note", exact: true })
      .click();
    await expect(page).toHaveURL(projectUrl);
    await expect(
      page.locator(".row-copy strong").filter({ hasText: "Shared context" }),
    ).toHaveCount(0);
    await page.getByLabel("Project actions", { exact: true }).click();
    await page
      .getByRole("menuitem", { name: "Delete project", exact: true })
      .click();
    await page
      .getByLabel(`Type ${name} renamed to confirm`, { exact: true })
      .fill(`${name} renamed`);
    await page
      .getByRole("button", { name: "Delete project", exact: true })
      .click();
    await expect(page).not.toHaveURL(new RegExp(projectId));
    await expect
      .poll(
        async () =>
          (
            await pool.query("SELECT count(*) FROM projects WHERE id=$1", [
              projectId,
            ])
          ).rows[0].count,
      )
      .toBe(0);
    await agentPage.reload();
    await expect(agentPage).toHaveURL(/sign-in/);
  } finally {
    await client.close();
    await context.close();
    await pool.end();
  }
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
      "/workspace/settings",
      "/workspace/settings?tab=connections",
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

test("Google callback rejects missing or mismatched browser state", async ({
  request,
}) => {
  for (const suffix of ["", "?state=untrusted&code=not-a-google-code"]) {
    const response = await request.get(`/auth/google/callback${suffix}`, {
      maxRedirects: 0,
    });
    expect(response.status()).toBe(307);
    expect(response.headers().location).toBe(
      "http://localhost:3008/sign-in?error=google",
    );
    expect(response.headers()["set-cookie"]).not.toContain("commons_session=");
    expect(response.headers()["cache-control"]).toBe("no-store");
  }
});

test("settings cancel invitations, revoke sessions and delete workspace/account", async ({
  browser,
  baseURL,
}) => {
  const { Pool } = await import("pg"),
    { Store } = await import("../src/lib/store");
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const store = new Store(pool, process.env.COMMONS_SECRET!);
  const login = await store.createLocalOwner(
    `settings-${crypto.randomUUID()}@example.test`,
    "Settings Owner",
  );
  const workspace = await store.getWorkspace(login.actor);
  const project = await store.createProject(
    login.actor,
    "Settings fixture",
    "",
  );
  const invitation = await store.issueInvite(login.actor, project.id);
  await store.createLocalOwner(login.actor.email!, "Settings Owner");
  const context = await browser.newContext({ baseURL });
  await context.addCookies([
    {
      name: "commons_session",
      value: login.token,
      url: baseURL!,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  const page = await context.newPage();
  try {
    await page.goto("/workspace/settings?tab=connections");
    await page
      .getByRole("button", { name: "Cancel invitation", exact: true })
      .click();
    await expect(
      page.getByText("No pending invitations.", { exact: true }),
    ).toBeVisible();
    await expect
      .poll(async () =>
        (await store.listInvitations(login.actor)).some(
          (i) => i.id === invitation.id,
        ),
      )
      .toBe(false);
    await page
      .getByRole("button", { name: "Sign out other sessions", exact: true })
      .click();
    await expect(
      page.getByRole("button", {
        name: "Sign out other sessions",
        exact: true,
      }),
    ).toHaveCount(0);
    await page.getByRole("link", { name: "Workspace", exact: true }).click();
    await page
      .getByLabel("Workspace name", { exact: true })
      .fill("Disposable workspace");
    await page
      .getByRole("button", { name: "Save workspace", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Saved");
    await page
      .getByRole("link", { name: "Delete workspace…", exact: true })
      .click();
    await page
      .getByLabel("Type Disposable workspace to confirm", { exact: true })
      .fill("Disposable workspace");
    await page
      .getByRole("button", { name: "Delete workspace", exact: true })
      .click();
    await expect(page).toHaveURL(/\/setup$/);
    const actor = await store.authenticate(login.token);
    expect(actor.workspaceId).not.toBe(workspace.id);
    expect(await store.listProjects(actor)).toHaveLength(0);
    await page.goto("/workspace/settings");
    await page
      .getByRole("link", { name: "Delete account…", exact: true })
      .click();
    await page
      .getByLabel("Type DELETE to confirm", { exact: true })
      .fill("DELETE");
    await page
      .getByRole("button", { name: "Delete account", exact: true })
      .click();
    await expect(page).toHaveURL(baseURL + "/");
    expect(await context.cookies()).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "commons_session" }),
      ]),
    );
  } finally {
    await context.close();
    await pool.end();
  }
});
