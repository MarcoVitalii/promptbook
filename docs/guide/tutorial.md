# Tutorial: a first show, start to finish

In about forty minutes you will take the sample scene through everything a real show goes through: you will cue it, write on it, save a rehearsal, rewrite a line, see what changed, make a file for the cast and run it in show mode.

You need Chrome or Edge on a computer. A pen is welcome and not needed. Nothing here touches a show of yours.

Do the steps in order. Each one ends with something you can see; if you do not see it, do not go on, go back one step.

## 1. Open the sample

Open `promptbook.html`. On the start screen press **Try the sample scene**.

You now see a spread: the script on the left page, an empty facing page on the right. The sample is a short scene in Italian with a few light and sound cues already in its margin; you do not need to read Italian to follow. A yellow banner says the show is only in this browser. Leave it for now.

Press **Guide** in the bottom right corner (or the H key). Every button gets a number and a card says what each does. Read it once, then press Esc.

## 2. Put it on disk

A show that is only in the browser has no history. So, first:

Press **☰** (Menu), then **Save as show file…**. Name it `sample.zip` and save it somewhere you will find it.

The banner goes. Beside the title the status reads **Saved** with the time. From now on every change is saved by itself: there is no Save button to remember.

## 3. Pin a cue

Tap (or click) a word in a speech, about a third of the way down the first page.

A small box opens with one button for each department: **LX**, **SND**, **VID**, **TODO**. Press **LX**.

A tag appears in the right margin with a line to your word, and the box now asks for a number and a margin text. The number field says which one it will get if you leave it blank, and the cursor is already in "Margin text". Type `blackout` and press Enter.

The tag reads the department, the number and "blackout". You never typed a brace: the tool wrote something like `{LX 2 | blackout}` into the script after that word. The number follows on from the LX cue before it; the cues after it keep theirs, because the tool never renumbers.

Press **Cue list** (or L). A panel lists every cue with its page and the words around it. Press **Cue list** again to close it.

## 4. Write on the page

With a pen, write a word in the margin beside any speech. Without a pen, press **Finger** first, then draw with the mouse; press **Finger** again when you are done, or every click will draw.

The ink belongs to the speech you started on. Remember which one: you will rewrite it in step 6.

## 5. Save the rehearsal

Press **☰**, then **History…**.

In the field that says "Name of this revision", type `First rehearsal`. Tick **Lock page numbers here**. Press **Save revision**.

The list now has one revision, and above it a line says that page numbers are locked at "First rehearsal". You have just said two things: *this is a moment I may want back*, and *this is what the paper in people's hands looks like*. Close the box.

## 6. Rewrite a line

Double-click (or double-tap) the speech you wrote on in step 4. Its text opens in an editor.

Change a few words and add a sentence. Press Ctrl+Enter.

Three things have happened, and each is worth finding:

- The cue you pinned, if it was in this speech, is still on its word.
- A red **!** stands beside the speech: the words under your ink changed, so the tool asks you to look. Tap the **!** and choose **Ink is fine**.
- At the foot of that page a note reads "∗ changed since “First rehearsal”".

## 7. See what changed

Open **☰** → **History…** again. Beside "First rehearsal" press **Changes**.

The speech is shown as it was and as it is: the words you removed struck through in red, the ones you added underlined in green.

Now open the **Show** list at the top and pick the name of the character who speaks that line. The list holds only what reaches that actor. Pick another character: unless they speak the next line, their list is empty. This is the sheet you would hand to each of them.

Press **Back**. The History box says which pages changed. **Print changed pages** would print exactly those; you do not need to print now. Close the box.

## 8. A note for an actor, and a file for the cast

Press **☰** → **Send to cast…**. The box says no department is marked "Cast" yet. Press **Add a “Notes” department** and close the box.

Tap a word in a speech. The pin now has a **NOTE** button: press it. The field for the label reads "For: blank =" and the speaker's name: leave it blank. The cursor is in the field "Note for the cast": type `slower here` and press Enter.

Open **☰** → **Send to cast…** again. It says one note waits, and for whom. Press **Save the cast file (.html)** and save it.

Open that file in a new browser tab. This is what an actor sees: the text with no cues, your note beside its line. Press **My part**, tick a character, then **Hide my lines**: their lines are covered, to practise. Close the tab.

## 9. Run it

Back in the prompt book, press **Show** (or S).

The toolbar is gone and the script is large. A panel on the right shows a clock and the first calls. Press Space.

A line starts down the script. As it comes near your cue the panel says **WARNING**, then **STANDBY** with a countdown, then **GO**. Double-click a word further down: the line jumps there, as you would do when the actors skip ahead. Press Space to stop.

Try to draw or tap a word: nothing happens. In show mode the book cannot be changed.

Press **Leave** twice (or S twice). Everything is back.

## 10. Go back

Open **☰** → **History…** and press **Restore** beside "First rehearsal".

The speech has its old words again and your ink has no flag. Open History once more: there is a new revision named "Before going to “First rehearsal”". What you had before going back was kept; nothing is lost by a restore.

## What you have done

You have used every part of the loop a production goes round, many times, between the first reading and closing night:

| You did | It is for | More |
|---|---|---|
| Pinned a cue on a word | Cues that stay on their word when the text moves | [Put the cues in](how-to/03-cue-the-script.md) |
| Saved a revision and locked the pages | Naming a moment; fixing the paper | [Revisions, variants and locked pages](explanation/03-revisions-variants-locks.md) |
| Rewrote a line and read the changes | Taking in a rewrite without losing what was pinned | [Take in a rewrite](how-to/04-take-in-a-rewrite.md) |
| Made a cast file | The same text on every phone, with your notes | [Send to the cast](how-to/09-send-to-the-cast.md) |
| Ran the line | Warnings and standbys from the book itself | [Call a show](how-to/11-call-a-show.md) |

Next, with a script of your own: [Start a show from the author's text](how-to/01-start-a-show.md).
