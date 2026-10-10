# Promptbook — Decisions

**Companion files:** `SPEC.md` (intent and constraints), `docs/specs/` (requirements that follow from these decisions).

A decision is recorded once, here, with what led to it and what follows from it. IDs are stable and are cited across the specification: `D` for a decision, `K` for a conflict between two things the client asked for, `Q` for a question put to the client, `A` for an assumption (in `SPEC.md` §4).

`[LOCKED]` = decided by the client's answers. `[ASSUMED]` = the builder's reading; it stands unless vetoed. `[OPEN]` = still blocks something.

---

## 1. Decisions

| # | Intent (source) | Decision | Status | Consequences |
|---|---|---|---|---|
| D1 | The client works in Obsidian (Q1, Q5). | Obsidian is allowed but nothing depends on it. The tool is browser-native. The show folder may live inside the vault. | `[LOCKED]` | Frontmatter uses the form Obsidian shows as "Properties" (TXT-11) and comments use Obsidian's `%%` (TXT-22), so both look right there. Since r1.2 a show is a zip, which Obsidian does not look into. |
| D2 | The script is in Word (Q2). | Word is abandoned after a one-time move. | `[LOCKED]` | The text is pasted once. The parser tolerates what a pasted Word text looks like (TXT-7). |
| D3 | No new syntax to learn (Q2, Q12). | The script format is the convention already in use, plus `#` headings and one cue token. No new markup language. | `[LOCKED]` | `docs/specs/01-script-text.md`. Fountain and Downstage were compared and not adopted (`docs/background/syntax-comparison.md`). Extended by D19. |
| D4 | Cues are called on a word (Q3). | A cue marks a position in the text. It can sit on a word in dialogue, on a word in an action, or stand alone between lines. No timing data. | `[LOCKED]` | CUE-1, CUE-2. Fades with durations are not data. Ends are positions too (D17). |
| D5 | Scope (Q3). | Standbys and warnings are out of scope for now. | `[LOCKED]` | Listed under R2 in `PLAN.md`. |
| D6 | The stage manager annotates by hand (Q4). | Ink over the script text is required. | `[LOCKED]` | `docs/specs/03-ink.md`; conflicts K3, K4. |
| D7 | Each show names its own departments and numbers (Q6). | Departments are configurable. Cue numbers are free text typed by the stage manager, optional, never auto-changed. Renumbering is an explicit, optional command. | `[LOCKED]` | CUE-5, CUE-6. The tool fills a blank number on a new cue only (CUE-24). The renumber command is not built. Conflict K8. |
| D8 | The client gave the page layout (Q7). | Page layout as specified in PAG-1 to PAG-3. | `[LOCKED]` | The geometry is fixed in pixels and nothing reflows. |
| D9 | What cue lists are for (Q8). | Cue lists are documentation only. No console or playback export. | `[LOCKED]` | CSV and print are the only outputs (CUE-38 to CUE-40). |
| D10 | The script was unversioned on one PC (Q9). | Storage is a plain folder. Git is optional and external. | `[LOCKED]`, amended three times | **Amended in r1.2:** the same files live in one `.zip` show file, to make moving a show easy; older folders still open; git no longer sees the individual files. **Amended in r1.7:** a git repository is inside the show and sees the individual files again (HIS-1). **Amended in r1.10:** at the client's request the show folder is no longer opened; the show file is the only storage on disk (STO-6 and STO-12 withdrawn). |
| D11 | The client wants to call the show from the tool (Q11, Q16). | That means a follow-along view for the stage manager alone. No synced screens. Postponed to R2. | `[LOCKED]` | Not built. It can use cue ends to show what is running. |
| D12 | "Zero dependencies" (Q5). | It means: one HTML file, no install, no server, no build step, no third-party libraries. The only third-party content is one embedded font (Inter, SIL Open Font License 1.1). | `[ASSUMED]` | C1, C2. Zip, git objects, CSV and the IndexedDB wrapper are hand-written. Excalidraw cannot be used (K5). "No build step" holds for the user: they open one file. The repository itself assembles that file from `src/` with `build.py`. |
| D13 | The device (Q14). | The editing device is a laptop with touchscreen and pen. R0 is built and tested for that device only. | `[LOCKED]` | C3. Assumptions A3 and A7. |
| D14 | Follows from D13. | Input is split by pointer type, with no mode switch: pen draws, finger or mouse taps and scrolls. | `[ASSUMED]` | `docs/specs/05-input.md`. The tool re-implements scrolling; pinch-zoom is gone. |
| D15 | How many people edit (Q15). | One editor. Script text is edited in one place at a time; no merge, no co-editing. | `[LOCKED]` | C4. A file changed outside is detected and the user is asked (STO-11, STO-12). No merge between variants (HIS-4). |
| D16 | Is a pen-only board enough (Q18, Q22). | Boards keep the built-in pen only (no shapes, arrows, text objects, no movable props), on condition that reusable stage backgrounds exist: board templates. | `[LOCKED]` | BRD-6, BRD-14 onward. |
| D17 | "support for end of cues" (client, v0.5). | A cue can have an end, marked at its own position in the text. An end is a position, like the cue itself; still no timing data (D4). | `[LOCKED]` in principle, design `[ASSUMED]` | CUE-9 to CUE-19. Conflict K8. Not explicitly confirmed (Q25). |
| D18 | How templates relate to boards (Q22, Q26). | A template is a board in every respect but one: it is kept in the show's configuration instead of having a place in the script. Same data, same pen. A board can be based on a template, and a template can be based on another template. Based-on is a live link, not a copy. | `[LOCKED]` | BRD-14 to BRD-16, BRD-25. Conflict K10. |
| D19 | Frontmatter request (client, v0.9). | The script may start with a frontmatter block between two `---` lines. Its values are printed on a front page in the order written, the title larger. A `characters` list in it is the reference for checking speaker names; group names such as ALL, OTHERS, ALL BUT x are never checked. This extends D3: still no new markup inside the script body. | `[LOCKED]` in principle, details `[ASSUMED]` | TXT-11 to TXT-21, PAG-7 to PAG-9. |

## 2. Conflicts in the answers

Each is a place where two things the client asked for cannot both be had in full. The resolution is the consequence the product carries.

| # | Conflict | Resolution applied | Status |
|---|---|---|---|
| K1 | Rehearsal in 2 days vs. live calling (Q11), collaboration parity with Word (Q2), ink (Q4) and the full print layout (Q7). | Tiered scope. Only R0 was promised for 2026-10-08. Live calling and anything beyond single-editor collaboration were not in R0. | Accepted (Q17) |
| K2 | "Equivalent flexibility in collaboration" (Q2) vs. "unversioned on the only PC that has it" (Q9). One of these does not describe reality. If the script lives on one PC, there is no concurrent collaboration today to be equivalent to. | One editor at a time (D15). | Resolved (Q15) |
| K3 | Ink is the fastest input (Q4) vs. generated cue lists (goal G2). Handwriting is not data. A cue written in ink never reaches the cue list. | Two inputs side by side: tap a word to drop a cue pin (structured, feeds the list); ink for everything else. Pinning must take under 3 seconds or the stage manager will ink cues instead and the list will be empty. | `[ASSUMED]` |
| K4 | Ink over text (Q4) vs. editable text (goal G1). Ink is positioned by coordinates; text reflows. | Ink belongs to one text block, not to a page. Edits elsewhere never disturb it. Editing the inked block itself flags its ink for a look. This does not eliminate re-alignment; it shrinks it from "every page after the edit" to "the lines that changed". | `[ASSUMED]` |
| K5 | Zero dependencies (Q5) vs. the stage manager's current Excalidraw habit. Excalidraw is a third-party library and cannot be inside the tool under D12. | A built-in pen replaces it: pen, eraser, colours, images. No shapes, arrows, text objects or selection. This is less than Excalidraw offers. | Accepted for now (Q18), with templates as the condition (D16) |
| K6 | "Any browser" vs. saving to a folder. Writing straight into a folder works only in Chrome and Edge; Firefox and Safari do not support it. | Chrome or Edge is the path (D13). In any other browser the show stays in the browser, with backup export and import (STO-8). | Resolved, given A7 |
| K7 | "Italian should not be relevant" (Q10). It is, slightly: accented capitals in names, and colons inside dialogue. | The parser is Unicode-aware (TXT-2). The real script is not shared (Q20); misread lines are fixed by hand in the tool, guided by the Review panel. | Accepted (Q20) |
| K8 | Cue ends (D17) vs. D7. An end has to find its start, but labels are optional, free text and may repeat. | The pairing rule of CUE-10: same department and label, nearest open cue before it; with no label, nearest open cue of that department. An end that finds nothing is a hint, not an error. | `[ASSUMED]` |
| K9 | Board templates with props (Q18) vs. K5. If props must be picked up and moved on each board, that is an object layer with selection and dragging, which K5 excluded. | Props are drawn with the pen into a template. A different arrangement is another template, usually based on the first. No movable objects. | Resolved (Q22, D18) |
| K10 | "Templates as special blocks marked as template" (Q22) vs. "live in configurations so they don't appear in the final script" (Q26). A board exists by having a line in the script; a template must have none. | The mark is where it is kept. A template has the same file shape and is drawn with the same pen, but it is listed in the configuration, edited in a Templates view, and left out of script and print. A script board cannot be marked in place; it is copied to the templates. | `[ASSUMED]` |

## 3. Questions answered

Open questions are in `SPEC.md` §5. Q1 to Q13 were answered before the first recorded version of the specification and survive only as sources in the tables above.

| # | Answer | Led to |
|---|---|---|
| Q14 | Laptop with touchscreen and pen. Browser and "same machine" not stated. | D13, A7 |
| Q15 | Assume one editor. | D15 |
| Q16 | Follow-along view, later. | D11, R2 |
| Q17 | "yes solid draft". | K1 accepted |
| Q18 | Acceptable for now; needs templates to draw on stage plans with props. | D16 |
| Q20 | "will fix manually": the real script is not shared. | K7 |
| Q22 | Templates are boards marked as template; a template can depend on another; no movable props. | D16, D18 |
| Q23 | Resolved by Q22: "depending on" means linked. | BRD-16 |
| Q24 | "build it now". | r1.0 |
| Q26 | "live in configurations so they don't appear in the final script". | D18, K10 |

## 4. The strategy that was dropped

The first plan (v0.1) was to adopt a converter, adapt a script language and build a core plus an Obsidian plugin. The answers made almost all of that unnecessary. This table is the reason the tool is one hand-written file.

| Part | v0.1 | Since v0.2 | Why |
|---|---|---|---|
| Word import | Pandoc | Paste the text | The script is already plain `NAME: text` |
| Script language | Downstage / Fountain / Markdown | The convention already in use | No new syntax to learn, no external renderer |
| Rendering and print | Typst or HTML | HTML and CSS in the browser | Zero dependencies |
| Drawings | Excalidraw plugin | Built-in pen | Zero dependencies; ink must sit on the text |
| Cue list | Dataview prototype, then core | Built in | Small |
| Host | Obsidian plugin + CLI + optional browser | One HTML file | Q5 |
| Versioning | Git | Git, optional, outside the tool; since r1.7 inside the show | Q9; request of 2026-10-09 |

**Adopt:** nothing at runtime. One open-licence font (Inter, SIL OFL 1.1) embedded in the file. **Adapt:** nothing. **Build:** `promptbook.html`.

The price of this simplicity is K3 (ink is not data), K4 (ink is flagged when its own lines change) and K5 (no Excalidraw).

## 5. Recording a new decision

1. A request arrives. Quote it, with its date, under "Intent" in the capability file it belongs to.
2. If it settles something product-wide, or contradicts an earlier answer, add a `D` or `K` row here. Never renumber; amend in place and say in which release.
3. Write the requirements it leads to, each tagged `[LOCKED]` or `[ASSUMED]`.
4. Write what follows under "Consequences" before building: what it costs, what it rules out, what an older release will do with the new data.
