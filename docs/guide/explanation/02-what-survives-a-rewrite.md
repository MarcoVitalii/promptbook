# What survives a rewrite

*What happens to cues, ink, boards and times when the words under them change.*

A prompt book is weeks of small decisions pinned to particular words. A rewrite arrives and moves the words. The fear is reasonable: how much of the work is still attached to the right place afterwards?

The answer differs for each kind of thing, because each is attached in a different way.

## Cues: they are in the text

A cue is a mark inside the script, right after its word: `Who is there? {LX 12 | blackout}`. It has no position of its own to lose.

- Text added or cut **elsewhere**: the cue does not notice.
- Its speech **moved** to another scene: the cue moves with it.
- Words **around** its word changed: the cue stays after its word.
- **Its own word** rewritten in place: the mark is still there, now after whatever word precedes it. Look at it; it may want moving one word.
- Its sentence **cut**: if the mark was cut with it, the cue is gone, and so is its row in the cue list. If the mark was left behind, it stands where the sentence was.

So a cue is lost in exactly one way: someone deletes its mark together with the words. That is why a rewrite should be made *in* the text that has the marks, not in a clean copy that has none. See [Take in a rewrite](../how-to/04-take-in-a-rewrite.md).

A cue that has an **end** (the fade that closes a sound, the restore after an effect) is paired with it by department and number, in script order. Move one past the other and the pair no longer closes; the tool keeps the move and tells you. Ends with nothing to close are listed in **Review**.

Numbers are yours. The tool offers the next number when you pin a cue and never renumbers anything afterwards: a cue placed between 5 and 6 becomes a second 6, marked in the cue list, until you decide what to call it.

## Ink: it follows its speech, and asks when unsure

Ink cannot be in the text. A pen stroke is a shape, and the only honest question about a shape is *what was it written on?*

Each speech, action and heading is a **block**. A stroke belongs to the block it started in and is stored relative to that block. So:

- A block that **moves** takes its ink with it: to another page, to another act.
- A block whose **words did not change** keeps its ink untouched, whatever happens around it.
- A block whose **words changed** keeps its ink, with a red **!** beside it. The arrow you drew under "slowly" may now be under another word, or the line may have grown and the note sits over text. The tool cannot know, so it asks. Tap the **!**: **Ink is fine**, or **Clear ink on this block**.
- A block that was **cut** leaves its ink with nowhere to be. It is not thrown away: it is listed in Review as "Ink whose text was removed". Bring the text back (undo, or restore a revision) and the ink is on it again.

After any edit the blocks are matched again, first by exact text, then by order and likeness. That is how ink finds its speech after a rewrite made outside the tool.

Adding, moving or deleting a **cue** never flags ink. Only words count.

The page is laid out the same way everywhere: fixed columns, one embedded font, so a line breaks at the same word on every screen, at every zoom and on paper. Without that, ink drawn on one machine would sit over the wrong words on another.

## Boards: they hang on a line of the script

A board is shown on the facing page of the script page its line falls on. The line is a mark like a cue, on its own: `{BOARD Act 1 entrance}`. Move the line and the board is beside a different page; rewrite the scene around it and it stays between the same two speeches.

The drawing itself is kept under the board's name. Templates (the bare stage, the stage with the furniture of Act 2) are not in the script at all, so no rewrite touches them. A board drawn on a template shows the template as it is *now*: move the sofa in the template and it has moved in every blocking that uses it.

## Times: they are remembered by the words

Show mode keeps, for each block timed in rehearsal, how long it takes. A time is tied to the words of its block. Change the words and that block's time is forgotten: it falls back to an estimate from its length, until it is timed again. Everything else keeps its time. So a rewrite of one scene costs the timing of that scene and no more.

## Pages: they move, unless you have fixed them

Page numbers are worked out from the text. Add half a page in Act One and every page after it shifts, which is harmless on a screen and a disaster on paper that forty people have already written on.

That is what locking is for. Once page numbers are locked, a page starts where it started on paper; new text that does not fit goes to an inserted page, 12A; a page whose words changed is marked. The reasoning is in [Revisions, variants and locked pages](03-revisions-variants-locks.md).

## In short

| Thing | Attached to | After a rewrite | Where to look |
|---|---|---|---|
| Cue | A word, inside the text | There, unless its mark was deleted | Cue list; Review for loose ends |
| Ink | The block it was written on | There; flagged **!** if the words changed; set aside if the block is gone | Review: "Ink to check", "Ink whose text was removed" |
| Board | A line of the script | Between the same two blocks | Facing page |
| Template | The show's settings | Untouched | Menu → Templates… |
| Timed block | The words of the block | Forgotten for changed blocks only | Show mode, "Time it" |
| Page number | Nothing, or the lock | Shifts; or holds, with A pages and marks | History |

## The limits

The matching of ink to changed text is a judgement, and the **!** is the tool saying so. After a heavy rewrite, expect to walk through "Ink to check" once.

A whole-script paste of a text *without* the marks is taken at its word: the cues are not in it, so they are gone. Undo brings them back at once; a revision saved before brings them back later. Save one first, always.
