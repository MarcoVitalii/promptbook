# Promptbook

A prompt book in one HTML file: script, cues, ink and blocking boards, with generated cue lists and print. No install, no server, no libraries.

- **Use it:** open `promptbook.html` in Chrome or Edge. A show is one `.zip` file: start from the sample or pasted text, then Menu → “Save as show file…”. Copy that file to move the show. Older show folders still open (Menu → “Open older show folder…”) and can be converted with “Save as show file…”.
- **What it is meant to do:** `SPEC.md`. **What is planned:** `PLAN.md`. **What changed:** `CHANGELOG.md`.

## Layout of this repository

| Path | What |
|---|---|
| `promptbook.html` | The release. Built file, committed so every tag carries a usable tool. |
| `src/` | Source: `core.js` (parse, layout), `view.js` (rendering, input), `io.js` (storage, dialogs), `style.css`, `index.html` |
| `fonts/` | Inter, Latin subset, SIL Open Font License 1.1 |
| `build.py` | Joins `src/` and `fonts/` into `promptbook.html`. Needs Python 3 only. |
| `test/` | Browser checks. `sh test/run.sh` needs Node and Playwright with Chromium. |

## Making a release

1. Change `src/`, set `VERSION` in `src/core.js`.
2. `python3 build.py`
3. `sh test/run.sh` — all checks must pass.
4. Add the entry to `CHANGELOG.md`, commit, tag (`r1.0`, `r1.1`, …).

The file a show uses is whatever `promptbook.html` it opens. To go back, check out an older tag and use that file; show folders written by a newer release stay readable by older ones unless the changelog says otherwise.
