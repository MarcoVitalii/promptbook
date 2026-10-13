# How to keep a version for another venue

The show goes to a second theatre with a different rig, or to a festival that wants it shorter. You want that version beside the main one, each going its own way.

## First, decide whether you need one

A variant is for a difference that will **stay**. Changes made in one variant do not reach the other: a line the author corrects next week has to be corrected in both.

| Situation | Use |
|---|---|
| Trying a cut for a few rehearsals | A revision before; restore if it does not work ([how](05-mark-a-moment.md)) |
| The same text, other cue numbers for the house crew | A variant |
| A forty-minute version for a competition | A variant |
| A second cast with the same text | Neither: it is the same show |

Make it as late as you can, when the main text has settled.

## Make the variant

1. Bring the main show to the state the new version should start from, and **save a revision** ("Main, before the Verdi version").
2. **☰** → **History…**
3. Under **Variant**, type the name in "Name of a new variant" (for example "Teatro Verdi") and press **New variant**.

You are now working in "Teatro Verdi". It starts as an exact copy: text, cues, ink, boards, locked pages.

4. Make the changes for that venue. Save revisions as you go; they belong to this variant.

## Go from one to the other

1. **☰** → **History…**
2. Choose the variant in the **Variant** list.

The show changes to the last state of that variant. What you had open is kept first, as a revision of the variant you are leaving.

Always check which variant you are in before you work. The History box names it at the top.

## A correction both need

Make it in each:

1. In the variant you are in, make the change. Copy the corrected text if it is long.
2. Switch variant.
3. Find the same place, make the same change.
4. Save a revision in each, with the same name ("Author's corrections, 20 October"), so you can see later that both have it.

For more than a handful of corrections, people who use git can merge them: the history is a real git repository inside the show file. The steps are in `docs/specs/08-history.md` (HIS-11).

## What each variant has of its own

Text, cues and their numbers, ink, boards and templates, the locked page numbers and so the paper, the times learned in show mode, the settings of the show (departments, paper).

What they share: nothing but their past, up to the moment the variant was made.

## If something is off

- **I made changes in the wrong variant.** Open History, find the revision of this variant from before your changes and restore it; your changes are kept as "Before going to …". Then switch and make them again in the right one.
- **I want to remove or rename a variant.** Not possible in the tool. An unused variant does no harm.
- **A cast file from the other variant.** Each variant makes its own cast files. An actor who opens one after the other is told that the second is "older" or sees changes that are not changes. Send a variant's files only to the people who play that variant.
