# Reference

What to look up while working: the forms the script is written in, the forms of a cue, the keys, the contents of a show file. Each section names the part of the specification that holds the full rule.

## Writing the script

Full rules: `docs/specs/01-script-text.md`.

```
---
title: The Sea
author: Name Surname
characters:
  - ANNA/A - the daughter
  - MARCO/M - the fisherman
---
# ACT ONE
## Scene 1

(Dark. The sea is heard.)

ANNA: Who is there? (turns) Answer me!
MARCO: It is me.
& ANNA: I do not believe you!

%% A speech set aside. It is not shown and not printed. %%
```

| Write | It is |
|---|---|
| `# text` | An act. Starts a new page. |
| `## text` | A scene |
| `NAME: text` | A speech. The name has no lower-case letters, apart from `e`, `ed`, `and`, `&` between two names. |
| `ANNA AND MARCO: text` | One speech spoken by both |
| `& NAME: text` | Spoken at the same time as the speech above. Several may follow. |
| `(text)` on its own line | An action |
| `(text)` inside a speech | A direction, in italics |
| `NAME (direction): text` | A speech with a direction after the name |
| Any other line | More of the block above |
| `%% text %%`, or lines between two `%%` lines | A comment: kept in the text, shown as a small mark, never printed, never sent to the cast |

A line starting with ACT, SCENE, PROLOGUE, EPILOGUE, PART, INTERVAL, END (or ATTO, SCENA, PROLOGO, EPILOGO, QUADRO, PARTE, INTERVALLO, FINE) is a heading even without `#`.

A line the tool cannot place is kept as written and listed in Review under "Lines not recognised".

### The top of the script

Between two `---` lines, as the very first thing. Every field is optional; any `key: value` is shown on the front page.

| Field | Does |
|---|---|
| `title` (or `titolo`) | The title of the show; set large on the front page. Wins over the title in Settings. |
| `characters` (or `personaggi`) | The list of characters: a page of its own, and the check of speaker names in Review |
| anything else | A line on the front page, in the order written |

A character is `NAME`, `NAME/ALIAS` or `NAME/ALIAS - description`. A speech typed under an alias (`A: …`) is shown under the full name. `ALL`, `EVERYONE`, `OTHERS`, `ALL BUT …` (and `TUTTI`, `GLI ALTRI`, `TUTTI TRANNE …`) are never checked against the list.

## Cues

Full rules: `docs/specs/02-cues.md`. You pin these by tapping; this is what gets written, for when you meet it in the text.

| In the text | It is |
|---|---|
| `word {LX 12}` | Cue 12 of LX, called on "word" |
| `{LX 12 \| blackout}` | With a margin text, shown on the tag |
| `{LX 12 \| blackout \| 3 seconds, on her turn}` | With a description too, shown only in the cue list |
| `{SND \| long wave}` | With no number |
| A cue alone on a line | Called between two blocks |
| `{/SND 5}` | The end of SND 5 |
| `{/SND}` | The end of the last SND still open |
| `{SND 6 / SND 5 \| new track}` | Cue SND 6, which also ends SND 5 |
| `{TODO \| check the entrance}` | A to-do note: a cue of a department ticked "To do" |
| `{NOTE \| slower}` | A note for the cast, for whoever speaks the line: a cue of a department ticked "Cast" |
| `{NOTE ANNA, MARCO \| slower}` | For the characters named |
| `{NOTE ALL \| notes at five}` | For everyone |
| `{BOARD Act 1 entrance}` on its own line | Where a board is shown |

Departments, their codes and colours are in **Settings**. A new show has LX, SND, VID and TODO.

## Buttons and keys

In the tool, **Guide** (H) labels every button and **?** lists every key. Full rules: `docs/specs/09-workbench.md`, `docs/specs/05-input.md`.

Single keys act when no field has the cursor and no cue box is open.

| Key | Does |
|---|---|
| H | Guide to the buttons |
| ? | The list of keys |
| Ctrl+F, `/` | Find. Enter next, Shift+Enter previous, Esc leaves. |
| Ctrl+Z, Ctrl+Y | Undo, redo |
| Ctrl+S | Save now |
| Ctrl+P | Print |
| 1 2 3 4 | Pen colour |
| E, F | Eraser; let the finger draw |
| B, C, I | Show or hide boards, cues, ink |
| N | Night mode |
| L, R | Cue list, Review |
| + − 0 | Zoom in, out, fit |
| Page Down, Page Up | Next, previous page |
| Home, End | Start, end of the script |
| Delete | Delete the cue or board whose box is open |
| Esc | Close the box or the menu |
| S | Show mode |
| Ctrl+Enter, Esc | In a text editor: save, cancel |

In show mode:

| Key | Does |
|---|---|
| Space | Start or stop the line |
| ↓ ↑ | Line to the next or previous block |
| Enter | Back to the line |
| `[` `]` | Pace of the night: slower, faster |
| C, I, N, L, + − 0, Page keys, Home, End, H, ? | As above |
| S, twice | Leave |

## The Menu

| Entry | Does | Guide |
|---|---|---|
| Edit whole script… | The full text, with its cue marks | [Take in a rewrite](how-to/04-take-in-a-rewrite.md) |
| Settings… | Title, paper, language, departments, template strength, board grid, the times of show mode | |
| Templates… | The backgrounds boards are drawn on | |
| History… | Revisions, variants, locked pages, changes | [Mark a moment](how-to/05-mark-a-moment.md) |
| Send to cast… | The file for the actors | [Send to the cast](how-to/09-send-to-the-cast.md) |
| Export backup, Import backup… | The show as one `.promptbook.json`, without history | [Move and back up](how-to/12-move-and-back-up.md) |
| Guide to the buttons, Keyboard shortcuts | Help | [Find your way](how-to/02-find-your-way.md) |
| Save as show file…, Open show file…, Close show | The show file | [Move and back up](how-to/12-move-and-back-up.md) |

## Review

What the Review panel lists. The first group counts toward the number on the button.

| Entry | Means |
|---|---|
| To do | Your to-do notes. A tick removes one. |
| Notes for the cast | The notes that the next cast file will carry |
| Lines not recognised | Text that is not a speech, an action or a heading |
| "&" with no speech above | A simultaneous speech with nothing to be simultaneous with |
| Not in the character list | Speakers missing from `characters` |
| Ink to check | Ink on a block whose words changed |
| Ink whose text was removed | Ink whose block is gone |
| Unknown departments | Cues whose code is not in Settings |
| Ends with no cue to close | An end, or a link, that matches nothing |
| Commented out | Blocks between `%%` (not counted) |
| Characters | Every speaker and how often they speak (not counted) |
| Listed but never speaks | In `characters`, with no speech (not counted) |

## Inside a show file

Full rules: `docs/specs/07-storage.md`. A show is a `.zip`; any zip tool opens it.

| Inside | Holds |
|---|---|
| `script.md` | The script, with its cues. Plain text. |
| `script.ink.json` | The ink on the script pages |
| `config.json` | Title, paper, departments, templates in use, locked page numbers, times of show mode |
| `boards/` | The image and the ink of each board |
| `templates/` | The same for each template |
| `.git/` | The history: revisions and variants. A git repository. |

Other files the tool writes:

| File | Is |
|---|---|
| `…-cast.html` | The script for the actors, with a show inside |
| `….cast.json` | The text and notes alone, for a reader already on the device |
| `….promptbook.json` | A backup of a show: everything but the history |
| `.csv`, or a `.zip` of them | Cue lists |

## The words used here

| Word | Means |
|---|---|
| Block | One speech, action or heading. Ink, times and moves go by block. |
| Cue | A mark after a word, under a department |
| End | The mark that closes a running cue |
| Margin text, description | The short text on the tag; the long one in the cue list |
| Department | Who a cue is for: lights, sound. Also the kinds of note: to do, cast. |
| Board | A drawing or plan on the facing page |
| Template | A background that boards are drawn on |
| Revision | The whole show at a named moment |
| Variant | A line of the show with revisions of its own |
| Lock | Page numbers fixed to the paper of one revision |
| Cast file | The script and notes for the actors |
| Show mode | The read-only view for calling a performance |
| The line | The place of the show in show mode |
