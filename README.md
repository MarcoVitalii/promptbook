# Promptbook

[![CI](https://github.com/MarcoVitalii/promptbook/actions/workflows/ci.yml/badge.svg)](https://github.com/MarcoVitalii/promptbook/actions/workflows/ci.yml)
[![Latest release](https://img.shields.io/github/v/release/MarcoVitalii/promptbook)](https://github.com/MarcoVitalii/promptbook/releases/latest)
[![Licence: MIT](https://img.shields.io/badge/licence-MIT-blue)](LICENSE)

A prompt book in one HTML file: script, cues, ink and blocking boards, with generated cue lists and print. No install, no server, no libraries.

- **Use it:** open <https://marcovitalii.github.io/promptbook/> in Chrome or Edge, or download `promptbook.html` from the [latest release](https://github.com/MarcoVitalii/promptbook/releases/latest) and open it from disk; it needs no network. A show is one `.zip` file: start from the sample or pasted text, then Menu → “Save as show file…”. Copy that file to move the show.
- **Learn it:** `docs/guide/index.md`: a tutorial, how-to guides for the stage manager and the author (taking in a rewrite, revisions, changed pages, the cast file, calling a show), explanations of why it works as it does, and a reference. Also in Italian: `docs/guide/it/index.md`.
- **For the actors:** `promptbook-cast.html`, from the same places. "Send to cast…" in the tool writes a copy with a show inside.
- **What it is meant to do, and why:** `SPEC.md`, then one file per capability in `docs/specs/`. **How it is built:** `docs/architecture.md`. **What changed:** `CHANGELOG.md`. The same documents are [on the site](https://marcovitalii.github.io/promptbook/).
- **Pitch in:** `CONTRIBUTING.md`.

## Documents

There are two sets. `docs/guide/` is for whoever uses the tool, arranged as [Diátaxis](https://diataxis.fr/) asks: a tutorial to learn by doing, how-to guides for a task at hand, explanations to understand, a reference to look things up. The rest is for whoever builds it, and is specification-driven. Every level answers three questions in the same order: intent (why, in the client's words), requirements (what must hold, one ID each), consequences (the design that follows, its cost, what is not built and what was never verified).

| Path | What |
|---|---|
| `docs/guide/index.md` | Using the tool: where to start, by what you need |
| `docs/guide/tutorial.md` | A first show, start to finish, with the sample scene |
| `docs/guide/how-to/01` … `12` | One task each: start a show, find your way, cue it, take in a rewrite, mark a moment, reissue changed pages, tell actors what changed, keep a variant, send to the cast, time the show, call a show, move and back up |
| `docs/guide/explanation/01` … `05` | Why: one text and its many readers, what survives a rewrite, revisions and variants and locks, the cast script, show mode as a clock |
| `docs/guide/reference.md` | Script forms, cue forms, keys, Menu, Review, the show file, glossary |
| `docs/guide/it/` | The same guide in Italian, file for file. On the site every guide page has a language selector. |
| `SPEC.md` | Entry point: goals, constraints, assumptions, open questions, releases |
| `docs/specs/01` … `11` | Script text, cues, ink, boards, input, pages and print, storage, history, workbench, cast, show mode |
| `docs/decisions.md` | Every decision and conflict, with its source and its consequences |
| `docs/architecture.md` | C4 diagrams: system context, containers, components; how a change travels |
| `docs/verification.md` | What was checked and how; what never was |
| `CHANGELOG.md` | One entry per release, written for the user |
| `CONTRIBUTING.md` | Setting up, sending a change, making a release |

## Layout of this repository

| Path | What |
|---|---|
| `src/` | Source: `core.js` (parse, layout), `view.js` (rendering, input), `io.js` (storage, dialogs), `style.css`, `index.html`; for the actors `cast.js`, `cast.css`, `cast.html` |
| `fonts/` | Inter, Latin subset, SIL Open Font License 1.1 (`fonts/OFL.txt`) |
| `build.py` | Joins `src/` and `fonts/` into `promptbook.html` and `promptbook-cast.html`. Needs Python 3 only. |
| `promptbook.html`, `promptbook-cast.html` | The release. Built, not in the repository: every [release](https://github.com/MarcoVitalii/promptbook/releases) carries the two files. |
| `test/` | Browser checks (Playwright, Chromium). `test/unit/` holds the checks that need no browser. |
| `scripts/` | `check.sh` builds and tests; `site.js` builds the static site; `release-notes.sh` reads a release out of the changelog; `hooks/` are run by Claude Code, `githooks/` by git. |
| `.github/` | CI and release workflows, issue and pull request templates, Dependabot. |
| `package.json` | Development tools only, pinned. The tool itself has no dependencies. |

## Setting up a machine

Needs Python 3 and Node 24 (the version is in `.node-version`; `fnm use` reads it).

```sh
npm run setup                               # pinned tools, Chromium for the checks, the git pre-commit hook
sudo npx playwright install-deps chromium   # once per machine: system libraries Chromium needs
npm run build                               # writes promptbook.html and promptbook-cast.html
```

## Checking a change

```sh
npm run check:fast   # build + syntax + test/unit, under a second
npm run check        # the above + the browser checks, about 75 s
npm test             # the same, even when nothing changed
npm run site         # the documents and the built files as a site, in _site/
```

`check` does nothing when no source or test has changed since the last green run. Failures print in a few lines; `test/KNOWN_FAILING` lists test files that fail for a known reason. CI runs `npm test` on every pull request and every push to `main`.

## Making a release

1. Change `src/`, set `VERSION` in `src/core.js`.
2. `npm test` — builds `promptbook.html` and runs every check; all must pass.
3. Add the dated entry to `CHANGELOG.md`; update the capability file in `docs/specs/`, `SPEC.md` §6 and `docs/verification.md` §3; merge to `main`.
4. Tag that commit (`r1.11`, then `r1.12`, …) and push the tag. The release workflow checks once more, attaches the two built files to a GitHub release and publishes them, with the documents, on the site.

The file a show uses is whatever `promptbook.html` it opens. To go back, download that file from an older release. A show written by a newer release is readable by an older one only where `docs/specs/07-storage.md` §2.4 says so; the show itself names the oldest release that reads it.

## Licence

MIT, see `LICENSE`. The embedded font is Inter, under the SIL Open Font License 1.1 (`fonts/OFL.txt`).
