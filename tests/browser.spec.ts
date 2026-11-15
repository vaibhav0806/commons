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
    name: "Agents & access",
    exact: true,
  });
  await expect(
    navigation.getByRole("button", { name: "Connect an agent" }),
  ).toHaveCount(0);
  const connect = page.getByRole("button", {
    name: "Bring an agent",
    exact: true,
  });
  const unread = page
    .locator(".sidebar")
    .getByRole("link", { name: "Unread notes", exact: true });
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
  await unread.hover();
  await expect(unread).toHaveCSS("background-color", "rgb(220, 226, 232)");
  await unread.focus();
  await expect(unread).toHaveCSS("outline-offset", "-2px");
  await page.locator(".sidebar-bottom").screenshot({
    path: "test-results/sidebar-unread-hover.png",
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
    await page
      .getByLabel("Page title", { exact: true })
      .fill("Workspace brief");
    await page
      .getByLabel("Page content", { exact: true })
      .fill(
        "## Rendering works\n\n- [x] Shared Markdown\n\n| Item | Details |\n| --- | --- |\n| Context | Durable |\n\n```js\nconst shared = true;\n```\n\n<script>window.unsafeMarkdown = true</script>",
      );
    await page.getByRole("button", { name: "Preview", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Rendering works" }),
    ).toBeVisible();
    await expect(page.locator(".markdown-table table")).toBeVisible();
    await expect(page.locator(".markdown-content pre")).toContainText(
      "const shared",
    );
    expect(await page.evaluate(() => "unsafeMarkdown" in window)).toBe(false);
    await page.getByRole("button", { name: "Save page", exact: true }).click();
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
      .getByRole("button", { name: "Insert block", exact: true })
      .click();
    await page
      .getByRole("button", { name: "File or image", exact: true })
      .click();
    await page
      .getByRole("button", { name: "reference.png", exact: true })
      .click();
    await page.getByRole("button", { name: "Save page", exact: true }).click();
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
    page.getByRole("heading", { name: /Your next idea/ }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
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
        innerHeight * 1.3,
    ),
  );
  await expect(page.getByRole("tab", { name: "Reading room" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.evaluate(() => window.scrollBy(0, innerHeight));
  await expect(page.getByRole("tab", { name: "Fieldnotes" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.evaluate(() => window.scrollBy(0, -innerHeight * 2));
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
    page.getByRole("heading", { name: /Your next idea/ }),
  ).toBeVisible();
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "test-results/mist-landing-dark.png" });
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
  await page.getByRole("tab", { name: "Reading room" }).click();
  await expect(
    page.getByRole("heading", { name: "Follow a thought a little further." }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Reading room" }).press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Fieldnotes" })).toBeFocused();
});

test("nested folder, collection views and discussions work on desktop and mobile", async ({
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
      .getByRole("menuitem", { name: "New collection", exact: true })
      .click();
    await page.getByLabel("Name", { exact: true }).fill("Stories");
    await page
      .getByRole("button", { name: "Create collection", exact: true })
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
    await page.goto(collectionUrl);
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
      await page.setViewportSize({ width, height: 844 });
      const mobile = width === 390;
      if (mobile)
        await page
          .getByRole("button", { name: "Open workspace navigation" })
          .click();
      const surface = mobile ? page.getByRole("dialog") : sidebar;
      const plus = surface.getByRole("button", {
        name: "New project",
        exact: true,
      });
      await plus.click();
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
      if (mobile) {
        for (const button of await surface
          .locator(".inline-project button")
          .all()) {
          const box = await button.boundingBox();
          expect(box!.height).toBeGreaterThanOrEqual(44);
          expect(box!.width).toBeGreaterThanOrEqual(44);
        }
        await surface
          .getByRole("button", { name: "Create project", exact: true })
          .click();
      } else await input.press("Enter");
      await page.waitForURL(/\/workspace\/projects\/[^/]+$/);
      if (mobile) await expect(page.getByRole("dialog")).toBeHidden();
      const project = (await store.listProjects(owner)).filter(
        (p) => p.name === name,
      );
      expect(project).toHaveLength(1);
      expect(project[0].brief).toBe("");
      created.push(project[0]);
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
      await row.getByRole("button", { name: `Actions for ${name}` }).click();
      const menu = page.getByRole("menu");
      await expect(
        menu.getByRole("menuitem", { name: "New folder", exact: true }),
      ).toBeVisible();
      await menu
        .getByRole("menuitem", { name: "New folder", exact: true })
        .click({ trial: true });
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
    await page.getByRole("button", { name: "Switch to dark theme" }).click();
    const unread = sidebar.getByRole("link", {
      name: "Unread notes",
      exact: true,
    });
    await unread.hover();
    await expect(unread).toHaveCSS("background-color", "rgb(48, 57, 74)");
    await page.screenshot({ path: "test-results/sidebar-polish-dark.png" });
  } finally {
    for (const project of created)
      await store.deleteProject(owner, project.id, project.name);
    await pool.end();
  }
});
