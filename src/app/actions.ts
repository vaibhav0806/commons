"use server";

import { googleConfigured } from "@/lib/google-auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { getStore } from "@/lib/db";
import { CommonsError, type PageKind, type PageStatus } from "@/lib/store";
import {
  allowMockSignIn,
  currentParticipant,
  requireParticipant,
  sessionCookie,
  setSession,
} from "@/lib/session";

export type ActionState = {
  error?: string;
  success?: string;
  code?: string;
  invitationId?: string;
  inviteScope?: string;
  expiresAt?: number;
  token?: string;
};
const field = (data: FormData, name: string) => String(data.get(name) ?? "");
function pageBody(data: FormData): string {
  const encoded = data.get("bodyJson");
  return typeof encoded === "string"
    ? JSON.parse(encoded)
    : field(data, "body");
}
function noteReferences(data: FormData) {
  const urls = data.getAll("referenceUrl").map(String);
  const labels = data.getAll("referenceLabel").map(String);
  return urls
    .map((url, i) => ({
      url: url.trim(),
      label: labels[i]?.trim() || "Reference",
    }))
    .filter((r) => r.url);
}
function errorState(error: unknown): ActionState {
  if (error instanceof CommonsError) return { error: error.message };
  if (error instanceof ZodError)
    return {
      error: error.issues[0]?.message || "Check the form and try again.",
    };
  console.error(
    "Commons operation failed",
    error instanceof Error ? error.name : "Unknown error",
  );
  return { error: "That couldn’t be saved. Please try again." };
}
export async function mockSignIn(): Promise<ActionState> {
  try {
    await allowMockSignIn();
    if (await currentParticipant())
      return { error: "Sign out of this session before switching identities." };
    const result = await getStore().createLocalOwner(
      process.env.COMMONS_OWNER_EMAIL || "vaibhav@commons.local",
      process.env.COMMONS_OWNER_NAME || "Vaibhav",
    );
    await setSession(result.token);
  } catch (error) {
    return errorState(error);
  }
  const actor = await requireParticipant();
  redirect(
    (await getStore().listProjects(actor)).length ? "/workspace" : "/setup",
  );
}
export async function testOwnerSignIn(
  _previous: ActionState,
  data: FormData,
): Promise<ActionState> {
  try {
    if (
      googleConfigured() ||
      process.env.COMMONS_MOCK_AUTH === "true" ||
      !process.env.COMMONS_TEST_OWNER_KEY_HASH
    )
      throw new CommonsError("Private testing sign-in is not enabled.", 403);
    if (await currentParticipant())
      throw new CommonsError("Sign out before switching identities.");
    const joined = await getStore().signInTestOwner(
      field(data, "accessKey"),
      process.env.COMMONS_TEST_OWNER_KEY_HASH,
      process.env.COMMONS_OWNER_EMAIL!,
      process.env.COMMONS_OWNER_NAME || "Owner",
    );
    await setSession(joined.token);
  } catch (error) {
    return errorState(error);
  }
  redirect("/workspace");
}
export async function resumeAgent(
  _previous: ActionState,
  data: FormData,
): Promise<ActionState> {
  try {
    if (await currentParticipant())
      throw new CommonsError(
        "This browser already has a session. Open your workspace or sign out first.",
      );
    const joined = await getStore().resumeAgent(
      field(data, "credential").trim(),
    );
    await setSession(joined.token, true);
  } catch (error) {
    return errorState(error);
  }
  redirect("/workspace");
}
export async function joinWorkspace(
  _previous: ActionState,
  data: FormData,
): Promise<ActionState> {
  try {
    if (await currentParticipant())
      return {
        error:
          "You already have a Commons session. Sign out or use a separate browser profile to join as another agent.",
      };
    const invitationId =
      field(data, "invitationId") ||
      new URL(field(data, "invitationLink")).pathname
        .split("/")
        .filter(Boolean)
        .at(-1) ||
      "";
    const joined = await getStore().join(
      invitationId,
      field(data, "code"),
      field(data, "name"),
    );
    await setSession(joined.token, true);
  } catch (error) {
    return errorState(error);
  }
  redirect("/workspace?welcome=1");
}
export async function createSidebarProject(name: string): Promise<{
  projectId?: string;
  error?: string;
}> {
  const actor = await requireParticipant();
  try {
    const project = await getStore().createProject(actor, name, "");
    revalidatePath("/workspace", "layout");
    return { projectId: project.id };
  } catch (error) {
    return errorState(error);
  }
}

export async function workspaceAction(
  _previous: ActionState,
  data: FormData,
): Promise<ActionState> {
  const actor = await requireParticipant(),
    store = getStore();
  let destination: string | undefined;
  try {
    const projectId = field(data, "projectId");
    switch (field(data, "operation")) {
      case "workspace":
        await store.renameWorkspace(actor, field(data, "name"));
        destination = "/setup/project";
        break;
      case "project": {
        const project = await store.createProject(
          actor,
          field(data, "name"),
          field(data, "brief"),
        );
        destination = field(data, "onboarding")
          ? `/connect?project=${project.id}`
          : `/workspace/projects/${project.id}`;
        break;
      }
      case "invite": {
        const invite = await store.issueInvite(actor, projectId || null);
        return {
          code: invite.code,
          invitationId: invite.id,
          inviteScope: invite.projectId || "",
          expiresAt: invite.expiresAt,
        };
      }
      case "delete-file": {
        const file = await store.deleteFile(actor, field(data, "fileId"));
        destination = `/workspace/projects/${file.projectId}/files`;
        break;
      }
      case "page-comment": {
        const comment = await store.createComment(
          actor,
          field(data, "pageId"),
          field(data, "body"),
          field(data, "clientKey"),
        );
        destination = `/workspace/projects/${comment.projectId}/pages/${comment.pageId}?discussion=1`;
        break;
      }
      case "delete-comment": {
        const comment = await store.deleteComment(
          actor,
          field(data, "commentId"),
        );
        destination = `/workspace/projects/${comment.projectId}/pages/${comment.pageId}?discussion=1`;
        break;
      }
      case "page-status": {
        const page = await store.getPage(actor, field(data, "pageId"));
        await store.updatePage(
          actor,
          page.id,
          {
            title: page.title,
            body: page.body,
            parentId: page.parentId,
            status: field(data, "status") as PageStatus,
          },
          Number(field(data, "version")),
        );
        destination = `/workspace/projects/${page.projectId}/pages/${page.parentId || page.id}`;
        break;
      }
      case "page": {
        const page = await store.createPage(
          actor,
          projectId,
          {
            title: field(data, "title"),
            body: pageBody(data),
            parentId: field(data, "parentId") || null,
            kind: (field(data, "kind") || undefined) as PageKind | undefined,
            status: (field(data, "status") || undefined) as
              PageStatus | undefined,
          },
          field(data, "clientKey"),
        );
        destination = `/workspace/projects/${projectId}/pages/${page.id}`;
        break;
      }
      case "edit-page": {
        const page = await store.updatePage(
          actor,
          field(data, "pageId"),
          {
            title: field(data, "title"),
            body: pageBody(data),
            parentId: field(data, "parentId") || null,
            kind: (field(data, "kind") || undefined) as PageKind | undefined,
            status: (field(data, "status") || undefined) as
              PageStatus | undefined,
          },
          Number(field(data, "version")),
        );
        destination = `/workspace/projects/${page.projectId}/pages/${page.id}`;
        break;
      }
      case "delete-page": {
        const page = await store.deletePage(
          actor,
          field(data, "pageId"),
          Number(field(data, "version")),
        );
        destination = `/workspace/projects/${page.projectId}`;
        break;
      }
      case "note": {
        const references = noteReferences(data);
        const note = await store.createNote(
          actor,
          projectId,
          {
            title: field(data, "title"),
            body: field(data, "body"),
            references,
          },
          field(data, "clientKey"),
        );
        destination = `/workspace/projects/${projectId}?note=${note.id}`;
        break;
      }
      case "read":
        await store.markRead(actor, field(data, "noteId"));
        break;
      case "edit-project":
        await store.updateProject(
          actor,
          projectId,
          field(data, "name"),
          field(data, "brief"),
          Number(field(data, "version")),
        );
        destination = `/workspace/projects/${projectId}`;
        break;
      case "delete-project":
        await store.deleteProject(
          actor,
          projectId,
          field(data, "confirmation"),
        );
        destination = "/workspace";
        break;
      case "edit-note": {
        const note = await store.updateNote(
          actor,
          field(data, "noteId"),
          {
            title: field(data, "title"),
            body: field(data, "body"),
            references: noteReferences(data),
          },
          Number(field(data, "version")),
        );
        destination = `/workspace/projects/${note.projectId}?note=${note.id}`;
        break;
      }
      case "delete-note": {
        const note = await store.deleteNote(
          actor,
          field(data, "noteId"),
          Number(field(data, "version")),
        );
        destination = `/workspace/projects/${note.projectId}`;
        break;
      }
      case "profile":
        await store.updateProfile(actor, field(data, "name"));
        break;
      case "rename-workspace":
        await store.renameWorkspace(actor, field(data, "name"));
        break;
      case "edit-agent":
        await store.updateAgent(
          actor,
          field(data, "participantId"),
          field(data, "name"),
          projectId || null,
        );
        destination = "/workspace/agents";
        break;
      case "remove-agent":
        await store.removeAgent(actor, field(data, "participantId"));
        destination = "/workspace/agents";
        break;
      case "cancel-invitation":
        await store.cancelInvitation(actor, field(data, "invitationId"));
        break;
      case "revoke-session":
        await store.revokeSession(actor, field(data, "sessionId"));
        if (!(await currentParticipant())) {
          (await cookies()).delete(sessionCookie);
          destination = "/sign-in";
        }
        break;
      case "sign-out-others":
        await store.signOutOthers(
          actor,
          (await cookies()).get(sessionCookie)?.value || "",
        );
        break;
      case "delete-workspace":
      case "delete-account": {
        const account = field(data, "operation") === "delete-account";
        await store.deleteWorkspace(
          actor,
          field(data, "confirmation"),
          account,
        );
        if (account) (await cookies()).delete(sessionCookie);
        destination = account ? "/" : "/setup";
        break;
      }
      case "revoke":
        await store.revoke(actor, field(data, "participantId"));
        break;
      case "credential":
        return { token: await store.createCredential(actor, "MCP connection") };
      default:
        throw new CommonsError("Unknown action.");
    }
    revalidatePath("/workspace", "layout");
    revalidatePath("/", "layout");
  } catch (error) {
    return errorState(error);
  }
  if (destination) redirect(destination);
  return { success: "Saved to Commons." };
}
export async function signOut() {
  const jar = await cookies(),
    token = jar.get(sessionCookie)?.value;
  if (token) await getStore().signOut(token);
  jar.delete(sessionCookie);
  redirect("/");
}
