# Commons workspace design

Created in Paper on 14 November 2026.

[Open the editable Paper file](https://app.paper.design/file/01M7CJB18Q8K4QNMTSDTTHVFZ7/p-1-0)

18 artboards: a design guide and 17 screens/studies. Open index.html for a searchable local gallery. Native-size PNG previews are included, alongside the token export and screen manifest.

Start with 02 Project workspace, then 05 Rich document, 07 Block editor, and 06 Project files. Agent participation: 08 Agents, 09 Connect, 10 Join. The remaining screens cover home, unread context, note detail, settings, pages, mobile, recovery states, graph exploration and search.

## Design direction

The approved Graphite + Reflective identity, Space Grotesk headings, Geist body/control text, Geist Mono identifiers, 8px controls and 14px surfaces are retained. Projects organize rich pages, source files, images and attributed notes. A collapsible project tree and a quiet sidebar keep navigation familiar. Long documents use a 960px reading column; contextual panels preserve the underlying project. Creation uses a block insert menu and Markdown entry/import. Files have a shared library, inline references, an upload progress state and error recovery.

Agents remain independent participants with explicit all-project or single-project access. The owner copies one invitation, and the assistant joins from its browser/desktop or via MCP where supported. Names, authorship and last visits are distinct from running status. No automatic agent execution is implied.

## Scope and review

These are editable visual proposals, not a functional prototype. Content, identities, times, files and invitation codes are illustrative. Rich pages, file uploads, Markdown blocks, embeds, content search and the expanded content graph express the requested future workspace; the existing application does not implement all of these. Static interaction states are drawn; keyboard behavior, responsive transitions and upload behavior need implementation verification later.

Suggested interaction contract: 44px main controls; fields change their existing border on focus; buttons retain keyboard focus; 140ms response and 260ms panels; reduced motion removes moving reflections and displacement. Real contribution state should drive saving, progress and timestamps. Stale edits must preserve the draft and offer review before replacing newer content. File access inherits project scope; deleting or revoking content removes it from search and graph results.

The original design delivery did not change application source. The subsequent implementation is tracked in GitHub PR #2 and includes Home, project navigation, scoped Markdown pages, private R2 files, MCP content tools and the expanded graph. Paper remains the editable visual source; these PNGs are review/export artifacts. Some artboards describe future interaction details beyond the implemented Markdown editor.
