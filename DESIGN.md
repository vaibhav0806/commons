# Commons — Mist & Lilac

The approved November 16 Paper designs supersede the earlier Graphite study. Light is the default; an explicit theme choice persists for one year. Marketing and workspace share the same palette and type families.

- Sora for interface and body copy. Instrument Serif for editorial landing and document titles. Locally hosted fonts with their licenses.
- Light: canvas `#F5F6F8`, navigation `#E3E7EC`, panel `#FFFFFF`, ink `#3D4955`, muted `#66717F`, border `#D1D8E1`.
- Dark: canvas `#1D222C`, navigation `#171B23`, panel `#282F3C`, ink `#E1E5ED`, muted `#A7B2C2`, border `#3D4859`.
- Mist, lilac, olive and sand are quiet content accents, not provider-status indicators. See `design/commons.system.css` for roles.
- One project tree contains pages, nested folders and collections. Board and table are views of the same collection, not agent execution queues. Create projects inline from the Projects heading plus; create content from one grouped row menu or right-click. Touch controls remain visible.
- Landing: eleven example agent identities move horizontally through blurred edges, pausing on hover/focus. The viewport is 854px maximum, retaining every identity. Three project panels advance with vertical scrolling while pinned, then release. No timed carousel.
- Short viewports and reduced motion use selectable panels in normal flow. Reduced motion makes the logo row manually scrollable. Keyboard tabs select stories directly.
- Mobile: 24px gutters (16px on compact content), 44px touch targets, readable 14–16px body copy and 16px form controls. Navigation and discussion have dedicated mobile surfaces.
- Border-only field focus; no glow. Hover, focus, error, loading, empty and permission states must remain legible in both themes.

Paper file: `01M7CJB18Q8K4QNMTSDTTHVFZ7`. Final landing artboards `6QF-0` / `6SH-0`; workspace `6W8-0` onward; mobile page `p-B-0`.

Earlier study details remain in `docs/DESIGN_SYSTEM_V2.md` for history, not implementation authority.

## Workspace interaction polish — November 16

Sidebar creation asks only for a project name. Enter/check creates, Escape/cancel discards and restores focus to the heading plus. Pending state blocks repeated submission; a failed save preserves the draft and announces the error. Mobile navigation closes after successful creation. Project briefs remain editable inside the project.

Each tree row has one ellipsis, also reachable by keyboard, with the same actions in its right-click menu. Menus use compact 32px rows on desktop, 44px on touch, a separator before management actions, and scroll within the available viewport. Navigation hover uses the shared mist surface in both themes. Home has its own icon. Profile names are 13px, with no role/access subtitle. Agent invitations remain under Agents & access; the redundant sidebar invitation and header search/modal/shortcut are removed. Authorized search remains available to API/MCP clients.

Muse was consulted through OpenRouter (`meta/muse-wonder`, high reasoning). Its useful challenges were preserving drafts, restoring focus, keeping touch actions discoverable and checking retrieval as workspaces grow. We retained the approved palette and border-only field focus instead of adopting its suggested focus ring, and did not add unimplemented archive/duplicate actions. References: [Notion sidebar](https://www.notion.com/help/navigate-with-the-sidebar), [Notion subpages](https://www.notion.com/help/create-a-subpage), and [Linear sidebar customization](https://linear.app/changelog/2024-12-18-personalized-sidebar). These are interaction references, not claims of new November 2026 releases.
