# Commons design direction

**Status:** current, implemented visual authority. Last reviewed November 17, 2026.

This document defines how Commons looks and behaves in the running product. It is for people and AI agents making product changes. `docs/DESIGN_SYSTEM.md` explains how to apply it; old design studies are archival only.

## Product truth

Commons is a shared, asynchronous context workspace. People and agents contribute to the same records through the website and MCP; Commons does not run, wake, schedule, or impersonate agents. The workspace is organized around projects, nested pages and folders, discussions, and private files. Board and table are folder views, not execution queues. Legacy collection and note records remain compatible data, but neither creates a separate UI concept.

## Foundation

- **Tone:** calm, legible, editorial. The product should feel like durable shared work, not a busy command center.
- **Type:** Sora for interface and body text; Instrument Serif for page, project, and editorial landing titles. Fonts are local.
- **Theme:** light Mist & Lilac is the default. Dark mode is an explicit persisted choice. Both modes are first-class; no component may rely on a light-only or dark-only literal color.
- **Tokens:** `design/commons.system.css` is the source for palette, type, radii, elevation, focus, selection, and motion roles. Components use semantic CSS variables from that file. Raw colors are allowed only in token definitions, approved landing artwork, or scoped third-party editor overrides.
- **Surfaces:** page canvas → navigation/panel → raised overlay. Borders organize; shadows belong to overlays and deliberate raised surfaces only.
- **Accents:** mist, lilac, olive, and sand describe content emphasis, never provider status, permission, or a destructive state.

## Layout and type

- Use the 4px scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64. Use at least 8px between adjacent interactive targets and 4px between adjacent selectable rows.
- Body and control text is usually 14–16px Sora. Compact list titles are 15px medium. Instrument Serif titles are reserved for clear page hierarchy, not every label.
- Keep controls aligned to shared edges. Avoid nested cards and decorative containers around ordinary document content.
- 44px is the touch target baseline. Desktop menu rows may be 32px only when the touch alternative remains usable.
- Keep mobile content gutters at 16px and standard mobile page gutters at 24px. Do not create horizontal overflow at 320px.

## Navigation and content

- Sidebar: Home, projects, Agents, Settings. The visual Explorer is retired; old graph URLs redirect. HydraDB powers retrieval in the background, not a browser map.
- A project tree contains pages and folders. Creation is contextual: project heading plus or project menu creates a project; project menus may create folders; folder menus may create subfolders; a page menu never exposes child-creation actions.
- Page, folder, and project row menus use one ellipsis with the matching right-click menu. Selection and hover use one quiet neutral surface, without a second filled action button inside the row.
- Project Home lists pages and folders only. Files remain available through Project actions → Files; legacy notes remain accessible through their existing retrieval paths but are not promoted as a content type.
- Document pages use an editable Instrument Serif title and an unboxed Sora canvas. Formatting is contextual; there is no permanent write/preview/insert toolbar.

## Components and states

Use existing primitives before inventing a new pattern:

| Need | Existing implementation | Contract |
| --- | --- | --- |
| Menus | `ActionMenu` | Semantic menu, keyboard navigation, 32px desktop / 44px touch rows, clear grouping of destructive actions. |
| Confirmations | `DialogSurface` / `ConfirmationDialog` | Centered blurred backdrop, trapped focus, Cancel initially focused, Escape/backdrop before submission, real error stays in the dialog. |
| Selects | `SelectField` | Native-label semantics, shared surface, restrained elevation, explicit disabled state. |
| Transient failures | `FeedbackProvider` / `useFeedback` | Persistent, dismissible notification with a human explanation. Dismiss the matching error after successful recovery or when its form leaves the screen. Never use `alert()` or browser `confirm()`. |
| Forms and long-lived recovery | Local component state | Field errors stay beside the field; autosave/upload/conflict errors stay where recovery happens and retain user work. |

Every data-driven surface must cover loading, empty, error, and success states. Use skeletons for layout-affecting loads, honest empty copy plus a relevant next action, and recovery actions where failure leaves work unfinished. Do not use a toast as the only recovery path after a rollback or a failed upload/autosave.

## Accessibility and motion

- Use semantic buttons, links, inputs, dialogs, menus, and labels. Do not make generic containers interactive.
- Every focusable control needs a visible `:focus-visible` state. Form fields use the approved border-only focus treatment; other controls use the shared focus token.
- Dialogs return focus to their trigger. Menus and overlays close with Escape. Never remove focus without placing it somewhere meaningful.
- Communicate state with text, not color alone. Keep field errors connected with `aria-describedby`; notifications are keyboard-dismissible.
- Motion must explain a change, never delay it. Use 100ms for micro feedback, 150ms for small overlays, 200–250ms for dialogs/toasts, and no motion under `prefers-reduced-motion: reduce`. Never use `transition: all`.
- Landing story motion is an approved exception: it pauses on hover/focus, exposes keyboard story tabs, and falls back to normal flow for reduced motion or short viewports.

## Deliberate exceptions

- The landing’s illustrative workflow cards have dark surfaces in both themes. Their local text tokens must remain light enough to read; they do not inherit generic page text colors.
- Milkdown/Crepe editor rules may be scoped to the editor. They must not leak into application controls or bypass the selection/focus tokens.
- Provider logos are cosmetic identity choices. Unknown or unselected agents use the neutral mark; names never infer a logo.

## Change protocol

1. Read `PRODUCT.md`, this document, and `docs/DESIGN_SYSTEM.md` before UI work.
2. Check the active route and the existing primitive before adding a component or style.
3. Use semantic tokens and the existing state hierarchy; do not create a one-off color, radius, shadow, hover treatment, or error pattern.
4. Verify light, dark, keyboard, reduced-motion, narrow mobile, loading, empty, error, and permission states affected by the change.
5. If the product needs a deliberate new pattern, update this document and the implementation guide in the same change. Historical studies never override this file.

## Archived material

`docs/DESIGN_SYSTEM_V2.md`, `docs/DESIGN_RESEARCH.md`, `docs/LANDING_PAGE_PLAN.md`, `docs/PIXEL_REVIEW_BRIEF.md`, `docs/REVIEW_NOTES.md`, and the static prototypes under `design/` preserve design history. They are not implementation authority. `design/commons.system.css` and its local fonts remain runtime dependencies.
