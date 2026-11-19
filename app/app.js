// Leonida Platinum Guide — offline GTA 6 trophy guide and tracker.
// Static files only: data comes from data/trophies.json, progress lives in
// localStorage, nothing is fetched from the network at run time.
const LS_EARNED = 'lpg.earned.v1';
const LS_NOTES = 'lpg.notes.v1';
const LS_NEXTUP = 'lpg.nextup.v1';
const LS_SPOILER = 'lpg.spoiler.v1';

const KIND_LABEL = {
  story: 'Story', side: 'Side quest', collectible: 'Collectible',
  activity: 'Activity', combat: 'Combat', grind: 'Grind', completion: 'Completion',
};
const GRADE_LABEL = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };
const STAGES = [
  { n: 1, title: 'Play the story', text: 'Chapters 1–4 and the final mission, in order. Meditate at home before Chapter 1 ends, and keep a manual save at the start of every chapter — the game has no mission replay.' },
  { n: 2, title: 'Strangers & side strands', text: 'The stranger mission strands across Leonida. Finish each strand to its last mission; strands are tied to story progress, so keep them moving as they appear.' },
  { n: 3, title: 'Activities & challenges', text: 'Shooting ranges, races, stunts, meditation spots, arcade games and the challenge list. Most of these open up once both characters are playable in Chapter 2.' },
  { n: 4, title: 'Collectibles & exploration', text: 'Cards, WAiNK It spots, vehicles, areas and garage properties. Tick them off as you travel — they are a slow burn if left to the end.' },
  { n: 5, title: 'Combat, heists & the grind', text: 'Vaults, tanks, trucks, gang operations and the money trophies, then the 100% checklist and the platinum.' },
];

const params = new URLSearchParams(location.search);
const doc = await (await fetch('data/trophies.json')).json();
const TROPHIES = doc.trophies;
const BY_ID = new Map(TROPHIES.map((t) => [t.id, t]));

// ---- state ---------------------------------------------------------------
function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback; } catch { return fallback; }
}
let earned = new Set(loadJSON(LS_EARNED, []));
let notes = loadJSON(LS_NOTES, {});
let nextUp = loadJSON(LS_NEXTUP, []);
let spoiler = localStorage.getItem(LS_SPOILER) === '1';
if (params.get('spoiler') === 'on') spoiler = true;
if (params.get('spoiler') === 'off') spoiler = false;
// Screenshot seeding: only when no progress has been saved yet.
const seedN = Number(params.get('seed') || 0);
if (seedN > 0 && !localStorage.getItem(LS_EARNED)) {
  const seedIds = [2, 3, 4, 8, 9, 15, 16, 21, 33, 35, 42, 46, 55];
  earned = new Set(seedIds.slice(0, seedN));
  saveEarned();
}
function saveEarned() { localStorage.setItem(LS_EARNED, JSON.stringify([...earned])); }
function saveNotes() { localStorage.setItem(LS_NOTES, JSON.stringify(notes)); }
function saveNextUp() { localStorage.setItem(LS_NEXTUP, JSON.stringify(nextUp)); }
function saveSpoiler() { localStorage.setItem(LS_SPOILER, spoiler ? '1' : '0'); }

// ---- helpers ---------------------------------------------------------------
const view = document.getElementById('view');
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
function isHidden(t) { return spoiler && t.kind === 'story' && !earned.has(t.id); }
function gradeCounts() {
  const c = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of TROPHIES) if (earned.has(t.id)) c[t.grade]++;
  return c;
}
function renderProgress() {
  const box = document.getElementById('progress');
  box.replaceChildren();
  const pct = Math.round((earned.size / TROPHIES.length) * 100);
  const big = el('div', 'big');
  big.append(document.createTextNode(`${earned.size} `));
  const slash = el('span', null, `/ ${TROPHIES.length}`);
  big.append(slash);
  const bar = el('div', 'bar');
  const fill = el('i');
  fill.style.width = `${pct}%`;
  bar.append(fill);
  const gc = gradeCounts();
  const lbl = el('div', 'lbl',
    `${pct}% to the platinum · Platinum ${gc.platinum}/1 · Gold ${gc.gold}/2 · Silver ${gc.silver}/6 · Bronze ${gc.bronze}/46`);
  box.append(big, bar, lbl);
}
function renderMissablePill() {
  const n = TROPHIES.filter((t) => t.missable || t.sensitive).length;
  document.getElementById('missable-count').textContent = String(n);
}

// ---- filters ---------------------------------------------------------------
const filters = { q: '', kind: 'all', grade: 'all', status: 'all' };
let selectedId = Number(params.get('detail') || 0) || null;

function filtered() {
  const q = filters.q.trim().toLowerCase();
  return TROPHIES.filter((t) => {
    if (filters.kind === 'missable') { if (!(t.missable || t.sensitive)) return false; }
    else if (filters.kind !== 'all' && t.kind !== filters.kind) return false;
    if (filters.grade !== 'all' && t.grade !== filters.grade) return false;
    if (filters.status === 'earned' && !earned.has(t.id)) return false;
    if (filters.status === 'todo' && earned.has(t.id)) return false;
    if (filters.status === 'nextup' && !nextUp.includes(t.id)) return false;
    if (q) {
      const hay = `${t.name} ${t.description} ${t.guide}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

// ---- views ---------------------------------------------------------------
function renderChecklist() {
  view.replaceChildren();
  const wrap = el('div', 'grid2');
  const left = el('div');
  const right = el('div');

  const toolbar = el('div', 'toolbar');
  const search = el('input');
  search.type = 'search';
  search.placeholder = 'Search trophies, descriptions and guides…  ( / )';
  search.value = filters.q;
  search.setAttribute('aria-label', 'Search trophies');
  search.addEventListener('input', () => { filters.q = search.value; renderList(); });
  const gradeSel = el('select');
  gradeSel.setAttribute('aria-label', 'Filter by grade');
  for (const [v, label] of [['all', 'All grades'], ['platinum', 'Platinum'], ['gold', 'Gold'], ['silver', 'Silver'], ['bronze', 'Bronze']]) {
    const o = el('option', null, label); o.value = v; if (filters.grade === v) o.selected = true; gradeSel.append(o);
  }
  gradeSel.addEventListener('change', () => { filters.grade = gradeSel.value; renderList(); });
  const statusSel = el('select');
  statusSel.setAttribute('aria-label', 'Filter by status');
  for (const [v, label] of [['all', 'All trophies'], ['todo', 'Not earned'], ['earned', 'Earned'], ['nextup', 'Next up']]) {
    const o = el('option', null, label); o.value = v; if (filters.status === v) o.selected = true; statusSel.append(o);
  }
  statusSel.addEventListener('change', () => { filters.status = statusSel.value; renderList(); });
  const spoil = el('label', 'toggle');
  const spoilBox = el('input');
  spoilBox.type = 'checkbox'; spoilBox.checked = spoiler;
  spoilBox.addEventListener('change', () => { spoiler = spoilBox.checked; saveSpoiler(); render(); });
  spoil.append(spoilBox, document.createTextNode('Hide story spoilers until earned'));
  toolbar.append(search, gradeSel, statusSel, spoil);
  left.append(toolbar);

  const chips = el('div', 'chips');
  for (const [v, label] of [['all', 'All kinds'], ['story', 'Story'], ['side', 'Side quests'], ['collectible', 'Collectibles'], ['activity', 'Activities'], ['combat', 'Combat'], ['grind', 'Grind'], ['missable', 'Missable & chapter-sensitive']]) {
    const b = el('button', 'chip', label);
    b.type = 'button';
    b.setAttribute('aria-pressed', String(filters.kind === v));
    b.addEventListener('click', () => { filters.kind = v; renderList(); });
    chips.append(b);
  }
  left.append(chips);

  const countLine = el('p', 'muted');
  countLine.id = 'count-line';
  left.append(countLine);
  const list = el('ul', 'tlist');
  list.id = 'tlist';
  left.append(list);

  function renderList() {
    const items = filtered();
    countLine.textContent = `Showing ${items.length} of ${TROPHIES.length} trophies · ${earned.size} earned`;
    list.replaceChildren();
    if (!items.length) { list.append(el('li', 'empty', 'No trophies match these filters.')); return; }
    for (const t of items) {
      const li = el('li', 'trow' + (earned.has(t.id) ? ' earned' : '') + (selectedId === t.id ? ' selected' : ''));
      const box = el('input');
      box.type = 'checkbox';
      box.checked = earned.has(t.id);
      box.setAttribute('aria-label', `Mark ${t.name} earned`);
      box.addEventListener('change', (e) => {
        e.stopPropagation();
        if (box.checked) earned.add(t.id); else earned.delete(t.id);
        saveEarned(); renderProgress(); renderList(); renderDetail();
      });
      const dot = el('span', `dot ${t.grade}`);
      const body = el('div');
      const hidden = isHidden(t);
      body.append(el('div', hidden ? 'tname hidden-name' : 'tname', hidden ? 'Hidden trophy — story spoiler' : t.name));
      if (!hidden) body.append(el('div', 'tdesc', t.description));
      const meta = el('div', 'tmeta');
      meta.append(el('span', `tag grade-${t.grade}`, GRADE_LABEL[t.grade]));
      meta.append(el('span', 'tag', KIND_LABEL[t.kind]));
      if (t.target != null) meta.append(el('span', 'tag', `Target: ${t.target}`));
      if (t.missable) meta.append(el('span', 'tag miss', 'Missable'));
      else if (t.sensitive) meta.append(el('span', 'tag sens', 'Chapter-sensitive'));
      if (nextUp.includes(t.id)) meta.append(el('span', 'tag', 'Next up'));
      body.append(meta);
      const guideBtn = el('button', 'tguide-btn', 'Guide');
      guideBtn.type = 'button';
      guideBtn.addEventListener('click', (e) => { e.stopPropagation(); selectedId = t.id; renderList(); renderDetail(); });
      li.append(box, dot, body, guideBtn);
      li.addEventListener('click', (e) => {
        if (e.target.closest('input,button')) return;
        selectedId = t.id; renderList(); renderDetail();
      });
      list.append(li);
    }
  }
  renderList();

  const detail = el('div', 'detail');
  detail.id = 'detail';
  right.append(detail);
  wrap.append(left, right);
  view.append(wrap);
  renderDetail();
  search.addEventListener('keydown', (e) => { if (e.key === 'Escape') { search.value = ''; filters.q = ''; renderList(); } });
}

function renderDetail() {
  const detail = document.getElementById('detail');
  if (!detail) return;
  detail.replaceChildren();
  const card = el('div', 'card');
  if (!selectedId || !BY_ID.has(selectedId)) {
    card.append(el('h2', null, 'Pick a trophy'));
    card.append(el('p', 'muted', 'Tap any trophy in the checklist to read its guide here: what to do, where and how, when it can be missed, and the sources each fact comes from.'));
    detail.append(card);
    return;
  }
  const t = BY_ID.get(selectedId);
  if (isHidden(t)) {
    card.append(el('h2', null, 'Hidden trophy'));
    card.append(el('p', null, 'This is a story trophy, and the spoiler setting is on. Its name, description and guide stay hidden until you earn it in the game.'));
    card.append(el('p', 'muted', 'Turn the spoiler setting off in the checklist toolbar to reveal it.'));
    detail.append(card);
    return;
  }
  const head = el('div');
  head.append(el('span', `tag grade-${t.grade}`, GRADE_LABEL[t.grade]));
  head.append(document.createTextNode(' '));
  head.append(el('span', 'tag', KIND_LABEL[t.kind]));
  if (t.missable) head.append(document.createTextNode(' ')), head.append(el('span', 'tag miss', 'Missable'));
  else if (t.sensitive) head.append(document.createTextNode(' ')), head.append(el('span', 'tag sens', 'Chapter-sensitive'));
  card.append(head);
  card.append(el('h2', null, t.name));
  card.append(el('p', 'official', `Official description: “${t.description}”`));
  card.append(el('h3', null, 'How to earn it'));
  card.append(el('p', null, t.guide));
  if (t.steps && t.steps.length) {
    const ol = el('ol');
    for (const s of t.steps) ol.append(el('li', null, s));
    card.append(ol);
  }
  if (t.missable) {
    const w = el('div', 'note');
    w.append(el('strong', null, 'Missable — read this first. '));
    w.append(document.createTextNode('The first meditation spot is offered at home in Chapter 1 and is gone for good once that chapter ends. Meditate there before you finish Chapter 1, and keep a manual save at the start of each chapter.'));
    card.append(w);
  } else if (t.sensitive) {
    const w = el('div', 'note');
    w.append(el('strong', null, 'Do it when it appears. '));
    w.append(document.createTextNode('This one is tied to story progress and the game has no mission replay, so finish it when it comes up rather than leaving it for after the credits.'));
    card.append(w);
  }
  const src = el('div', 'sources');
  src.append(el('strong', null, 'Sources:'));
  const ul = el('ul');
  for (const s of t.sources) {
    const li = el('li');
    if (s.url) {
      const a = el('a', null, s.label);
      a.href = s.url; a.target = '_blank'; a.rel = 'noopener';
      li.append(a);
    } else {
      li.textContent = s.label;
    }
    ul.append(li);
  }
  src.append(ul);
  card.append(src);
  const btns = el('div', 'btnrow');
  const earnedBtn = el('button', 'btn', earned.has(t.id) ? '✓ Earned — tap to unmark' : 'Mark as earned');
  earnedBtn.type = 'button';
  earnedBtn.addEventListener('click', () => {
    if (earned.has(t.id)) earned.delete(t.id); else earned.add(t.id);
    saveEarned(); renderProgress(); render();
  });
  const nextBtn = el('button', nextUp.includes(t.id) ? 'btn ghost' : 'btn', nextUp.includes(t.id) ? 'Remove from Next up' : 'Add to Next up');
  nextBtn.type = 'button';
  nextBtn.addEventListener('click', () => {
    if (nextUp.includes(t.id)) nextUp = nextUp.filter((x) => x !== t.id);
    else nextUp.push(t.id);
    saveNextUp(); render();
  });
  btns.append(earnedBtn, nextBtn);
  card.append(btns);
  card.append(el('h3', null, 'Your note'));
  const ta = el('textarea', 'notebox');
  ta.placeholder = 'Your own note for this trophy — a spot, a loadout, a reminder…';
  ta.value = notes[t.id] || '';
  ta.setAttribute('aria-label', 'Your note for this trophy');
  ta.addEventListener('input', () => { notes[t.id] = ta.value; saveNotes(); });
  card.append(ta);
  detail.append(card);
}

// ---- roadmap ---------------------------------------------------------------
function renderRoadmap() {
  view.replaceChildren();
  const facts = el('div', 'card');
  facts.append(el('h2', null, 'Roadmap to the platinum'));
  facts.append(el('p', null, 'Five stages, in order. One playthrough is enough — PowerPyx rates the set 4/10 in difficulty and about 200 hours — but there is no mission replay, so the two habits that matter are: meditate at home before Chapter 1 ends, and keep a manual save at the start of every chapter.'));
  const grid = el('div', 'facts');
  for (const [b, s] of [['200 h', 'Platinum time, PowerPyx'], ['4/10', 'Difficulty, PowerPyx'], ['0', 'Online trophies'], ['1', 'Potentially missable'], ['60%', 'True completion for 100%'], ['55', 'Trophies, all offline']]) {
    const f = el('div', 'fact');
    f.append(el('b', null, b), el('span', null, s));
    grid.append(f);
  }
  facts.append(grid);
  view.append(facts);
  for (const st of STAGES) {
    const items = TROPHIES.filter((t) => t.stage === st.n);
    const done = items.filter((t) => earned.has(t.id)).length;
    const card = el('div', 'card stage');
    const head = el('div', 'stage-head');
    head.append(el('span', 'num', `Stage ${st.n}`));
    head.append(el('h2', null, st.title));
    head.append(el('span', 'muted', `${done} / ${items.length} earned`));
    card.append(head);
    card.append(el('p', 'muted', st.text));
    const bar = el('div', 'bar');
    const fill = el('i');
    fill.style.width = `${items.length ? Math.round((done / items.length) * 100) : 0}%`;
    bar.append(fill);
    card.append(bar);
    const row = el('div', 'chiprow');
    for (const t of items) {
      const c = el('button', 'minichip' + (earned.has(t.id) ? ' done' : ''), isHidden(t) ? 'Hidden story trophy' : t.name);
      c.type = 'button';
      c.addEventListener('click', () => { selectedId = t.id; location.hash = '#/'; });
      row.append(c);
    }
    card.append(row);
    view.append(card);
  }
  const note = el('div', 'card note');
  note.append(el('strong', null, 'About the order. '));
  note.append(document.createTextNode('Stages 1 and 2 are story order; stages 3–5 can be done in any order once the story opens them up, but most of the list only opens once both characters are playable in Chapter 2. The 100% checklist (A Long Road) appears after the story — finish it last.'));
  view.append(note);
}

// ---- missables ---------------------------------------------------------------
function renderMissables() {
  view.replaceChildren();
  const warn = el('div', 'card warn');
  warn.append(el('h2', null, 'The one trophy you can miss'));
  const t28 = BY_ID.get(28);
  const t28head = el('p');
  t28head.append(el('strong', null, t28.name));
  t28head.append(document.createTextNode(` — ${GRADE_LABEL[t28.grade]} · ${KIND_LABEL[t28.kind]} · target: ${t28.target} spots`));
  warn.append(t28head);
  warn.append(el('p', null, t28.guide));
  const ol = el('ol');
  for (const s of t28.steps) ol.append(el('li', null, s));
  warn.append(ol);
  warn.append(el('p', 'muted', 'Flagged by PowerPyx and GTABase as the only trophy that may be missable. Everything else on this page is chapter-sensitive, not confirmed missable.'));
  view.append(warn);

  const card = el('div', 'card');
  card.append(el('h2', null, 'Chapter-sensitive — do it when it appears'));
  card.append(el('p', null, 'The game has no mission replay (PowerPyx), so these are tied to story progress. None of them is confirmed missable, but none of them can be replayed later either — finish each one when it comes up, and keep a manual save at the start of every chapter.'));
  const list = el('ul', 'tlist');
  for (const t of TROPHIES.filter((x) => x.sensitive)) {
    const li = el('li', 'trow' + (earned.has(t.id) ? ' earned' : ''));
    const box = el('input');
    box.type = 'checkbox'; box.checked = earned.has(t.id);
    box.setAttribute('aria-label', `Mark ${t.name} earned`);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.id); else earned.delete(t.id);
      saveEarned(); renderProgress(); render();
    });
    const dot = el('span', `dot ${t.grade}`);
    const body = el('div');
    const hidden = isHidden(t);
    body.append(el('div', hidden ? 'tname hidden-name' : 'tname', hidden ? 'Hidden story mission — earn it to reveal' : t.name));
    if (!hidden) body.append(el('div', 'tdesc', t.description));
    const meta = el('div', 'tmeta');
    meta.append(el('span', 'tag', KIND_LABEL[t.kind]));
    meta.append(el('span', 'tag sens', 'Chapter-sensitive'));
    body.append(meta);
    const btn = el('button', 'tguide-btn', 'Guide');
    btn.type = 'button';
    btn.addEventListener('click', () => { selectedId = t.id; location.hash = '#/'; });
    li.append(box, dot, body, btn);
    list.append(li);
  }
  card.append(list);
  view.append(card);

  const safe = el('div', 'card');
  safe.append(el('h2', null, 'Safe after the story'));
  safe.append(el('p', null, 'Everything else — collectibles, activities, combat, exploration and the money trophies — can be finished after the credits. The 100% checklist only appears after the story anyway, so the endgame is where most of the clean-up happens.'));
  view.append(safe);
}

// ---- save & settings ---------------------------------------------------------------
function renderSave() {
  view.replaceChildren();
  const card = el('div', 'card');
  card.append(el('h2', null, 'Your progress'));
  const dl = el('dl', 'kv');
  const gc = gradeCounts();
  for (const [k, v] of [
    ['Earned', `${earned.size} of ${TROPHIES.length} trophies (${Math.round((earned.size / TROPHIES.length) * 100)}%)`],
    ['Platinum', `${gc.platinum}/1`], ['Gold', `${gc.gold}/2`], ['Silver', `${gc.silver}/6`], ['Bronze', `${gc.bronze}/46`],
    ['Notes written', String(Object.values(notes).filter(Boolean).length)],
    ['Next up', String(nextUp.length)],
    ['Storage', 'localStorage, on this device only — nothing leaves your browser'],
  ]) {
    dl.append(el('dt', null, k), el('dd', null, v));
  }
  card.append(dl);
  const btns = el('div', 'btnrow');
  const exp = el('button', 'btn', 'Export progress (.json)');
  exp.type = 'button';
  exp.addEventListener('click', () => {
    const payload = { app: 'leonida-platinum-guide', version: 1, exportedAt: new Date().toISOString(), earned: [...earned], notes, nextUp, spoiler };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    a.download = 'leonida-platinum-guide-progress.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  const impLabel = el('label', 'btn ghost', 'Import progress…');
  const imp = el('input');
  imp.type = 'file'; imp.accept = 'application/json'; imp.style.display = 'none';
  imp.addEventListener('change', async () => {
    const file = imp.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const ids = Array.isArray(data) ? data : (data.earned || []);
      const valid = ids.filter((x) => BY_ID.has(Number(x))).map(Number);
      earned = new Set(valid);
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        if (data.notes && typeof data.notes === 'object') notes = data.notes;
        if (Array.isArray(data.nextUp)) nextUp = data.nextUp.filter((x) => BY_ID.has(Number(x))).map(Number);
        if (typeof data.spoiler === 'boolean') spoiler = data.spoiler;
      }
      saveEarned(); saveNotes(); saveNextUp(); saveSpoiler();
      renderProgress(); render();
    } catch { alert('That file is not a valid progress export.'); }
  });
  impLabel.append(imp);
  const reset = el('button', 'btn ghost', 'Reset all progress');
  reset.type = 'button';
  reset.addEventListener('click', () => {
    if (!confirm('Reset all earned trophies, notes and Next up?')) return;
    earned = new Set(); notes = {}; nextUp = [];
    saveEarned(); saveNotes(); saveNextUp(); renderProgress(); render();
  });
  btns.append(exp, impLabel, reset);
  card.append(btns);
  view.append(card);

  const set = el('div', 'card');
  set.append(el('h2', null, 'Settings'));
  const spoil = el('label', 'toggle');
  const spoilBox = el('input');
  spoilBox.type = 'checkbox'; spoilBox.checked = spoiler;
  spoilBox.addEventListener('change', () => { spoiler = spoilBox.checked; saveSpoiler(); render(); });
  spoil.append(spoilBox, document.createTextNode('Hide story spoilers until earned (names, descriptions and guides of story trophies stay hidden)'));
  set.append(spoil);
  set.append(el('p', 'muted', 'The spoiler setting hides the 12 story trophies until you earn them. The 28 trophies PlayStation hides stay hidden on PSN until earned; this guide never reveals a story trophy you have not earned while the setting is on.'));
  view.append(set);

  const up = el('div', 'card');
  up.append(el('h2', null, 'Next up'));
  if (!nextUp.length) {
    up.append(el('p', 'muted', 'Nothing queued. Open a trophy in the checklist and tap “Add to Next up” to plan what to chase next.'));
  } else {
    const ul = el('ul', 'nextup');
    for (const id of nextUp) {
      const t = BY_ID.get(id);
      if (!t) continue;
      const li = el('li');
      const a = el('a', null, isHidden(t) ? 'Hidden story trophy' : t.name);
      a.href = '#/';
      a.addEventListener('click', () => { selectedId = id; });
      const rm = el('button', 'tguide-btn', 'Remove');
      rm.type = 'button';
      rm.addEventListener('click', () => { nextUp = nextUp.filter((x) => x !== id); saveNextUp(); render(); });
      li.append(a, rm);
      ul.append(li);
    }
    up.append(ul);
  }
  view.append(up);
}

// ---- router ---------------------------------------------------------------
function render() { route(); }
function route() {
  const hash = location.hash || '#/';
  const parts = hash.replace(/^#\/?/, '').split('/');
  const name = parts[0] || '';
  document.querySelectorAll('#tabs a').forEach((a) => {
    a.classList.toggle('active', a.dataset.view === (name || 'checklist'));
  });
  if (name === 'roadmap') renderRoadmap();
  else if (name === 'missables') renderMissables();
  else if (name === 'save') renderSave();
  else renderChecklist();
  renderProgress();
  renderMissablePill();
}
if (params.get('view')) {
  const v = params.get('view');
  location.replace(`#/${v === 'checklist' ? '' : v}`);
}
window.addEventListener('hashchange', route);
document.addEventListener('keydown', (e) => {
  if (e.key !== '/') return;
  const search = document.querySelector('input[type="search"]');
  if (search && document.activeElement !== search) { e.preventDefault(); search.focus(); }
});
route();
