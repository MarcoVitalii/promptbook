# Digital Prompt Book — Plan

**Status:** v0.9 — 2026-10-08 — r1.6 built, committed on branch r1.6, not yet tagged (fixes from the first rehearsals); not yet tried on the laptop
**Rehearsal deadline:** 2026-10-08
**Companion file:** `SPEC.md`

---

## 1. Strategy

v0.1 planned to adopt a converter, adapt a script language and build a core plus an Obsidian plugin. The answers make almost all of that unnecessary.

| Part | v0.1 | v0.2 | Why |
|---|---|---|---|
| Word import | Pandoc | Paste the text | Script is already plain `NAME: text` |
| Script language | Downstage / Fountain / Markdown | The convention already in use | No new syntax to learn, no external renderer |
| Rendering and print | Typst or HTML | HTML and CSS in the browser | Zero dependencies |
| Drawings | Excalidraw plugin | Built-in pen | Zero dependencies, ink must sit on the text |
| Cue list | Dataview prototype, then core | Built in | Small |
| Host | Obsidian plugin + CLI + optional browser | One HTML file | Q5 |
| Versioning | Git | Git, optional, outside the tool | Q9 |

**Adopt:** nothing at runtime. One open-licence font (Inter, SIL OFL 1.1) embedded in the file.
**Adapt:** nothing.
**Build:** `promptbook.html`.

The price of this simplicity is stated in SPEC §4: K3 (ink is not data), K4 (ink is flagged when its own lines change), K5 (no Excalidraw).

## 2. Architecture

One file, plain JavaScript, no build step. Internally four parts with hard boundaries so later tiers do not need a rewrite:

```
parse      text → blocks, cues, board tokens          (pure, testable)
layout     blocks → fixed-measure pages               (measure, paginate)
interact   pins, pen, block editing, boards
store      folder mode | project-file mode            (one interface, two back ends)
```

## 3. Schedule

### Day 0 — 2026-10-06

- ~~Answer Q14.~~ Done: pen-and-touch laptop. One device, one browser family, folder mode only.
- Client vetoes or accepts the `[ASSUMED]` items in SPEC §3–4. None vetoed so far; silence is being treated as acceptance.
- ~~Freeze R0. Build starts.~~ Done: all nine R0 items are built and pass 79 automated checks (SPEC §7).
- Not done: nothing has run on the rehearsal laptop, with a real pen, or with the real script.

### Day 1 — 2026-10-07

The build is ahead of this schedule, so day 1 becomes the device day:

1. Open `promptbook.html` in Chrome or Edge on the rehearsal laptop. Try the sample scene. Run the SPEC Q21 checks: pen draws without scrolling, resting hand stays quiet, eraser end erases, finger tap pins.
2. Make a show folder, open it from the tool, paste the real script. Read the Review panel: unrecognised lines and one-off character names.
3. The stage manager marks one real scene: cues, ink, one board. Time a cue pin; the target is under 3 seconds.
4. Print that scene. Compare ink position on paper with the screen.
5. Report what broke. Fixes land the same day.

### Day 2 — 2026-10-08

- Morning: test on the actual rehearsal device. Fix what breaks. Print one full copy as paper backup.
- Rehearsal: tool in use, old workflow on standby.
- After: collect friction list. It sets R1 priorities.

### Build order inside R0

If time runs out, the list is cut from the bottom:

1. R0.1 parse + R0.2 page view + R0.9 save/load
2. R0.4 cue pins + R0.7 cue list
3. R0.3 block editing
4. R0.5 ink on script
5. R0.8 print
6. R0.6 boards

Items 1–2 alone already remove re-importing and hand-compiled cue lists. Ink is fourth, not first, because without 1–3 there is nothing to ink on.

## 4. After rehearsal

| Tier | Content | Gate |
|---|---|---|
| R0.1 | Cue words boxed instead of underlined | Delivered 2026-10-06. Display only; no file or gesture changes. |
| R1.3 | Linking cues, cue notes, exports per department (SPEC §5.11) | Built 2026-10-07 as r1.3. Not yet tried on the laptop. |
| R1.4 | `%%` comments, to-do notes, cue list columns, automatic numbers (SPEC §5.13) | Built 2026-10-07 as r1.4. Not yet tried on the laptop. |
| R1.6 | Fixes from the first rehearsals: boards in two columns, board names under the drawing, board grid, moving a cue by dragging its tag (SPEC §5.14) | Built 2026-10-08 as r1.6; committed on branch r1.6, not yet tagged. 376 browser checks and 67 unit checks pass. Not yet tried on the laptop: the finger hold, the pen drag and the palm behaviour during a cue drag are simulated only. Nothing printed on paper; the PDF was not opened. Gate: the device trial in §7. |
| R1.7 | History in git inside the show, variants, locked page numbers, changes per character (SPEC §5.15) | Built 2026-10-09 as r1.7; not committed or tagged. All checks pass. Not yet tried on the laptop: the real file dialogs, a show file with a long history, and the printed changed pages are untested there. Open: confirm the `[ASSUMED]` rows of §5.15. |
| R1 | Cue ends and board templates (SPEC §5.10, §5.11, §7) | Delivered 2026-10-06 as r1.0. 145 automated checks pass. Not yet tried on the laptop. |
| Backlog | The former R1 list (SPEC §7) | Reordered by the first rehearsal's friction list |
| R2 | Follow-along view for the stage manager, standbys | After R1. Single screen, so D12 is not reopened. |

### R1 build order — all nine steps done in r1.0

Adopt: nothing. Adapt: nothing. Build: both features inside `promptbook.html`, same four parts as PLAN §2.

| Step | Work | Part touched | Done when |
|---|---|---|---|
| 1 | Parse `{/DEPT label \| desc}`; pair ends with starts (SPEC K8) | parse | Pairs resolve on a test script with missing, repeated and unlabelled cues |
| 2 | "End:" row in the tap popover; end tag in the margin | interact, layout | An end is placed in one tap after tapping a word |
| 3 | Cue list columns, CSV, review hints; start edits and deletes carry to the end | interact | List shows where each cue ends; one undo reverts a paired edit |
| 4 | Running rail in the margin | layout | Rail is continuous across a page break and in print |
| 5 | Template store: `templates/` files, list and default in `config.json`; `base` on boards and templates; chain loading; loop guard | store | A three-deep chain survives reload; a loop cannot be made; old shows open unchanged |
| 6 | Templates view, opened from Settings: one sheet per template, same pen, eraser and undo; new blank / from image / based on another | interact, layout | A template can be drawn and edited without any line in `script.md`; nothing of it reaches a print |
| 7 | Draw the chain greyed and locked under a board's own ink, on screen and in print | layout | Changing a template shows on every board built on it; eraser cannot touch the chain |
| 8 | Template picker on "+ Board" and "Board here"; default template; change a board's base; "Copy to templates"; rename carries through; delete guard | interact | New board from a template in one tap; a board changes base and keeps its ink |
| 9 | Regression: the existing 84 checks plus new ones for steps 1–8 | — | All pass; print checked as PDF |

No step depends on an open question.

Files written by R0 stay valid. R1 adds a token form, one folder (`templates/`) and a few fields; it changes no existing format.

## 5. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Tool not trusted by rehearsal time | Medium | High | Old workflow kept; paper backup printed day 2 |
| Laptop's only browser is not Chrome or Edge | Low | Medium | SPEC A7; project-file mode pulled back into R0 |
| Pen is reported to the browser as touch or mouse, so pen and finger cannot be told apart | Low | High | Test on the real laptop first thing on day 1; fallback is a draw/tap toggle |
| Writer edits a separate copy while the SM annotates | Closed | — | One editor (SPEC D15) |
| Pinning a cue is slower than writing it | Medium | High | Target under 3 seconds, department on one tap; measure with the SM on day 1 |
| Ink misaligned between devices or in print | Medium | Medium | Fixed measure, embedded font, line-count check per inked block |
| Parser misreads the real script | High | Low | Review list; fix on day 1 evening |
| Data loss | Low | High | Autosave; script and cues are plain text; export-all button |
| Collaboration expectation unmet | Closed | — | One editor accepted (Q15) |
| Two days is not enough for all of R0 | Closed | — | R0 was built on day 0 |
| Something works in the test browser but not on the real laptop | Medium | High | Day 1 is reserved for it; "Finger" toggle lets the mouse or finger draw if the pen is not recognised |
| Chrome refuses the chosen folder | Low | Low | Top level of Desktop, Documents and Downloads is blocked; use a sub-folder |
| "Block" in the template request was read wrongly (taken as a blocking board) | Low | Medium | Reading is stated at the top of SPEC §5.10 |
| Movable props are wanted after all | Closed | — | Ruled out (Q22) |
| A change to a template spoils boards built on it earlier | Medium | Medium | That is what a live link means; make a new template based on the old one instead of editing it. Stated in the guide when R1 ships |
| Templates crowd a facing page or leak into the print | Closed | — | They live in the configuration (Q26) |
| "Live in configurations" was meant literally: strokes inside `config.json` | Low | Low | Reading stated in SPEC §5.10 (Files); switching is a storage detail, not a redesign |
| The Templates view is a second place to draw, with its own way in and out | Medium | Low | Same pen, eraser and undo as a board; one "Back to script" control |
| A cue end pairs with the wrong start when numbers repeat | Medium | Low | Nearest-open rule, visible rail, review hint; the stage manager can retarget by editing the end |
| R1 lands in the middle of rehearsals and unsettles a tool just learned | Medium | Medium | R1 only adds; no R0 gesture changes except that "Use as default" on boards became "To templates". r0.1 stays available as a tag |
| A show is opened with an older release after using ends or templates | Low | Medium | Version on the start screen; rule in §8 |
| The repository is lost with the build session | High until Q27 is answered | Medium | Archive delivered with the release; Q27 |
| "yes" to Q21 did not mean all four device checks passed | Medium | High | Stated in SPEC §9; the paper backup on day 2 stays |
| The cue drag of r1.6 misbehaves under a real finger, pen or resting hand: it changed the pointer handling that also does palm rejection and finger scrolling | Medium | High | Simulated checks pass, incl. the older palm checks unchanged; device trial in §7 before a rehearsal relies on it; a wrong move is one undo; r1.5 stays available as a tag and opens r1.6 shows |

## 6. Not planned

Console or playback export. Real-time co-editing. Score or bar-number cueing. Handwriting recognition. Any server.

## 7. Next actions

1. Decide where the repository lives (SPEC Q27).
2. Try r1.0 on the laptop: place an end on a sound cue, draw a stage template, base a second template on it, add a board.
3. Decide which release goes into the 2026-10-08 rehearsal: r0.1 (already tried) or r1.0. Do not switch a show back to r0.1 once it uses ends or templates.
4. Veto the reading of "configurations" if the drawings must sit inside `config.json` itself.
5. Correct the record if "yes" to Q21 or Q19 meant something else (SPEC §9).
6. Try r1.6 on the laptop before a rehearsal relies on it. Nothing of r1.6 has run there; the finger hold, the pen drag and the palm behaviour during a cue drag are simulated only; nothing was printed on paper and the PDF was not opened. Device trial of the cue drag, with finger and pen, and of the grid:
   - Finger hold on a tag: does 0.3 s feel right, is the lift visible under the finger, does a real finger stay within 8 px during the hold (otherwise it scrolls).
   - Finger swipe starting on a tag still scrolls and never lifts.
   - Pen drag from a tag starts at once and leaves no ink; a pen tap with normal jitter still opens the cue editor.
   - Writing hand resting on or near a tag while the pen hovers or writes: nothing lifts or drags.
   - Palm landing during a pen drag: the drag continues and no ghost tag is left behind.
   - Ghost tag position beside a real fingertip, also for a left-handed user and near the right edge.
   - Edge scroll with finger and pen: is the band at the bottom reachable, is the speed usable.
   - A system `pointercancel` in mid-drag ends the drag with no change.
   - Grid lightness on the real screen and on paper; hairlines may print faint on a laser printer.
7. Print one facing page with three or more boards from r1.6 and open the PDF: two columns, names under the drawings, grid.
8. Confirm or change the five decisions of r1.6 marked `[ASSUMED]` in SPEC §5.14: the limit of 8 boards, the "⋯" button, the grid as a show setting, the 0.3 s finger hold, a cue always lands after a word.

## 8. Releases and versioning

Releases are kept in a git repository whose root is the project: `promptbook.html` (the built release), `src/`, `fonts/`, `build.py`, `test/`, `SPEC.md`, `PLAN.md`, `CHANGELOG.md`, `README.md`.

| Tag | Date | Content |
|---|---|---|
| `r0.1` | 2026-10-06 | First commit: R0 plus the cue-word box. R0 itself was delivered before the repository existed and has no tag. |
| `r1.0` | 2026-10-06 | Cue ends, board templates |
| `r1.3` | 2026-10-07 | Linking cues (`{SND 6 / SND 5}`), cue notes, exports per department; "runs" removed |
| `r1.4` | 2026-10-07 | `%%` comments, to-do notes as a review department, Margin and Description columns, automatic numbers |
| `r1.5` | 2026-10-08 | Fix: a reopened show file saved only its first change; “Keep mine” failed |
| `r1.6` | 2026-10-08 | Fixes from the first rehearsals: boards in two columns (8 per page), board names under the drawing, board grid, moving a cue by dragging its tag. Built; committed on branch r1.6, not yet tagged; not yet tried on the laptop |

Rule for every release: change `src/`, set `VERSION`, run `python3 build.py`, run `sh test/run.sh` with every check passing, add the `CHANGELOG.md` entry, commit, tag. The built file is committed so that checking out a tag gives a usable tool. The version shows on the start screen.

Going back: check out the older tag and open its `promptbook.html`. Show folders are forward compatible (an older show opens in a newer release); the changelog says when the reverse does not hold. r1.0 is the first such case: a show that uses cue ends or templates should not be edited with r0.1.

The repository was created in the build session, which is temporary. Where it lives permanently is SPEC Q27.
