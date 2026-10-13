# History, variants and changes — HIS

**Covers:** revisions of a show, variants for venues, restoring, the list of changes between two revisions and what reaches each character.
**Code:** `src/io.js` (HISTORY: `gGet`, `gHead`, `gLog`, `gPut`, `gTree`, `gSave`, `gCheckout`, `histSave`, `histVariant`, `histSwitch`, `histRestore`, `openHistory`, `openDiff`), `src/core.js` (compare: `lcs`, `diffBlocks`, `diffWords`, `diffFor`, `diffNames`).
**Checks:** `test/history`, `test/damaged`, `test/unit/compare`.
**Columns and tags:** explained in `SPEC.md`, "How to read this specification". Locked page numbers are in `06-pages-print.md`.

---

## 1. Intent

Request, as received on 2026-10-09: "git versioning below with tags for meaningful moments (revisions, branches for specific shows) with support to lock pages and reprint for rehearsals. Assume that actors will manage their notes on their own. I'd need to produce new pages, and a simple diff like github to align actors on what affects them."

Three needs are in it:

1. **Meaningful moments can be named and returned to.** "Rehearsal 12 October" is a state of the whole show, not of the text alone.
2. **One show, several versions.** A theatre with other lights, a contest that needs a shorter running time: each keeps its own text, cues and boards.
3. **Each actor is told what changed for them**, and only that.

The request names git, tags and branches. The intent is read as: use git's own format, so that what the tool writes is a repository git can read, and nothing has to be invented or installed (C1).

A review of the code (`docs/review-2026-10-09.md`, T6) found that "the git reader assumes well-formed objects". The rule asked for: a damaged history never stops the show from opening or the script from being saved, never loops or throws uncaught, and is reported in words (HIS-13 to HIS-15).

## 2. Requirements

| ID | Requirement | Basis | Since | Checked by |
|---|---|---|---|---|
| HIS-1 | The history is a git repository in `.git`, inside the show file. It is written by the tool itself: loose objects (zlib), refs, `HEAD`, a minimal `config`. No index, no packs. git accepts it (`git fsck`, `git log`, `git diff`). | `[LOCKED]` by the request; the subset of git `[ASSUMED]` | r1.7 | history |
| HIS-2 | A revision is a commit of every show file (`script.md`, `script.ink.json`, `config.json`, `boards/`, `templates/`) plus a lightweight tag. The typed name is the commit message; the tag is the name made safe for a ref (`Prova-1`, then `Prova-1-2`). A revision is saved only on request ("Save revision"). | `[ASSUMED]` | r1.7 | history |
| HIS-3 | A variant is a branch, `main` first. "New variant" points a new branch at the show as it is now and moves `HEAD` to it. Picking another variant checks out its last commit. Each variant has its own text, cues, boards and revisions. | branches `[LOCKED]` | r1.7 | history |
| HIS-4 | There is no merge in the tool: a change made in one variant does not reach the others. A correction every variant needs is made in each, or merged with git. | D15; `[ASSUMED]` | r1.7 | — |
| HIS-5 | Nothing is lost: before a restore or a change of variant, the show is committed on the current branch as "Before going to …" when it differs from the last commit. | `[ASSUMED]` | r1.7 | history |
| HIS-6 | "Restore" replaces the show files with those of a commit and reloads: text, cues, ink, boards, templates and settings. `HEAD` stays on the branch. | `[ASSUMED]` | r1.7 | history |
| HIS-7 | Menu → "History…" shows: the variant and "New variant"; the state of the page lock; "Save revision" with a name and "Lock page numbers here"; every revision with its date, "Changes" and "Restore". A show that is not on disk has no history, and says why. | as built | r1.7 | history |
| HIS-8 | Changes are computed block by block (the longest common run of unchanged blocks, then pairs that share half their words) and word by word inside a changed block. Kinds: added, cut, changed, cues only. | `[ASSUMED]` | r1.7 | unit/compare, history |
| HIS-9 | What reaches a character: text changes in a speech they speak (joined names included), in an action that spells their name in capitals, and in the speech just before one of theirs in the same scene, marked "the line before yours". Cue-only changes and comments are left out. | `[ASSUMED]` | r1.7 | unit/compare, history |
| HIS-10 | "Changes" beside a revision compares it with the show now; any two revisions can be chosen. Lines are shown as on GitHub: cut words struck through in red, new words underlined in green, grouped by act and scene, with the page where known. "Show" narrows the list: "Text" leaves out cue changes; "Everything, cues too" includes them; a character's name shows what reaches that actor, with the count beside the name. The characters offered are those of the character list or, without one, every single speaker. "Print" prints the list as shown, for example one sheet per actor. | request `[LOCKED]`; presentation `[ASSUMED]` | r1.7 | history, unit/compare |
| HIS-11 | For those who use git: unzip the show, run `git reset` once (the tool writes no index), then `git log`, `git diff main Teatro-Verdi`, `git merge` or `git push` work as usual. Zip the folder again, `.git` included, to open the result in the tool. | as built | r1.7 | history |
| HIS-12 | The tool reads loose objects only. History that git has packed (`git gc`, a clone) cannot be read until it is unpacked (`git unpack-objects`); the tool says so. | subset of git `[ASSUMED]` | r1.7 | — |
| HIS-13 | A damaged history never stops the show: the show file opens whole and with no question, and changes to the script are saved, whatever `HEAD`, a branch or an object of the history holds. | review T6 | r1.11 | damaged |
| HIS-14 | An object of the history is used only when it is whole: it unpacks, states its kind and its length, is of the kind its place asks for (a commit names a tree, a tree lists files and trees), and its SHA-1 is the name it is kept under, which is the check git makes. Anything else is said in words, with the first letters of the object's name: "Part of this history is damaged and cannot be read (1a2b3c4). The show itself is not touched." The History box lists the revisions it can reach from the last one back and, where it has to stop, says "Earlier revisions cannot be shown" and why; it does not say "No revision yet". | review T6 | r1.11 | damaged |
| HIS-15 | "Restore", "Changes" and a change of variant that meet a damaged part end at once with that message and change nothing: the show, its files and `HEAD` are as they were, and no "Before going to …" revision is made (HIS-5 applies only when the move takes place). A new revision can always be saved on top of a damaged history; saving writes again any object that is missing or damaged and that the show as it is still holds. A file of the history whose bytes fail the check of the archive is set aside with the other damaged parts (STO-24). | review T6 | r1.11 | damaged |

## 3. Consequences

**D10 is amended a second time.** In r1.2 the show became one zip and git no longer saw the individual files. In r1.7 git is inside the show and sees them again.

**A revision is the whole show.** Restoring or changing variant replaces the ink and the boards too, with those of that revision. There is no way to bring back only the text of an old revision.

**No merge (D15).** A fix that all variants need is typed once per variant. For more, git itself is the tool: the repository is real, so `git merge` works on the unzipped show.

**The history travels with the show, and makes it grow.** Every revision adds a compressed copy of each file that changed since the last one; the ink file changes with every stroke, so it is stored again in every revision. Nothing is ever packed or removed. Because a show file is rewritten whole on every save (`07-storage.md`), the history is rewritten with it (`docs/review-2026-10-09.md`, X6).

**A lock belongs to a variant.** It is stored in `config.json`, which is committed with the rest. Going back to a variant brings back its locked pages; a new variant starts with the lock of the show it was made from.

**"What reaches a character" is a reading of the text, not of the staging.** It finds names: who speaks, whose name an action spells in capitals, whose line follows. A change to a scene an actor is in but silent through does not reach them. Names after `ALL BUT` are not resolved.

**Changes compare words, pages compare breaks.** A block whose words are the same and whose cues moved is "cues only" in Changes and does not mark its page as changed (PAG-16).

**Author and time.** Every commit is written as `Promptbook <promptbook@localhost>` with the laptop's clock and time zone. Who made a revision is not recorded.

**Compatibility.** A show written by r1.6 opens unchanged and has no history until the first revision is saved. r1.6 opens a show written by r1.7 and keeps its history when it saves a show file, but shows plain page numbers, has no History menu, and drops the history when a show folder is saved as a show file.

**A damaged history is reported, not repaired (HIS-14).** The tool reads what is whole and says what is not; it does not guess. Nothing in the history is deleted or rewritten, except that an object is written again when the show as it is now gives exactly that object (HIS-15): a revision that lost the copy of a file that has not changed since becomes whole again at the next revision saved. A lost object that nothing gives again stays lost: the revisions that need it are listed when their own record can be read, and "Restore" and "Changes" on them say what is missing. Because every name is checked against the content, a tree or a commit cannot lead back to itself, so reading always ends.

**When `HEAD` or the branch it names cannot be read, the next revision starts again from there.** If the branch names a commit that is missing or damaged, the new revision keeps it as its parent, so the chain is whole again once the object is put back. If `HEAD` itself is lost or is not a name the tool can follow (anything outside `refs/`), the new revision has no parent and `HEAD` names it directly; the branches and their revisions are still in the show file, are listed as variants, and can be reached with git. The tool does not choose a branch on the user's behalf.

**The order of a restore changed with this (HIS-15).** Until r1.10 the "Before going to …" revision was made, and for a change of variant `HEAD` was moved, before the revision to go to was read; when that failed, the show was left on the new variant with the files of the old one. The revision is now read whole first.

**What the checks cost.** Every object read is unpacked and its SHA-1 computed. Measured on 2026-10-13 in headless Chromium on the development machine, on a show of 100 MB (ten images of 10 MB): the first revision saved after the show is opened takes 5.6 s, of which 1.4 s is the check of the objects already there (4.2 s without it); a further revision in the same sitting takes 1.6 s, as before, because unchanged files are not looked at again; a restore takes about 4 s, with no difference that could be measured. Opening the History box reads commits only and is not slowed. Not measured on the laptop.

**Not built:** merging a correction into several variants inside the tool; reading packed git objects; repairing a damaged history (git itself can: `git fsck` names what is lost); a read-only view of an old revision; history for a show kept only in the browser; deleting or renaming a revision or a variant.

**Not verified (HIS-13 to HIS-15):** a history damaged by a real disk; the checks damage, one at a time, the objects, branches and `HEAD` of a history the tool wrote. A history written by git itself with damaged parts was not tried.

**Not verified:** the history was read back with git itself in the checks. Not tried on the laptop: the real file dialogs, a show file with a long history, the printed change lists. The rows marked `[ASSUMED]` above have not been confirmed by the client.
