/* BRAND (ชื่อระบบ โลโก้ สี ประกาศ): อ่านค่าที่แคชไว้ในเครื่องก่อน แล้วขอค่าล่าสุดจาก backend ตอนเริ่มแอป (ดู init ใน help.js) */
var BRAND = (function(){ try { return JSON.parse(localStorage.getItem('smc_brand') || 'null'); } catch (e) { return null; } })();
/* ================= แกนหลัก ================= */
var S = { token: null, boot: null, page: 'dashboard', ym: null, pid: null };
var TH_M = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
var TH_MF = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
var TH_D = ['อา','จ','อ','พ','พฤ','ศ','ส'];
var TH_DF = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];

function $(id){ return document.getElementById(id); }
function $$(sel, root){ return [].slice.call((root || document).querySelectorAll(sel)); }
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function store(k, v){ try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch(e){ return null; } }
function fmt(n, d){ n = +n || 0; return n.toLocaleString('th-TH', { minimumFractionDigits: d || 0, maximumFractionDigits: d == null ? 2 : d }); }
function thYm(ym){ var p = ym.split('-'); return TH_MF[+p[1]-1] + ' ' + (+p[0] + 543); }
function thDate(d){ var p = d.split('-'); return +p[2] + ' ' + TH_M[+p[1]-1] + ' ' + String(+p[0] + 543).slice(2); }
function thDateFull(d){ var p = d.split('-'); return +p[2] + ' ' + TH_M[+p[1]-1] + ' ' + (+p[0] + 543); }
function dowOf(d){ var p = d.split('-'); return new Date(Date.UTC(+p[0], +p[1]-1, +p[2])).getUTCDay(); }
function addYm(ym, n){ var p = ym.split('-'); var y = +p[0], m = +p[1] + n; while (m > 12){ m -= 12; y++; } while (m < 1){ m += 12; y--; } return y + '-' + (m < 10 ? '0' : '') + m; }
function lastDay(ym){ var p = ym.split('-'); return ym + '-' + new Date(Date.UTC(+p[0], +p[1], 0)).getUTCDate(); }
function has(role){ var r = S.boot.me.roles; return r.indexOf('ADMIN') >= 0 || r.indexOf(role) >= 0; }
function posOf(id){ return S.boot.positions.filter(function(x){ return x.id === id; })[0] || null; }
function posName(id){ var p = posOf(id); return p ? p.name : id; }
function normT(v){ v = String(v || '').trim().replace('.', ':'); if (/^\d{3,4}$/.test(v)) v = (v.length === 3 ? '0' : '') + v.slice(0, -2) + ':' + v.slice(-2); var m = v.match(/^(\d{1,2}):(\d{2})$/); if (!m || +m[1] > 23 || +m[2] > 59) return ''; return (m[1].length < 2 ? '0' : '') + m[1] + ':' + m[2]; }
function tMin(t){ var n = normT(t); if (!n) return null; var p = n.split(':'); return +p[0] * 60 + +p[1]; }
function mTime(m){ return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
function addMin(t, n){ return mTime(tMin(t) + n); }
function initials(n){ var p = String(n || '').split(' ').filter(Boolean); return (p[1] || p[0] || '?').slice(0, 1); }
/* ---------- ชื่อและตัวย่อช่วงเวร (รหัสภายใน ช1/ช2/บ1 · แสดงผลตามที่ตั้งค่า) ---------- */
function slotL(code){ var L = (S.boot && S.boot.slotLabels) || {}; return L[code] || { s: code, en: '', name: code }; }
function lbl(text){ return String(text == null ? '' : text).replace(/ช1|ช2|บ1/g, function(c){ return slotL(c).s; }); }
function slotTag(code){ var l = slotL(code); return '<span class="tag brand" title="' + esc(l.name + (l.en ? ' (' + l.en + ')' : '')) + '">' + esc(l.s) + (l.en ? ' <small>' + esc(l.en) + '</small>' : '') + '</span>'; }
function codesTag(codes){ return String(codes || '').split(',').filter(String).map(slotTag).join(' '); }
/** คำอธิบายตัวย่อ พร้อมเวลาของตำแหน่ง (ถ้าระบุ) */
function legendHtml(pos){
  return '<div class="legend"><i class="bi bi-info-circle"></i> <b>คำอธิบายตัวย่อ</b> ' + ['ช1', 'ช2', 'บ1'].map(function(k){
    var l = slotL(k), t = '';
    if (pos) { var L = +pos.shiftMinutes || 240, st = RULES.starts(pos)[k]; t = ' ' + st.map(function(m){ return mTime(m) + '–' + mTime(m + L); }).join(' / ') + ' น.'; }
    return '<span class="lg"><span class="tag brand">' + esc(l.s) + '</span> ' + esc(l.name) + (l.en ? ' (' + esc(l.en) + ')' : '') + t + '</span>';
  }).join('') + '</div>';
}
function isDemo(ym){ return S.boot && (S.boot.demoMonths || []).indexOf(ym) >= 0; }

/* ================= รูปลักษณ์ (สี โลโก้ ประกาศ ส่วนท้าย) ================= */
function hexToRgb(h){ var m = String(h || '').match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i); return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [215, 38, 56]; }
function shade(rgb, f){ return rgb.map(function(v){ return Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f))); }); }
function rgbStr(a){ return 'rgb(' + a.join(',') + ')'; }
function applyBrand(b){
  BRAND = b || BRAND || {};
  var c = hexToRgb(BRAND.brandColor), r = document.documentElement.style;
  r.setProperty('--brand', rgbStr(c));
  r.setProperty('--brand-600', rgbStr(shade(c, -0.16)));
  r.setProperty('--brand-50', rgbStr(shade(c, 0.92)));
  r.setProperty('--brand-100', rgbStr(shade(c, 0.8)));
  r.setProperty('--brand-rgb', c.join(','));
  r.setProperty('--brand-grad', 'linear-gradient(135deg,' + rgbStr(shade(c, 0.12)) + ' 0%,' + rgbStr(shade(c, -0.12)) + ' 100%)');
  // v1.3.1 ตัดขอบขาวรอบโลโก้อัตโนมัติ (โลโก้จะเต็มกรอบ ดูสมส่วน) แล้วจำไว้ในเครื่อง
  if (BRAND.logo && BRAND.logoTrimVer !== (BRAND.logoVer || BRAND.logo.length)) {
    trimLogo(BRAND.logo, function(t){ BRAND.logoTrim = t; BRAND.logoTrimVer = BRAND.logoVer || BRAND.logo.length; applyBrand(BRAND); });
  }
  var lg = BRAND.logoTrim || BRAND.logo;
  $$('.brand-logo').forEach(function(el){ el.innerHTML = lg ? '<img src="' + lg + '" alt="โลโก้">' : '<i class="bi bi-plus-lg"></i>'; el.classList.toggle('has-img', !!lg); });
  try { if (BRAND && BRAND.version) store('smc_brand', JSON.stringify(BRAND)); } catch (e) { }
  $$('.brand-short').forEach(function(el){ el.textContent = BRAND.short || 'SMC Duty'; });
  $$('.brand-org').forEach(function(el){ el.textContent = BRAND.org || ''; });
  var f = footerHtml();
  if ($('footLogin')) $('footLogin').innerHTML = f;
  if ($('footApp')) $('footApp').innerHTML = f;
  var a = annHtml();
  if ($('annLogin')) $('annLogin').innerHTML = a;
  if ($('annApp')) $('annApp').innerHTML = a ? '<div class="ann-wrap">' + a + '</div>' : '';
}
/** ตัดพื้นที่ว่างสีขาว/โปร่งใสรอบโลโก้ เว้นขอบ 6% */
function trimLogo(src, cb){
  try {
    var img = new Image();
    img.onload = function(){
      try {
        var W = img.naturalWidth, H = img.naturalHeight, k = Math.min(1, 400 / Math.max(W, H));
        var cv = document.createElement('canvas'); cv.width = Math.round(W * k); cv.height = Math.round(H * k);
        var g = cv.getContext('2d'); g.drawImage(img, 0, 0, cv.width, cv.height);
        var d = g.getImageData(0, 0, cv.width, cv.height).data, x0 = cv.width, y0 = cv.height, x1 = -1, y1 = -1;
        for (var y = 0; y < cv.height; y++) for (var x = 0; x < cv.width; x++) { var i = (y * cv.width + x) * 4; if (d[i + 3] > 24 && (d[i] < 236 || d[i + 1] < 236 || d[i + 2] < 236)) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
        if (x1 < 0) return cb(src);
        var bw = x1 - x0 + 1, bh = y1 - y0 + 1, side = Math.max(bw, bh), pad = Math.round(side * 0.06), S2 = side + pad * 2;
        if (S2 >= Math.max(cv.width, cv.height) * 0.94) return cb(src);   // ขอบน้อยอยู่แล้ว
        var sc = Math.min(512, Math.round(S2 / k)) / S2;
        var out = document.createElement('canvas'); out.width = out.height = Math.round(S2 * sc);
        var o = out.getContext('2d'); o.fillStyle = '#fff'; o.fillRect(0, 0, out.width, out.height); o.imageSmoothingQuality = 'high';
        o.drawImage(img, x0 / k, y0 / k, bw / k, bh / k, (pad + (side - bw) / 2) * sc, (pad + (side - bh) / 2) * sc, bw * sc, bh * sc);
        cb(out.toDataURL('image/png'));
      } catch (e) { cb(src); }
    };
    img.onerror = function(){ cb(src); };
    img.src = src;
  } catch (e) { cb(src); }
}
function footerHtml(){
  var b = BRAND || {};
  var org = b.org || '';
  var dev = String(b.developer || '').replace(/\s*ฝ่ายทรัพยากรบุคคล\s*$/, '');
  return '<div class="f1">© ' + esc(b.year || '2569') + ' ' + esc(org) + '</div>' +
    '<div class="f2">' + (dev ? '<span class="nw">พัฒนาโดย' + esc(dev) + '</span>' : '') + ' <span class="nw">' + (b.phone ? '· โทร ' + esc(String(b.phone).replace(/,\s*/g, ', ')) + ' ' : '') + '· v' + esc(String(b.version || '').replace(/\.0$/, '')) + '</span></div>';
}
function annHtml(){
  var b = BRAND || {};
  if (!b.announcement) return '';
  var key = 'ann_' + String(b.announcement).length + '_' + String(b.announcement).slice(0, 20);
  if (store(key)) return '';
  var lv = { warning: ['ann-warn', 'exclamation-triangle'], danger: ['ann-bad', 'exclamation-octagon'] }[b.announceLevel] || ['ann-info', 'megaphone'];
  return '<div class="ann ' + lv[0] + '"><i class="bi bi-' + lv[1] + '"></i><div class="flex-grow-1" style="white-space:pre-line">' + esc(b.announcement) + '</div>' +
    '<button class="btn-close" style="font-size:11px" aria-label="ปิดประกาศ" onclick="store(\'' + key + '\',\'1\');this.closest(\'.ann\').remove()"></button></div>';
}
function contactHtml(){
  var b = BRAND || {};
  return '<div class="text-start"><div class="mb-2">' + esc(b.developer || 'ผู้ดูแลระบบ') + '</div>' +
    (b.phone ? '<div class="mb-1"><i class="bi bi-telephone text-danger"></i> โทรภายใน <b>' + esc(b.phone) + '</b></div>' : '') +
    (b.email ? '<div class="mb-1"><i class="bi bi-envelope text-danger"></i> <a href="mailto:' + esc(b.email) + '">' + esc(b.email) + '</a></div>' : '') + '</div>';
}
function forgotPw(){
  Swal.fire({ icon: 'info', title: 'ลืมรหัสผ่าน / ขอรีเซ็ตรหัสผ่าน',
    html: '<p class="mb-3">โปรดติดต่อผู้ดูแลระบบเพื่อขอรีเซ็ตรหัสผ่าน โดยแจ้งรหัสเจ้าหน้าที่และชื่อ-นามสกุล หลังรีเซ็ตแล้ว รหัสผ่านจะกลับเป็นรหัสเจ้าหน้าที่ และระบบจะให้กำหนดรหัสผ่านใหม่เมื่อเข้าใช้งาน</p>' + contactHtml(),
    confirmButtonText: 'รับทราบ' });
}

/* ---------- ย่อ/ขยายเมนูด้านข้าง ---------- */
function toggleSide(force){
  var on = force === undefined ? !$('vApp').classList.contains('side-min') : force;
  $('vApp').classList.toggle('side-min', on);
  store('smc_side_min', on ? '1' : null);
}

/* ---------- แถบโหลด / ปุ่มหมุน ---------- */
var loadN = 0, loadTimer = null;
function progress(on){
  loadN += on ? 1 : -1; if (loadN < 0) loadN = 0;
  var p = $('progress');
  clearInterval(loadTimer);
  if (loadN > 0) { p.style.opacity = 1; var w = 12; p.style.width = w + '%'; loadTimer = setInterval(function(){ w = Math.min(90, w + (90 - w) * 0.08); p.style.width = w + '%'; }, 200); }
  else { p.style.width = '100%'; setTimeout(function(){ p.style.opacity = 0; p.style.width = '0'; }, 250); }
}
function btnBusy(btn, on, text){
  if (!btn) return;
  if (on) { btn.dataset.html = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spinner-border"></span>' + (text ? ' ' + esc(text) : ''); }
  else { btn.disabled = false; if (btn.dataset.html) btn.innerHTML = btn.dataset.html; }
}
var blockSwal = false;
function blocking(msg){
  blockSwal = true;
  Swal.fire({ title: msg || 'กำลังดำเนินการ…', html: '<div class="small-muted">กรุณารอสักครู่ และอย่าปิดหน้านี้</div>', allowOutsideClick: false, showConfirmButton: false, didOpen: function(){ Swal.showLoading(); } });
}
function unblock(){ if (blockSwal) { blockSwal = false; Swal.close(); } }

/* ---------- เรียกเซิร์ฟเวอร์ ---------- */
/** ข้อความผิดพลาดจากเซิร์ฟเวอร์: "หัวข้อ||รายละเอียด" */
function errParts(msg){ var p = String(msg || '').split('||'); return p.length > 1 ? { title: p[0], text: p.slice(1).join(' ') } : { title: 'ไม่สามารถทำรายการได้', text: p[0] }; }
/* v1.3 ช่องทางเรียกเซิร์ฟเวอร์ 2 แบบ (เลือกอัตโนมัติ)
 * - หน้าเว็บบน GitHub Pages: fetch ไปที่ลิงก์ /exec (window.SMC_API_URL) แบบไม่ส่งคุกกี้ Google → ไม่ติดปัญหาบัญชี Google ในเครื่อง
 * - เปิดผ่านลิงก์ /exec โดยตรง: google.script.run
 */
/* ลิงก์ backend: ตั้งใน js/config.js (var API_URL = '.../exec') หรือ window.SMC_API_URL */
var API_URL = window.SMC_API_URL || window.API_URL || '';
function viaGas(){ return !!(window.google && google.script && google.script.run); }
/* v1.3.1 การเชื่อมต่อที่ทนทานขึ้น
 * - จำกัดคำขอพร้อมกันไม่เกิน 4 (Apps Script รับงานพร้อมกันได้จำกัด)
 * - อ่านข้อมูล: ถ้าเครือข่ายสะดุด/เซิร์ฟเวอร์ Google ไม่ว่าง ลองใหม่อัตโนมัติสูงสุด 3 ครั้ง (รอ 0.7 / 1.6 / 3.2 วินาที)
 * - บันทึกข้อมูล: ไม่ลองซ้ำอัตโนมัติ (กันบันทึกซ้ำ) แต่แจ้งให้ตรวจสอบก่อนกดใหม่
 */
var NET = { active: 0, queue: [], MAX: 4 };
function netSlot(){ return new Promise(function(res){ if (NET.active < NET.MAX) { NET.active++; res(); } else NET.queue.push(res); }); }
function netDone(){ var n = NET.queue.shift(); if (n) n(); else NET.active = Math.max(0, NET.active - 1); }
function isReadAction(a){ return /^(get|list|bootstrap|branding|ping|suggest|login)/.test(a); }
function netErr(kind, msg){ var e = new Error(msg); e.net = kind; return e; }
function fetchOnce(action, payload, timeoutMs){
  var ctl = window.AbortController ? new AbortController() : null;
  var timer = ctl ? setTimeout(function(){ ctl.abort(); }, timeoutMs || 180000) : null;
  // ห้ามตั้ง Content-Type เอง: ปล่อยเป็น text/plain เพื่อไม่ให้เบราว์เซอร์ส่ง preflight (Apps Script ตอบ OPTIONS ไม่ได้)
  return fetch(API_URL, { method: 'POST', redirect: 'follow', credentials: 'omit', cache: 'no-store', signal: ctl ? ctl.signal : undefined,
    body: JSON.stringify({ action: action, token: S.token, payload: payload || {} }) })
    .then(function(r){
      return r.text().then(function(t){
        var s = String(t || '').trim();
        if (s.charAt(0) === '<') throw netErr('busy', 'เซิร์ฟเวอร์ Google ไม่ว่างชั่วคราว');
        if (!r.ok) throw netErr('busy', 'เซิร์ฟเวอร์ตอบกลับผิดปกติ (HTTP ' + r.status + ')');
        try { return JSON.parse(s); } catch (e) { throw netErr('busy', 'ข้อมูลตอบกลับไม่สมบูรณ์'); }
      });
    }, function(e){ throw (e && e.name === 'AbortError') ? netErr('timeout', 'เซิร์ฟเวอร์ตอบช้าเกินกำหนด') : netErr('offline', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ (' + (e && e.message ? e.message : 'network') + ')'); })
    .then(function(x){ if (timer) clearTimeout(timer); return x; }, function(e){ if (timer) clearTimeout(timer); throw e; });
}
function rawCall(action, payload, timeoutMs){
  if (viaGas()) return new Promise(function(resolve, reject){ google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).rpc(action, S.token, payload || {}); });
  if (!API_URL) return Promise.reject(new Error('ยังไม่ได้ตั้งค่าลิงก์ระบบ (config.js)'));
  var read = isReadAction(action), waits = [700, 1600, 3200], tries = 0;
  var slow = setTimeout(function(){ slowHint(true); }, 3500);
  var attempt = function(){
    return netSlot().then(function(){ return fetchOnce(action, payload, timeoutMs); })
      .then(function(x){ netDone(); return x; }, function(e){
        netDone();
        if (read && e.net !== 'timeout' && tries < waits.length) { var w = waits[tries++] + Math.random() * 300; return new Promise(function(r){ setTimeout(r, w); }).then(attempt); }
        if (read && tries) e.message += ' · ระบบลองเชื่อมต่อใหม่ให้แล้ว ' + tries + ' ครั้ง';
        if (!read && e.net === 'offline') e.message += '\nรายการนี้อาจบันทึกสำเร็จแล้ว กรุณากดรีเฟรชหน้าเพื่อตรวจสอบก่อนบันทึกซ้ำ';
        throw e;
      });
  };
  return attempt().then(function(x){ clearTimeout(slow); slowHint(false); return x; }, function(e){ clearTimeout(slow); slowHint(false); throw e; });
}
/** แจ้งเบา ๆ เมื่อเซิร์ฟเวอร์ตอบช้า (ไม่ต้องกดปิด) */
var SLOWN = 0;
function slowHint(on){
  SLOWN = Math.max(0, SLOWN + (on ? 1 : -1));
  var el = $('slowHint');
  if (!el) { el = document.createElement('div'); el.id = 'slowHint'; el.className = 'slow-hint'; el.innerHTML = '<span class="dotflash"><i></i><i></i><i></i></span> กำลังรอเซิร์ฟเวอร์ Google ตอบกลับ…'; document.body.appendChild(el); }
  el.classList.toggle('show', SLOWN > 0);
}
/** แคชในหน่วยความจำ (เปิดหน้าเดิมซ้ำแสดงผลทันที แล้วค่อยโหลดข้อมูลล่าสุดมาแทน) */
var MEMO = {};
function memoKey(action, payload){ return action + '|' + JSON.stringify(payload || {}); }
function memoClear(){ MEMO = {}; }
function api(action, payload, opt){
  opt = opt || {};
  if (opt.fresh && opt.onCache) { var mk = memoKey(action, payload); if (MEMO[mk]) { try { opt.onCache(MEMO[mk]); } catch (e) { } } }
  if (!/^(get|list|bootstrap|branding|ping|suggest)/.test(action)) memoClear();   // เขียนข้อมูล → ล้างแคช
  progress(true);
  if (opt.btn) btnBusy(opt.btn, true, opt.btnText);
  if (opt.block) blocking(opt.block);
  var done = function(){ progress(false); if (opt.btn) btnBusy(opt.btn, false); if (opt.block) unblock(); };
  return rawCall(action, payload, opt.timeout).then(function(res){
    done();
    if (!res) { notify('ไม่ได้รับข้อมูลจากเซิร์ฟเวอร์', 'error'); throw new Error('empty'); }
    if (res.ok) { if (opt.fresh) MEMO[memoKey(action, payload)] = res.data; return res.data; }
    if (res.error === 'SESSION_EXPIRED') { store('smc_token', null); store('smc_boot', null); S.token = null; notify('หมดเวลาการใช้งาน กรุณาเข้าสู่ระบบอีกครั้ง', 'warning'); showLogin(); throw new Error(res.error); }
    var e = errParts(res.error);
    if (!opt.quiet) alertBox(e.title, e.text, 'warning');
    var er = new Error(e.text); er.handled = true; throw er;
  }, function(err){
    done();
    if (!opt.quiet) {
      var m = err && err.message ? err.message : String(err);
      var t = err && err.net === 'busy' ? 'เซิร์ฟเวอร์ Google ไม่ว่างชั่วคราว' : err && err.net === 'timeout' ? 'เซิร์ฟเวอร์ตอบช้าเกินกำหนด' : 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ';
      alertBox(t, m + '\n\nกรุณารอสักครู่แล้วลองใหม่ หากยังเป็นอยู่ ให้ตรวจสอบอินเทอร์เน็ต หรือรีเฟรชหน้าเว็บ', 'error');
    }
    throw err;
  });
}

/* ---------- หน้าต่างแจ้งเตือน ---------- */
var Toast = null;
function notify(msg, icon){
  if (!window.Swal) { console.log(msg); return; }
  Toast = Toast || Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3400, timerProgressBar: true,
    didOpen: function(t){ t.addEventListener('mouseenter', Swal.stopTimer); t.addEventListener('mouseleave', Swal.resumeTimer); } });
  Toast.fire({ icon: icon || 'success', title: msg });
}
function alertBox(title, text, icon){ return Swal.fire({ icon: icon || 'info', title: title, html: '<div style="white-space:pre-line">' + esc(text) + '</div>', confirmButtonText: 'รับทราบ' }); }
function confirmBox(title, text, okText, danger){
  return Swal.fire({ icon: danger ? 'warning' : 'question', title: title, html: '<div style="white-space:pre-line">' + esc(text) + '</div>', showCancelButton: true,
    confirmButtonText: okText || 'ยืนยัน', cancelButtonText: 'ยกเลิก', reverseButtons: true, focusCancel: !!danger,
    customClass: danger ? { confirmButton: 'swal-danger' } : {} }).then(function(r){ return !!r.isConfirmed; });
}
function promptBox(title, label, placeholder, value){
  return Swal.fire({ title: title, input: 'textarea', inputLabel: label, inputPlaceholder: placeholder || '', inputValue: value || '', showCancelButton: true, confirmButtonText: 'ยืนยัน', cancelButtonText: 'ยกเลิก', reverseButtons: true,
    inputValidator: function(v){ if (!String(v || '').trim()) return 'กรุณาระบุข้อความ'; } }).then(function(r){ return r.isConfirmed ? r.value : null; });
}
/** ยืนยันด้วยรหัสผ่าน (คืนรหัสผ่าน หรือ null เมื่อยกเลิก) */
function passwordBox(title, text, okText, danger){
  if (!S.boot.requirePw) return confirmBox(title, text, okText, danger).then(function(ok){ return ok ? '' : null; });
  return Swal.fire({ icon: danger ? 'warning' : 'question', title: title,
    html: '<div style="white-space:pre-line" class="mb-2">' + esc(text) + '</div><div class="small-muted text-start"><i class="bi bi-shield-lock"></i> กรุณาใส่รหัสผ่านของท่านเพื่อยืนยัน</div>',
    input: 'password', inputPlaceholder: 'รหัสผ่านของท่าน', inputAttributes: { autocomplete: 'current-password' },
    showCancelButton: true, confirmButtonText: okText || 'ยืนยัน', cancelButtonText: 'ยกเลิก', reverseButtons: true,
    customClass: danger ? { confirmButton: 'swal-danger' } : {},
    inputValidator: function(v){ if (!v) return 'กรุณาใส่รหัสผ่าน'; } }).then(function(r){ return r.isConfirmed ? r.value : null; });
}
function resultBox(title, results){
  var ok = results.filter(function(r){ return r.ok; }), bad = results.filter(function(r){ return !r.ok; });
  var warn = ok.filter(function(r){ return r.warn; });
  return Swal.fire({ icon: bad.length ? (ok.length ? 'warning' : 'error') : 'success', title: title,
    html: (ok.length ? '<div class="text-start mb-2"><b class="text-success">สำเร็จ ' + ok.length + ' รายการ</b><br><span class="small-muted">' + ok.map(function(r){ return esc(r.name); }).join(', ') + '</span></div>' : '') +
      (warn.length ? '<div class="text-start mb-2 small text-warning">' + warn.map(function(r){ return esc(r.name + ': ' + r.warn); }).join('<br>') + '</div>' : '') +
      (bad.length ? '<div class="text-start"><b class="text-danger">ไม่สำเร็จ ' + bad.length + ' รายการ</b><ul class="small mb-0">' + bad.map(function(r){ return '<li>' + esc(r.name) + ': ' + esc(r.error) + '</li>'; }).join('') + '</ul></div>' : ''),
    confirmButtonText: 'รับทราบ' });
}

var MDL = null;
function modal(title, body, buttons, size){
  $('mdlTitle').textContent = title;
  $('mdlBody').innerHTML = body;
  $('mdlDlg').className = 'modal-dialog modal-dialog-centered modal-dialog-scrollable' + (size ? ' modal-' + size : '');
  var f = $('mdlFoot'); f.innerHTML = '';
  (buttons || [{ text: 'ปิด', cls: 'btn-ghost' }]).forEach(function(b){
    var el = document.createElement('button'); el.type = 'button'; el.className = 'btn ' + (b.cls || 'btn-brand'); el.innerHTML = b.text;
    el.onclick = function(){ if (b.onClick) { var r = b.onClick(el); if (r === false) return; } MDL.hide(); };
    f.appendChild(el);
  });
  MDL = MDL || new bootstrap.Modal($('mdl'));
  MDL.show();
  setTimeout(function(){ enhanceSelects($('mdlBody')); }, 0);
}

/* ---------- ดาวน์โหลดลงเครื่องโดยตรง ---------- */
function b64ToBlob(data, type){ var bin = atob(data), arr = new Uint8Array(bin.length); for (var k = 0; k < bin.length; k++) arr[k] = bin.charCodeAt(k); return new Blob([arr], { type: type }); }
function saveBlob(blob, name){
  if (window.navigator && window.navigator.msSaveOrOpenBlob) return window.navigator.msSaveOrOpenBlob(blob, name);
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a'); a.href = url; a.download = name; a.rel = 'noopener'; a.style.display = 'none';
  document.body.appendChild(a); a.click();
  setTimeout(function(){ a.remove(); URL.revokeObjectURL(url); }, 4000);
}
var _lastFiles = [];
function download(files){
  if (!files || !files.length) return;
  _lastFiles = files.map(function(f){ return { name: f.name, blob: b64ToBlob(f.data, f.mimeType) }; });
  _lastFiles.forEach(function(f, i){ setTimeout(function(){ saveBlob(f.blob, f.name); }, i * 700); });
  Swal.fire({ icon: 'success', title: 'ดาวน์โหลดเอกสารเรียบร้อย',
    html: '<div class="small-muted mb-2">ไฟล์ถูกบันทึกลงในเครื่องของท่าน (โฟลเดอร์ดาวน์โหลด) และระบบได้เก็บสำเนาไว้ในคลังเอกสารแล้ว</div><div class="text-start">' +
      _lastFiles.map(function(f, i){ return '<div class="d-flex align-items-center gap-2 mb-1"><i class="bi bi-file-earmark-check text-success"></i><span class="flex-grow-1 small text-break">' + esc(f.name) + '</span><button class="btn btn-sm btn-ghost" onclick="saveBlob(_lastFiles[' + i + '].blob,_lastFiles[' + i + '].name)">ดาวน์โหลดอีกครั้ง</button></div>'; }).join('') + '</div>',
    confirmButtonText: 'ปิด', width: 560 });
}

/* ================= เข้าสู่ระบบ ================= */
function showOnly(id){ ['vLogin','vForce','vApp'].forEach(function(v){ $(v).hidden = v !== id; }); $('actionbar').classList.remove('show'); }
var lgClock = null;
function showLogin(){
  showOnly('vLogin'); applyBrand(BRAND);
  var saved = store('smc_rememberCode');
  if (saved) { $('lgCode').value = saved; $('lgRemember').checked = true; }
  var tick = function(){ var d = new Date(); if ($('lgTime')) { $('lgTime').textContent = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.'; $('lgDate').textContent = d.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); } };
  tick(); clearInterval(lgClock); lgClock = setInterval(tick, 15000);
  setTimeout(function(){ (saved ? $('lgPw') : $('lgCode')).focus(); }, 60);
}
(function(){
  var pw = $('lgPw'), eye = $('lgEye');
  eye.onclick = function(){ var show = pw.type === 'password'; pw.type = show ? 'text' : 'password'; eye.innerHTML = '<i class="bi bi-' + (show ? 'eye-slash' : 'eye') + '"></i>'; eye.classList.toggle('on', show); eye.setAttribute('aria-label', show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'); pw.focus(); };
  var caps = function(e){ if (e.getModifierState) $('lgCaps').hidden = !e.getModifierState('CapsLock'); };
  pw.addEventListener('keyup', caps); pw.addEventListener('keydown', caps);
  $('lgCode').addEventListener('input', function(){ this.value = this.value.replace(/\D/g, '').slice(0, 10); });
})();
function lgShake(el){ var c = $('fLogin'); c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake'); if (el) el.focus(); }

$('fLogin').addEventListener('submit', function(e){
  e.preventDefault();
  var code = $('lgCode').value.trim(), pw = $('lgPw').value;
  if (!code) return lgShake($('lgCode'));
  if (!pw) return lgShake($('lgPw'));
  if ($('lgRemember').checked) store('smc_rememberCode', code); else store('smc_rememberCode', null);
  api('login', { empCode: code, password: pw }, { btn: $('lgBtn'), btnText: 'กำลังเข้าสู่ระบบ' }).then(function(r){
    S.token = r.token; store('smc_token', r.token); $('lgPw').value = ''; clearInterval(lgClock);
    $('vLogin').classList.add('lg-out');
    setTimeout(function(){ $('vLogin').classList.remove('lg-out'); start(true); }, 260);
  }).catch(function(){ lgShake(); });
});

/* v1.3.1 เปิดแอปทันทีจากข้อมูลที่จำไว้ในเครื่อง แล้วค่อยตรวจสอบกับเซิร์ฟเวอร์เบื้องหลัง (ไม่ต้องรอหน้าขาว) */
function bootSig(b){ return JSON.stringify([b.ym, b.me && b.me.roles, b.me && b.me.name, b.canApprove, b.canReview, (b.positions || []).map(function(p){ return p.id; }), b.myPositions || b.posRoles || '']); }
function start(fresh){
  var cached = null;
  if (!fresh && S.token) { try { var c = JSON.parse(store('smc_boot') || 'null'); if (c && c.t === S.token.slice(-16) && c.b && c.b.me && !c.b.me.mustChange && c.b.me.hasPhone) cached = c.b; } catch (e) { } }
  if (cached) { S.boot = cached; S.ym = S.ym || cached.ym; showApp(); }
  api('bootstrap', {}, { quiet: !!cached }).then(function(b){
    var changed = !cached || bootSig(cached) !== bootSig(b);
    if (cached && S.ym === cached.ym && cached.ym !== b.ym) S.ym = b.ym;
    S.boot = b; S.ym = S.ym || b.ym;
    try { store('smc_boot', JSON.stringify({ t: S.token.slice(-16), b: b })); } catch (e) { }
    if (b.me.mustChange || !b.me.hasPhone) return showForce();
    if (changed) showApp();
    if (fresh) notify('ยินดีต้อนรับ ' + b.me.name.split(' ').slice(0, 2).join(' '));
  }).catch(function(){ if (!S.boot) showLogin(); });
}

function showForce(){
  showOnly('vForce');
  var me = S.boot.me;
  $('fcWho').textContent = me.empCode + ' · ' + me.name;
  $('fPw').hidden = !me.mustChange;
  $('fPhone').hidden = me.mustChange || me.hasPhone;
}
$('fPw').addEventListener('submit', function(e){
  e.preventDefault();
  if ($('pwNew').value !== $('pwNew2').value) return alertBox('รหัสผ่านไม่ตรงกัน', 'กรุณากรอกรหัสผ่านใหม่ทั้งสองช่องให้ตรงกัน', 'warning');
  api('changePassword', { oldPassword: $('pwOld').value, newPassword: $('pwNew').value }, { btn: e.submitter }).then(function(me){
    S.boot.me = me; notify('เปลี่ยนรหัสผ่านเรียบร้อย'); ['pwOld','pwNew','pwNew2'].forEach(function(i){ $(i).value = ''; });
    if (!me.hasPhone) showForce(); else showApp();
  }).catch(function(){});
});
$('fPhone').addEventListener('submit', function(e){
  e.preventDefault();
  api('updatePhone', { phone: $('phNew').value }, { btn: e.submitter }).then(function(me){ S.boot.me = me; notify('บันทึกหมายเลขโทรศัพท์เรียบร้อย'); showApp(); }).catch(function(){});
});

function doLogout(){ api('logout', {}, { quiet: true }).catch(function(){}); memoClear(); store('smc_token', null); store('smc_boot', null); S.token = null; S.boot = null; showLogin(); }

function openAccount(){
  var me = S.boot.me;
  modal('บัญชีผู้ใช้งาน',
    '<div class="d-flex gap-3 align-items-center mb-3"><div class="avatar" style="width:48px;height:48px;font-size:20px">' + esc(initials(me.name)) + '</div><div><b>' + esc(me.name) + '</b><div class="small-muted">' + esc(me.empCode) + ' · ' + esc(me.hrPosition) + '</div><div class="mt-1">' + me.roles.map(function(r){ return '<span class="tag brand me-1">' + esc(S.boot.roles[r]) + '</span>'; }).join('') + '</div></div></div>' +
    '<label class="form-label">หมายเลขโทรศัพท์</label><div class="input-group mb-3"><input class="form-control" id="acPhone" value="' + esc(me.phone) + '"><button class="btn btn-soft" id="acPhBtn" onclick="accPhone(this)">บันทึก</button></div>' +
    '<label class="form-label">เปลี่ยนรหัสผ่าน</label>' +
    '<input class="form-control mb-2" id="acOld" type="password" placeholder="รหัสผ่านปัจจุบัน">' +
    '<input class="form-control mb-2" id="acNew" type="password" placeholder="รหัสผ่านใหม่ (อย่างน้อย 8 ตัว มีตัวอักษรภาษาอังกฤษและตัวเลข)">' +
    '<button class="btn btn-soft" onclick="accPw(this)">เปลี่ยนรหัสผ่าน</button>');
}
function accPhone(b){ api('updatePhone', { phone: $('acPhone').value }, { btn: b }).then(function(me){ S.boot.me = me; notify('บันทึกหมายเลขโทรศัพท์เรียบร้อย'); }).catch(function(){}); }
function accPw(b){ api('changePassword', { oldPassword: $('acOld').value, newPassword: $('acNew').value }, { btn: b }).then(function(me){ S.boot.me = me; notify('เปลี่ยนรหัสผ่านเรียบร้อย'); MDL.hide(); }).catch(function(){}); }

/* ================= เมนู ================= */
function isStaffOnly(){ return !(has('ENTRY') || has('REVIEWER') || has('COORD') || has('MANAGER')); }
var MENU = [
  { sec: 'งานของฉัน' },
  { id: 'dashboard', icon: 'grid-1x2', text: 'ภาพรวมการดำเนินงาน', show: function(){ return !isStaffOnly(); } },
  { id: 'my', icon: 'person-badge', text: 'เวรและค่าตอบแทนของฉัน', show: function(){ return true; } },
  { id: 'booking', icon: 'calendar2-plus', text: 'ลงตารางเวร', show: function(){ return true; } },
  { id: 'overview', icon: 'table', text: 'ตารางเวรรวม', show: function(){ return !isStaffOnly(); } },
  { sec: 'งานประจำเดือน' },
  { id: 'entry', icon: 'ui-checks-grid', text: 'บันทึกเวลาปฏิบัติงาน', show: function(){ return has('ENTRY') || has('COORD'); } },
  { id: 'followup', icon: 'clipboard2-pulse', text: 'รายงานติดตามปัญหา', show: function(){ return has('ENTRY') || has('REVIEWER') || has('MANAGER') || has('COORD'); } },
  { id: 'submit', icon: 'send-check', text: 'ส่งตรวจสอบ', show: function(){ return has('ENTRY') || has('COORD'); } },
  { id: 'review', icon: 'patch-check', text: 'ตรวจสอบและอนุมัติ', show: function(){ return has('REVIEWER') || has('MANAGER') || has('COORD'); } },
  { id: 'export', icon: 'cloud-arrow-down', text: 'จัดพิมพ์และส่งออกเอกสาร', show: function(){ return !isStaffOnly(); } },
  { sec: 'การตั้งค่า' },
  { id: 'calendar', icon: 'calendar3-week', text: 'ปฏิทิน กรอบเวร และช่วงเวลา', show: function(){ return has('COORD'); } },
  { id: 'slots', icon: 'clock', text: 'ช่วงเวรที่เปิดให้ลงเวร', show: function(){ return has('COORD'); } },
  { id: 'employees', icon: 'people', text: 'ข้อมูลบุคลากร', show: function(){ return has('COORD') || has('ENTRY') || has('REVIEWER'); } },
  { id: 'users', icon: 'shield-lock', text: 'ผู้ใช้งานและสิทธิ์', show: function(){ return has('ADMIN'); } },
  { id: 'positions', icon: 'tags', text: 'ตำแหน่งและอัตราค่าตอบแทน', show: function(){ return has('COORD'); } },
  { id: 'branding', icon: 'palette', text: 'รูปลักษณ์และประกาศ', show: function(){ return has('ADMIN'); } },
  { id: 'settings', icon: 'sliders', text: 'ตั้งค่าระบบและนำเข้าข้อมูล', show: function(){ return has('COORD'); } },
  { id: 'audit', icon: 'clock-history', text: 'ประวัติการใช้งาน', show: function(){ return has('ADMIN'); } }
];

function showApp(){
  showOnly('vApp');
  applyBrand(BRAND);
  if (store('smc_side_min')) $('vApp').classList.add('side-min');
  var me = S.boot.me;
  $('meAv').textContent = initials(me.name);
  $('meName').textContent = me.name;
  $('meRole').textContent = me.roles.filter(function(r){ return r !== 'STAFF'; }).map(function(r){ return S.boot.roles[r]; }).join(' · ') || S.boot.roles.STAFF;
  var html = '', pendingSec = '';
  MENU.forEach(function(m){
    if (m.sec) { pendingSec = '<div class="side-sec"><span>' + m.sec + '</span></div>'; return; }
    if (!m.show()) return;
    html += pendingSec; pendingSec = '';
    html += '<a class="nav-i" href="#" data-p="' + m.id + '" title="' + esc(m.text) + '"><i class="bi bi-' + m.icon + '"></i><span>' + m.text + '</span></a>';
  });
  $('nav').innerHTML = html; $('nav2').innerHTML = html;
  $$('[data-p]').forEach(function(a){ a.onclick = function(e){ e.preventDefault(); var oc = bootstrap.Offcanvas.getInstance($('ocNav')); if (oc) oc.hide(); go(a.dataset.p); }; });
  var first = store('smc_page');
  var ok = MENU.filter(function(m){ return m.id === first && m.show && m.show(); }).length;
  go(ok ? first : (isStaffOnly() ? 'my' : 'dashboard'));
}

function go(page){
  S.page = page; store('smc_page', page);
  var mm = MENU.filter(function(m){ return m.id === page; })[0];
  if ($('topTitle')) $('topTitle').textContent = mm ? mm.text : '';
  document.title = (mm ? mm.text + ' · ' : '') + ((BRAND && BRAND.short) || 'SMC Duty');
  $$('[data-p]').forEach(function(a){ a.classList.toggle('active', a.dataset.p === page); });
  $('actionbar').classList.remove('show');
  window.scrollTo(0, 0);
  (PAGES[page] || PAGES.my)();
}

/* ---------- ส่วนประกอบหน้า ---------- */
function pageHead(eyebrow, title, sub, actions){
  var help = window.HELP && HELP[S.page] ? ' <button class="btn-help" onclick="openHelp()" title="คำแนะนำการใช้งานหน้านี้" aria-label="คำแนะนำการใช้งานหน้านี้"><i class="bi bi-question-circle-fill"></i></button>' : '';
  return '<div class="ph"><div><div class="eyebrow">' + esc(eyebrow) + '</div><h1>' + esc(title) + help + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' + (actions ? '<div class="actions">' + actions + '</div>' : '') + '</div>' + tipBar();
}
function mount(html){ var v = $('view'); v.innerHTML = '<div class="page">' + html + '</div>'; enhanceSelects(v); }
function tipBar(){
  var h = window.HELP && HELP[S.page];
  if (!h || !h.tip || store('tip_' + S.page)) return '';
  return '<div class="tipbar" id="tipbar"><i class="bi bi-lightbulb"></i><div class="flex-grow-1">' + h.tip + ' <a href="#" onclick="openHelp();return false">ดูคำแนะนำ</a></div><button class="btn-close" style="font-size:11px" onclick="store(\'tip_' + S.page + '\',\'1\');$(\'tipbar\').remove()" aria-label="ปิด"></button></div>';
}
function skeleton(n){ var h = '<div class="card card-b">'; for (var i = 0; i < (n || 6); i++) h += '<div class="skel" style="width:' + (60 + (i * 13) % 40) + '%"></div>'; return h + '</div>'; }
function empty(icon, text){ return '<div class="empty"><i class="bi bi-' + icon + '"></i>' + text + '</div>'; }
function demoBanner(ym){ return isDemo(ym) ? '<div class="demo-bar"><i class="bi bi-cone-striped"></i><div><b>เดือนทดลอง</b> · ข้อมูลเดือน ' + esc(thYm(ym)) + ' เป็นข้อมูลทดลอง ใช้ทดสอบขั้นตอนเท่านั้น เอกสารจะมีข้อความ "ข้อมูลทดลอง" กำกับ</div></div>' : ''; }

function ymSelect(id, val, back, fwd, label){
  var cur = S.boot.ym, opts = '';
  for (var i = -(back || 14); i <= (fwd == null ? 2 : fwd); i++) { var y = addYm(cur, i); opts += '<option value="' + y + '"' + (y === val ? ' selected' : '') + '>' + thYm(y) + (isDemo(y) ? ' (ทดลอง)' : '') + '</option>'; }
  return '<div><label class="form-label" for="' + id + '">' + (label || 'เดือน') + '</label><select class="form-select" data-search id="' + id + '">' + opts + '</select></div>';
}
/** ตัวเลือกตำแหน่ง: เรียงตำแหน่งที่ใช้บ่อยก่อน · withAll = ตัวเลือก "ทุกตำแหน่ง" */
function posSelect(id, ids, val, withAll, allText){
  var list = S.boot.positions.filter(function(p){ return !ids || ids.indexOf(p.id) >= 0; });
  var usual = S.boot.usualPositions || [];
  list = list.slice().sort(function(a, b){ var ia = usual.indexOf(a.id), ib = usual.indexOf(b.id); ia = ia < 0 ? 999 : ia; ib = ib < 0 ? 999 : ib; return ia - ib; });
  if (!val || (val === 'all' && !withAll) || (val !== 'all' && !list.some(function(p){ return p.id === val; }))) val = withAll ? 'all' : (list.length ? list[0].id : '');
  var opts = (withAll ? '<option value="all">' + (allText || 'ทุกตำแหน่ง') + '</option>' : '') + list.map(function(p){ return '<option value="' + p.id + '" data-sub="' + esc(p.groupName) + '"' + (p.id === val ? ' selected' : '') + '>' + esc(p.name) + (usual.indexOf(p.id) >= 0 && usual.indexOf(p.id) < 3 ? ' ★' : '') + '</option>'; }).join('');
  return '<div><label class="form-label" for="' + id + '">ตำแหน่ง</label><select class="form-select" data-search id="' + id + '">' + opts + '</select></div>';
}
function posIdsFor(roles){
  var set = {};
  roles.forEach(function(r){ (S.boot.myPositions[r] || []).forEach(function(id){ set[id] = 1; }); });
  return Object.keys(set);
}
function statusPill(st){
  var m = { OPEN: ['p-info', 'pencil-square'], SUBMITTED: ['p-warn', 'hourglass-split'], RETURNED: ['p-bad', 'arrow-return-left'], REVIEWED: ['p-violet', 'patch-check'], APPROVED: ['p-ok', 'lock-fill'] }[st] || ['p-mute', 'dot'];
  return '<span class="pill ' + m[0] + ' nodot"><i class="bi bi-' + m[1] + '"></i> ' + esc(S.boot.mstatus[st] || st) + '</span>';
}
/** สถานะช่วงลงตารางเวร (สีชัด อ่านง่าย) */
function windowPill(state){
  var m = { OPEN: ['p-ok', 'unlock-fill', 'เปิดลงตารางเวร'], CLOSED: ['p-closed', 'lock-fill', 'ปิดลงตารางเวรแล้ว'], BEFORE: ['p-warn', 'clock-fill', 'ยังไม่ถึงเวลาเปิดลงเวร'], NONE: ['p-warn', 'exclamation-circle-fill', 'ยังไม่กำหนดช่วงลงเวร'] }[state] || ['p-mute', 'dot', state];
  return '<span class="pill pill-lg ' + m[0] + ' nodot"><i class="bi bi-' + m[1] + '"></i> ' + m[2] + '</span>';
}
function scanPill(s, last){
  var sc = S.boot.scan;
  var cls = s === sc.OK || s === sc.OK_DOC ? 'p-ok' : s === sc.PENDING ? 'p-slate' : s === sc.EARLY ? 'p-warn' : (s === sc.NONE || s === sc.FORGOT) ? 'p-bad' : 'p-info';
  return '<span class="pill ' + cls + '">' + esc(s || '-') + '</span>' + (last ? '<div class="scan-t">สแกนออก <b>' + esc(last) + '</b></div>' : '');
}
function dayTypePill(t, color, note){
  var d = S.boot.dayTypes;
  if (color) {
    if (color === 'WORK') return '';
    var nm = { WEEKEND: 'เสาร์-อาทิตย์', PUBHOL: note || 'วันหยุดนักขัตฤกษ์', COMP: note || 'วันหยุดชดเชย', CLOSED: 'ปิดคลินิก' }[color] || '';
    return '<span class="dpill dk-' + color + '">' + esc(nm) + '</span>';
  }
  return t === d.HOLIDAY ? '<span class="pill p-brand nodot">วันหยุด</span>' : t === d.CLOSED ? '<span class="pill p-closed nodot">ปิดคลินิก</span>' : '';
}
/** คลาสสีประเภทวัน */
function dk(color){ return color && color !== 'WORK' ? 'dk-' + color : ''; }
function dayLegend(){
  var c = (S.boot && S.boot.dayColors) || {};
  return '<div class="day-legend">' + ['WORK', 'WEEKEND', 'PUBHOL', 'COMP', 'CLOSED'].map(function(k){ return '<span><i class="sw dk-' + k + '"></i>' + esc((c[k] || {}).name || k) + '</span>'; }).join('') + '</div>';
}
function countUp(el){
  var target = +el.dataset.v, dec = +(el.dataset.d || 0), t0 = null;
  function step(ts){ if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 600); el.textContent = fmt(target * (1 - Math.pow(1 - p, 3)), dec); if (p < 1) requestAnimationFrame(step); }
  requestAnimationFrame(step);
}
function kpi(icon, cls, label, v, dec){ return '<div class="kpi"><div class="ic ' + cls + '"><i class="bi bi-' + icon + '"></i></div><div><div class="v" data-v="' + v + '" data-d="' + (dec || 0) + '">' + fmt(v, dec || 0) + '</div><div class="l">' + label + '</div></div></div>'; }
function animateKpis(){ $$('.kpi .v').forEach(countUp); }

/* ---------- แถบคำสั่งด้านล่าง ---------- */
function actionBar(html){ var b = $('actionbar'); if (!html) { b.classList.remove('show'); return; } b.innerHTML = html; b.classList.add('show'); }

/* ================= กฎคำนวณฝั่งหน้าเว็บ (แสดงผลล่วงหน้า — เซิร์ฟเวอร์ตรวจซ้ำเสมอ) ================= */
var RULES = {
  slotAt: function(m){ return m < 660 ? 'ช1' : m < 900 ? 'ช2' : 'บ1'; },
  roundOt: function(min){ if (min <= 0) return 0; var h = Math.floor(min / 60), r = min % 60; return h + (r <= 15 ? 0 : r <= 30 ? 0.5 : 1); },
  starts: function(pos){
    var l = function(v, d){ var a = String(v || '').split(',').map(function(x){ return tMin(x.trim()); }).filter(function(m){ return m !== null; }); return a.length ? a : d; };
    return { 'ช1': l(pos.morningStart, [480]), 'ช2': l(pos.afternoonStart, [720]), 'บ1': l(pos.eveningStart, [960]) };
  },
  compute: function(tin, tout, dayType, pos, rules){
    var D = S.boot.dayTypes, I = tMin(tin), O = tMin(tout);
    if (I === null || O === null) return { err: 'กรอกเวลาเข้า–ออก' };
    if (O <= I) return { err: 'เวลาออกต้องหลังเวลาเข้า' };
    if (dayType === D.CLOSED) return { err: 'คลินิกปิด' };
    if (dayType === D.WORKDAY && I < tMin(rules.earliest || '15:30')) return { err: 'วันทำการเริ่มได้ ' + (rules.earliest || '15:30') + ' เป็นต้นไป' };
    var L = +pos.shiftMinutes || 240, st = RULES.starts(pos), cur = I, codes = [], g = +(rules.grace || 0);
    while (codes.length < 3) {
      if (codes.length && codes[codes.length - 1] === 'ช1') { var a = st['ช2'][0]; if (a > cur && a - cur <= 90 && a + L <= O + g) cur = a; }
      if (cur + L > O + g) break;
      var c = RULES.slotAt(cur); if (codes.indexOf(c) >= 0) break; if (dayType === D.WORKDAY && c !== 'บ1') break; codes.push(c); cur += L;
    }
    if (!codes.length) return { err: 'ไม่ครบ 1 เวร (' + (O - I) + ' นาที)' };
    var ot = RULES.roundOt(Math.max(0, O - cur)), cap = false;
    if (ot > (+rules.otMax || 4)) { ot = +rules.otMax || 4; cap = true; }
    var noOt = pos.allowOt === false && ot > 0; if (noOt) { ot = 0; cap = false; }
    return { codes: codes, ot: ot, cap: cap, noOt: noOt, odd: (st[codes[0]] || []).indexOf(I) < 0 };
  }
};
