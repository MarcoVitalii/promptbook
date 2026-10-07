# Script syntax: current format vs Fountain vs Downstage

**Date:** 2026-10-07 — reviewed against `SPEC.md` v0.8 (§5.2, §5.3, §5.5, §5.11) and the parser in `src/core.js`.
**Compared with:** Fountain 1.1 (fountain.io/syntax) and the Downstage language spec (github.com/jscaltreto/downstage, `SPEC.md`).
**Method:** desk review. No script was run through a Fountain or Downstage tool, and nothing in the app was changed.

> **Update, r1.1 (2026-10-07):** the native format now has a frontmatter block with title, author and other details, and a character list with aliases and descriptions, printed on its own page and used to check speeches (`SPEC.md` §5.12). Rows 1–4 below and the table in §3 describe r1.0.

## 1. Verdict

- The current format is a **superset on the stage-management side** (cues, cue ends, boards, n-way simultaneous speech) and a **subset on the writing side** (no title, author, character list, aliases, emphasis, comments or manual page break).
- Neither standard can carry the prompt-book data. Cues, ends and boards have no equivalent in Fountain or Downstage, so switching the native format would not remove the custom syntax; it would only move it.
- **Recommendation:** keep the native format (D3 stays), borrow three writing features from the standards (header, character list with aliases, comments), and add a one-way export to Downstage and Fountain. This closes most of the gap in a few days of work. Switching the native format is a week or more and puts existing ink at risk.

Fountain is a de facto standard, but for screenplays. Downstage is built for the stage and is the closer fit, but it is a young single-maintainer project (MIT licence, 4 GitHub stars, one breaking spec revision already), so "open format" describes it better than "standard".

## 2. The same passage in the three formats

Current (`script.md`):

```
# ATTO PRIMO
## Scena 1

(Buio. Si sente il mare.)

ANNA: Chi è là? {LX 12 | blackout} (si volta) Rispondi!
MARCO: Sono io.
& ANNA: Non ti credo!
```

Downstage (`.ds`):

```
# Il mare
Author: Marco Vitali

## Dramatis Personae

ANNA/A - la figlia
MARCO/M - il pescatore

## ACT I

### SCENE 1

> Buio. Si sente il mare.

ANNA
Chi è là? (si volta) Rispondi!

MARCO
Sono io.

ANNA ^
Non ti credo!
```

Fountain (`.fountain`):

```
Title: Il mare
Author: Marco Vitali

# ATTO PRIMO

.SCENA 1

Buio. Si sente il mare.

ANNA
Chi è là? [[LX 12 | blackout]]
(si volta)
Rispondi!

MARCO
Sono io.

ANNA ^
Non ti credo!
```

The cue survives only in Fountain, and only as a note. Nine lines become roughly twenty in either standard.

## 3. Title, author, dramatis personae, aliases

| | Current | Fountain | Downstage |
|---|---|---|---|
| **Title** | Not in the script. Typed in Settings, stored in `config.json` (`title`). | `Title: …` in the title page block at the top of the file. | `# Title` as the first heading. |
| **Author** | Not supported anywhere. | `Author:` (or `Authors:`), plus `Credit`, `Source`, `Draft date`, `Contact`. | `Author:` under the title, plus `Subtitle`, `Date`, `Draft`, `Copyright`, `Contact`, `Notes` and any other `Key: Value`. |
| **Dramatis personae** | Not supported. The Review panel lists the names it found with a count, but that list is derived, not written. | Not supported. Writers type it as plain action text. | `## Dramatis Personae`, one `NAME - Description` per line, `###` headings for groups. |
| **Aliases** | Not supported. Every speech needs the full name. | Not supported. | `JAMES/JIM - description`; a `JIM` cue then resolves to `JAMES`. |
| **Unknown-name check** | Indirect: a name with count 1 in the Review panel. | None. | Editor warning for a cue that is not in the list. |

Three traps in the current parser if someone types these today:

- `TITOLO: Il mare` or `AUTORE: Marco Vitali` is read as a **speech** by a character called TITOLO or AUTORE (all-caps word before a colon).
- `Titolo: Il mare` (mixed case) is not a speech, so it lands in the Review panel as an unclassified line.
- `# Il mare` is read as an **act** heading and starts a new page.

Also: `/` is already accepted inside a speaker name (`ANNA/MARCO:` is one group speaker), which is the character Downstage uses for aliases. The two meanings are in different places (speech line vs character list), so they can coexist, but an import must not mix them up.

## 4. Feature differences and gap to onboard

**Diff** is from the current format's point of view: *Added* = we have it, the standards do not; *Missing* = they have it, we do not; *Different* = both have it, written differently.
**Gap** is the work to meet the standard for that feature. S = under a day, M = one to three days, L = a week or more. These are my estimates, not measured.

| # | Feature | Current | Fountain | Downstage | Diff | Gap to onboard |
|---|---|---|---|---|---|---|
| 1 | Title | `config.json` only | `Title:` key | `# Title` | Missing in text | **S.** Read a header block at the top of `script.md`. Decide whether it or `config.json` wins. |
| 2 | Author, draft, date, contact | None | Title page keys | Metadata keys, open-ended | Missing | **S.** Same header block. Needs a title page in print to be useful. |
| 3 | Dramatis personae | None | None | Section with descriptions and groups | Missing | **M.** New block type, a printed page, and the Review panel checking speeches against it. |
| 4 | Aliases | None | None | `NAME/ALIAS` in the list | Missing | **M.** Depends on 3. Resolve at parse time; show the full name in the name column. |
| 5 | Acts and scenes | `#`, `##`, or a bare line starting `ATTO`, `SCENA`, `PROLOGO`… (IT and EN) | `#` sections (not printed), or forced scene heading `.TEXT` | `## ACT I`, `### SCENE 1`; the word must be `ACT` / `SCENE` | Different | **S** to export (shift one level). Italian headings are not recognised as acts by Downstage; they become generic sections. |
| 6 | Speech | `NAME: text` on one line | Name alone on a line, blank line before, text below | Same as Fountain | Different | **S** to export, **L** to adopt natively (see §5). |
| 7 | Mixed-case or odd names | Not possible; fixed by hand | `@Name` | `@Name` | Missing | **S.** A leading `@` is unused today. |
| 8 | Delivery note on the name | `NAME (direction): text` | `NAME (V.O.)` | `NAME (V.O.)` | Same idea | None. |
| 9 | Direction inside a speech | `(text)` anywhere in the line, shown italic | Only on its own line between dialogue lines | Inline or on its own line | Different | **S** to export. Fountain export has to break the line around each direction. |
| 10 | Standalone action | `(text)` on its own line, may span lines | Any paragraph that is nothing else | `> text` | Different | **S** to export. |
| 11 | Simultaneous speech | `& NAME:`, any number chained | `^`, two speakers | `^`, two speakers | Added (3+) | **S** for two. Three or more cannot be expressed; export must fall back to sequential speeches. |
| 12 | Group speaker | `ANNA e MARCO:` with lowercase connectors | Whole line upper case | Whole line upper case | Different | **S.** Upper-case the connector on export. |
| 13 | Unrecognised line | Continues the block above, or is listed for review; never dropped | Silently becomes action | Parser diagnostics | Different | None. The current behaviour is the safer one for pasted Word text. |
| 14 | Technical cue | `{DEPT label \| description}` after a word or on its own line | None. Closest carrier: note `[[…]]` | None. Closest carrier: comment `/* … */` | Added | **Not closable.** Both tools would print `{LX 12}` as dialogue. Export must strip cues or wrap them in notes/comments. |
| 15 | Cue end | `{/DEPT label \| description}` | None | None | Added | As 14. |
| 16 | Blocking board | `{BOARD name}` | None | None | Added | As 14. |
| 17 | Ink | `script.ink.json`, keyed to block text | None | None | Added | Stays outside the script in any scenario. |
| 18 | Emphasis | None (italics come only from parentheses) | `*i*`, `**b**`, `_u_` | Same, plus `~strike~` | Missing | **M.** Tokeniser change. Bold changes word widths, so page breaks and ink positions need rechecking. |
| 19 | Comments and notes | None | `[[note]]`, `/* */`, `= synopsis` | `//`, `/* */` | Missing | **S.** A non-printing line type. Useful for the writer; overlaps with the "clean" view. |
| 20 | Manual page break | Automatic at each level-1 heading | `===` | `===` | Missing | **S.** |
| 21 | Verse, lyrics, songs | None | `~line` | Indented lines; `SONG` … `SONG END` | Missing | **M.** Out of scope while A1 holds (spoken play, no score). |
| 22 | Callouts, centred text, transitions | None | `>text<`, `> CUT TO:` | `>> text` | Missing | Low value for this show. Skip. |
| 23 | Keywords in Italian | Yes (headings, connectors, interface) | Not relevant for theatre | No (`ACT`, `SCENE`, `SONG` only) | Added | Export has to translate or flatten headings. |
| 24 | Tools and outputs | One HTML file: page view, print, cue list, CSV | Many editors and apps; PDF and Final Draft export | CLI, VS Code and Neovim support, web editor; PDF and HTML, acting-edition layouts | Different | Reached through export (path A below), not by changing the format. |

## 5. Ways to onboard

| Path | What it means | Effort | Risk |
|---|---|---|---|
| **A. Export only** (recommended) | "Clean script" export, already in the backlog, writes `.ds` and `.fountain`. Cues are dropped, or kept as comments/notes. | S–M | Low. One-way; `script.md` stays the source. |
| **B. Borrow the writing features** (recommended, with A) | Add rows 1–4, 7, 19, 20 to the native format, using the standards' spelling where it does not clash: a `Key: value` header before the first heading, a `## Personaggi` section with `NAME/ALIAS - description`, `@Name`, `//`, `===`. | M (about 3–5 days in total) | Low. All additive; old files stay valid. r1.0 and earlier would show the new lines as unclassified. |
| **C. Import** | Paste or open a `.ds` / `.fountain` file and convert to the native form. | M | Medium. Verse, songs and emphasis are lost until rows 18 and 21 exist. |
| **D. Native switch** | `script.md` becomes Downstage (or Fountain) plus the cue tokens. | L | High. See below. |

Why D is expensive:

1. **The parser is line-oriented around `NAME: text`.** Name-on-its-own-line needs blank-line state, and in-place block editing and the tap-a-word cue insertion both work on raw text offsets.
2. **Ink is matched to block text**, and that text includes the `NAME:` prefix (§5.8). Changing how a speech is written changes every speech block, so every inked speech would be flagged for checking unless the ink file is migrated in the same step.
3. **The file would still not be standard.** `{LX 12}` is not valid in either format; other tools would print it. The custom part remains, in a host format we do not control.
4. **Blank lines become mandatory.** A pasted Word script with no blank lines between speeches parses today; under Fountain or Downstage rules it collapses into one speech.
5. **Downstage is English-only for structure**, and it has already had one breaking revision.

## 6. Pros and cons

### Current format

| Pros | Cons |
|---|---|
| One line per speech; the least typing of the three, and it is what the writer already types in Word. | No title, author or character list in the script itself. |
| Cues, cue ends and boards live in the text and survive every edit. Nothing else offers this. | No aliases: full names typed on every speech. |
| Tolerant of messy pasted text; nothing is silently dropped or silently reclassified. | No emphasis, comments, verse or manual page break. |
| Italian and English, accented capitals, lowercase connectors. | Read only by this tool. No other editor, highlighter, linter or PDF renderer understands it. |
| Speeches do not depend on blank lines. | A colon after an all-caps word always makes a speech (`NOTA: …`, `TITOLO: …`), with no way to force it otherwise. |
| Any number of simultaneous speakers. | The format is defined by one spec and one parser, both ours to maintain. |

### Fountain

| Pros | Cons |
|---|---|
| Stable, widely implemented, many editors and converters. | Designed for film. Scene headings (`INT.`/`EXT.`), transitions and page conventions do not fit a play. |
| Title page with author and draft data. | No dramatis personae, no aliases, no act/scene model (`#` sections are not printed). |
| Notes `[[…]]` can sit mid-line, the only standard place a cue could hide. | Directions inside a speech must be on their own line. |
| Emphasis, comments, lyrics, page breaks. | Unrecognised lines silently become action. |
| | Two lines plus a blank per speech; dual dialogue limited to two. |

### Downstage

| Pros | Cons |
|---|---|
| Built for the stage: acts, scenes, stage directions, verse, songs. | Young, single maintainer, small user base; spec has already broken compatibility once. |
| Title, author, dramatis personae with groups and aliases, all in the file. | Structural keywords are English only. |
| Editor support with completion of character names, rename, and unknown-character warnings. | No cue, board or annotation concept; comments are the only carrier. |
| Renders manuscript and acting-edition PDFs. | Two lines plus a blank per speech; dual dialogue limited to two. |
| Inline directions allowed, as in the current format. | Needs its own tool to render (a Go CLI or its web editor), against D12's "one HTML file, no install". |

## 7. Sources

- Fountain syntax: https://fountain.io/syntax/
- Downstage repository and language spec: https://github.com/jscaltreto/downstage (`README.md`, `SPEC.md`)
- Downstage package documentation: https://pkg.go.dev/github.com/jscaltreto/downstage
- Current format: `SPEC.md` §5.2, §5.3, §5.5, §5.8, §5.11; `src/core.js` (`speechHead`, `classify`, `autoHead`)
