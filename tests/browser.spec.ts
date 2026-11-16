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
  await expect(page).toHaveURL(/\/workspace$/);
  await page
    .locator(".project-heading")
    .getByRole("button", { name: "New project", exact: true })
    .click();
  const name = `CRUD ${Date.now()}`;
  await page.getByLabel("Project name", { exact: true }).fill(name);
  await page.getByLabel("Project name", { exact: true }).press("Enter");
  await page.waitForURL(/\/workspace\/projects\//);
  const projectUrl = page.url(),
    projectId = new URL(projectUrl).pathname.split("/").at(-1)!;
  await expect(
    page.getByRole("link", { name: "New request", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".project-contributions")).toHaveCount(0);
  await page.getByLabel("Project actions", { exact: true }).click();
  await page.getByRole("menuitem", { name: "Activity", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Activity" })).toBeVisible();
  await expect(page.locator(".project-activity")).toContainText(
    "created the project",
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel("Project actions", { exact: true }).click();
  await page.getByRole("menuitem", { name: "Activity", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Activity" })).toBeVisible();
  await page.getByRole("button", { name: "Close details" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.setViewportSize({ width: 1440, height: 1000 });
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
  await page.goto(`${projectUrl}?create=note`);
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
  await page.waitForLoadState("networkidle");
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
    await agentPage.waitForURL(/\/workspace/);
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
      await page.waitForLoadState("networkidle");
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
  const agents = navigation.getByRole("link", {
    name: "Agents",
    exact: true,
  });
  await expect(
    navigation.getByRole("button", { name: "Connect an agent" }),
  ).toHaveCount(0);
  const connect = page.getByRole("button", {
    name: "Bring an agent",
    exact: true,
  });
  const home = page
    .locator(".sidebar")
    .getByRole("link", { name: "Home", exact: true });
  await expect(agents).toHaveAttribute("aria-current", "page");
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
  await home.hover();
  await expect(home).toHaveCSS("background-color", "rgb(220, 226, 232)");
  await home.focus();
  await expect(home).toHaveCSS("outline-offset", "-2px");
  await page.locator(".sidebar-bottom").screenshot({
    path: "test-results/sidebar-home-hover.png",
  });
  await connect.click();
  await expect(
    page.getByRole("dialog", { name: "Connect an agent", exact: true }),
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
    await expect(page).toHaveURL(/\/workspace$/);
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
      .getByRole("link", { name: "Delete workspace", exact: true })
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
      .getByRole("link", { name: "Delete account", exact: true })
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

test("Paper workspace pages, Markdown, R2 uploads and MCP share the same private project", async ({
  page,
  browser,
  baseURL,
}) => {
  const { Pool } = await import("pg"),
    { Store } = await import("../src/lib/store");
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const store = new Store(pool, process.env.COMMONS_SECRET!);
  const owner = (await store.createLocalOwner("e2e@commons.local", "Owner"))
    .actor;
  const project = await store.createProject(
    owner,
    `Paper ${Date.now()}`,
    "One project. Shared context.",
  );
  const base = `/workspace/projects/${project.id}`;
  const invite = await store.issueInvite(owner, project.id),
    agent = await store.join(invite.id, invite.code, "Content agent");
  const client = new Client({ name: "workspace-content-e2e", version: "1" });
  const anonymous = await browser.newContext();
  try {
    await page.goto("/start");
    await page.getByRole("button", { name: "Continue with Google" }).click();
    await page.waitForURL(/\/workspace/);
    await page.goto(`${base}/pages/new`);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "New page", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("combobox", { name: "Status", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("combobox", { name: "Inside", exact: true }),
    ).toHaveCount(0);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: "test-results/page-create-mobile.png" });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page
      .getByLabel("Page title", { exact: true })
      .fill("Workspace brief");
    await expect(
      page.getByRole("textbox", { name: "Page content", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Page options", exact: true })
      .click();
    await page
      .getByRole("menuitem", { name: "Markdown source", exact: true })
      .click();
    await page
      .getByLabel("Markdown source", { exact: true })
      .fill(
        "## Rendering works\n\n- [x] Shared Markdown\n\n| Item | Details |\n| --- | --- |\n| Context | Durable |\n\n```js\nconst shared = true;\n```\n\n<script>window.unsafeMarkdown = true</script>",
      );
    await page
      .getByRole("button", { name: "Page options", exact: true })
      .click();
    await page.getByRole("menuitem", { name: "Document", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Rendering works" }),
    ).toBeVisible();
    await expect(page.locator(".document-editor table.children")).toBeVisible();
    await expect(page.locator(".document-editor .cm-editor")).toContainText(
      "const shared",
    );
    expect(await page.evaluate(() => "unsafeMarkdown" in window)).toBe(false);
    await page.getByRole("link", { name: "Done", exact: true }).click();
    await page.waitForURL(/\/pages\/[a-f0-9-]+$/);
    const pageUrl = page.url(),
      pageId = new URL(pageUrl).pathname.split("/").at(-1)!;
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: "test-results/paper-document-desktop.png",
      fullPage: true,
    });
    await page.goto(`${base}/files`);
    const image = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=",
      "base64",
    );
    await expect(
      page.getByRole("button", { name: "Choose files", exact: true }),
    ).toBeEnabled();
    await page.locator('input[type="file"]').setInputFiles({
      name: "reference.png",
      mimeType: "image/png",
      buffer: image,
    });
    await expect(page.getByRole("status")).toContainText(
      "reference.png added",
      { timeout: 30000 },
    );
    const file = (await store.listFiles(owner, project.id)).files[0];
    const download = await page.request.get(`/api/files/${file.id}?preview=1`);
    expect(download.status()).toBe(200);
    expect(download.headers()["content-type"]).toBe("image/png");
    expect(Buffer.from(await download.body())).toEqual(image);
    expect(
      (await anonymous.request.get(`${baseURL}/api/files/${file.id}`)).status(),
    ).toBe(401);
    await client.connect(
      new StreamableHTTPClientTransport(new URL(baseURL + "/mcp"), {
        requestInit: { headers: { Authorization: `Bearer ${agent.token}` } },
      }),
    );
    const read = resultData(
      await client.callTool({ name: "read_page", arguments: { pageId } }),
    );
    expect(read.title).toBe("Workspace brief");
    const mcpFile = resultData(
      await client.callTool({
        name: "upload_file",
        arguments: {
          projectId: project.id,
          name: "agent-context.md",
          contentBase64: Buffer.from(
            "# Agent context\nShared through MCP",
          ).toString("base64"),
        },
      }),
    );
    const fileRead = resultData(
      await client.callTool({
        name: "read_file",
        arguments: { fileId: mcpFile.id, includeContent: true },
      }),
    );
    expect(Buffer.from(fileRead.contentBase64, "base64").toString()).toContain(
      "Shared through MCP",
    );
    await page.reload();
    await expect(
      page.getByRole("link", { name: /agent-context.md/ }),
    ).toBeVisible();
    await page.goto(`${pageUrl}?edit=1`);
    await page
      .getByRole("button", { name: "Page options", exact: true })
      .click();
    await page
      .getByRole("menuitem", { name: "Attach a file", exact: true })
      .click();
    await page
      .getByRole("button", { name: "reference.png", exact: true })
      .click();
    await page.getByRole("link", { name: "Done", exact: true }).click();
    await page.waitForURL(/\/pages\/[a-f0-9-]+$/);
    await expect(page.locator(".markdown-content img")).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: "test-results/paper-document-mobile.png",
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page
      .getByRole("button", { name: "Open workspace navigation" })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await store.revoke(owner, agent.actor.id);
    const denied = await page.request.get(`/api/files/${mcpFile.id}`, {
      headers: { Authorization: `Bearer ${agent.token}` },
    });
    expect(denied.status()).toBe(401);
  } finally {
    await client.close();
    await anonymous.close();
    await store.deleteProject(owner, project.id, project.name);
    await pool.end();
  }
});

test("mist landing follows scroll, persists theme and respects reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(
    page.getByRole("heading", { name: /Bring your agents/ }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator("nav .brandmark")).toBeVisible();
  await expect.poll(() => page.locator('#projects img[src^="/landing/"]').evaluateAll(
    (images) => images.length === 3 && images.every((image) => {
      const img = image as HTMLImageElement;
      return img.complete && img.naturalWidth > 0;
    }),
  )).toBe(true);

  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByRole("button", { name: "Copy setup prompt" }).first().click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "Ask me for a scoped invitation",
  );
  await expect(
    page.locator("[data-logo]").filter({ has: page.locator("img") }),
  ).toHaveCount(33);
  await expect(page.locator("#projects")).toHaveAttribute(
    "data-pinned",
    "true",
  );
  await page.evaluate(() =>
    window.scrollTo(
      0,
      document.querySelector("#projects")!.getBoundingClientRect().top +
        scrollY -
        20 +
        innerHeight * 0.55,
    ),
  );
  await expect(
    page.getByRole("tab", { name: "Sunday Coffee" }),
  ).toHaveAttribute("aria-selected", "true");
  await page.evaluate(() => window.scrollBy(0, innerHeight * 0.55));
  await expect(page.getByRole("tab", { name: "Fieldnotes" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.evaluate(() => window.scrollBy(0, -innerHeight * 1.1));
  await expect(
    page.getByRole("tab", { name: /Weekend in Kyoto/ }),
  ).toHaveAttribute("aria-selected", "true");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "test-results/mist-landing-desktop.png" });
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(
    page.getByRole("heading", { name: /Bring your agents/ }),
  ).toBeVisible();
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "test-results/mist-landing-dark.png" });
  const storyHeights = await page.evaluate(async () => {
    const samples: number[] = [];
    for (let i = 0; i < 8; i++) {
      await new Promise(requestAnimationFrame);
      samples.push(
        document.querySelector("#projects")!.getBoundingClientRect().height,
      );
    }
    return samples;
  });
  expect(Math.max(...storyHeights) - Math.min(...storyHeights)).toBeLessThan(1);
  await page
    .getByRole("heading", { name: /Stop starting/ })
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: "test-results/landing-context-dark.png" });
  await page.evaluate(() => window.scrollTo(0, 0));
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: `test-results/mist-landing-mobile-${width}.png`,
    });
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("#projects")).toHaveAttribute(
    "data-pinned",
    "false",
  );
  await page.getByRole("tab", { name: "Sunday Coffee" }).click();
  await expect(
    page.getByRole("heading", { name: "A little café. A proper launch." }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Sunday Coffee" }).press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Fieldnotes" })).toBeFocused();
  const navigationErrors: string[] = [];
  page.on("pageerror", (error) => navigationErrors.push(error.message));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.locator("footer").getByRole("link", { name: "Privacy", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Privacy at Commons" })).toBeVisible();
    await page.getByRole("link", { name: "Commons", exact: true }).click();
    await expect(page.locator("#projects")).toBeVisible();
  }
  expect(navigationErrors).toEqual([]);

});

test("nested folders, list board table views and discussions work on desktop and mobile", async ({
  page,
  baseURL,
}) => {
  const { Pool } = await import("pg"),
    { Store } = await import("../src/lib/store");
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const store = new Store(pool, process.env.COMMONS_SECRET!);
  const owner = (await store.createLocalOwner("e2e@commons.local", "Owner"))
    .actor;
  const project = await store.createProject(
    owner,
    `Fieldnotes ${Date.now()}`,
    "Useful ideas, with a point of view.",
  );
  const base = `/workspace/projects/${project.id}`;
  const invitation = await store.issueInvite(owner, project.id);
  const agent = await store.join(invitation.id, invitation.code, "Muse");
  const client = new Client({ name: "collections-e2e", version: "1" });
  try {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/start");
    await page.getByRole("button", { name: "Continue with Google" }).click();
    await page.waitForURL(/\/workspace/);
    await page.goto(base);
    await page
      .locator(".sidebar .tree-label")
      .filter({ hasText: project.name })
      .click({ button: "right" });
    await page
      .getByRole("menuitem", { name: "New folder", exact: true })
      .click();
    await page.getByLabel("Name", { exact: true }).fill("First issue");
    await page
      .getByRole("button", { name: "Create folder", exact: true })
      .click();
    await page.waitForURL(/\/pages\/[a-f0-9-]+$/);
    const folderId = new URL(page.url()).pathname.split("/").at(-1)!;
    await page
      .locator(".document-actions")
      .getByRole("button", { name: "Add inside First issue" })
      .click();
    await page
      .getByRole("menuitem", { name: "New folder", exact: true })
      .click();
    await page.getByLabel("Name", { exact: true }).fill("Stories");
    await page
      .getByRole("button", { name: "Create folder", exact: true })
      .click();
    await page.waitForURL(/\/pages\/[a-f0-9-]+$/);
    const collectionUrl = page.url(),
      collectionId = new URL(collectionUrl).pathname.split("/").at(-1)!;
    expect((await store.getPage(owner, collectionId)).parentId).toBe(folderId);
    await client.connect(
      new StreamableHTTPClientTransport(new URL("/mcp", baseURL), {
        requestInit: { headers: { Authorization: `Bearer ${agent.token}` } },
      }),
    );
    const item = resultData(
      await client.callTool({
        name: "create_page",
        arguments: {
          projectId: project.id,
          title: "Opening note",
          body: "## Start with the question\n\nKeep the sources beside the work.",
          parentId: collectionId,
          status: "Drafting",
          clientKey: crypto.randomUUID(),
        },
      }),
    );
    resultData(
      await client.callTool({
        name: "create_page_comment",
        arguments: {
          pageId: item.id,
          body: "I added the research.",
          clientKey: crypto.randomUUID(),
        },
      }),
    );
    await page.reload();
    await expect(
      page
        .getByRole("navigation", { name: "Folder view" })
        .getByRole("link", { name: "List", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await page.getByRole("link", { name: "Board", exact: true }).click();
    await expect(page.locator(".collection-card")).toContainText(
      "Opening note",
    );
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "test-results/workspace-board-light.png" });
    await page.getByRole("link", { name: "Table", exact: true }).click();
    await expect(page.getByRole("table")).toContainText("Opening note");
    await page
      .getByRole("link", { name: "Opening note", exact: true })
      .last()
      .click();
    await expect(page).toHaveURL(new RegExp(`/pages/${item.id}$`));
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.getByRole("link", { name: "Discussion", exact: true }).click();
    await expect(page.getByRole("dialog")).toContainText(
      "I added the research.",
    );
    await page
      .getByLabel("Your comment", { exact: true })
      .fill("Keep both perspectives.");
    await page
      .getByRole("button", { name: "Add comment", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toContainText(
      "Keep both perspectives.",
    );
    const comments = resultData(
      await client.callTool({
        name: "list_page_comments",
        arguments: { pageId: item.id },
      }),
    );
    expect(comments.comments).toHaveLength(2);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: "test-results/workspace-discussion-mobile.png",
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "Close details" }).click();
    await page.goto(`${collectionUrl}?view=board`);
    await page.getByRole("button", { name: "Switch to dark theme" }).click();
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: "test-results/workspace-board-dark-mobile.png",
    });
    await page
      .getByRole("button", { name: "Open workspace navigation" })
      .click();
    await expect(page.getByRole("dialog")).toContainText("First issue");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("dialog")).toHaveCSS("opacity", "1");
    await page.screenshot({ path: "test-results/workspace-tree-mobile.png" });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.waitForLoadState("networkidle");
    const selectedRow = page.locator(".sidebar .tree-row[data-selected]");
    const clipped = await selectedRow.evaluate((row) =>
      [...row.querySelectorAll("button")].some(
        (button) =>
          button.getBoundingClientRect().right >
          row.getBoundingClientRect().right + 1,
      ),
    );
    expect(clipped).toBe(false);
    await page.screenshot({ path: "test-results/workspace-board-dark.png" });
  } finally {
    await client.close();
    await store.deleteProject(owner, project.id, project.name);
    await pool.end();
  }
});

test("sidebar creates projects inline and keeps compact actions accessible", async ({
  page,
}) => {
  const { Pool } = await import("pg");
  const { Store } = await import("../src/lib/store");
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const store = new Store(pool, process.env.COMMONS_SECRET!);
  const owner = (await store.createLocalOwner("e2e@commons.local", "Owner"))
    .actor;
  const created: { id: string; name: string }[] = [];
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/start");
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await page.waitForURL(/\/(workspace|setup)/);
  await page.goto("/workspace");
  try {
    const sidebar = page.locator(".sidebar");
    await expect(sidebar).not.toContainText("Workspace access");
    await expect(sidebar).not.toContainText("Workspace owner");
    await expect(
      sidebar.getByRole("link", { name: "Unread notes", exact: true }),
    ).toHaveCount(0);
    const workspaceName = await sidebar.locator(".workspace-name").innerText();
    await expect(page.locator(".workspace-header")).not.toContainText(
      workspaceName,
    );
    await page.goto("/workspace/unread");
    await expect(page).toHaveURL(/\/workspace$/);
    await expect(sidebar.locator(".profile a")).toHaveCSS("font-size", "13px");
    await expect(
      sidebar.getByRole("link", { name: "Home", exact: true }).locator("use"),
    ).toHaveAttribute("href", "/icons.svg#HouseLine");
    await expect(
      page.getByRole("button", { name: "Open project search" }),
    ).toHaveCount(0);
    await page.keyboard.press("Control+k");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    for (const width of [1440, 390]) {
      await page.goto("/workspace");
      await page.setViewportSize({ width, height: 844 });
      const mobile = width === 390;
      await page
        .locator(".project-heading")
        .getByRole("button", { name: "New project", exact: true })
        .click();
      const surface = mobile ? page.getByRole("dialog") : sidebar;
      const plus = surface.getByRole("button", {
        name: "New project",
        exact: true,
      });
      const input = surface.getByRole("textbox", {
        name: "Project name",
        exact: true,
      });
      await expect(input).toBeFocused();
      const originalUrl = page.url();
      await expect(surface.getByLabel("Project brief")).toHaveCount(0);
      await input.fill("Abandoned draft");
      await input.press("Escape");
      await expect(input).toHaveCount(0);
      await expect(plus).toBeFocused();
      await expect(page).toHaveURL(originalUrl);
      await plus.click();
      await input.fill("Outside cancelled draft");
      await surface.locator(".nav-heading").click();
      await expect(input).toHaveCount(0);
      await expect(page).toHaveURL(originalUrl);
      expect(
        (await store.listProjects(owner)).some(
          (p) => p.name === "Outside cancelled draft",
        ),
      ).toBe(false);
      await plus.click();
      await input.fill("Composing draft");
      await input.dispatchEvent("keydown", {
        key: "Enter",
        code: "Enter",
        isComposing: true,
      });
      await expect(input).toHaveValue("Composing draft");
      await expect(page).toHaveURL(originalUrl);
      await input.fill("x");
      await input.press("Enter");
      await expect(surface.getByRole("alert")).toHaveText(
        "Use at least 2 characters.",
      );
      await expect(input).toHaveValue("x");
      const name = `Inline ${width} ${Date.now()}`;
      await input.fill(name);
      if (!mobile) {
        await page.route("**/*", async (route) => {
          if (route.request().headers()["next-action"]) await route.abort();
          else await route.continue();
        });
        await input.press("Enter");
        await expect(surface.getByRole("alert")).toContainText(
          "Couldn’t create",
        );
        await expect(input).toHaveValue(name);
        await expect(input).toBeFocused();
        await page.unroute("**/*");
      }
      await page.screenshot({
        path: `test-results/sidebar-inline-${width}.png`,
      });
      await expect(surface.locator(".inline-project button")).toHaveCount(0);
      await expect(surface.locator(".inline-project")).not.toContainText(
        "Enter to create",
      );
      await input.press("Enter");
      await page.waitForURL(/\/workspace\/projects\/[^/]+$/);
      if (mobile) await expect(page.getByRole("dialog")).toBeHidden();
      const project = (await store.listProjects(owner)).filter(
        (p) => p.name === name,
      );
      expect(project).toHaveLength(1);
      expect(project[0].brief).toBe("");
      created.push(project[0]);
      await page.goto("/workspace");
      const indexRow = page
        .locator(".project-index-row")
        .filter({ has: page.getByRole("heading", { name, exact: true }) });
      await indexRow.hover();
      await expect(indexRow).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      await expect(
        indexRow.getByRole("heading", { name, exact: true }),
      ).toHaveCSS("color", "rgb(61, 73, 85)");
      await expect(indexRow.locator(".project-count")).toBeEmpty();
      await expect(indexRow).not.toContainText("Add a brief");
      await indexRow.click();
      await expect(page.locator(".workspace-breadcrumb")).toContainText(name);
      await expect(
        page.getByRole("heading", { name, exact: true }),
      ).toBeVisible();
      if (mobile)
        await page
          .getByRole("button", { name: "Open workspace navigation" })
          .click();
      const row = surface
        .locator(".tree-row")
        .filter({ has: page.getByRole("link", { name, exact: true }) });
      await expect(row.locator(".tree-actions button")).toHaveCount(1);
      const rowAction = row.getByRole("button", {
        name: `Actions for ${name}`,
      });
      await rowAction.hover();
      await expect(row).toHaveCSS("background-color", "rgb(220, 226, 232)");
      await expect(rowAction).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      await rowAction.click();
      const menu = page.getByRole("menu");
      await expect(
        menu.getByRole("menuitem", { name: "New folder", exact: true }),
      ).toBeVisible();
      await menu
        .getByRole("menuitem", { name: "New folder", exact: true })
        .click({ trial: true });
      await expect(
        menu.getByRole("menuitem", { name: "New collection", exact: true }),
      ).toHaveCount(0);
      await expect(
        menu.getByRole("menuitem", { name: "New note", exact: true }),
      ).toHaveCount(0);
      await expect(menu.getByRole("separator")).toHaveCount(1);
      const box = await menu.boundingBox();
      expect(box!.width).toBeLessThanOrEqual(224);
      expect(box!.height).toBeLessThanOrEqual(mobile ? 340 : 260);
      await page.screenshot({ path: `test-results/sidebar-menu-${width}.png` });
      await page.keyboard.press("Escape");
      await expect(
        row.getByRole("button", { name: `Actions for ${name}` }),
      ).toBeFocused();
      if (mobile) await page.keyboard.press("Escape");
      else {
        await row.click({ button: "right" });
        await expect(
          page.getByRole("menuitem", { name: "New folder", exact: true }),
        ).toBeVisible();
        await page.keyboard.press("Escape");
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page
      .getByRole("button", { name: "Connect an agent to this project" })
      .click();
    await page
      .getByRole("combobox", { name: "Agent access", exact: true })
      .click();
    await expect(
      page.getByRole("option", { name: created[1].name, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("option", {
        name: `${created[1].name} only`,
        exact: true,
      }),
    ).toHaveCount(0);
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Switch to dark theme" }).click();
    const home = sidebar.getByRole("link", {
      name: "Home",
      exact: true,
    });
    await home.hover();
    await expect(home).toHaveCSS("background-color", "rgb(48, 57, 74)");
    await page.screenshot({ path: "test-results/sidebar-polish-dark.png" });
  } finally {
    for (const project of created)
      await store.deleteProject(owner, project.id, project.name);
    await pool.end();
  }
});

test("document editing preserves Markdown and supports contextual keyboard editing", async ({
  page,
}) => {
  page.setDefaultTimeout(15000);
  const { Pool } = await import("pg"),
    { Store } = await import("../src/lib/store");
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const store = new Store(pool, process.env.COMMONS_SECRET!);
  const owner = (await store.createLocalOwner("e2e@commons.local", "Owner"))
    .actor;
  const project = await store.createProject(owner, `Editor ${Date.now()}`, "");
  const original =
    "# Existing Markdown\n\n* A source item\n\n![External reference](https://example.com/private-tracker.png)\n\n<div>Keep this HTML as text</div>\n\nFirst<br>Second<br/>Third<br />Fourth\n\n<br />\n\n`<br />`\n\n```html\n<br />\n```\n\n<br onclick=alert(1)>\n";
  const existingPage = await store.createPage(owner, project.id, {
    title: "Existing document",
    parentId: null,
    body: original,
    kind: "page",
  });
  const base = `/workspace/projects/${project.id}`;
  const docUrl = `${base}/pages/${existingPage.id}`;
  const externalRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("private-tracker"))
      externalRequests.push(request.url());
  });
  try {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/start");
    await page.getByRole("button", { name: "Continue with Google" }).click();
    await page.waitForURL(/\/workspace/);
    await page.goto(`${docUrl}?edit=1`);
    const content = page.getByRole("textbox", {
      name: "Page content",
      exact: true,
    });
    await expect(content).toBeVisible();
    await expect(
      content.getByRole("heading", { name: "Existing Markdown" }),
    ).toBeVisible();
    await expect(content.locator('span[data-type="html"]').first()).toContainText(
      "Keep this HTML",
    );
    await expect(content.locator('br[data-type="hardbreak"]')).toHaveCount(4);
    await expect(content.locator('[onclick]')).toHaveCount(0);
    await page.getByRole("link", { name: "Done", exact: true }).click();
    await page.waitForURL(docUrl);
    await expect(page.locator(".markdown-content br")).toHaveCount(4);
    await expect(page.locator(".markdown-content code")).toContainText([
      "<br />",
      "<br />",
    ]);
    await expect(page.locator(".markdown-content [onclick]")).toHaveCount(0);
    expect((await store.getPage(owner, existingPage.id)).body).toBe(original);
    expect(externalRequests).toEqual([]);
    await page.goto(`${docUrl}?edit=1`);
    await expect(content).toBeVisible();
    await content.click();
    await page.keyboard.press("ControlOrMeta+End");
    await page.keyboard.press("Enter");
    await page.keyboard.type("A new contribution");
    await page.getByRole("link", { name: "Done", exact: true }).click();
    await page.waitForURL(docUrl);
    const changed = (await store.getPage(owner, existingPage.id)).body;
    expect(changed).toContain(
      "![External reference](https://example.com/private-tracker.png)",
    );
    expect(changed).toContain("Keep this HTML as text");
    expect(changed).toContain("A new contribution");

    await page.goto(`${base}/pages/new`);
    await page
      .getByLabel("Page title", { exact: true })
      .fill("A document, not a form");
    await expect(content).toBeVisible();
    await content.click();
    await page.keyboard.type("/heading 2");
    const slash = page.locator('.milkdown-slash-menu[data-show="true"]');
    await expect(slash).toBeVisible();
    await expect(slash.getByText("Heading 2", { exact: true })).toBeVisible();
    await page.screenshot({ path: "test-results/editor-slash-desktop.png" });
    await page.keyboard.press("Enter");
    await page.keyboard.type("A shared decision");
    await expect(content.locator("h2")).toHaveText("A shared decision");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Useful context");
    for (let i = 0; i < "Useful context".length; i++)
      await page.keyboard.press("Shift+ArrowLeft");
    await page.getByRole("button", { name: "Bold", exact: true }).click();
    await expect(content.locator("strong")).toHaveText("Useful context");
    await content.press("ArrowRight");
    await content.press("End");
    await page.keyboard.press("Enter");
    await expect(content.locator("strong")).toHaveText("Useful context");
    await page.keyboard.type("/table");
    await expect(slash.getByText("Table", { exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(slash).toBeHidden();
    await expect(content.locator("strong").first()).toHaveText(
      "Useful context",
    );
    await content.locator("p").last().click();
    await page.keyboard.press("End");
    for (let i = 0; i < 6; i++) await page.keyboard.press("Backspace");
    await expect(content.locator("strong").first()).toHaveText(
      "Useful context",
    );
    await page.keyboard.type("/image");
    await expect(slash.getByText("Image", { exact: true })).toBeVisible();
    await page.keyboard.press("Enter");
    await page.locator('.milkdown input[type="file"]').setInputFiles({
      name: "editor-image.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=",
        "base64",
      ),
    });
    await expect(content.locator('img[src^="/api/files/"]')).toBeVisible();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.screenshot({ path: "test-results/editor-document-light.png" });
    await page.getByRole("button", { name: "Switch to dark theme" }).click();
    await page.screenshot({ path: "test-results/editor-document-dark.png" });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByLabel("Page title", { exact: true })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({ path: "test-results/editor-document-mobile.png" });
    await page.getByRole("link", { name: "Done", exact: true }).click();
    await page.waitForURL(/\/pages\/[a-f0-9-]+$/);
    const createdId = new URL(page.url()).pathname.split("/").at(-1)!;
    const saved = await store.getPage(owner, createdId);
    expect(saved.body).toContain("## A shared decision");
    expect(saved.body).toContain("**Useful context**");
    await expect(page.locator(".markdown-content strong")).toHaveText(
      "Useful context",
    );
  } finally {
    await store.deleteProject(owner, project.id, project.name);
    await pool.end();
  }
});

test("page autosave queues edits, survives reload and preserves conflicts", async ({
  page,
  browser,
  baseURL,
}) => {
  const { Pool } = await import("pg"),
    { Store } = await import("../src/lib/store");
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const store = new Store(pool, process.env.COMMONS_SECRET!);
  const owner = (await store.createLocalOwner("e2e@commons.local", "Owner"))
    .actor;
  const project = await store.createProject(
    owner,
    `Autosave ${Date.now()}`,
    "",
  );
  const base = `/workspace/projects/${project.id}`;
  const endpoint = `**/api/projects/${project.id}/pages`;
  try {
    await page.goto("/start");
    await page.getByRole("button", { name: "Continue with Google" }).click();
    await page.waitForURL(/\/workspace/);
    await page.goto(`${base}/pages/new`);
    await expect(
      page.getByRole("textbox", { name: "Page content", exact: true }),
    ).toBeVisible();
    expect((await store.listPages(owner, project.id)).pages).toHaveLength(0);
    await page
      .getByLabel("Page title", { exact: true })
      .fill("An automatically saved page");
    await page.getByLabel("Page title", { exact: true }).press("Enter");
    await expect(
      page.getByRole("textbox", { name: "Page content", exact: true }),
    ).toBeFocused();
    await page.keyboard.type("First contribution");
    await expect(page).toHaveURL(/\/pages\/[a-f0-9-]+\?edit=1$/);
    await expect(page.locator("[data-autosave-status]")).toHaveText("Saved");
    await expect(
      page.locator(".sidebar").getByRole("link", {
        name: "An automatically saved page",
        exact: true,
      }),
    ).toBeVisible();
    const id = new URL(page.url()).pathname.split("/").at(-1)!;
    await expect
      .poll(async () => (await store.getPage(owner, id)).body)
      .toContain("First contribution");
    await page.reload();
    await expect(
      page.getByRole("textbox", { name: "Page content", exact: true }),
    ).toContainText("First contribution");
    await page
      .getByRole("button", { name: "Page options", exact: true })
      .click();
    const item = page.getByRole("menuitem", {
      name: "Markdown source",
      exact: true,
    });
    await expect(item).toHaveCSS("padding-left", "10px");
    await item.click();
    const source = page.getByLabel("Markdown source", { exact: true });
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let delayed = false;
    await page.route(endpoint, async (route) => {
      if (!delayed) {
        delayed = true;
        const response = await route.fetch();
        await gate;
        await route.fulfill({ response });
      } else await route.continue();
    });
    await source.fill("A slow first save");
    await expect.poll(() => delayed).toBe(true);
    await source.fill("A newer edit while the first response is delayed");
    release();
    await expect
      .poll(async () => (await store.getPage(owner, id)).body)
      .toBe("A newer edit while the first response is delayed");
    await expect(page.locator("[data-autosave-status]")).toHaveText("Saved");
    await page.unroute(endpoint);

    await page.route(endpoint, (route) => route.abort("failed"));
    await source.fill("Recover this draft after a failed save");
    await expect(page.locator("[data-autosave-status]")).toHaveText(
      "Not saved",
    );
    page.once("dialog", (dialog) => dialog.accept());
    await page.reload();
    await expect(
      page.getByRole("textbox", { name: "Page content", exact: true }),
    ).toContainText("Recover this draft after a failed save");
    await expect(page.locator("[data-autosave-status]")).toHaveText(
      "Not saved",
    );
    await page.unroute(endpoint);
    await page.getByRole("button", { name: "Retry save" }).click();
    await expect(page.locator("[data-autosave-status]")).toHaveText("Saved");
    expect((await store.listPages(owner, project.id)).pages).toHaveLength(1);
    await page
      .getByRole("button", { name: "Page options", exact: true })
      .click();
    await page
      .getByRole("menuitem", { name: "Markdown source", exact: true })
      .click();
    await page.route(endpoint, async (route) => {
      await route.fetch();
      await route.abort("failed");
    });
    await source.fill("The server saved this but the acknowledgement was lost");
    await expect(page.locator("[data-autosave-status]")).toHaveText(
      "Not saved",
    );
    page.once("dialog", (dialog) => dialog.accept());
    await page.reload();
    await expect(
      page.getByRole("textbox", { name: "Page content", exact: true }),
    ).toContainText("The server saved this but the acknowledgement was lost");
    await expect(page.locator("[data-autosave-status]")).toHaveText("Saved");
    await expect(
      page.getByRole("link", { name: "Compare latest page" }),
    ).toHaveCount(0);
    await page.unroute(endpoint);
    const saved = await store.getPage(owner, id);
    await store.updatePage(
      owner,
      id,
      {
        title: saved.title,
        body: "Another contributor changed this page",
        parentId: null,
      },
      saved.version,
    );
    await page
      .getByRole("button", { name: "Page options", exact: true })
      .click();
    await page
      .getByRole("menuitem", { name: "Markdown source", exact: true })
      .click();
    await source.fill("My draft must not overwrite their work");
    await expect(
      page.getByRole("link", { name: "Compare latest page" }),
    ).toBeVisible();
    expect((await store.getPage(owner, id)).body).toBe(
      "Another contributor changed this page",
    );
    await expect(source).toHaveValue("My draft must not overwrite their work");
    await expect(page.getByRole("button", { name: "Retry save" })).toHaveCount(
      0,
    );
    const response = await page.request.post(
      `${baseURL}/api/projects/${project.id}/pages`,
      {
        headers: { origin: "https://untrusted.example" },
        data: {
          id,
          version: saved.version,
          clientKey: crypto.randomUUID(),
          draft: { title: "No", body: "No", parentId: null, status: "Idea" },
        },
      },
    );
    expect(response.status()).toBe(403);
    const anonymous = await browser.newContext();
    const denied = await anonymous.request.post(
      `${baseURL}/api/projects/${project.id}/pages`,
      { data: {} },
    );
    expect(denied.status()).toBe(401);
    await anonymous.close();
    const invite = await store.issueInvite(owner, project.id);
    const agent = await store.join(
      invite.id,
      invite.code,
      "Read-only author check",
    );
    const agentContext = await browser.newContext();
    await agentContext.addCookies([
      {
        name: "commons_session",
        value: agent.token,
        url: baseURL!,
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    const unauthorizedEdit = await agentContext.request.post(
      `${baseURL}/api/projects/${project.id}/pages`,
      {
        data: {
          id,
          version: saved.version + 1,
          clientKey: crypto.randomUUID(),
          draft: {
            title: saved.title,
            body: "Another contributor changed this page",
            parentId: null,
            status: "Idea",
          },
        },
      },
    );
    expect(unauthorizedEdit.status()).toBe(403);
    await agentContext.close();
  } finally {
    await store.deleteProject(owner, project.id, project.name);
    await pool.end();
  }
});

test("sidebar collapse and contextual uploads preserve the document and private images", async ({
  page,
  context,
}) => {
  const { Pool } = await import("pg");
  const { Store } = await import("../src/lib/store");
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const store = new Store(pool, process.env.COMMONS_SECRET!);
  const owner = (await store.createLocalOwner("e2e@commons.local", "Owner"))
    .actor;
  const project = await store.createProject(
    owner,
    `Inline media ${Date.now()}`,
    "",
  );
  const png =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=";
  const base = `/workspace/projects/${project.id}`;
  try {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/start");
    await page.getByRole("button", { name: "Continue with Google" }).click();
    await page.waitForURL(/\/workspace/);
    await page.goto(`${base}/pages/new`);
    await page
      .getByRole("button", { name: "Hide sidebar", exact: true })
      .click();
    await expect(page.locator("#workspace-sidebar")).toBeHidden();
    await page.reload();
    await expect(page.locator("#workspace-sidebar")).toBeHidden();
    await page
      .getByRole("button", { name: "Show sidebar", exact: true })
      .click();
    await expect(page.locator("#workspace-sidebar")).toBeVisible();
    await expect(
      page
        .locator(".sidebar")
        .getByRole("link", { name: "Agents", exact: true }),
    ).toBeVisible();
    await expect(
      page
        .locator(".sidebar")
        .getByRole("link", { name: "Explorer", exact: true }),
    ).toHaveCount(0);
    const content = page.getByRole("textbox", {
      name: "Page content",
      exact: true,
    });
    await expect(content).toBeVisible();
    await page
      .getByLabel("Page title", { exact: true })
      .fill("Pasted research");
    await content.click();
    await page.keyboard.type("Keep this paragraph.");
    await page.keyboard.press("Enter");
    await content.evaluate((element, png) => {
      const data = new DataTransfer();
      data.items.add(
        new File(
          [Uint8Array.from(atob(png), (c) => c.charCodeAt(0))],
          "clipboard.png",
          { type: "image/png" },
        ),
      );
      data.setData(
        "text/html",
        '<img src="https://example.com/copied-image.png">',
      );
      element.dispatchEvent(
        new ClipboardEvent("paste", {
          bubbles: true,
          cancelable: true,
          clipboardData: data,
        }),
      );
    }, png);
    const images = content.locator('img[src^="/api/files/"]');
    await expect(images).toHaveCount(1);
    await expect
      .poll(() =>
        images
          .first()
          .evaluate((image) => (image as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
    await expect(page.locator("[data-autosave-status]")).toHaveText("Saved");
    const docUrl = page.url();
    await page.reload();
    await expect(images).toHaveCount(1);
    await expect(content).toContainText("Keep this paragraph.");
    await content.evaluate((element) => {
      const data = new DataTransfer();
      data.items.add(
        new File(["Research evidence"], "research.txt", { type: "text/plain" }),
      );
      const rect = element.getBoundingClientRect();
      element.dispatchEvent(
        new DragEvent("drop", {
          bubbles: true,
          cancelable: true,
          dataTransfer: data,
          clientX: rect.x + 30,
          clientY: rect.bottom - 5,
        }),
      );
    });
    await expect(
      content.getByRole("link", { name: "research.txt" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Page options" }).click();
    await page
      .getByRole("menuitem", { name: "Attach a file", exact: true })
      .click();
    await page
      .locator('.editor-file-picker input[type="file"]')
      .setInputFiles({
        name: "attached.png",
        mimeType: "image/png",
        buffer: Buffer.from(png, "base64"),
      });
    await expect(images).toHaveCount(2);
    await expect(page).toHaveURL(docUrl);
    expect(context.pages()).toHaveLength(1);
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await expect(page.locator("[data-autosave-status]")).toHaveText("Saved");
    await page
      .locator(".sidebar")
      .getByRole("button", { name: `Actions for ${project.name}`, exact: true })
      .click();
    await page
      .getByRole("menuitem", { name: "Upload or import", exact: true })
      .click();
    const dialog = page.getByRole("dialog", { name: "Upload files" });
    await expect(dialog).toBeVisible();
    await dialog
      .locator('input[type="file"]')
      .setInputFiles({
        name: "project.png",
        mimeType: "image/png",
        buffer: Buffer.from(png, "base64"),
      });
    await expect(dialog.getByRole("status")).toContainText("project.png added");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(docUrl);
    await expect(images).toHaveCount(2);
    await page.screenshot({ path: "test-results/inline-media-desktop.png" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page
      .getByRole("button", { name: "Open workspace navigation" })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({ path: "test-results/inline-media-mobile.png" });
    await page.goto(`/workspace/projects/${project.id}`);
    const contents = page.locator(".unified-content");
    await expect(contents.locator(".context-row")).toHaveCount(1);
    await expect(contents.getByRole("link")).toHaveAttribute(
      "href",
      new URL(docUrl).pathname,
    );
    await expect(contents).not.toContainText("project.png");
    await expect(contents).not.toContainText("attached.png");
    expect(
      (await store.listFiles(owner, project.id)).files.length,
    ).toBeGreaterThan(0);

  } finally {
    await store.deleteProject(owner, project.id, project.name);
    await pool.end();
  }
});

test("workspace omits Explorer and redirects old graph links", async ({ page }) => {
  await page.goto("/start");
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await page.waitForURL(/\/workspace/);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/workspace/agents");
    await expect(page.getByRole("heading", { name: "Agents", exact: true })).toBeVisible();
    await expect(page.locator('a[href="/workspace/graph"]')).toHaveCount(0);
    await expect(page.locator('nav[aria-label="Workspace actions"] a[href="/workspace/settings"]')).toHaveCount(1);
    await page.goto("/workspace/graph?project=retired");
    await expect(page).toHaveURL(/\/workspace$/);
    await expect(page.getByRole("heading", { name: "Projects", exact: true })).toBeVisible();
  }
});
