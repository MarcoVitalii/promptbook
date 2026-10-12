# Contributing

Promptbook is a small tool with a short list of rules. Reading this page is enough to send a change.

## What to know first

- The tool is one HTML file with no runtime dependencies: plain JavaScript, no libraries, no bundler, no network. A change that needs a library at runtime will not be merged (`SPEC.md`, constraint C1).
- `promptbook.html` and `promptbook-cast.html` are built from `src/` by `build.py`. They are not in the repository: never edit them, never commit them.
- A show written by an older release must still open. An exception is stated under "Compatibility" in `CHANGELOG.md`.
- Every text the user reads is in `STR` at the top of `src/core.js`, in English and in Italian. Add both.

`CLAUDE.md` is the map of the code: which file holds what, and the rules that are easy to break. It is written for Claude Code and reads just as well for a person.

## Setting up

Needs Python 3 and Node 24 (the version is in `.node-version`; `fnm use` reads it).

```sh
npm run setup                               # pinned tools, Chromium for the checks, the git pre-commit hook
sudo npx playwright install-deps chromium   # once per machine: system libraries Chromium needs
npm run build                               # writes promptbook.html: open it in Chrome or Edge
```

## Making a change

1. **Open an issue first** for anything larger than a fix, so the request is recorded in the words of whoever asked.
2. **Branch from `main`.** Nobody pushes to `main` directly.
3. **A change in behaviour starts in the specification.** In the capability file under `docs/specs/`: quote the request under Intent, add or change the requirement rows (never renumber an ID), write the consequences. Then the code.
4. **Add checks.** New behaviour gets checks in the test file for its area: `test/unit/` when no browser is needed, `test/<area>.test.js` otherwise. A check is `ok(condition, 'sentence stating the behaviour')`.
5. **Run the checks.**

   ```sh
   npm run check:fast   # build + syntax + test/unit, under a second
   npm run check        # the above + the browser checks, about 25 s
   ```

6. **Add a line to `CHANGELOG.md`** under the release that is not yet released, written for the person who uses the tool.
7. **Open a pull request.** CI builds the tool and runs every check. The built `promptbook.html` of the pull request can be downloaded from the run ("Artifacts" → `promptbook`) to try the change by hand.

What a simulated browser cannot show (a real pen, a real phone, a real rehearsal) is said in the pull request, and ends up in `docs/verification.md`.

## Style

Write code that reads like the code around it: same density of comments, same naming. The three JavaScript files share one scope and are joined in a fixed order; there are no modules. Sections are marked `/* ---------- name ---------- */`.

## Releasing (maintainers)

1. Set `VERSION` in `src/core.js`. Give the `CHANGELOG.md` entry its date in place of "not yet released". Update the capability file, the release table in `SPEC.md` §6 and the record in `docs/verification.md` §3.
2. `npm test`: all pass. Merge to `main`.
3. Tag that commit and push the tag:

   ```sh
   git tag r1.11
   git push origin r1.11
   ```

The tag starts the release workflow (`.github/workflows/release.yml`). It refuses a tag that is not the `VERSION` or whose changelog entry is missing or undated, runs every check, then:

- creates the GitHub release with `promptbook.html` and `promptbook-cast.html` attached and the changelog entry as its notes;
- publishes the same two files and the documents to GitHub Pages (`npm run site` builds the same pages in `_site/` to look at them first).

## Licence

Contributions are accepted under the MIT licence of the project (`LICENSE`). The embedded font, Inter, has its own licence in `fonts/OFL.txt`.
