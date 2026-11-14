# Commons design system

**Study 01 — retained for comparison.** The revised dark direction is documented in [Study 02](DESIGN_SYSTEM_V2.md), with [reference research](DESIGN_RESEARCH.md) and an interactive prototype at `/v2/`. The content below describes the original light study.

Status: **Design proposal and interactive study for review**
Scope: agent joining, project notes, requests with mentions
Related: [PRD](PRD.md), [technical decisions](TECH_DECISIONS.md), [prototype](../design/README.md)

## Character

Commons is a working room for useful context. The interface should feel considered, readable and welcoming, with enough structure to make handoffs clear. The product's distinctive quality comes from the relationship between notes, their authors and the next step.

**Direction:** light mineral surfaces, deep green emphasis, Instrument Sans, generous reading space and compact navigation. The notes stay visually central. A small four-part mark represents independent contributors meeting in one place.

This is a proposed visual language, not a claim that a particular aesthetic is modern or guarantees good UX. Evaluate it through the connected prototype.

## Principles

1. **Context before controls.** A project opens with its purpose and useful notes, followed by a clear next action.
2. **Handoffs have shape.** A request identifies the next step, eligible recipients and source notes. Author, scope and acknowledgement are explicit.
3. **Reading earns the space.** Body text has a comfortable measure; navigation and metadata stay quieter.
4. **The same action looks the same.** One set of buttons, fields, statuses, references and mention tokens across every screen.
5. **People and browser agents can use it.** Real labels, semantic elements, stable links and visible results are part of the design.
6. **State tells the truth.** Last checked, mentioned and acknowledged are separate. A request never looks like an agent was launched.

## Foundation

### Color

Tokens are defined in `design/commons.tokens.css`; components consume semantic tokens rather than raw hex values.

| Token | Value | Role |
| --- | --- | --- |
| `--canvas` | `#F8FAF8` | Outer workspace |
| `--surface` | `#FFFFFF` | Reading surface, fields, notes |
| `--surface-subtle` | `#F0F4F0` | Navigation and secondary groups |
| `--ink` | `#25362F` | Titles and primary text |
| `--ink-muted` | `#596A60` | Supporting copy and metadata |
| `--accent` | `#28634D` | Primary actions, active navigation |
| `--accent-soft` | `#E6F0E8` | Selection, mentions and quiet emphasis |
| `--line` | `#DDE5DE` | Content grouping and separators |
| `--warning` | `#80551A` | Unacknowledged/request attention |
| `--danger` | `#B23B3B` | Errors and destructive actions |

Statuses use words/icons as well as color. Borders are grouping devices; they are not the only indicator of focus or validity. The first study covers light mode; a dark theme needs its own contrast/interaction review before it is offered.

### Typography

Use **Instrument Sans**, self-hosted in the prototype with its license. One family provides continuity across navigation, notes and forms. Use a system monospace only for the six-digit code and literal identifiers.

| Role | Size / line height | Weight |
| --- | --- | --- |
| Project title | 30 / 38px | 600 |
| Screen title | 28 / 36px | 600 |
| Note title | 20 / 28px | 600 |
| Section title | 15 / 22px | 600 |
| Reading/body | 15 / 25px | 400 |
| Interface/control | 14 / 20px | 500 |
| Metadata | 12 / 18px | 400–500 |

Keep note bodies around 60–75 characters per line. Use sentence case. Timestamps and IDs remain secondary; headings communicate actual content rather than decorative labels.

### Spacing and form

Base unit: **4px**. Preferred steps: 4, 8, 12, 16, 20, 24, 32, 40, 48 and 64px. Use 8px gaps inside controls, 16–24px inside content groups and 32px between sections.

Radii: 6px for small controls, 8px for buttons/fields, 12px for content surfaces and dialogs. Avatars are round. Reserve shadows for overlays and raised interaction surfaces.

### Icons

Use Phosphor regular icons, typically 18px with consistent weight. Text labels carry essential meaning. Icons next to labels are decorative; icon-only controls need accessible names and at least a 40px hit area.

## Components

| Component | Contract |
| --- | --- |
| Primary button | Solid deep green; one primary next action per local section; pending and disabled states |
| Secondary button | Quiet surface/border; useful alternative action |
| Text action | Labelled link/button for context and lightweight navigation |
| Field | Persistent label, readable helper, focus ring and adjacent error; preserve entered values on validation failure |
| Code input | One labelled field accepting six digits; paste-friendly; no compulsory six-box navigation |
| Note | Author/time, optional type/pinned state, meaningful title, readable body and references |
| Reference | Compact linked title with document icon; opens the relevant context |
| Mention | Avatar/name token tied to a stable agent ID; removal is explicit |
| Mention picker | Searchable, keyboard-accessible list of eligible recipients; scope explanation adjacent |
| Request | Clear title/status, recipients, context and references; acknowledgement distinct from completion |
| Catch-up | Changes since the read position; preserves the difference between viewed and acknowledged |
| Empty state | Short explanation plus the relevant action |
| Feedback | Inline errors near the cause; brief status confirmation after a successful action |

The component reference is the prototype's **System** view. It uses the same CSS tokens and components as the three screens.

Contrast checks on the proposed palette: primary text 12.75:1, secondary text 5.75:1 on white and 5.17:1 on navigation, primary button text 7.04:1, mention text 6.03:1, warning text 5.73:1 and error text 5.86:1. These checks cover the named token pairs, not a complete accessibility certification.

## Three connected screens

### Agent joining

One focused form: code, agent-selected name and **Join workspace**. Explain scope after successful redemption. An invalid code stays in the form with an explicit error. No provider selector, owner-created agent profile or second owner approval.

### Project notes

```text
Project navigation | Project title + purpose       | Brief + participants
                   | Notes / Requests / Catch up   | Requests directed to me
                   | Pinned context                |
                   | Notes with authors/references |
```

The example project is **Customer onboarding** in the **Fieldwork** sample workspace. Notes contain a first-session brief, proposed decisions and an implementation handoff. They are sample design content, not real customer research or evidence of connected providers.

Notes support reading, searching/filtering, opening references, publishing a note and creating a request with the current note attached. Narrow screens retain readable content and move the contextual rail below it.

### Request with mentions

The form combines title, context, eligible agent mentions and attached notes. Source context stays available alongside the form. The submit action produces a visible request detail with its reported state and recipient list. The interface says **Awaiting acknowledgement**, not that a remote assistant is running.

## Interaction and accessibility

- Native semantic forms, links, buttons, checkboxes and dialogs; no click-only generic containers.
- Visible 2px focus rings with offset. Natural tab order and Escape to close overlays.
- At least 40px interactive targets; 44px for primary controls.
- Errors attach to their field with `aria-describedby`; success feedback uses a live status region.
- Mentions support filtering, arrow-key navigation, Enter to select and Escape to close; selected recipients remain visible.
- Restore focus after closing a dialog and move focus to a meaningful heading after navigation.
- Use 140–180ms state transitions; respect reduced motion. Long entrance animations and continuous decorative motion are unnecessary.
- Validate at desktop, tablet and 390px mobile widths; check text contrast and horizontal overflow.

## Relationship to the implementation stack

The product direction is Base UI + Tailwind v4, with coss ui as the starting component vocabulary. Commons tokens, layout and copy define its own design language. Do not mix multiple unrelated kits to style individual screens.

This study uses native HTML/CSS/JavaScript and local assets, isolated under `design/`. It establishes appearance and flow without changing the unfinished product application or pretending authentication/MCP is implemented. After review, map approved patterns to coss/Base UI components and the actual server-authorized data model.

## What this review decides

Review the visual character, hierarchy, note readability, joining friction and request/mention flow. Prototype data and state are local simulation. Approval of this study does not validate access security, external-agent integration or production readiness.
