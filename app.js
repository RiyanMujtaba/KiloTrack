// ════════════════════════════════════════════════════════════════════
//  KILOTRACK — app.js
// ════════════════════════════════════════════════════════════════════

// ── FIREBASE CONFIG ──────────────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBXlQv4fcL6X2uijJisuDCc2fqFdoDT8K8",
  authDomain: "gym-site-a53bc.firebaseapp.com",
  projectId: "gym-site-a53bc",
  storageBucket: "gym-site-a53bc.firebasestorage.app",
  messagingSenderId: "792372294847",
  appId: "1:792372294847:web:eba281f7685e84660e020a"
};
function getGroqKey() {
  return localStorage.getItem('groq_api_key') || '';
}
const GROQ_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

// ── INIT ─────────────────────────────────────────────────────────────
firebase.initializeApp(FIREBASE_CONFIG);
const auth = firebase.auth();
const db   = firebase.firestore();

// ── STATE ────────────────────────────────────────────────────────────
const S = {
  user: null,
  profile: { name: '', unit: 'kg', calorieGoal: 2000 },
  gymSetup: null,
  currentView: 'home',
  calDate: todayStr(),
  calData: null,
  currentMeal: null,
  selectedFood: null,
  photoResult: null,
  prs: {},
  setup: { numDays: 4, selectedDOWs: [], trainingDays: [] }
};

// ════════════════════════════════════════════════════════════════════
//  UTILS
// ════════════════════════════════════════════════════════════════════
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function dateToStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  if (dateStr === todayStr()) return 'Today';
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
  if (dateStr === dateToStr(yesterday)) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day:'numeric', month:'short' });
}
function uid() { return S.user ? S.user.uid : null; }
function uref(path) { return db.doc(`users/${uid()}/data/${path}`); }
function ucol(path) { return db.collection(`users/${uid()}/${path}`); }

let toastTimer = null;
function showToast(msg, type = '') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.className = 'toast' + (type ? ' '+type : '');
  el.textContent = msg;
  el.classList.remove('hidden');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 2600);
}
function $(id) { return document.getElementById(id); }
function greet() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
function strengthLevel(exercise, est1rm) {
  const bw = S.profile.bodyWeight || 0;
  const ex = exercise.toLowerCase();

  // Bodyweight ratio thresholds per lift
  // If no bodyweight set, fall back to absolute kg thresholds
  const ratioTiers = {
    bench:    [0.75, 1.0, 1.25, 1.5],   // [beginner, intermediate, advanced, elite] × BW
    squat:    [1.0,  1.25, 1.5, 2.0],
    deadlift: [1.0,  1.5,  2.0, 2.5],
    overhead: [0.5,  0.65, 0.85, 1.0],
    row:      [0.75, 1.0,  1.25, 1.5],
  };
  const absThresholds = {
    bench:    [60,  100, 130, 160],
    squat:    [80,  120, 160, 200],
    deadlift: [100, 150, 200, 240],
    overhead: [40,  60,  80,  100],
    row:      [60,  90,  120, 150],
    default:  [40,  70,  100, 130],
  };

  let key = 'default';
  if (ex.includes('bench'))                            key = 'bench';
  else if (ex.includes('squat'))                       key = 'squat';
  else if (ex.includes('deadlift'))                    key = 'deadlift';
  else if (ex.includes('overhead') || ex.includes('ohp') || ex.includes('press')) key = 'overhead';
  else if (ex.includes('row'))                         key = 'row';

  let ratio = null;
  if (bw > 0) ratio = est1rm / bw;

  const tiers = ratio !== null ? ratioTiers[key] || ratioTiers.bench : null;
  const abs   = absThresholds[key] || absThresholds.default;
  const val   = ratio !== null ? ratio : est1rm;
  const thresholds = tiers || abs;

  const levels = [
    { label:'Just Getting Started 💪', caption:'Every legend starts here.', cls:'beginner' },
    { label:'Solid Lifter 🔥',         caption:'You\'re putting in real work!', cls:'intermediate' },
    { label:'Seriously Strong 💥',     caption:'Most people never reach this. You did.', cls:'advanced' },
    { label:'FREAK OF NATURE 👹',      caption:'Top 1%. Absolutely unreal.', cls:'elite' },
  ];

  if (val >= thresholds[3]) return levels[3];
  if (val >= thresholds[2]) return levels[2];
  if (val >= thresholds[1]) return levels[1];
  return levels[0];
}

// ════════════════════════════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════════════════════════════
function switchAuthTab(tab) {
  $('login-form').classList.toggle('hidden', tab !== 'login');
  $('signup-form').classList.toggle('hidden', tab !== 'signup');
  $('tab-login').classList.toggle('active', tab === 'login');
  $('tab-signup').classList.toggle('active', tab === 'signup');
  $('auth-error').classList.add('hidden');
}

async function handleLogin(e) {
  e.preventDefault();
  const email = $('login-email').value.trim();
  const pass  = $('login-password').value;
  try {
    await auth.signInWithEmailAndPassword(email, pass);
  } catch(err) {
    showAuthError(err.message);
  }
}
async function handleSignup(e) {
  e.preventDefault();
  const name  = $('signup-name').value.trim();
  const email = $('signup-email').value.trim();
  const pass  = $('signup-password').value;
  if (!name) { showAuthError('Please enter your name.'); return; }
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, pass);
    await urefWithUID(cred.user.uid, 'profile').set({ name, email, unit:'kg', calorieGoal:2000 });
  } catch(err) {
    showAuthError(err.message);
  }
}
async function handleGoogleSignIn() {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const cred = await auth.signInWithPopup(provider);
    const uid = cred.user.uid;
    const profileRef = urefWithUID(uid, 'profile');
    const snap = await profileRef.get();
    if (!snap.exists) {
      const name = cred.user.displayName || 'User';
      const email = cred.user.email || '';
      await profileRef.set({ name, email, unit:'kg', calorieGoal:2000 });
    }
  } catch(err) {
    showAuthError(err.message);
  }
}
function urefWithUID(uid, path) { return db.doc(`users/${uid}/data/${path}`); }

function showAuthError(msg) {
  const el = $('auth-error');
  const codeMatch = msg.match(/\(auth\/([\w-]+)\)/);
  const code = codeMatch ? codeMatch[1] : '';
  const friendly = {
    'operation-not-allowed': 'Email/password sign-in is not enabled. Contact the app owner.',
    'email-already-in-use': 'An account with this email already exists.',
    'invalid-email': 'Invalid email address.',
    'weak-password': 'Password must be at least 6 characters.',
    'user-not-found': 'No account found with this email.',
    'wrong-password': 'Incorrect password.',
    'too-many-requests': 'Too many attempts. Try again later.',
    'popup-closed-by-user': 'Sign-in popup was closed.',
    'unauthorized-domain': 'This domain is not authorized. Add it in Firebase Console → Authentication → Settings → Authorized domains.',
  }[code];
  el.textContent = friendly || msg.replace('Firebase: ','').replace(/\(auth\/[\w-]+\)/,'').trim() || 'Something went wrong.';
  el.classList.remove('hidden');
}
function handleLogout() {
  if (!confirm('Sign out?')) return;
  auth.signOut();
}

auth.onAuthStateChanged(async user => {
  if (user) {
    S.user = user;
    $('auth-screen').classList.add('hidden');
    $('app-screen').classList.remove('hidden');
    await loadProfile();
    await loadGymSetup();
    showView(S.currentView || 'home');
  } else {
    S.user = null;
    $('auth-screen').classList.remove('hidden');
    $('app-screen').classList.add('hidden');
  }
});

async function loadProfile() {
  try {
    const snap = await uref('profile').get();
    if (snap.exists) {
      S.profile = { unit:'kg', calorieGoal:2000, ...snap.data() };
    } else {
      const name = S.user.displayName || S.user.email.split('@')[0];
      S.profile = { name, email: S.user.email, unit:'kg', calorieGoal:2000 };
      await uref('profile').set(S.profile);
    }
    const initial = S.profile.name ? S.profile.name[0].toUpperCase() : '?';
    $('header-avatar').textContent = initial;
    $('greeting-text').textContent = `${greet()}, ${S.profile.name.split(' ')[0]}! 💪`;
    $('setting-unit').value = S.profile.unit || 'kg';
    $('setting-cal-goal').value = S.profile.calorieGoal || 2000;
    $('setting-bodyweight').value = S.profile.bodyWeight || '';
    $('setting-bodyweight-unit').textContent = S.profile.unit || 'kg';
    $('profile-name-big').textContent = S.profile.name;
    $('profile-email-text').textContent = S.user.email;
    $('profile-avatar-big').textContent = initial;
  } catch(err) { console.error('loadProfile', err); }
}

// ════════════════════════════════════════════════════════════════════
//  NAVIGATION
// ════════════════════════════════════════════════════════════════════
const NAV_VIEWS = ['home','gym','prs','calories','profile'];

function showView(name) {
  S.currentView = name;
  NAV_VIEWS.forEach(v => {
    const el = $(`view-${v}`);
    if (el) el.classList.toggle('active', v === name);
  });
  // gym-setup is not in NAV_VIEWS
  const gs = $('view-gym-setup');
  if (gs) gs.classList.toggle('active', name === 'gym-setup');
  // Update bottom nav
  document.querySelectorAll('.bnav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === name);
  });
  document.querySelectorAll('.desktop-nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === name);
  });
  // Load data for view
  if (name === 'home') loadHome();
  else if (name === 'gym') loadGymView();
  else if (name === 'prs') loadPRView();
  else if (name === 'calories') loadCalView();
  else if (name === 'profile') loadProfileView();
  else if (name === 'gym-setup') initSetupWizard();
}

// wire nav buttons
document.querySelectorAll('[data-view]').forEach(btn => {
  btn.addEventListener('click', () => showView(btn.dataset.view));
});

// ════════════════════════════════════════════════════════════════════
//  HOME VIEW
// ════════════════════════════════════════════════════════════════════
async function loadHome() {
  try {
    const today = todayStr();
    const dow = new Date().getDay();

    // Greeting sub
    if (S.gymSetup) {
      const td = S.gymSetup.trainingDays.find(d => d.dayOfWeek === dow);
      $('greeting-sub').textContent = td ? `${td.name} today. Let's go!` : 'Rest day today. Recover well.';
    } else {
      $('greeting-sub').textContent = 'Set up your gym split to get started.';
    }

    // Stats
    const [streak, weekCount, totalCount] = await Promise.all([
      calcStreak(), getWeekCount(), getTotalCount()
    ]);
    $('streak-num').textContent = streak;
    $('week-num').textContent = weekCount;
    $('total-num').textContent = totalCount;
    $('ps-streak').textContent = streak;
    $('ps-total').textContent = totalCount;

    // Week row
    renderWeekRow();

    // Today card
    await renderHomeTodayCard();

    // Macro summary
    await renderHomeMacroCard();
  } catch(err) { console.error('loadHome', err); }
}

async function calcStreak() {
  if (!S.gymSetup) return 0;
  let streak = 0;
  const d = new Date(); d.setDate(d.getDate()-1); // start from yesterday
  for (let i = 0; i < 60; i++) {
    const ds = dateToStr(d);
    const dow = d.getDay();
    const isTraining = S.gymSetup.trainingDays.some(td => td.dayOfWeek === dow);
    if (!isTraining) { streak++; d.setDate(d.getDate()-1); continue; }
    const snap = await ucol('attendance').doc(ds).get();
    if (snap.exists && snap.data().attended) { streak++; d.setDate(d.getDate()-1); }
    else break;
  }
  return streak;
}

async function getWeekCount() {
  const start = new Date(); start.setDate(start.getDate() - start.getDay());
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start); d.setDate(d.getDate()+i);
    dates.push(dateToStr(d));
  }
  let count = 0;
  for (const ds of dates) {
    const snap = await ucol('attendance').doc(ds).get();
    if (snap.exists && snap.data().attended) count++;
  }
  return count;
}

async function getTotalCount() {
  const snap = await ucol('attendance').where('attended','==',true).get();
  return snap.size;
}

function renderWeekRow() {
  const row = $('week-row');
  if (!row) return;
  const today = todayStr();
  const todayDOW = new Date().getDay();
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - todayDOW);
  let html = '';
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek); d.setDate(d.getDate()+i);
    const ds = dateToStr(d);
    const dow = d.getDay();
    const isToday = ds === today;
    const isRest = S.gymSetup ? !S.gymSetup.trainingDays.some(td => td.dayOfWeek === dow) : false;
    html += `<div class="week-day ${isToday?'today':''} ${isRest&&!isToday?'rest':''}" data-date="${ds}" id="wday-${ds}">
      <div class="week-day-label">${DAY_SHORT[dow]}</div>
      <div class="week-day-dot"></div>
    </div>`;
  }
  row.innerHTML = html;
  // load attendance for each day
  const start = new Date(); start.setDate(start.getDate()-todayDOW);
  for (let i = 0; i < 7; i++) {
    const d2 = new Date(start); d2.setDate(d2.getDate()+i);
    const ds = dateToStr(d2);
    ucol('attendance').doc(ds).get().then(snap => {
      const el = $(`wday-${ds}`);
      if (el && snap.exists && snap.data().attended) el.classList.add('attended');
    });
  }
}

async function renderHomeTodayCard() {
  const el = $('home-today-card');
  if (!el) return;
  const today = todayStr();
  const dow = new Date().getDay();
  const attSnap = await ucol('attendance').doc(today).get();
  const attended = attSnap.exists && attSnap.data().attended;

  if (!S.gymSetup) {
    el.innerHTML = `<div class="today-card"><p style="color:var(--muted);font-size:14px">Set up your split to track workouts.</p><button class="btn-primary" style="margin-top:12px;width:100%" onclick="showView('gym-setup')">Set Up Split</button></div>`;
    return;
  }
  const td = S.gymSetup.trainingDays.find(d => d.dayOfWeek === dow);
  if (!td) {
    el.innerHTML = `<div class="today-card rest-day"><div style="font-size:36px;text-align:center;margin-bottom:8px">😴</div><p style="text-align:center;font-weight:700;font-size:17px">Rest Day</p><p style="text-align:center;color:var(--muted);font-size:14px;margin-top:4px">Recovery is part of the program.</p></div>`;
  } else {
    const muscles = (td.muscles||[]).map(m => m[0].toUpperCase()+m.slice(1)).join(', ');
    el.innerHTML = `<div class="today-card ${attended?'attended-day':'training-day'}">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div><div style="font-weight:800;font-size:17px">${td.name}</div><div style="font-size:13px;color:var(--muted);margin-top:2px">${muscles}</div></div>
        <div style="font-size:13px;color:var(--muted)">${(td.exercises||[]).length} exercises</div>
      </div>
      <button class="checkin-btn ${attended?'checked':''}" onclick="toggleAttendance()" id="home-checkin-btn">
        <span class="checkin-icon">${attended?'✓':'○'}</span>
        <span>${attended?'Attended ✓':'Mark as Attended'}</span>
      </button>
    </div>`;
  }
}

async function renderHomeMacroCard() {
  const el = $('home-macro-card');
  if (!el) return;
  const data = await loadCalData(todayStr());
  const tots = calcTotals(data);
  const goal = S.profile.calorieGoal || 2000;
  const pct = Math.min(100, Math.round((tots.cal/goal)*100));
  el.innerHTML = `<div class="card" style="margin-top:8px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <span style="font-weight:700">Today's Calories</span>
      <button class="btn-ghost" onclick="showView('calories')">Log Food →</button>
    </div>
    <div style="font-size:28px;font-weight:800;color:var(--accent-light)">${tots.cal} <span style="font-size:14px;color:var(--muted);font-weight:400">/ ${goal} kcal</span></div>
    <div style="background:var(--surface2);border-radius:100px;height:6px;margin:10px 0;overflow:hidden">
      <div style="height:100%;border-radius:100px;background:var(--accent);width:${pct}%;transition:width .4s"></div>
    </div>
    <div style="display:flex;gap:16px;font-size:13px">
      <span style="color:var(--blue)">P: <b>${tots.p}g</b></span>
      <span style="color:var(--orange)">C: <b>${tots.c}g</b></span>
      <span style="color:var(--red)">F: <b>${tots.f}g</b></span>
    </div>
  </div>`;
}

async function toggleAttendance() { await markAttendance(false); } // legacy home button
async function markAttendance(isSkip) {
  if (!S.gymSetup) return;
  const today = todayStr();
  const snap = await ucol('attendance').doc(today).get();
  const data = snap.exists ? snap.data() : {};
  if (!isSkip) {
    const already = data.attended && !data.skipped;
    await ucol('attendance').doc(today).set({ attended: !already, skipped: false, date: today });
    showToast(!already ? '✓ Attendance marked!' : 'Attendance removed', !already ? 'success' : '');
  } else {
    const already = data.skipped;
    await ucol('attendance').doc(today).set({ attended: false, skipped: !already, date: today });
    showToast(!already ? '✗ Marked as skipped' : 'Skip removed', '');
  }
  loadGymView();
  loadHome();
}

// ════════════════════════════════════════════════════════════════════
//  GYM VIEW (today + history)
// ════════════════════════════════════════════════════════════════════
async function loadGymSetup() {
  try {
    const snap = await uref('gymSetup').get();
    S.gymSetup = snap.exists ? snap.data() : null;
  } catch(e) { S.gymSetup = null; }
}

async function loadGymView() {
  await loadGymSetup();
  const noSetup = $('gym-no-setup');
  const todaySec = $('gym-today-section');
  const historySec = $('gym-history-section');

  if (!S.gymSetup) {
    noSetup.classList.remove('hidden');
    todaySec.innerHTML = '';
    historySec.innerHTML = '';
    return;
  }
  noSetup.classList.add('hidden');
  const editRow = $('gym-edit-btn-row');
  if (editRow) editRow.classList.remove('hidden');

  // Today
  const today = todayStr();
  const dow = new Date().getDay();
  const td = S.gymSetup.trainingDays.find(d => d.dayOfWeek === dow);
  const attSnap = await ucol('attendance').doc(today).get();
  const attended = attSnap.exists && attSnap.data().attended;
  const skipped  = attSnap.exists && attSnap.data().skipped;

  let todayHTML = '';
  if (!td) {
    todayHTML = `<div class="card rest-card"><div class="rest-emoji">😴</div><div style="font-size:18px;font-weight:800">Rest Day</div><div style="color:var(--muted);margin-top:6px">Recovery is part of the process.</div></div>`;
  } else {
    const muscles = (td.muscles||[]).map(m=>m[0].toUpperCase()+m.slice(1)).join(' · ');
    const exerciseCards = (td.exercises||[]).map(ex => `
      <div class="exercise-card">
        <h4>${ex.name}</h4>
        <div class="sets-row">
          ${Array.from({length:parseInt(ex.sets)||0}).map((_,i)=>`<div class="set-chip">Set ${i+1}: ${ex.reps}</div>`).join('')}
        </div>
      </div>`).join('');
    todayHTML = `<div>
      <div class="workout-header">
        <h2 style="font-size:20px;font-weight:800">${td.name}</h2>
        <span class="day-badge">${muscles}</span>
      </div>
      <div class="attendance-btns" style="display:flex;gap:10px;margin-bottom:16px">
        <button class="checkin-btn ${attended?'checked':''}" onclick="markAttendance(false)" style="flex:1">
          <span class="checkin-icon">${attended?'✓':'○'}</span>
          <span>${attended?'Attended ✓':'Mark Attended'}</span>
        </button>
        <button class="checkin-btn skip-btn ${skipped?'skipped':''}" onclick="markAttendance(true)" style="flex:1">
          <span class="checkin-icon">${skipped?'✗':'○'}</span>
          <span>${skipped?'Skipped ✗':'Mark Skipped'}</span>
        </button>
      </div>
      <div class="exercise-list">${exerciseCards||'<p style="color:var(--muted);font-size:14px">No exercises added for this day.</p>'}</div>
    </div>`;
  }
  todaySec.innerHTML = todayHTML;

  // History (last 10 sessions)
  try {
    const snap = await ucol('attendance').where('attended','==',true).orderBy('date','desc').limit(10).get();
    let histHTML = `<div class="section-title" style="margin-top:28px">Recent Sessions</div>`;
    if (snap.empty) {
      histHTML += `<p style="color:var(--muted);font-size:14px">No sessions yet. Hit the gym and mark attendance!</p>`;
    } else {
      snap.docs.forEach(doc => {
        const dateStr = doc.data().date || doc.id;
        const d = new Date(dateStr+'T12:00:00');
        const dow2 = d.getDay();
        const sessionTD = S.gymSetup.trainingDays.find(t => t.dayOfWeek === dow2);
        histHTML += `<div class="history-item">
          <div><div class="history-date">${formatDate(dateStr)}</div><div class="history-sub">${sessionTD ? sessionTD.name : DAY_NAMES[dow2]}</div></div>
          <div class="history-badge">✓</div>
        </div>`;
      });
    }
    historySec.innerHTML = histHTML;
  } catch(e) {
    historySec.innerHTML = `<div class="section-title" style="margin-top:24px">Recent Sessions</div><p style="color:var(--muted);font-size:13px">Could not load history. Check Firestore index.</p>`;
  }
}

// ════════════════════════════════════════════════════════════════════
//  GYM SETUP WIZARD
// ════════════════════════════════════════════════════════════════════
function initSetupWizard() {
  // Pre-populate wizard with existing split if editing
  if (S.gymSetup && S.gymSetup.trainingDays && S.gymSetup.trainingDays.length > 0) {
    const tds = S.gymSetup.trainingDays;
    S.setup.numDays = tds.length;
    S.setup.selectedDOWs = tds.map(d => d.dayOfWeek);
    S.setup.trainingDays = JSON.parse(JSON.stringify(tds));
    // Mark the correct day count button active
    document.querySelectorAll('.day-count-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.days) === S.setup.numDays);
    });
  } else {
    S.setup = { numDays: 4, selectedDOWs: [], trainingDays: [] };
  }
  setupGoTo(1);
}

function setupGoTo(step) {
  // Validate before going forward
  if (step === 2 && !S.setup.numDays) { showToast('Pick a number of days first', 'error'); return; }
  if (step === 3) {
    const n = S.setup.numDays;
    if (S.setup.selectedDOWs.length !== n) { showToast(`Select exactly ${n} days`, 'error'); return; }
    buildDayConfigs();
  }
  if (step === 4) {
    // Validate each day has at least 1 muscle
    for (const td of S.setup.trainingDays) {
      if (!td.muscles || td.muscles.length === 0) { showToast(`Add muscles for ${td.name}`, 'error'); return; }
    }
    buildRatingDisplay();
  }
  for (let i = 1; i <= 4; i++) {
    const el = $(`setup-step-${i}`);
    if (el) el.classList.toggle('active', i === step);
    const dot = $(`step-dot-${i}`);
    if (dot) {
      dot.classList.toggle('active', i === step);
      dot.classList.toggle('done', i < step);
    }
    if (i < 4) {
      const line = $(`step-line-${i}`);
      if (line) line.classList.toggle('done', i < step);
    }
  }
}

// Days count buttons
document.querySelectorAll('.day-option-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    S.setup.numDays = parseInt(btn.dataset.days);
    document.querySelectorAll('.day-option-btn').forEach(b => b.classList.toggle('selected', b === btn));
  });
});

// Weekday buttons
document.querySelectorAll('.weekday-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const dow = parseInt(btn.dataset.dow);
    const idx = S.setup.selectedDOWs.indexOf(dow);
    if (idx === -1) {
      if (S.setup.selectedDOWs.length >= S.setup.numDays) {
        showToast(`You can only select ${S.setup.numDays} days`, 'error'); return;
      }
      S.setup.selectedDOWs.push(dow);
      btn.classList.add('selected');
    } else {
      S.setup.selectedDOWs.splice(idx, 1);
      btn.classList.remove('selected');
    }
    $('days-select-hint').textContent = `${S.setup.selectedDOWs.length} / ${S.setup.numDays} days selected`;
  });
});

function buildDayConfigs() {
  // Sort DOWs to standard order
  const sorted = [...S.setup.selectedDOWs].sort((a,b)=>a-b);
  // Preserve existing data if re-entering
  S.setup.trainingDays = sorted.map((dow, i) => {
    const existing = S.setup.trainingDays.find(td => td.dayOfWeek === dow);
    return existing || { dayOfWeek: dow, name: `Day ${i+1}`, muscles: [], exercises: [] };
  });

  const container = $('day-configs');
  container.innerHTML = S.setup.trainingDays.map((td, di) => `
    <div class="day-exercises-block" id="dayblock-${di}">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <input type="text" class="form-input" style="flex:1" value="${td.name}"
          placeholder="${DAY_NAMES[td.dayOfWeek]}" oninput="S.setup.trainingDays[${di}].name=this.value" />
        <span style="font-size:13px;color:var(--muted);white-space:nowrap">${DAY_NAMES[td.dayOfWeek]}</span>
      </div>
      <p style="font-size:13px;font-weight:600;margin-bottom:8px">Muscles trained:</p>
      <div class="muscle-grid">
        ${MUSCLES.map((m,mi) => `<button class="muscle-btn ${(td.muscles||[]).includes(MUSCLE_IDS[mi])?'selected':''}"
          onclick="toggleMuscle(${di},${mi})" id="mbtn-${di}-${mi}">${m}</button>`).join('')}
      </div>
      <p style="font-size:13px;font-weight:600;margin:12px 0 8px">Exercises:</p>
      <div id="exercises-${di}">
        ${(td.exercises||[]).map((ex,ei) => buildExRow(di, ei, ex)).join('')}
      </div>
      <button class="add-exercise-btn" onclick="addExerciseRow(${di})">+ Add Exercise</button>
    </div>
  `).join('');
}

function buildExRow(di, ei, ex) {
  return `<div class="ex-saved" id="exrow-${di}-${ei}">
    <div class="ex-info">
      <span style="font-weight:600;font-size:14px">${ex.name}</span>
      <span class="ex-sets-reps">${ex.sets} sets × ${ex.reps}</span>
    </div>
    <button class="ex-remove" onclick="removeExercise(${di},${ei})">✕</button>
  </div>`;
}

function toggleMuscle(di, mi) {
  const td = S.setup.trainingDays[di];
  const m = MUSCLE_IDS[mi];
  const idx = td.muscles.indexOf(m);
  if (idx === -1) td.muscles.push(m);
  else td.muscles.splice(idx, 1);
  const btn = $(`mbtn-${di}-${mi}`);
  if (btn) btn.classList.toggle('selected', td.muscles.includes(m));
}

function addExerciseRow(di) {
  const td = S.setup.trainingDays[di];
  // Show inline form
  const container = $(`exercises-${di}`);
  const tempId = `addex-${di}`;
  if ($( tempId)) return; // already open
  const el = document.createElement('div');
  el.id = tempId;
  el.style.cssText = 'background:var(--surface);border-radius:10px;padding:12px;margin-bottom:8px';
  el.innerHTML = `
    <select id="exname-${di}" class="form-input" style="margin-bottom:8px">
      <option value="">Select exercise...</option>
      ${COMMON_EXERCISES.map(e=>`<option>${e}</option>`).join('')}
    </select>
    <input type="text" id="exname-custom-${di}" class="form-input" placeholder="Or type custom name..." style="margin-bottom:8px">
    <div style="display:flex;gap:8px;margin-bottom:8px">
      <input type="number" id="exsets-${di}" class="form-input" placeholder="Sets" min="1" max="10" style="flex:1">
      <input type="text" id="exreps-${di}" class="form-input" placeholder="Reps (e.g. 8-12)" style="flex:2">
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn-secondary" style="flex:1;padding:9px" onclick="cancelExRow(${di})">Cancel</button>
      <button class="btn-primary" style="flex:1;padding:9px" onclick="confirmExRow(${di})">Add</button>
    </div>`;
  container.appendChild(el);
}

function cancelExRow(di) {
  const el = $(`addex-${di}`);
  if (el) el.remove();
}

function confirmExRow(di) {
  const sel = $(`exname-${di}`).value;
  const custom = $(`exname-custom-${di}`).value.trim();
  const name = custom || sel;
  const sets = parseInt($(`exsets-${di}`).value) || 3;
  const reps = $(`exreps-${di}`).value.trim() || '8-12';
  if (!name) { showToast('Enter an exercise name', 'error'); return; }
  const td = S.setup.trainingDays[di];
  td.exercises.push({ name, sets, reps });
  cancelExRow(di);
  // Re-render just exercises
  const container = $(`exercises-${di}`);
  container.innerHTML = td.exercises.map((ex,ei) => buildExRow(di, ei, ex)).join('');
}

function removeExercise(di, ei) {
  S.setup.trainingDays[di].exercises.splice(ei, 1);
  const container = $(`exercises-${di}`);
  container.innerHTML = S.setup.trainingDays[di].exercises.map((ex,ej) => buildExRow(di, ej, ex)).join('');
}

function buildRatingDisplay() {
  const result = rateSplit(S.setup.trainingDays);
  const barColor = result.gradeColor;
  const freqHtml = MUSCLE_IDS.map((m,i) => {
    const f = result.frequencies[m] || 0;
    return `<div class="freq-item"><span>${MUSCLES[i]}</span><span class="freq-badge ${f>=2?'good':''}">${f}×/wk</span></div>`;
  }).join('');
  $('rating-display').innerHTML = `
    <div class="rating-display">
      <div class="rating-score" style="color:${barColor}">${result.score}</div>
      <div class="rating-grade" style="color:${barColor}">Grade: ${result.grade}</div>
      <div class="rating-bar-wrap"><div class="rating-bar" style="width:${result.score}%;background:${barColor}"></div></div>
    </div>
    <div class="section-title">Muscle Frequency</div>
    <div class="freq-grid">${freqHtml}</div>
    ${result.feedback.length ? `<div class="section-title">Feedback</div>${result.feedback.map(f=>`<div class="feedback-item"><span>💡</span><span>${f}</span></div>`).join('')}` : '<div class="feedback-item"><span>✅</span><span>Solid split! No major issues.</span></div>'}
  `;
}

async function saveSplit() {
  try {
    const rating = rateSplit(S.setup.trainingDays);
    S.gymSetup = { trainingDays: S.setup.trainingDays, rating, updatedAt: todayStr() };
    await uref('gymSetup').set(S.gymSetup);
    showToast('Split saved! 💾', 'success');
    showView('gym');
  } catch(err) {
    showToast('Error saving. Try again.', 'error');
    console.error(err);
  }
}

// ════════════════════════════════════════════════════════════════════
//  PR VIEW
// ════════════════════════════════════════════════════════════════════
function loadPRView() {
  // Populate exercise selects
  const selects = [$('pr-exercise-sel'), $('lb-exercise-sel')];
  selects.forEach(sel => {
    if (!sel) return;
    const existing = sel.value;
    sel.innerHTML = sel === $('pr-exercise-sel')
      ? '<option value="">Select exercise...</option>'
      : '<option value="">Select exercise to view rankings...</option>';
    PR_EXERCISES.forEach(ex => {
      const opt = document.createElement('option');
      opt.value = ex; opt.textContent = ex;
      sel.appendChild(opt);
    });
    if (existing) sel.value = existing;
  });
  loadMyPRs();
}

async function loadMyPRs() {
  try {
    const snap = await ucol('prs').get();
    S.prs = {};
    snap.docs.forEach(doc => { S.prs[doc.id] = doc.data(); });
    const el = $('my-prs-list');
    if (!el) return;
    $('ps-prs').textContent = snap.size;
    if (snap.empty) {
      el.innerHTML = '<p style="color:var(--muted);font-size:14px">No PRs yet. Add your first one!</p>';
      return;
    }
    el.innerHTML = snap.docs.map(doc => {
      const pr = doc.data();
      const lvl = strengthLevel(pr.exercise, pr.est1rm);
      const bw = S.profile.bodyWeight;
      const ratioStr = bw ? `<span class="pr-ratio">${(pr.est1rm/bw).toFixed(2)}× bodyweight</span>` : '';
      return `<div class="pr-card">
        <div class="pr-card-header">
          <div class="pr-exercise-name">${pr.exercise}</div>
          <div class="pr-weight-display">${pr.weight} ${pr.unit}</div>
        </div>
        <div class="pr-meta">${pr.weight} ${pr.unit} × ${pr.reps} reps · ${formatDate(pr.date)} ${ratioStr}</div>
        <span class="pr-level ${lvl.cls}">${lvl.label}</span>
        <div class="pr-caption">${lvl.caption}</div>
      </div>`;
    }).join('');
  } catch(err) { console.error('loadMyPRs', err); }
}

function togglePRForm() {
  $('pr-add-form').classList.toggle('hidden');
}

async function submitPR() {
  const exercise = $('pr-exercise-sel').value;
  const weight = parseFloat($('pr-weight-inp').value);
  const unit = $('pr-unit-sel').value;
  const reps = parseInt($('pr-reps-inp').value);
  if (!exercise || !weight || !reps) { showToast('Fill all fields', 'error'); return; }
  const est1rm = calc1RM(unit === 'lbs' ? weight * 0.453592 : weight, reps);
  const pr = { exercise, weight, unit, reps, est1rm, date: todayStr() };
  const exId = exercise.replace(/[^a-z0-9]/gi,'_').toLowerCase();
  try {
    await ucol('prs').doc(exId).set(pr);
    // Also save to global leaderboard
    await db.doc(`globalPRs/${exId}_${uid()}`).set({
      ...pr, uid: uid(), userName: S.profile.name
    });
    showToast('PR saved! 💪', 'success');
    togglePRForm();
    $('pr-weight-inp').value = '';
    $('pr-reps-inp').value = '';
    $('pr-exercise-sel').value = '';
    loadMyPRs();
  } catch(err) { showToast('Error saving PR', 'error'); console.error(err); }
}

async function loadLeaderboard() {
  const exercise = $('lb-exercise-sel').value;
  const el = $('leaderboard-list');
  if (!el) return;
  if (!exercise) { el.innerHTML = ''; return; }
  const exId = exercise.replace(/[^a-z0-9]/gi,'_').toLowerCase();
  try {
    const snap = await db.collection('globalPRs')
      .where('exercise','==',exercise).orderBy('est1rm','desc').limit(20).get();
    if (snap.empty) { el.innerHTML = '<p style="color:var(--muted);font-size:14px">No records yet. Be the first!</p>'; return; }
    const medals = ['🥇','🥈','🥉'];
    const rankCls = ['gold','silver','bronze'];
    el.innerHTML = snap.docs.map((doc, i) => {
      const r = doc.data();
      const isMe = r.uid === uid();
      return `<div class="leaderboard-row">
        <div class="lb-rank ${rankCls[i]||''}">${medals[i]||`#${i+1}`}</div>
        <div class="lb-name">${r.userName}${isMe?'<span class="me-badge">you</span>':''}</div>
        <div><div class="lb-weight">${r.weight} ${r.unit}</div><div class="lb-est">${r.reps} reps · 1RM ~${r.est1rm}kg</div></div>
      </div>`;
    }).join('');
  } catch(err) {
    el.innerHTML = '<p style="color:var(--muted);font-size:13px">Could not load leaderboard. Firestore index may be needed.</p>';
    console.error(err);
  }
}

// ════════════════════════════════════════════════════════════════════
//  CALORIE VIEW
// ════════════════════════════════════════════════════════════════════
function loadCalView() {
  renderCalDate();
  loadCalData(S.calDate).then(data => {
    S.calData = data;
    renderCalView();
  });
}

function renderCalDate() {
  const lbl = $('cal-date-label');
  if (lbl) lbl.textContent = formatDate(S.calDate);
}

function shiftCalDay(delta) {
  const d = new Date(S.calDate + 'T12:00:00');
  d.setDate(d.getDate() + delta);
  const newStr = dateToStr(d);
  if (newStr > todayStr()) return; // no future
  S.calDate = newStr;
  loadCalView();
}

async function loadCalData(dateStr) {
  try {
    const snap = await ucol('foodLog').doc(dateStr).get();
    return snap.exists ? snap.data() : { breakfast:[], lunch:[], dinner:[], snacks:[] };
  } catch(e) { return { breakfast:[], lunch:[], dinner:[], snacks:[] }; }
}

async function saveCalData() {
  try {
    await ucol('foodLog').doc(S.calDate).set(S.calData);
  } catch(err) { console.error('saveCalData', err); }
}

function calcTotals(data) {
  const meals = ['breakfast','lunch','dinner','snacks'];
  let cal=0, p=0, f=0, c=0;
  meals.forEach(m => {
    (data[m]||[]).forEach(item => {
      cal += item.cal||0; p += item.p||0; f += item.f||0; c += item.c||0;
    });
  });
  return { cal: Math.round(cal), p: Math.round(p*10)/10, f: Math.round(f*10)/10, c: Math.round(c*10)/10 };
}

function renderCalView() {
  const meals = ['breakfast','lunch','dinner','snacks'];
  const tots = calcTotals(S.calData);
  const goal = S.profile.calorieGoal || 2000;

  // Macro overview
  const calPct = Math.min(100, Math.round((tots.cal/goal)*100));
  const pGoal=goal*0.3/4, cGoal=goal*0.45/4, fGoal=goal*0.25/9;
  $('macro-overview').innerHTML = `
    <div class="macro-cals"><div class="cal-num">${tots.cal}</div><div class="cal-goal">of ${goal} kcal goal (${calPct}%)</div></div>
    <div class="macro-bars">
      <div class="macro-bar-row"><span class="macro-bar-label" style="color:var(--blue)">Protein</span><div class="macro-bar-track"><div class="macro-bar-fill bar-protein" style="width:${Math.min(100,tots.p/pGoal*100)}%"></div></div><span class="macro-bar-val" style="color:var(--blue)">${tots.p}g</span></div>
      <div class="macro-bar-row"><span class="macro-bar-label" style="color:var(--orange)">Carbs</span><div class="macro-bar-track"><div class="macro-bar-fill bar-carbs" style="width:${Math.min(100,tots.c/cGoal*100)}%"></div></div><span class="macro-bar-val" style="color:var(--orange)">${tots.c}g</span></div>
      <div class="macro-bar-row"><span class="macro-bar-label" style="color:var(--red)">Fat</span><div class="macro-bar-track"><div class="macro-bar-fill bar-fat" style="width:${Math.min(100,tots.f/fGoal*100)}%"></div></div><span class="macro-bar-val" style="color:var(--red)">${tots.f}g</span></div>
    </div>`;

  meals.forEach(meal => {
    const items = S.calData[meal] || [];
    const mealCal = items.reduce((s,i)=>s+i.cal,0);
    $(`cals-${meal}`).textContent = `${mealCal} cal`;
    $(`items-${meal}`).innerHTML = items.map((item, idx) => `
      <div class="food-log-item">
        <div class="food-log-info">
          <div class="food-log-name">${item.name}</div>
          <div class="food-log-macros">P:${item.p}g · C:${item.c}g · F:${item.f}g</div>
        </div>
        <div class="food-log-cal">${item.cal}</div>
        <button class="food-remove-btn" onclick="removeFoodItem('${meal}',${idx})">✕</button>
      </div>`).join('');
  });
}

async function removeFoodItem(meal, idx) {
  S.calData[meal].splice(idx, 1);
  await saveCalData();
  renderCalView();
  renderHomeMacroCard();
}

// ════════════════════════════════════════════════════════════════════
//  FOOD MODAL
// ════════════════════════════════════════════════════════════════════
function openFoodModal(meal) {
  S.currentMeal = meal;
  S.selectedFood = null;
  S.photoResult = null;
  $('food-modal').classList.remove('hidden');
  $('food-modal-title').textContent = `Add to ${meal[0].toUpperCase()+meal.slice(1)}`;
  document.querySelectorAll('.add-meal-name').forEach(el => el.textContent = meal[0].toUpperCase()+meal.slice(1));
  switchFoodTab('search');
  $('food-search-inp').value = '';
  renderFoodResults(searchFoodsDB(''));
}

function closeFoodModal() {
  $('food-modal').classList.add('hidden');
  $('selected-food-panel').classList.add('hidden');
  $('photo-result-section').classList.add('hidden');
  $('photo-preview-section').classList.add('hidden');
  $('photo-input-section').classList.remove('hidden');
}

function onModalOverlayClick(e) {
  if (e.target === $('food-modal')) closeFoodModal();
}

function switchFoodTab(tab) {
  ['search','photo','custom'].forEach(t => {
    $(`ftab-${t}`).classList.toggle('active', t === tab);
    $(`food-tab-${t}`).classList.toggle('active', t === tab);
  });
  if (tab === 'search') {
    setTimeout(() => $('food-search-inp') && $('food-search-inp').focus(), 100);
  }
}

let searchTimer = null;
function onFoodSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    const q = $('food-search-inp').value;
    renderFoodResults(searchFoodsDB(q));
    $('selected-food-panel').classList.add('hidden');
  }, 200);
}

function renderFoodResults(foods) {
  const el = $('food-search-results');
  if (!el) return;
  el.innerHTML = foods.map(f => `
    <div class="food-result-item" onclick="selectFood('${f.id}')">
      <div><div class="fr-name">${f.name}</div><div class="fr-serving">per ${f.serving}${f.unit}</div></div>
      <div class="fr-cal">${f.cal} kcal</div>
    </div>`).join('') || '<p style="color:var(--muted);text-align:center;padding:20px;font-size:14px">No results found</p>';
}

function selectFood(foodId) {
  const food = FOODS.find(f => f.id === foodId) || (S.customFoods||[]).find(f => f.id === foodId);
  if (!food) return;
  S.selectedFood = food;
  $('sf-name').textContent = food.name;
  $('serving-amount-inp').value = 1;
  $('serving-unit-label').textContent = `× ${food.serving}${food.unit}`;
  updateServingPreview();
  $('selected-food-panel').classList.remove('hidden');
  $('food-search-results').innerHTML = '';
}

function updateServingPreview() {
  if (!S.selectedFood) return;
  const servings = parseFloat($('serving-amount-inp').value) || 1;
  const amount = servings * S.selectedFood.serving;
  const n = calcNutrition(S.selectedFood, amount);
  $('sf-macros').innerHTML = `
    <div class="sf-macro"><div class="sf-macro-val">${n.cal}</div><div class="sf-macro-label">kcal</div></div>
    <div class="sf-macro"><div class="sf-macro-val" style="color:var(--blue)">${n.p}g</div><div class="sf-macro-label">Protein</div></div>
    <div class="sf-macro"><div class="sf-macro-val" style="color:var(--orange)">${n.c}g</div><div class="sf-macro-label">Carbs</div></div>
    <div class="sf-macro"><div class="sf-macro-val" style="color:var(--red)">${n.f}g</div><div class="sf-macro-label">Fat</div></div>`;
}

async function addSelectedFood() {
  if (!S.selectedFood) return;
  const servings = parseFloat($('serving-amount-inp').value) || 1;
  const amount = servings * S.selectedFood.serving;
  const n = calcNutrition(S.selectedFood, amount);
  const servingLabel = servings === 1 ? `1 serving` : `${servings} servings`;
  const entry = { name: `${S.selectedFood.name} (${servingLabel})`, ...n };
  await addToMeal(entry);
}

async function addToMeal(entry) {
  if (!S.calData[S.currentMeal]) S.calData[S.currentMeal] = [];
  S.calData[S.currentMeal].push(entry);
  await saveCalData();
  renderCalView();
  renderHomeMacroCard();
  closeFoodModal();
  showToast('Added! 🥗', 'success');
}

// ── PHOTO ANALYSIS ────────────────────────────────────────────────
async function handleFoodPhoto(event) {
  const file = event.target.files[0];
  if (!file) return;
  event.target.value = ''; // reset input
  $('photo-input-section').classList.add('hidden');
  $('photo-result-section').classList.add('hidden');
  // Preview
  const reader = new FileReader();
  reader.onload = e => {
    $('photo-preview-img').src = e.target.result;
    $('photo-preview-section').classList.remove('hidden');
  };
  reader.readAsDataURL(file);
  $('photo-analyzing-section').classList.remove('hidden');
  try {
    const base64 = await fileToBase64(file);
    const result = await analyzeImageWithGroq(base64);
    S.photoResult = result;
    $('photo-analyzing-section').classList.add('hidden');
    renderPhotoResult(result);
  } catch(err) {
    $('photo-analyzing-section').classList.add('hidden');
    showToast('Could not analyse photo. Try again.', 'error');
    $('photo-input-section').classList.remove('hidden');
    console.error('photo analysis', err);
  }
}

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = e => {
      const b64 = e.target.result.split(',')[1];
      res(b64);
    };
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

async function analyzeImageWithGroq(base64) {
  const key = getGroqKey();
  if (!key) {
    const k = prompt('Enter your Groq API key (saved locally, never uploaded):');
    if (!k) throw new Error('No API key provided');
    localStorage.setItem('groq_api_key', k.trim());
  }
  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getGroqKey()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
          { type: 'text', text: `Analyze this food image carefully. Identify every food item you can see and estimate their nutritional content accurately for the portions shown. Return ONLY a valid JSON object, no other text: {"items":[{"name":"food name","calories":0,"protein":0,"fat":0,"carbs":0,"portion":"e.g. 1 cup or 200g"}],"total":{"calories":0,"protein":0,"fat":0,"carbs":0}}` }
        ]
      }],
      max_tokens: 800,
      temperature: 0.1
    })
  });
  if (!resp.ok) throw new Error(`Groq API error ${resp.status}`);
  const data = await resp.json();
  const text = data.choices[0].message.content;
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON in response');
  return JSON.parse(match[0]);
}

function renderPhotoResult(result) {
  const items = result.items || [];
  const tot = result.total || { calories:0, protein:0, fat:0, carbs:0 };
  $('photo-detected-items').innerHTML = items.map(item => `
    <div class="photo-result-item">
      <span>${item.name} <span style="color:var(--muted);font-size:12px">(${item.portion})</span></span>
      <span style="font-weight:700;color:var(--accent-light)">${item.calories} kcal</span>
    </div>`).join('');
  $('photo-totals-box').innerHTML = `
    <div style="font-weight:700;margin-bottom:6px">Total</div>
    <div style="display:flex;gap:16px;font-size:14px">
      <span style="font-weight:800;font-size:18px;color:var(--accent-light)">${tot.calories} kcal</span>
      <span style="color:var(--blue)">P:${tot.protein}g</span>
      <span style="color:var(--orange)">C:${tot.carbs}g</span>
      <span style="color:var(--red)">F:${tot.fat}g</span>
    </div>`;
  $('photo-result-section').classList.remove('hidden');
  // Pre-fill custom form in case user wants to edit
  $('custom-name').value = items.map(i=>i.name).join(', ') || 'Photo meal';
  $('custom-cal').value = tot.calories;
  $('custom-protein').value = tot.protein;
  $('custom-carbs').value = tot.carbs;
  $('custom-fat').value = tot.fat;
}

async function addPhotoFood() {
  if (!S.photoResult) return;
  const tot = S.photoResult.total;
  const name = S.photoResult.items.map(i=>i.name).join(', ') || 'Photo meal';
  await addToMeal({ name, cal:tot.calories||0, p:tot.protein||0, c:tot.carbs||0, f:tot.fat||0 });
}

// ── CUSTOM FOOD ───────────────────────────────────────────────────
async function addCustomFood() {
  const name = $('custom-name').value.trim();
  const cal = parseFloat($('custom-cal').value) || 0;
  const p   = parseFloat($('custom-protein').value) || 0;
  const c   = parseFloat($('custom-carbs').value) || 0;
  const f   = parseFloat($('custom-fat').value) || 0;
  if (!name) { showToast('Enter a food name', 'error'); return; }
  const entry = { name, cal, p, c, f };
  if ($('custom-save-chk').checked) {
    const id = name.replace(/[^a-z0-9]/gi,'_').toLowerCase() + '_' + Date.now();
    try { await ucol('customFoods').doc(id).set({ ...entry, serving:100, unit:'g' }); } catch(e) {}
  }
  await addToMeal(entry);
  $('custom-name').value = '';
  $('custom-cal').value = '';
  $('custom-protein').value = '';
  $('custom-carbs').value = '';
  $('custom-fat').value = '';
  $('custom-save-chk').checked = false;
}

// ════════════════════════════════════════════════════════════════════
//  PROFILE VIEW
// ════════════════════════════════════════════════════════════════════
async function loadProfileView() {
  $('profile-name-big').textContent = S.profile.name || 'User';
  $('profile-email-text').textContent = S.user ? S.user.email : '';
  $('profile-avatar-big').textContent = S.profile.name ? S.profile.name[0].toUpperCase() : '?';
  $('setting-unit').value = S.profile.unit || 'kg';
  $('setting-cal-goal').value = S.profile.calorieGoal || 2000;
  $('setting-bodyweight').value = S.profile.bodyWeight || '';
  $('setting-bodyweight-unit').textContent = S.profile.unit || 'kg';
  const [streak, total] = await Promise.all([calcStreak(), getTotalCount()]);
  $('ps-streak').textContent = streak;
  $('ps-total').textContent = total;
  const prSnap = await ucol('prs').get();
  $('ps-prs').textContent = prSnap.size;
  if (S.gymSetup) {
    const days = S.gymSetup.trainingDays.map(d=>d.name).join(' · ');
    const rating = S.gymSetup.rating;
    $('profile-split-info').innerHTML = `<div>${days}</div><div style="margin-top:4px;font-size:13px">Rating: <b style="color:${rating.gradeColor}">${rating.grade} (${rating.score}/100)</b></div>`;
  } else {
    $('profile-split-info').textContent = 'Not set up yet';
  }
}

async function saveSettings() {
  S.profile.unit = $('setting-unit').value;
  S.profile.calorieGoal = parseInt($('setting-cal-goal').value) || 2000;
  S.profile.bodyWeight = parseFloat($('setting-bodyweight').value) || 0;
  try {
    await uref('profile').update({ unit: S.profile.unit, calorieGoal: S.profile.calorieGoal, bodyWeight: S.profile.bodyWeight });
    $('setting-bodyweight-unit').textContent = S.profile.unit;
    showToast('Settings saved ✓', 'success');
  } catch(err) { showToast('Error saving', 'error'); }
}

// ════════════════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════════════════
// Pre-select 4 days in setup
document.querySelector('.day-option-btn[data-days="4"]').classList.add('selected');
