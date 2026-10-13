# Changelog

## r1.12 — not yet released

- Settings is in sections, listed on the left with one shown at a time: the show (title, paper), the timings of show mode, the departments for cues and notes, boards and templates, and the language, which stays with the browser. Nothing was added or removed, and a show opens as before.

## r1.11 — 2026-10-13

The first release. What follows is the tool as it stands; the requirements behind each line are in `docs/specs/`.

Script
- The script is plain text as it is typed today: `NAME: text` for a speech, `(text)` for an action, `# Act` and `## Scene` for headings, `& NAME: text` for a line spoken together with the one above. A pasted Word text is read as it comes; a line that cannot be read is listed in Review and never dropped.
- Any block is edited in place. Every change is one undo step.
- Blocks can be moved: drag the grip in the left gutter and release where the line shows. Cues and ink go with the block.
- The script can start with a frontmatter block between two `---` lines (`title:`, `author:`, any `key: value`). Its values make a front page. `characters:` (or `personaggi:`) lists the characters, with aliases and descriptions, on a page of their own; Review lists speakers that are not in the list.
- Text between two `%%` lines is commented out: kept in the script, left off the page, the cue list and every print.

Cues
- Tap a word and pick a department to pin a cue. Cues live in the script text as `{LX 12 | margin text | description}` and show as a tag in the margin, with the cue word boxed in the colour of the department.
- A blank number on a new cue becomes the last of its department plus one. Nothing is ever renumbered.
- A cue can have an end (`{/SND 5}`), or be ended by another cue (`{SND 6 / SND 5}`). A rail in the margin shows what is running.
- A cue is moved by dragging its tag to a word, or to the space between two blocks.
- The cue list is made from the script: filter by department, print, CSV, one sheet or one CSV per department. It marks a number used twice and, with ↕, a number out of order.
- A department ticked "To do" holds notes for after the rehearsal: pinned like cues, listed in Review, never in the cue list.

Ink and boards
- The pen draws over the script. Ink belongs to its block of text and follows it through every edit; when the words of that block change, the ink is flagged for a look.
- Boards on the facing page: an image or a blank sheet, drawn on with the same pen, with a name and a light grid. Three or more on a page are set in two columns.
- Templates are stage backgrounds kept with the show's settings. A board is drawn on top of a template, which shows greyed beneath; change the template and every board built on it follows.

Pages and print
- The page is laid out as a prompt book: name, text, cue margin, and the facing page for the boards. Print gives the book or the script pages alone.
- Page numbers can be locked once a script is handed out: text added later goes to inserted pages (12A, 12B), changed pages are marked, and "Print changed pages" prints only those.

Show file and history
- A show is one `.zip` file with plain files inside (`script.md`, `config.json`, the ink, the boards). Every change is saved without a command. Needs Chrome or Edge; in another browser the show is kept in the browser and moved with a backup file.
- History (Menu → "History…"): "Save revision" keeps the whole show under a name; "Restore" brings a revision back; a variant is the show as it is given in one place. "Changes" compares two revisions, word by word, and can show only what reaches one character.
- The history is a git repository inside the show file. Unzip the show, run `git reset` once, and git reads it.
- A damaged show file is found when it is opened. A file cut short is refused and not touched. A part that cannot be read is set aside: a banner names it, nothing is saved until you choose, and "Go on without" keeps the damaged part in a folder `damaged/` inside the show file.
- A show says which release saved it. Opened with a release too old for it, it opens all the same with a warning that says which release it asks for.
- The tool never asks the internet for anything, whatever a show file or a backup holds.

For the cast
- A second file, `promptbook-cast.html`: the script for the actors, on a phone or a computer. "My part" marks the lines of the names an actor ticks; "Hide my lines" covers them for practice.
- A department marked "Cast" holds notes for the actors. Menu → "Send to cast…" saves one file to send to everybody, with the text and those notes beside it. Each actor sees the notes for the names they ticked, writes notes of their own, and finds them again in the next file.

Show mode
- "Show" in the top bar makes the book read only and clears the screen for show day: the pen draws nothing, a tap pins nothing. "Leave" takes two presses.
- A line runs down the script; Space starts and stops it, a double tap on a word puts it there. The line is a clock: it does not hear the stage.
- Every block has its own time, at first its words at 130 a minute. In rehearsal, with "Time it" on, each double tap says "the show is here" and the real time is kept for the blocks in between.
- Cues the line will reach within 30 seconds are in STANDBY, within 2 minutes in WARNING, each with the estimated time to it. The panel shows how long the show is and how far in.

Around it
- Review lists everything that looks wrong, as hints: the tool never refuses or corrects what was typed.
- Find, a menu of acts and scenes, night mode, zoom, keyboard shortcuts (press ? for the list).
- English and Italian.