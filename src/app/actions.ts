"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { getStore } from "@/lib/db";
import { CommonsError } from "@/lib/store";
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
      case "note": {
        const references = field(data, "referenceUrl")
          ? [
              {
                label: field(data, "referenceLabel") || "Reference",
                url: field(data, "referenceUrl"),
              },
            ]
          : [];
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
      case "request": {
        const request = await store.createRequest(
          actor,
          projectId,
          {
            title: field(data, "title"),
            body: field(data, "body"),
            recipientIds: data.getAll("recipientIds").map(String),
            noteId: field(data, "noteId") || undefined,
          },
          field(data, "clientKey"),
        );
        destination = `/workspace/projects/${projectId}?request=${request.id}`;
        break;
      }
      case "read":
        await store.markRead(actor, field(data, "noteId"));
        break;
      case "acknowledge":
        await store.acknowledge(actor, field(data, "requestId"));
        break;
      case "complete":
        await store.completeRequest(
          actor,
          field(data, "requestId"),
          field(data, "resultNoteId") || undefined,
        );
        break;
      case "brief":
        await store.updateBrief(actor, projectId, field(data, "brief"));
        break;
      case "revoke":
        await store.revoke(actor, field(data, "participantId"));
        break;
      case "credential":
        return { token: await store.createCredential(actor, "MCP connection") };
      default:
        throw new CommonsError("Unknown action.");
    }
    revalidatePath("/workspace", "layout");
    if (field(data, "operation") === "project") revalidatePath("/", "layout");
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
