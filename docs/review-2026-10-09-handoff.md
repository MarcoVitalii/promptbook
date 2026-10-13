# Review of 2026-10-09: state of the fixes, 2026-10-13

Hand-off note for whoever continues. Branch `fix/review-2026-10-09`, cut from `origin/main` at `c25f066`, eleven commits, **not pushed, no pull request**. Each finding was fixed by a subagent in its own worktree and cherry-picked here.

**Checks on the branch head (`4637064`):** `sh scripts/check.sh full --force` passes: 237 unit checks in 10 files, 764 browser checks in 19 files. Nothing was tried on the laptop, on paper or on a phone.

## 1. Done and merged

| Finding | Commit | What changed |
|---|---|---|
| X1, X5 | `6c0f7b5` | Each board has its own file, found by the name written inside it (`sala-a.json`, `sala-a-2.json`). A rename is one undo step with its drawing. BRD-29, BRD-30 |
| X2 | `bf0464f` | An unreadable settings, ink, board or template file raises a banner; nothing is saved until the user chooses; the bytes are kept under `damaged/`. STO-18 to STO-20 |
| X7 | `1259c93` | `config.json` carries `release: { made, needs }`; a show that needs a newer tool opens with a warning; unknown department and show-mode fields survive a save. `READABLE_FROM = 'r1.10'`. STO-15 to STO-17 |
| X8 | `202a5be` | `imageData` only as `data:image/`; a Content-Security-Policy in both built files. STO-21, STO-22 |
| X10 | `cecebc5` | Zip and file messages from `STR`; a failed save says why once; CSV headers translated; four unused strings deleted. Unit checks: every key used, no literal `new Error` |
| X11 | `4637064` | A draft cut for quota says so; a template with no file is named and its name kept; a long character list runs on to further pages. STO-30, STO-31, PAG-8 |
| X12 | `44ff42d` | The cue list marks a number out of order with ↕. CUE-5, CUE-37 |
| X13, T2, T7 | `3c0d193` | Full OFL text in `promptbook.html`; stale header, sizes and versions corrected; `test/_pw.js` removed. `tasks/` and `.cache/all.js` deleted by hand |
| T5 (retry only) | `aa1145c` | A file that passes only on its second run is named in the totals and in the CI summary |
| T8 | `382c2fa` | Object URLs of board images are reused and revoked; IndexedDB connections are closed. `test/leaks.test.js` |

## 2. T6: stopped, not merged

The agent for T6 (CRC check on read, negative tests for the zip and git readers) was stopped before it reported. Its work is saved as a WIP commit and has not been reviewed.

- **Where:** commit `e60f63b` on branch `worktree-agent-a7c424223acbb3ea7`, worktree `.claude/worktrees/agent-a7c424223acbb3ea7`.
- **Base:** `202a5be`, three merges behind this branch (board names, leaks, quiet losses). Expect conflicts in `loadStore` in `src/io.js`.
- **Content:** `src/io.js` +85 −40 across `readZip`, `buildZip`, `loadStore`, `init` and thirteen git functions (`gGet`, `gPut`, `gHead`, `gRefs`, `gLog`, `gFiles`, `gCommitOf`, `gText`, `gSave`, `gCheckout`, `histState`, `histRestore`, `histSwitch`, `openHistory`, `openDiff`); four new strings (`zipCrypt`, `zipEmpty`, `hiBad`, `hiCut`); new `test/damaged.test.js` (390 lines, 54 checks).
- **What was measured in that worktree:** the fast check passes, and `damaged`, `zipshow` and `history` pass together (211 checks). The full suite was not run there.
- **Missing:** no spec rows in `docs/specs/07-storage.md` or `08-history.md`; no report, so the design choices (refuse the file or use `damaged/`; when the CRC is checked; the cost on a large show file) are not stated anywhere. The diff is wide for a hardening change and should be read line by line before it is merged.

## 3. Still to do on this branch

1. **Review and merge T6**, or redo it from the brief with a smaller scope.
2. **`pruneImages` race** (found by the T8 agent, older than this work, not fixed): it lists the files after an `await`, so an image added to a board while a save is running can be pruned before a board file names it, and the image is lost on disk.
3. **Documents not yet written:**
   - `CHANGELOG.md`: the r1.11 entry needs a line per fix and the compatibility notes (each agent's report gave one; the gist is in section 1).
   - `docs/review-2026-10-09.md`: mark each finding closed or open.
   - `PLAN.md`: action 2, the backlog line "From the review", and the risk rows that cite X1, X2 and X7.
   - `docs/verification.md` §3: new files `unit/cue-order`, `unit/compat`, `unit/images`, `leaks`, and the new counts.
   - `SPEC.md` §6: the r1.11 row.
   - `CLAUDE.md`: the line counts in the file table are far off (`core.js` is over 1,500 lines, listed as ~1190).
4. **Requirement IDs:** STO-23 to STO-29 are unused; X11 was given STO-30 and STO-31 to leave room for T6. Close the gap or keep it once T6 is settled.
5. **Worktrees:** eleven under `.claude/worktrees/` hold commits already cherry-picked here and can be removed; keep `agent-a7c424223acbb3ea7` until T6 is settled.

## 4. Decisions waiting for the owner

- **X1:** look-alike board names ("Sala A", "sala-a") are still accepted as two boards, each with its own file; only an exact duplicate is refused. A refusal by file name would reject every non-Latin name after the first.
- **X2:** in show mode the damaged-file banner is hidden by existing CSS, so saves are held with no visible question. With `config.json` unreadable, "Go on without" leaves the templates unlisted.
- **X2 with X1 (changed while merging):** an unreadable drawing in `boards/` is reported even when no board of the script uses it.
- **X8:** a department or ink colour written as `url(http://…)` is stopped only by the policy, not cleaned on read. The published page will probably log a blocked `/favicon.ico` request.
- **X10:** with the interface in Italian the CSV headers change from Act/Scene to Atto/Scena.
- **X11:** leaving the page now asks when a draft could not be saved; "Forget these names" is new and not undoable.
- **X12:** order is judged per act and department; `12.15` between `12.1` and `12.2` is marked. Marked `[ASSUMED]` in CUE-5.
- **X7:** board, template and ink files still drop fields they do not know.
- **X13:** a reading of the licence, not legal advice.

## 5. Not acted on

- **X3, T3:** `r1.7` and `r1.10` have no tag.
- **X4, X6:** need the laptop.
- **X9, T1, T4:** already closed.
- **T9, F1 to F10:** not requested.
- **Rest of T5:** tests reading internal state, mixed-area files, no test naming its requirement.
- `docs/architecture.md` still describes r1.7; no release step mentions the `package.json` version.
