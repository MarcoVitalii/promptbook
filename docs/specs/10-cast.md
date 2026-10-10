# Cast — CST

**Covers:** notes for the actors in the prompt book, the cast file that carries the text and those notes out of it, and the script for the actors (`promptbook-cast.html`): reading, covering one's own lines, own notes, received notes.
**Code:** `src/core.js` (cast: `castPack`, `castTo`, `isCast`), `src/view.js` (`openCueEdit`, Review), `src/io.js` (cast: `openCast`, `castHTML`), `src/cast.js`, `src/cast.css`, `src/cast.html`, `build.py`.
**Checks:** `test/unit/cast`, `test/cast`.
**Columns and tags:** explained in `SPEC.md`, "How to read this specification".

---

## 1. Intent

Until r1.9 the cast used nothing of the tool: they got paper (`SPEC.md` §1.3). The ideas collected on 2026-10-08 and 09 (`PLAN.md` §6) named notes with an addressee, a page per person readable on a phone, and memory practice.

**Request, 2026-10-10:** "create a version of the app for reharsals by actors. It should display the text, allow them to add notes and black out their own character text (leave it like checkbox over detected characters to simplify management of choruses). Think about an overlay method that allows dispatching notes from SM or director to actors from the main app that are then readable from the actor side"

**Correction, 2026-10-10, after the first build:** "notes should be tied to the whole block, and tied to who's speaking by default (overridable)". The first build anchored a note to a word and read a blank label as everyone; CST-2, CST-3, CST-6 and CST-13 were changed.

**Second request, 2026-10-10:** "notes should be on the side of the text to avoid changing page length. think about how to manage integration between local notes and new files handed ove by SM". The first build put notes under their line. CST-12 to CST-16 were changed and CST-18 to CST-21 added.

Read as `[ASSUMED]`, all but the correction:

- "A version of the app" is a second file, built from the same sources, small and readable on a phone. It never edits the script.
- "Checkbox over detected characters": one box per speaker name exactly as the script writes it. `ANNA e MARCO`, `TUTTI` or `CORO` is a name like any other and the actor ticks the ones they are part of; the tool does not work out who is in a group.
- "Black out": the lines under the ticked names are covered for practice and shown again on request.
- "Overlay": the text, the notes that were sent and the actor's own notes are three layers. The text and the sent notes are replaced together by each new file; the actor's layer stays on their device and is laid over whatever arrives.
- "From SM or director": notes are written in the prompt book by whoever holds it (one editor, D15). Who is speaking is the department the note is pinned under.
- No server and no network (C1, C2): notes travel as a file the stage manager sends by whatever means the company already uses.

## 2. Requirements

### 2.1 In the prompt book

| ID | Requirement | Basis | Since | Checked by |
|---|---|---|---|---|
| CST-1 | A department can be marked "Cast" in Settings. Its notes are for the actors. A cast department is also a review department: its notes are listed under Review, under "Notes for the cast", and never in the cue list (CUE-21). No department is cast in a new show or in an older one. | request 2026-10-10 `[ASSUMED]` | r1.10 | unit/cast, cast |
| CST-2 | A note for the cast is a cue token of a cast department: `{NOTE ANNA, MARCO | text | more text}`. With no label it is for whoever speaks the block, under the speaker name as written (`ANNA E MARCO` for a line of both); on a block nobody speaks (action, heading) it is for everyone. A label overrides that: names divided by commas or semicolons, an alias becoming the character's name; `ALL`, `EVERYONE`, `TUTTI` or `TUTTE` means everyone. The name of the department is who is writing. | request and correction 2026-10-10 `[LOCKED]` | r1.10 | unit/cast |
| CST-3 | In the box of such a note the label field reads "For: blank = ANNA" with the speaker of the block ("Everyone" on a block nobody speaks). Buttons override it: "Everyone", and the characters, which add or remove a name: those of the character list, or without one the single speaker names found. After a name is picked the cursor is in the note text. | same | r1.10 | cast |
| CST-4 | Menu → "Send to cast…" says how many notes wait and for whom, and saves either the cast file (`<title>-cast.html`: the script for the actors with this show inside) or the text and notes alone (`<title>.cast.json`). With no cast department it offers to add one, `NOTE`. | same | r1.10 | cast |
| CST-5 | What is sent: the script with every token removed, comments and cue lines left out, the frontmatter kept; and the cast notes that say something. Cues, to-do notes, ink, boards and history never leave the prompt book. Making the file changes nothing in the show. | same | r1.10 | unit/cast, cast |
| CST-6 | A note belongs to a whole block of the text sent, whichever word it was pinned on; a note on its own line belongs to the block above it, or to the one below when there is none above. A note keeps its identity from one file to the next while its addressee, its text and its block stay the same. | correction 2026-10-10 `[LOCKED]` | r1.10 | unit/cast |

### 2.2 The script for the actors

| ID | Requirement | Basis | Since | Checked by |
|---|---|---|---|---|
| CST-7 | `promptbook-cast.html` is one file with no install, server, library or network use. It runs in any current browser, reflows the text to the width of a phone, and has the text size, night mode, an act and scene list, English and Italian. | C1, C2, request | r1.10 | cast |
| CST-8 | A cast file opened in a browser shows its show at once. The file without a show inside asks for a cast file, takes either kind, refuses anything else with a message, and reopens the last show. | as built | r1.10 | cast |
| CST-9 | The text is shown as written: title page with the characters, acts and scenes, actions in italics, each speech under its speaker name, "together" on simultaneous speeches. Nothing can be edited. | request | r1.10 | cast |
| CST-10 | "My part" lists every speaker name as the script writes it, with the number of its speeches and one box each. The lines under the ticked names are marked as mine. | request ("checkbox over detected characters") | r1.10 | cast |
| CST-11 | "Hide my lines" covers the text of my lines and leaves the speaker name. A tap on a covered line shows it; a tap on a shown one covers it again. With no name ticked it opens "My part" instead. | request ("black out") | r1.10 | cast |
| CST-12 | A tap on a line selects it and offers a note button in its margin. The button opens the notes of that line: what was received, the actor's own notes, each edited or deleted there, and a field for a new one. | request ("add notes") | r1.10 | cast |
| CST-13 | A received note belongs to its block and says who wrote it and who it is for; no word is marked. Until a name is ticked every note is shown; after that, those for a ticked name and those for everyone. "Notes" lists received and own notes in script order, jumps to the line, and switches between "For me" and "All". | request ("readable from the actor side") | r1.10 | cast |
| CST-14 | A received note can be ticked as read, in the notes of its line: it is dimmed and leaves the count on the Notes button. | as built | r1.10 | cast |
| CST-15 | The part, the hiding, the read marks and the own notes are kept on the device, per show, and survive closing the file. The show is known by an id the prompt book gives it at the first file sent and repeats in every later one, whatever the title becomes; a file without an id is known by its title. | request, second request 2026-10-10 | r1.10 | cast |
| CST-16 | When a newer file of the same show is opened, an own note stays on the same line; if the line changed, it goes to the most similar line of the same speaker and is flagged until the actor saves it there; if there is none, it leaves the page and is kept in "Notes" with the words it was written on, and can be put on any line from that line's notes. A note already read stays read. | second request 2026-10-10 `[ASSUMED]` | r1.10 | cast |
| CST-17 | "Export my notes" writes part, read marks and own notes to one file; opening that file in the reader on another device adds them. | as built | r1.10 | — |
| CST-18 | Notes, received and own, are shown beside the text and never inside it: every block is exactly where it would be with no notes. On a wide screen (860 px and more) they are written out in a margin to the right, up to four lines each, the notes of a block starting level with it or under those of the block before. On a narrower screen a block with notes has one round button in the margin with their number, filled while one of them is unread; it opens the notes of the line. | second request 2026-10-10 ("on the side of the text to avoid changing page length") `[LOCKED]` | r1.10 | cast |
| CST-19 | A newer file of a show already on the device opens with "What is new": the notes to read, how many lines differ from the file before and which of the actor's own, the own notes that sit on a changed line, the own notes whose line was cut. Each entry jumps to its line. The lines that differ stay marked with a dotted edge until the next file. The same file opened again announces nothing. "What is new" can be reopened from the menu. | second request 2026-10-10 ("integration between local notes and new files") `[ASSUMED]` | r1.10 | cast |
| CST-20 | A file older than the one the device took over last is opened from the menu only after a yes, and opened directly it says so; either way it is shown as it is and the actor's layer is not re-anchored to it, nor are the change marks moved. | same `[ASSUMED]` | r1.10 | cast |
| CST-21 | When the browser cannot keep the layer (storage blocked or missing), the menu and every saved note say so and point to "Export my notes". | same `[ASSUMED]` | r1.10 | — |

## 3. Consequences

**Design.** The actors' file is `core.js` (strings, helpers, parser) joined with `cast.js`, with system fonts: about 100 KB. The prompt book carries that file as a string (`CAST_APP`, written by `build.py`) so that "Send to cast" can write it with the show placed in its `<script type="application/json" id="pack">`. `promptbook.html` grew from 353 KB to 461 KB.

**The pack** (`castPack`), also the content of `.cast.json`:

```json
{ "format": "promptbook-cast", "version": 1, "made": "r1.10", "show": "mg3k2a9x1f", "title": "Il molo", "when": "2026-10-10T08:00:00.000Z", "lang": "it",
  "script": "ANNA: Chi è là?\n",
  "notes": [ { "id": "1x2y3z", "dept": "NOTE", "from": "Regia", "colour": "#0f8b8d", "to": ["ANNA"], "text": "più piano", "block": 0 } ] }
```

`block` counts the blocks of `script` as the parser reads them. `to` empty is everyone; the speaker default is already written into `to` when the file is made.

**On the device:** `localStorage`, keys `promptbook-cast:view` (size, night, language), `promptbook-cast:pack` (the last show opened from a separate file) and `promptbook-cast:show:<id>` (`chars`, `hide`, `read`, `own`, and for the hand-over `when`, `seen`, `changed`). `<id>` is `show` of the pack (`castId` in `config.json`, made when the first file is saved), or a hash of the title when the pack has none. An own note holds the speaker and the words of its line, not a position.

**Hand-over of a new file** (`takeOver`, `anchorOwn`). The actor's layer never travels with the stage manager's file, and the stage manager's file never holds anything of the actor: the two meet on the device each time a file is opened.

1. The file names its show (`show`) and its moment (`when`). The layer of that show is loaded.
2. `when` older than the layer's: the file is shown, nothing kept is changed (CST-20). Same `when`: nothing to do.
3. Newer: each own note looks for its line by speaker and words; an exact match wins, nearest to where it was; else the most similar line of that speaker (half the words in common) takes it with the flag `moved`; else it is set aside (`idx` -1) and keeps the words.
4. Every line of the new text is hashed (speaker and words). Those not among the hashes of the file before are `changed`; the new hashes become `seen`, the file's `when` the layer's.
5. Received notes need no merge: they are replaced with the text. A read mark is kept by note id, so a note unchanged in the new file stays read and a reworded one is unread again.

**Margin** (`sideEl`, `layoutSide`). The margin of a block is an absolutely placed box inside it, so it has no height in the flow; one pass after each render moves a box down when the one before would be covered. The room for it is reserved in the padding of every block: 36 px on a phone, 260 px on a wide screen.

**Limits and costs.**

- Notes go one way. An actor cannot answer, and the stage manager does not see what was read. Writing back needs more than one device at a time (D15, `PLAN.md` §6).
- One file goes to the whole cast: a note for ANNA is inside the file MARCO receives and is shown to him under "All". A file per person is not built.
- A note already sent is not withdrawn; the next file simply no longer has it.
- The layer lives in the browser that opened the file. If a new file is opened in another browser or on another device, or the phone gives each attachment a storage of its own, the file opens with no part and no notes: "Export my notes" from the old place and opening that export in the new one brings them over, by hand.
- A show whose first files were sent before it had an id is known by its title; none were, as r1.10 is the first release with cast files.
- Changed lines are found by comparing whole lines: a comma is a change, and a line moved to another place unchanged is not.
- On a wide screen a long run of notes can end lower than its block; nothing connects a note to its block but its starting height. On a phone the text of a note is one tap away, not on the page.
- In the prompt book a note is still pinned on a word and its tag points at that word; the word is ignored when the file is made. A note for the whole of a long speech and one pinned at its last word look the same to the actor.
- The default addressee is not written in the script: a blank note follows the line if its speaker is renamed, and changes addressee if the note is dragged to another speaker's line (CUE-25).
- A note for `ANNA` reaches whoever ticked `ANNA`. A note for a group reaches whoever ticked that group name, written the same way.
- `ANNA / MARCO` in the label is read by the parser as cue links (CUE-14) and still reaches both; commas are the documented form.
- Whoever ticks only a group name gets that group's lines covered, not the lines of its members.
- Typed notes only on the actor's side: no ink.

**Compatibility.** A show with a cast department opens in r1.9: the notes are ordinary to-do notes there, and when r1.9 saves the settings the "Cast" mark is lost and must be set again. Shows from r1.9 open unchanged.

**Not verified.** Everything was checked in simulated Chromium at 390 px and 1200 px wide. Never tried: a real phone; opening an `.html` attachment from a chat or mail app on Android or iOS, where the file may be shown as text or without storage, so that part and notes would not survive closing it; Safari and Firefox. Until that trial, "Export my notes" is the way to keep them safe. CST-17 and CST-21 have no automated check.
