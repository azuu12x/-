'use strict';

// ===== State =====
let DATA = null;
const progress = { modules: [], quizDone: {}, scenarios: [], checks: {} };
const PKEY = 'elad_v2_progress';

function loadProgress() {
  try { const s = localStorage.getItem(PKEY); if (s) Object.assign(progress, JSON.parse(s)); } catch(e) {}
}
function saveProgress() {
  try { localStorage.setItem(PKEY, JSON.stringify(progress)); } catch(e) {}
}
function loadTheme() {
  try { if (localStorage.getItem('theme2') === 'light') document.body.classList.add('light'); } catch(e) {}
}

// ===== Load JSON =====
async function loadData() {
  try {
    const r = await fetch('content.json');
    DATA = await r.json();
  } catch(e) {
    // Fallback notice
    document.getElementById('main').innerHTML = `
      <div class="card warning" style="margin-top:40px">
        <div class="card-head">⚠️ לא ניתן לטעון את התוכן</div>
        <p style="font-size:13.5px;color:var(--muted);line-height:1.7">
          כדי שהאתר יעבוד, צריך להריץ שרת סטטי:<br><br>
          <code style="background:var(--bg-card2);padding:6px 12px;border-radius:6px;font-family:monospace">python3 -m http.server 8080</code><br><br>
          ואז לפתוח: <a href="http://localhost:8080">http://localhost:8080</a>
        </p>
      </div>`;
    return false;
  }
  return true;
}

// ===== Router =====
function getRoute() {
  const h = location.hash.replace('#','') || '/home';
  const parts = h.split('/').filter(Boolean);
  return { page: parts[0] || 'home', id: parts[1] };
}
function nav(path) { location.hash = path; }
window.addEventListener('hashchange', render);

// ===== Render =====
function render() {
  const { page, id } = getRoute();
  // Update nav
  document.querySelectorAll('.nav-item a').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page || (page === 'home' && a.dataset.page === 'home'));
  });
  updateMiniProg();
  const main = document.getElementById('main');
  switch(page) {
    case 'home': main.innerHTML = renderHome(); break;
    case 'agencies': main.innerHTML = renderSection('agencies'); initChecks(); break;
    case 'service': main.innerHTML = renderSection('service'); break;
    case 'escalation': main.innerHTML = renderSection('escalation'); break;
    case 'versions': main.innerHTML = renderOpenTasks() + renderSection('versions'); initChecks(); initOpenTasks(); break;
    case 'partners': main.innerHTML = renderSection('partners'); break;
    case 'negotiations': main.innerHTML = renderNegotiations(); initNegotiations(); break;
    case 'contacts': main.innerHTML = renderContacts(); initContacts(); break;
    case 'scenarios': renderScenariosPage(main, id); break;
    case 'quiz': renderQuizPage(main, id); break;
    case 'progress': main.innerHTML = renderProgress(); break;
    default: main.innerHTML = renderHome();
  }
  window.scrollTo(0,0);
}

function updateMiniProg() {
  const totalSections = 5;
  const quizDone = Object.keys(progress.quizDone).length > 0 ? 1 : 0;
  const scenDone = progress.scenarios.length > 0 ? 1 : 0;
  const done = progress.modules.length + quizDone + scenDone;
  const total = totalSections + 2;
  const pct = Math.round((done/total)*100);
  const b = document.getElementById('mini-bar');
  const p = document.getElementById('mini-pct');
  if (b) b.style.width = pct + '%';
  if (p) p.textContent = pct + '%';
}

// ===== HOME =====
function renderHome() {
  const m = DATA.meta;
  return `
<div class="home-hero">
  <div class="hero-tag">ביטוח ישיר — שת״פים</div>
  <h1 class="hero-title">שלום ${m.name} 👋</h1>
  <p class="hero-sub">מרכז הידע לתפקיד: <strong>${m.role}</strong>.<br>השתמש בתפריט לניווט, ובחיפוש למציאה מהירה.</p>
</div>
<div class="qnav">
  ${[
    {page:'agencies',icon:'🏢',title:'סוכנויות',desc:'3 מערכות, API, Flow'},
    {page:'service',icon:'📞',title:'שירות ומענה',desc:'תיעדוף, דחיפות, תקשורת'},
    {page:'escalation',icon:'🆘',title:'הסלמה',desc:'מי מטפל במה'},
    {page:'versions',icon:'🔧',title:'גרסאות',desc:"צ'קליסט לפני/אחרי"},
    {page:'partners',icon:'🔗',title:'שת״פים',desc:'לינק צבוע, התנגשות מחיר'},
    {page:'negotiations',icon:'🤝',title:'שת״פים במו״מ',desc:'סטטוס שיתופי פעולה'},
    {page:'contacts',icon:'👥',title:'אנשי קשר',desc:'פנימי וחיצוני'},
    {page:'scenarios',icon:'🎯',title:'תרחישים',desc:'3 תרחישים אינטרקטיביים'},
    {page:'quiz',icon:'🧠',title:`קוויז (${DATA.quiz.length})`,desc:'בדוק את עצמך'},
  ].map(c=>`<div class="qnav-card" onclick="nav('#${c.page}')">
    <span class="qnav-icon">${c.icon}</span>
    <div class="qnav-title">${c.title}</div>
    <div class="qnav-desc">${c.desc}</div>
  </div>`).join('')}
</div>
<div class="home-2col">
  <div class="card">
    <div class="card-head">🎯 שני צירי עבודה</div>
    <div class="axis-box axis1" style="margin-bottom:10px">
      <div class="axis-title">ציר 1 — סוכנויות נסיעות</div>
      <div class="axis-desc">API Integration מול Travel Booster / DPC / Nassa. הסוכן מנפיק ביטוח ללקוח.</div>
    </div>
    <div class="axis-box axis2">
      <div class="axis-title">ציר 2 — שת״פים (לינק צבוע)</div>
      <div class="axis-desc">שותפים (פלאפון, פרטנר, גוליבר...) מפנים לקוחות עם הטבה.</div>
    </div>
  </div>
  <div class="card">
    <div class="card-head">💡 מה כדאי ללמוד עכשיו</div>
    ${renderSuggestions()}
  </div>
</div>`;
}

function renderSuggestions() {
  const sections = ['agencies','service','escalation','versions','partners'];
  const undone = sections.filter(s => !progress.modules.includes(s));
  if (!undone.length && progress.scenarios.length >= 3 && Object.keys(progress.quizDone).length >= 8) {
    return '<p style="color:var(--muted);font-size:13px">🎉 עברת על כל החלקים!</p>';
  }
  const labels = {agencies:'סוכנויות — Flow ו-API',service:'שירות ומענה',escalation:'הסלמה לפי ציר',versions:'ניהול גרסאות',partners:'שת״פים ולינק צבוע'};
  let html = '';
  undone.slice(0,3).forEach(s => {
    html += `<div onclick="nav('#${s}')" style="padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer;font-size:13px;font-weight:600">→ ${labels[s]||s}</div>`;
  });
  if (!progress.scenarios.length) html += `<div onclick="nav('#scenarios')" style="padding:8px 0;cursor:pointer;font-size:13px;color:var(--orange)">🎯 נסה תרחיש</div>`;
  if (!Object.keys(progress.quizDone).length) html += `<div onclick="nav('#quiz')" style="padding:8px 0;cursor:pointer;font-size:13px;color:var(--accent)">🧠 עשה קוויז</div>`;
  return html;
}

// ===== SECTION RENDERER =====
function renderSection(sectionId) {
  const sec = DATA.sections.find(s => s.id === sectionId);
  if (!sec) return '<p>לא נמצא</p>';
  let html = `<div class="page-title">${sec.icon} ${sec.title}</div><div class="page-sub">לחץ על מה שאתה צריך</div>`;
  sec.subsections.forEach(sub => {
    html += `<div class="card">`;
    html += `<div class="card-head">${sub.title}</div>`;
    if (sub.content) html += `<p style="font-size:13.5px;color:var(--muted);line-height:1.7;margin-bottom:10px">${sub.content}</p>`;
    if (sub.table) html += renderTable(sub.table);
    if (sub.flow) html += renderFlow(sub.flow);
    if (sub.bullets) html += renderBullets(sub.bullets);
    if (sub.escalation_table) html += renderEscTable(sub.escalation_table, sectionId);
    if (sub.checklist) html += renderChecklist(sub.checklist, sectionId);
    if (sub.scenarios_preview) html += renderScPreview(sub.scenarios_preview);
    if (sub.tip) html += `<div class="tip">💡 ${sub.tip}</div>`;
    if (sub.warning) html += `<div class="warning">⚠️ ${sub.warning}</div>`;
    if (sub.info) html += `<div class="info">ℹ️ ${sub.info}</div>`;
    html += `</div>`;
  });
  // Mark as visited
  if (!progress.modules.includes(sectionId)) {
    progress.modules.push(sectionId);
    saveProgress();
    updateMiniProg();
  }
  return html;
}

function renderTable(t) {
  return `<div class="tbl-wrap"><table class="data-table">
    <thead><tr>${t.headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${t.rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
  </table></div>`;
}

function renderFlow(steps) {
  return `<div class="flow" style="margin-top:10px">
    ${steps.map(s=>`<div class="flow-item" data-num="${s.num}">
      <div class="flow-num">${s.num}</div>
      <div class="flow-body">
        <div class="flow-title">${s.title}</div>
        <div class="flow-desc">${s.desc}</div>
      </div>
    </div>`).join('')}
  </div>`;
}

function renderBullets(items) {
  return `<div class="bullets">${items.map(i=>`<div class="bullet">${i}</div>`).join('')}</div>`;
}

function renderEscTable(items) {
  return `<div class="esc-grid">
    ${items.map(e=>`<div class="esc-card esc-${e.color}">
      <div class="esc-type">${e.type}</div>
      <div class="esc-who">${e.who}</div>
      <div class="esc-role">${e.role}</div>
      <div class="esc-examples" style="color:var(--muted)">${e.examples}</div>
    </div>`).join('')}
  </div>`;
}

function renderChecklist(cl, sectionId) {
  return `<div style="margin-top:10px">
    <div style="font-size:13.5px;font-weight:700;margin-bottom:8px">✅ ${cl.title}</div>
    <div class="cl-list">
      ${cl.items.map((item,i) => {
        const key = `${sectionId}_${i}`;
        const done = !!progress.checks[key];
        return `<div class="cl-item${done?' done':''}" data-key="${key}" onclick="toggleCheck(this)">
          <div class="cl-box">${done?'✓':''}</div>
          <span>${item}</span>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

function renderScPreview(items) {
  return items.map(s=>`
    <div style="background:var(--bg-card2);border-radius:var(--radius-s);padding:12px 14px;margin-top:8px">
      <div style="font-size:13px;font-weight:700;margin-bottom:6px">${s.situation}</div>
      <div style="font-size:12.5px;color:var(--muted);margin-bottom:4px"><strong>מה לעשות:</strong> ${s.what_to_do}</div>
      <div style="font-size:12.5px;color:var(--muted);margin-bottom:4px"><strong>ללקוח:</strong> ${s.say_to_customer}</div>
      <div style="font-size:12.5px;color:var(--muted);margin-bottom:4px"><strong>לשותף:</strong> ${s.say_to_partner}</div>
      <div class="warning" style="margin-top:6px">🆘 ${s.escalate_if}</div>
    </div>`).join('');
}

function initChecks() {
  window.toggleCheck = function(el) {
    const key = el.dataset.key;
    const done = !progress.checks[key];
    progress.checks[key] = done;
    el.classList.toggle('done', done);
    el.querySelector('.cl-box').textContent = done ? '✓' : '';
    saveProgress();
    showToast(done ? 'סומן ✓' : 'בוטל הסימון');
  };
}

// ===== SCENARIOS =====
function renderScenariosPage(main, activeId) {
  if (activeId) {
    const s = DATA.scenarios.find(x => x.id === activeId);
    if (s) { main.innerHTML = renderScenarioDetail(s); return; }
  }
  main.innerHTML = `
<div class="page-title">🎯 תרחישים</div>
<div class="page-sub">בחר תרחיש ותתרגל קבלת החלטות</div>
<div class="sc-grid">
  ${DATA.scenarios.map(s => {
    const solved = progress.scenarios.includes(s.id);
    return `<div class="sc-card" onclick="nav('#scenarios/${s.id}')">
      <div class="sc-icon">${s.icon}</div>
      <div class="sc-title">${s.title}</div>
      <div class="sc-sub" style="margin-bottom:8px">${s.situation.substring(0,120)}...</div>
      <span class="badge ${solved?'badge-green':'badge-orange'}">${solved?'✓ פוּתר':'פתור →'}</span>
    </div>`;
  }).join('')}
</div>`;
}

function renderScenarioDetail(s) {
  const letters = ['א','ב','ג'];
  return `
<button class="btn btn-ghost btn-sm" onclick="nav('#scenarios')" style="margin-bottom:16px">← חזרה</button>
<div class="page-title">${s.icon} ${s.title}</div>
<div class="card">
  <div class="card-head">📍 המצב</div>
  <div class="situation-box">${s.situation}</div>
  <div style="font-size:13.5px;font-weight:700;margin-bottom:10px">בחר פעולה:</div>
  <div id="opts">
    ${s.options.map((o,i) => `<button class="opt-btn" data-idx="${i}" onclick="pickScOpt(this,'${s.id}')">${letters[i]}. ${o.text}</button>`).join('')}
  </div>
  ${s.options.map((o,i) => {
    const cls = o.result === 'correct' ? 'correct' : o.result === 'partial' ? 'partial' : 'wrong';
    const bg = o.result === 'correct' ? 'var(--green-s)' : o.result === 'partial' ? 'var(--orange-s)' : 'var(--red-s)';
    const bc = o.result === 'correct' ? 'var(--green)' : o.result === 'partial' ? 'var(--orange)' : 'var(--red)';
    return `<div class="feedback-box" id="fb-${i}" style="background:${bg};border-right:3px solid ${bc};border-radius:6px;padding:12px 14px">
      ${o.feedback}
    </div>`;
  }).join('')}
</div>
<div class="lesson-box" id="lesson-box" style="display:none">
  💡 <strong>הלקח:</strong> ${s.key_lesson}
</div>
<div class="collect-box" id="collect-box" style="display:none">
  📋 <strong>מה לאסוף לפני הסלמה:</strong>
  <ul>${s.collect.map(c=>`<li>${c}</li>`).join('')}</ul>
</div>
<div id="retry-area" style="display:none;margin-top:12px;display:flex;gap:10px;flex-wrap:wrap">
  <button class="btn btn-ghost btn-sm" onclick="nav('#scenarios/${s.id}')">🔄 נסה שוב</button>
  <button class="btn btn-ghost btn-sm" onclick="nav('#scenarios')">← כל התרחישים</button>
</div>`;
}

// Expose for inline onclick
window.pickScOpt = function(btn, scId) {
  const opts = document.querySelectorAll('.opt-btn');
  opts.forEach(b => b.disabled = true);
  const idx = parseInt(btn.dataset.idx);
  const s = DATA.scenarios.find(x => x.id === scId);
  const result = s.options[idx].result;
  btn.classList.add(result === 'correct' ? 'correct' : result === 'partial' ? 'partial' : 'wrong');
  document.getElementById('fb-' + idx).classList.add('visible');
  document.getElementById('lesson-box').style.display = 'block';
  document.getElementById('collect-box').style.display = 'block';
  document.getElementById('retry-area').style.display = 'flex';
  if (result === 'correct' && !progress.scenarios.includes(scId)) {
    progress.scenarios.push(scId);
    saveProgress();
    updateMiniProg();
    showToast('תרחיש פוּתר נכון! ✓');
  }
};

// ===== QUIZ =====
function renderQuizPage(main, id) {
  // Simple: just one quiz
  const questions = DATA.quiz;
  let qIdx = 0, score = 0, answered = new Array(questions.length).fill(null);
  const letters = ['א','ב','ג','ד'];

  function showQ() {
    if (qIdx >= questions.length) { showResult(); return; }
    const q = questions[qIdx];
    const pct = Math.round((qIdx/questions.length)*100);
    main.innerHTML = `
<button class="btn btn-ghost btn-sm" onclick="nav('#home')" style="margin-bottom:16px">← בית</button>
<div class="page-title">🧠 קוויז — שאלה ${qIdx+1}/${questions.length}</div>
<div class="quiz-prog"><div class="quiz-prog-fill" style="width:${pct}%"></div></div>
<div class="q-box">
  <div class="q-num">שאלה ${qIdx+1}</div>
  <div class="q-text">${q.text}</div>
  <div class="q-opts">
    ${q.options.map((o,i)=>`<button class="q-opt" data-i="${i}" onclick="answerQ(${i})">
      <span class="q-letter">${letters[i]}</span><span>${o}</span>
    </button>`).join('')}
  </div>
  <div class="q-exp" id="qexp">${q.explanation}</div>
</div>
<div id="q-next" style="display:none;margin-top:6px">
  <button class="btn btn-primary btn-sm" onclick="nextQ()">${qIdx===questions.length-1?'סיים':'שאלה הבאה →'}</button>
</div>`;

    window.answerQ = function(selIdx) {
      if (answered[qIdx] !== null) return;
      answered[qIdx] = selIdx;
      const correct = q.correct === selIdx;
      if (correct) score++;
      main.querySelectorAll('.q-opt').forEach((b,i) => {
        b.disabled = true;
        if (i === q.correct) b.classList.add('correct');
        else if (i === selIdx) b.classList.add('wrong');
      });
      document.getElementById('qexp').classList.add('show');
      document.getElementById('q-next').style.display = 'block';
    };
    window.nextQ = function() { qIdx++; showQ(); };
  }

  function showResult() {
    const pct = Math.round((score/questions.length)*100);
    const emoji = pct>=80?'🎉':pct>=60?'👍':'📖';
    const msg = pct>=80?'מצוין!':pct>=60?'טוב, אפשר לשפר':'כדאי לחזור על החומר';
    // Save
    progress.quizDone = Object.assign({}, progress.quizDone, { score, pct, date: new Date().toLocaleDateString('he-IL') });
    saveProgress();
    updateMiniProg();
    main.innerHTML = `
<div class="quiz-result">
  <div style="font-size:40px;margin-bottom:10px">${emoji}</div>
  <div class="result-score">${score}/${questions.length}</div>
  <div class="result-label">${pct}% — ${msg}</div>
  <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
    <button class="btn btn-primary btn-sm" onclick="nav('#quiz')">🔄 נסה שוב</button>
    <button class="btn btn-ghost btn-sm" onclick="nav('#home')">← בית</button>
  </div>
</div>`;
  }

  showQ();
}

// ===== CONTACTS =====
function renderContacts() {
  const companies = ['הכל','פנימי',...new Set(DATA.contacts.filter(c=>c.type==='external').map(c=>c.company))];
  return `
<div class="page-title">👥 אנשי קשר</div>
<div class="page-sub">פנימי וחיצוני — חפש, סנן לפי חברה</div>
<div class="contacts-ctrl">
  <input type="search" class="contacts-search" id="csearch" placeholder="חיפוש שם / תפקיד / חברה..." oninput="filterC()">
  <div class="filter-bar" id="cfilt">
    ${companies.map((c,i)=>`<button class="filt-btn${i===0?' active':''}" data-c="${c}" onclick="filterByCompany(this)">${c}</button>`).join('')}
  </div>
</div>
<div class="contacts-grid" id="cgrid">
  ${DATA.contacts.map(c => `
    <div class="contact-card ${c.type}${c.name==='(להשלמה)'?' placeholder':''}" data-n="${c.name.toLowerCase()}" data-r="${c.role.toLowerCase()}" data-co="${c.company.toLowerCase()}" data-t="${c.type}">
      <span class="type-pill ${c.type}">${c.type==='internal'?'🏠 פנימי':'🏢 חיצוני'}</span>
      <div class="contact-name">${c.name}</div>
      <div class="contact-role">${c.role}</div>
      <div class="contact-co" style="color:${c.type==='internal'?'var(--accent)':'var(--green)'}">${c.company}</div>
      <div class="contact-info">
        ${c.phone?`📞 <a href="tel:${c.phone}">${c.phone}</a><br>`:''}
        ${c.email?`✉️ <a href="mailto:${c.email}">${c.email}</a>`:''}
      </div>
      ${c.escalation?`<div class="contact-esc">🆘 ${c.escalation}</div>`:''}
    </div>`).join('')}
</div>`;
}

function initContacts() {
  window.filterC = function() {
    const q = document.getElementById('csearch').value.toLowerCase();
    document.querySelectorAll('#cgrid .contact-card').forEach(c => {
      const match = (c.dataset.n+c.dataset.r+c.dataset.co).includes(q);
      c.style.display = match ? '' : 'none';
    });
  };
  window.filterByCompany = function(btn) {
    document.querySelectorAll('#cfilt .filt-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const company = btn.dataset.c;
    document.querySelectorAll('#cgrid .contact-card').forEach(c => {
      if (company === 'הכל') c.style.display = '';
      else if (company === 'פנימי') c.style.display = c.dataset.t === 'internal' ? '' : 'none';
      else c.style.display = c.dataset.co === company.toLowerCase() ? '' : 'none';
    });
  };
}

// ===== PROGRESS PAGE =====
function renderProgress() {
  const sLabels = {agencies:'סוכנויות',service:'שירות ומענה',escalation:'הסלמה',versions:'גרסאות',partners:'שת״פים'};
  const allSec = ['agencies','service','escalation','versions','partners'];
  const quizScore = progress.quizDone.score;
  const quizTotal = DATA.quiz.length;
  const quizPct = quizScore !== undefined ? Math.round((quizScore/quizTotal)*100) : null;

  return `
<div class="page-title">📊 התקדמות</div>
<div class="progress-grid">
  <div class="stat-card"><div class="stat-n">${progress.modules.length}/5</div><div class="stat-l">קטעים שנקראו</div></div>
  <div class="stat-card"><div class="stat-n">${progress.scenarios.length}/${DATA.scenarios.length}</div><div class="stat-l">תרחישים</div></div>
  <div class="stat-card"><div class="stat-n">${quizPct !== null ? quizPct+'%' : '—'}</div><div class="stat-l">ציון קוויז</div></div>
  <div class="stat-card"><div class="stat-n">${Object.keys(progress.checks).filter(k=>progress.checks[k]).length}</div><div class="stat-l">צ'ק פריטים</div></div>
</div>
<div class="section-title">📚 קטעים</div>
${allSec.map(s => {
  const done = progress.modules.includes(s);
  return `<div class="prog-row" onclick="nav('#${s}')">
    <span class="prog-row-icon">${done?'✅':'⬜'}</span>
    <span class="prog-row-title">${sLabels[s]}</span>
    <span class="prog-row-status" style="color:${done?'var(--green)':'var(--muted)'}">${done?'נקרא':'טרם'}</span>
  </div>`;
}).join('')}
<div class="section-title">🎯 תרחישים</div>
${DATA.scenarios.map(s => {
  const done = progress.scenarios.includes(s.id);
  return `<div class="prog-row" onclick="nav('#scenarios/${s.id}')">
    <span class="prog-row-icon">${s.icon}</span>
    <span class="prog-row-title">${s.title}</span>
    <span class="prog-row-status" style="color:${done?'var(--green)':'var(--muted)'}">${done?'✓ פוּתר':'פתח'}</span>
  </div>`;
}).join('')}
<div class="section-title">🧠 קוויז</div>
<div class="prog-row" onclick="nav('#quiz')">
  <span class="prog-row-icon">🧠</span>
  <span class="prog-row-title">קוויז 12 שאלות</span>
  <span class="prog-row-status" style="color:${quizPct!==null?'var(--green)':'var(--muted)'}">
    ${quizPct!==null?quizScore+'/'+quizTotal+' ('+progress.quizDone.date+')':'טרם בוצע'}
  </span>
</div>
<div style="margin-top:24px">
  <button class="btn btn-danger btn-sm" onclick="if(confirm('לאפס הכל?')){resetAll()}">🗑️ איפוס כל ההתקדמות</button>
</div>`;
}

window.resetAll = function() {
  progress.modules = []; progress.quizDone = {}; progress.scenarios = []; progress.checks = {};
  saveProgress(); updateMiniProg(); render(); showToast('אופס!');
};

// ===== SEARCH =====
function buildIndex() {
  const idx = [];
  DATA.sections.forEach(sec => {
    idx.push({ type: 'section', icon: sec.icon, title: sec.title, desc: sec.subsections.map(s=>s.title).join(', '), route: '#'+sec.id, text: sec.title + ' ' + sec.subsections.map(s=>s.title+' '+(s.content||'')).join(' ') });
    sec.subsections.forEach(sub => {
      idx.push({ type: 'subsection', icon: '📄', title: sub.title, desc: sec.title, route: '#'+sec.id, text: sub.title + ' ' + (sub.content||'') });
    });
  });
  DATA.contacts.forEach(c => {
    idx.push({ type: 'contact', icon: c.type==='internal'?'🏠':'🏢', title: c.name, desc: c.role + ' — ' + c.company, route: '#contacts', text: c.name + ' ' + c.role + ' ' + c.company + ' ' + (c.escalation||'') });
  });
  DATA.scenarios.forEach(s => {
    idx.push({ type: 'scenario', icon: s.icon, title: s.title, desc: s.situation.substring(0,80), route: '#scenarios/'+s.id, text: s.title + ' ' + s.situation });
  });
  DATA.quiz.forEach(q => {
    idx.push({ type: 'quiz', icon: '❓', title: q.text.substring(0,60), desc: 'שאלת קוויז', route: '#quiz', text: q.text + ' ' + q.options.join(' ') });
  });
  return idx;
}

function doSearch(q) {
  if (!q || q.length < 2) return [];
  const lq = q.toLowerCase();
  return buildIndex().filter(i => i.text.toLowerCase().includes(lq)).slice(0,25);
}

function showSearch(q) {
  const res = doSearch(q);
  const modal = document.getElementById('search-modal');
  const box = document.getElementById('sm-results');
  modal.classList.add('open');
  if (!res.length) { box.innerHTML = '<div class="sr-empty">לא נמצאו תוצאות</div>'; return; }
  const types = { section:'📚 קטעים', subsection:'📄 תת-קטעים', contact:'👥 אנשי קשר', scenario:'🎯 תרחישים', quiz:'🧠 קוויז' };
  const grp = {};
  res.forEach(r => { if (!grp[r.type]) grp[r.type] = []; grp[r.type].push(r); });
  let html = '';
  Object.entries(grp).forEach(([t,items]) => {
    html += `<div class="sr-cat">${types[t]||t}</div>`;
    items.slice(0,4).forEach(item => {
      html += `<div class="sr-item" onclick="nav('${item.route}');closeSearch()">
        <span class="sr-icon">${item.icon}</span>
        <div><div class="sr-title">${item.title}</div><div class="sr-desc">${item.desc}</div></div>
      </div>`;
    });
  });
  box.innerHTML = html;
}

window.closeSearch = function() {
  document.getElementById('search-modal').classList.remove('open');
  document.getElementById('nav-search-input').value = '';
};

// ===== TOAST =====
let toastT;
window.showToast = function(msg) {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; document.body.appendChild(el); }
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => el.classList.remove('show'), 2200);
};

// ===== MOBILE MENU =====
function initMenu() {
  const menuBtn = document.getElementById('menu-btn');
  const navEl = document.getElementById('nav');
  const overlay = document.getElementById('overlay');
  menuBtn?.addEventListener('click', () => { navEl.classList.add('open'); overlay.classList.add('open'); });
  overlay?.addEventListener('click', () => { navEl.classList.remove('open'); overlay.classList.remove('open'); });
  document.querySelectorAll('.nav-item a').forEach(a => a.addEventListener('click', () => {
    navEl.classList.remove('open'); overlay.classList.remove('open');
  }));
}

// ===== THEME =====
function initTheme() {
  const btn = document.getElementById('theme-btn');
  btn?.addEventListener('click', () => {
    document.body.classList.toggle('light');
    btn.textContent = document.body.classList.contains('light') ? '🌙' : '☀️';
    try { localStorage.setItem('theme2', document.body.classList.contains('light') ? 'light' : 'dark'); } catch(e) {}
  });
  if (document.body.classList.contains('light') && btn) btn.textContent = '☀️';
}

// Modal close
document.addEventListener('click', e => {
  if (e.target.classList.contains('sm-backdrop') || e.target.id === 'sm-close') closeSearch();
});

// Nav search input
document.getElementById('nav-search-input')?.addEventListener('input', function() {
  if (this.value.length >= 2) showSearch(this.value);
  else document.getElementById('search-modal').classList.remove('open');
});

// ===== INIT =====
async function init() {
  loadTheme();
  loadProgress();
  const ok = await loadData();
  if (!ok) return;
  render();
  initMenu();
  initTheme();
}
init();

// ===== OPEN TASKS =====
const TASKS_KEY = 'elad_open_tasks_v1';

function loadTasks() {
  try { const s = localStorage.getItem(TASKS_KEY); return s ? JSON.parse(s) : defaultTasks(); } catch(e) { return defaultTasks(); }
}
function saveTasks(tasks) {
  try { localStorage.setItem(TASKS_KEY, JSON.stringify(tasks)); } catch(e) {}
}
function defaultTasks() {
  return [
    { id: 't1', title: 'בדיקת אינטגרציה עם DPC אחרי עדכון גרסה', status: 'בתהליך', priority: 'גבוהה', against: 'וואלה טורס', contact: 'צחי לוי', notes: 'לבצע end-to-end ב-DPC ולוודא API יוצא תקין', created: '2025-01-08' },
    { id: 't2', title: 'הגדרת גורם עסקי/שיווק להסלמות שת"פ', status: 'פתוחה', priority: 'בינונית', against: 'פנימי', contact: '', notes: 'חסר ממלא תפקיד בטבלת הסלמה — להשלים', created: '2025-01-07' },
    { id: 't3', title: 'בחינת שיפור תהליך notice לשותפים לפני שחרור גרסה', status: 'פתוחה', priority: 'נמוכה', against: 'פנימי', contact: 'מיטל בן אהרון', notes: 'כרגע "basic notice" — לשקול מבנה מפורט יותר', created: '2025-01-06' }
  ];
}

function taskUID() { return 't' + Date.now(); }

function priorityDot(p) {
  const c = p === 'גבוהה' ? '#ef4444' : p === 'בינונית' ? '#eab308' : '#22c55e';
  return `<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${c};flex-shrink:0;margin-top:5px"></span>`;
}

function statusBadge(s) {
  const map = {
    'פתוחה':  'background:rgba(234,179,8,.15);color:#eab308',
    'בתהליך': 'background:rgba(91,108,240,.15);color:#8899ff',
    'תקועה':  'background:rgba(239,68,68,.15);color:#ef4444',
    'הושלמה': 'background:rgba(34,197,94,.15);color:#22c55e'
  };
  const style = map[s] || map['פתוחה'];
  return `<span style="padding:2px 9px;border-radius:20px;font-size:11.5px;font-weight:700;${style}">${s}</span>`;
}

function renderOpenTasks() {
  const tasks = loadTasks();
  const counts = { total: tasks.length, open: 0, wip: 0, stuck: 0, done: 0 };
  tasks.forEach(t => {
    if (t.status==='פתוחה') counts.open++;
    else if (t.status==='בתהליך') counts.wip++;
    else if (t.status==='תקועה') counts.stuck++;
    else if (t.status==='הושלמה') counts.done++;
  });

  const stats = `
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
      <div style="background:var(--bg-card2);border-radius:8px;padding:7px 14px;font-size:12.5px;display:flex;align-items:center;gap:8px"><span style="font-size:17px;font-weight:800">${counts.total}</span> סה"כ</div>
      <div style="background:rgba(234,179,8,.1);border-radius:8px;padding:7px 14px;font-size:12.5px;display:flex;align-items:center;gap:8px;color:#eab308"><span style="font-size:17px;font-weight:800">${counts.open}</span> פתוחות</div>
      <div style="background:rgba(91,108,240,.1);border-radius:8px;padding:7px 14px;font-size:12.5px;display:flex;align-items:center;gap:8px;color:#8899ff"><span style="font-size:17px;font-weight:800">${counts.wip}</span> בתהליך</div>
      <div style="background:rgba(239,68,68,.1);border-radius:8px;padding:7px 14px;font-size:12.5px;display:flex;align-items:center;gap:8px;color:#ef4444"><span style="font-size:17px;font-weight:800">${counts.stuck}</span> תקועות</div>
      <div style="background:rgba(34,197,94,.1);border-radius:8px;padding:7px 14px;font-size:12.5px;display:flex;align-items:center;gap:8px;color:#22c55e"><span style="font-size:17px;font-weight:800">${counts.done}</span> הושלמו</div>
    </div>`;

  const tasksHTML = tasks.length === 0
    ? `<div style="text-align:center;padding:32px;color:var(--muted)">אין משימות עדיין</div>`
    : tasks.map(t => `
      <div class="ot-card" id="ot-card-${t.id}" style="background:var(--bg-card2);border-radius:10px;padding:14px 16px;margin-bottom:10px;border:1px solid var(--border-c)">
        <div style="display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:start;cursor:pointer" onclick="otToggleEdit('${t.id}')">
          ${priorityDot(t.priority)}
          <div>
            <div style="font-size:14px;font-weight:700;margin-bottom:6px;line-height:1.4">${t.title}</div>
            <div style="display:flex;gap:7px;flex-wrap:wrap;align-items:center">
              ${statusBadge(t.status)}
              ${t.against ? `<span style="background:var(--bg-card2);border:1px solid var(--border-c);padding:2px 9px;border-radius:20px;font-size:11.5px;color:var(--muted)">🤝 ${t.against}</span>` : ''}
              ${t.contact ? `<span style="background:var(--bg-card2);border:1px solid var(--border-c);padding:2px 9px;border-radius:20px;font-size:11.5px;color:var(--muted)">👤 ${t.contact}</span>` : ''}
              <span style="font-size:11.5px;color:var(--muted)">${t.created}</span>
            </div>
            ${t.notes ? `<div style="margin-top:7px;font-size:12.5px;color:var(--muted)">💬 ${t.notes}</div>` : ''}
          </div>
          <div style="display:flex;gap:5px">
            <button onclick="event.stopPropagation();otToggleEdit('${t.id}')" style="background:var(--bg-card2);border:1px solid var(--border-c);border-radius:7px;width:30px;height:30px;cursor:pointer;font-size:14px;color:var(--muted)" title="ערוך">✏️</button>
            <button onclick="event.stopPropagation();otDelete('${t.id}')" style="background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.3);border-radius:7px;width:30px;height:30px;cursor:pointer;font-size:14px" title="מחק">🗑</button>
          </div>
        </div>
        <div id="ot-edit-${t.id}" style="display:none;border-top:1px solid var(--border-c);margin-top:12px;padding-top:14px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 16px">
            <div style="grid-column:1/-1">
              <label style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:4px">כותרת</label>
              <input id="ot-title-${t.id}" value="${t.title}" style="width:100%;background:var(--bg-card);border:1px solid var(--border-c);border-radius:7px;padding:8px 10px;color:var(--fg);font-size:13.5px;font-family:inherit"/>
            </div>
            <div>
              <label style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:4px">סטטוס</label>
              <select id="ot-status-${t.id}" style="width:100%;background:var(--bg-card);border:1px solid var(--border-c);border-radius:7px;padding:8px 10px;color:var(--fg);font-size:13.5px;font-family:inherit">
                ${['פתוחה','בתהליך','תקועה','הושלמה'].map(s=>`<option ${t.status===s?'selected':''}>${s}</option>`).join('')}
              </select>
            </div>
            <div>
              <label style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:4px">עדיפות</label>
              <select id="ot-priority-${t.id}" style="width:100%;background:var(--bg-card);border:1px solid var(--border-c);border-radius:7px;padding:8px 10px;color:var(--fg);font-size:13.5px;font-family:inherit">
                ${['גבוהה','בינונית','נמוכה'].map(p=>`<option ${t.priority===p?'selected':''}>${p}</option>`).join('')}
              </select>
            </div>
            <div>
              <label style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:4px">מול מי</label>
              <input id="ot-against-${t.id}" value="${t.against}" placeholder="חברה / גורם" style="width:100%;background:var(--bg-card);border:1px solid var(--border-c);border-radius:7px;padding:8px 10px;color:var(--fg);font-size:13.5px;font-family:inherit"/>
            </div>
            <div>
              <label style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:4px">איש קשר</label>
              <input id="ot-contact-${t.id}" value="${t.contact}" placeholder="שם + תפקיד" style="width:100%;background:var(--bg-card);border:1px solid var(--border-c);border-radius:7px;padding:8px 10px;color:var(--fg);font-size:13.5px;font-family:inherit"/>
            </div>
            <div style="grid-column:1/-1">
              <label style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:4px">הערות</label>
              <textarea id="ot-notes-${t.id}" rows="2" style="width:100%;background:var(--bg-card);border:1px solid var(--border-c);border-radius:7px;padding:8px 10px;color:var(--fg);font-size:13.5px;font-family:inherit;resize:vertical">${t.notes}</textarea>
            </div>
          </div>
          <div style="display:flex;gap:8px;margin-top:10px">
            <button onclick="otSave('${t.id}')" style="background:var(--accent);color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:13.5px;font-weight:700;cursor:pointer">💾 שמור</button>
            <button onclick="otToggleEdit('${t.id}')" style="background:var(--bg-card2);border:1px solid var(--border-c);border-radius:8px;padding:8px 14px;font-size:13.5px;cursor:pointer;color:var(--fg)">ביטול</button>
          </div>
        </div>
      </div>`).join('');

  return `
    <div class="card" style="margin-top:0">
      <div class="card-head">📋 משימות פתוחות</div>
      <p style="font-size:13px;color:var(--muted);margin-bottom:14px">מעקב ועריכה ישירה של משימות ותהליכים</p>
      ${stats}
      <div id="ot-list">${tasksHTML}</div>
      <button onclick="otAddNew()" style="margin-top:4px;background:var(--accent);color:#fff;border:none;border-radius:8px;padding:9px 18px;font-size:13.5px;font-weight:700;cursor:pointer;width:100%">＋ משימה חדשה</button>
    </div>`;
}

function initOpenTasks() {
  window.otToggleEdit = function(id) {
    const el = document.getElementById(`ot-edit-${id}`);
    if (!el) return;
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
  };

  window.otSave = function(id) {
    const tasks = loadTasks();
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    t.title    = document.getElementById(`ot-title-${id}`).value.trim() || t.title;
    t.status   = document.getElementById(`ot-status-${id}`).value;
    t.priority = document.getElementById(`ot-priority-${id}`).value;
    t.against  = document.getElementById(`ot-against-${id}`).value.trim();
    t.contact  = document.getElementById(`ot-contact-${id}`).value.trim();
    t.notes    = document.getElementById(`ot-notes-${id}`).value.trim();
    saveTasks(tasks);
    showToast('נשמר ✓');
    // re-render just the open tasks section
    const card = document.getElementById(`ot-card-${id}`);
    if (card) card.outerHTML = renderOpenTasks().match(new RegExp(`<div class="ot-card" id="ot-card-${id}"[\\s\\S]*?(?=<div class="ot-card"|<button onclick="otAddNew)`))?.[0] || '';
    // easier: just refresh the entire ot-list
    const main = document.getElementById('main');
    const versHTML = renderOpenTasks() + renderSection('versions');
    main.innerHTML = versHTML;
    initChecks();
    initOpenTasks();
  };

  window.otDelete = function(id) {
    if (!confirm('למחוק את המשימה?')) return;
    const tasks = loadTasks().filter(t => t.id !== id);
    saveTasks(tasks);
    showToast('נמחק');
    const main = document.getElementById('main');
    main.innerHTML = renderOpenTasks() + renderSection('versions');
    initChecks();
    initOpenTasks();
  };

  window.otAddNew = function() {
    const tasks = loadTasks();
    const t = { id: taskUID(), title: 'משימה חדשה', status: 'פתוחה', priority: 'בינונית', against: '', contact: '', notes: '', created: new Date().toISOString().split('T')[0] };
    tasks.unshift(t);
    saveTasks(tasks);
    const main = document.getElementById('main');
    main.innerHTML = renderOpenTasks() + renderSection('versions');
    initChecks();
    initOpenTasks();
    // auto-open edit for new task
    setTimeout(() => {
      const el = document.getElementById(`ot-edit-${t.id}`);
      if (el) el.style.display = 'block';
    }, 50);
  };
}

// ===== NEGOTIATIONS =====
const NEG_KEY = 'elad_negotiations_v1';

function loadNegs() {
  try { const s = localStorage.getItem(NEG_KEY); return s ? JSON.parse(s) : defaultNegs(); } catch(e) { return defaultNegs(); }
}
function saveNegs(items) {
  try { localStorage.setItem(NEG_KEY, JSON.stringify(items)); } catch(e) {}
}
function defaultNegs() {
  return [
    { id: 'n1', name: '', type: '', status: 'בבחינה', contact: '', notes: '', created: new Date().toISOString().split('T')[0] }
  ];
}
function negUID() { return 'n' + Date.now(); }

function negStatusBadge(s) {
  const map = {
    'בבחינה':    'background:rgba(234,179,8,.15);color:#eab308',
    'במו״מ פעיל':'background:rgba(91,108,240,.15);color:#8899ff',
    'ממתין לחתימה':'background:rgba(249,115,22,.15);color:#f97316',
    'פעיל':      'background:rgba(34,197,94,.15);color:#22c55e',
    'הוקפא':     'background:rgba(156,163,175,.15);color:#9ca3af',
    'בוטל':      'background:rgba(239,68,68,.15);color:#ef4444'
  };
  const style = map[s] || map['בבחינה'];
  return `<span style="padding:2px 9px;border-radius:20px;font-size:11.5px;font-weight:700;${style}">${s}</span>`;
}

const NEG_STATUSES = ['בבחינה','במו״מ פעיל','ממתין לחתימה','פעיל','הוקפא','בוטל'];
const NEG_TYPES = ['תקשורת','תעופה','פיננסים','נסיעות','מועדון','אחר'];

function renderNegotiations() {
  const items = loadNegs();

  const countByStatus = {};
  NEG_STATUSES.forEach(s => countByStatus[s] = 0);
  items.forEach(i => { if (countByStatus[i.status] !== undefined) countByStatus[i.status]++; });

  const stats = `
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
      ${NEG_STATUSES.map(s => `
        <div style="background:var(--bg-card2);border-radius:8px;padding:6px 12px;font-size:12px;display:flex;align-items:center;gap:7px">
          <span style="font-size:16px;font-weight:800">${countByStatus[s]}</span>
          ${negStatusBadge(s)}
        </div>`).join('')}
    </div>`;

  const list = items.length === 0
    ? `<div style="text-align:center;padding:32px;color:var(--muted)">אין שת״פים עדיין</div>`
    : items.map(item => `
      <div style="background:var(--bg-card2);border-radius:10px;padding:14px 16px;margin-bottom:10px;border:1px solid var(--border-c)" id="neg-card-${item.id}">
        <div style="display:grid;grid-template-columns:1fr auto;gap:10px;align-items:start">
          <div>
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:6px">
              <span style="font-size:14px;font-weight:700">${item.name || '(ללא שם)'}</span>
              ${negStatusBadge(item.status)}
              ${item.type ? `<span style="background:var(--bg-card2);border:1px solid var(--border-c);padding:2px 9px;border-radius:20px;font-size:11.5px;color:var(--muted)">${item.type}</span>` : ''}
            </div>
            ${item.contact ? `<div style="font-size:12.5px;color:var(--muted);margin-bottom:3px">👤 ${item.contact}</div>` : ''}
            ${item.notes   ? `<div style="font-size:12.5px;color:var(--muted)">💬 ${item.notes}</div>` : ''}
          </div>
          <div style="display:flex;gap:5px">
            <button onclick="negToggleEdit('${item.id}')" style="background:var(--bg-card2);border:1px solid var(--border-c);border-radius:7px;width:30px;height:30px;cursor:pointer;font-size:14px;color:var(--muted)" title="ערוך">✏️</button>
            <button onclick="negDelete('${item.id}')" style="background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.3);border-radius:7px;width:30px;height:30px;cursor:pointer;font-size:14px" title="מחק">🗑</button>
          </div>
        </div>

        <div id="neg-edit-${item.id}" style="display:none;border-top:1px solid var(--border-c);margin-top:12px;padding-top:14px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 16px">
            <div style="grid-column:1/-1">
              <label style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:4px">שם השת״פ / חברה</label>
              <input id="neg-name-${item.id}" value="${item.name}" placeholder="שם החברה או הגוף" style="width:100%;background:var(--bg-card);border:1px solid var(--border-c);border-radius:7px;padding:8px 10px;color:var(--fg);font-size:13.5px;font-family:inherit"/>
            </div>
            <div>
              <label style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:4px">סטטוס</label>
              <select id="neg-status-${item.id}" style="width:100%;background:var(--bg-card);border:1px solid var(--border-c);border-radius:7px;padding:8px 10px;color:var(--fg);font-size:13.5px;font-family:inherit">
                ${NEG_STATUSES.map(s=>`<option ${item.status===s?'selected':''}>${s}</option>`).join('')}
              </select>
            </div>
            <div>
              <label style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:4px">סוג</label>
              <select id="neg-type-${item.id}" style="width:100%;background:var(--bg-card);border:1px solid var(--border-c);border-radius:7px;padding:8px 10px;color:var(--fg);font-size:13.5px;font-family:inherit">
                <option value="">בחר סוג</option>
                ${NEG_TYPES.map(t=>`<option ${item.type===t?'selected':''}>${t}</option>`).join('')}
              </select>
            </div>
            <div style="grid-column:1/-1">
              <label style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:4px">איש קשר</label>
              <input id="neg-contact-${item.id}" value="${item.contact}" placeholder="שם + תפקיד + טלפון" style="width:100%;background:var(--bg-card);border:1px solid var(--border-c);border-radius:7px;padding:8px 10px;color:var(--fg);font-size:13.5px;font-family:inherit"/>
            </div>
            <div style="grid-column:1/-1">
              <label style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:4px">הערות / עדכון אחרון</label>
              <textarea id="neg-notes-${item.id}" rows="2" placeholder="מה קורה במו״מ, מה הצעד הבא..." style="width:100%;background:var(--bg-card);border:1px solid var(--border-c);border-radius:7px;padding:8px 10px;color:var(--fg);font-size:13.5px;font-family:inherit;resize:vertical">${item.notes}</textarea>
            </div>
          </div>
          <div style="display:flex;gap:8px;margin-top:10px">
            <button onclick="negSave('${item.id}')" style="background:var(--accent);color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:13.5px;font-weight:700;cursor:pointer">💾 שמור</button>
            <button onclick="negToggleEdit('${item.id}')" style="background:var(--bg-card2);border:1px solid var(--border-c);border-radius:8px;padding:8px 14px;font-size:13.5px;cursor:pointer;color:var(--fg)">ביטול</button>
          </div>
        </div>
      </div>`).join('');

  return `
    <div class="page-title">🤝 שת״פים במו״מ</div>
    <div class="page-sub">מעקב ועריכה ישירה של שיתופי פעולה בתהליך</div>
    <div class="card">
      ${stats}
      <div id="neg-list">${list}</div>
      <button onclick="negAddNew()" style="margin-top:4px;background:var(--accent);color:#fff;border:none;border-radius:8px;padding:9px 18px;font-size:13.5px;font-weight:700;cursor:pointer;width:100%">＋ שת״פ חדש</button>
    </div>`;
}

function negRerender() {
  const main = document.getElementById('main');
  main.innerHTML = renderNegotiations();
  initNegotiations();
}

function initNegotiations() {
  window.negToggleEdit = function(id) {
    const el = document.getElementById(`neg-edit-${id}`);
    if (!el) return;
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
  };

  window.negSave = function(id) {
    const items = loadNegs();
    const item = items.find(x => x.id === id);
    if (!item) return;
    item.name    = document.getElementById(`neg-name-${id}`).value.trim();
    item.status  = document.getElementById(`neg-status-${id}`).value;
    item.type    = document.getElementById(`neg-type-${id}`).value;
    item.contact = document.getElementById(`neg-contact-${id}`).value.trim();
    item.notes   = document.getElementById(`neg-notes-${id}`).value.trim();
    saveNegs(items);
    showToast('נשמר ✓');
    negRerender();
  };

  window.negDelete = function(id) {
    if (!confirm('למחוק את השת״פ?')) return;
    saveNegs(loadNegs().filter(x => x.id !== id));
    showToast('נמחק');
    negRerender();
  };

  window.negAddNew = function() {
    const items = loadNegs();
    const newItem = { id: negUID(), name: '', type: '', status: 'בבחינה', contact: '', notes: '', created: new Date().toISOString().split('T')[0] };
    items.unshift(newItem);
    saveNegs(items);
    negRerender();
    setTimeout(() => {
      const el = document.getElementById(`neg-edit-${newItem.id}`);
      if (el) { el.style.display = 'block'; el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
    }, 50);
  };
}
