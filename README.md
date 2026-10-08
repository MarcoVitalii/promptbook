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
| `test/` | Browser checks (Playwright, Chromium). `test/unit/` holds the checks that need no browser. |
| `scripts/` | `check.sh` builds and tests; `hooks/` are run by Claude Code, `githooks/` by git. |
| `package.json` | Development tools only, pinned. The tool itself has no dependencies. |

## Setting up a machine

Needs Python 3 and Node 24 (the version is in `.node-version`; `fnm use` reads it).

```sh
npm run setup                               # pinned Playwright, its Chromium, the git pre-commit hook
sudo npx playwright install-deps chromium   # once per machine: system libraries Chromium needs
```

## Checking a change

```sh
npm run check:fast   # build + syntax + test/unit, under a second
npm run check        # the above + the browser checks, about 25 s
npm test             # the same, even when nothing changed
```

`check` does nothing when no source or test has changed since the last green run. Failures print in a few lines; `test/KNOWN_FAILING` lists test files that fail for a known reason.

## Making a release

1. Change `src/`, set `VERSION` in `src/core.js`.
2. `npm test` — builds `promptbook.html` and runs every check; all must pass.
3. Add the entry to `CHANGELOG.md`, commit, tag (`r1.0`, `r1.1`, …).

The file a show uses is whatever `promptbook.html` it opens. To go back, check out an older tag and use that file; show folders written by a newer release stay readable by older ones unless the changelog says otherwise.
