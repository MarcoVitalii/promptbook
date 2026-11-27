# Show mode — SHW

**Covers:** the three phases of the book (Write, Rehearse, Show); show mode: the book read only, the rehearsal in which it is written in, the running line, the time each block takes and how it is learned in rehearsal, the stepped page, the focus layout, warnings and standbys, the length of the show.
**Code:** `src/core.js` (show: `showTimeline`, `showT`, `showP`, `showNow`, `showHere`, `showLearn`, `showCalls`, `showLocked`, `showKeep`, `showCarry`), `src/view.js` (show: `showTick`, `showFollow`, `renderShowSide`, `renderShowProg`, `setPhase`, `lineOn`, `lineOff`, `showFocus`), `src/io.js` (keys `SHOWKEYS`, `REHKEYS`, Settings), `src/style.css` (phases, show mode).
**Checks:** `test/unit/show`, `test/show`, `test/rehearse`, `test/phases`.
**Columns and tags:** explained in `SPEC.md`, "How to read this specification".

---

## 1. Intent

Calling the show from the tool was asked for at the start, as a follow-along view for the stage manager alone (D11); standbys and warnings belong to it (D5).

**Request, 2026-10-11:** "the current version is quite painful when it comes to show day, as scrolling can try ot create new cues, or move around text. I'd need a read only mode with some support for warnings and standbys at a reasonable timing for cues. Think about viable alternatives to have an autoscroll feature that helps not loosing track of where we're at"

**Second request, 2026-10-11:** "Dive deeper on a system to compute heuristic times learned through reharsals. e.g. each text block has an inferred duration that starts off from a default wpm, and i can double click during reharsal to set real time for chunks of text. this way i can adjust each part of hte text. scroll shouldn't be smooth as it makes very hard to glance and read. should move by page thirds once the line is down enough. The live mode should try to remove all visuals that are unnecessary, think of it like a focus mode. leave just the necessary settings for pace, next cues and warnings on the side with estimated countdown. Generate different designs and provide the alternative versions to try. at least 3, vary wildly between them to actually feel what's good and what's not, will prune off later the ones that are less appealing. The system should also allow to visualize roughly the duration of the full show and how far we're in"

Read as `[ASSUMED]`:

- "Each text block has an inferred duration": the unit of time is the block (a speech, an action, speeches spoken together), not the scene.
- "Double click to set real time for chunks": while the line runs, two marks one after the other bound a chunk, and the time between them is its real time. A mark is the double tap that already corrects the line (SHW-9).
- "Move by page thirds once the line is down enough": the page stands still while the line goes down it, and jumps a third of the window when the line reaches the lower third.
- "Focus mode": in show mode the toolbar, the corner dock and the facing page are gone, and the script is as large as the window allows.
- "Different designs to try": three layouts of the same show mode were tried on the real show, and one was kept (2.6).
- "Duration of the full show and how far we're in": the sum of the block times, the time of the place of the line, and a map of the show by scene.

**Choice, 2026-10-11, after trying the three layouts:** "keep the book version with the highlight style of spotlight (full line highlighted WIth tiny marker on the left to gauge where we roughly are within the line" (SHW-26). Read as `[ASSUMED]`: what was already spoken is not dimmed, the tags carry no countdown and the page does not slide.

**Request, 2026-10-11:** "make the next items clickable to jump there for preview without affecting timing" (SHW-29).

**Request, 2026-10-11:** "add a shortcut also to the show mode, making the ? display shortcuts only for the relevant mode" (SHW-30).

**Request, 2026-10-13:** "the current timing implementation in show mode is not very effective, if i time at once a set of lines, it fails to spread the timing across the whole section, working only on the current item. […] I'd like to let the timer start and have timings based on my clicking. If i click after a while, spanning multiple lines, the semantic of it is that the lapsed since the last interaction or the start needs to be distributed over all lines, proportional to their length." Then: "Implement the different flavors in selectors, collect the evidence" (SHW-31 to SHW-36).

**Choice, 2026-10-13, after the report:** "se the timeline on the left side of the script, tell apart inferred from timed. allow quick adjustments on selection. The line still runs at the known timings. consider having an option with a next button on each line to time exactly each part" (tried, then replaced by the choice below).

**Choice, 2026-10-13, after trying the build:** "the play button sounds like a duplicate of the down line. let's hide the details, provide a mode by line, where the selector just stops on the line until the next button (with a key binding) is hit to advance for exact timings. preserve a rough estimation mode where from time to time the operator taps to align the lapsed to where the script actually is (which could be before or after the current marker) keep the indication of duration visibile and add the option to set it by typing. remove the timeline on the left" (SHW-31 to SHW-37).

Read as:

- The time of a chunk was already shared among its blocks (SHW-20); what was missing is that the page and the panel showed it for one block only, and that a mark that timed nothing did not say so (SHW-31, SHW-32).
- "Proportional to their length" holds for every block that has no better time: one set by hand, or one timed in a smaller chunk, keeps what it has (SHW-33). `[ASSUMED]`: the choice hides the ways of sharing without naming one; this is the one that loses nothing of a line-by-line run.
- "Before or after the current marker": the marker is the running line. A mark behind it or ahead of it is a chunk all the same, as long as it is ahead of the mark before (SHW-21).

**Request, 2026-11-14:** "Needs to be extremely ergonomic to be able to edit the text, file in annotations and note live during reharsals and time the show itself to automate callings and keeping track of where we are at." Asked which gap to close first, the client chose: "Rehearsal mode" (SHW-38 to SHW-42).

Read as `[ASSUMED]`:

- A rehearsal is show mode with "Time it" on. There is no third mode and no new switch: the switch that lets marks teach times is the one that lets the book be written in.
- "Edit the text, file in annotations and note": the pen draws, a tap pins a cue or a note, the text of a block is edited, a cue is moved, all while the line runs and is timed.
- A double tap stays the mark (SHW-9). It no longer opens the text of a block in rehearsal; a long press and "Edit text" in the cue pin do.
- An edit must not cost the time that was measured: the time of a block goes with it when its words change.

**Request, 2026-11-15:** "the ux and ui currently feels messy. time it under the show pane mixes the needs and text editing is not first class citizen. redesign the experience to focus on the 3 main phases: script authoring, reharsal with timings, blocking, cue settings and finally show time with automatic advancing of the script with go / standby and warnings." (SHW-43 to SHW-48, UI-14, TXT-8, INP-7, INP-12.)

Read as `[ASSUMED]`:

- Three phases and one switch: "Write", "Rehearse" and "Show", side by side in the top bar, one key each. The book is always in one of them.
- "Time it" is gone. Timing is what the line does in Rehearse, and nothing is learned in Show. This replaces the reading of 2026-11-14, under which the rehearsal was show mode with a switch on.
- "Text editing first class": in Write a tap on a word opens its block for typing, with the cursor at that word, and the next block is one key away. The pen and the cue pin belong to Rehearse.
- "Blocking, cue settings": the pens, the boards and the cue pin are the work of Rehearse, with the whole toolbar, whether or not the line runs.
- "Automatic advancing": the line and the stepped page as built (SHW-5, SHW-7). Nothing new was asked of them.

**Request, 2026-11-16, on seeing the first build:** "simplify again the interface, write shows the full text with the option to show the syntax and completion for characters and cues. reharse has the timings as an optional blade like ink or boards to not crowd too much the screen. Standbys and warnings remain only in the show" (SHW-44 to SHW-48, SHW-50, TXT-32, UI-4, UI-14).

Read as `[ASSUMED]`: Write is one box with the whole script, not pages with a box over one block; "the syntax" is the help that "Edit whole script…" showed; "completion" offers character names at the start of a line and departments with their next number after `{`; "blade" is a toggle in the group of "Boards", "Cues" and "Ink", off until pressed and remembered by the browser; the calls leave Rehearse altogether, the map and the clock stay with the timing.

## 2. Requirements

### 2.1 Entering, leaving, read only

| ID | Requirement | Basis | Checked by |
|---|---|---|---|
| SHW-1 | "Show" in the top bar, the third phase (SHW-43), enters show mode. "Leave" takes two presses within 3 s, so a stray touch does not end it; it goes back to the phase Show was entered from (SHW-46). Opening another show leaves it. | request `[LOCKED]`; two presses `[ASSUMED]` | show |
| SHW-2 | Show mode is read only: the pen draws nothing, a tap pins nothing, no cue or block is moved, nothing opens for editing, undo, redo and paste do nothing. The script text cannot change by any path. | request `[LOCKED]` | show, unit/show |
| SHW-3 | Focus: the top bar, the banner, the corner dock, the grips, the page buttons and the facing page are not shown, and the script page is fitted to the width left for it. Leaving puts the facing page and the zoom back as they were. Still there by key: cues (C), ink (I), night (N), the cue list (L), zoom (+ − 0), Page Up and Down, Home, End. Find and Review are not. | second request `[LOCKED]`; what stays `[ASSUMED]` | show |
| SHW-4 | The screen is kept awake where the browser allows it. | `[ASSUMED]` | — |

### 2.2 The line and the time of a block

| ID | Requirement | Basis | Checked by |
|---|---|---|---|
| SHW-5 | A line marks the place of the show. Space starts and stops it. Entering show mode puts it, stopped, on the block being read. It stops by itself at the end of the script. | request, alternative B `[ASSUMED]` | show, unit/show |
| SHW-6 | A place is a count of words from the top. A speech or an unnamed paragraph counts its words plus 2; an action its words plus 2 plus 6, for the business; speeches spoken together count as the longest of them; headings, comments, boards and cues on a line of their own count nothing. | `[ASSUMED]` | unit/show |
| SHW-19 | Every block has a time. Until it is timed, it is its count of words at the pace of the show (Settings, 130 words a minute to begin with). Once timed, it is the time that was measured, whatever the pace of the show becomes. The line crosses a block in its time. | second request `[LOCKED]`; the default `[ASSUMED]` | unit/show |
| SHW-20 | Timing is done in Rehearse (SHW-45); in Show nothing is learned, so a show night changes nothing. While the line runs, each mark (SHW-9) closes a chunk that began at the mark before, or where the line was started: the running time between the two is shared among the blocks of the chunk (SHW-33), a block covered in part taking its share for that part only. Each block's new time is kept. | second request `[LOCKED]`; the sharing `[ASSUMED]` | unit/show, show |
| SHW-21 | What is not a chunk: a mark while the line is stopped, a mark behind the one before, less than 1 s of running, and a chunk that would be more than 5 times faster or 60 times slower than its time so far. Those only move the line and start a new chunk there. Time while the line is stopped is not counted. | `[ASSUMED]` | unit/show |
| SHW-22 | After each chunk the panel says what was timed (its time, and its time before). "Undo" takes the last chunk back. In Rehearse the panel also shows the time of the block the line is in and whether it was timed, −5 s and +5 s to set it by hand, the share of the show that is timed, and, once 200 spoken words are timed, the pace measured over them with one press to make it the pace of the show for everything not timed. | "adjust each part" `[ASSUMED]` | unit/show, show |
| SHW-23 | A timed block is known by its words (cue tokens ignored), and by its turn among blocks with the same words. Change the words of one block and its time goes with it, longer or shorter as the block is (SHW-41). A block typed anew, or changed along with its neighbours in one edit, has no time and goes at the pace of the show. Settings can forget every time at once. | `[ASSUMED]` | unit/show |
| SHW-31 | In Rehearse, every block shows its time at the right edge of the page: the measured time, `~` before a time inferred from its words, `=` before a time set by hand. The blocks of the last chunk carry a bar. The panel says how many blocks the chunk timed, and the running time since the last mark. | request 2026-10-13, "keep the indication of duration visible" `[LOCKED]` | show |
| SHW-32 | A mark that times nothing says why in the panel: the line is stopped, the mark is behind the one before, less than a second, far too fast, far too slow (SHW-21). | request 2026-10-13 `[ASSUMED]` | unit/show, show |
| SHW-33 | How a chunk is shared: a block set by hand keeps its time; blocks timed before in a smaller chunk keep their proportions; the others share what is left in proportion to their length, which is their weight (SHW-6). When the blocks set by hand leave less than a fifth of the time the others had, they stretch with the rest. A chunk of one block gives it exactly the time. | request 2026-10-13 `[ASSUMED]` | unit/show |
| SHW-34 | Two ways of timing, chosen in the panel. "From time to time", the one a rehearsal starts with: the line runs at the times known so far, and a double tap where the show really is, behind the line or ahead of it, is a mark. "Line by line": the line is put at the start of its block and waits there while the time since the mark runs; "Next" (Arrow down) says the block is over, gives it its time and puts the line on the next block. A double tap marks the start of the block it is in. In Show the line always runs. | choice 2026-10-13 `[LOCKED]` | unit/show, show |
| SHW-35 | In Rehearse, while the line runs, Arrow down goes to the block after the last mark, wherever the clock has taken the line. | defect found 2026-10-13 `[ASSUMED]` | unit/show |
| SHW-36 | A press on the time of a block on the page opens a box to type it: seconds (`12`, `12.5`, `12,5`) or minutes and seconds (`1:05`). Enter keeps it, set by hand, never under half a second; Escape leaves it; an empty box forgets the time and the block is inferred again; what is not a time is refused. The line does not move, and the keys typed are not keys of the show. | choice 2026-10-13 `[LOCKED]`; the forms `[ASSUMED]` | unit/show, show |
| SHW-9 | The stage manager says where the show is: a double tap on a word puts the line there, Arrow down and Arrow up put it on the next and the previous block. A single tap does nothing. | request `[ASSUMED]` | show, unit/show |
| SHW-10 | Pace of the night: − and + in the panel (or `[` and `]`) make the line run 5% slower or faster than the times say, from 50% to 200%. It is 100% every time show mode is entered and is not kept. | second request "necessary settings for pace" `[ASSUMED]` | show, unit/show |
| SHW-11 | In Show, corrections of a running line are measured: after a minute of them the panel offers the pace of the night they give (time expected over time taken); one press adopts it. A correction more than 2.5 times off is a jump and is not counted. | `[ASSUMED]` | show, unit/show |

### 2.3 The page follows in steps

| ID | Requirement | Basis | Checked by |
|---|---|---|---|
| SHW-7 | The page does not scroll with the line. It stands still while the line goes down the window, and when the line passes two thirds of the way down, the page jumps a third of the window, which puts the line one third down. A line that is out of the window (after a correction) is put one third down at once. | second request `[LOCKED]` | show |
| SHW-8 | Scrolling by hand (finger, pen, wheel, Page keys) lets go of the line: the page stays where it is put, the line keeps running, and "Back to the line" (or Enter) returns to it. | `[ASSUMED]` | show |

### 2.4 Calls

| ID | Requirement | Basis | Checked by |
|---|---|---|---|
| SHW-12 | A cue the line will reach within the standby time (30 s) is in STANDBY. Ends are called like cues. Boards and to-do notes are not called. | request `[LOCKED]`; times `[ASSUMED]` | show, unit/show |
| SHW-13 | A cue within the warning time (2 min) is in WARNING. A warning time of 0 gives no warnings. Both times are in Settings. | same | show, unit/show |
| SHW-14 | A cue the line has passed shows as GO for 4 s. | `[ASSUMED]` | show, unit/show |
| SHW-15 | Each call shows the estimated time to the cue, counted down (0:01 until the cue), from the times of the blocks in between and the pace of the night. On the page, the tag of a cue being called is outlined. Cues that come within 2 s of each other are one call. With nothing in standby or warning the next cue is named with its time; after the last, "No more cues". | request "estimated countdown" `[LOCKED]`; grouping `[ASSUMED]` | show |

### 2.5 The length of the show

| ID | Requirement | Basis | Checked by |
|---|---|---|---|
| SHW-24 | The panel shows how far the show is (the time of the place of the line), how long it is (the sum of the block times), what is left at the pace of the night, and the time of day it would end if it ran on from now. | second request `[LOCKED]` | show, unit/show |
| SHW-25 | A map of the show: one stretch per scene, as long as its time, acts set apart, a tick for every cue in its colour, the part already played filled, a mark at the line. A scene is the stretch from one heading to the next. A press on the map shows that place of the script without moving the line (SHW-8). | second request `[LOCKED]`; the press `[ASSUMED]` | show |

### 2.6 The layout

| ID | Requirement | Basis | Checked by |
|---|---|---|---|
| SHW-26 | The page as printed. The block being spoken is lit across the page, and a small mark on its left edge is the line: it shows roughly how far into the block the show is. A rail on the right: the clock, the calls as a stack of cards (go, standby, warning, then the three after), the pace. The map is a spine down the right edge. | choice `[LOCKED]` | show |
| SHW-29 | A press on a call shows the place of its cue in the script and flashes its block. The line stays where it is and runs on, and nothing is timed; "Back to the line" returns (SHW-8). | request `[LOCKED]` | show |
| SHW-30 | S enters show mode and, in it, asks to leave: a second S within 3 s leaves, as two presses on "Leave" do (SHW-1). The list of shortcuts (?) shows the keys of the phase the book is in and no others (SHW-48). | request 2026-10-11 `[LOCKED]`; the letter `[ASSUMED]` | show, shortcuts |

### 2.7 Rehearsal

| ID | Requirement | Basis | Checked by |
|---|---|---|---|
| SHW-38 | In Rehearse the book is written in while the line is there: the pen draws and erases, a tap on a word opens the cue pin, a tap on a tag opens its cue, a cue tag is dragged, a long press or "Edit text" opens the text of a block, undo and redo work. In Show the book is read only (SHW-2). | request 2026-11-14 `[ASSUMED]` | rehearse, unit/show |
| SHW-39 | In rehearsal a double tap on a word is still the mark (SHW-9): the cue pin its first tap opened is closed, and nothing is pinned. A double tap never opens the text of a block. | `[ASSUMED]` | rehearse |
| SHW-40 | In Rehearse the whole top bar is there (SHW-45), with the pens, "Eraser", "Finger", undo, redo and the name and state of the save. Their keys work too: 1 to 4, E, F, Ctrl+Z, Ctrl+Y. The list of shortcuts shows them. | `[ASSUMED]` | rehearse |
| SHW-41 | When the words of a timed block change in an edit of that block alone, the block keeps a time: the one it had, in proportion to its new length (SHW-6). The time under the old words is kept as well, so that undo gives it back. This holds outside show mode too. | request 2026-11-14 `[ASSUMED]` | unit/show |
| SHW-42 | An edit while the line runs does not move the line or the last mark: each stays in its block, as far into it as it was, however many words were added or removed above. The calls follow the cues as they are after the edit. The clock is not stopped by a box that is open. The phase cannot be changed while the text of a block is open (SHW-47). | `[ASSUMED]` | unit/show, rehearse |

### 2.8 The three phases

| ID | Requirement | Basis | Checked by |
|---|---|---|---|
| SHW-43 | The book is in one of three phases, "Write", "Rehearse" and "Show", picked side by side in the top bar or with W, R and S. A show opens in the phase this browser was left in, Write or Rehearse, never Show; the first time, Write. The phase is a view setting (UI-8): it is not in the show file. | request 2026-11-15 `[LOCKED]`; the names, the keys and the memory `[ASSUMED]` | phases, shortcuts |
| SHW-44 | Write is the whole script as text: one box with every line, the cursor where it was left, and nothing drawn: no page, no pen, no cue pin, no line, no panel. What is typed goes into the show after a pause of 1.5 s, when the box loses the focus, before a save (Ctrl+S) and before a change of phase; each such commit is one step of undo in Rehearse, and Ctrl+Z in the box is the box's own. "Syntax" (Y) shows the forms of the script beside the box. The top bar holds the phases, "Syntax", the jump menu (it moves the cursor to the heading), Find (it selects the next match in the box; Enter again the one after), "Review", "Cue list" and "Print". Completion while typing: TXT-32. | request 2026-11-16 `[LOCKED]`; the commit rule and the bar `[ASSUMED]` | phases |
| SHW-45 | Rehearse is the workbench: the pens, "Eraser", "Finger", undo and redo, the jump menu, Find, the view toggles, "Cue list" and "Print" in the top bar, the corner dock, the facing page as it was; a tap pins a cue (SHW-38), a block is moved, an image is pasted. "Timing" (T), a toggle beside "Boards", "Cues" and "Ink" and remembered by the browser like them (UI-8), brings the line and what goes with it: the panel on the right with the clock, "Start", the two ways of timing (SHW-34) and the time of the block (SHW-22), the map (SHW-25), the times on the page (SHW-31), the marks (SHW-9) and the stepped page (SHW-7). With it off there is no line, a double tap is two taps, and the whole window is the book. The line learns whenever it runs in Rehearse; there is no pace of the night and no call (SHW-50). | request 2026-11-16 `[LOCKED]`; what the toggle holds `[ASSUMED]` | phases, rehearse, show |
| SHW-46 | Show is read only (SHW-2) and in focus (SHW-3), with the pace of the night (SHW-10, SHW-11) and the calls (SHW-50); nothing is learned. Entered from Write, or from Rehearse without "Timing", the line is put, stopped, on the block being read (SHW-5); from Rehearse with "Timing" it stays where it was, stopped. "Leave" (two presses, SHW-1) and S (twice, SHW-30) go back to the phase Show was entered from. | request `[LOCKED]` | phases, show |
| SHW-47 | Changing phase is refused, with a message, while the text of a block is open in Rehearse. Leaving Show, leaving Rehearse and turning "Timing" off stop the line. What was timed stays (SHW-20). Opening another show, or closing it, puts the book in the phase the browser remembers (SHW-43). | `[ASSUMED]` | phases |
| SHW-48 | The keys: in Write the keys of the box, Ctrl+F, Ctrl+S, Ctrl+P and the phases; in Rehearse the editing keys (UI-9), T for "Timing" and, with it on, those of the line (Space, Enter, Arrow down and up); in Show the keys of the line, of the pace and of the view (SHW-3), and S to leave. W, R and S change phase in Write and Rehearse (in Write, when the cursor is not in the box: Escape takes it out); in Show only S acts. "?" lists the keys of the phase (SHW-30). | `[ASSUMED]` | shortcuts, phases |

| SHW-50 | The calls (warning, standby, go, the next cues, the outlined tags: SHW-12 to SHW-15, SHW-29) are shown in Show only. In Rehearse the panel holds the clock, the timing and the map, and no cue is called. | request 2026-11-16 `[LOCKED]` | rehearse, show |

Not in use: SHW-16 to SHW-18, SHW-27, SHW-28, SHW-37 and SHW-49.

## 3. Consequences

**The line is a clock, not a listener.** It does not hear the stage. A pause, a laugh, a line jumped by an actor: the line is wrong until it is corrected or stopped. Everything shown as a time is an estimate and is written with `~` or counts down from one.

**Three phases, one switch.** Write, Rehearse and Show are the three things the book is for, and it is always in one of them. Rehearse is the whole workbench with a line in it: nothing is locked, and timing is not switched on, it is what the line does there. Show is the same line with the book locked. What was "Time it", a switch inside show mode that both taught times and unlocked the book, is gone: whoever wants to time presses Rehearse, whoever wants nothing learned presses Show. There is no way to write in the book while the line runs without timing, and none to time with the book locked.

**Write is text, not pages.** The script is typed as the author wrote it, in one box, with the forms beside it on request and the names and cue marks offered as they are typed. Nothing is drawn there, so nothing can be drawn on by mistake, and a rewrite of a scene is one pass down the box rather than a box per speech. What is typed reaches the pages after a pause: the pages, the ink and the cues are matched to the new words then, as for any edit (TXT). Blocking and cues are the work of Rehearse: a stage manager who pins the cues before the first rehearsal does it there, with "Timing" off.

**Timing is a blade, not a mode.** In Rehearse the line and its panel come and go with one toggle, as the facing page and the ink do, so a rehearsal of blocking and cues has the whole window for the book and a timed run has the panel. With "Timing" on, a tap opens the cue pin and a double tap marks: the pin shows for a moment before the mark, and whoever double taps slowly (more than 0.42 s) gets the pin and no mark. With it off a double tap is two taps and two pins.

**The panel costs a third of the window.** With "Timing" and "Boards" both on, two pages fitted to a 1366 px laptop are small from the prompt desk. The choice is left to the stage manager: the two toggles are independent, and Show still hides the facing page for the night (SHW-3).

**No calls in Rehearse.** A countdown to a cue during a rehearsal that stops and starts is noise, and it was asked out. The outlined tags go with the calls. The map keeps its ticks, which are places, not calls.

**The line is stopped by a change of phase, never moved by it.** Rehearse to Show keeps the place, so a rehearsal can turn into a run; Show to Rehearse keeps it too. Write has no line: entering Rehearse or Show from it puts the line on the block being read, as before.

**The box of a cue or of a text stays open while the line runs.** The line, the calls and the page jumps go on underneath. A page jump can take the block being written on out of the window; the box stays where it is.

**A time carried over an edit is shown as timed.** It was not measured on the new words. A speech cut from forty words to four keeps a tenth of its time, pauses included.

**Times are never taken out of `config.json` by an edit.** The time under the words before the edit stays, for undo. Only "Forget" in Settings empties the table.

**Still no timing in the script (D4).** A cue has no time. The times belong to blocks and are kept apart from the text, in `config.json`:

```
"show": { "wpm": 130, "standby": 30, "warning": 120, "times": { "<key>": seconds, … } }
```

The key is a hash of the block's words, with `.2`, `.3` for the second and third block with the same words. A time is in seconds with one decimal. A show of 3000 blocks, all timed, adds about 50 KB to `config.json`. The file is not meant to be edited by hand there (C6 holds for the script, not for this table).

**Timing is by chunk, and a chunk is as fine as the marks.** Mark only the start and the end of a scene and the scene is right, its blocks only as right as their lengths. "Line by line" times each block. A long silent piece of business inside a long chunk gets little, having few words: time it line by line, or type its time.

**How a block was timed is not kept.** The way of timing chosen, and for each block the length of the chunk it was timed in or that it was set by hand, last until the tool is closed. After reopening a show every timed block counts as timed alone and none as set by hand: a chunk over several of them keeps their proportions, and `=` is gone from the page. The times themselves are kept as before; `config.json` has nothing new.

**From time to time, the page follows the clock, not the actors.** After a long chunk the place to mark may have left the window and must be scrolled back by hand. Line by line the line never leaves the block being spoken, and the calls do not count down, since the line is not running.

**The last timing wins.** A second run over the same blocks replaces their times; nothing is averaged. One bad run (stops, repeats) is taken back with "Undo" only for its last chunk.

**A skip while the line runs can be taken for a chunk.** Jumping ahead in rehearsal without stopping the line first is read as "the show got here", unless it is more than 5 times too fast (SHW-21). The panel says what it timed, which is the only guard.

**Equal blocks are told apart by their turn.** Add a "Sì." before twenty others and the times of those twenty shift by one. They are short.

**Corrections on a show night change nothing that is kept.** In Show only the pace of the night moves, and it is gone on leaving.

**The page jumps.** A jump moves the text under the eye. Two thirds of what was on screen stays, and the place is found again by its lit block.

**No intervals.** The length of the show is the script only. The time it would end does not know about an interval; stop the line for it.

**Find is not available in show mode**, with the top bar gone. The map and the cue list are the ways to look elsewhere.

**A save that fails is not seen in show mode.** The banner and the status are hidden with the top bar. It matters only for the times kept while timing a rehearsal; they are still in the browser's draft.

**What is not a time is not kept.** A `show.scenes` found in `config.json` is dropped on opening; any other field of `show` the tool does not know is kept (STO-17).

**Not built:** a phase kept in the show file; completion of anything but names, departments and open cues; syntax colouring in the box; Review in Rehearse; a note written with the pen that Review lists; an interval; averaging over several runs; undo of more than one chunk; coming back to the line by itself after a while; showing what is running from cue ends; marking a cue as called; the facing page in show mode; Find in show mode; a time per cue.

**Not verified.** Everything was checked in simulated Chromium with a mouse, with the clock moved by hand. Never tried: the laptop with pen and touch; the three phases on a real show, and whether the pen scrolling in Write is what the hand expects; writing with the pen while the line runs, and whether a resting hand makes a mark; the cue pin under a double tap of a real finger; a finger scroll letting go of the line; the wake lock (SHW-4); the default pace and the weights of SHW-6 against a real run; timing a real rehearsal; whether the layout reads well from where the stage manager sits.
