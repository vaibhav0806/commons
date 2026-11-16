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

Create choices are Page, Folder and Upload/import. Page creation/editing and folder items open in the main workspace area, not a side sheet. New pages start with a title and body, with parent/status supplied from context. Folders expose List/Board/Table views. Existing collection records remain compatible and retain their data, but are presented as folders; there is no separate collection or note creation choice in the tree. Discussion uses contextual panels. Consequential actions use compact centered confirmation dialogs with a blurred backdrop.

Muse was consulted twice through OpenRouter (`meta/muse-wonder`, high reasoning). The latest owner feedback supersedes the earlier suggested check/cancel buttons. Adopted principles: one neutral highlight per row, no nested hover fills, no teaching paragraphs/empty count lists, gesture-based project drafts, real error feedback and clear permission labels. References: [Notion sidebar](https://www.notion.com/help/navigate-with-the-sidebar), [Notion subpages](https://www.notion.com/help/create-a-subpage), and [Linear sidebar customization](https://linear.app/changelog/2024-12-18-personalized-sidebar). These are interaction references, not claims of new November 2026 releases.

## Document canvas and unified creation — November 16

Every New project entry point opens the inline sidebar draft; the former `/workspace/new` form redirects to Home. Project rows on Home have no hover fill. Tree highlights retain a quiet neutral surface with inset action spacing.

Pages use an editable Instrument Serif title and an unboxed Sora document canvas. Formatting appears on selection, and `/` opens a compact filtered block menu near the cursor. A single page-options menu contains source editing, Markdown import, attachments and moving an existing page. There is no permanent Write/Preview/Insert toolbar or instructional footer. Pages autosave after a short pause, with a quiet Saved/Saving indicator and contextual upload/error feedback. Light/dark, keyboard and narrow-screen behavior share the existing design roles.

## Landing content refresh — November 16

The symbol and wordmark appear together in both headers. The agent strip fades and blurs only at its left edge; its right edge stays crisp. The hero says “Bring your agents to the same page.” Workspace creation stays primary, with a secondary Copy setup prompt action that asks for a scoped invitation rather than promising installation or automatic access.

Three illustrative projects use locally hosted Pexels photography: a Kyoto weekend, Sunday Coffee’s launch, and Fieldnotes issue 01. Each includes a brief, a concrete contribution, feedback and a human decision. The pinned story fills the available desktop viewport and advances across 1.1 viewports of scrolling, without the former lead-in/out delays. Narrow screens and reduced motion retain manual tabs. The supporting sections show a shared brief and explain content, contributions and access. Subtle scroll reveals respect reduced motion. Photo sources and license links live in `public/landing/CREDITS.md`.

## Autosave and final workspace polish — November 16

Page titles, body and location save after an 800 ms pause. The document stays editable while a request is in flight; later edits are queued and version conflicts never overwrite another contribution. Empty new pages are not created until there is content. A saved new page gets a durable URL and appears in the sidebar without closing the editor. Done leaves editing; it is not a save button. Internal navigation flushes pending edits first.

Failed edits are recoverable from same-tab session storage. Conflicts show a comparison link and draft download; routine editing carries no instruction text. Joining-page navigation is removed from the invitation result, Settings loses its subtitle, and the document options menu uses the same padded rows as the sidebar menus.

## Focused Explorer and inline media — November 16

Sidebar destinations are Agents and Settings. A header control collapses the desktop sidebar and remembers the preference; mobile retains its navigation drawer. Disclosure arrows are centered SVGs. Project contents do not receive a filled hover background.

Project upload menus open a contextual dialog. Page attachments upload inside the document without navigation. Clipboard file bytes take precedence over accompanying HTML image URLs; pasted and dropped images use authenticated R2 uploads, with an inline placeholder while transferring. Safe raster images display in the document; other dropped files become links. The slash-menu Image action uses the same private upload path. Existing external Markdown images remain unloaded for privacy.

Explorer starts from an artifact and separates References, People and Structure. Incoming links, direct sources and sources one link further are navigable, with an Open action and back history. A searchable index supports pages, folders, files and contributors. Context health is collapsed by default and exposes explicit link coverage and items without references; missing links are review suggestions, not automatic quality judgments. Pending/unavailable graph states suppress derived relationships. Partial graphs are labelled.

## Reduced workspace chrome — November 16

Home keeps one main New project action and omits the duplicate empty-state button. Recently shared appears only when there are contributions. Settings separates its heading and tabs by 32px; the empty Explorer uses the shared heading/subtitle rhythm. Project contents use the full available width, with Activity collapsed below them and compact rows when expanded. The landing header retains branding, theme and sign-in/workspace actions; section jump links and the setup-prompt helper sentence are removed.

## On-demand activity and document breaks — November 16

Project Activity is available from the project action menu in a contextual panel, with compact author/action sentences and timestamps. It has no permanent section in the project contents area. Signed-in landing navigation omits the duplicate Workspace link; the hero remains the primary entry. Destructive action labels omit ellipses while retaining confirmations.

Plain HTML line-break tags are converted into Markdown hard breaks in the reader and editor. Code spans/fences remain literal, tags with attributes remain text, and arbitrary HTML is not enabled. Opening and closing an unchanged document preserves the original source.

## Explorer retirement — November 16

The owner removed the Explorer section from the workspace. Its sidebar destination and visual explorer are retired; old graph URLs redirect to Home. HydraDB context traversal and projection remain backend capabilities. The Agents heading has no terminal punctuation. HydraDB attribution appears only in the landing footer.

## Social identity — November 16

Social sharing uses a static 1200 × 630 Mist card with the existing Commons mark, Sora wordmark, Instrument Serif headline and the original landing meadow. SVG, ICO, Apple and installable app icons share slate ink on a lilac tile; maskable exports keep the mark inside the safe circle. The downloadable kit follows the current palette and typography.

Project names in the Home index use body-sized Sora Medium (15px), with 36px icon tiles and compact rows. On mobile, the disclosure remains aligned beside the title; nonempty counts sit below the title and empty counts occupy no space.

## Contextual creation — November 16

Folders use the same inline name field as projects, placed inside the selected project/folder tree. Enter creates; Escape or an outside pointer dismisses. Mobile opens the navigation drawer, and a collapsed desktop sidebar opens automatically. Creation retains the parent and a stable save key across retries. Old folder-creation URLs return to their parent instead of opening a form page.

Page row menus contain page-specific actions (Discussion, Rename or move, Delete where permitted), without creation options. Projects offer New folder; folders offer New subfolder. Document pages have no add-child toolbar. Existing nested content remains accessible. Contents list titles use the same 15px medium typography as the Home project list, with smaller author metadata. Social artwork omits the printed URL.

## Confirmation dialogs and agent identities — November 16

Delete, revoke, remove, cancel-invitation and sign-out-other-session actions use one centered, accessible confirmation dialog. Keep Cancel initially focused, trap keyboard focus, and allow Escape/backdrop dismissal before submission. During submission, disable dismissal and duplicate actions. Show real errors inside the dialog. Document content remains visible behind page/folder deletion prompts. Existing action URLs open the same dialog; project/workspace/account confirmations retain their typed checks. Home has no duplicate New project button: use the sidebar Projects plus.

Agents explicitly choose one of the eleven landing identities during browser or API enrollment. Display the saved mark in contributor avatars and participant lists; names never determine a provider logo. Other/not-sure and older registrations use a neutral icon. Agent settings and owner management can update or clear this cosmetic choice. The shared catalog supplies landing logos, onboarding choices and copied setup instructions.

## Project summaries and text selection — November 16

Home summarizes agents, pages and folders. It no longer surfaces the legacy Recently shared notes feed or counts uploaded files as visible project contents. Original uploads remain accessible through Project actions → Files. Legacy notes and collection records retain their data and API compatibility; collection records render as folders. Text selection uses dedicated lilac background and dark ink tokens in both the document reader and editor, independent of button foreground colors.

## Separate interaction highlights — November 16

The landing's illustrative launch cards retain dark surfaces in both themes. Their local primary and muted text colors stay light, independent of the surrounding page theme, so author names, calendar entries and draft posts remain readable.

Tree rows have a 4px gap between siblings and between a parent and its expanded children, including mobile navigation. Action menus, select lists, mention pickers, search results and editor slash-menu rows use the same minimum spacing so adjacent selected, hovered or focused surfaces remain distinct. Existing navigation and settings tabs retain their larger gaps; landing story tabs remain intentionally connected.
