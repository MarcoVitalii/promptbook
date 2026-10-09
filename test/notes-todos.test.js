// r1.4: %% comments, review departments (TODO), cue list columns and cue word, automatic numbers.
const { ok, open } = require('./_util');
(async () => {
  const { page, pen, text, done } = await open();
  await page.getByText('Try the sample scene').click();
  await page.waitForSelector('.page.script .row');
  const ev = f => page.evaluate(f);
  const load = s => page.evaluate(x => PB.startMemory(x, {}), s);

  // 1. comments: parsed apart, kept in the file, off the page and the cue list
  const src = 'ANNA: Uno {LX 1 | a}.\n%%\nMARCO: Tagliata {SND 1 | via}.\n\n(Azione tagliata.)\n%%\nANNA: Due.\n%% una riga sola %%\nMARCO: Tre.\n';
  await load(src);
  const p1 = await ev(() => [PB.S.blocks.map(b => b.type).join(), PB.S.blocks[1].inner, PB.S.blocks[3].inner, PB.serialize(), PB.collectCues().length, PB.reviewData().notes.length, PB.reviewData().count]);
  ok(p1[0] === 'speech,note,speech,note,speech', 'a %% block and a one-line %% comment are blocks of their own: ' + p1[0]);
  ok(p1[1] === 'MARCO: Tagliata {SND 1 | via}.\n\n(Azione tagliata.)' && p1[2] === 'una riga sola', 'the content is kept, blank line included');
  ok(p1[3] === src, 'the file text is unchanged by a round trip');
  ok(p1[4] === 1 && p1[5] === 2 && p1[6] === 0, 'cues inside a comment are not cues; comments are listed in Review and not counted: ' + p1.slice(4).join());
  ok(!(await page.locator('.page.script').first().textContent()).includes('Tagliata') && await page.locator('.cmk').count() === 2, 'nothing of it on the page but a marker');
  const hgt = await ev(() => document.querySelector('.row.note').getBoundingClientRect().height);
  ok(hgt === 0, 'the marker row takes no room: ' + hgt);

  // 2. a %% that is never closed hides nothing
  await load('ANNA: Uno.\n%%\nMARCO: Due.\n');
  const p2 = await ev(() => [PB.S.blocks.map(b => b.type).join(), PB.reviewData().paras.length]);
  ok(p2[0] === 'speech,para,speech' && p2[1] === 1, 'an unclosed %% is an unrecognised line, the text after it stays: ' + p2.join(' | '));

  // 3. comment out from the editor, restore from the marker; one undo each; ink comes back
  await load('ANNA: Prima battuta.\nMARCO: Seconda battuta da tagliare.\nANNA: Terza battuta.\n');
  let bb = await page.locator('.w', { hasText: 'Seconda' }).boundingBox();
  await pen([[bb.x, bb.y + 20], [bb.x + 60, bb.y + 22]]);
  await page.waitForTimeout(450);
  await page.locator('.w', { hasText: 'Seconda' }).dblclick();
  await page.waitForSelector('#editor textarea');
  await page.locator('#editor .btn', { hasText: 'Comment out' }).click();
  ok((await text()) === 'ANNA: Prima battuta.\n%%\nMARCO: Seconda battuta da tagliare.\n%%\nANNA: Terza battuta.\n', 'Comment out wraps the block: ' + JSON.stringify(await text()));
  ok(await ev(() => PB.S.orphans.length === 1 && PB.S.ink.size === 0), 'its ink is set aside');
  await page.locator('.cmk').click();
  ok((await page.locator('#pop .ntx').textContent()) === 'MARCO: Seconda battuta da tagliare.', 'the marker shows what is commented out');
  await page.locator('#pop .btn', { hasText: 'Restore' }).click();
  ok((await text()) === 'ANNA: Prima battuta.\nMARCO: Seconda battuta da tagliare.\nANNA: Terza battuta.\n', 'Restore brings the block back');
  ok(await ev(() => PB.S.orphans.length === 0 && PB.S.ink.size === 1) && await page.locator('.flag').count() === 0 && await page.locator('.ink path').count() === 1, 'and its ink with it, no flag');
  await page.keyboard.press('Control+z');
  ok((await text()).includes('%%\nMARCO'), 'undo comments it out again');
  await page.keyboard.press('Control+z');
  ok(!(await text()).includes('%%'), 'a second undo removes the comment');
  await page.locator('.w', { hasText: 'Seconda' }).dblclick();
  await page.locator('#editor .btn', { hasText: 'Comment out' }).click();
  await page.locator('.cmk').click();
  await page.locator('#pop .btn', { hasText: 'Edit text' }).click();
  ok(await page.locator('#editor .btn', { hasText: 'Restore' }).count() === 1, 'the editor of a comment offers Restore');
  await page.locator('#editor .btn', { hasText: 'Restore' }).click();
  ok(!(await text()).includes('%%'), 'Restore from the editor');

  // 4. review departments: TODO comes with a new show, red, and is not a cue
  await load('ANNA: Uno {LX 1 | buio} due {TODO | controllare il buio | troppo lento ieri} tre sei cinque. {SND 1 | mare}\nMARCO: Quattro {TODO | sedia a sinistra}.\n');
  const d4 = await ev(() => { const d = PB.S.cfg.departments.find(x => x.code === 'TODO'), r = PB.reviewData(); return [!!d && d.review, d && d.colour, PB.collectCues().map(o => o.c.dept).join(), r.todos.length, r.count]; });
  ok(d4[0] === true && d4[1] === '#d62828', 'a new show has a red TODO department marked for review');
  ok(d4[2] === 'LX,SND' && d4[3] === 2 && d4[4] === 2, 'TODO notes are left out of the cue list and counted in Review: ' + d4.slice(2).join(' | '));
  ok((await page.locator('#bReview').textContent()).includes('2'), 'the Review button shows the count');
  await page.locator('#bList').click();
  ok(await page.locator('#drawer .chip', { hasText: 'TODO' }).count() === 0 && await page.locator('#drawer tr.cr').count() === 2, 'no TODO chip or row in the cue list');
  const csv = await ev(() => PB.collectCues().map(o => o.ctx).join(' | '));
  ok(csv === '[Uno] due tre … | … tre sei [cinque.]', 'cue line: the word in brackets with two words each side: ' + csv);
  ok((await page.locator('#drawer .cw').allTextContents()).join() === 'Uno,cinque.', 'the cue word is marked in the list');
  await page.locator('#bList').click();
  await page.locator('#bReview').click();
  ok(await page.locator('#drawer h3', { hasText: 'To do (2)' }).count() === 1 && (await page.locator('#drawer .todo .it').first().textContent()).includes('controllare il buio — troppo lento ieri'), 'Review lists the notes with both texts');
  await page.locator('#drawer .todo .btn').first().click();
  ok(!(await text()).includes('controllare') && (await text()).includes('sedia a sinistra') && await page.locator('#drawer .todo').count() === 1, 'the tick removes that note from the script');
  await page.keyboard.press('Control+z');
  ok((await text()).includes('{TODO | controllare il buio | troppo lento ieri}'), 'one undo brings it back');
  await page.locator('#bReview').click();
  await page.locator('.w', { hasText: 'Quattro' }).click();
  const ends = await page.locator('#pop .ends .ebtn').allTextContents();
  ok(ends.join() === 'SND 1,LX 1', 'a note is never offered as something to end: ' + ends.join());
  await page.locator('#pop .depts .dbtn', { hasText: 'TODO' }).click();
  await page.keyboard.type('entra prima'); await page.keyboard.press('Enter');
  ok((await text()).includes('{TODO | entra prima}') && !/TODO \d/.test(await text()), 'a note gets no number: ' + (await text()).split('\n')[1]);

  // 5. cue list: margin text and description in columns of their own; description only when used
  await load('ANNA: Uno {LX 1 | buio} due.\n');
  await page.locator('#bList').click();
  const th1 = (await page.locator('#drawer th').allTextContents()).join();
  ok(th1 === 'Dept,No.,Margin,Act / scene,Cue line,P.', 'no description column when no cue has one: ' + th1);
  await load('ANNA: Uno {LX 1 | buio | In 8 secondi, dal fondo} due {SND 1 | mare}.\n');
  const th2 = (await page.locator('#drawer th').allTextContents()).join();
  const row = await page.locator('#drawer tr.cr').first().locator('td').allTextContents();
  ok(th2 === 'Dept,No.,Margin,Description,Act / scene,Cue line,P.' && row[2] === 'buio' && row[3] === 'In 8 secondi, dal fondo', 'margin text and description sit in two columns: ' + row.join(' | '));
  await page.locator('#bList').click();

  // 6. the cue list is printed from its own panel only
  await page.locator('#bPrint').click();
  const pr = (await page.locator('#pop .btn').allTextContents()).join(' | ');
  ok(pr === 'Book: script and facing pages | Script pages only', 'the Print button offers the book and the script: ' + pr);
  await page.keyboard.press('Escape');
  await page.locator('#bList').click();
  ok(await page.locator('#drawer .dhead .btn', { hasText: 'Print' }).count() === 2, 'the cue list panel keeps Print and Print by dept');
  await page.locator('#bList').click();

  // 7. automatic numbers
  await load('ANNA: Uno {LX 5} due tre {LX A12} quattro cinque {SND 5.5} sei sette.\nMARCO: Otto nove.\n');
  const pinAt = async (word, dept, typed) => {
    await page.locator('.w', { hasText: word }).first().click();
    await page.locator('#pop .depts .dbtn', { hasText: dept }).click();
    const ph = await page.locator('#pop input').first().getAttribute('placeholder');
    if (typed) { await page.keyboard.press('Shift+Tab'); await page.keyboard.type(typed); }
    await page.keyboard.press('Enter');
    return ph;
  };
  const ph = await pinAt('due', 'LX');
  ok(ph.includes('blank = 6') && (await text()).includes('due {LX 6}'), 'blank after LX 5 gives LX 6, and the field says so: ' + ph);
  await pinAt('cinque', 'LX');
  ok((await text()).includes('{LX A13}'), 'a prefix is kept: A12 gives A13');
  await pinAt('sette.', 'SND');
  ok((await text()).includes('sette. {SND 5.6}'), 'the last number of a point cue goes up: 5.5 gives 5.6');
  await pinAt('Otto', 'VID');
  ok((await text()).includes('Otto {VID 1}'), 'the first cue of a department is 1');
  await pinAt('nove.', 'VID', '7');
  ok((await text()).includes('nove. {VID 7}'), 'a typed number is kept');
  await page.keyboard.press('Control+z'); await page.keyboard.press('Control+z');
  ok(!(await text()).includes('VID'), 'a pinned cue and its number are one undo');
  await page.locator('.tag', { hasText: 'LX 6' }).click();
  await page.locator('#pop input').first().fill('');
  await page.keyboard.press('Enter');
  ok((await text()).includes('due {LX}'), 'clearing the number of an existing cue leaves it blank');

  // 8. an older show keeps its departments
  await page.evaluate(() => PB.startMemory('ANNA: Ciao {TODO | x}.\n', { departments: [{ code: 'LX', name: 'Luci', colour: '#c98a00' }] }));
  const old = await ev(() => [PB.S.cfg.departments.map(d => d.code + ':' + d.review).join(), PB.reviewData().unk.length, PB.collectCues().length]);
  ok(old.join('|') === 'LX:false|1|1', 'no TODO department is added to a show that has its own list: ' + old.join('|'));

  await done();
})();
