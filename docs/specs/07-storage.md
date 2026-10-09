# Storage — STO

**Covers:** where a show is kept, the show file, the older show folder, the in-browser fallback, autosave, changes made outside the tool, the shapes of the saved data, compatibility between releases.
**Code:** `src/io.js` (STORE, zip, draft and IndexedDB, open and import), `src/core.js` (`normCfg`, `inkFile`, `attachInk`).
**Checks:** `test/zipshow`, `test/scale-folder`, `test/misc`, `test/templates`, `test/boards`, `test/history`.
**Columns and tags:** explained in `SPEC.md`, "How to read this specification".

---

## 1. Intent

The script was "unversioned on the only PC that has it" (Q9). The intent is that a show is a set of plain files the user owns: readable and hand-editable without the tool, with no account and no server (D10, C1, C2).

Two later needs changed where those files sit:

- **r1.2, one file:** a folder of loose files is awkward to move between machines. A show became one `.zip` file holding the same files. Older folders still open.
- **r1.7, history:** the request for "git versioning below" put a git repository inside the show (`08-history.md`).

Writing straight into a file on disk works only in Chrome and Edge (K6). The intent for any other browser, and for the moment before a file is chosen, is that the tool stays usable and nothing is lost: the show is kept in the browser and can be exported.

## 2. Requirements

### 2.1 Where a show is kept

| ID | Requirement | Basis | Since | Checked by |
|---|---|---|---|---|
| STO-1 | A show is one `.zip` file holding `script.md`, `script.ink.json`, `config.json`, `boards/` and `templates/`, and `.git/` once it has a history. Any zip tool can open it. Copying that file moves the show. | D10 as amended | r1.2, r1.7 | zipshow, history |
| STO-2 | Menu → "Save as show file…" creates the file; "Open show file…" opens it. | r1.2 | r1.2 | zipshow, misc |
| STO-3 | Every change is saved without a command, shortly after it is made. The status beside the title says "Saving soon", "Saving…", "Saved hh:mm" or "Save failed". Leaving the page with unsaved changes or after a failed save asks first. | R0.9 | r0 | scale-folder, zipshow |
| STO-4 | A folder zipped by hand (Explorer, Finder) opens as it is: the extra top-level folder is ignored, and so is the clutter macOS adds. | r1.2 | r1.2 | zipshow |
| STO-5 | A file that is not a zip is refused with a message, and the open show stays open. | as built | r1.2 | zipshow |
| STO-6 | Older show folders still open ("Open older show folder…"). "Save as show file…" converts one, images and history included; only the show's own files are copied, so the zip never contains the empty file the save dialog creates or other stray files. | D10 as amended | r1.2, r1.7 | scale-folder, history |
| STO-7 | The start screen offers to reopen the last show file or folder with one click. | as built | r0 | scale-folder |
| STO-8 | A show that is not on disk is kept in the browser: a banner says so and offers "Save as show file…" and "Export backup". The start screen offers to continue that draft. "Export backup" and "Import backup…" move the whole show as one `.promptbook.json` file, images included. | K6, as built | r0 | misc, templates |
| STO-9 | Images no board or template uses are dropped from a show file on save. | r1.2 | r1.2 | — |
| STO-10 | Nothing generated is stored as a source. Cue lists are computed on screen and exported on demand (C7). | D9 | r0 | — |

### 2.2 Changes made outside the tool

| ID | Requirement | Basis | Since | Checked by |
|---|---|---|---|---|
| STO-11 | Show file: if another program replaces the file (sync, copy over), it is reloaded when nothing is unsaved; otherwise a banner asks "Keep mine" or "Load that version". Nothing is overwritten while the question is open. | r1.2; fixed r1.5 | r1.2 | zipshow |
| STO-12 | Show folder: if `script.md` is edited in another program while the tool is open, the tool reloads it without a re-import; ink on untouched blocks is undisturbed, ink on a changed block is flagged (INK-4). If both sides changed, it asks instead of overwriting. | K4, as built | r0 | scale-folder |

### 2.3 Data shapes

`script.md` is the script as typed, with cue and board tokens (TXT, CUE-1, BRD-2). It is the source of truth.

`config.json`, as a new Italian show writes it:

```json
{ "title": "",
  "paper": "A4",
  "departments": [
    { "code": "LX",   "name": "Luci",    "colour": "#c98a00", "review": false },
    { "code": "SND",  "name": "Audio",   "colour": "#1f6fd6", "review": false },
    { "code": "VID",  "name": "Video",   "colour": "#7a3fd1", "review": false },
    { "code": "TODO", "name": "Da fare", "colour": "#d62828", "review": true } ],
  "defaultBoard": null,
  "templates": [], "defaultTemplate": null, "recentTemplates": [],
  "templateFade": 0.4,
  "boardGrid": 25,
  "lock": null }
```

| Field | Meaning | Read as | Since |
|---|---|---|---|
| `title` | Show title; the script's own `title` wins (TXT-13) | text | r0 |
| `paper` | `A4` or `Letter` | anything else is `A4` | r0 |
| `departments` | `code`, `name`, `colour`, `review` (to-do notes, CUE-21) | codes are put in capitals and stripped to letters, digits, `_`, `-`; `BOARD` is not allowed; an empty list gives the defaults | r0; `review` r1.4 |
| `defaultBoard` | `image`, `h`: the background set with "Use as default" before r1.0 | kept working until a default template is chosen (BRD-27) | r0 |
| `templates` | Template names, in order | names without a file are dropped | r1.0 |
| `defaultTemplate`, `recentTemplates` | The default template; the last used, newest first, at most 12 | — | r1.0 |
| `templateFade` | Strength of the greyed chain | kept between 0.15 and 0.8; 0.4 when missing | r1.0 |
| `boardGrid` | Grid step in board units: `0` off, `25` fine, `50` coarse | a missing or other value is 25 | r1.6 |
| `lock` | Locked page numbers (PAG-14) | dropped unless all five lists are present | r1.7 |
| `runs` (per department) | "Cues run until stopped", r1.0 to r1.2 | ignored | removed r1.3 |

`script.ink.json`:

```json
{ "version": 1,
  "blocks": [
    { "text": "ANNA: Chi è là? Rispondi!",
      "lines": 1,
      "strokes": [ { "colour": "#c00", "width": 0.12, "points": [[0.4,0.2],[0.9,0.25]] } ] } ] }
```

`text` is the block with cue tokens removed, so adding a cue does not flag the ink. Coordinates are in units of the text size (15 px), from the top-left corner of the block's text column. A block entry may also carry `inked`, the text as it was when the ink was drawn, present only while the ink is flagged. The file may carry an `orphans` list of the same shape.

`boards/<name>.json` has the same stroke shape plus `name`, `image` (file name), `w` (always 1000), `h`, and `base` when the board is built on a template. Board coordinates are in those units, so ink scales with the board. `templates/<name>.json` has the board shape. The image file sits beside the JSON file.

The backup is `{ "format": "promptbook", "version": 1, "when", "config", "script", "ink", "boards", "templates" }`, with each image as a data URL in `imageData`.

In the browser: `localStorage` holds `promptbook:draft` (a backup object) and `promptbook:view` (`facing`, `cues`, `ink`, `night`, `finger`, `lang`); IndexedDB database `promptbook`, store `kv`, key `dir` holds the handle of the last show.

### 2.4 Compatibility

| ID | Requirement | Basis | Since | Checked by |
|---|---|---|---|---|
| STO-13 | A show written by an older release opens in a newer one. Every exception is stated under "Compatibility" in `CHANGELOG.md`. | C8 | r1.0 | templates, boards, unit/boards |
| STO-14 | The reverse is not promised: the changelog says, release by release, what an older tool does with a newer show. | C8 | r1.0 | — |

| Show written by | Opened with | Result |
|---|---|---|
| r0.1 | r1.0 and later | Opens unchanged. |
| r1.0, using ends or templates | r0.1 | `{/…}` shown as unknown cues; templates ignored. Do not edit. |
| r1.1, with frontmatter | r0.1, r1.0 | Text kept, frontmatter lines shown as unrecognised on page 1. Do not edit. |
| r1.2 show file | r1.1 and earlier | Cannot be opened. Their folders open in r1.2. |
| r1.3, using links or descriptions | r1.2 | `6 / SND 5` shown as the label, the description as part of the margin text. Do not edit. |
| r1.4, using `%%` or TODO | r1.3 | Commented text shown as unrecognised lines and printed; TODO notes are ordinary cues. Do not edit or print. |
| r1.5 | r1.4 | Opens. |
| r1.6 | r1.5 | Opens; the grid setting is ignored. |
| r1.7 | r1.6 | Opens and keeps the history when it saves a show file; plain page numbers, no History menu; drops the history when a show folder is saved as a show file. |

## 3. Consequences

**A show file is rewritten whole on every save.** The files of an open show file live in memory; a save builds the archive again and replaces the file. This is simple and atomic. It also means the cost of one pen stroke is the size of the show, history included (`docs/review-2026-10-09.md`, X6).

**In a show file, `script.md` cannot be edited from outside while the tool is open.** Unzip, edit, zip again; or use "Edit whole script…". The outside-edit path of STO-12 exists only for an older show folder. This is the price of D10's amendment in r1.2.

**The parts of a show file are read into memory when it is opened, board images included.** Until r1.5 they were read lazily from the file, which stopped working once the file had been rewritten: after a show file was opened, only the first change was saved. A user who worked in r1.2 to r1.4 on a show opened from its file may have lost what came after the first change. The checks for the show file (`test/zipshow`) were written at r1.2 and released without being run; at r1.4 the file was recorded as stopping with an error before its first check, not investigated; the defect was found and fixed in r1.5.

**Storage needs Chrome or Edge (K6, A7).** In another browser the tool still works, with the in-browser fallback and backup files only. Chrome and Edge refuse the top level of Desktop, Documents and Downloads as a show folder; a sub-folder is fine.

**Compatibility is kept by convention.** Nothing in `config.json` or in the show file says which release wrote it or which release is needed to read it; `version` in the ink file and in the backup is written and never read. The table above is the only guard, and it relies on the user reading the changelog (`docs/review-2026-10-09.md`, X7).

**Files are left behind.** The tool does not delete the file of a renamed or removed board or template. One exception since r1.7: restoring a revision or changing variant in a show folder removes the files in `boards/` and `templates/` that the revision does not have (`docs/review-2026-10-09.md`, X9).

**Board files are named after the board**, in lower case with accents and punctuation dropped (`boards/sala-a.json`). Two boards whose names come out the same share one file (`docs/review-2026-10-09.md`, X1).

**Not built:** zip64 (a show file over 4 GB), encrypted zip entries, a format version checked on open.

**Not verified:** the real file dialogs. The checks use the browser's private file system through the same interface; the real "Open" and "Save" pickers were never exercised by a check.
