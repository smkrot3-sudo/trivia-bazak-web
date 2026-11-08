(function () {
  'use strict';
  const $app = document.getElementById('app');
  const Q = window.QUESTIONS, CATS = window.CATEGORIES;

  // ---------- אחסון ----------
  // (בדיקות: ?u=x נותן לכל לשונית פרופיל נפרד)
  const PFX = 'tb_' + ((location.search.match(/[?&]u=(\w+)/) || [])[1] || '');
  const store = {
    get(k, d) { try { const v = localStorage.getItem(PFX + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(PFX + k, JSON.stringify(v)); } catch (e) {} }
  };
  const profile = store.get('profile', null) || {};
  if (!profile.pid) { profile.pid = 'p' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
  if (profile.sound === undefined) profile.sound = true;
  const saveProfile = () => store.set('profile', profile);
  saveProfile();

  // ---------- עזרים ----------
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const LEVELS = { easy: 'קל', medium: 'בינוני', hard: 'קשה', mixed: 'מעורב' };
  const LEVEL_DIFF = { easy: 1, medium: 2, hard: 3 };
  const Q_TIME = { easy: 20, medium: 15, hard: 12, mixed: 15 };
  const MODES = { classic: 'קלאסי', sprint: 'ספרינט 60 שניות', online: 'אונליין' };
  const KEYS = ['א', 'ב', 'ג', 'ד'];

  // ---------- ארץ עיר ----------
  const AE_LETTERS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ', 'ק', 'ר', 'ש', 'ת'];
  const AE_CATS = [
    { code: 'country', name: 'ארץ', icon: '🌍' },
    { code: 'city', name: 'עיר', icon: '🏙️' },
    { code: 'animal', name: 'חיה', icon: '🐾' },
    { code: 'plant', name: 'צומח', icon: '🌿' },
    { code: 'food', name: 'מאכל', icon: '🍽️' },
    { code: 'name', name: 'שם פרטי', icon: '🧑' },
    { code: 'job', name: 'מקצוע', icon: '💼' },
    { code: 'brand', name: 'מותג', icon: '🏷️' },
    { code: 'celeb', name: 'ידוען/סלב', icon: '⭐' },
    { code: 'object', name: 'חפץ בבית', icon: '🪑' },
    { code: 'sport', name: 'ענף ספורט', icon: '⚽' },
    { code: 'color', name: 'צבע', icon: '🎨' }
  ];
  const AE_CAT_BY_CODE = {}; AE_CATS.forEach(c => { AE_CAT_BY_CODE[c.code] = c; });
  const AE_TIMER_OPTS = { 60: '60 שניות', 90: '90 שניות', 120: '120 שניות' };
  const aeRandLetter = () => AE_LETTERS[Math.floor(Math.random() * AE_LETTERS.length)];
  const aeRandCats = () => shuffle(AE_CATS).slice(0, 6).map(c => c.code);
  const aeNorm = s => String(s || '').trim().replace(/\s+/g, ' ').toLowerCase();

  // ---------- מדריך ----------
  // בכל תכונה חדשה - להוסיף איבר כאן (GUIDE_MODES) ו/או ב-CHANGELOG, מהחדש לישן
  const GUIDE_MODES = [
    { icon: '⏱️', title: 'משחק יחיד', body: 'נגד השעון: קלאסי (10 שאלות, זמן לכל שאלה) או ספרינט (כמה שיותר תשובות נכונות בדקה). 4 רמות קושי ו-11+ נושאים לבחירה.' },
    { icon: '🗺️', title: 'קמפיין', body: '30 שלבים ברצף, הרמה עולה בהדרגה. כל 5 שלבים - שלב נושא ממוקד. צריך 60% ומעלה כדי לפתוח את השלב הבא.' },
    { icon: '🔤', title: 'ארץ עיר', body: 'המשחק הקלאסי: אות אקראית ו-6 קטגוריות, כותבים מילה שמתחילה באות. יחיד (נגד השעון, עם שיא אישי) או ראש בראש אונליין (3 סבבים, ניקוד לפי תקינות שמסמנים לבד).' },
    { icon: '👥', title: 'אונליין עם חברים', body: 'ראש בראש מהיר מול יריב אקראי, או חדר עם קוד של 4 תווים לעד 8 חברים, עם בחירת נושאים ורמה.' },
    { icon: '👫', title: 'חברים קבועים', body: 'מוסיפים חבר/ה לפי קוד אישי, ומזמינים ישר למשחק. ההזמנה מגיעה בזמן אמת אם האפליקציה פתוחה, ואפילו כהתראה לטלפון אם היא סגורה.' },
    { icon: '🏆', title: 'טבלת מובילים', body: 'השיאים של כל השחקנים, לכל מצב ורמה בנפרד.' }
  ];
  const CHANGELOG = [
    { date: '08/11/2026', title: '🔤 מצב משחק חדש: ארץ עיר', body: 'אות אקראית וקטגוריות, יחיד ואונליין ראש בראש.' },
    { date: '08/11/2026', title: '🔔 התראות Push אמיתיות', body: 'הזמנה למשחק מגיעה כהתראה לטלפון גם כשהאפליקציה סגורה.' },
    { date: '08/11/2026', title: '👫 חברים קבועים', body: 'הוספת חברים לפי קוד אישי, והזמנה ישירה למשחק.' },
    { date: '08/11/2026', title: '🎨 עיצוב ומיתוג מחדש', body: 'שם חדש - "ידעתי", לוגו, צבעים וטיפוגרפיה חדשים.' },
    { date: '08/11/2026', title: '📚 אלפי שאלות וקמפיין', body: 'מאגר השאלות הורחב לאלפי שאלות, נוסף מצב קמפיין (שלבים), ונושאים ייעודיים כמו גיימינג, הארי פוטר, מלחמת הכוכבים, מארוול, אווטאר ועוד.' },
    { date: '08/11/2026', title: '⚡ עדכונים חיים', body: 'מעכשיו האפליקציה מתעדכנת מעצמה - אין צורך בהתקנת APK חדש לכל שינוי תוכן.' },
    { date: '07/11/2026', title: '🔊 צלילים ושאלות נוספות', body: 'צליל קליק לכל כפתור, והרחבת מאגר השאלות הראשונית.' },
    { date: '07/11/2026', title: '🚀 גרסה ראשונה', body: 'המשחק עולה לאוויר: משחק יחיד ואונליין עם חברים.' }
  ];

  function guideScreen() {
    show(
      '<div class="topbar"><button class="iconbtn" id="back">→</button><h2>📖 מדריך</h2></div>' +
      brandmark(false) +
      '<div class="label" style="margin-top:4px">מצבי המשחק</div>' +
      GUIDE_MODES.map(m =>
        '<details class="card guide-item"><summary><span class="emoji">' + m.icon + '</span> ' + esc(m.title) + '</summary>' +
        '<div class="guide-body">' + esc(m.body) + '</div></details>'
      ).join('') +
      '<div class="label" style="margin-top:14px">מה חדש</div>' +
      '<div class="card">' + CHANGELOG.map(c =>
        '<div class="changelog-item"><div class="changelog-date">' + esc(c.date) + '</div>' +
        '<div class="changelog-title">' + esc(c.title) + '</div>' +
        '<div class="changelog-desc">' + esc(c.body) + '</div></div>'
      ).join('') + '</div>',
      home
    );
    on('#back', home);
  }

  // ---------- מיתוג ----------
  const BRAND = 'ידעתי';
  const BRAND_ICON =
    '<svg class="brand-icon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<defs><radialGradient id="bgrad" cx="32%" cy="26%" r="80%">' +
    '<stop offset="0%" stop-color="#ffe9ab"/><stop offset="55%" stop-color="#ffc845"/><stop offset="100%" stop-color="#e3a515"/>' +
    '</radialGradient></defs>' +
    '<circle cx="50" cy="50" r="48" fill="url(#bgrad)"/>' +
    '<path d="M58 16 L28 56 H46 L41 88 L76 42 H56 L58 16 Z" fill="#2b1800"/>' +
    '</svg>';
  function brandmark(withSub) {
    return '<div class="brandmark"><div class="brand-lockup">' + BRAND_ICON +
      '<h1 class="brand-word">' + BRAND + '</h1></div>' +
      (withSub ? '<p class="brand-sub">' + Q.length + ' שאלות · ' + Object.keys(CATS).length + ' נושאים</p>' : '') +
      '</div>';
  }

  let timers = [];
  let backHandler = null;
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
  function clearTimers() { timers.forEach(clearTimeout); timers = []; if (raf) cancelAnimationFrame(raf); raf = null; }
  let raf = null;

  function show(html, onBack) {
    clearTimers();
    closeModal();
    $app.innerHTML = '<div class="screen">' + html + '</div>';
    backHandler = onBack || null;
    window.scrollTo(0, 0);
  }
  const on = (sel, fn, ev) => { const el = typeof sel === 'string' ? $app.querySelector(sel) : sel; if (el) el.addEventListener(ev || 'click', fn); return el; };
  const onAll = (sel, fn) => $app.querySelectorAll(sel).forEach(el => el.addEventListener('click', () => fn(el)));

  let toastT;
  function toast(msg, ms) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms || 2200);
  }

  function modal(title, text, buttons) {
    closeModal();
    const bg = document.createElement('div'); bg.className = 'modal-bg'; bg.id = 'modal';
    bg.innerHTML = '<div class="modal"><h3>' + esc(title) + '</h3>' + (text ? '<div class="muted">' + esc(text) + '</div>' : '') +
      '<div class="row">' + buttons.map((b, i) => '<button class="btn small ' + (b.cls || '') + '" data-i="' + i + '">' + esc(b.label) + '</button>').join('') + '</div></div>';
    document.body.appendChild(bg);
    bg.querySelectorAll('button').forEach(btn => btn.onclick = () => { closeModal(); const b = buttons[+btn.dataset.i]; b.fn && b.fn(); });
  }
  function closeModal() { const m = document.getElementById('modal'); if (m) m.remove(); }

  // כפתור "חזור" של אנדרואיד
  window.onAndroidBack = function () {
    if (document.getElementById('modal')) { closeModal(); return true; }
    if (backHandler) { backHandler(); return true; }
    return false;
  };

  // טוקן Push מהצד האנדרואידי - נשמר בשרת כדי שאפשר לשלוח התראה אמיתית גם כשהאפליקציה סגורה
  window.onPushToken = function (token) {
    if (!token || !profile.pid) return;
    Net.savePushToken && Net.savePushToken(profile.pid, token).catch(() => {});
  };

  // הקשה על התראת הזמנה שהגיעה כשהאפליקציה היתה סגורה/ברקע
  window.onInviteTapped = function (inv) {
    if (!inv || !inv.room_code) return;
    const go = () => enterRoom(inv.room_code, { creating: false });
    if (!profile.name) nameScreen(go); else go();
  };

  // ---------- צליל ורטט ----------
  let actx = null;
  function beep(freq, dur, type) {
    if (!profile.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type || 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.18, actx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
      o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + dur);
    } catch (e) {}
  }
  const sfx = {
    good() { beep(660, .12); setTimeout(() => beep(990, .18), 90); },
    bad() { beep(180, .3, 'square'); vibrate(180); },
    tick() { beep(880, .05); },
    end() { beep(523, .15); setTimeout(() => beep(659, .15), 140); setTimeout(() => beep(784, .3), 280); },
    click() { beep(520, .035, 'sine'); }
  };
  function vibrate(ms) {
    if (!profile.sound) return;
    try { if (window.Android && Android.vibrate) Android.vibrate(ms); else if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {}
  }

  // כל לחיצה על כפתור בכל מסך (כולל כפתורי מודאל) משמיעה צליל קליק קצר,
  // לפני שהטיפול הספציפי בכפתור (כמו נכון/טעות) מתבצע
  document.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (btn && !btn.disabled) sfx.click();
  }, true);

  // ---------- בחירת שאלות ----------
  // cat יכול להיות: undefined/'all' (הכול), קוד נושא בודד, או מערך קודי נושאים
  function poolFor(level, cat) {
    const cats = Array.isArray(cat) ? cat : (cat && cat !== 'all' ? [cat] : null);
    const out = [];
    for (let i = 0; i < Q.length; i++) {
      const q = Q[i];
      if (level !== 'mixed' && q[1] !== LEVEL_DIFF[level]) continue;
      if (cats && cats.indexOf(q[0]) < 0) continue;
      out.push(i);
    }
    return out;
  }
  function pickQuestions(level, cat, n) {
    const pool = poolFor(level, cat);
    const seen = new Set(store.get('seen', []));
    const fresh = shuffle(pool.filter(i => !seen.has(i)));
    const old = shuffle(pool.filter(i => seen.has(i)));
    const ids = fresh.concat(old).slice(0, n);
    markSeen(ids);
    return ids;
  }
  function markSeen(ids) {
    const seen = store.get('seen', []).filter(i => ids.indexOf(i) < 0).concat(ids);
    store.set('seen', seen.slice(-Math.floor(Q.length * 0.7)));
  }

  function questionHtml(id, num, total) {
    const q = Q[id];
    const opts = shuffle([0, 1, 2, 3]);
    const c = CATS[q[0]];
    return {
      opts,
      html:
        '<div class="qcat">' + c.icon + ' ' + esc(c.name) + (total ? ' · שאלה ' + num + ' מתוך ' + total : '') + '</div>' +
        '<div class="question">' + esc(q[2]) + '</div>' +
        '<div class="answers">' + opts.map((o, i) =>
          '<button class="answer" data-o="' + o + '"><span class="k">' + KEYS[i] + '</span><span>' + esc(q[3 + o]) + '</span></button>').join('') +
        '</div>'
    };
  }

  // פס זמן חלק
  function runTimer(barSel, labelSel, seconds, onEnd, getExtra) {
    const bar = $app.querySelector(barSel), label = labelSel ? $app.querySelector(labelSel) : null;
    const start = performance.now();
    let lastSec = null, stopped = false;
    const api = {
      remaining: seconds, stop() { stopped = true; if (raf) cancelAnimationFrame(raf); },
      elapsed() { return (performance.now() - start) / 1000; }
    };
    function frame(now) {
      if (stopped) return;
      const extra = getExtra ? getExtra() : 0;
      const rem = Math.max(0, seconds - (now - start) / 1000 + extra);
      api.remaining = rem;
      if (bar) {
        bar.firstElementChild.style.transform = 'scaleX(' + Math.min(1, rem / seconds) + ')';
        bar.classList.toggle('low', rem <= Math.min(5, seconds * 0.3));
      }
      const s = Math.ceil(rem);
      if (label && s !== lastSec) { label.textContent = s; if (s <= 3 && s > 0 && lastSec !== null) sfx.tick(); lastSec = s; }
      if (rem <= 0) { stopped = true; onEnd(); return; }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return api;
  }

  // ================= מסכים =================

  function home() {
    if (!profile.name) return nameScreen(home);
    show(
      brandmark(true) +
      '<div class="card center">שלום, <b>' + esc(profile.name) + '</b> 👋 <a href="#" id="rename" class="muted" style="font-size:14px">שינוי שם</a></div>' +
      '<button class="btn primary" id="solo"><span class="emoji">⏱️</span><span class="col">משחק יחיד<span class="sub">נגד השעון, ברמה שתבחר</span></span></button>' +
      '<button class="btn secondary" id="campaign" style="--stripe:var(--accent)"><span class="emoji">🗺️</span><span class="col">קמפיין<span class="sub">התקדמו שלב אחר שלב, ' + CAMPAIGN_TOTAL + ' שלבים</span></span></button>' +
      '<button class="btn secondary" id="ae" style="--stripe:#2fbf71"><span class="emoji">🔤</span><span class="col">ארץ עיר<span class="sub">יחיד או ראש בראש - מילה שמתחילה באות</span></span></button>' +
      '<button class="btn secondary" id="online" style="--stripe:var(--accent2-b)"><span class="emoji">👥</span><span class="col">אונליין עם חברים<span class="sub">ראש בראש או חדר עם קוד</span></span></button>' +
      '<button class="btn secondary" id="friends" style="--stripe:var(--accent2-a)"><span class="emoji">👫</span><span class="col">חברים קבועים<span class="sub">הוסיפו חברים והזמינו אותם למשחק</span></span></button>' +
      '<button class="btn ghost" id="lb"><span class="emoji">🏆</span><span class="col">טבלת מובילים<span class="sub">השיאים של כל השחקנים</span></span></button>' +
      '<button class="btn ghost small" id="guide">📖 מדריך ומה חדש</button>' +
      '<div class="spacer"></div>' +
      '<button class="btn ghost small" id="sound">' + (profile.sound ? '🔊 צלילים ורטט: פועל' : '🔇 צלילים ורטט: כבוי') + '</button>'
    );
    on('#solo', soloSetup);
    on('#campaign', campaignMap);
    on('#ae', aeHome);
    on('#online', onlineMenu);
    on('#friends', friendsScreen);
    on('#lb', () => leaderboard());
    on('#guide', guideScreen);
    on('#rename', e => { e.preventDefault(); nameScreen(home); });
    on('#sound', () => { profile.sound = !profile.sound; saveProfile(); home(); });
    checkPendingInvites();
    if (unwatchInvites) unwatchInvites();
    unwatchInvites = Net.watchInvites(profile.pid, inv => showInviteBanner(inv));
  }

  function nameScreen(next) {
    show(
      brandmark(false) +
      '<div class="card"><div class="label">איך לקרוא לך? (יופיע לחברים ובטבלת המובילים)</div>' +
      '<input class="field" id="name" maxlength="16" placeholder="הכינוי שלך" value="' + esc(profile.name || '') + '"></div>' +
      '<button class="btn primary" id="ok">יאללה!</button>',
      profile.name ? next : null
    );
    const inp = $app.querySelector('#name');
    const go = () => {
      const v = inp.value.trim().slice(0, 16);
      if (!v) { toast('צריך לכתוב כינוי'); return; }
      profile.name = v; saveProfile(); next();
    };
    on('#ok', go);
    on(inp, e => { if (e.key === 'Enter') go(); }, 'keydown');
  }

  // ---------- משחק יחיד ----------
  const soloCfg = store.get('soloCfg', { mode: 'classic', level: 'easy', cat: 'all' });

  function chipsHtml(group, items, current) {
    return '<div class="chips">' + Object.keys(items).map(k =>
      '<button class="chip' + (k === current ? ' on' : '') + '" data-g="' + group + '" data-v="' + k + '">' + esc(items[k]) + '</button>').join('') + '</div>';
  }
  // בחירה מרובה (לדוגמה: כמה נושאים ספציפיים לחדר אונליין)
  function multiChipsHtml(group, items, selected) {
    const sel = new Set(selected || []);
    return '<div class="chips">' + Object.keys(items).map(k =>
      '<button class="chip' + (sel.has(k) ? ' on' : '') + '" data-g="' + group + '" data-v="' + k + '">' + esc(items[k]) + '</button>').join('') + '</div>';
  }

  function soloSetup() {
    const catItems = { all: '🎲 הכול' };
    Object.keys(CATS).forEach(k => catItems[k] = CATS[k].icon + ' ' + CATS[k].name);
    const best = store.get('best:' + soloCfg.mode + ':' + soloCfg.level + ':' + soloCfg.cat, 0);
    show(
      '<div class="topbar"><button class="iconbtn" id="back">→</button><h2>משחק יחיד</h2></div>' +
      '<div class="card"><div class="label">סוג משחק</div>' +
      chipsHtml('mode', { classic: '🎯 קלאסי – 10 שאלות', sprint: '⚡ ספרינט 60 שניות' }, soloCfg.mode) +
      '<div class="muted" style="font-size:14px;margin-top:10px">' + (soloCfg.mode === 'classic'
        ? 'זמן מוגבל לכל שאלה. ככל שעונים מהר יותר - יותר נקודות.'
        : 'כמה שיותר תשובות נכונות בדקה. טעות מורידה 3 שניות, רצף מוסיף בונוס.') + '</div></div>' +
      '<div class="card"><div class="label">רמת קושי</div>' + chipsHtml('level', LEVELS, soloCfg.level) + '</div>' +
      '<div class="card"><div class="label">נושא</div>' + chipsHtml('cat', catItems, soloCfg.cat) +
      (soloCfg.cat !== 'all' ? '<div class="muted" style="font-size:13px;margin-top:8px">רק משחקים בכל הנושאים נכנסים לטבלת המובילים</div>' : '') + '</div>' +
      '<div class="center muted">השיא שלך כאן: <b style="color:var(--accent)">' + best + '</b></div>' +
      '<div class="spacer"></div><button class="btn primary" id="go">התחל ▶</button>',
      home
    );
    on('#back', home);
    onAll('.chip', el => { soloCfg[el.dataset.g] = el.dataset.v; store.set('soloCfg', soloCfg); soloSetup(); });
    on('#go', () => soloGame(Object.assign({}, soloCfg)));
  }

  function confirmQuit(onYes) {
    modal('לצאת מהמשחק?', 'ההתקדמות במשחק הזה תאבד.', [
      { label: 'להמשיך לשחק', cls: 'primary' },
      { label: 'לצאת', fn: onYes }
    ]);
  }

  // לולאת משחק משותפת: N שאלות קבועות, טיימר לכל שאלה - משמשת גם למשחק קלאסי וגם לקמפיין
  function runQuizSession(ids, opts, onFinish) {
    const T = Q_TIME[opts.level];
    const st = { i: 0, score: 0, correct: 0, streak: 0, bestStreak: 0, answered: 0 };
    const quit = opts.onQuit || (() => confirmQuit(() => { clearTimers(); (opts.onQuitBack || home)(); }));

    function render() {
      if (st.i >= ids.length) { clearTimers(); onFinish({ score: st.score, correct: st.correct, total: ids.length, bestStreak: st.bestStreak }); return; }
      const id = ids[st.i];
      const qh = questionHtml(id, st.i + 1, ids.length);
      const hud =
        '<div class="hud"><button class="iconbtn" id="quit">✕</button>' +
        '<span class="pill score">⭐ ' + st.score + '</span>' +
        '<span class="pill">' + (st.i + 1) + '/' + ids.length + '</span>' +
        '<span class="spacer"></span><span class="bigtime" id="tl"></span></div>' +
        '<div class="timer" id="tb"><div></div></div>';
      $app.innerHTML = '<div class="screen">' + hud + '<div id="qarea" style="display:flex;flex-direction:column;gap:14px">' + qh.html + '<div class="flash" id="flash"></div></div></div>';
      backHandler = quit;
      on('#quit', quit);
      let locked = false;
      const qStart = performance.now();
      const qTimer = runTimer('#tb', '#tl', T, () => answer(null));
      $app.querySelectorAll('.answer').forEach(b => b.addEventListener('click', () => answer(b)));

      function answer(btn) {
        if (locked) return; locked = true;
        qTimer.stop();
        const ok = btn && btn.dataset.o === '0';
        const flash = $app.querySelector('#flash');
        $app.querySelectorAll('.answer').forEach(b => {
          if (b.dataset.o === '0') b.classList.add('correct');
          else if (b === btn) b.classList.add('wrong');
          else b.classList.add('dim');
        });
        st.answered++;
        if (ok) {
          st.correct++; st.streak++; st.bestStreak = Math.max(st.bestStreak, st.streak);
          const rem = Math.max(0, T - (performance.now() - qStart) / 1000);
          const pts = 100 + Math.round(100 * rem / T);
          st.score += pts;
          flash.className = 'flash good'; flash.textContent = '+' + pts + (st.streak >= 3 ? '  🔥 רצף ' + st.streak : '');
          sfx.good();
        } else {
          st.streak = 0;
          flash.textContent = btn ? 'טעות!' : 'נגמר הזמן!';
          flash.className = 'flash bad';
          sfx.bad();
        }
        st.i++;
        later(render, 1300);
      }
    }
    render();
  }

  function soloGame(cfg) {
    const sprint = cfg.mode === 'sprint';
    if (!sprint) {
      const ids = pickQuestions(cfg.level, cfg.cat, 10);
      if (!ids.length) { toast('אין שאלות לבחירה הזו'); return soloSetup(); }
      runQuizSession(ids, { level: cfg.level, onQuitBack: soloSetup }, summary =>
        soloResults(cfg, { score: summary.score, correct: summary.correct, answered: summary.total, bestStreak: summary.bestStreak }));
      return;
    }
    // ---------- ספרינט: טיימר רציף של 60 שניות, כמה שיותר שאלות ----------
    const ids = pickQuestions(cfg.level, cfg.cat, 999);
    if (!ids.length) { toast('אין שאלות לבחירה הזו'); return soloSetup(); }
    const st = { i: 0, score: 0, correct: 0, streak: 0, bestStreak: 0, penalty: 0, answered: 0 };
    const T = Q_TIME[cfg.level];
    let sprintTimer = null;
    const quit = () => confirmQuit(() => { if (sprintTimer) sprintTimer.stop(); soloSetup(); });

    function finish() {
      clearTimers();
      soloResults(cfg, st);
    }

    function render() {
      if (st.i >= ids.length) return finish();
      const id = ids[st.i];
      const qh = questionHtml(id, st.i + 1, 0);
      const hud =
        '<div class="hud"><button class="iconbtn" id="quit">✕</button>' +
        '<span class="pill score">⭐ ' + st.score + '</span>' +
        '<span class="pill">✔ ' + st.correct + '</span>' + (st.streak >= 2 ? '<span class="pill">🔥 ' + st.streak + '</span>' : '') +
        '<span class="spacer"></span><span class="bigtime" id="tl"></span></div>' +
        '<div class="timer" id="tb"><div></div></div>';
      if (sprintTimer) {
        // ספרינט: הטיימר ממשיך לרוץ, מחליפים רק את השאלה
        $app.querySelector('#qarea').innerHTML = qh.html + '<div class="flash" id="flash"></div>';
        const pills = $app.querySelector('.hud');
        pills.querySelector('.score').textContent = '⭐ ' + st.score;
        const p = pills.querySelectorAll('.pill');
        p[1].textContent = '✔ ' + st.correct;
        if (p[2]) p[2].remove();
        if (st.streak >= 2) { const s = document.createElement('span'); s.className = 'pill'; s.textContent = '🔥 ' + st.streak; p[1].after(s); }
      } else {
        $app.innerHTML = '<div class="screen">' + hud + '<div id="qarea" style="display:flex;flex-direction:column;gap:14px">' + qh.html + '<div class="flash" id="flash"></div></div></div>';
        backHandler = quit;
        on('#quit', quit);
      }
      let locked = false;
      const qStart = performance.now();
      if (!sprintTimer) sprintTimer = runTimer('#tb', '#tl', 60, finish, () => -st.penalty);
      $app.querySelectorAll('.answer').forEach(b => b.addEventListener('click', () => answer(b)));

      function answer(btn) {
        if (locked) return; locked = true;
        const ok = btn && btn.dataset.o === '0';
        const flash = $app.querySelector('#flash');
        $app.querySelectorAll('.answer').forEach(b => {
          if (b.dataset.o === '0') b.classList.add('correct');
          else if (b === btn) b.classList.add('wrong');
          else b.classList.add('dim');
        });
        st.answered++;
        if (ok) {
          st.correct++; st.streak++; st.bestStreak = Math.max(st.bestStreak, st.streak);
          const pts = 100 + Math.min(st.streak - 1, 5) * 20;
          st.score += pts;
          flash.className = 'flash good'; flash.textContent = '+' + pts + (st.streak >= 3 ? '  🔥 רצף ' + st.streak : '');
          sfx.good();
        } else {
          st.streak = 0;
          st.penalty += 3; flash.textContent = '−3 שניות';
          flash.className = 'flash bad';
          sfx.bad();
        }
        st.i++;
        later(render, ok ? 450 : 900);
      }
    }
    render();
  }

  function soloResults(cfg, st) {
    sfx.end();
    const key = 'best:' + cfg.mode + ':' + cfg.level + ':' + cfg.cat;
    const prev = store.get(key, 0);
    const isBest = st.score > prev;
    if (isBest) store.set(key, st.score);
    const canSubmit = cfg.cat === 'all' && st.score > 0;
    const pct = st.answered ? Math.round(100 * st.correct / st.answered) : 0;
    show(
      '<div class="topbar"><button class="iconbtn" id="back">→</button><h2>סיום!</h2></div>' +
      '<div class="center muted">' + esc(MODES[cfg.mode]) + ' · ' + esc(LEVELS[cfg.level]) + (cfg.cat !== 'all' ? ' · ' + esc(CATS[cfg.cat].name) : '') + '</div>' +
      '<div class="bigscore">' + st.score + '</div>' +
      '<div class="center">' + (isBest ? '<span class="badge">🎉 שיא אישי חדש!</span>' : '<span class="muted">השיא שלך: ' + prev + '</span>') + '</div>' +
      '<div class="stats"><div class="stat"><b>' + st.correct + '/' + st.answered + '</b><span>נכונות</span></div>' +
      '<div class="stat"><b>' + pct + '%</b><span>דיוק</span></div>' +
      '<div class="stat"><b>' + st.bestStreak + '</b><span>רצף הכי ארוך</span></div></div>' +
      '<div class="center muted" id="sub">' + (canSubmit ? 'שומר בטבלת המובילים...' : '') + '</div>' +
      '<div class="spacer"></div>' +
      '<button class="btn primary" id="again">שחק שוב 🔁</button>' +
      '<div class="row"><button class="btn small" id="lb">🏆 מובילים</button><button class="btn small" id="home">🏠 בית</button></div>',
      soloSetup
    );
    on('#back', soloSetup);
    on('#again', () => soloGame(cfg));
    on('#home', home);
    on('#lb', () => leaderboard(cfg.mode, cfg.level));
    if (canSubmit) {
      Net.submitScore({ player_id: profile.pid, name: profile.name, mode: cfg.mode, level: cfg.level, score: Math.min(st.score, 5000), correct: Math.min(st.correct, 100) })
        .then(() => { const s = $app.querySelector('#sub'); if (s) s.textContent = '✓ נשמר בטבלת המובילים'; })
        .catch(() => { const s = $app.querySelector('#sub'); if (s) s.textContent = 'לא נשמר בטבלה (אין חיבור לאינטרנט)'; });
    }
  }

  // ---------- קמפיין ----------
  const CAMPAIGN_TOTAL = 30;
  const CAMPAIGN_QPS = 8;
  function campaignLevel(n) {
    if (n <= 8) return 'easy';
    if (n <= 16) return 'medium';
    if (n <= 24) return 'hard';
    return 'mixed';
  }
  // כל שלב חמישי הוא שלב "נושא" הממוקד בנושא אחד בלבד, במחזוריות על פני כל הנושאים
  function campaignThemeCat(n) {
    if (n % 5 !== 0) return null;
    const cats = Object.keys(CATS);
    return cats[(Math.floor(n / 5) - 1) % cats.length];
  }
  function campaignProgress() { return store.get('campaign', { unlocked: 1, stars: {} }); }
  function saveCampaignProgress(p) { store.set('campaign', p); }

  function campaignMap() {
    const p = campaignProgress();
    const tiles = [];
    for (let n = 1; n <= CAMPAIGN_TOTAL; n++) {
      const locked = n > p.unlocked;
      const stars = p.stars[n] || 0;
      const theme = campaignThemeCat(n);
      const cls = 'stage' + (locked ? ' locked' : '') + (stars ? ' done' : '');
      tiles.push(
        '<button class="' + cls + '" data-n="' + n + '"' + (locked ? ' disabled' : '') + '>' +
        '<span class="stageicon">' + (locked ? '🔒' : (theme ? CATS[theme].icon : n)) + '</span>' +
        '<span class="stagenum">שלב ' + n + '</span>' +
        (stars ? '<span class="stagestars">' + '★'.repeat(stars) + '☆'.repeat(3 - stars) + '</span>' : (theme && !locked ? '<span class="stagestars muted">' + esc(CATS[theme].name) + '</span>' : '')) +
        '</button>'
      );
    }
    show(
      '<div class="topbar"><button class="iconbtn" id="back">→</button><h2>🗺️ קמפיין</h2></div>' +
      '<div class="muted center">' + CAMPAIGN_TOTAL + ' שלבים · כל 5 שלבים - נושא מיוחד · צריך 60% ומעלה כדי לעבור</div>' +
      '<div class="stagegrid">' + tiles.join('') + '</div>',
      home
    );
    on('#back', home);
    onAll('.stage:not([disabled])', el => campaignPlay(+el.dataset.n));
  }

  function campaignPlay(n) {
    const level = campaignLevel(n);
    const theme = campaignThemeCat(n);
    const ids = pickQuestions(level, theme || 'all', CAMPAIGN_QPS);
    if (!ids.length) { toast('אין מספיק שאלות לשלב הזה'); return campaignMap(); }
    runQuizSession(ids, { level, onQuit: () => confirmQuit(() => { clearTimers(); campaignMap(); }) },
      summary => campaignResults(n, summary));
  }

  function campaignResults(n, summary) {
    sfx.end();
    const pct = summary.total ? Math.round(100 * summary.correct / summary.total) : 0;
    const passed = pct >= 60;
    const stars = !passed ? 0 : (pct >= 100 ? 3 : pct >= 80 ? 2 : 1);
    const p = campaignProgress();
    if (passed) {
      p.stars[n] = Math.max(p.stars[n] || 0, stars);
      if (n === p.unlocked && n < CAMPAIGN_TOTAL) p.unlocked = n + 1;
      saveCampaignProgress(p);
    }
    const isLast = n === CAMPAIGN_TOTAL && passed;
    const head = isLast ? 'ניצחת את הקמפיין! 🏆' : !passed ? 'לא עבר השלב הפעם 😕' : 'שלב ' + n + ' הושלם! 🎉';
    show(
      '<div class="center" style="font-size:30px;font-weight:900;margin-top:16px">' + head + '</div>' +
      (passed ? '<div class="center" style="font-size:40px">' + '★'.repeat(stars) + '☆'.repeat(3 - stars) + '</div>' : '') +
      '<div class="stats"><div class="stat"><b>' + summary.correct + '/' + summary.total + '</b><span>נכונות</span></div>' +
      '<div class="stat"><b>' + pct + '%</b><span>דיוק</span></div>' +
      '<div class="stat"><b>' + summary.score + '</b><span>ניקוד</span></div></div>' +
      '<div class="spacer"></div>' +
      (passed && !isLast ? '<button class="btn primary" id="next">השלב הבא ▶</button>' : '') +
      '<div class="row"><button class="btn small" id="retry">נסה שוב 🔁</button><button class="btn small" id="map">🗺️ מפה</button></div>',
      campaignMap
    );
    if (passed && !isLast) on('#next', () => campaignPlay(n + 1));
    on('#retry', () => campaignPlay(n));
    on('#map', campaignMap);
  }

  // ---------- טבלת מובילים ----------
  let lbState = { mode: 'classic', level: 'easy' };
  function leaderboard(mode, level) {
    if (mode) lbState.mode = mode;
    if (level) lbState.level = level;
    show(
      '<div class="topbar"><button class="iconbtn" id="back">→</button><h2>🏆 טבלת מובילים</h2></div>' +
      chipsHtml('mode', { classic: 'קלאסי', sprint: 'ספרינט', online: 'אונליין' }, lbState.mode) +
      chipsHtml('level', LEVELS, lbState.level) +
      '<div id="lbl"><div class="spinner"></div></div>',
      home
    );
    on('#back', home);
    onAll('.chip', el => { lbState[el.dataset.g] = el.dataset.v; leaderboard(); });
    const want = lbState.mode + lbState.level;
    Net.topScores(lbState.mode, lbState.level).then(rows => {
      if (want !== lbState.mode + lbState.level) return;
      const box = $app.querySelector('#lbl'); if (!box) return;
      const seen = {}, best = [];
      rows.forEach(r => { if (!seen[r.player_id]) { seen[r.player_id] = 1; best.push(r); } });
      if (!best.length) { box.innerHTML = '<div class="card center muted">עוד אין תוצאות כאן. תהיה הראשון! 🚀</div>'; return; }
      const medals = ['🥇', '🥈', '🥉'];
      box.innerHTML = '<div class="list">' + best.slice(0, 25).map((r, i) =>
        '<div class="li' + (r.player_id === profile.pid ? ' me' : '') + (i === 0 ? ' top1' : '') + '"><span class="rank">' + (medals[i] || (i + 1)) + '</span>' +
        '<span class="name">' + esc(r.name) + '</span><span class="tag">' + r.correct + ' נכונות</span><span class="pts">' + r.score + '</span></div>').join('') + '</div>';
    }).catch(() => {
      const box = $app.querySelector('#lbl');
      if (box) box.innerHTML = '<div class="card center">📡 אין חיבור לאינטרנט<br><span class="muted">טבלת המובילים זמינה רק כשמחוברים</span></div>';
    });
  }

  // ================= חברים קבועים =================

  let unwatchInvites = null;
  let shownInviteIds = new Set();

  function checkPendingInvites() {
    Net.listPendingInvites(profile.pid).then(list => {
      const fresh = (list || []).find(inv => !shownInviteIds.has(inv.id));
      if (fresh) showInviteBanner(fresh);
    }).catch(() => {});
  }

  function showInviteBanner(inv) {
    if (shownInviteIds.has(inv.id)) return;
    shownInviteIds.add(inv.id);
    modal('🎮 הוזמנת למשחק!', inv.from_name + ' מזמין/ה אותך לשחק', [
      { label: 'להצטרף עכשיו', cls: 'primary', fn: () => { Net.consumeInvite(inv.id).catch(() => {}); enterRoom(inv.room_code, { creating: false }); } },
      { label: 'לא עכשיו', fn: () => { Net.consumeInvite(inv.id).catch(() => {}); } }
    ]);
  }

  function friendsScreen() {
    if (!profile.name) return nameScreen(friendsScreen);
    show(
      '<div class="topbar"><button class="iconbtn" id="back">→</button><h2>👫 חברים קבועים</h2></div>' +
      '<div class="card center"><div class="label">הקוד שלך - שלחו לחברים כדי שיוסיפו אתכם</div>' +
      '<div style="font-weight:900;font-size:17px;word-break:break-all;direction:ltr;color:var(--accent)">' + esc(profile.pid) + '</div>' +
      '<button class="btn small blue" id="shareMyCode" style="margin-top:10px">📤 שלח את הקוד שלי</button></div>' +
      '<div class="card"><div class="label">הוספת חבר/ה לפי קוד</div>' +
      '<input class="field" id="fcode" placeholder="הדבק כאן את הקוד שקיבלת" autocomplete="off">' +
      '<div style="height:8px"></div>' +
      '<input class="field" id="fname" maxlength="16" placeholder="איך לקרוא לו/לה?">' +
      '<button class="btn primary small" id="addf" style="margin-top:10px">➕ הוסף/י חבר/ה</button></div>' +
      '<div class="label" style="margin-top:4px">הרשימה שלך</div>' +
      '<div id="flist"><div class="spinner"></div></div>',
      home
    );
    on('#back', home);
    on('#shareMyCode', shareMyFriendCode);
    on('#addf', () => {
      const code = $app.querySelector('#fcode').value.trim();
      const name = $app.querySelector('#fname').value.trim().slice(0, 16);
      if (!code) { toast('צריך להדביק קוד'); return; }
      if (code === profile.pid) { toast('זה הקוד שלך 🙂'); return; }
      if (!name) { toast('צריך לתת שם לחבר/ה'); return; }
      Net.addFriend(profile.pid, code, name).then(() => { toast('נוסף/ה לחברים! 🎉'); friendsScreen(); })
        .catch(() => toast('לא הצלחתי להוסיף - בדוק/י חיבור לאינטרנט'));
    });
    renderFriendsList();
  }

  function renderFriendsList() {
    Net.listFriends(profile.pid).then(rows => {
      const box = $app.querySelector('#flist'); if (!box) return;
      if (!rows.length) { box.innerHTML = '<div class="card center muted">עוד אין חברים ברשימה. הוסיפו לפי קוד למעלה 👆</div>'; return; }
      box.innerHTML = '<div class="list">' + rows.map(f =>
        '<div class="li"><span class="rank">🙂</span><span class="name">' + esc(f.friend_name) + '</span>' +
        '<button class="btn small blue" data-invite="' + esc(f.friend_pid) + '" data-name="' + esc(f.friend_name) + '" style="flex:none">🎮 הזמן/י</button>' +
        '<button class="iconbtn" data-remove="' + esc(f.friend_pid) + '" style="flex:none;width:38px;height:38px">🗑️</button></div>'
      ).join('') + '</div>';
      box.querySelectorAll('[data-invite]').forEach(btn => btn.addEventListener('click', () => inviteFriend(btn.dataset.invite, btn.dataset.name)));
      box.querySelectorAll('[data-remove]').forEach(btn => btn.addEventListener('click', () => {
        modal('להסיר מהחברים?', '', [{ label: 'להשאיר', cls: 'primary' }, {
          label: 'להסיר', fn: () => Net.removeFriend(profile.pid, btn.dataset.remove).then(renderFriendsList).catch(() => toast('לא הצלחתי להסיר'))
        }]);
      }));
    }).catch(() => {
      const box = $app.querySelector('#flist');
      if (box) box.innerHTML = '<div class="card center">📡 אין חיבור לאינטרנט<br><span class="muted">רשימת החברים זמינה רק כשמחוברים</span></div>';
    });
  }

  function inviteFriend(friendPid, friendName) {
    const code = makeCode();
    toast('שולח/ת הזמנה ל-' + friendName + '...');
    Net.sendInvite({ from_pid: profile.pid, from_name: profile.name, to_pid: friendPid, room_code: code, mode: 'room' })
      .then(() => { toast('ההזמנה נשלחה! 📬 פותח חדר...'); enterRoom(code, { creating: true }); })
      .catch(() => toast('לא הצלחתי לשלוח הזמנה - בדוק/י חיבור לאינטרנט'));
  }

  // ================= אונליין =================

  const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const makeCode = () => Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
  function hashCode(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36).toUpperCase(); }

  function onlineMenu() {
    if (!profile.name) return nameScreen(onlineMenu);
    show(
      '<div class="topbar"><button class="iconbtn" id="back">→</button><h2>👥 אונליין</h2></div>' +
      '<button class="btn primary" id="quick"><span class="emoji">⚔️</span><span class="col">ראש בראש מהיר<span class="sub">מצא יריב אקראי ושחקו מיד</span></span></button>' +
      '<button class="btn blue" id="create"><span class="emoji">🏠</span><span class="col">צור חדר<span class="sub">קבל קוד ושלח לחברים (עד 8 שחקנים)</span></span></button>' +
      '<div class="card"><div class="label">יש לך קוד מחבר?</div>' +
      '<input class="field code" id="code" maxlength="4" placeholder="קוד" autocomplete="off" autocapitalize="characters">' +
      '<button class="btn" id="join" style="margin-top:10px">הצטרף לחדר</button></div>',
      home
    );
    on('#back', home);
    on('#quick', quickMatch);
    on('#create', () => enterRoom(makeCode(), { creating: true }));
    const inp = $app.querySelector('#code');
    const join = () => {
      const c = inp.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (c.length !== 4) { toast('הקוד צריך להיות 4 תווים'); return; }
      enterRoom(c, { creating: false });
    };
    on('#join', join);
    on(inp, e => { if (e.key === 'Enter') join(); }, 'keydown');
  }

  function connecting(text, onCancel) {
    show('<div class="spacer"></div><div class="spinner"></div><div class="center" style="font-size:20px;font-weight:800">' + esc(text) + '</div><div class="spacer"></div>' +
      (onCancel ? '<button class="btn" id="cancel">ביטול</button>' : ''), onCancel);
    if (onCancel) on('#cancel', onCancel);
  }

  // ---------- ראש בראש מהיר ----------
  function quickMatch() {
    let handle = null, done = false;
    const cancel = () => { done = true; if (handle) handle.leave(); onlineMenu(); };
    connecting('מחפש יריב...', cancel);
    const meta = { pid: profile.pid, name: profile.name, t: Date.now() };
    Net.join('matchmaking', meta, {
      onPresence(list) {
        if (done) return;
        const sorted = list.slice().sort((a, b) => (a.t - b.t) || (a.pid < b.pid ? -1 : 1));
        const a = sorted[0], b = sorted[1];
        if (!a || !b || (a.pid !== profile.pid && b.pid !== profile.pid)) {
          const s = $app.querySelector('.center'); if (s) s.textContent = 'מחפש יריב... (' + list.length + ' מחפשים כרגע)';
          return;
        }
        done = true;
        const other = a.pid === profile.pid ? b : a;
        const code = 'M' + hashCode(a.pid + '|' + b.pid);
        setTimeout(() => { if (handle) handle.leave(); }, 300);
        toast('נמצא יריב: ' + other.name + ' ⚔️');
        enterRoom(code, { creating: a.pid === profile.pid, quick: true, hostPid: a.pid });
      }
    }).then(h => { handle = h; if (done) h.leave(); })
      .catch(() => { if (!done) { done = true; noConnection(); } });
  }

  function noConnection() {
    show('<div class="spacer"></div><div class="center" style="font-size:56px">📡</div>' +
      '<div class="center" style="font-size:20px;font-weight:800">אין חיבור לשרת</div>' +
      '<div class="center muted">בדוק שיש אינטרנט ונסה שוב</div><div class="spacer"></div>' +
      '<button class="btn primary" id="retry">חזרה</button>', onlineMenu);
    on('#retry', onlineMenu);
  }

  // ---------- חדר ----------
  let room = null;

  function enterRoom(code, opts) {
    if (room) leaveRoom(true);
    const r = room = {
      code, opts, handle: null, players: [], phase: 'joining',
      settings: { level: 'mixed', count: 10, cats: 'all' },
      qids: [], qi: -1, scores: {}, answers: {}, revealed: -1, hostTimer: null,
      wasHost: false, gotHello: false, current: null, myAnswer: null,
      me: { pid: profile.pid, name: profile.name, joinedAt: Date.now(), c: opts.creating ? 1 : 0 }
    };
    connecting(opts.quick ? 'מתחבר למשחק...' : opts.creating ? 'יוצר חדר...' : 'מצטרף לחדר ' + code + '...', () => leaveRoom());

    Net.join('room-' + code, r.me, {
      onPresence: list => { if (room === r) onPresence(r, list); },
      onMessage: msg => { if (room === r) onMessage(r, msg); },
      onStatus: () => { if (room === r) toast('החיבור לשרת נקטע...'); }
    }).then(h => {
      if (room !== r) { h.leave(); return; }
      r.handle = h;
      if (opts.creating) { r.phase = 'lobby'; renderLobby(r); if (opts.quick) maybeAutoStart(r); }
      else {
        send(r, { t: 'hello', pid: r.me.pid, name: r.me.name });
        // מחכים לתשובה מהמארח
        const wait = opts.quick ? 10000 : 4000;
        setTimeout(() => {
          if (room !== r || r.phase !== 'joining') return;
          leaveRoom(true);
          if (opts.quick) { toast('היריב לא התחבר, מחפש שוב...'); quickMatch(); }
          else { modal('החדר לא נמצא', 'בדוק את הקוד ושהחבר עדיין בחדר.', [{ label: 'הבנתי', cls: 'primary' }]); }
        }, wait);
      }
    }).catch(() => { if (room === r) { room = null; noConnection(); } });
  }

  function leaveRoom(silent) {
    const r = room; room = null;
    if (!r) return;
    clearTimeout(r.hostTimer);
    if (r.handle) r.handle.leave();
    if (!silent) onlineMenu();
  }

  // המארח: יוצר החדר כל עוד הוא בחדר, אחריו מי שנכנס הכי מוקדם
  const sortPlayers = list => list.slice().sort((a, b) => ((b.c | 0) - (a.c | 0)) || (a.joinedAt - b.joinedAt) || (a.pid < b.pid ? -1 : 1));
  const hostPid = r => r.players.length ? r.players[0].pid : r.me.pid;
  const amHost = r => hostPid(r) === r.me.pid;

  function send(r, msg) { if (r.handle) r.handle.send(msg); }
  function sendAll(r, msg) { send(r, msg); onMessage(r, msg); }

  function onPresence(r, list) {
    const before = r.players.map(p => p.pid);
    r.players = sortPlayers(list);
    if (!r.players.some(p => p.pid === r.me.pid)) r.players.push(r.me);
    const now = r.players.map(p => p.pid);
    // הודעות על כניסה/יציאה
    if (r.phase !== 'joining') {
      now.filter(p => before.indexOf(p) < 0 && p !== r.me.pid).forEach(pid => { const p = r.players.find(x => x.pid === pid); if (p) toast(p.name + ' הצטרף/ה'); });
      before.filter(p => now.indexOf(p) < 0).forEach(pid => { const n = r.scores[pid] ? r.scores[pid].name : 'שחקן'; toast(n + ' יצא/ה'); });
    }
    const host = amHost(r);
    if (host && !r.wasHost && r.phase !== 'lobby' && r.phase !== 'joining') hostTakeOver(r);
    r.wasHost = host;
    if (r.phase === 'lobby') { renderLobby(r); maybeAutoStart(r); }
    if (r.phase === 'question' && host) hostCheckAll(r);
  }

  function maybeAutoStart(r) {
    if (r.opts.quick && r.phase === 'lobby' && amHost(r) && r.players.length >= 2 && !r.autoStarted) {
      r.autoStarted = true;
      later(() => { if (room === r && r.players.length >= 2) hostStart(r); else r.autoStarted = false; }, 900);
    }
  }

  function onMessage(r, m) {
    switch (m.t) {
      case 'hello':
        if (amHost(r)) send(r, { t: 'settings', settings: r.settings, phase: r.phase === 'lobby' || r.phase === 'joining' ? 'lobby' : 'game' });
        break;
      case 'settings':
        r.settings = m.settings;
        if (r.phase === 'joining') {
          if (m.phase !== 'lobby') {
            leaveRoom(true);
            modal('המשחק כבר התחיל', 'נסה להצטרף שוב כשהסבב הנוכחי ייגמר.', [{ label: 'הבנתי', cls: 'primary', fn: onlineMenu }]);
            return;
          }
          r.phase = 'lobby'; renderLobby(r); maybeAutoStart(r);
        } else if (m.phase === 'lobby') {
          if (r.phase !== 'lobby') { r.phase = 'lobby'; r.autoStarted = false; }
          renderLobby(r); maybeAutoStart(r);
        }
        break;
      case 'start':
        if (r.phase === 'joining') r.phase = 'lobby'; // הגענו בדיוק כשהמשחק התחיל - מצטרפים
        r.qids = m.qids; r.settings = m.settings; r.qi = -1; r.revealed = -1; r.answers = {};
        r.scores = {};
        r.players.forEach(p => r.scores[p.pid] = { name: p.name, score: 0, correct: 0 });
        r.phase = 'countdown';
        renderCountdown(r);
        if (amHost(r)) { clearTimeout(r.hostTimer); r.hostTimer = setTimeout(() => sendAll(r, { t: 'q', qi: 0 }), 3300); }
        break;
      case 'q':
        if (r.phase === 'joining' || m.qi <= r.qi) return;
        r.qi = m.qi; r.phase = 'question'; r.myAnswer = null;
        renderOnlineQuestion(r);
        if (amHost(r)) hostScheduleReveal(r);
        break;
      case 'ans': {
        const a = r.answers[m.qi] = r.answers[m.qi] || {};
        if (a[m.pid]) return;
        a[m.pid] = { ok: m.ok, pts: m.pts };
        const s = r.scores[m.pid] = r.scores[m.pid] || { name: m.name, score: 0, correct: 0 };
        s.score += m.pts; if (m.ok) s.correct++;
        if (m.qi === r.qi && r.phase === 'question') updateWaiting(r);
        if (amHost(r)) hostCheckAll(r);
        break;
      }
      case 'reveal':
        if (m.qi !== r.qi || r.phase !== 'question') return;
        r.scores = m.scores; r.phase = 'reveal';
        renderReveal(r);
        break;
      case 'end':
        if (r.phase === 'end') return;
        r.scores = m.scores; r.phase = 'end';
        renderOnlineResults(r);
        break;
    }
  }

  // ----- פעולות מארח -----
  function hostStart(r) {
    const ids = pickQuestions(r.settings.level, r.settings.cats || 'all', r.settings.count);
    if (!ids.length) { toast('אין מספיק שאלות לנושאים שנבחרו'); return; }
    sendAll(r, { t: 'start', qids: ids, settings: r.settings });
  }
  function hostScheduleReveal(r) {
    clearTimeout(r.hostTimer);
    const qi = r.qi;
    r.hostTimer = setTimeout(() => hostReveal(r, qi), Q_TIME[r.settings.level] * 1000 + 1500);
    hostCheckAll(r);
  }
  function hostCheckAll(r) {
    if (r.phase !== 'question') return;
    const a = r.answers[r.qi] || {};
    if (r.players.every(p => a[p.pid])) {
      const qi = r.qi;
      clearTimeout(r.hostTimer);
      r.hostTimer = setTimeout(() => hostReveal(r, qi), 700);
    }
  }
  function hostReveal(r, qi) {
    if (room !== r || r.revealed >= qi || r.qi !== qi) return;
    r.revealed = qi;
    sendAll(r, { t: 'reveal', qi, scores: r.scores });
    clearTimeout(r.hostTimer);
    r.hostTimer = setTimeout(() => {
      if (room !== r) return;
      if (qi + 1 < r.qids.length) sendAll(r, { t: 'q', qi: qi + 1 });
      else sendAll(r, { t: 'end', scores: r.scores });
    }, 3500);
  }
  function hostTakeOver(r) {
    // המארח הקודם יצא - ממשיכים מאיפה שהוא עצר
    toast('אתה המארח עכשיו 👑');
    if (r.phase === 'countdown') { clearTimeout(r.hostTimer); r.hostTimer = setTimeout(() => sendAll(r, { t: 'q', qi: 0 }), 2000); }
    else if (r.phase === 'question') hostScheduleReveal(r);
    else if (r.phase === 'reveal') { r.revealed = r.qi - 1; hostReveal(r, r.qi); }
    if (r.phase === 'lobby') renderLobby(r);
  }

  // ----- תצוגות אונליין -----
  function shareCode(code) {
    const text = 'בוא לשחק איתי ב-' + BRAND + ' ⚡ קוד החדר: ' + code;
    try {
      if (window.Android && Android.share) { Android.share(text); return; }
      if (navigator.share) { navigator.share({ text }).catch(() => {}); return; }
      navigator.clipboard.writeText(text).then(() => toast('הועתק! הדבק לחברים'), () => toast('הקוד: ' + code));
    } catch (e) { toast('הקוד: ' + code); }
  }

  function shareMyFriendCode() {
    const text = 'הוסף/י אותי כחבר/ה ב-' + BRAND + ' ⚡ הקוד שלי: ' + profile.pid;
    try {
      if (window.Android && Android.share) { Android.share(text); return; }
      if (navigator.share) { navigator.share({ text }).catch(() => {}); return; }
      navigator.clipboard.writeText(text).then(() => toast('הועתק! הדבק/י לחבר/ה'), () => toast('הקוד: ' + profile.pid));
    } catch (e) { toast('הקוד: ' + profile.pid); }
  }

  function renderLobby(r) {
    const host = amHost(r);
    const hp = hostPid(r);
    const players = r.players.length ? r.players : [r.me];
    const confirmLeave = () => modal('לצאת מהחדר?', '', [{ label: 'להישאר', cls: 'primary' }, { label: 'לצאת', fn: () => leaveRoom() }]);
    show(
      '<div class="topbar"><button class="iconbtn" id="back">→</button><h2>' + (r.opts.quick ? '⚔️ ראש בראש' : '🏠 חדר משחק') + '</h2></div>' +
      (r.opts.quick ? '<div class="center muted">המשחק מתחיל אוטומטית...</div>' :
        '<div class="card center"><div class="label">קוד החדר</div><div class="roomcode">' + esc(r.code) + '</div>' +
        '<button class="btn small blue" id="share">📤 שלח לחברים</button></div>') +
      '<div class="card"><div class="label">שחקנים (' + players.length + '/8)</div><div class="list">' +
      players.map(p => '<div class="li' + (p.pid === r.me.pid ? ' me' : '') + '"><span class="rank">' + (p.pid === hp ? '👑' : '🙂') + '</span><span class="name">' + esc(p.name) + '</span>' +
        (p.pid === r.me.pid ? '<span class="tag">את/ה</span>' : '') + '</div>').join('') + '</div></div>' +
      '<div class="card"><div class="label">הגדרות' + (host ? '' : ' (המארח קובע)') + '</div>' +
      (host ? chipsHtml('level', LEVELS, r.settings.level) + '<div style="height:8px"></div>' + chipsHtml('count', { 10: '10 שאלות', 15: '15 שאלות' }, String(r.settings.count))
        : '<div>רמה: <b>' + esc(LEVELS[r.settings.level]) + '</b> · <b>' + r.settings.count + '</b> שאלות</div>') + '</div>' +
      (!r.opts.quick ?
        '<div class="card"><div class="label">נושאים' + (host ? ' (אפשר לבחור כמה)' : '') + '</div>' +
        (host ? multiChipsHtml('cats', topicChipItems(), r.settings.cats === 'all' ? ['all'] : r.settings.cats)
          : '<div>' + (r.settings.cats === 'all' ? 'כל הנושאים' : (r.settings.cats || []).map(c => CATS[c] ? esc(CATS[c].name) : c).join(', ')) + '</div>') + '</div>'
        : '') +
      '<div class="spacer"></div>' +
      (host && !r.opts.quick
        ? '<button class="btn primary" id="start"' + (players.length < 2 ? ' disabled' : '') + '>' + (players.length < 2 ? 'ממתין לשחקנים נוספים...' : 'התחל משחק ▶') + '</button>'
        : (!r.opts.quick ? '<div class="center muted">⏳ ממתין שהמארח יתחיל את המשחק</div>' : '')),
      confirmLeave
    );
    on('#back', confirmLeave);
    on('#share', () => shareCode(r.code));
    if (host) {
      onAll('.chip', el => {
        const g = el.dataset.g, v = el.dataset.v;
        if (g === 'level') r.settings.level = v;
        else if (g === 'count') r.settings.count = +v;
        else if (g === 'cats') {
          if (v === 'all') { r.settings.cats = 'all'; }
          else {
            const arr = r.settings.cats === 'all' ? [] : r.settings.cats.slice();
            const idx = arr.indexOf(v);
            if (idx >= 0) arr.splice(idx, 1); else arr.push(v);
            r.settings.cats = arr.length ? arr : 'all';
          }
        }
        sendAll(r, { t: 'settings', settings: r.settings, phase: 'lobby' });
      });
      on('#start', () => { if (r.players.length >= 2 && room === r) hostStart(r); });
    }
  }
  function topicChipItems() {
    const items = { all: '🎲 הכול' };
    Object.keys(CATS).forEach(k => items[k] = CATS[k].icon + ' ' + CATS[k].name);
    return items;
  }

  function renderCountdown(r) {
    const quitGame = () => confirmQuit(() => leaveRoom());
    show('<div class="center muted" style="margin-top:30px">' + esc(LEVELS[r.settings.level]) + ' · ' + r.qids.length + ' שאלות · ' + r.players.length + ' שחקנים</div>' +
      '<div class="countdown" id="cd">3</div><div class="center" style="font-weight:800;font-size:20px">התכוננו!</div><div class="spacer"></div>', quitGame);
    let n = 3;
    const tick = () => { n--; const el = $app.querySelector('#cd'); if (el && n > 0) { el.textContent = n; el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; sfx.tick(); later(tick, 1000); } };
    sfx.tick(); later(tick, 1000);
  }

  function scoreList(r, qi) {
    const ranked = Object.keys(r.scores).map(pid => Object.assign({ pid }, r.scores[pid])).sort((a, b) => b.score - a.score);
    const a = qi != null ? (r.answers[qi] || {}) : null;
    return '<div class="list">' + ranked.map((p, i) =>
      '<div class="li' + (p.pid === r.me.pid ? ' me' : '') + '"><span class="rank">' + (i + 1) + '</span><span class="name">' + esc(p.name) + '</span>' +
      (a ? (a[p.pid] && a[p.pid].ok ? '<span class="tick">✓ +' + a[p.pid].pts + '</span>' : '<span class="cross">✗</span>') : '') +
      '<span class="pts">' + p.score + '</span></div>').join('') + '</div>';
  }

  function renderOnlineQuestion(r) {
    const id = r.qids[r.qi];
    const T = Q_TIME[r.settings.level];
    const qh = questionHtml(id, r.qi + 1, r.qids.length);
    const my = r.scores[r.me.pid] || { score: 0 };
    const quitGame = () => confirmQuit(() => leaveRoom());
    show(
      '<div class="hud"><button class="iconbtn" id="quit">✕</button><span class="pill score">⭐ ' + my.score + '</span>' +
      '<span class="pill">' + (r.qi + 1) + '/' + r.qids.length + '</span><span class="spacer"></span><span class="bigtime" id="tl"></span></div>' +
      '<div class="timer" id="tb"><div></div></div>' + qh.html +
      '<div class="flash muted" id="wait"></div><div id="board"></div>',
      quitGame
    );
    on('#quit', quitGame);
    const qStart = performance.now();
    const timer = runTimer('#tb', '#tl', T, () => answer(null));
    $app.querySelectorAll('.answer').forEach(b => b.addEventListener('click', () => answer(b)));
    function answer(btn) {
      if (r.myAnswer) return;
      timer.stop();
      const ok = !!btn && btn.dataset.o === '0';
      const rem = Math.max(0, T - (performance.now() - qStart) / 1000);
      const pts = ok ? 100 + Math.round(100 * rem / T) : 0;
      r.myAnswer = { o: btn ? btn.dataset.o : null };
      $app.querySelectorAll('.answer').forEach(b => { if (b === btn) b.classList.add('picked'); else b.classList.add('dim'); });
      if (!btn) sfx.bad();
      sendAll(r, { t: 'ans', qi: r.qi, pid: r.me.pid, name: r.me.name, ok, pts });
      updateWaiting(r);
    }
    r.stopTimer = () => timer.stop();
  }

  function updateWaiting(r) {
    const w = $app.querySelector('#wait'); if (!w || !r.myAnswer) return;
    const a = r.answers[r.qi] || {};
    const left = r.players.filter(p => !a[p.pid]).length;
    w.textContent = left ? '⏳ ממתין ל-' + left + ' שחקנים...' : '✓ כולם ענו!';
  }

  function renderReveal(r) {
    if (r.stopTimer) r.stopTimer();
    const mine = (r.answers[r.qi] || {})[r.me.pid];
    $app.querySelectorAll('.answer').forEach(b => {
      b.classList.remove('dim');
      if (b.dataset.o === '0') b.classList.add('correct');
      else if (r.myAnswer && b.dataset.o === r.myAnswer.o) b.classList.add('wrong');
      else b.classList.add('dim');
    });
    const w = $app.querySelector('#wait');
    if (w) {
      if (mine && mine.ok) { w.className = 'flash good'; w.textContent = 'נכון! +' + mine.pts; sfx.good(); }
      else { w.className = 'flash bad'; w.textContent = r.myAnswer && r.myAnswer.o != null ? 'טעות!' : 'לא הספקת לענות'; if (r.myAnswer && r.myAnswer.o != null) sfx.bad(); }
    }
    const sc = $app.querySelector('.hud .score'); if (sc && r.scores[r.me.pid]) sc.textContent = '⭐ ' + r.scores[r.me.pid].score;
    const b = $app.querySelector('#board'); if (b) b.innerHTML = scoreList(r, r.qi);
  }

  function renderOnlineResults(r) {
    sfx.end();
    const ranked = Object.keys(r.scores).map(pid => Object.assign({ pid }, r.scores[pid])).sort((a, b) => b.score - a.score);
    const myRank = ranked.findIndex(p => p.pid === r.me.pid) + 1;
    const me = r.scores[r.me.pid] || { score: 0, correct: 0 };
    const tie = ranked.length > 1 && ranked[0].score === ranked[1].score;
    const won = myRank === 1 && !tie;
    const head = ranked.length < 2 ? 'סיום!' : won ? '🏆 ניצחת!' : (tie && ranked[0].score === me.score) ? '🤝 תיקו!' : 'מקום ' + myRank;
    const host = amHost(r);
    show(
      '<div class="center" style="font-size:34px;font-weight:900;margin-top:16px">' + head + '</div>' +
      '<div class="bigscore">' + me.score + '</div>' +
      '<div class="center muted">' + me.correct + ' תשובות נכונות מתוך ' + r.qids.length + '</div>' +
      '<div class="card"><div class="label">התוצאות</div>' + scoreList(r, null) + '</div>' +
      '<div class="center muted" id="sub">שומר בטבלת המובילים...</div>' +
      '<div class="spacer"></div>' +
      (host ? '<button class="btn primary" id="again">משחק נוסף 🔁</button>' : '<div class="center muted">המארח יכול להתחיל משחק נוסף</div>') +
      '<button class="btn small" id="leave">יציאה</button>',
      () => leaveRoom()
    );
    if (won) vibrate(300);
    on('#leave', () => leaveRoom());
    on('#again', () => { r.autoStarted = false; sendAll(r, { t: 'settings', settings: r.settings, phase: 'lobby' }); });
    if (me.score > 0) {
      Net.submitScore({ player_id: profile.pid, name: profile.name, mode: 'online', level: r.settings.level, score: Math.min(me.score, 5000), correct: Math.min(me.correct, 100) })
        .then(() => { const s = $app.querySelector('#sub'); if (s) s.textContent = '✓ נשמר בטבלת המובילים'; })
        .catch(() => { const s = $app.querySelector('#sub'); if (s) s.textContent = ''; });
    } else { const s = $app.querySelector('#sub'); if (s) s.textContent = ''; }
  }

  // ================= ארץ עיר =================

  function aeHome() {
    if (!profile.name) return nameScreen(aeHome);
    show(
      '<div class="topbar"><button class="iconbtn" id="back">→</button><h2>🔤 ארץ עיר</h2></div>' +
      '<div class="card center muted">בוחרים אות אקראית, וכותבים מילה שמתחילה בה לכל קטגוריה - תחת זמן מוגבל!</div>' +
      '<button class="btn primary" id="solo"><span class="emoji">🧍</span><span class="col">יחיד<span class="sub">מתאמנים בעצמכם, נגד השעון</span></span></button>' +
      '<button class="btn secondary" id="vs" style="--stripe:var(--accent2-b)"><span class="emoji">⚔️</span><span class="col">ראש בראש מול חבר<span class="sub">3 סבבים, ניקוד מצטבר</span></span></button>',
      home
    );
    on('#back', home);
    on('#solo', aeSoloSetup);
    on('#vs', aeOnlineMenu);
  }

  // ---------- יחיד ----------
  function aeSoloSetup() {
    const seconds = store.get('aeSeconds', 90);
    const best = store.get('aeSoloBest', 0);
    show(
      '<div class="topbar"><button class="iconbtn" id="back">→</button><h2>🔤 ארץ עיר - יחיד</h2></div>' +
      '<div class="card"><div class="label">זמן לסבב</div>' +
      chipsHtml('sec', AE_TIMER_OPTS, String(seconds)) + '</div>' +
      '<div class="center muted">השיא שלך: <b style="color:var(--accent)">' + best + '</b> תשובות תקינות בסבב אחד</div>' +
      '<div class="spacer"></div><button class="btn primary" id="go">התחל ▶</button>',
      aeHome
    );
    on('#back', aeHome);
    onAll('.chip', el => { store.set('aeSeconds', +el.dataset.v); aeSoloSetup(); });
    on('#go', () => aeSoloPlay(store.get('aeSeconds', 90)));
  }

  function aeSoloPlay(seconds) {
    const letter = aeRandLetter();
    const cats = aeRandCats();
    const quit = () => confirmQuit(() => { clearTimers(); aeSoloSetup(); });
    show(
      '<div class="hud"><button class="iconbtn" id="quit">✕</button><span class="spacer"></span><span class="bigtime" id="tl"></span></div>' +
      '<div class="timer" id="tb"><div></div></div>' +
      '<div class="roomcode" style="font-size:64px;margin:6px 0">' + esc(letter) + '</div>' +
      '<div class="center muted" style="margin-bottom:6px">כל מילה צריכה להתחיל באות הזו</div>' +
      '<div class="list" id="catlist">' + cats.map(code => {
        const c = AE_CAT_BY_CODE[code];
        return '<div class="li"><span class="rank">' + c.icon + '</span>' +
          '<input class="field" data-cat="' + code + '" placeholder="' + esc(c.name) + '" autocomplete="off" style="flex:1;margin:0"></div>';
      }).join('') + '</div>' +
      '<div class="spacer"></div><button class="btn primary" id="done">סיימתי ✓</button>',
      quit
    );
    on('#quit', quit);
    const finish = () => {
      const answers = {};
      cats.forEach(code => { const el = $app.querySelector('[data-cat="' + code + '"]'); answers[code] = el ? el.value.trim() : ''; });
      clearTimers();
      aeSoloReview(letter, cats, answers);
    };
    on('#done', finish);
    runTimer('#tb', '#tl', seconds, finish);
  }

  function aeSoloReview(letter, cats, answers) {
    const rows = cats.map(code => {
      const a = answers[code] || '';
      return { code, c: AE_CAT_BY_CODE[code], a, ok: !!a };
    });
    const render = () => {
      const score = rows.reduce((s, row) => s + (row.ok ? 1 : 0), 0);
      show(
        '<div class="topbar"><h2>סיכום הסבב</h2></div>' +
        '<div class="center muted">האות: <b style="color:var(--accent);font-size:20px">' + esc(letter) + '</b></div>' +
        '<div class="bigscore">' + score + '</div>' +
        '<div class="center muted" style="margin-bottom:10px">תשובות שסימנת כתקינות</div>' +
        '<div class="list">' + rows.map(row =>
          '<div class="li"><span class="rank">' + row.c.icon + '</span>' +
          '<span class="name">' + esc(row.c.name) + (row.a ? ': ' + esc(row.a) : ' - (לא נכתב)') + '</span>' +
          (row.a ? '<button class="chip' + (row.ok ? ' on' : '') + '" data-code="' + row.code + '" style="flex:none">✓ תקין</button>' : '') +
          '</div>').join('') + '</div>' +
        '<div class="spacer"></div><button class="btn primary" id="finish">סיום</button>',
        aeSoloSetup
      );
      $app.querySelectorAll('[data-code]').forEach(btn => btn.addEventListener('click', () => {
        const row = rows.find(x => x.code === btn.dataset.code);
        row.ok = !row.ok; render();
      }));
      on('#finish', () => {
        const prev = store.get('aeSoloBest', 0);
        if (score > prev) { store.set('aeSoloBest', score); toast('שיא אישי חדש! 🎉'); }
        aeSoloSetup();
      });
    };
    render();
  }

  // ---------- אונליין ראש בראש ----------
  let aeRoom = null;

  function aeOnlineMenu() {
    if (!profile.name) return nameScreen(aeOnlineMenu);
    show(
      '<div class="topbar"><button class="iconbtn" id="back">→</button><h2>🔤 ארץ עיר - אונליין</h2></div>' +
      '<button class="btn primary" id="quick"><span class="emoji">⚔️</span><span class="col">ראש בראש מהיר<span class="sub">מצא יריב אקראי ושחקו מיד</span></span></button>' +
      '<button class="btn blue" id="create"><span class="emoji">🏠</span><span class="col">צור חדר<span class="sub">קבל קוד ושלח לחבר (שני שחקנים)</span></span></button>' +
      '<div class="card"><div class="label">יש לך קוד מחבר?</div>' +
      '<input class="field code" id="code" maxlength="4" placeholder="קוד" autocomplete="off" autocapitalize="characters">' +
      '<button class="btn" id="join" style="margin-top:10px">הצטרף לחדר</button></div>',
      aeHome
    );
    on('#back', aeHome);
    on('#quick', aeQuickMatch);
    on('#create', () => aeEnterRoom(makeCode(), { creating: true }));
    const inp = $app.querySelector('#code');
    const join = () => {
      const c = inp.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (c.length !== 4) { toast('הקוד צריך להיות 4 תווים'); return; }
      aeEnterRoom(c, { creating: false });
    };
    on('#join', join);
    on(inp, e => { if (e.key === 'Enter') join(); }, 'keydown');
  }

  function aeNoConnection() {
    show('<div class="spacer"></div><div class="center" style="font-size:56px">📡</div>' +
      '<div class="center" style="font-size:20px;font-weight:800">אין חיבור לשרת</div>' +
      '<div class="center muted">בדוק שיש אינטרנט ונסה שוב</div><div class="spacer"></div>' +
      '<button class="btn primary" id="retry">חזרה</button>', aeOnlineMenu);
    on('#retry', aeOnlineMenu);
  }

  function aeQuickMatch() {
    let handle = null, done = false;
    const cancel = () => { done = true; if (handle) handle.leave(); aeOnlineMenu(); };
    connecting('מחפש יריב...', cancel);
    const meta = { pid: profile.pid, name: profile.name, t: Date.now() };
    Net.join('ae-matchmaking', meta, {
      onPresence(list) {
        if (done) return;
        const sorted = list.slice().sort((a, b) => (a.t - b.t) || (a.pid < b.pid ? -1 : 1));
        const a = sorted[0], b = sorted[1];
        if (!a || !b || (a.pid !== profile.pid && b.pid !== profile.pid)) {
          const s = $app.querySelector('.center'); if (s) s.textContent = 'מחפש יריב... (' + list.length + ' מחפשים כרגע)';
          return;
        }
        done = true;
        const other = a.pid === profile.pid ? b : a;
        const code = 'A' + hashCode(a.pid + '|' + b.pid);
        setTimeout(() => { if (handle) handle.leave(); }, 300);
        toast('נמצא יריב: ' + other.name + ' ⚔️');
        aeEnterRoom(code, { creating: a.pid === profile.pid, quick: true });
      }
    }).then(h => { handle = h; if (done) h.leave(); })
      .catch(() => { if (!done) { done = true; aeNoConnection(); } });
  }

  function aeEnterRoom(code, opts) {
    if (aeRoom) aeLeaveRoom(true);
    const r = aeRoom = {
      code, opts, handle: null, players: [], phase: 'joining',
      seconds: 90, round: 0, totalRounds: 3,
      letter: null, cats: [], endsAt: 0,
      answers: {}, valid: {}, scores: {}, graceTimer: null, wasHost: false,
      me: { pid: profile.pid, name: profile.name, joinedAt: Date.now(), c: opts.creating ? 1 : 0 }
    };
    connecting(opts.quick ? 'מתחבר למשחק...' : opts.creating ? 'יוצר חדר...' : 'מצטרף לחדר ' + code + '...', () => aeLeaveRoom());

    Net.join('ae-room-' + code, r.me, {
      onPresence: list => { if (aeRoom === r) aeOnPresence(r, list); },
      onMessage: msg => { if (aeRoom === r) aeOnMessage(r, msg); },
      onStatus: () => { if (aeRoom === r) toast('החיבור לשרת נקטע...'); }
    }).then(h => {
      if (aeRoom !== r) { h.leave(); return; }
      r.handle = h;
      if (opts.creating) { r.phase = 'lobby'; aeRenderLobby(r); }
      else {
        aeSend(r, { t: 'hello', pid: r.me.pid, name: r.me.name });
        const wait = opts.quick ? 10000 : 4000;
        setTimeout(() => {
          if (aeRoom !== r || r.phase !== 'joining') return;
          aeLeaveRoom(true);
          if (opts.quick) { toast('היריב לא התחבר, מחפש שוב...'); aeQuickMatch(); }
          else { modal('החדר לא נמצא', 'בדוק את הקוד ושהחבר עדיין בחדר.', [{ label: 'הבנתי', cls: 'primary' }]); }
        }, wait);
      }
    }).catch(() => { if (aeRoom === r) { aeRoom = null; aeNoConnection(); } });
  }

  function aeLeaveRoom(silent) {
    const r = aeRoom; aeRoom = null;
    if (!r) return;
    clearTimeout(r.graceTimer);
    if (r.handle) r.handle.leave();
    if (!silent) aeOnlineMenu();
  }

  const aeSortPlayers = list => list.slice().sort((a, b) => ((b.c | 0) - (a.c | 0)) || (a.joinedAt - b.joinedAt) || (a.pid < b.pid ? -1 : 1));
  const aeHostPid = r => r.players.length ? r.players[0].pid : r.me.pid;
  const aeAmHost = r => aeHostPid(r) === r.me.pid;

  function aeSend(r, msg) { if (r.handle) r.handle.send(msg); }
  function aeSendAll(r, msg) { aeSend(r, msg); aeOnMessage(r, msg); }

  function aeOnPresence(r, list) {
    const before = r.players.map(p => p.pid);
    r.players = aeSortPlayers(list);
    if (!r.players.some(p => p.pid === r.me.pid)) r.players.push(r.me);
    const now = r.players.map(p => p.pid);
    if (r.phase !== 'joining') {
      now.filter(p => before.indexOf(p) < 0 && p !== r.me.pid).forEach(pid => { const p = r.players.find(x => x.pid === pid); if (p) toast(p.name + ' הצטרף/ה'); });
      before.filter(p => now.indexOf(p) < 0).forEach(() => toast('היריב/ה התנתק/ה'));
    }
    r.wasHost = aeAmHost(r);
    if (r.phase === 'lobby') aeRenderLobby(r);
    else if (r.phase === 'review') aeRenderReview(r);
    else if (r.phase === 'final') aeRenderFinal(r);
  }

  function aeOnMessage(r, m) {
    switch (m.t) {
      case 'hello':
        if (aeAmHost(r)) aeSend(r, { t: 'settings', seconds: r.seconds, phase: r.phase === 'lobby' || r.phase === 'joining' ? 'lobby' : 'game' });
        break;
      case 'settings':
        r.seconds = m.seconds;
        if (r.phase === 'joining') {
          if (m.phase !== 'lobby') {
            aeLeaveRoom(true);
            modal('המשחק כבר התחיל', 'נסה להצטרף שוב כשהסבב הנוכחי ייגמר.', [{ label: 'הבנתי', cls: 'primary', fn: aeOnlineMenu }]);
            return;
          }
          r.phase = 'lobby'; aeRenderLobby(r);
        } else if (m.phase === 'lobby') {
          if (r.phase !== 'lobby') r.scores = {};
          r.phase = 'lobby'; aeRenderLobby(r);
        }
        break;
      case 'start':
        if (r.phase === 'joining') r.phase = 'lobby';
        clearTimeout(r.graceTimer);
        r.letter = m.letter; r.cats = m.cats; r.endsAt = m.endsAt; r.round = m.round;
        r.answers = {}; r.valid = {};
        if (m.scores) r.scores = m.scores;
        r.players.forEach(p => { if (r.scores[p.pid] == null) r.scores[p.pid] = 0; });
        r.phase = 'play';
        aeRenderPlay(r);
        break;
      case 'submit':
        r.answers[m.pid] = m.answers;
        aeCheckAllSubmitted(r);
        break;
      case 'validity':
        r.valid[m.pid] = r.valid[m.pid] || {};
        r.valid[m.pid][m.cat] = m.valid;
        if (r.phase === 'review') aeRenderReview(r);
        break;
      case 'final':
        clearTimeout(r.graceTimer);
        r.scores = m.scores; r.phase = 'final';
        aeRenderFinal(r);
        break;
    }
  }

  function aeCheckAllSubmitted(r) {
    if (r.phase !== 'play') return;
    if (r.players.length < 2) return;
    if (r.players.every(p => r.answers[p.pid])) aeGoReview(r);
  }

  function aeGoReview(r) {
    clearTimeout(r.graceTimer);
    r.phase = 'review';
    aeRenderReview(r);
    const mine = r.answers[r.me.pid] || {};
    r.cats.forEach(code => {
      if (!r.valid[r.me.pid]) r.valid[r.me.pid] = {};
      if (r.valid[r.me.pid][code] === undefined) {
        const val = !!(mine[code] && mine[code].trim());
        r.valid[r.me.pid][code] = val;
        aeSendAll(r, { t: 'validity', pid: r.me.pid, cat: code, valid: val });
      }
    });
  }

  function aeRenderPlay(r) {
    const seconds = Math.max(0, Math.round((r.endsAt - Date.now()) / 1000));
    const already = r.answers[r.me.pid];
    const quit = () => confirmQuit(() => aeLeaveRoom());
    show(
      '<div class="hud"><button class="iconbtn" id="quit">✕</button>' +
      '<span class="pill">סבב ' + r.round + '/' + r.totalRounds + '</span>' +
      '<span class="spacer"></span><span class="bigtime" id="tl"></span></div>' +
      '<div class="timer" id="tb"><div></div></div>' +
      '<div class="roomcode" style="font-size:64px;margin:6px 0">' + esc(r.letter) + '</div>' +
      '<div class="center muted" style="margin-bottom:6px">כל מילה צריכה להתחיל באות הזו</div>' +
      '<div class="list" id="catlist">' + r.cats.map(code => {
        const c = AE_CAT_BY_CODE[code];
        return '<div class="li"><span class="rank">' + c.icon + '</span>' +
          '<input class="field" data-cat="' + code + '" placeholder="' + esc(c.name) + '" autocomplete="off" style="flex:1;margin:0"' + (already ? ' disabled' : '') + '></div>';
      }).join('') + '</div>' +
      '<div class="spacer"></div>' +
      (already ? '<div class="center muted">⏳ ממתין/ה ליריב/ה...</div>' : '<button class="btn primary" id="done">סיימתי ✓</button>'),
      quit
    );
    on('#quit', quit);
    if (already) {
      r.cats.forEach(code => { const el = $app.querySelector('[data-cat="' + code + '"]'); if (el) el.value = already[code] || ''; });
      return;
    }
    const submit = () => {
      if (r.answers[r.me.pid]) return;
      const answers = {};
      r.cats.forEach(code => { const el = $app.querySelector('[data-cat="' + code + '"]'); answers[code] = el ? el.value.trim() : ''; });
      aeSendAll(r, { t: 'submit', pid: r.me.pid, name: r.me.name, answers });
      if (r.phase === 'play') {
        r.graceTimer = setTimeout(() => {
          if (aeRoom !== r || r.phase !== 'play') return;
          r.players.forEach(p => { if (!r.answers[p.pid]) r.answers[p.pid] = {}; });
          aeGoReview(r);
        }, 15000);
        aeRenderPlay(r);
      }
    };
    on('#done', submit);
    runTimer('#tb', '#tl', seconds, submit);
  }

  function aeRenderReview(r) {
    const pids = r.players.map(p => p.pid);
    const byPid = {}; r.players.forEach(p => { byPid[p.pid] = p; });
    const totals = {}; pids.forEach(pid => { totals[pid] = 0; });
    if (pids.length === 2) {
      const [a, b] = pids;
      r.cats.forEach(code => {
        const av = (r.valid[a] || {})[code] && ((r.answers[a] || {})[code] || '').trim();
        const bv = (r.valid[b] || {})[code] && ((r.answers[b] || {})[code] || '').trim();
        if (av && bv) { const pts = aeNorm(av) === aeNorm(bv) ? 1 : 2; totals[a] += pts; totals[b] += pts; }
        else if (av) totals[a] += 2;
        else if (bv) totals[b] += 2;
      });
    }
    const rowsHtml = r.cats.map(code => {
      const c = AE_CAT_BY_CODE[code];
      const cellHtml = pids.map(pid => {
        const ans = (r.answers[pid] || {})[code] || '';
        const valid = !!((r.valid[pid] || {})[code]);
        if (!ans) return '<span class="muted" style="flex:1">(לא נכתב)</span>';
        const tail = pid === r.me.pid
          ? '<button class="chip' + (valid ? ' on' : '') + '" data-code="' + code + '" style="flex:none">✓</button>'
          : (valid ? '<span class="tick">✓</span>' : '<span class="cross">✗</span>');
        return '<span style="flex:1;overflow:hidden;text-overflow:ellipsis">' + esc(ans) + '</span>' + tail;
      }).join('<span class="muted" style="margin:0 6px">|</span>');
      return '<div class="li" style="flex-wrap:wrap"><span class="rank">' + c.icon + '</span>' +
        '<span class="name" style="flex:none;min-width:70px">' + esc(c.name) + '</span>' + cellHtml + '</div>';
    }).join('');
    const host = aeAmHost(r);
    const isLast = r.round >= r.totalRounds;
    show(
      '<div class="topbar"><h2>סבב ' + r.round + ' - סיכום</h2></div>' +
      '<div class="center muted">האות: <b style="color:var(--accent);font-size:18px">' + esc(r.letter) + '</b> · כל שחקן מסמן רק את התשובות שלו</div>' +
      '<div class="list">' + rowsHtml + '</div>' +
      '<div class="card"><div class="label">ניקוד הסבב</div>' +
      pids.map(pid => '<div>' + esc(byPid[pid] ? byPid[pid].name : '?') + (pid === r.me.pid ? ' (את/ה)' : '') + ': <b>' + (totals[pid] || 0) + '</b></div>').join('') + '</div>' +
      '<div class="spacer"></div>' +
      (host && pids.length >= 2
        ? '<button class="btn primary" id="next">' + (isLast ? 'לתוצאות הסופיות 🏆' : 'לסבב הבא ▶') + '</button>'
        : '<div class="center muted">⏳ ממתין/ה שהמארח ימשיך</div>'),
      () => aeLeaveRoom()
    );
    $app.querySelectorAll('[data-code]').forEach(btn => btn.addEventListener('click', () => {
      const code = btn.dataset.code;
      const cur = !!((r.valid[r.me.pid] || {})[code]);
      r.valid[r.me.pid] = r.valid[r.me.pid] || {};
      r.valid[r.me.pid][code] = !cur;
      aeSendAll(r, { t: 'validity', pid: r.me.pid, cat: code, valid: !cur });
    }));
    if (host) on('#next', () => aeHostAdvance(r));
  }

  function aeHostAdvance(r) {
    const pids = r.players.map(p => p.pid);
    if (pids.length === 2) {
      const [a, b] = pids;
      r.cats.forEach(code => {
        const av = (r.valid[a] || {})[code] && ((r.answers[a] || {})[code] || '').trim();
        const bv = (r.valid[b] || {})[code] && ((r.answers[b] || {})[code] || '').trim();
        if (av && bv) { const pts = aeNorm(av) === aeNorm(bv) ? 1 : 2; r.scores[a] = (r.scores[a] || 0) + pts; r.scores[b] = (r.scores[b] || 0) + pts; }
        else if (av) r.scores[a] = (r.scores[a] || 0) + 2;
        else if (bv) r.scores[b] = (r.scores[b] || 0) + 2;
      });
    }
    if (r.round >= r.totalRounds) {
      aeSendAll(r, { t: 'final', scores: r.scores });
    } else {
      aeSendAll(r, {
        t: 'start', letter: aeRandLetter(), cats: aeRandCats(),
        endsAt: Date.now() + r.seconds * 1000, round: r.round + 1, scores: r.scores
      });
    }
  }

  function aeRenderFinal(r) {
    sfx.end();
    const ranked = r.players.map(p => ({ pid: p.pid, name: p.name, score: r.scores[p.pid] || 0 })).sort((a, b) => b.score - a.score);
    const me = ranked.find(p => p.pid === r.me.pid) || { score: 0 };
    const tie = ranked.length > 1 && ranked[0].score === ranked[1].score;
    const won = ranked.length > 1 && ranked[0].pid === r.me.pid && !tie;
    const head = ranked.length < 2 ? 'סיום!' : won ? '🏆 ניצחת!' : tie ? '🤝 תיקו!' : 'הפסד הפעם';
    show(
      '<div class="center" style="font-size:34px;font-weight:900;margin-top:16px">' + head + '</div>' +
      '<div class="bigscore">' + me.score + '</div>' +
      '<div class="card"><div class="label">התוצאות הסופיות</div><div class="list">' +
      ranked.map((p, i) => '<div class="li' + (p.pid === r.me.pid ? ' me' : '') + '"><span class="rank">' + (i === 0 && !tie ? '🥇' : i + 1) + '</span>' +
        '<span class="name">' + esc(p.name) + '</span><span class="pts">' + p.score + '</span></div>').join('') + '</div></div>' +
      '<div class="spacer"></div>' +
      (aeAmHost(r) ? '<button class="btn primary" id="again">משחק נוסף 🔁</button>' : '<div class="center muted">המארח/ת יכול/ה להתחיל משחק נוסף</div>') +
      '<button class="btn small" id="leave">יציאה</button>',
      () => aeLeaveRoom()
    );
    if (won) vibrate(300);
    on('#leave', () => aeLeaveRoom());
    on('#again', () => aeSendAll(r, { t: 'settings', seconds: r.seconds, phase: 'lobby' }));
  }

  function aeRenderLobby(r) {
    const host = aeAmHost(r);
    const hp = aeHostPid(r);
    const players = r.players.length ? r.players : [r.me];
    const confirmLeave = () => modal('לצאת מהחדר?', '', [{ label: 'להישאר', cls: 'primary' }, { label: 'לצאת', fn: () => aeLeaveRoom() }]);
    show(
      '<div class="topbar"><button class="iconbtn" id="back">→</button><h2>🔤 ' + (r.opts.quick ? 'ראש בראש' : 'חדר ארץ עיר') + '</h2></div>' +
      (r.opts.quick ? '<div class="center muted">נמצא/ה יריב/ה - לוחצים כדי להתחיל</div>' :
        '<div class="card center"><div class="label">קוד החדר</div><div class="roomcode">' + esc(r.code) + '</div>' +
        '<button class="btn small blue" id="share">📤 שלח לחברים</button></div>') +
      '<div class="card"><div class="label">שחקנים (' + players.length + ')</div><div class="list">' +
      players.map(p => '<div class="li' + (p.pid === r.me.pid ? ' me' : '') + '"><span class="rank">' + (p.pid === hp ? '👑' : '🙂') + '</span><span class="name">' + esc(p.name) + '</span>' +
        (p.pid === r.me.pid ? '<span class="tag">את/ה</span>' : '') + '</div>').join('') + '</div></div>' +
      '<div class="card"><div class="label">זמן לסבב' + (host ? '' : ' (המארח/ת קובע/ת)') + '</div>' +
      (host ? chipsHtml('sec', AE_TIMER_OPTS, String(r.seconds)) : '<div><b>' + r.seconds + '</b> שניות</div>') + '</div>' +
      '<div class="muted center" style="font-size:13px">מיועד לשני שחקנים · 3 סבבים · ניקוד מצטבר · כל שחקן מסמן לבד אילו מהתשובות שלו תקינות</div>' +
      '<div class="spacer"></div>' +
      (host
        ? '<button class="btn primary" id="start"' + (players.length < 2 ? ' disabled' : '') + '>' + (players.length < 2 ? 'ממתין/ה לחבר/ה...' : 'התחל משחק ▶') + '</button>'
        : '<div class="center muted">⏳ ממתין/ה שהמארח/ת יתחיל/תתחיל את המשחק</div>'),
      confirmLeave
    );
    on('#back', confirmLeave);
    on('#share', () => shareCode(r.code));
    if (host) {
      onAll('.chip', el => { r.seconds = +el.dataset.v; aeSendAll(r, { t: 'settings', seconds: r.seconds, phase: 'lobby' }); });
      on('#start', () => { if (r.players.length >= 2 && aeRoom === r) aeHostStart(r); });
    }
  }

  function aeHostStart(r) {
    r.round = 1; r.scores = {};
    aeSendAll(r, {
      t: 'start', letter: aeRandLetter(), cats: aeRandCats(),
      endsAt: Date.now() + r.seconds * 1000, round: 1, scores: r.scores
    });
  }

  home();
})();
