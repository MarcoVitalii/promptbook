# Show mode — SHW

**Covers:** show mode: the book read only, the running line, the time each block takes and how it is learned in rehearsal, the stepped page, the focus layout, warnings and standbys, the length of the show.
**Code:** `src/core.js` (show: `showTimeline`, `showT`, `showP`, `showNow`, `showHere`, `showLearn`, `showCalls`), `src/view.js` (show: `showTick`, `showFollow`, `renderShowSide`, `renderShowProg`, `showOn`, `showOff`), `src/io.js` (keys `SHOWKEYS`, Settings), `src/style.css` (show mode).
**Checks:** `test/unit/show`, `test/show`.
**Columns and tags:** explained in `SPEC.md`, "How to read this specification".

---

## 1. Intent

Calling the show from the tool was asked for at the start and postponed (D11); standbys and warnings were out of scope (D5).

**Request, 2026-10-11:** "the current version is quite painful when it comes to show day, as scrolling can try ot create new cues, or move around text. I'd need a read only mode with some support for warnings and standbys at a reasonable timing for cues. Think about viable alternatives to have an autoscroll feature that helps not loosing track of where we're at"

Built from it the same day, not released: show mode with a line running at one pace, a pace per scene learned in rehearsal, and a bar of calls under the toolbar (SHW-1 to SHW-18).

**Second request, 2026-10-11:** "Dive deeper on a system to compute heuristic times learned through reharsals. e.g. each text block has an inferred duration that starts off from a default wpm, and i can double click during reharsal to set real time for chunks of text. this way i can adjust each part of hte text. scroll shouldn't be smooth as it makes very hard to glance and read. should move by page thirds once the line is down enough. The live mode should try to remove all visuals that are unnecessary, think of it like a focus mode. leave just the necessary settings for pace, next cues and warnings on the side with estimated countdown. Generate different designs and provide the alternative versions to try. at least 3, vary wildly between them to actually feel what's good and what's not, will prune off later the ones that are less appealing. The system should also allow to visualize roughly the duration of the full show and how far we're in"

Read as `[ASSUMED]`:

- "Each text block has an inferred duration": the unit of time is the block (a speech, an action, speeches spoken together), not the scene. The pace per scene of the first build is replaced by it (SHW-16 to SHW-18 withdrawn).
- "Double click to set real time for chunks": while the line runs, two marks one after the other bound a chunk, and the time between them is its real time. A mark is the double tap that already corrects the line (SHW-9).
- "Move by page thirds once the line is down enough": the page stands still while the line goes down it, and jumps a third of the window when the line reaches the lower third.
- "Focus mode": in show mode the toolbar, the corner dock and the facing page are gone, and the script is as large as the window allows.
- "Different designs to try": three layouts of the same show mode, switched inside it, on the real show. They were an experiment; one was kept (2.6).
- "Duration of the full show and how far we're in": the sum of the block times, the time of the place of the line, and a map of the show by scene.

**Choice, 2026-10-11, after trying the three layouts:** "keep the book version with the highlight style of spotlight (full line highlighted WIth tiny marker on the left to gauge where we roughly are within the line". Spotlight and Desk were removed (SHW-27, SHW-28 withdrawn) and SHW-26 changed. Read as `[ASSUMED]`: the dimming of what was already spoken, the countdown on the tags and the slide of the page belonged to Spotlight and are not kept.

**Request, 2026-10-11:** "make the next items clickable to jump there for preview without affecting timing" (SHW-29).

**Request, 2026-10-11:** "add a shortcut also to the show mode, making the ? display shortcuts only for the relevant mode" (SHW-30).

## 2. Requirements

### 2.1 Entering, leaving, read only

| ID | Requirement | Basis | Since | Checked by |
|---|---|---|---|---|
| SHW-1 | "Show" in the top bar enters show mode. "Leave" takes two presses within 3 s, so a stray touch does not end it. Opening another show leaves it. | request `[LOCKED]`; two presses `[ASSUMED]` | r1.11 | show |
| SHW-2 | Show mode is read only: the pen draws nothing, a tap pins nothing, no cue or block is moved, nothing opens for editing, undo, redo and paste do nothing. The script text cannot change by any path. | request `[LOCKED]` | r1.11 | show, unit/show |
| SHW-3 | Focus: the top bar, the banner, the corner dock, the grips, the page buttons and the facing page are not shown, and the script page is fitted to the width left for it. Leaving puts the facing page and the zoom back as they were. Still there by key: cues (C), ink (I), night (N), the cue list (L), zoom (+ − 0), Page Up and Down, Home, End. Find and Review are not. **Changed in the second build:** the first one kept the top bar and the facing page. | second request `[LOCKED]`; what stays `[ASSUMED]` | r1.11 | show |
| SHW-4 | The screen is kept awake where the browser allows it. | `[ASSUMED]` | r1.11 | — |

### 2.2 The line and the time of a block

| ID | Requirement | Basis | Since | Checked by |
|---|---|---|---|---|
| SHW-5 | A line marks the place of the show. Space starts and stops it. Entering show mode puts it, stopped, on the block being read. It stops by itself at the end of the script. | request, alternative B `[ASSUMED]` | r1.11 | show, unit/show |
| SHW-6 | A place is a count of words from the top. A speech or an unnamed paragraph counts its words plus 2; an action its words plus 2 plus 6, for the business; speeches spoken together count as the longest of them; headings, comments, boards and cues on a line of their own count nothing. | `[ASSUMED]` | r1.11 | unit/show |
| SHW-19 | Every block has a time. Until it is timed, it is its count of words at the pace of the show (Settings, 130 words a minute to begin with). Once timed, it is the time that was measured, whatever the pace of the show becomes. The line crosses a block in its time. | second request `[LOCKED]`; the default `[ASSUMED]` | r1.11 | unit/show |
| SHW-20 | Timing is done in rehearsal, with "Time it" on (off every time show mode is entered, so a show night changes nothing). While the line runs, each mark (SHW-9) closes a chunk that began at the mark before, or where the line was started: the running time between the two is shared among the blocks of the chunk in proportion to their times so far, a block covered in part taking its share for that part only. Each block's new time is kept. | second request `[LOCKED]`; the sharing `[ASSUMED]` | r1.11 | unit/show, show |
| SHW-21 | What is not a chunk: a mark while the line is stopped, a mark behind the one before, less than 1 s of running, and a chunk that would be more than 5 times faster or 60 times slower than its time so far. Those only move the line and start a new chunk there. Time while the line is stopped is not counted. | `[ASSUMED]` | r1.11 | unit/show |
| SHW-22 | After each chunk the panel says what was timed (its time, and its time before). "Undo" takes the last chunk back. With "Time it" on the panel also shows the time of the block the line is in and whether it was timed, −5 s and +5 s to set it by hand, the share of the show that is timed, and, once 200 spoken words are timed, the pace measured over them with one press to make it the pace of the show for everything not timed. | "adjust each part" `[ASSUMED]` | r1.11 | unit/show, show |
| SHW-23 | A timed block is known by its words (cue tokens ignored), and by its turn among blocks with the same words. Change its words and its time is forgotten; it goes back to the pace of the show. Settings can forget every time at once. | `[ASSUMED]` | r1.11 | unit/show |
| SHW-9 | The stage manager says where the show is: a double tap on a word puts the line there, Arrow down and Arrow up put it on the next and the previous block. A single tap does nothing. | request `[ASSUMED]` | r1.11 | show, unit/show |
| SHW-10 | Pace of the night: − and + in the panel (or `[` and `]`) make the line run 5% slower or faster than the times say, from 50% to 200%. It is 100% every time show mode is entered and is not kept. **Changed in the second build:** it was the words per minute of the show, kept. | second request "necessary settings for pace" `[ASSUMED]` | r1.11 | show, unit/show |
| SHW-11 | With "Time it" off, corrections of a running line are measured: after a minute of them the panel offers the pace of the night they give (time expected over time taken); one press adopts it. A correction more than 2.5 times off is a jump and is not counted. | `[ASSUMED]` | r1.11 | show, unit/show |

### 2.3 The page follows in steps

| ID | Requirement | Basis | Since | Checked by |
|---|---|---|---|---|
| SHW-7 | The page does not scroll with the line. It stands still while the line goes down the window, and when the line passes two thirds of the way down, the page jumps a third of the window, which puts the line one third down. A line that is out of the window (after a correction) is put one third down at once. **Changed in the second build:** the page moved with the line all the time. | second request `[LOCKED]` | r1.11 | show |
| SHW-8 | Scrolling by hand (finger, pen, wheel, Page keys) lets go of the line: the page stays where it is put, the line keeps running, and "Back to the line" (or Enter) returns to it. | `[ASSUMED]` | r1.11 | show |

### 2.4 Calls

| ID | Requirement | Basis | Since | Checked by |
|---|---|---|---|---|
| SHW-12 | A cue the line will reach within the standby time (30 s) is in STANDBY. Ends are called like cues. Boards and to-do notes are not called. | request `[LOCKED]`; times `[ASSUMED]` | r1.11 | show, unit/show |
| SHW-13 | A cue within the warning time (2 min) is in WARNING. A warning time of 0 gives no warnings. Both times are in Settings. | same | r1.11 | show, unit/show |
| SHW-14 | A cue the line has passed shows as GO for 4 s. | `[ASSUMED]` | r1.11 | show, unit/show |
| SHW-15 | Each call shows the estimated time to the cue, counted down (0:01 until the cue), from the times of the blocks in between and the pace of the night. On the page, the tag of a cue being called is outlined. Cues that come within 2 s of each other are one call. With nothing in standby or warning the next cue is named with its time; after the last, "No more cues". | request "estimated countdown" `[LOCKED]`; grouping `[ASSUMED]` | r1.11 | show |

### 2.5 The length of the show

| ID | Requirement | Basis | Since | Checked by |
|---|---|---|---|---|
| SHW-24 | The panel shows how far the show is (the time of the place of the line), how long it is (the sum of the block times), what is left at the pace of the night, and the time of day it would end if it ran on from now. | second request `[LOCKED]` | r1.11 | show, unit/show |
| SHW-25 | A map of the show: one stretch per scene, as long as its time, acts set apart, a tick for every cue in its colour, the part already played filled, a mark at the line. A scene is the stretch from one heading to the next. A press on the map shows that place of the script without moving the line (SHW-8). | second request `[LOCKED]`; the press `[ASSUMED]` | r1.11 | show |

### 2.6 The layout

| ID | Requirement | Basis | Since | Checked by |
|---|---|---|---|---|
| SHW-26 | The page as printed. The block being spoken is lit across the page, and a small mark on its left edge is the line: it shows roughly how far into the block the show is. A rail on the right: the clock, the calls as a stack of cards (go, standby, warning, then the three after), the pace. The map is a spine down the right edge. **Changed by the choice of 2026-10-11:** it was one of three layouts and had a line across the page. | choice `[LOCKED]` | r1.11 | show |
| SHW-29 | A press on a call shows the place of its cue in the script and flashes its block. The line stays where it is and runs on, and nothing is timed; "Back to the line" returns (SHW-8). | request `[LOCKED]` | r1.11 | show |
| SHW-30 | S enters show mode and, in it, asks to leave: a second S within 3 s leaves, as two presses on "Leave" do (SHW-1). The list of shortcuts (?) shows the keys of the mode the book is in and no others: in show mode the keys of show mode, outside it the editing keys with S. | request 2026-10-11 `[LOCKED]`; the letter `[ASSUMED]` | r1.11 | show, shortcuts |

### Withdrawn

| ID | Requirement | Basis | Since | Checked by |
|---|---|---|---|---|
| SHW-16 | *Withdrawn in the second build, never released.* A scene had a pace of its own. | — | — | — |
| SHW-17 | *Withdrawn.* "Learn pace" kept the pace measured between two corrections as the pace of the scene. | — | — | — |
| SHW-18 | *Withdrawn.* − and + tuned the pace of the scene the line was in. | — | — | — |
| SHW-27 | *Withdrawn by the choice of 2026-10-11, never released.* Layout 2, Spotlight: no rail, what was spoken dimmed, countdowns on the tags, a bar along the bottom, a slide of 0.16 s. Its lit block lives on in SHW-26. | — | — | — |
| SHW-28 | *Withdrawn.* Layout 3, Desk: the calls large on the left, the map along the bottom, the page turning by nearly a whole window. | — | — | — |

## 3. Consequences

**The line is a clock, not a listener.** It does not hear the stage. A pause, a laugh, a line jumped by an actor: the line is wrong until it is corrected or stopped. Everything shown as a time is an estimate and is written with `~` or counts down from one.

**Still no timing in the script (D4).** A cue has no time. The times belong to blocks and are kept apart from the text, in `config.json`:

```
"show": { "wpm": 130, "standby": 30, "warning": 120, "times": { "<key>": seconds, … } }
```

The key is a hash of the block's words, with `.2`, `.3` for the second and third block with the same words. A time is in seconds with one decimal. A show of 3000 blocks, all timed, adds about 50 KB to `config.json`. The file is not meant to be edited by hand there (C6 holds for the script, not for this table).

**Timing is by chunk, and a chunk is as fine as the marks.** Mark only the start and the end of a scene and every block in it is stretched by the same factor: the scene is right, its blocks are not. Arrow down at each new speech times each speech. The sharing inside a chunk follows the times so far, so a long silent piece of business inside a long chunk gets little: mark it on its own, or set it with +5 s.

**The last timing wins.** A second run over the same blocks replaces their times; nothing is averaged. One bad run (stops, repeats) is taken back with "Undo" only for its last chunk.

**A skip while the line runs can be taken for a chunk.** Jumping ahead in rehearsal without stopping the line first is read as "the show got here", unless it is more than 5 times too fast (SHW-21). The panel says what it timed, which is the only guard.

**Equal blocks are told apart by their turn.** Add a "Sì." before twenty others and the times of those twenty shift by one. They are short.

**Corrections on a show night change nothing that is kept.** With "Time it" off, only the pace of the night moves, and it is gone on leaving.

**The page jumps.** A jump moves the text under the eye. Two thirds of what was on screen stays, and the place is found again by its lit block.

**No intervals.** The length of the show is the script only. The time it would end does not know about an interval; stop the line for it.

**Find is not available in show mode**, with the top bar gone. The map and the cue list are the ways to look elsewhere.

**A save that fails is not seen in show mode.** The banner and the status are hidden with the top bar. It matters only for the times kept while timing a rehearsal; they are still in the browser's draft.

**Compatibility.** Show files written by r1.10 open unchanged. `config.json` gains `show`; r1.10 keeps it when it saves and ignores it. Scene paces (`show.scenes`) written by the first build of the same day are dropped on opening; that build was never released.

**Not built:** times shown beside each block on the page; an interval; averaging over several runs; undo of more than one chunk; coming back to the line by itself after a while; showing what is running from cue ends; marking a cue as called; the facing page in show mode; Find in show mode; a time per cue.

**Not verified.** Everything was checked in simulated Chromium with a mouse, with the clock moved by hand. Never tried: the laptop with pen and touch; a finger scroll letting go of the line; the wake lock (SHW-4); the default pace and the weights of SHW-6 against a real run; timing a real rehearsal; whether the layout reads well from where the stage manager sits.
