---
name: Commons — Graphite + Reflective
description: Approved dark-only, minimal cybernetic workspace with silver light and tactile interaction.
colors:
  background: "#0B0C0E"
  navigation: "#101114"
  surface: "#17191D"
  raised: "#202328"
  hover: "#292D34"
  border: "#30353E"
  border-strong: "#677282"
  foreground: "#EEF0F3"
  body: "#C2C7D0"
  muted: "#A7AEBA"
  quiet: "#959EAC"
  accent: "#C8D0DC"
  primary: "#DBE0E8"
  primary-hover: "#F3F5F8"
  primary-foreground: "#12161C"
  focus: "#BCCADC"
  field-focus: "#8C97A6"
  success: "#ADD2BB"
  warning: "#E6BFB0"
  error: "#F0A5B5"
  glint: "#E8F2FF"
  glint-end: "#9BAAC1"
typography:
  page:
    fontFamily: Space Grotesk
    fontSize: 44px
    fontWeight: 500
    lineHeight: "1.18"
    letterSpacing: "-0.035em"
  page-mobile:
    fontFamily: Space Grotesk
    fontSize: 36px
    fontWeight: 500
    lineHeight: "1.18"
    letterSpacing: "-0.035em"
  feature:
    fontFamily: Space Grotesk
    fontSize: 26px
    fontWeight: 500
    lineHeight: "1.3"
    letterSpacing: "-0.025em"
  feature-mobile:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: 500
    lineHeight: "1.3"
    letterSpacing: "-0.025em"
  section:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: 500
    lineHeight: "1.4"
    letterSpacing: "-0.02em"
  row:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: 500
    lineHeight: "1.5"
    letterSpacing: "-0.012em"
  body:
    fontFamily: Geist
    fontSize: 15px
    fontWeight: 400
    lineHeight: "1.8"
    letterSpacing: "0em"
  control:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: 500
    lineHeight: "1.4"
    letterSpacing: "0em"
  meta:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: 400
    lineHeight: "1.6"
    letterSpacing: "0em"
  identifier:
    fontFamily: Geist Mono
    fontSize: 12px
    fontWeight: 400
    lineHeight: "1.6"
    letterSpacing: "0em"
rounded:
  control: 8px
  surface: 14px
spacing:
  micro: 4px
  tight: 8px
  control: 12px
  related: 16px
  mobile-inset: 20px
  group: 24px
  surface: 32px
  page-inset: 40px
  section: 48px
  wide: 64px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.control}"
    padding: 12px 16px
    height: 44px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.control}"
    padding: 12px 16px
    height: 44px
  button-disabled:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.quiet}"
    rounded: "{rounded.control}"
    padding: 12px 16px
    height: 44px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.control}"
    padding: 0px 12px
    height: 44px
  note:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.body}"
    rounded: "{rounded.surface}"
    padding: 32px
---

# Commons design system

## Overview

**Approved foundation.** The owner approved the dark-only, minimal cybernetic/neofuturistic character; Space Grotesk headings, Geist body/controls and Geist Mono identifiers; Graphite + Reflective palette/material; and the reviewed type scale, spacing, corners and hover/press responses. The final adjustment removes text fields' outer focus outline in favor of a subtle change to their existing border. Apply these shared foundations throughout the product. The local application now implements them with real browser and MCP participation.

The executable reference is at [localhost:4177/typography/?study=system](http://localhost:4177/typography/?study=system). It uses one project page plus state and foundation specimens. The older `docs/DESIGN_SYSTEM_V2.md` remains study history; this root file is the consolidated system.

Minimalism governs composition. Futurism comes through precise geometry, controlled reflective light, material layering and responsive controls. The character belongs throughout the product. The working interface preserves stable reading and understandable actions; expressive artwork can carry more visual complexity.

“Alive” means responsive, dimensional and stateful. An idle working page does not need continuous decorative motion. The supplied point-cloud, wireframe, chrome and holographic references and GMUNK’s TRON work guide material and motion language; they do not authorize copying their imagery or interface layouts.

## Colors

**Approved: Graphite.** Use the frontmatter's neutral canvas, navigation and surface roles. Silver identifies primary actions and emphasis. Colorful agent mentions retain their recognizable identity tint and logo; they do not turn the whole note into a highlighted block.

Separate action, focus and semantic roles. Success, warning and error always include a label, icon or other non-color cue. A saved state describes what happened; it does not imply that another agent ran, read or completed work.

Primary actions pair the primary surface with primary-foreground text. Buttons and links retain a visible two-pixel keyboard-focus outline with an offset. Text inputs and textareas instead change their existing one-pixel border to field-focus. They never gain an outer focus outline, extra ring, glow or box shadow. An invalid field keeps its error border while focused. Keyboard focus must remain visible even when pointer effects are disabled.

Mobile touch uses the component's designed pressed state, without the browser's colored tap overlay. The shared root sets `-webkit-tap-highlight-color: transparent`, inherited by links, buttons and custom interactive surfaces. This does not remove keyboard focus indicators, text selection or native touch behavior.

**Stored comparisons:** Ice blue and Iridescent remain available in the palette study. They are not automatic themes or active alternatives. The product has no light mode.

Verified Graphite pairs in the study: body/raised 9.29:1, muted/raised 7.06:1, quiet/raised 5.83:1, primary-button text 13.69:1, field boundary/surface 3.61:1, focus/raised 9.47:1. These are pair checks, not a certification of every future component.

## Typography

**Approved families:** Space Grotesk for headings, Geist for reading/navigation/controls and Geist Mono for codes, identifiers and aligned numeric values. Use the bundled local assets and include their licenses. Sans-serif or monospace system fallbacks are for font-loading failure, not the primary design.

**Stored alternate: Sora.** Keep the full Sora option for headings, body and controls available in `design/typography/`. Switching requires an explicit design decision. Do not silently use Sora as a fallback or mix it into individual components.

**Approved scale:** use the frontmatter's page, feature, section, row, body, control, meta and identifier roles. The mobile page and feature roles apply at 700px and below. Retain readable body and metadata sizes on mobile rather than shrinking the entire interface. Body measure is at most 72ch; actual readable line length depends on glyphs and viewport width.

Use sentence case, clear verbs and normal body tracking. Reserve tight tracking for headings and stay above the -0.04em floor. Monospace belongs to literal data, not every label that sounds technical. Use tabular numerals where comparison/alignment requires them.

## Layout

**Approved rhythm:** use the frontmatter spacing scale. Related controls share the tighter intervals; separate sections with the larger intervals. Outer desktop gutters may be fluid; local component spacing stays on the scale.

The review uses one navigation rail (220px) and one main project column (up to 960px). Persistent reading context has priority over extra panels. Details are revealed deliberately, not kept in a competing permanent column. On mobile (700px and below), navigation becomes a compact top row, content stacks and requests place their status below their title/byline.

Maintain a minimum primary-control height of 44px. Provide a useful hit area around small action icons. Do not change the established onboarding story, form flow or persistence behavior as a side effect of applying tokens.

## Elevation & Depth

**Approved material: Reflective.** Layer dark surfaces using raised-to-surface gradients. A thin top-edge reflection follows the pointer on the note; a passing specular highlight crosses a primary button on hover. Keep the reflective effect concentrated on edges and surfaces so readable text remains stable.

Content surfaces use a boundary and tonal layering. They do not need an ambient glow. Primary controls use a small downward shadow: rest `0 3px 7px #0005`, hover `0 4px 9px #0005`, pressed `0 1px 3px #0005`. Disabled controls lose the shadow and moving highlight.

Matte remains a comparison treatment. Do not infer a general glassmorphic or transparent interface from the Reflective choice. Chrome/holographic artwork can be developed separately, potentially with Toolcraft, and reviewed as an asset before integration.

## Shapes

**Approved geometry:** softly defined control corners (8px) and content-surface corners (14px). Keep the form consistent across fields, buttons, notes and navigation. Borders are thin (1px); text-field focus changes that border without adding an outer outline. Agent/product logos keep their native shape and are not replaced by invented initial avatars.

Avoid clipped futuristic corners, faux instrumentation or decoration that makes a control harder to recognize. Precision, material response and hierarchy carry the character.

## Components

The shared token source is `design/commons.system.css`. The application imports it from `src/app/globals.css`; React components live in `src/components/` and the application routes. The historical mock also loads it, followed by `design/v2/system.css`. The system reference imports the same token source from `design/typography/system.css`; `materials.js` retains the palette comparisons and `materials.css` the reference material treatment. The `study=system` route fixes the approved palette and font families.

The active mock applies the foundations to onboarding forms, project navigation, notes, requests, mentions, details and dialogs. The reviewed onboarding story retains its composition, native Calendar/X artifact scale, identity tints and narrative timing. Ordinary interface transitions use the shared motion roles. Reflective lighting uses translucent white for specular light and black for shadows; these are material effects, not extra action colors. Agent identity tints are deliberately exempt from the neutral action palette: Grok Bot coral, Codex blue and Claude Code lavender. They stay inside compact mentions and never fill an entire note.

| Component | Appearance and state contract |
| --- | --- |
| Primary button | Silver surface, dark text, labelled action. All buttons start from a neutral reset: no native appearance, background or padding; each control role supplies its own surface and geometry. Hover lifts at most 1px and passes one highlight; press depresses by 2px with at most 0.99 scale. Pending exposes text and `aria-busy`, preventing duplicate submission. Disabled loses hover/press effects and remains legible. |
| Text action | Silver readable label with an optional small arrow; hover changes foreground/arrow position. Preserve keyboard focus and an appropriate hit area. |
| Field | Persistent label, readable placeholder, graphite surface and visible boundary. Focus changes the existing border to field-focus; no outer outline, ring, glow or box shadow. Error keeps its own border and appears beside the field with a recovery instruction, `aria-invalid` and an associated description. Preserve input. |
| Select field | Use `SelectField` in `src/components/ui/select-field.tsx`, built on Base UI. One shared 44px trigger, 8px corners, 16px horizontal inset and a separate chevron slot. The popup opens 8px away, aligns to the trigger and uses a bounded, scrollable list on a 14px reflective surface. Hover/highlight, selected check, disabled state, typeahead, arrow keys, Enter, Escape, outside dismissal, focus return and real form values belong to the component. Field focus changes the existing border only. Do not introduce visible native selects in product forms. |
| Action group | Use `ActionGroup` for adjacent actions. Minimum 12px between controls; 24px separates action groups from form/content sections. Stack primary and secondary actions on narrow forms. A secondary continuation never touches a submit, caption or generated result. Form authors use the component rather than repairing margins per page. |
| Dialog surface | Use `DialogSurface` for workspace invitations and command search. Accessible title, focus containment, Escape/outside dismissal, focus return, layered backdrop and reduced-motion transitions are built into the shared primitive. Keep nested select popups above the panel and close the topmost surface first. |
| Command search | ⌘K and Ctrl+K open the current project’s quick finder from the page header. The inline search form remains a separate list filter with shareable query URLs, view scope and paging. Use the same dialog, field, result-row and state roles. Quick find includes notes, requests, project brief and eligible agents. Show loading, empty and error feedback. Arrow keys select; Enter opens; Escape returns focus. Server authorization defines search visibility. |
| Note | Attributed context, a readable title/body and deliberate detail control. A reflection can respond to the pointer; the copy does not move. Draft text survives palette changes in the study. |
| Agent mention | Recognizable mark plus agent name, compact tinted background and readable text. Product marks sit on a small silver ground so dark native artwork stays visible. Long names wrap within the control. One clear mention per directed request; avoid a duplicate emphasis block immediately beside it. Mentions do not grant access or imply execution. |
| Request | Verb-led title, requester/recipient and explicit state. Use a quiet row with a separator; do not turn every row into a raised panel. |
| Navigation | Sidebar links and action buttons share `.nav-item`: full row width, a transparent resting surface, a minimum 44px height and the same padding, icon size and 8px corners. Navigation groups keep 8px between rows; the profile is separated by 24px. Hover uses the surface role, the current page uses the raised role and keyboard focus stays inside the row. Highlights must never touch another control. Mobile retains a clear project identity and 44px control hit areas. |
| Feedback | Keep confirmation near the action. Loading follows real work in production. The 750ms pending interval in the control sample is an illustrative delay only. |
| Empty state | State what is empty, give useful context and offer a relevant next action. The sample's “Leave a note” opens the actual local preview composer. |

**Approved motion:** response 140ms; surface transitions 260ms; primary-button highlight 500ms. Use `cubic-bezier(.16,1,.3,1)` for settling movement. Animate only the property that conveys the change. Details preserve the underlying project, contain keyboard focus, support Escape and return focus when dismissed. Native dialogs retain browser focus handling. Design and review the relevant states for each future overlay rather than assuming these examples cover it.

For reduced motion, remove displacement, scale and travelling highlights. Stop pointer-tracking effects. Keep readable static surfaces, visible focus, validation and completion feedback. Do not hide content behind animation or require hovering to discover essential controls. Avoid `transition: all`.

## Do's and Don'ts

- **Do** read this file and PRODUCT.md before adding or changing a component.
- **Do** use semantic roles and shared values rather than selecting new colors or type sizes per screen.
- **Do** design and review each new component in resting, hover, focus, pressed, pending, error, empty and disabled states where those states apply.
- **Do** preserve readable content, authorship, recipient and access scope.
- **Do** verify desktop/mobile rendering, text contrast, keyboard operation and reduced motion on the actual result.
- **Do** keep project-specific copy and data separate from reusable visual foundations when adapting the system to another project.
- **Don't** add a light theme, amber primary accent or colored full-note hover flash without a new explicit design decision.
- **Don't** make reading text glitch, tilt with the cursor or become a gradient.
- **Don't** add perpetual loading indicators, fake agent presence or implied execution to make the product feel alive.
- **Don't** introduce a new component appearance without extending this system deliberately and recording its approval status.
- **Don't** reintroduce an outer text-field focus outline, ring, glow or added shadow.


## Connection composition

Onboarding alone uses `/connect`. Every invitation initiated within the workspace opens the shared invitation panel without leaving the current page. Both surfaces render the same `ConnectForm`, `SelectField` and `ActionGroup`.

Present one invitation and one **Copy agent instructions** action. The person selects scope, not a browser/MCP connection mode. Keep the technical bootstrap text in the copied instructions rather than displaying an instruction wall. One single-use enrollment supports the available participation path; a joined browser registration can add an MCP credential later. Changing scope hides a generated invitation until a new one is issued for that scope.

The shared component layer owns geometry and behavior as well as tokens. A new screen must use these components or extend their state contract deliberately; using approved colors alone is not design-system compliance.

## Interface restraint

Working pages lead with project content and actions. Avoid a repeated explanatory sentence beneath every section title; retain guidance in empty states, scoped views and fields where it helps someone decide what to do. Detail panels put their title and close action in the same header. Record type follows the title as quiet metadata when useful, without a separate decorative heading above it. Preserve the approved landing story and the distinction between notes, requests, acknowledgement and completion.


## Public landing and onboarding motion

The current landing experiment uses a centered Space Grotesk introduction above one interactive project surface. It replaces the rejected split hero and abstract ribbon sculpture. Marketing display type reaches 88px; body and controls retain Geist. Graphite surfaces and a fine silver frame provide depth. Pointer movement changes a bounded reflection on that frame without moving text.

Desktop scroll selects three chapters in the same project: shared context, directed requests, saved results. Direct buttons also select chapters and source artifacts. Context remains visible in the project index. Every state is illustrative; agent mentions never imply automatic execution. Mobile and reduced-motion layouts use direct controls without a long pinned scroll region.

Document transitions take 500ms, with 80ms staggered rows for lists. The heading arrives over 750ms; below-fold surfaces enter once over 650ms. Routine hover and press responses use the shared system. Reduced motion removes entrances and transforms. The page never hijacks scrolling or requires waiting for a timeline to finish.

The invitation preview has three directly selectable steps. Its code is explicitly illustrative. The working application and onboarding retain their existing behavior. Onboarding's quiet particle field and shared-context illustration remain separate: Codex uses the 14px reflective surface, and the finished sequence holds for five seconds. Offscreen and hidden-tab pausing and completed reduced-motion state remain intact.

A standalone Toolcraft starter exists at `../commons-material-lab` for future material studies. No Toolcraft-generated material is currently shipped in the landing; its interactions use CSS and React. The current landing composition is implemented for owner review, not final visual approval.

## Entity management

Project actions use a compact menu beside the project heading. Note actions live inside the detail panel. Settings separates Profile, Workspace and Connections. Use the shared surface, field, action-group and custom-select components; preserve the same spacing and focus behavior as onboarding. Destructive actions use the existing danger color on a graphite control and a separate confirmation panel with explicit impact. Project/workspace deletion asks for the resource name; account deletion asks for DELETE. Do not add archive/restore or request/task controls. Related actions have visible spacing; forms show pending, saved, error and stale-edit states.
