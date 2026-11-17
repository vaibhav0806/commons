# Commons design system implementation guide

**Status:** current implementation guide. Read this with [`../DESIGN.md`](../DESIGN.md) before changing a user-facing surface.

`DESIGN.md` is the visual and interaction authority. This guide makes it practical: where the tokens and primitives live, which states are mandatory, and how a human or an AI agent should decide whether a new pattern belongs in Commons.

## Authority and scope

Use this order when guidance conflicts:

1. The owner’s latest explicit instruction.
2. `PRODUCT.md` for what the product is allowed to do.
3. `DESIGN.md` for visual, interaction, and content rules.
4. `design/commons.system.css` plus the active component implementation for tokens and exact behavior.
5. This guide for the change process and test matrix.

The static studies in `design/`, `DESIGN_SYSTEM_V2.md`, and the historical research/landing briefs do not override this order. Do not copy a component, token, product concept, or claim from them into the application without first reconciling it with the files above.

## Implementation map

| Concern | Source of truth | Use it for |
| --- | --- | --- |
| Color, font, spacing, focus, selection, motion roles | `design/commons.system.css` | New component styles; light/dark values belong here, not in a route stylesheet. |
| Product-wide rules | `src/app/globals.css` | Layout composition and scoped component classes; keep literals confined to documented exceptions. |
| Menu behavior | `src/components/ui/action-menu.tsx` | Overflow/right-click actions, keyboard menus, grouped destructive actions. |
| Dialog behavior | `src/components/ui/dialog-surface.tsx`, `src/components/confirmation-dialog.tsx` | Consequential confirmation flows. |
| Select behavior | `src/components/ui/select-field.tsx` | All custom select fields. |
| Failure notifications | `src/components/feedback.tsx` | Transient operation failures that do not need in-place recovery. |
| Page/document behavior | `src/components/page-editor.tsx` and page routes | Autosave, conflicts, source import, attachments, and contextual formatting. |

Before adding a primitive, search the map and existing active routes. Extend an existing primitive when the behavior is truly the same. Create a new primitive only when at least two active surfaces need a stable shared contract.

## Required state matrix

For every interactive or data-driven surface, decide and implement these states before declaring it done:

| State | Expected treatment |
| --- | --- |
| Initial | Clear purpose and the relevant next action; do not use instructional clutter. |
| Loading | No layout shift. Use a skeleton for layout-sized content; skip flickering indicators for very fast operations. |
| Empty | Explain what is absent and offer the next relevant action, or explicitly say there is nothing to do. |
| Pending | Disable duplicate submits, expose `aria-busy` when applicable, and retain entered work. |
| Error | Put validation beside its field; preserve input. Keep retriable autosave/upload/conflict failures in context. Use shared feedback only for transient operation failures. |
| Success | Close, redirect, clear, or otherwise move the user forward. A quiet confirmation may be enough for short-lived updates. |
| Permission | Explain the missing access without suggesting that a link, mention, or copied URL expands scope. |

Do not use one global notification as the recovery path for data that has visibly rolled back. Do not use a full page for a routine destructive confirmation; use `ConfirmationDialog` unless typed confirmation is required for account/workspace scope.

## Interaction rules

- Use native semantic controls and labels. No click-only `div`s.
- Ensure natural tab order, visible focus, Escape dismissal for menus/dialogs, and focus return to the trigger.
- Keep adjacent hit targets at least 8px apart. Keep at least 44px touch targets where touch is plausible.
- Respect `prefers-reduced-motion`; never add a `transition: all` declaration.
- Keep shareable state in the URL only when it is safe to bookmark and contains no sensitive data.
- Use one neutral hover/selected row surface. Never layer a button fill inside a selected tree row.

## Content and copy rules

- State exactly what Commons does: it stores shared context and permissions; it does not execute agents or guarantee provider behavior.
- Prefer pages, folders, files, and discussions in new UI/copy. Collections are legacy-compatible folder records; do not present them as a current content type.
- Never present a provider logo or name as verified integration. Agent identity is a self-selected cosmetic mark.
- Do not expose a visual Explorer. HydraDB retrieval remains backend infrastructure and may be described only as authorized context traversal with provenance.
- Keep destructive labels direct: “Delete page”, not “Delete page…”. Confirmation copy explains the scope and irreversible outcome.

## Visual QA checklist

Check the changed screen at desktop and 320px mobile in both themes. Also check:

- keyboard navigation and focus visibility;
- loading, empty, pending, error, success, and permission states affected by the change;
- text selection and readable contrast, including any dark illustrative card;
- dialogs, menus, and popovers for escape, focus return, and background blur;
- reduced motion and no horizontal overflow;
- an existing page/folder/tree item, so a new style does not regress the dense workspace surfaces.

## Documentation change rule

When a UI change adds or removes a design rule, update `DESIGN.md` and this guide in the same pull request. Update product/technical documents whenever it changes a user-visible capability, limit, or architecture claim. Put historical research behind an explicit archive label instead of allowing it to compete with current instruction.
