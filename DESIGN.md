# Commons — Mist & Lilac

The approved November 16 Paper designs supersede the earlier Graphite study. Light is the default; an explicit theme choice persists for one year. Marketing and workspace share the same palette and type families.

- Sora for interface and body copy. Instrument Serif for editorial landing and document titles. Locally hosted fonts with their licenses.
- Light: canvas `#F5F6F8`, navigation `#E3E7EC`, panel `#FFFFFF`, ink `#3D4955`, muted `#66717F`, border `#D1D8E1`.
- Dark: canvas `#1D222C`, navigation `#171B23`, panel `#282F3C`, ink `#E1E5ED`, muted `#A7B2C2`, border `#3D4859`.
- Mist, lilac, olive and sand are quiet content accents, not provider-status indicators. See `design/commons.system.css` for roles.
- One project tree contains pages and nested folders. List, board and table are views of folder contents, not separate entity types or agent execution queues. Create projects inline from the Projects heading plus; create content from one grouped row menu or right-click. Touch controls remain visible.
- Landing: eleven example agent identities move horizontally through blurred edges, pausing on hover/focus. The viewport is 854px maximum, retaining every identity. Three project panels advance with vertical scrolling while pinned, then release. No timed carousel.
- Short viewports and reduced motion use selectable panels in normal flow. Reduced motion makes the logo row manually scrollable. Keyboard tabs select stories directly.
- Mobile: 24px gutters (16px on compact content), 44px touch targets, readable 14–16px body copy and 16px form controls. Navigation and discussion have dedicated mobile surfaces.
- Border-only field focus; no glow. Hover, focus, error, loading, empty and permission states must remain legible in both themes.

Paper file: `01M7CJB18Q8K4QNMTSDTTHVFZ7`. Final landing artboards `6QF-0` / `6SH-0`; workspace `6W8-0` onward; mobile page `p-B-0`.

Earlier study details remain in `docs/DESIGN_SYSTEM_V2.md` for history, not implementation authority.

## Workspace interaction polish — November 16

Sidebar creation asks only for a project name. Enter commits; Escape returns focus to the heading plus; an outside pointer click/tap cancels without stealing the clicked control’s focus. There are no persistent hints or save/cancel buttons. Pending input is read-only; real errors preserve the draft. IME composition must not submit or cancel the draft. Mobile uses the keyboard’s Done action.

Each tree row has one ellipsis and a matching right-click menu. Selected and hovered rows use neutral mist, with no separate button fill inside the row. Project/content titles retain ink color on hover. Menus use 32px desktop/44px touch rows; selects share the flat surface and restrained shadow. Only actual nonzero counts and existing brief snippets appear on home. Workspace name lives in the sidebar; header breadcrumbs show project/page context. Unread navigation is retired; old URLs redirect, while stored read state and scoped API/MCP retrieval remain intact.

Create choices are Page, Folder and Upload/import. Page creation/editing and folder items open in the main workspace area, not a side sheet. New pages start with a title and body, with parent/status supplied from context. Folders expose List/Board/Table views. Existing collection records remain compatible and retain their data, but are presented as folders; there is no separate collection or note creation choice in the tree. Discussion and consequential confirmations may still use contextual panels.

Muse was consulted twice through OpenRouter (`meta/muse-wonder`, high reasoning). The latest owner feedback supersedes the earlier suggested check/cancel buttons. Adopted principles: one neutral highlight per row, no nested hover fills, no teaching paragraphs/empty count lists, gesture-based project drafts, real error feedback and clear permission labels. References: [Notion sidebar](https://www.notion.com/help/navigate-with-the-sidebar), [Notion subpages](https://www.notion.com/help/create-a-subpage), and [Linear sidebar customization](https://linear.app/changelog/2024-12-18-personalized-sidebar). These are interaction references, not claims of new November 2026 releases.

## Document canvas and unified creation — November 16

Every New project entry point opens the inline sidebar draft; the former `/workspace/new` form redirects to Home. Project rows on Home have no hover fill. Tree highlights retain a quiet neutral surface with inset action spacing.

Pages use an editable Instrument Serif title and an unboxed Sora document canvas. Formatting appears on selection, and `/` opens a compact filtered block menu near the cursor. A single page-options menu contains source editing, Markdown import, attachments and moving an existing page. There is no permanent Write/Preview/Insert toolbar or instructional footer. Save remains a compact explicit action, with upload/error feedback only when needed. Light/dark, keyboard and narrow-screen behavior share the existing design roles.
