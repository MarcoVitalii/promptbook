# Storage — STO

**Covers:** where a show is kept, the show file, the in-browser fallback, autosave, changes made outside the tool, the shapes of the saved data, compatibility between releases.
**Code:** `src/io.js` (STORE, zip, draft and IndexedDB, open and import, `relStamp`, `relWarn`), `src/core.js` (`normCfg`, `dataImg`, `inkFile`, `attachInk`, `READABLE_FROM`, `relCmp`, `relMark`, `relNewer`).
**Checks:** `test/zipshow`, `test/scale-folder`, `test/misc`, `test/templates`, `test/boards`, `test/history`, `test/damaged`, `test/unit/compat`, `test/unit/images`.
**Columns and tags:** explained in `SPEC.md`, "How to read this specification".

---

## 1. Intent

The script was "unversioned on the only PC that has it" (Q9). The intent is that a show is a set of plain files the user owns: readable and hand-editable without the tool, with no account and no server (D10, C1, C2).

Requests that settled where those files sit:

- **One file:** a folder of loose files is awkward to move between machines. A show is one `.zip` file holding those files.
- **Only the file:** "time to prune silly or old features to keep the code light. remove support for older folders, work only on zipped show files." A show kept as a folder does not open.
- **History:** the request for "git versioning below" put a git repository inside the show (`08-history.md`).

A review of the code (2026-10-09) added five needs:

- **A part that cannot be read:** "Tell 'missing' from 'unreadable'. On unreadable: say so, keep the damaged file under another name, and do not write over it until the user has chosen." (STO-18 to STO-20)
- **Which release a show needs:** "Write the oldest release able to read the show into `config.json` and warn, not refuse (C10), when a show needs a newer tool. Carry unknown department fields through." The intent is that a stage manager who opens a show with too old a tool is told so, in words that say what to do, and can still work (STO-15 to STO-17).
- **Nothing is asked of a host:** C2 holds whatever a file contains. A show, a backup or a draft is data, and nothing in it can make the tool ask a host for anything (STO-21, STO-22).
- **Nothing is lost quietly:** "Say so when it happens." The tool never leaves the user believing it holds something it does not: when the copy in the browser is kept without the images, or not at all, it says so in words that say what to do; and a template the settings name and the show file does not have is named, not forgotten (STO-26, STO-27).
- **A damaged file never passes for the show:** the CRC of each zip entry is verified on read, so that a failing disk or a copy cut short is found. Either the file is refused and stays as it is, or the show opens without the part that is damaged, says which, and keeps its bytes; zip files written by other programs still open (STO-23 to STO-25). The history is the subject of `08-history.md` (HIS-13 to HIS-15).

Writing straight into a file on disk works only in Chrome and Edge (K6). The intent for any other browser, and for the moment before a file is chosen, is that the tool stays usable and nothing is lost: the show is kept in the browser and can be exported.

## 2. Requirements

### 2.1 Where a show is kept

| ID | Requirement | Basis | Checked by |
|---|---|---|---|
| STO-1 | A show is one `.zip` file holding `script.md`, `script.ink.json`, `config.json`, `boards/` and `templates/`, and `.git/` once it has a history. Any zip tool can open it. Copying that file moves the show. | D10 | zipshow, history |
| STO-2 | Menu → "Save as show file…" creates the file; "Open show file…" opens it. | as built | zipshow, misc |
| STO-3 | Every change is saved without a command, shortly after it is made. The status beside the title says "Saving soon", "Saving…", "Saved hh:mm" or "Save failed". A save that fails also says why in a short message ("Could not save: …"), once: the same reason is not announced again until a save has gone through, and stays as the tooltip of the status. Leaving the page with unsaved changes or after a failed save asks first. | original scope; code review | scale-folder, zipshow |
| STO-4 | A folder zipped by hand (Explorer, Finder) opens as it is: the extra top-level folder is ignored, and so is the clutter macOS adds. | as built | zipshow |
| STO-5 | A file that is not a zip is refused with a message, and the open show stays open. | as built | zipshow |
| STO-7 | The start screen offers to reopen the last show file with one click. Anything remembered that is not a show file is not offered. | as built | scale-folder |
| STO-8 | A show that is not on disk is kept in the browser: a banner says so and offers "Save as show file…" and "Export backup". The start screen offers to continue that draft. "Export backup" and "Import backup…" move the whole show as one `.promptbook.json` file, images included. What the browser can keep has a limit: STO-26. | K6, as built | misc, templates |
| STO-9 | Images no board or template uses are dropped from a show file on save. An image that a board or a template of the open show names is never dropped, even when its drawing is not written yet. | as built | leaks |
| STO-10 | Nothing generated is stored as a source. Cue lists are computed on screen and exported on demand (C7). | D9 | — |

### 2.2 Changes made outside the tool

| ID | Requirement | Basis | Checked by |
|---|---|---|---|
| STO-11 | Show file: if another program replaces the file (sync, copy over), it is reloaded when nothing is unsaved; otherwise a banner asks "Keep mine" or "Load that version". Nothing is overwritten while the question is open. Ink on untouched blocks is undisturbed and ink on a changed block is flagged (INK-4). | D15, as built | zipshow, scale-folder |

Not in use: STO-6 and STO-12. Both were about a show kept as a folder of loose files, which the tool does not open.

### 2.3 Data shapes

`script.md` is the script as typed, with cue and board tokens (TXT, CUE-1, BRD-2). It is the source of truth.

`config.json`, as a new Italian show writes it:

```json
{ "title": "",
  "paper": "A4",
  "departments": [
    { "code": "LX",   "name": "Luci",    "colour": "#c98a00", "review": false, "cast": false },
    { "code": "SND",  "name": "Audio",   "colour": "#1f6fd6", "review": false, "cast": false },
    { "code": "VID",  "name": "Video",   "colour": "#7a3fd1", "review": false, "cast": false },
    { "code": "TODO", "name": "Da fare", "colour": "#d62828", "review": true,  "cast": false } ],
  "defaultBoard": null,
  "templates": [], "defaultTemplate": null, "recentTemplates": [],
  "templateFade": 0.4,
  "boardGrid": 25,
  "lock": null,
  "castId": "",
  "show": { "wpm": 130, "standby": 30, "warning": 120, "times": {} },
  "release": { "made": "r1.11", "needs": "r1.10" } }
```

| Field | Meaning | Read as |
|---|---|---|
| `title` | Show title; the script's own `title` wins (TXT-13) | text |
| `paper` | `A4` or `Letter` | anything else is `A4` |
| `departments` | `code`, `name`, `colour`, `review` (to-do notes, CUE-21), `cast` (notes for the actors, CST-1; a cast department is always `review` too) | codes are put in capitals and stripped to letters, digits, `_`, `-`; `BOARD` is not allowed; an empty list gives the defaults; a field not in this list is kept as it is (STO-17) |
| `defaultBoard` | `image`, `h`: a default background for new boards. The tool has no control that sets it | when present, used until a default template is chosen (BRD-27) |
| `templates` | Template names, in order | a name without a file gives no template; it is said and the name stays in the saved list, after the others (STO-27) |
| `defaultTemplate`, `recentTemplates` | The default template; the last used, newest first, at most 12 | — |
| `templateFade` | Strength of the greyed chain | kept between 0.15 and 0.8; 0.4 when missing |
| `boardGrid` | Grid step in board units: `0` off, `25` fine, `50` coarse | a missing or other value is 25 |
| `castId` | The name of the show in the files for the cast (CST-15); written when the first is saved | anything but text is `""` |
| `lock` | Locked page numbers (PAG-14) | dropped unless all five lists are present |
| `release` | `made`: the release that saved the show last. `needs`: the oldest release that opens and saves it without loss (STO-15) | a show without it, or with a `needs` that is not a release name, opens with no message; a `needs` newer than the tool gives the warning of STO-16 |

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

`damaged/` holds parts that could not be read, as they were found (STO-19). The tool writes there and never reads it; it is not part of the history.

In both file names `<name>` is the name in lower case, accents and punctuation dropped, spaces as hyphens (`boards/sala-a.json`), and `board` when nothing is left. For a board the file name is only where to look first; the `name` inside says whose drawing it is (BRD-29):

1. When a show is opened, each `{BOARD name}` of the script gets the file in `boards/` whose `name` is exactly that name. If several have it, the one named after the board, else the first by file name.
2. A name that no file holds gets the file named after it, unless a board of the script has that file by rule 1 or took it by this rule before (script order). This is how a file made by hand, or a board whose name was retyped by hand in `script.md`, is still found; the `name` in the file is corrected at the next save.
3. A board saved for the first time is written to the file named after it. If that file exists and holds another name, or none, it is written to the first free of `<name>-2.json`, `<name>-3.json`, and so on. No file that holds another name is written into.

The backup is `{ "format": "promptbook", "version": 1, "when", "config", "script", "ink", "boards", "templates" }`, with each image as a data URL in `imageData`.

In the browser: `localStorage` holds `promptbook:draft` (a backup object) and `promptbook:view` (`facing`, `cues`, `ink`, `night`, `finger`, `lang`); IndexedDB database `promptbook`, store `kv`, key `dir` holds the handle of the last show.

### 2.4 Compatibility

| ID | Requirement | Basis | Checked by |
|---|---|---|---|
| STO-13 | A show written by an older release opens in a newer one. Every exception is stated under "Compatibility" in `CHANGELOG.md`. | C8 | templates, boards, unit/boards |
| STO-14 | The reverse is not promised: the changelog says, release by release, what an older tool does with a newer show. The show says it too (STO-15, STO-16). | C8 | — |
| STO-15 | A show says which release saved it last and which is the oldest able to open and save it without loss: `release.made` and `release.needs` in `config.json`, and so in a backup. The mark is written at the first save by this release, whatever was changed; opening a show does not write it. `needs` is one constant of the tool, raised only when a saved format changes in a way an older release would damage. A `needs` newer than that constant, left by a newer release, is kept when this release saves. Release names are compared part by part as numbers: r1.9 is older than r1.10. | code review | zipshow, unit/compat |
| STO-16 | A show that needs a release newer than the tool is opened all the same (C10), with a box that names the release it asks for and the release in use, says that what this release does not know may be shown wrongly and dropped when it saves, and says what to do: get the newer `promptbook.html`. It comes on every opening, also from a backup, until the tool is new enough. A show with no mark opens with no message. | code review, C10 | zipshow, unit/compat |
| STO-17 | A field of a department, or of the show-mode settings (`show`), that this release does not know is kept through opening, the Settings box and saving, so that what a later release adds survives a save by this one. Settings of the show it does not know are kept too. | code review | zipshow, unit/compat |

| Show | Result |
|---|---|
| Saved by a later release, with `release.needs` newer than the tool | Opens with the warning of STO-16. |
| With no release mark: written by hand, or by a build made before r1.11 | Opens with no message. |
| Kept as a folder of loose files | Cannot be opened. Zip the folder and open the zip (STO-4); the history comes along only if the hidden `.git` folder is in the zip. |
| A backup or draft edited by hand so that `imageData` is a web address | Opens; that board, template or default board has no image (STO-21). The tool never writes such a value. |
| Two boards whose names give one file name, with one drawing file between them | Opens. The board whose name is inside the file has the drawing; the other is empty (§2.3, rules 1 and 2). |
| A show file with a damaged entry, a part cut off, or an entry protected by a password, whatever wrote it | Refused with a message, or opened without the damaged entry and with the banner of STO-18 (STO-23, STO-24). |

### 2.5 A part that cannot be read

| ID | Requirement | Basis | Checked by |
|---|---|---|---|
| STO-18 | A part of a show file that is there but cannot be read (`config.json`, `script.ink.json`, any drawing in `boards/`, whether or not a board of the script uses it, the file of a template the settings list) is not treated as missing. The show opens without it, and a banner names each such part and says that nothing is saved until the user chooses. While the banner is up no change is written to the show file, and History refuses to open. | code review | zipshow |
| STO-19 | "Go on without" saves the show as it is on screen and keeps every unreadable part, byte for byte, in the folder `damaged/` of the show file, under its own path (`damaged/config.json`, `damaged/boards/pianta.json`); a later one of the same name goes to `damaged/2/`, and so on. "Close the show" leaves the show file exactly as it was. | code review | zipshow |
| STO-20 | A part that is missing stays silent: a new show, or a show without that part, opens with no message. The one exception is a template the settings name (STO-27): the tool writes a name and its file together, so a name alone means the show file lost a part or was changed by hand. | code review, C8 | zipshow |
| STO-23 | A show file whose archive cannot be followed is refused, with a message that says why ("Could not open the show: damaged zip file"), and is not touched; a show that was open stays open. That is: a file cut short at any length; a directory, an entry or a header whose offset or size points outside the file or into another part; a number of entries that is not what the directory holds; a header in front of an entry that does not carry the name and the compression the directory gives for it. Refused too, each with its own sentence: an entry protected by a password, a compression other than "stored" and "deflate", zip64. | code review | damaged |
| STO-24 | When a show file is opened, the bytes of every entry are checked against the size and the CRC-32 the archive records for them. An entry that does not unpack, or does not match, is a part that cannot be read (STO-18): the show opens without it, the banner names it, nothing is saved until the user chooses, and "Go on without" keeps it under `damaged/` (STO-19) as it was found; an entry that could not be unpacked is kept still packed, as `damaged/<path>.deflate`. This holds for every entry: the script (the show opens with no text, and is not asked for one), an image, a file the tool does not know, and the files of the history, which the banner names once as `.git` (HIS-15). | code review | damaged |
| STO-25 | A show file the tool wrote, and a zip written by another program, open: one top-level folder, folder entries, an archive comment, sizes and CRC written after the data (data descriptors) are all read; an archive with no entry opens as a show with nothing in it. | code review, C8 | damaged, zipshow |

### 2.6 Nothing is asked of a host

| ID | Requirement | Basis | Checked by |
|---|---|---|---|
| STO-21 | A board, template or default-board image that arrives inside a backup, a draft or `config.json` (`imageData`) is kept only when it is the picture itself, a `data:image/…` URL. Anything else (a web address, a file path, another kind of data) is dropped: the show opens whole and that board has no image. | C2, code review | misc, unit/images |
| STO-22 | `promptbook.html` carries a Content-Security-Policy, so the browser refuses every request to a host whatever a show file, a backup or a draft holds. `promptbook-cast.html` carries a narrower one (CST-7). | C2, code review | misc, cast |

### 2.7 What is not kept is said

| ID | Requirement | Basis | Checked by |
|---|---|---|---|
| STO-26 | The browser keeps a show that is not on disk (STO-8) within a limit of its own. When the show with its board images is over that limit, it is kept without the images of boards, templates and the default board, and a message and the banner say so and say what to do: save as a show file or export a backup, neither of which has the limit. When even that cannot be kept, nothing is written, the copy in the browser stays as it last was, and it is a failed save (STO-3): "Could not save: …" with what to do, "Save failed" as the status, the same words in the banner, and leaving the page asks first. Each is said when it starts, not at every save, and again if it stops and starts again; the banner stays for as long as it is true. The open show keeps its images throughout, so saving or exporting at that moment loses nothing. | code review | misc |
| STO-27 | A template that `config.json` names and that has no file in the show file is not forgotten. When the show opens a message names each such template; the Templates view names them too, each with the file it would be read from (`templates/<name>.json`), for as long as it is so. The names stay in the saved list, after the templates that are there, so a file put back by hand is a template again at the next opening. A name is let go only when a template is given that name (or one saved under the same file name), or when the user presses "Forget these names" in the Templates view. A template whose file is there and cannot be read is a damaged part (STO-18), not a missing one. | code review | templates |

## 3. Consequences

**A show file is rewritten whole on every save.** The files of an open show file live in memory; a save builds the archive again and replaces the file. This is simple and atomic. It also means the cost of one pen stroke is the size of the show, history included (`08-history.md` §3).

**In a show file, `script.md` cannot be edited from outside while the tool is open.** Unzip, edit, zip again; or use "Edit whole script…". This is the price of keeping the show in one file (D10).

**The parts of a show file are read into memory when it is opened, board images included.** They cannot be read later from the file: every save replaces it.

**"Cannot be read" means: not JSON, or JSON of the wrong kind.** A part that does not parse (cut short, empty, overwritten with something else), that is not a JSON object, or, for a board or a template, that has no list of strokes, is unreadable (STO-18). A part that parses and merely holds odd values is read (§2.3, "Read as").

**The unreadable part is moved aside in memory as the show opens, and reaches the disk only with the first save.** That first save is the user's choice: "Go on without", or "Save as show file…", which writes the show and its `damaged/` folder to the new file and leaves the old file alone. With `config.json` unreadable the list of templates is unknown, so no template is loaded; their files stay in `templates/` and come back once the settings name them again. To repair by hand: unzip, mend the file in `damaged/`, put it back in its place, zip. With a history, the last revision may still hold a good copy (HIS). The tool never empties `damaged/`, and restoring a revision or changing variant keeps it.

**The question is a banner, not a dialog**, like the one for a file changed by another program (STO-11), and the two can meet: when the file is also replaced from outside while changes wait, the banner of STO-11 is shown first, and "Keep mine" writes the show, `damaged/` included, over the other version; the banner of STO-18 then returns. In show mode no banner is visible (SHW); nothing is saved there either until the question is answered.

**A missing template keeps its name; it is not dropped once said (STO-27).** The other choice was to say it once and shorten the list. The name was kept because it costs nothing and is the only record that the template existed: a file of that name put back in `templates/` (from a copy, or from an older show file) is read again only if the settings still name it, and a message shown for a few seconds is too little to rest a deletion on. The price is that the message returns at every opening, so the Templates view has "Forget these names" for the user who does not want the template back. The names are kept beside the settings in memory, not in the list the tool works with, and written back when `config.json` is saved, which is why they come after the others and lose their old place in the order. `defaultTemplate`, `recentTemplates` and the `base` of a board are kept when they name a template that is not there, so a template that returns is again the default and the base it was. A backup and the draft carry only the templates that exist. The file of a template that is renamed or deleted stays in `templates/` (below), so a missing name that a new template took, and then lost again by deletion, is not kept: its file would bring the deleted template back.

**The limit of the browser is not known in advance (STO-26).** The draft is one value in `localStorage`, which in Chrome and Edge holds about 5 million characters for everything the page keeps there; the tool learns that it is over only when the browser refuses the write, and tries again without the images. So one photo of a stage plan can be enough. What is said is said by a message that passes and by the banner that stays; in show mode the banner is not visible (SHW). A draft continued from the start screen after it was kept without images shows those boards without their image and says nothing more: the draft does not record that it was cut. The same refusal comes when the browser's storage is switched off, from the first change on.

**A damaged show file has two outcomes, and the line between them is whether the archive can be followed (STO-23, STO-24).** When the directory at the end of the file, or the header in front of an entry, is cut or does not agree with the rest, the tool cannot know where the parts are or which is which, so it opens nothing and writes nothing: the file is refused and stays as it is, for a repair program or a copy to deal with. When the archive can be followed and the bytes of one entry are wrong, the rest is sound and is opened; the user sees the banner of STO-18 ("… cannot be read: script.md. …") and decides. The tool does not try to repair an entry and never shows bytes that failed the check as text, ink or a picture.

**The name of an entry is checked against the header in front of its bytes.** The CRC covers the bytes of an entry, not its name: one changed letter in the directory would turn `script.md` into a file the tool does not know, and the show would open with no script. The two copies of the name the format keeps must agree, or the file is refused (STO-23). A program that writes different names in the two places would be refused; none is known.

**The check runs at every opening, over the whole file, and at no other time.** Opening, "Load that version" and the reload after another program replaced the file (STO-11) read every entry, unpack it and compute its CRC-32; the archive is not read again until then, so damage that happens to the file while the show is open is found at the next opening, or not at all if the next save has replaced the file first. What the tool writes is not read back after a save.

**What it costs.** Measured on 2026-10-13 in headless Chromium on the development machine, with a show file of 100 MB (ten board images of 10 MB): reading the archive takes 1.2 to 1.3 s, of which the CRC is 0.65 s; opening the show takes 1.7 s in all. The cost grows in proportion to the size of the file, history included: the same show with one revision is 200 MB and opens in 3.1 s. A show of a few megabytes is not slowed in a way that can be seen. Not measured on the laptop.

**Not verified (STO-23 to STO-25):** a file damaged by a real disk or a real interrupted copy (the checks cut and change the bytes of archives the tool wrote: every length, and every byte of a small archive); archives written by Explorer, Finder or 7-Zip (the check uses two written by Python's `zipfile`, one of them with data descriptors).

**Not covered by STO-18:** the draft kept in the browser and a backup file. An unreadable draft is not offered on the start screen and is replaced by the next show kept in the browser; an unreadable backup is refused with a message and is never written to.

**No request to a host, by construction (STO-22).** The policy is a `meta` element at the top of `src/index.html`, so it holds from `file://` and from any server: `default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src data:; base-uri 'none'; form-action 'none'`. That is what the tool uses and no more: its one inline script and its inline styles; board images as `data:` (in a backup or draft) or `blob:` (read from the show file); the embedded font and the search icon as `data:`; `fetch` of a `data:` URL when "Save as show file…" moves an image out of the page. Downloads, printing, the file pickers, IndexedDB, compression, hashing and the screen wake lock are not governed by it. `'unsafe-inline'` is needed because the tool is one file; the policy is there to stop requests, not scripts, and the tool still never writes text from a file into the page as markup.

**The policy is the only guard for colours.** A department colour or an ink colour written by hand as `url(http://…)` in a backup or a show file would also make the browser ask that host. Colours are not cleaned when read; the policy refuses the request and the browser's console names it. STO-21 cleans `imageData` as well so that the value is not kept and written back into a later backup.

**A later change that needs a new kind of resource must widen the policy**, or it fails in the page with only a console message: a web worker, a frame, `fetch` of a `blob:` URL, a font or image from anywhere but `data:` and `blob:`. The checks load the built file, so they catch it.

**Not verified (STO-26):** the real limit of a browser (the check makes the browser's write refuse a draft over a length it chooses; no storage was filled), and a browser whose storage is switched off.

**Not verified (STO-22):** the policy in Firefox and Safari (the checks run in Chromium only); a browser extension can still make requests of its own, which no page can prevent.

**Storage needs Chrome or Edge (K6, A7).** In another browser the tool still works, with the in-browser fallback and backup files only.

**The release mark starts to work at the first raise.** `release.needs` is the constant `READABLE_FROM` beside `VERSION` in `src/core.js`. It is `r1.10` today, a name older than r1.11, the first release, so no released tool is warned by it. The first later release that raises it makes r1.11 and every release after it warn. Raising it is a decision made by hand with each change of a saved format; nothing checks that it was made.

**A `needs` left by a newer release survives a save by an older one.** `made` then names the older release, so the newer one can see that an older one has been at the show, and the warning returns on every opening until the tool is new enough.

**One mark covers the whole show.** It sits in `config.json`; the ink file, the boards and the templates have none of their own, and `version` in the ink file and in the backup is written and never read. A change to any of those formats that an older release would damage is declared by raising `needs`.

**Unknown fields are carried only in the configuration.** The tool keeps the settings of the show, the fields of a department and the fields of `show` that it does not know (STO-17). A board, a template and the ink of a block are written from the fields the tool knows: a field a later release adds to one of those is lost when an older release saves it, and has to be declared by raising `needs`. `show.scenes` is the one field dropped on purpose (`11-show.md`).

**The actors' file gives no such warning.** `promptbook-cast.html` and the file for the cast carry `made`, and the script for the actors never writes the show back, so nothing can be lost there; an actor could not act on the warning either.

**Files are left behind.** The tool does not delete the file of a renamed or removed board or template. One exception: restoring a revision or changing variant replaces the show's files with those of the revision, so boards and templates the revision does not have are gone from the working files (they stay in the history). The other exception is an image that no drawing names any more (replaced on its board, or its board's file gone): a save drops it from the show file. An image that a board or a template of the open show names is never dropped, also when it is put on a board while a save is under way and its drawing is not written yet (checked in `test/leaks`).

**Board files are named after the board, and the name inside decides** (§2.3). Two boards whose names come out the same have a file each, the second with a number (`boards/sala-a.json`, `boards/sala-a-2.json`). Which of the two has the number depends on which was saved first, so the file name alone does not say whose drawing it is: the `name` inside does. Every drawing in `boards/` is read when a show is opened, those of deleted boards too, to know which name each holds. Templates have a stricter rule: two of them may not have names that give one file name (BRD-24).

**Not verified (STO-4):** a folder really zipped by Explorer or Finder, with its hidden `.git` folder; the check uses an archive built in the test.

**Not built:** zip64 (a show file over 4 GB), encrypted zip entries (both are refused in words, STO-23), the repair of a damaged archive, a refusal to open or to save a show that needs a newer release (C10: the tool warns, STO-16).

**Not verified (STO-15, STO-16):** the release mark against a real later release; no release has raised `needs` yet, so the check uses a show file built in the test that asks for r99.0.

**Not verified:** the real file dialogs. The checks use the browser's private file system through the same interface; the real "Open" and "Save" pickers were never exercised by a check.
