# Promptbook — Verification

**Companion files:** `SPEC.md`, `docs/specs/` (the "Checked by" column of every requirement table points here).

---

## 1. Intent

The tool is used live, by one person, on one device, in a rehearsal that cannot wait. This record exists so that nobody has to guess what was actually checked. It keeps three things apart: what an automated check covers, what a person has seen work on the device, and what has never been tried.

The rule for every release note and every status line: say how it was checked, and say what was not.

## 2. How checks are made

| Kind | Where | Runs against | Reaches | Does not reach |
|---|---|---|---|---|
| Unit | `test/unit/*.test.js`, plain Node | `src/core.js` loaded in a `vm`, with `document` and four functions of the other files stubbed | Parse, cue pairing and order, text edits, undo, compare, facing-page arithmetic, settings clean-up, the release mark, the cast pack, the arithmetic of show mode | Anything that needs layout, a pointer or storage |
| Browser | `test/*.test.js`, Playwright, headless Chromium | The built `promptbook.html` and `promptbook-cast.html`, from `file://`, or over `http://localhost` when the check needs files | Real clicks and keys; a simulated pen (CDP mouse events typed as pen) and simulated touch; the browser's private file system standing in for the file dialogs; print styles; generated PDFs | A real pen, finger or palm; the real "Open" and "Save" dialogs; a printer; the laptop's screen; a phone |
| Device trial | By hand, on the rehearsal laptop or a phone | The released file | Everything above | — |

A check is one line, `ok(condition, 'sentence stating the behaviour')`. A page error or a console error counts as a failure. `scripts/check.sh` builds first, then runs unit, then browser; hooks run it after edits and before a commit, and CI runs it on every pull request and every push to `main` (`docs/architecture.md` §7).

Three properties of the method to keep in mind when reading a green result:

- A browser test file that fails while running beside others is run once more on its own, because pen and touch timing is sensitive to load. A pass on that second run is named in the totals; a check that fails one time in two can still pass the run.
- The browser checks read the tool's internal state object (`PB.S`) directly. They hold the implementation in place as well as the behaviour.
- The numbers of checks in this file are written down by hand at each release.

## 3. Record by release

**r1.11, measured on 2026-10-13.** Node 24.21.0, Playwright 1.64.0 headless Chromium on Linux (WSL2). `sh scripts/check.sh full --force`: **1,137 checks pass, none fail**: 237 unit checks in 10 files and 900 browser checks in 20 files, the browser part in about 75 s. `test/KNOWN_FAILING` is empty. `test/damaged` needs `python3` for the two archives written by another program, and `git` for `git fsck`.

| Test file | Checks | Requirements it covers |
|---|---|---|
| `unit/parse` | 20 | TXT (format, frontmatter, comments, undo), CUE-1, CUE-9, UI-5 |
| `unit/cue-move` | 36 | CUE-30 to CUE-33, CUE-43 |
| `unit/cue-order` | 26 | CUE-5 |
| `unit/block-move` | 16 | TXT-31 |
| `unit/boards` | 23 | BRD-7, BRD-8, BRD-12, STO-13 |
| `unit/compare` | 15 | HIS-8 to HIS-10, PAG-15 |
| `unit/compat` | 20 | STO-15 to STO-17 |
| `unit/images` | 7 | STO-21 |
| `unit/cast` | 15 | CST-1, CST-2, CST-5, CST-6 |
| `unit/show` | 59 | SHW-2, SHW-5, SHW-6, SHW-9 to SHW-14, SHW-19 to SHW-24 |
| `parse-undo` | 10 | TXT-2, TXT-5 to TXT-7, TXT-10, BRD-3 |
| `interact` | 33 | CUE-1 to CUE-3, CUE-24, CUE-35, CUE-38, INK-1, INK-2, INK-6, INK-7, BRD-1 to BRD-3, TXT-8, UI-1, UI-2 |
| `misc` | 38 | INK-2, INK-3, INK-5, INK-8, INP-5 to INP-7, CUE-6, UI-3, PAG-4, STO-2, STO-8, STO-21, STO-22, STO-26 |
| `palm` | 4 | INP-2, INP-3 |
| `cuebox` | 5 | CUE-7, CUE-8, UI-4 |
| `scale-folder` | 22 | PAG-1, PAG-5, PAG-6, INP-1, INP-4, STO-3, STO-7, STO-11, INK-4, INK-5, UI-5, UI-7 |
| `zipshow` | 57 | STO-1 to STO-5, STO-11, STO-15 to STO-20, STO-25, BRD-29 |
| `frontmatter` | 31 | TXT-11 to TXT-21, PAG-7 to PAG-9, INK-10, CUE-17 |
| `cue-ends` | 53 | CUE-5, CUE-9 to CUE-20, CUE-37 to CUE-39, CUE-41, INK-6 |
| `notes-todos` | 39 | TXT-22 to TXT-27, CUE-21 to CUE-24, CUE-35, CUE-36, CUE-40, INK-9, PAG-11 |
| `templates` | 51 | BRD-14 to BRD-28, PAG-11, PAG-12, STO-8, STO-13, STO-27 |
| `boards` | 82 | BRD-5, BRD-7 to BRD-13, BRD-26, BRD-28, BRD-30, UI-6, UI-12, STO-13 |
| `cue-move` | 74 | CUE-25 to CUE-34, CUE-43, INP-8 to INP-10, TXT-28 |
| `block-move` | 34 | TXT-28 to TXT-31 |
| `shortcuts` | 61 | UI-9 to UI-13, CUE-7, CUE-42, SHW-30 |
| `history` | 31 | HIS-1 to HIS-3, HIS-5 to HIS-11, PAG-13 to PAG-19 |
| `leaks` | 22 | STO-9; object URLs and database connections are let go |
| `damaged` | 133 | STO-23 to STO-25, HIS-13 to HIS-15 |
| `cast` | 57 | CST-1, CST-3 to CST-5, CST-7 to CST-16, CST-18 to CST-20, STO-22 |
| `show` | 79 | SHW-1 to SHW-3, SHW-5, SHW-7 to SHW-15, SHW-20, SHW-22, SHW-24 to SHW-26, SHW-29, SHW-30, INP-12 |

The counts per file were taken by running each file on its own. Those of the browser files add up to 899, one fewer than the runner's total; the difference was not looked into.

The mapping is by test file, not by single check. It was made by reading the sentence of every passing check against the requirement tables.

**Requirements with no automated check:** TXT-9, TXT-18, TXT-20, CUE-4, INK-11, BRD-4, BRD-6, BRD-19, PAG-3, PAG-20, STO-10, STO-14, HIS-4, HIS-12, UI-8, CST-17, CST-21, SHW-4. Six of these state that something does not exist or is not done (BRD-6, BRD-19, PAG-3, PAG-20, STO-10, HIS-4) and are checked by reading the code. CUE-4 is a timing with a person. SHW-4 depends on the browser granting the wake lock. The others are gaps: BRD-4 (image reduction), HIS-12 (the message for packed history), CST-17 (notes exported from one device and opened on another), CST-21 (the warning when the browser keeps nothing), TXT-9, TXT-18, TXT-20, INK-11, UI-8.

**Looked at, not checked.** Day and night, the toolbar at 1500 and 1280 px, the drag of a block, show mode at 1366 × 768 and the actors' file at 390 px and 1200 px wide were judged on screenshots. In the show-mode checks time is not waited for: the clock of the line is moved by hand.

**Measured.** A generated 375-page script (147,000 words, 318 cues) loads in about 0.4 s; pinning a cue on it takes about 60 ms. The cost of checking a show file of 100 MB when it is opened, and of checking its history: `docs/specs/07-storage.md` §3 and `docs/specs/08-history.md` §3.

## 4. Never verified

Nothing in this list has a recorded trial.

**On the device**

- One report exists: the client used moving blocks, the name box of a new board, "Delete" and its key on a real show and reported "all working as expected" (2026-10-10). The report names no machine, pointer or keyboard, so these stay unrecorded: the grip under a finger with the pen hovering (palm rule), the name box with the on-screen keyboard.
- A real pen. The pen's eraser end could not even be simulated.
- The palm rule: a hand resting on the screen while the pen writes or hovers (INP-3).
- The finger hold on a cue tag or a grip, the pen drag from a tag, and a palm landing during a drag (INP-8, INP-9). Whether 0.3 s and 8 px suit a real finger is not known. A cue released between two blocks with a finger (CUE-43).
- The four device checks behind Q21 ("yes"): pen draws without scrolling, resting hand stays quiet, eraser end erases, print lines up. The answer does not say which were tried.
- The real file dialogs.
- A show file with a long history (HIS); a file damaged by a real disk; archives written by Explorer, Finder or 7-Zip (STO-23 to STO-25).
- The colours by day and in a dark room, the filled tag labels, and whether the corner dock gets under a hand or the pen. The shortcuts on a real keyboard, an Italian one in particular (/ and ? need Shift).
- Show mode: the laptop with pen and touch, a finger scroll letting go of the line, a finger press on a call, the wake lock, the pace of 130 and the weights of SHW-6 against a real run, timing a real rehearsal, a show of 100 pages, whether a jump of the page is easy to follow from the prompt desk.
- The time it takes the stage manager to pin a cue; the target is under 3 seconds (CUE-4).
- The real script. It was not shared (Q20); the parser has only seen the sample and deliberately messy test text.
- The real limit of the browser's storage (STO-26); the policy of STO-22 outside Chromium.

**On a phone**

- The script for the actors on a real phone; a cast file opened from a chat or mail attachment on Android or iOS; Safari and Firefox; night mode; print (`docs/specs/10-cast.md` §3).

**On paper**

- Nothing has been printed. Print was checked through print styles in the browser and through the page size and page count of generated PDFs, which were not opened.
- Ink position on paper against the screen.
- The two-column board arrangement, the grid strength, the filled cue labels in colour and on a black-and-white printer, and whether hairlines print at all on a laser printer.
- The front page, the character page, the changed pages and the per-actor change lists.
- Paper size and single- or double-sided printing (Q19).

**On the screen**

- Grid lightness and night mode were judged on screenshots, not on the laptop's display.

## 5. Consequences

- A green run means: the built files behave as the checks say in headless Chromium. It does not mean the tool works under a hand.
- The riskiest code (pointer handling) is the least verifiable by this method.
- Counts are not a measure of coverage. Eighteen requirements have no check; some checks cover one requirement many times.
- Keeping this file true costs a few lines per release. A check that is written and not run protects nothing: the release workflow runs every check before it publishes.
