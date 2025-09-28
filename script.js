/**********************
 * Typing Hero — stable + key hint + backspace + Sheets + "Level ต่อไป"
 **********************/

/* ====== CONFIG: your Apps Script Web App URL (public /macros/s form) ====== */
const SHEET_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwEBcc5Z9_-twatDhLsnHBbc5HNU6oYqY2ck3CdCNF8UTSwuZnRSjdnokGvmOA5a7UX/exec';

/* ====== helpers ====== */
const $ = id => document.getElementById(id);
const nowIso = () => new Date().toISOString();
function applyTheme(lvl){
  document.body.classList.remove('theme-1','theme-2','theme-3','theme-4','theme-5');
  const i = Math.min(Math.max(parseInt(lvl||1,10),1),5);
  document.body.classList.add(`theme-${i}`);
}
function saveProfile(p){ try{ localStorage.setItem('typingHeroProfile', JSON.stringify(p)); }catch{} }
function loadProfile(){ try{ const r=localStorage.getItem('typingHeroProfile'); return r?JSON.parse(r):null; }catch{ return null; } }
function fmt(sec){const m=String(Math.floor(sec/60)).padStart(2,'0');const s=String(Math.floor(sec%60)).padStart(2,'0');return `${m}:${s}`;}
function getApp(){ return $('app'); }
function isAppVisible(){ const a=getApp(); return !!(a && !a.hidden); }
function ensureSinkFocus(){ if(isAppVisible() && els.inp && document.activeElement!==els.inp) els.inp.focus(); }
function show(el){ if(el) el.hidden=false; }
function hide(el){ if(el) el.hidden=true; }

/* ====== lesson data: 3 sub-stages per level ====== */
const STAGES = {
  1: [
    'ก ก ก ก ด ด ด ป ป ป ม ม ม น น น ก ด ป ม น',
    'ส ส ส ท ท ท บ บ บ ร ร ร ล ล ล ส ท บ ร ล',
    'กา มา ปา ตา กา มา ปา ตา กา มา ปา ตา'
  ],
  2: [
    'เก เม เป เต เน เค เล เซ เด เบ เน เก เม',
    'กิ มิ ปิ ติ กิ มิ ปิ ติ กิ มิ ปิ ติ',
    'โค โต โบ โร โล โส โม โก โด โบ'
  ],
  3: [
    'ข้าว ปลา นม ไข่ บ้าน ปากกา สมุด ดินสอ ยางลบ',
    'แมว หมา นก ปลา ดอกไม้ ใบไม้ ดิน น้ำ ลม ไฟ',
    'ครู นักเรียน โรงเรียน ห้องเรียน สนามเด็กเล่น'
  ],
  4: [
    'วันนี้อากาศดี เราไปโรงเรียนแต่เช้า',
    'ฉันกินข้าว อาบน้ำ แปรงฟัน แล้วไปเรียน',
    'ตอนเย็นทำการบ้าน แล้วเข้านอนเร็ว'
  ],
  5: [
    'เช้านี้คุณพ่อพาฉันไปตลาดซื้อผักผลไม้สดใหม่',
    'หลังเลิกเรียนฉันอ่านหนังสือและทบทวนบทเรียน',
    'วันหยุดเราไปสวนสาธารณะ เดินเล่นและออกกำลังกาย'
  ]
};

/* ====== state & elements ====== */
let els = {};
let S = { level:1, stage:0, text:'', i:0, ok:0, bad:0, t0:null, timer:null };
const oskMap = Object.create(null);

/* ====== toast (small feedback bubble) ====== */
function showToast(msg, ok=true){
  let t = document.querySelector('.toast');
  if(!t){
    t = document.createElement('div');
    t.className = 'toast';
    t.style.cssText = 'position:fixed;left:50%;bottom:22px;transform:translateX(-50%);padding:10px 14px;border-radius:10px;font-size:14px;color:#fff;background:#16a34a;box-shadow:0 6px 16px rgba(0,0,0,.2);z-index:9999;opacity:0;transition:.25s';
    document.body.appendChild(t);
  }
  t.style.background = ok ? '#16a34a' : '#ef4444';
  t.textContent = msg;
  requestAnimationFrame(()=>{ t.style.opacity='1'; });
  setTimeout(()=>{ t.style.opacity='0'; }, 1600);
}

/* ====== key hint (green guide) ====== */
function updateKeyHint(){
  document.querySelectorAll('.key').forEach(k=>k.classList.remove('hint'));
  const exp = S.text?.[S.i] || '';
  if (!exp) return;
  if (exp === ' ') { document.querySelector('[data-special="space"]')?.classList.add('hint'); return; }
  document.querySelector(`.key[data-th="${CSS.escape(exp)}"]`)?.classList.add('hint');
}

/* ====== transitions & landing ====== */
function playTransition(fromId,toId,d=420){
  const f=$(fromId), t=$(toId); if(!t) return;
  document.body.classList.add('is-transitioning');
  if (f) f.classList.add('pageOut');
  setTimeout(()=>{
    if (f){ f.hidden=true; f.classList.remove('pageOut'); }
    t.hidden=false; void t.offsetWidth; t.classList.add('pageIn');
    setTimeout(()=>{ t.classList.remove('pageIn'); document.body.classList.remove('is-transitioning'); ensureSinkFocus(); }, d);
  }, d);
}
function goStart(){
  const first=($('firstName')?.value||'').trim();
  const last =($('lastName') ?.value||'').trim();
  const num  =($('number')   ?.value||'').trim();
  const room =($('room')     ?.value||'').trim();
  if(!first||!last||!num||!room){ alert('กรอกให้ครบ'); return; }
  saveProfile({firstName:first,lastName:last,number:num,room});
  applyTheme(1);
  playTransition('landing','app');
}
window.goStart = goStart;

/* ====== render & metrics ====== */
function render(){
  if (!els.box) return;
  els.box.innerHTML='';
  [...S.text].forEach((c,k)=>{
    const sp=document.createElement('span');
    sp.textContent=c;
    if(k===S.i) sp.classList.add('current');
    els.box.appendChild(sp);
  });
  updateKeyHint();
}
function metrics(){
  if (!els.cpm || !els.acc || !els.time || !els.bar) return;
  const t=S.t0?(Date.now()-S.t0)/1000:0, typed=S.ok+S.bad;
  els.cpm.textContent= t? Math.round((S.ok/t)*60):0;
  els.acc.textContent= typed? Math.round((S.ok/typed)*100)+'%':'100%';
  els.time.textContent=fmt(t);
  els.bar.style.width=(S.text.length? (S.i/S.text.length)*100:0)+'%';
}

/* ====== Sheets logging (file:// friendly) ====== */
async function sendResult(){
  const profile = loadProfile() || {};
  const payload = {
    firstName: profile.firstName || '',
    lastName : profile.lastName  || '',
    number   : profile.number    || '',
    room     : profile.room      || '',
    level    : S.level,
    stage    : S.stage,                 // 0..2
    cpm      : Number(els.cpm?.textContent || 0) || 0,
    accuracy : Number((els.acc?.textContent || '').replace('%','')) || 0,
    timeText : els.time?.textContent || '00:00',
    clientTs : nowIso(),
    ua       : navigator.userAgent || ''
  };
  try {
    await fetch(SHEET_WEBAPP_URL, {
      method: 'POST',
      mode: 'no-cors', // use 'cors' if serving from http://localhost
      headers: { 'Content-Type':'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    showToast('บันทึกผลแล้ว', true);
  } catch (err) {
    console.error('[TypingHero] sendResult failed:', err);
    showToast('บันทึกล้มเหลว', false);
  }
}

/* ====== stage / level control ====== */
function loadStage(level, stage){
  const arr = STAGES[level] || STAGES[1];
  const sIdx = Math.max(0, Math.min(stage ?? 0, arr.length-1));
  S.level = level; S.stage = sIdx;
  applyTheme(S.level);

  S.text = (arr[sIdx] || '').replace(/\s+/g,' ').trim();
  S.i=0; S.ok=0; S.bad=0; S.t0=Date.now();
  if (S.timer) clearInterval(S.timer);
  render();
  if (els.inp){ els.inp.value=''; ensureSinkFocus(); }
  S.timer = setInterval(metrics, 160); metrics();

  // while practicing, the "Level ต่อไป" button should be hidden
  hide(els.next);
}
function startLevel(){
  const lvl = parseInt(els.level?.value || S.level || 1, 10);
  loadStage(lvl, 0);
}
window.startLevel = startLevel;

function nextLevel(){
  const nextLvl = Math.min(5, S.level + 1);
  if (nextLvl === S.level) { hide(els.next); return; }
  // update dropdown UI, then load
  if (els.level) els.level.value = String(nextLvl);
  loadStage(nextLvl, 0);
  hide(els.next);
}

/* ====== typing & backspace ====== */
function handle(ch){
  if(!S.t0 || S.i>=S.text.length) return;
  const spans=els.box?.querySelectorAll('span'); if(!spans) return;
  const exp=S.text[S.i];
  if(ch===exp){ S.ok++; spans[S.i]?.classList.add('ok'); S.i++; spans.forEach(s=>s.classList.remove('current')); spans[S.i]?.classList.add('current'); }
  else{ S.bad++; spans[S.i]?.classList.add('bad'); }
  if(S.i>=S.text.length){
    clearInterval(S.timer); metrics();
    sendResult(); // save one sub-stage

    // If finished last sub-stage of this level, reveal "Level ต่อไป"
    const arr = STAGES[S.level] || STAGES[1];
    if (S.stage >= arr.length - 1){
      // finished .2 -> show next-level button (unless already at level 5)
      if (S.level < 5) show(els.next);
      else hide(els.next);
    }else{
      // not last sub-stage -> auto-advance after short pause
      setTimeout(()=> loadStage(S.level, S.stage + 1), 300);
    }
    return;
  }
  metrics();
  updateKeyHint();
}
function handleBackspace(){
  if (!S.t0) return;
  const spans = els.box?.querySelectorAll('span'); if(!spans) return;
  const cur = spans[S.i];
  if (cur && cur.classList.contains('bad')){ cur.classList.remove('bad'); metrics(); updateKeyHint(); return; }
  if (S.i <= 0){ spans.forEach(s=>s.classList.remove('current')); spans[0]?.classList.add('current'); metrics(); updateKeyHint(); return; }
  const prev = S.i - 1;
  if (spans[prev]?.classList.contains('ok')) S.ok = Math.max(0, S.ok - 1);
  spans[prev]?.classList.remove('ok','bad');
  spans.forEach(s=>s.classList.remove('current')); S.i = prev; spans[S.i]?.classList.add('current');
  metrics();
  updateKeyHint();
}

/* ====== EN→TH mapping from OSK (build from DOM) ====== */
function buildOskMap(){
  document.querySelectorAll('.key[data-en][data-th]').forEach(k=>{
    const en=(k.dataset.en||'').toLowerCase();
    const th=(k.dataset.th||'');
    if (en && th) oskMap[en]=th;
  });
  // enforce 1 => ๅ (in case DOM not yet parsed)
  oskMap['1'] = 'ๅ';
}
function mapPhysicalToThai(key){
  if (!key) return '';
  if (key.length === 1 && key.charCodeAt(0) > 127) return key; // Thai IME already
  const lc = key.length === 1 ? key.toLowerCase() : key;
  return oskMap[lc] ?? key;
}

/* ====== init ====== */
window.addEventListener('DOMContentLoaded', ()=>{
  els = {
    level: $('levelSelect'),
    start: $('startBtn'),
    reset: $('resetBtn'),
    next:  $('nextLevelBtn'),
    go:    $('goBtn'),
    inp:   $('hiddenInput'),
    box:   $('textDisplay'),
    cpm:   $('cpm'),
    acc:   $('acc'),
    time:  $('time'),
    bar:   $('progressBar')
  };

  applyTheme(1);
  buildOskMap();

  els.start && els.start.addEventListener('click', startLevel);
  els.reset && els.reset.addEventListener('click', ()=> loadStage(S.level, S.stage));
  els.next  && els.next.addEventListener('click', nextLevel);
  els.level && els.level.addEventListener('change', ()=>{
    S.level = parseInt(els.level.value,10)||1; S.stage=0; applyTheme(S.level);
    if(S.t0){ loadStage(S.level,0); }
  });
  $('goBtn')?.addEventListener('click', goStart);

  els.inp && els.inp.addEventListener('input', (e)=>{
    const val = els.inp.value;
    const ch = (e.data && e.data.length===1) ? e.data : (val ? val.slice(-1) : '');
    els.inp.value = '';
    if (ch) handle(ch);
  });

  document.addEventListener('click', (ev)=>{
    const app = getApp();
    if (app && !app.hidden && ev.target && app.contains(ev.target)) ensureSinkFocus();
  });

  window.addEventListener('keydown', (e)=>{
    if (!isAppVisible()) return;
    const t=e.target, tag=t && t.tagName;
    const isField = tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||(t && t.isContentEditable);
    if (isField && t !== els.inp) return;

    ensureSinkFocus();

    if (e.key === 'Backspace'){ e.preventDefault(); handleBackspace(); return; }
    if (e.key === ' ' || e.code === 'Space'){ e.preventDefault(); handle(' '); return; }

    if (e.key && e.key.length === 1){
      const code = e.key.charCodeAt(0);
      const isASCII = code <= 127;
      if (isASCII){
        const th = mapPhysicalToThai(e.key);
        if (th && th !== e.key){ e.preventDefault(); handle(th); }
      }
    }
  });

  document.body.classList.remove('is-transitioning');
});
