# Promptbook — Specification

**Tool described:** r1.11, the first release (`VERSION` in `src/core.js`), 2026-10-13.
**State:** every requirement with a check passes in a simulated browser. The client has used part of it on a real show (`docs/verification.md` §4). Nothing has been tried on the rehearsal laptop under a recorded trial, on a phone or on paper.

---

## How to read this specification

The specification answers three questions, in this order, at every level:

1. **Intent** — why. The need, in the client's words where they exist, with the date. What the thing is for and which goal it serves.
2. **Requirements** — what must hold. One statement per ID, written so that it can be checked.
3. **Consequences** — what follows. The design that was chosen, what it costs, what it rules out, what an older release does with the new data, what was not built and what was never verified.

A change starts at the top: a request is recorded as intent, turned into requirements, and its consequences are written down before it is built. `docs/decisions.md` §5 gives the steps.

**Tags.** `[LOCKED]` = decided by the client's answers. `[ASSUMED]` = the builder's reading; it stands unless vetoed. `[OPEN]` = still blocks something.

**Requirement tables.** *Basis* is where the requirement comes from: a decision (`D`), a conflict (`K`), a request, "original scope" for what the first agreed scope listed, "code review" for the review of 2026-10-09, or "as built" when it was settled while building with no recorded client decision. *Checked by* names the test files with a check for it (`test/<name>.test.js`, `unit/` for `test/unit/`); "—" means no automated check was found.

**IDs.** `G` goal, `C` constraint, `A` assumption, `Q` question (all in this file). `D` decision, `K` conflict (`docs/decisions.md`). Requirements carry the prefix of their capability: `TXT-8`, `CUE-25`. IDs are never reused or renumbered; an ID that is not in use is named under the tables of its capability file.

**Documents.**

| File | Answers |
|---|---|
| `SPEC.md` | Why the product exists, what binds it as a whole, what is assumed and still open |
| `docs/specs/01` … `11` | Intent, requirements and consequences of each capability |
| `docs/decisions.md` | Every decision and conflict, with its source and what follows from it |
| `docs/architecture.md` | How it is built: C4 context, containers, components |
| `docs/verification.md` | What was checked, how, and what never was |
| `CHANGELOG.md` | One entry per release, written for the user |

---

## 1. Intent

### 1.1 Problem

The script is plain text in Word (`CHARACTER: dialogue`, actions in parentheses). The stage manager annotates a printed export inside Excalidraw. Every script edit forces re-export, re-import and re-alignment. Cue lists are compiled by hand.

### 1.2 Goals

| # | Goal |
|---|---|
| G1 | Script edits never require re-importing or re-aligning. |
| G2 | Cue lists are generated from the annotated script. |
| G3 | Cues are shown cleanly beside the line where they are called. |
| G4 | Printable. |
| G5 | Fast enough to use live in rehearsal, pen in hand. |
| G6 | Zero install, runs in a browser. |

### 1.3 Who it is for

| Person | Uses the tool | Gets from it |
|---|---|---|
| Stage manager | Yes: the one user it is built and tested for | The prompt book: script, cues, ink, boards, history |
| Writer or director | Edits the text, never at the same time as the stage manager (D15) | A script whose edits cost nobody a re-alignment |
| Operators (lights, sound, video) | No | Cue lists on paper and as CSV, one per department |
| Cast | A file of their own (`promptbook-cast.html`, `docs/specs/10-cast.md`): they read, they never edit the script | The text on a phone, their own lines covered for practice, their own notes, the notes sent to them; on paper, script pages, replaced pages after a change, the changes that reach each character |

### 1.4 What it is not

Not a show-control system: no console or playback export (D9), no timing data (D4). Not a co-editing tool (D15). It is a calling aid for the stage manager alone (D11, D5; `docs/specs/11-show.md`): the line that marks the place is a clock that goes through each block in the time learned for it in rehearsal, and does not know what happens on stage. Not planned at all: score or bar-number cueing, handwriting recognition, any server.

## 2. Requirements

### 2.1 Constraints

These bind every capability. Each restates a decision.

| # | Constraint | Basis |
|---|---|---|
| C1 | The tool is one HTML file. No install, no server, no third-party libraries. The only third-party content is one embedded font (Inter, SIL Open Font License 1.1). | D12 `[ASSUMED]`, G6 |
| C2 | The tool never uses the network. | D12 `[ASSUMED]` |
| C3 | It is built and tested for Chrome or Edge on a laptop with touchscreen and pen. Elsewhere it still works, with the show kept in the browser and moved by backup files. | D13 `[LOCKED]`, K6, A7 |
| C4 | One editor at a time. No merge, no co-editing. | D15 `[LOCKED]` |
| C5 | The script format is the convention already in use, plus `#` headings, one cue token and an optional frontmatter. No new markup inside the script body. | D3, D19 `[LOCKED]` |
| C6 | A show is a set of plain files the user owns, readable and hand-editable without the tool. | D10 `[LOCKED]` |
| C7 | Nothing generated is stored as a source. Cue lists, pages and page numbers are computed. | D8, D9 |
| C8 | A show written by an older release must still open. Every exception is stated under "Compatibility" in `CHANGELOG.md`. | release rule |
| C9 | The interface is in English and Italian. Every user-facing text exists in both. | as built |
| C10 | Hints, not errors. The tool lists what looks wrong and never refuses, drops or silently corrects what the stage manager or the writer typed. | D7, K7, K8 |
| C11 | Cue lists are documentation only. A cue is a position in the text, with no timing data. | D4, D9 `[LOCKED]` |

### 2.2 Capabilities

| Capability | File | Prefix | Requirements |
|---|---|---|---|
| Script text: format, editing, moving blocks, undo, frontmatter, comments | `docs/specs/01-script-text.md` | TXT | 31 |
| Cues: tokens, pin, ends, to-do notes, numbers, moving, cue list | `docs/specs/02-cues.md` | CUE | 43 |
| Ink over the script | `docs/specs/03-ink.md` | INK | 11 |
| Boards and templates | `docs/specs/04-boards.md` | BRD | 30 |
| Input: pen, finger, mouse, keyboard | `docs/specs/05-input.md` | INP | 12 |
| Pages and print, locked page numbers | `docs/specs/06-pages-print.md` | PAG | 20 |
| Storage: show file, autosave, data shapes, damaged files, compatibility | `docs/specs/07-storage.md` | STO | 25 |
| History, variants and changes | `docs/specs/08-history.md` | HIS | 15 |
| Workbench: Review, find, settings, language, toolbar, shortcuts | `docs/specs/09-workbench.md` | UI | 13 |
| Cast: notes for the actors, the cast file, the script for the actors | `docs/specs/10-cast.md` | CST | 21 |
| Show mode: read only, the running line, block times learned in rehearsal, warnings and standbys | `docs/specs/11-show.md` | SHW | 25 |

## 3. Consequences

**The constraints contradict some of what was asked for.** Ten conflicts are recorded with their resolutions in `docs/decisions.md` §2. The ones the product carries every day:

| What was wanted | What the constraints allow | Conflict |
|---|---|---|
| Ink as the way to write cues | Ink is not data. Cues are pinned by tapping; ink is for everything else. | K3 |
| Ink that never needs re-aligning | Ink is anchored to its block and flagged when that block's text changes. Re-alignment shrinks to the lines that changed. | K4 |
| The drawing tools of Excalidraw | A built-in pen and reusable templates. No shapes, text objects or movable props. | K5, K9 |
| Any browser | Saving to disk needs Chrome or Edge. | K6 |
| Collaboration as in Word | One editor at a time. | K2 |

**Everything is hand-written and lives in one file** (two, with the script for the actors). Zip, git objects, CSV, storage, pen, layout. Each covers only what the tool needs. How it is put together, and what that costs, is in `docs/architecture.md`.

**The page is frozen so that ink can hold.** Fixed geometry, one embedded font, no reflow. Several things a writer might want (emphasis, a manual page break) are absent for that reason.

**The tool can only be fully verified on the device.** Pen, finger and palm behaviour, the real file dialogs and paper are outside what the automated checks reach. Until a device trial is recorded, the tool is checked in simulation only.

**The tool reports and never blocks (C10).** A mistake does not stop a rehearsal. It also does not stop a wrong page from being printed: the Review badge is the only signal.

## 4. Assumptions

| # | Assumption | Breaks if wrong |
|---|---|---|
| A1 | Spoken-word play. No score. | Cue anchoring |
| A2 | One person edits at a time. | K2, storage |
| A3 | The pen reports as a pen to the browser. The client answered "yes" to Q21; read as all four device checks passing. Not itemised. | D14, all of `docs/specs/05-input.md` |
| A4 | A4 portrait. Q19 was answered "yes", which names neither a size nor single- or double-sided, so this stands. | Page model |
| A5 | 80–150 pages, a few hundred cues. | Performance |
| A6 | The old Excalidraw workflow stays available as fallback during the first rehearsals. Nothing is migrated destructively. | Risk posture |
| A7 | The laptop runs Chrome or Edge and is the machine that holds the show. Not stated in the answer. | Storage: in another browser the tool still works, but only with the in-browser fallback and backup files |

## 5. Open questions

| # | Question | Blocks |
|---|---|---|
| Q21 | Answered "yes". Read as: pen draws without scrolling, resting hand stays quiet, eraser end erases, print lines up. The answer does not say which were tried. | A3: correct this if any of the four was not checked |
| Q19 | Answered "yes" to a two-part question. Still unknown: paper size, and single- or double-sided printing. A4 and the built print order stand. | PAG, low priority |
| Q25 | Cue ends were built as assumed (`{/SND 5}`, one list row per cue). Not explicitly confirmed. | CUE-9 to CUE-19 |

Readings shown to the client, or built on, that were neither confirmed nor vetoed:

- Five `[ASSUMED]` decisions about boards and moving a cue: the limit of 8 boards (BRD-8), the "⋯" button (BRD-10), the grid as a show setting (BRD-12), the 0.3 s finger hold (CUE-26), a cue always lands after a word (CUE-30, CUE-32). The client saw them and did not object.
- The `[ASSUMED]` rows of `docs/specs/08-history.md` and PAG-14 to PAG-17.
- Which keys do what (UI-9), and the reading of "more modern", "less taxing on the eyes" and "less crowded" as the colours, the tag labels and the corner dock that were built (`docs/specs/09-workbench.md`). The client has not seen them.
- "Live in configurations" read as "part of the show's settings", not as strokes inside `config.json` (`docs/specs/04-boards.md`, Consequences).
- The `[ASSUMED]` readings of `docs/specs/10-cast.md` §1 and `docs/specs/11-show.md` §1.
- Silence on the `[ASSUMED]` decisions and conflicts of `docs/decisions.md` has been treated as acceptance since the first day.

## 6. Releases

| Release | Date | Content | Capability files |
|---|---|---|---|
| r1.11 | 2026-10-13 | The first release: everything the capability files describe | 01 to 11 |
| r1.12 | not released | A guide to the buttons laid over the window (UI-13). The guide for whoever uses the tool, `docs/guide/`, in English and Italian | 09 |

What a release holds for the user is in `CHANGELOG.md`. How it was checked is in `docs/verification.md`.

## 7. Sources

- Obsidian licence: https://obsidian.md/license
- Folder access browser support: https://web.dev/articles/files/open-a-directory
- Prompt book conventions: https://theatrecrafts.com/pages/home/topics/stage-management/the-prompt-book/
- Tools surveyed and not adopted: Excalidraw plugin, obsidian-fountain, Downstage, DigiScript, Pandoc. DigiScript (https://github.com/dreamteamprod/DigiScript) stays relevant as a reference for a follow-along view.
