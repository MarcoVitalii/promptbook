# Changelog

## r1.5 — 2026-10-08

Show file
- Fixed: after a show file was opened, only the first change was saved. Every later save failed, the status showed a save error and the changes stayed in the open tab only. It happened whenever the show held a very small file, such as the ink file of a show with nothing drawn yet.
- Fixed: “Keep mine”, offered when another program has changed the show file, failed in the same way and left the file as the other program wrote it.
- The parts of a show file are now read into memory when it is opened, board images included.

If you worked in r1.2 to r1.4 on a show opened from its file, open it again and check that your last changes are there. What was not saved has to be entered again.

Compatibility
- A show written by r1.4 opens unchanged, and r1.4 opens a show written by r1.5.

## r1.4 — 2026-10-07

Comments
- Text between two lines holding `%%` is set aside: it stays in `script.md` and is left off the page, the cue list and every print. One line can be closed on itself: `%% text %%`. This is Obsidian's comment form, so the block is hidden there too.
- The text editor of a block has “Comment out”; on a comment it has “Restore”. A commented block leaves a small `%%` marker in the left gutter: tap it to read the content, restore it or edit it. Each step is one undo.
- Cues inside a comment are not cues. Ink on a commented block is set aside (it shows under “Ink whose text was removed”) and comes back when the block is restored unchanged.
- A `%%` that is never closed hides nothing: the line is listed under “Lines not recognised”.
- Review lists “Commented out”, not counted in the badge.
- Whole lines only. To cut part of a speech, split the speech first.

To do notes
- A department can be ticked “To do” in Settings. Its notes are pinned like cues (`{TODO | short text | longer text}`) and show in the margin, but they are not cues: they are left out of the cue list, its count, the CSV and the prints, they get no number, and they are never offered as something to end.
- Review lists them first under “To do”, counted in the badge. Tap one to jump to it; the tick removes the note from the script (one undo).
- New shows come with a red TODO department. A show that already has its own department list is not changed: add a department in Settings and tick “To do”.

Cue list
- The short margin text and the longer description are two columns, “Margin” and “Description”. The description column appears only when a listed cue has one; the panel widens for it. The cue editor and the CSV headers use the same two names; CSV columns keep their positions.
- “Cue line” is now the cue word with two words on each side. The word is boxed in the department colour, as on the page; in the CSV it is in `[brackets]`. A cue on its own line keeps the `▸` between the lines around it.
- The cue list is printed from its own panel only (“Print”, “Print by dept”). The Print button in the top bar offers the book and the script pages.

Numbers
- A newly pinned cue whose number is left blank gets the last number of its department before that point, plus one: 5 gives 6, A12 gives A13, 5.5 gives 5.6; the first cue of a department is 1. The field shows the number it will get. Pinning and numbering are one undo.
- Nothing is renumbered. A cue placed between 5 and 6 becomes a second 6 and is marked as a duplicate, as before. To leave a cue without a number, clear the field after the cue exists.
- Enter closes the cue editor even when no field has been typed in.

Compatibility
- A show written by r1.3 opens unchanged. Do not edit or print a show with r1.3 once it uses `%%`: r1.3 shows the commented text as unrecognised lines and prints it. TODO notes read by r1.3 are ordinary cues of a department.

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
