# Promptbook — Verification

**Companion files:** `SPEC.md`, `docs/specs/` (the "Checked by" column of every requirement table points here).

---

## 1. Intent

The tool is used live, by one person, on one device, in a rehearsal that cannot wait. This record exists so that nobody has to guess what was actually checked. It keeps three things apart: what an automated check covers, what a person has seen work on the device, and what has never been tried.

The rule for every release note and every status line: say how it was checked, and say what was not.

## 2. How checks are made

| Kind | Where | Runs against | Reaches | Does not reach |
|---|---|---|---|---|
| Unit | `test/unit/*.test.js`, plain Node | `src/core.js` loaded in a `vm`, with `document` and four functions of the other two files stubbed | Parse, cue pairing, text edits, undo, compare, facing-page arithmetic, settings clean-up | Anything that needs layout, a pointer or storage |
| Browser | `test/*.test.js`, Playwright, headless Chromium | The built `promptbook.html`, from `file://`, or over `http://localhost` when the check needs files | Real clicks and keys; a simulated pen (CDP mouse events typed as pen) and simulated touch; the browser's private file system standing in for the file dialogs; print styles; generated PDFs | A real pen, finger or palm; the real "Open" and "Save" dialogs; a printer; the laptop's screen |
| Device trial | By hand, on the rehearsal laptop | The released file | Everything above | — |

A check is one line, `ok(condition, 'sentence stating the behaviour')`. A page error or a console error counts as a failure. `scripts/check.sh` builds first, then runs unit, then browser; hooks run it after edits and before a commit (`docs/architecture.md` §7).

Three properties of the method to keep in mind when reading a green result:

- A browser test file that fails while running beside others is run once more on its own, because pen and touch timing is sensitive to load. A check that fails one time in two can pass the run.
- The browser checks read the tool's internal state object (`PB.S`) directly, in 16 of its fields. They hold the implementation in place as well as the behaviour.
- The numbers of checks in this file were written down by hand at each release and have drifted from the suite before (§3, r1.1).

## 3. Record by release

| Release | Date | Automated checks | Notes as recorded at the time |
|---|---|---|---|
| R0 | 2026-10-06 | 79 pass, Chromium 141 on Linux | Then 84 with the cue-word box, including a check that no word moves when cues are added. A generated 375-page script (147,000 words, 318 cues) loads in about 0.4 s; pinning a cue takes about 60 ms. The pen eraser end could not be simulated; the barrel-button eraser path was. |
| r1.0 | 2026-10-06 | 145 pass: 84 from r0.1, 23 for cue ends, 38 for templates | Simulated pen and touch, a browser-private folder instead of the real folder dialog, PDF instead of a printer. |
| r1.1 | 2026-10-07 | 151 pass, Chromium 153 (Playwright headless shell): 127 existing, 24 new | The r1.0 suite as committed ran 127 checks, not the 145 recorded; the difference was not investigated. The front page and the character page were not printed; a list of more than 30 characters was not tried. |
| r1.2 | 2026-10-07 | No count recorded | The new checks for the show file (`test/zipshow`) were written and not run. |
| r1.3 | 2026-10-07 | No count recorded | — |
| r1.4 | 2026-10-07 | 205 pass: 166 existing, 39 new in `notes-todos` | Two test files, `parse-undo` and `zipshow`, stopped with an error before their first check; they did the same on r1.3 and were not investigated. Not printed; the comment marker not tried with a real pen or finger. |
| r1.5 | 2026-10-08 | No count recorded | The defect behind the `zipshow` failure was fixed: a reopened show file saved only its first change. The test runner, `test/unit` and the hooks date from this release. |
| r1.6 | 2026-10-08 | 443 pass: 376 browser in 13 files (243 existing, 72 new in `boards`, 61 new in `cue-move`), 67 unit in 3 files (18 existing, 23 new in `boards`, 26 new in `cue-move`). Nothing in `test/KNOWN_FAILING`. | See §4. |
| r1.7 | 2026-10-09 | 33 new browser checks in `history`, 15 new unit checks in `compare`. The history was read back with git itself (`git fsck`, `git log`, `git diff`). | See §4. |
| r1.8 | 2026-10-10 | 530 pass, none fail: 448 browser in 15 files (413 existing, 35 new in `shortcuts`), 82 unit in 4 files. Nothing in `test/KNOWN_FAILING`. Node 24.21.0, Playwright headless Chromium on Linux (WSL2). | No existing check had to change for the new toolbar. Day and night were looked at on screenshots at 1500 px; one row of toolbar was measured at 1500 and 1280 px. Not printed, PDF not opened. See §4. |

**Measured on 2026-10-09 for this restructuring**, at git `953336a`, Node 24.21.0, Playwright 1.64.0 headless Chromium on Linux (WSL2): **495 checks pass, none fail**: 413 browser checks in 14 files and 82 unit checks in 4 files. `test/KNOWN_FAILING` is empty. The 4 browser checks beyond the r1.7 record are those added to `test/misc` with the Eraser and Finger fix (`ad08c1e`).

| Test file | Checks | Capabilities it covers |
|---|---|---|
| `unit/parse` | 18 | TXT (format, frontmatter, comments, undo), CUE-1, CUE-9, UI-5 |
| `unit/cue-move` | 26 | CUE-30 to CUE-33 |
| `unit/boards` | 23 | BRD-7, BRD-8, BRD-12, STO-13 |
| `unit/compare` | 15 | HIS-8 to HIS-10, PAG-15 |
| `parse-undo` | 9 | TXT-2, TXT-5 to TXT-7, TXT-10, BRD-3 |
| `interact` | 30 | CUE-1 to CUE-3, CUE-24, CUE-35, CUE-38, INK-1, INK-2, INK-6, INK-7, BRD-1 to BRD-3, TXT-8, UI-1, UI-2 |
| `misc` | 19 | INK-2, INK-3, INK-5, INK-8, INP-5 to INP-7, CUE-6, UI-3, PAG-4, STO-2, STO-8 |
| `palm` | 4 | INP-2, INP-3 |
| `cuebox` | 5 | CUE-7, CUE-8, UI-4 |
| `scale-folder` | 22 | PAG-1, PAG-5, PAG-6, INP-1, INP-4, STO-3, STO-6, STO-7, STO-12, INK-4, INK-5, UI-5, UI-7 |
| `zipshow` | 11 | STO-1 to STO-5, STO-11 |
| `frontmatter` | 24 | TXT-11 to TXT-21, PAG-7 to PAG-9, INK-10, CUE-17 |
| `cue-ends` | 46 | CUE-9 to CUE-20, CUE-37 to CUE-39, CUE-41, INK-6 |
| `notes-todos` | 39 | TXT-22 to TXT-27, CUE-21 to CUE-24, CUE-35, CUE-36, CUE-40, INK-9, PAG-11 |
| `templates` | 38 | BRD-14 to BRD-27, PAG-11, PAG-12, STO-8, STO-13 |
| `boards` | 72 | BRD-5, BRD-7 to BRD-13, BRD-26, STO-13, UI-6 |
| `cue-move` | 61 | CUE-25 to CUE-34, INP-8 to INP-10 |
| `shortcuts` | 35 | UI-9 to UI-11, CUE-7 |
| `history` | 33 | HIS-1 to HIS-3, HIS-5 to HIS-11, PAG-13 to PAG-19, STO-6 |

Requirements with no automated check: TXT-9, TXT-18, TXT-20, CUE-4, INK-11, BRD-4, BRD-6, BRD-19, PAG-3, PAG-20, STO-9, STO-10, STO-14, HIS-4, HIS-12, UI-8. Six of these state that something does not exist or is not done (BRD-6, BRD-19, PAG-3, PAG-20, STO-10, HIS-4) and are checked by reading the code. CUE-4 is a timing with a person. The others are gaps: BRD-4 (image reduction), STO-9 (unused images dropped), HIS-12 (the message for packed history), TXT-9, TXT-20, INK-11, UI-8.

The mapping is by test file, not by single check. It was made by reading the sentence of every passing check against the requirement tables.

## 4. Never verified

Collected from every release. Nothing in this list has a recorded trial.

**On the device**

- r1.8: the colours by day and in a dark room, the filled tag labels, and whether the corner dock gets under a hand or the pen. The shortcuts on a real keyboard, an Italian one in particular (/ and ? need Shift). The filled labels on paper, in colour and on a black-and-white printer.
- Nothing of r1.6, r1.7 or r1.8 has run on the rehearsal laptop. r1.0, r1.3 and r1.4 are each recorded as "not yet tried on the laptop". r0.1 is recorded as tried. Which release ran in the rehearsal of 2026-10-08, the one the r1.6 requests came from, is not recorded.
- A real pen. The pen's eraser end could not even be simulated.
- The palm rule: a hand resting on the screen while the pen writes or hovers (INP-3).
- The finger hold on a cue tag, the pen drag from a tag, and a palm landing during a drag (INP-8, INP-9). Whether 0.3 s and 8 px suit a real finger is not known.
- The four device checks behind Q21 ("yes"): pen draws without scrolling, resting hand stays quiet, eraser end erases, print lines up. The answer does not say which were tried.
- The real file dialogs, and Chrome's refusal of top-level folders.
- A show file with a long history (HIS).
- The time it takes the stage manager to pin a cue; the target is under 3 seconds (CUE-4).
- The real script. It was not shared (Q20); the parser has only seen the sample and deliberately messy test text.

**On paper**

- Nothing has been printed, in any release. Print was checked through print styles in the browser and through the page size and page count of generated PDFs.
- The PDFs the r1.6 checks write (`boards-names.pdf`, `grid.pdf`) were not opened.
- Ink position on paper against the screen.
- The two-column board arrangement, the grid strength, and whether hairlines print at all on a laser printer.
- The front page, the character page, the changed pages and the per-actor change lists.
- Paper size and single- or double-sided printing (Q19).

**On the screen**

- Grid lightness and night mode were judged on screenshots by the build, not on the laptop's display.

The device trial that would close most of this is written out step by step in `PLAN.md`, next actions.

## 5. Old requirement IDs

Until v1.0 the specification numbered requirements by scope tier. The tier IDs collided with release names (requirement `R1.3` was board templates; release `r1.3` was linking cues), so they are retired. They are kept here to read older notes and commit messages.

| Old ID | Was | Now |
|---|---|---|
| R0.1 | Paste or open the script text; tolerant parse; review list of unclassified lines | TXT-1 to TXT-7, TXT-9, UI-1 |
| R0.2 | Page view in the locked layout, including simultaneous speech | PAG-1 to PAG-6 |
| R0.3 | Edit any block's text in place | TXT-8 |
| R0.4 | Tap a word to pin a cue; standalone cue; department, optional label and description | CUE-1 to CUE-3 |
| R0.5 | Ink over script pages: pen, eraser, undo, colours; block-anchored with the "check" flag | INK-1 to INK-8, TXT-10 |
| R0.6 | Boards on the facing page: add at a point, image or blank, ink | BRD-1 to BRD-5 |
| R0.7 | Cue list view, department filter, CSV export | CUE-35, CUE-38 |
| R0.8 | Print through the browser: script page left, boards right | PAG-11, PAG-12 |
| R0.9 | Save and load in folder mode; autosave; export-all as backup | STO-3, STO-6 to STO-8, STO-12 |
| R1.1 | Cue ends: token, pairing, one-tap entry, margin tag, cue list columns, review hints | CUE-9, CUE-10, CUE-15, CUE-16, CUE-18, CUE-37, CUE-41 |
| R1.2 | Running rail in the cue margin | CUE-17 |
| R1.3 | Board templates: configuration, Templates view, bases, chains, greyed locked rendering, loop guard | BRD-14 to BRD-20, BRD-23, BRD-25 |
| R1.4 | Template picker, default template, change of base, "To templates", rename, delete guard | BRD-21, BRD-22, BRD-24, BRD-26, BRD-27 |
| R1.5 | Frontmatter block, front page, title wins over Settings | TXT-11 to TXT-13, TXT-21, PAG-7 |
| R1.6 | Character list, speaker check, Review sections | TXT-14, TXT-16 to TXT-19 |
| R1.7 | Character page; aliases | PAG-8, PAG-9, TXT-15 |
| R1.8 | `%%` comments | TXT-22 to TXT-27, INK-9 |
| R1.9 | To-do notes as a review department | CUE-21 to CUE-23 |
| R1.10 | Cue list: Margin and Description columns, short cue line, print only from the panel | CUE-20, CUE-35, CUE-36, CUE-40 |
| R1.11 | Blank number on a new cue becomes last plus one | CUE-24 |
| R1.12 | Facing page in one or two columns; 8 per page | BRD-7, BRD-8 |
| R1.13 | Board name under the drawing; "⋯" on narrow figures | BRD-9, BRD-10 |
| R1.14 | Grid on boards and templates; show setting | BRD-11 to BRD-13 |
| R1.15 | Move a cue by dragging its tag | CUE-25 to CUE-34, INP-8 to INP-10 |
| — (r1.2, no ID) | Show file | STO-1, STO-2, STO-4, STO-5, STO-9, STO-11 |
| — (r1.3, no ID) | Linking cues, descriptions, exports per department | CUE-11 to CUE-14, CUE-19, CUE-20, CUE-39 |
| — (r1.7, no ID) | History, variants, locked pages, changes | HIS-1 to HIS-12, PAG-13 to PAG-20 |
| — (r1.8, no ID) | Look, cue labels, toolbar, shortcuts | UI-9 to UI-11, CUE-7 |

## 6. Consequences

- A green run means: the built file behaves as the checks say in headless Chromium. It does not mean the tool works under a hand.
- The riskiest code (pointer handling) is the least verifiable by this method and has changed in the two releases that have not been on the device.
- Counts are not a measure of coverage. Sixteen requirements have no check; some checks cover one requirement many times.
- Keeping this file true costs a few lines per release. Skipping it once (r1.2) hid a defect that could lose a user's work, through three releases.
