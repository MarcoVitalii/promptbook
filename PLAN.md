# Promptbook — Plan

**Plan:** v1.0, 2026-10-09. Restructured with `SPEC.md` v2.0: this file now holds only what is ahead. What the tool must do is in `SPEC.md` and `docs/specs/`; why it is built this way is in `docs/decisions.md`; how each release was checked is in `docs/verification.md`.
**State:** r1.9 is built, committed on `master` and tagged, and its features were tried by the client on a real show (2026-10-10). r1.8 is tagged. r1.7 is on `master` without a tag. r1.6, r1.7 and r1.8 are checked in a simulated browser only.

---

## 1. Intent

The first rehearsal with the tool was on 2026-10-08. The plan since then is driven by two things: what the rehearsals ask for, and closing the gap between "passes the checks" and "works under a hand on the laptop".

## 2. Where each release stands

| Release | Content | Gate still open |
|---|---|---|
| r0.1 | R0 plus the cue-word box | Recorded as tried on the laptop. Not in this repository. |
| r1.0 | Cue ends, board templates | Not recorded as tried on the laptop. |
| r1.3, r1.4 | Linking cues, descriptions, exports per department; comments, to-do notes, columns, numbers | Not recorded as tried on the laptop. |
| r1.5 | Fix for the show file; development tooling | Last tagged release; opens r1.6 shows. |
| r1.6 | Fixes from the first rehearsals | Device trial (§3, action 4). Tag. Confirmation of five `[ASSUMED]` decisions. |
| r1.7 | History, variants, locked pages, changes | Device trial (§3, action 5). Tag. Confirmation of its `[ASSUMED]` rows. |
| r1.8 | Look, cue labels, toolbar and dock, shortcuts | Device trial (§3, action 5a). Confirmation of the keys (UI-9). |
| r1.9 | Moving blocks, board name box, "Delete" and its key | Reported as working on a real show. Print not tried. |

Which release ran in the rehearsal of 2026-10-08 is not recorded. The earlier question of whether to take r0.1 or r1.0 into it is overtaken.

## 3. Next actions

In order. Items 1 to 3 come from the review of 2026-10-09 (`docs/review-2026-10-09.md`); the rest are carried from the plan as it stood.

1. **Decide where the repository lives** (Q27) and put a copy there. Today it has no remote. `master` now holds everything up to r1.8. Still open: r1.7 has no tag, and the tag `r1.6` points at `a3d735b`, a commit after r1.7, not at the r1.6 release (`d0b53c0`); move it or leave it, but decide.
2. **Fix the two ways of losing work found in the review:** two boards saved in one file (X1); a damaged settings or ink file opened as empty and then overwritten (X2).
3. **Name the pointer thresholds in one place** (F7), so that they can be tuned during the trial below.
4. **Try r1.6 on the laptop before a rehearsal relies on it.** Nothing of r1.6 has run there; the finger hold, the pen drag and the palm behaviour during a cue drag are simulated only; nothing was printed on paper and the PDF was not opened. Device trial of the cue drag, with finger and pen, and of the grid:
   - Finger hold on a tag: does 0.3 s feel right, is the lift visible under the finger, does a real finger stay within 8 px during the hold (otherwise it scrolls).
   - Finger swipe starting on a tag still scrolls and never lifts.
   - Pen drag from a tag starts at once and leaves no ink; a pen tap with normal jitter still opens the cue editor.
   - Writing hand resting on or near a tag while the pen hovers or writes: nothing lifts or drags.
   - Palm landing during a pen drag: the drag continues and no ghost tag is left behind.
   - Ghost tag position beside a real fingertip, also for a left-handed user and near the right edge.
   - Edge scroll with finger and pen: is the band at the bottom reachable, is the speed usable.
   - A system `pointercancel` in mid-drag ends the drag with no change.
   - Grid lightness on the real screen and on paper; hairlines may print faint on a laser printer.
5. **Try r1.7 on the laptop:** the real file dialogs; a revision, a variant, a restore; a locked show after an edit, and "Print changed pages" on paper; a change list printed for one actor. Keep the show file of a week's rehearsals and note its size (X6).
5b. **Try r1.10 with the cast:** send the cast file the way the company would (chat, mail) and open it on an Android phone and an iPhone. Does it open as a page; do part and notes survive closing it; does a second file find the notes written on the first. If an attachment does not keep them, decide where the reader lives instead (a link to one static copy, or installed once on each phone) and send `.cast.json` files to it. Confirm or change the `[ASSUMED]` readings in `docs/specs/10-cast.md` §1.
5a. **Try r1.8 on the laptop:** the colours by day and in the dark; whether the tag labels read at arm's length; whether the corner dock is in the way of the hand or the pen; the shortcuts on its keyboard (/ and ? on an Italian layout); one page with cues printed. Confirm or change the keys (UI-9).
6. **Try the r1.0 features on the laptop** if that was never done: place an end on a sound cue, draw a stage template, base a second template on it, add a board.
7. **Print one facing page with three or more boards** from r1.6 and look at it: two columns, names under the drawings, grid.
8. **Confirm or change the five decisions of r1.6** marked `[ASSUMED]`: the limit of 8 boards (BRD-8), the "⋯" button (BRD-10), the grid as a show setting (BRD-12), the 0.3 s finger hold (CUE-26), a cue always lands after a word (CUE-30).
9. **Confirm the `[ASSUMED]` rows of r1.7** (`docs/specs/08-history.md`, PAG-14 to PAG-17).
10. **Veto the reading of "configurations"** if the template drawings must sit inside `config.json` itself.
11. **Correct the record** if "yes" to Q21 or Q19 meant something else (`SPEC.md` §5).
12. **Record the results** of 4 to 7 in `docs/verification.md` §4.

## 4. Backlog — ordered after the first rehearsal

A call list built from the character list. Renumber command with an old-to-new log (must keep cue pairs together). Hint for out-of-order labels (CUE-5 already promises it). Clean-script export. Re-attach orphaned ink by hand. A `%%` span inside a speech. Highlighter, straight line and typed note tools. "Changed since last print" marks. Dragging board tags and reordering boards. Dropping a cue onto a line of its own. Anything further that rehearsals show.

From the review, when there is room: undo of a board rename (X5); only `data:` images from a backup, and a content security policy (X8); a release marker in the show (X7); `core.js` free of the other two files, then the split of `io.js` and `view.js` (F1, F2).

## 5. R2 — later

Built in r1.11 as show mode (`docs/specs/11-show.md`): the follow-along view for the stage manager (D11), standbys and warnings (D5). **To do before a show:** try it on the laptop with pen and touch in a run-through with "Time it" on. Three layouts were built and one kept on 2026-10-11 (SHW-26). Left out, to decide after that run: coming back to the line on its own, times shown beside each block, an interval, averaging several runs, showing what is running from cue ends, marking a cue as called. More than one device at a time is not planned (D15). Single screen, so D12 is not reopened.

## 6. Cast and crew — ideas, not scheduled

Collected on 2026-10-08 and 09; the cast would mostly use a phone. Built in r1.10 (`docs/specs/10-cast.md`): notes with an addressee, a page readable on a phone, memory practice by hiding one's own lines. Not built: the rehearsal day and the open/solved state of a note, the calendar, speech to text, pronunciation, writing back. None of those is designed or decided.

- Notes with an addressee (character, department or all), the rehearsal day and a state (open, solved), kept as a history; filters in Review by person, by day and by state.
- Rehearsal calendar: date, time, place, agenda and scenes per day; who is called, computed from the scenes (needs the actor's name beside each character); a call sheet per day; the notes of a day attached to that rehearsal.
- A page per person: their notes with the lines they refer to, readable on a phone.
- Memory practice: a button that hides the actor's own lines, so the part can be rehearsed from the cues of the others; a line is shown again on request.
- Later, on top of memory practice: speech to text on the device that listens to the actor and checks or corrects the spoken line against the script. Open: it must work without a network and without a library (D12), and the browser's built-in recognition may send the audio to a server.
- Pronunciation: mark where the stress falls and whether a vowel is open or closed on a word (*àncora* / *ancóra*, *pèsca* / *pésca*), shown to the cast without changing the script text; read a word or a line aloud. The simplest form: tapping a word opens its page in an online pronunciation dictionary. Open: reading aloud uses the voices installed on the device, which differ in quality and may not have Italian; the dictionary link needs a network, which the tool itself never uses (D12).
- Further off: the cast writing back (own notes, replies, marking a note solved) and a shared position during rehearsal. Both need more than one device at a time (D15) and a server (D12).

## 7. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| The repository is lost | High until Q27 is answered | High | Action 1 |
| Work is lost through a defect in saving | Low | High | Autosave; script and cues are plain text; backup export; revisions since r1.7. Two known ways remain open: review X1 and X2 (action 2) |
| Something works in the test browser but not on the real laptop | Medium | High | Device trials (actions 4 to 7); the "Finger" toggle lets the mouse or finger draw if the pen is not recognised |
| The cue drag of r1.6 misbehaves under a real finger, pen or resting hand: it changed the pointer handling that also does palm rejection and finger scrolling | Medium | High | Simulated checks pass, including the older palm checks unchanged; device trial before a rehearsal relies on it; a wrong move is one undo; r1.5 stays available as a tag and opens r1.6 shows |
| Pen is reported to the browser as touch or mouse, so pen and finger cannot be told apart | Low | High | Test on the real laptop; fallback is the "Finger" toggle |
| "yes" to Q21 did not mean all four device checks passed | Medium | High | Stated in `SPEC.md` §5; keep a paper copy as backup |
| Pinning a cue is slower than writing it | Medium | High | Target under 3 seconds, department on one tap; time it with the stage manager |
| Tool not trusted in rehearsal | Medium | High | Old workflow kept (A6); paper backup |
| Ink misaligned between devices or in print | Medium | Medium | Fixed measure, embedded font, line-count check per inked block; never compared on paper |
| A change to a template spoils boards built on it earlier | Medium | Medium | That is what a live link means; make a new template based on the old one instead of editing it |
| A release lands in the middle of rehearsals and unsettles a tool just learned | Medium | Medium | Releases add; older releases stay available as tags, as far as the compatibility table allows (`docs/specs/07-storage.md`) |
| A show is opened with an older release after using a newer feature | Low | Medium | Version on the start screen; the compatibility table. No guard in the file itself (review X7) |
| The show file grows with its history until saving is slow | Medium | Medium | Measure a real show (action 5); review X6 |
| Laptop's only browser is not Chrome or Edge | Low | Medium | A7; the in-browser fallback and backup files |
| "Block" in the template request was read wrongly (taken as a blocking board) | Low | Medium | Reading stated in `docs/specs/04-boards.md` |
| Parser misreads the real script | High | Low | Review list; fix by hand (K7) |
| A cue end pairs with the wrong start when numbers repeat | Medium | Low | Nearest-open rule, visible rail, review hint; the stage manager can retarget by editing the end |
| The Templates view is a second place to draw, with its own way in and out | Medium | Low | Same pen, eraser and undo as a board; one "Back to script" control |
| "Live in configurations" was meant literally: strokes inside `config.json` | Low | Low | Reading stated in `docs/specs/04-boards.md`; switching is a storage detail, not a redesign |

Closed: a writer editing a separate copy while the stage manager annotates (one editor, D15); the collaboration expectation (Q15); two days not being enough for R0 (built on day 0); movable props being wanted after all (ruled out, Q22); templates crowding a facing page or leaking into print (they live in the configuration, Q26).

## 8. Not planned

Console or playback export. Real-time co-editing. Score or bar-number cueing. Handwriting recognition. Any server.

## 9. Releases and versioning

Releases are kept in a git repository whose root is the project. Tags that exist: `r1.1` to `r1.6`, `r1.8` and `r1.9`. r0 and r0.1 are not in this repository; r1.0 is its first commit (`33118d4`) and has no tag; r1.7 is committed and has no tag; the tag `r1.6` is on `a3d735b`, later than the r1.6 release. The table of releases is in `SPEC.md` §6.

Rule for every release:

1. Record the request as intent in the capability file it belongs to; write the requirements and the consequences (`docs/decisions.md` §5).
2. Change `src/`, set `VERSION` in `src/core.js`.
3. `npm test`: builds `promptbook.html` and runs every check; all pass.
4. Add the entry to `CHANGELOG.md`, with "Compatibility". Add the release to `SPEC.md` §6 and its check record to `docs/verification.md` §3, saying what was not verified.
5. Merge to `main`, tag `rX.Y` and push the tag. The release workflow builds `promptbook.html` and `promptbook-cast.html`, attaches them to a GitHub release and publishes them on GitHub Pages (`CONTRIBUTING.md`).

Up to r1.10 the built file was committed, so that checking out a tag gives a usable tool. Since the repository is on GitHub it is not: each release carries the two built files, and a checkout builds them with `python3 build.py`. The version shows on the start screen.

Going back: check out the older tag and open its `promptbook.html`. An older show opens in a newer release; the reverse holds only where the compatibility table says so (`docs/specs/07-storage.md` §2.4).

## 10. What left this file

Two parts of the plan as it stood at git `953336a` described finished work and were removed: the day-by-day schedule for 2026-10-06 to 08, and the nine-step build order of r1.0. The strategy table (what was adopted, adapted and built, and why) moved to `docs/decisions.md` §4. The architecture sketch moved to `docs/architecture.md`.
