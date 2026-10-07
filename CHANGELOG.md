# Changelog

## r1.3 — 2026-10-07

Cue ends
- A cue can end another cue and be a cue of its own: `{SND 6 / SND 5 | sfuma 3s}`. SND 6 has its own number and row in the cue list and the CSV, and the running rail from SND 5 stops at its tag. One cue can end several, in any department: `{SND 9 / SND 6 / VID 2}`. A cue that links can itself be ended later.
- `{/SND 5}` still works for an end with no cue of its own, for fades the operator does by hand.
- A part after ` / ` counts as a link only if it starts with an upper-case department code, so a label such as `1/2` or `5 / 6` stays a label. A link whose target is not found is listed in Review.
- Margin tag of a linking cue: drawn like a plain end (outlined, stop square before its number) with the running rail ending on it; hovering shows what it ends. Editing carries through links: renumbering a cue rewrites the links to it; deleting a cue keeps the cue that linked to it, without the link; deleting a linking cue leaves its targets open. Each is one undo.
- In the editor of an end, “Make it a cue” turns `{/SND 5}` into `{SND / SND 5}` ready to be numbered; on a linking cue, “Make it a plain end” does the reverse.
- The “runs” tick box per department is gone, with “Still running at the end” in Review and the ordering in the End row. A cue with no end is simply a cue. A `runs` value in an old `config.json` is ignored.

Notes and department lists
- A cue can carry a longer note after a second bar: `{SND 5 | mare | Traccia 03, -12 dB}`. Typed in a new field of the cue editor. It shows in the cue list, in print and in the CSV, not in the margin (a dot on the tag shows that notes exist).
- The CSV has three new columns at the end: “Ended by”, “Ends”, “Notes”. Existing columns keep their positions.
- Cue list: “By dept (.zip)” saves one CSV per department in one file; “Print by dept” prints one sheet per department, each on a new page. The department chips still filter one department for the CSV and Print buttons.
- A show written by r1.2 opens unchanged. Do not edit a show with r1.2 once it uses links or notes: r1.2 shows `6 / SND 5` as the label and the note as part of the short text.

## r1.2 — 2026-10-07

Show file
- A show is now one `.zip` file instead of a folder of loose files. Menu → “Save as show file…” creates it; “Open show file…” opens it. Autosave rewrites the zip.
- Inside: `script.md`, `script.ink.json`, `config.json`, `boards/`, `templates/`, exactly as the folder had them. Any zip tool can open it.
- A folder zipped by hand (Explorer, Finder) opens as is; the extra top-level folder is ignored.
- Older show folders still open (“Open older show folder…”). “Save as show file…” converts one, images included; only the show's own files are copied, so the zip never contains the empty file the save dialog creates or other stray files. “Save into a folder…” is gone.
- If another program replaces the file (sync, copy over): reloaded when nothing is unsaved, otherwise the Keep mine / Load that version banner.
- Editing `script.md` in another editor while the tool is open no longer works with a show file; unzip, edit, zip, or use “Edit whole script…”.
- Unused images are dropped from the zip on save.
- Needs Chrome or Edge. The new checks (`test/zipshow.test.js`) are written but have not been run yet.
- A show file written by r1.2 cannot be opened by r1.1 or earlier; their folders open in r1.2.

## r1.1 — 2026-10-07 (built, not yet tagged)

Front page
- The script can start with a frontmatter block between two `---` lines: `title:`, `author:`, `company:`, `year:` or any other `key: value`.
- The values are shown on a front page before the script, in the order written, the title larger. Keys are not shown.
- The front page and the character page have no number; the script still starts on page 1.
- `title` in the script replaces the title from Settings.

Characters
- `characters:` (or `personaggi:`) in the frontmatter lists the characters, one `- NAME/ALIAS - description` per line; alias and description are optional. `[ANNA, MARCO]` on one line also works.
- The list is printed on a page of its own after the front page: name / alias — description.
- A speech typed with an alias (`A: …`) is shown under the full name.
- Review lists speakers that are not in the list, and listed characters that never speak.
- Group names are not checked: ALL, OTHERS, ALL OTHERS, ALL BUT x, TUTTI, GLI ALTRI, TUTTI TRANNE x and similar.

Files
- No new files. `script.md` may now begin with the frontmatter block.
- Do not edit a show with r1.0 or r0.1 once it has frontmatter: they keep the text but show it as unrecognised lines on page 1.

## r1.0 — 2026-10-06

Cue ends
- A cue can have an end: `{/SND 5 | sfuma in 3s}`. Tap a word and pick the cue from the new "End:" row.
- An end closes the nearest earlier open cue with the same department and number; without a number, the nearest open cue of that department.
- End tags are outlined in the margin. A rail runs down the outer margin from a cue to its end, across pages.
- Cue list shows where each cue ends; the CSV has three new columns. Ends that close nothing are listed in Review.
- Renumbering or moving a cue to another department carries its end. Deleting a cue deletes its end. Each is one undo.
- Departments have a "runs" tick box in Settings (on for sound and video by default).

Board templates
- Templates are backgrounds kept in the show's configuration: menu → Templates…. They are never in `script.md` and never printed.
- A board can be based on a template and a template on another template. What a board is based on shows greyed and cannot be drawn on or erased from the board.
- "+ Board" asks what to draw on when there are templates and no default; with a default template it stays one tap.
- "Base…" and "To templates" on boards. "Use as default" is gone; a default background set earlier still applies until a default template is chosen.

Files
- New: `templates/` folder; `base` in board files; `runs`, `templates`, `defaultTemplate`, `recentTemplates`, `templateFade` in `config.json`.
- A show written by r0.1 opens unchanged. Do not edit a show with r0.1 once it uses ends or templates: r0.1 shows `{/…}` as unknown cues and ignores templates.

Other
- Version shown on the start screen.
- A second pin on the same line straight after the first is no longer taken for a double tap.

## r0.1 — 2026-10-06

- Cue words are boxed in the department colour instead of underlined. Several departments on one word give nested boxes. The line to the margin leaves from the box corner.

## r0 — 2026-10-06 (not in this repository; r0.1 is the first commit)

- Script view in the prompt-book layout: name column, text, cue margin, facing page. Simultaneous speech in columns.
- Tolerant parser for `NAME: text`, `(actions)`, `#` headings, `&` simultaneous lines.
- Tap a word to pin a cue; cues live in the script text as `{DEPT number | description}`.
- Pen ink anchored to text blocks; flagged when its text changes.
- Boards on the facing page, with images and ink.
- Cue list with department filter, CSV, print. Print of book or script.
- Saves into a show folder; in-browser fallback with backup export and import.
