# How to start a show from the author's text

You have the script as a Word or text file and want it in a prompt book, saved as a show file, ready to cue.

## Before you start

- Chrome or Edge on a computer. Other browsers open the tool but cannot save show files.
- The script as text you can copy. From Word: select all, copy.

## Steps

1. **Open `promptbook.html`** and press **Start from pasted text**.
2. **Paste the script** into the box and press **Save**. The box shows the expected form above the text; do not tidy the script first, paste it as it is.
3. **Save it as a file at once:** **☰** → **Save as show file…**, choose a place and a name. Until you do, the show lives only in this browser and has no history. The status beside the title now reads **Saved** and the time; from here on saving is automatic.
4. **Open Review** (the **Review** button, or R). The number on the button counts what needs a look. Work down it; every entry jumps to its place:
   - **Lines not recognised**: text the tool could not read as a speech, an action or a heading. Usually a speech whose name is in lower case, or a stage direction without brackets. Double-tap the line and correct it: `NAME: text` for a speech, `(text)` for an action. A line that continues the speech above needs no change other than removing the blank line between them.
   - **Characters**: every speaker with the number of their speeches. A name that speaks once is often a typo (`MARCO` and `MARC0`) or an action read as a speech.
5. **Give the show its title and characters.** **☰** → **Edit whole script…** and put this at the very top, then **Save**:

   ```
   ---
   title: The Sea
   author: Name Surname
   characters:
     - ANNA/A - the daughter
     - MARCO/M - the fisherman
     - THE WATCHMAN
   ---
   ```

   The book gets a front page and a page of characters. Review now also tells you who speaks without being in the list, and who is listed and never speaks. An alias (`A` for `ANNA`) lets the author go on typing short names.
6. **Set the departments:** **☰** → **Settings…**. Lights, Sound, Video and To do are there. Change codes, names and colours to the ones your company uses, and add what is missing (FLY, PROPS). Do it now: changing a code later does not rewrite cues already pinned under the old one.
7. **Save a first revision:** **☰** → **History…**, name it (for example "As received from the author"), **Save revision**. This is the text before you touched it, and the point every later comparison can start from.

## What you have

A show file with the script paged as it will print, a clean Review, and a first revision. Next: [Put the cues in](03-cue-the-script.md).

## If something is off

- **Whole pages are "not recognised".** The names are probably not in capitals. The tool takes `NAME:` as a speech only when the name has no lower-case letters. Ask the author for the names in capitals, or correct them with find and replace in an editor before pasting.
- **A speech swallowed the next one.** A line that does not start with `NAME:` continues the block above. Put the name and colon back.
- **An act does not start a new page.** Its heading needs `#` in front, or one of the words the tool knows (ACT, SCENE, PROLOGUE and their Italian forms) at the start of the line.
- **"This browser cannot save show files."** You are not in Chrome or Edge. The show stays in the browser; use **Export backup** to get it out, then open the tool in Chrome or Edge and **Import a backup file…**.

The exact forms the tool reads are in the [Reference](../reference.md#writing-the-script).
