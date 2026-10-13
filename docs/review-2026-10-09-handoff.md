# Review of 2026-10-09: what is still open, 2026-10-13

Branch `fix/review-2026-10-09`, cut from `origin/main` at `c25f066`. **Not pushed, no pull request, no tag.** What each fix changed is in `CHANGELOG.md` (r1.11), and the state of every finding is in the last column of the tables of `docs/review-2026-10-09.md`.

**Checks on the branch:** `sh scripts/check.sh full --force` passes: 237 unit checks in 10 files, 900 browser checks in 20 files. In one run of four on 2026-10-13, `test/misc.test.js` passed only on its second run ("long press opens the text editor"); alone it passed four times of four. Nothing was tried on the laptop, on paper or on a phone.

## 1. To do before r1.11 is released

1. Decide the points of section 2.
2. Push the branch and merge it through a pull request.
3. Give the r1.11 entry of `CHANGELOG.md` its date, then tag (`CLAUDE.md`, "Release"). `VERSION` is already `r1.11`.
4. Worktrees: the eleven under `.claude/worktrees/` were left in place. The previous note recorded that their commits were cherry-picked here (not checked again); the one kept for T6, `agent-a7c424223acbb3ea7` (`e60f63b`), is settled: what was kept of it is `962aa2f`. They and their branches can be removed.

## 2. Decisions waiting for the owner

- **X1:** look-alike board names ("Sala A", "sala-a") are still accepted as two boards, each with its own file; only an exact duplicate is refused. A refusal by file name would reject every non-Latin name after the first.
- **X2:** in show mode the damaged-file banner is hidden by existing CSS, so saves are held with no visible question. With `config.json` unreadable, "Go on without" leaves the templates unlisted.
- **X2 with X1 (changed while merging):** an unreadable drawing in `boards/` is reported even when no board of the script uses it.
- **X8:** a department or ink colour written as `url(http://…)` is stopped only by the policy, not cleaned on read. The published page will probably log a blocked `/favicon.ico` request.
- **X10:** with the interface in Italian the CSV headers change from Act/Scene to Atto/Scena.
- **X11:** leaving the page now asks when a draft could not be saved; "Forget these names" is new and not undoable.
- **X12:** order is judged per act and department; `12.15` between `12.1` and `12.2` is marked. Marked `[ASSUMED]` in CUE-5.
- **X7:** board, template and ink files still drop fields they do not know.
- **X13:** a reading of the licence, not legal advice.

Added by the work on the damaged show file (T6, `962aa2f`; `docs/specs/07-storage.md` §3 and `docs/specs/08-history.md` §3 say why each is as it is):

- **A zip with a part protected by a password is refused.** Until r1.10 it opened without that part, which the next save then dropped. Stated under "Compatibility".
- **A show file is refused when the name of a part in the index of the zip differs from the name in front of its bytes.** Every zip writer known writes the two alike; one that does not would be refused. Only archives written by the tool and by Python's `zipfile` were tried, none from Explorer, Finder or 7-Zip.
- **The damaged-file banner now also comes for the script, an image and the history** (named once, as `.git`), so the point about show mode above weighs more.
- **When `HEAD` of the history is lost or unreadable, the next revision starts with no parent and `HEAD` names it directly**; the branches stay in the show file and are listed as variants. The tool does not pick a branch by itself.
- **The check costs time on a large show:** on a show file of 100 MB, about 0.65 s more at every opening, and 1.4 s more on the first revision saved after opening. Measured in headless Chromium on the development machine, not on the laptop.
- **An archive with no entry still opens as a show with nothing in it.** The stopped work refused it; that was not kept, because nothing can be lost there and a zip made empty by another program opened before.

## 3. Not acted on

- **X3, T3:** `r1.7` and `r1.10` have no tag.
- **X4, X6:** need the laptop.
- **T9, F1 to F10:** not requested.
- **Rest of T5:** tests reading internal state, mixed-area files, no test naming its requirement.
- `docs/architecture.md` still describes r1.7; no release step mentions the `package.json` version.
- `SPEC.md` §6 says "Not committed yet" for r1.10; not looked into.
