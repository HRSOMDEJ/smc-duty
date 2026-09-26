/* ================= ช่องเลือกแบบค้นหาได้ (พิมพ์ + เลือก) =================
 * ใช้กับ <select data-search> ทุกตัวอัตโนมัติ · ค่าจริงยังอยู่ใน select เดิม (onchange ทำงานเหมือนเดิม)
 */
function enhanceSelects(root){ $$('select[data-search]', root || document).forEach(function(s){ if (!s.dataset.combo) makeCombo(s); else comboSync(s); }); }
function comboSync(sel){ if (sel && sel._combo) sel._combo.label(); }
function setSel(id, v){ var s = $(id); if (!s) return; s.value = v; comboSync(s); }
var _comboOpen = null;
document.addEventListener('mousedown', function(e){ if (_comboOpen && !_comboOpen.wrap.contains(e.target) && !_comboOpen.pop.contains(e.target)) _comboOpen.close(); });
// v1.2569 เลื่อนหน้าหรือย่อขยายหน้าต่าง: ย้ายรายการตัวเลือกตามช่องเลือก (ไม่ปิดเอง) · ปิดเมื่อช่องเลือกเลื่อนพ้นจอ
window.addEventListener('scroll', function(e){ if (_comboOpen && !(e.target && e.target.closest && e.target.closest('.combo-pop'))) _comboOpen.place(true); }, true);
window.addEventListener('resize', function(){ if (_comboOpen) _comboOpen.place(true); });
function makeCombo(sel){
  sel.dataset.combo = '1';
  var wrap = document.createElement('div'); wrap.className = 'combo';
  sel.parentNode.insertBefore(wrap, sel); wrap.appendChild(sel);
  sel.classList.add('combo-native'); sel.tabIndex = -1;
  var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'form-select combo-btn'; btn.setAttribute('aria-haspopup', 'listbox');
  if (sel.id) { var lb = document.querySelector('label[for="' + sel.id + '"]'); if (lb) { btn.id = sel.id + '__btn'; lb.setAttribute('for', btn.id); } }
  wrap.appendChild(btn);
  var pop = document.createElement('div'); pop.className = 'combo-pop';
  pop.innerHTML = '<div class="combo-search"><i class="bi bi-search"></i><input class="form-control form-control-sm combo-q" placeholder="พิมพ์เพื่อค้นหา…" aria-label="ค้นหา"></div><div class="combo-list" role="listbox"></div>';
  wrap.appendChild(pop);
  var q = pop.querySelector('.combo-q'), list = pop.querySelector('.combo-list'), items = [], act = -1;
  var api2 = {
    wrap: wrap, pop: pop,
    label: function(){ var o = sel.options[sel.selectedIndex]; btn.innerHTML = '<span class="text-truncate">' + esc(o ? o.text : '—') + '</span>'; btn.disabled = sel.disabled; },
    open: function(){
      if (sel.disabled) return;
      if (_comboOpen && _comboOpen !== api2) _comboOpen.close();
      _comboOpen = api2; wrap.classList.add('open'); q.value = ''; render();
      // ย้ายรายการตัวเลือกไปไว้ชั้นบนสุดของหน้า (ไม่ถูกส่วนอื่นของหน้าทับหรือตัด) แล้ววางตำแหน่งใต้/เหนือช่องเลือก
      document.body.appendChild(pop); pop.classList.add('show');
      pop.querySelector('.combo-search').style.display = sel.options.length > 7 ? '' : 'none';   // ตัวเลือกน้อย ไม่ต้องมีช่องค้นหา
      api2.place();
      var fEl = sel.options.length > 7 ? q : list; if (fEl === list) list.tabIndex = -1;
      try { fEl.focus({ preventScroll: true }); } catch (e) { fEl.focus(); }
      var sEl = list.querySelector('.sel'); if (sEl) list.scrollTop = Math.max(0, sEl.offsetTop - list.clientHeight / 2 + sEl.offsetHeight / 2);
    },
    place: function(fromScroll){
      if (!pop.classList.contains('show')) return;
      var r = btn.getBoundingClientRect(), vh = window.innerHeight, vw = window.innerWidth;
      if (fromScroll && (r.bottom < 0 || r.top > vh || !btn.offsetParent)) { api2.close(); return; }
      var below = vh - r.bottom - 10, above = r.top - 10, up = below < 250 && above > below;
      var room = Math.max(120, (up ? above : below) - 58);
      list.style.maxHeight = Math.min(290, room) + 'px';
      var w = Math.max(r.width, 260);
      pop.style.minWidth = r.width + 'px';
      pop.style.left = Math.max(8, Math.min(r.left, vw - Math.min(w, vw - 16) - 8)) + 'px';
      if (up) { pop.style.top = 'auto'; pop.style.bottom = (vh - r.top + 4) + 'px'; } else { pop.style.bottom = 'auto'; pop.style.top = (r.bottom + 4) + 'px'; }
    },
    close: function(){ wrap.classList.remove('open'); pop.classList.remove('show'); if (pop.parentNode === document.body) wrap.appendChild(pop); if (_comboOpen === api2) _comboOpen = null; }
  };
  function render(){
    var s = q.value.trim().toLowerCase();
    items = [].slice.call(sel.options).filter(function(o){ return !s || (o.text + ' ' + (o.dataset.sub || '') + ' ' + o.value).toLowerCase().indexOf(s) >= 0; });
    list.innerHTML = items.map(function(o, i){ return '<div class="combo-opt' + (o.selected ? ' sel' : '') + '" data-i="' + i + '" role="option">' + esc(o.text) + (o.dataset.sub ? '<small>' + esc(o.dataset.sub) + '</small>' : '') + '</div>'; }).join('') || '<div class="combo-empty">ไม่พบรายการที่ค้นหา</div>';
    act = -1; items.forEach(function(o, i){ if (o.selected) act = i; }); hl();
  }
  function hl(){ $$('.combo-opt', list).forEach(function(el, i){ el.classList.toggle('act', i === act); }); var a = list.querySelector('.act'); if (a) { if (a.offsetTop < list.scrollTop) list.scrollTop = a.offsetTop; else if (a.offsetTop + a.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = a.offsetTop + a.offsetHeight - list.clientHeight; } }
  function pick(i){
    var o = items[i]; if (!o) return;
    var changed = sel.value !== o.value;
    sel.value = o.value; api2.label(); api2.close(); try { btn.focus({ preventScroll: true }); } catch (e) { btn.focus(); }
    if (changed) sel.dispatchEvent(new Event('change', { bubbles: true }));
  }
  btn.onclick = function(){ wrap.classList.contains('open') ? api2.close() : api2.open(); };
  btn.onkeydown = function(e){ if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); api2.open(); } };
  q.oninput = render;
  q.onkeydown = function(e){
    if (e.key === 'ArrowDown') { e.preventDefault(); act = Math.min(items.length - 1, act + 1); hl(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); act = Math.max(0, act - 1); hl(); }
    else if (e.key === 'Enter') { e.preventDefault(); pick(act < 0 ? 0 : act); }
    else if (e.key === 'Escape') { api2.close(); btn.focus(); }
  };
  list.onkeydown = function(e){ q.onkeydown(e); };
  list.onmousedown = function(e){ var el = e.target.closest('.combo-opt'); if (el) { e.preventDefault(); pick(+el.dataset.i); } };
  sel.addEventListener('change', api2.label);
  sel._combo = api2;
  api2.label();
}

/* ================= เลือกช่วงเวลา (เดือน / ไตรมาส / ปีงบประมาณ / ปีปฏิทิน / กำหนดเอง) ================= */
function fyOf(ym){ var p = ym.split('-'); return +p[1] >= 10 ? +p[0] + 1 : +p[0]; }        // ปีงบประมาณ (ค.ศ. ของปีที่สิ้นสุด)
function rangePicker(id, st){
  st = st || { mode: 'month', ym: S.ym || S.boot.ym };
  var cur = S.boot.ym, h = '<div class="range" id="' + id + '">';
  h += '<div><label class="form-label">ช่วงเวลา</label><div class="seg" data-rmode>' + [['month', 'รายเดือน'], ['quarter', 'ไตรมาส'], ['fy', 'ปีงบประมาณ'], ['year', 'ปีปฏิทิน'], ['custom', 'ระบุวันที่']].map(function(m){ return '<button type="button" data-m="' + m[0] + '"' + (st.mode === m[0] ? ' class="on"' : '') + '>' + m[1] + '</button>'; }).join('') + '</div></div>';
  var mo = ''; for (var i = -24; i <= 2; i++) { var y = addYm(cur, i); mo += '<option value="' + y + '"' + (y === (st.ym || cur) ? ' selected' : '') + '>' + thYm(y) + '</option>'; }
  var fyNow = fyOf(cur), qo = '', fo = '', yo = '';
  for (var f = fyNow; f >= fyNow - 2; f--) {
    for (var k = 4; k >= 1; k--) {
      var s = addYm((f - 1) + '-10', (k - 1) * 3);
      if (s > cur) continue;
      var e = addYm(s, 2);
      qo += '<option value="' + s + '|' + e + '">ไตรมาส ' + k + '/' + (f + 543) + ' (' + TH_M[+s.slice(5) - 1] + '–' + TH_M[+e.slice(5) - 1] + ' ' + String(+e.slice(0, 4) + 543).slice(2) + ')</option>';
    }
    fo += '<option value="' + (f - 1) + '-10|' + f + '-09">ปีงบประมาณ ' + (f + 543) + ' (ต.ค. ' + String(f - 1 + 543).slice(2) + ' – ก.ย. ' + String(f + 543).slice(2) + ')</option>';
  }
  var yNow = +cur.slice(0, 4);
  for (var yy = yNow; yy >= yNow - 2; yy--) yo += '<option value="' + yy + '-01|' + yy + '-12">ปี พ.ศ. ' + (yy + 543) + '</option>';
  h += '<div data-rv="month"' + (st.mode === 'month' ? '' : ' hidden') + '><label class="form-label">เดือน</label><select class="form-select" data-search data-rsel="month">' + mo + '</select></div>';
  h += '<div data-rv="quarter"' + (st.mode === 'quarter' ? '' : ' hidden') + '><label class="form-label">ไตรมาส (ปีงบประมาณ)</label><select class="form-select" data-search data-rsel="quarter">' + qo + '</select></div>';
  h += '<div data-rv="fy"' + (st.mode === 'fy' ? '' : ' hidden') + '><label class="form-label">ปีงบประมาณ</label><select class="form-select" data-search data-rsel="fy">' + fo + '</select></div>';
  h += '<div data-rv="year"' + (st.mode === 'year' ? '' : ' hidden') + '><label class="form-label">ปีปฏิทิน</label><select class="form-select" data-search data-rsel="year">' + yo + '</select></div>';
  h += '<div data-rv="custom" class="d-flex gap-2"' + (st.mode === 'custom' ? '' : ' hidden') + '><div><label class="form-label">ตั้งแต่วันที่</label><input type="date" class="form-control" data-rsel="from" value="' + (st.from || cur + '-01') + '"></div><div><label class="form-label">ถึงวันที่</label><input type="date" class="form-control" data-rsel="to" value="' + (st.to || lastDay(cur)) + '"></div></div>';
  return h + '</div>';
}
function rangeValue(id){
  var el = $(id), mode = el.querySelector('[data-rmode] .on').dataset.m;
  var v = function(k){ return el.querySelector('[data-rsel="' + k + '"]').value; };
  if (mode === 'month') { var m = v('month'); return { mode: mode, ym: m, from: m + '-01', to: lastDay(m), label: 'เดือน ' + thYm(m) }; }
  if (mode === 'custom') { var a = v('from'), b = v('to'); return { mode: mode, from: a, to: b, label: thDateFull(a) + ' – ' + thDateFull(b) }; }
  var sel = el.querySelector('[data-rsel="' + mode + '"]'), p = sel.value.split('|');
  return { mode: mode, from: p[0] + '-01', to: lastDay(p[1]), label: sel.options[sel.selectedIndex].text };
}
function initRange(id, onChange){
  var el = $(id);
  $$('[data-rmode] button', el).forEach(function(b){ b.onclick = function(){
    $$('[data-rmode] button', el).forEach(function(x){ x.classList.remove('on'); }); b.classList.add('on');
    $$('[data-rv]', el).forEach(function(d){ d.hidden = d.dataset.rv !== b.dataset.m; });
    onChange(rangeValue(id));
  }; });
  $$('[data-rsel]', el).forEach(function(s){ s.addEventListener('change', function(){ onChange(rangeValue(id)); }); });
}

/* ================= ไฟล์ CSV ================= */
function parseCsv(text){
  text = text.replace(/^﻿/, '');
  var rows = [], row = [], f = '', q = false;
  for (var i = 0; i < text.length; i++) {
    var ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { row.push(f); f = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
    else f += ch;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  var hdr = rows.shift() || [];
  return rows.filter(function(r){ return r.length > 1; }).map(function(r){ var o = {}; hdr.forEach(function(h, i){ o[h.trim()] = (r[i] || '').trim(); }); return o; });
}
function readFile(inp){ return new Promise(function(res, rej){ var f = inp.files[0]; if (!f) return res(null); var rd = new FileReader(); rd.onload = function(){ res(String(rd.result)); }; rd.onerror = rej; rd.readAsText(f, 'utf-8'); }); }

/* ================= รวมใบลืมสแกนเป็น PDF เล่มเดียว ================= */
function loadScript(src){
  return new Promise(function(res, rej){
    if (document.querySelector('script[src="' + src + '"]')) return res();
    var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = function(){ rej(new Error('โหลดตัวช่วยสร้าง PDF ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ต')); };
    document.head.appendChild(s);
  });
}
/** ข้อความภาษาไทย → รูป PNG (pdf-lib ไม่มีฟอนต์ไทยในตัว) */
function textImage(lines, width, opt){
  opt = opt || {};
  var scale = 2, lh = opt.lh || 22, pad = 10;
  var c = document.createElement('canvas'); c.width = width * scale; c.height = (lines.length * lh + pad * 2) * scale;
  var g = c.getContext('2d'); g.scale(scale, scale);
  g.fillStyle = opt.bg || '#ffffff'; g.fillRect(0, 0, width, lines.length * lh + pad * 2);
  lines.forEach(function(l, i){
    g.font = (l.bold ? '700 ' : '400 ') + (l.size || 13) + "px 'IBM Plex Sans Thai', 'Sarabun', sans-serif";
    g.fillStyle = l.color || '#111827'; g.textBaseline = 'middle';
    g.textAlign = l.align || 'left';
    g.fillText(l.text, l.align === 'right' ? width - pad : l.align === 'center' ? width / 2 : pad, pad + i * lh + lh / 2);
  });
  return { data: c.toDataURL('image/png'), w: width, h: lines.length * lh + pad * 2 };
}
function imageToJpeg(dataUrl){
  return new Promise(function(res, rej){
    var im = new Image();
    im.onload = function(){ var c = document.createElement('canvas'); var k = Math.min(1, 2200 / Math.max(im.width, im.height)); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height); res({ data: c.toDataURL('image/jpeg', 0.85), w: c.width, h: c.height }); };
    im.onerror = function(){ rej(new Error('แสดงรูปนี้ไม่ได้')); };
    im.src = dataUrl;
  });
}
function b64ToBytes(b64){ var bin = atob(b64), a = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a; }
function bytesToB64(bytes){ var s = '', ch = 0x8000; for (var i = 0; i < bytes.length; i += ch) s += String.fromCharCode.apply(null, bytes.subarray(i, i + ch)); return btoa(s); }

function printAttachments(ym, pid){
  var posLabel = pid === 'all' ? 'ทุกตำแหน่ง' : posName(pid);
  api('listPrintAttachments', { ym: ym, positionId: pid }, { block: 'กำลังรวบรวมรายการเอกสาร…' }).then(function(r){
    if (!r.files.length) return alertBox('ไม่พบใบลืมสแกน', 'เดือน ' + thYm(ym) + ' (' + posLabel + ') ยังไม่มีไฟล์แนบใบลืมสแกน', 'info');
    var n = r.files.length, done = 0;
    Swal.fire({ title: 'กำลังรวมเอกสาร', html: '<div id="pmTxt" class="small-muted">เตรียมเครื่องมือ…</div><div class="progress mt-2" style="height:8px"><div id="pmBar" class="progress-bar bg-danger" style="width:0%"></div></div>', allowOutsideClick: false, showConfirmButton: false });
    var step = function(t){ done++; $('pmTxt').textContent = t + ' (' + done + '/' + n + ')'; $('pmBar').style.width = Math.round(done / n * 100) + '%'; };
    var PL, doc, A4 = [595.28, 841.89], fails = [];
    loadScript('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js').then(function(){
      PL = window.PDFLib;
      return PL.PDFDocument.create();
    }).then(function(d){
      doc = d;
      // ปก
      var cover = doc.addPage(A4);
      var ci = textImage([{ text: 'ใบลืมสแกน / เอกสารประกอบการลงเวลา', bold: true, size: 20, align: 'center' }, { text: 'รอบเดือน ' + thYm(ym) + ' · ' + posLabel, size: 15, align: 'center' },
        { text: 'จำนวน ' + n + ' ไฟล์' + (isDemo(ym) ? ' · ข้อมูลทดลอง' : ''), size: 13, align: 'center', color: '#555' }, { text: '', size: 10 }, { text: r.foot, size: 10, align: 'center', color: '#666' }], 700, { lh: 34 });
      return doc.embedPng(ci.data).then(function(img){ var w = 520, h = w * ci.h / ci.w; cover.drawImage(img, { x: (A4[0] - w) / 2, y: A4[1] - 220 - h, width: w, height: h }); });
    }).then(function(){
      var chain = Promise.resolve();
      r.files.forEach(function(f, idx){
        chain = chain.then(function(){
          return api('getAttachment', { id: f.id }, { quiet: true }).then(function(att){
            var head = textImage([{ text: (idx + 1) + '. ' + f.positionName + ' · ' + TH_DF[dowOf(f.date)] + ' ' + thDateFull(f.date) + (f.sheetNo ? ' · ใบที่ ' + f.sheetNo : ''), bold: true, size: 14 },
              { text: f.empCode + ' ' + f.name + ' · เวลา ' + f.timeIn + '–' + f.timeOut + ' น. · ผลสแกน: ' + f.scanStatus, size: 12, color: '#374151' }], 900, { bg: '#f3f4f6', lh: 24 });
            return doc.embedPng(head.data).then(function(hImg){
              var hw = A4[0] - 40, hh = hw * head.h / head.w;
              var addPageWith = function(drawFn){ var pg = doc.addPage(A4); pg.drawImage(hImg, { x: 20, y: A4[1] - 20 - hh, width: hw, height: hh }); drawFn(pg, A4[1] - 30 - hh); };
              if (att.mimeType === 'application/pdf') {
                return PL.PDFDocument.load(b64ToBytes(att.data), { ignoreEncryption: true }).then(function(src){
                  return doc.embedPages(src.getPages()).then(function(eps){
                    eps.forEach(function(ep){ addPageWith(function(pg, top){ var k = Math.min((A4[0] - 40) / ep.width, (top - 30) / ep.height); pg.drawPage(ep, { x: (A4[0] - ep.width * k) / 2, y: top - ep.height * k, xScale: k, yScale: k }); }); });
                  });
                });
              }
              return imageToJpeg('data:' + att.mimeType + ';base64,' + att.data).then(function(j){
                return doc.embedJpg(j.data).then(function(img){ addPageWith(function(pg, top){ var k = Math.min((A4[0] - 40) / j.w, (top - 30) / j.h); pg.drawImage(img, { x: (A4[0] - j.w * k) / 2, y: top - j.h * k, width: j.w * k, height: j.h * k }); }); });
              });
            });
          }).catch(function(e){ fails.push(f.name + ' ' + thDate(f.date) + ': ' + (e.message || e)); }).then(function(){ step('รวมไฟล์ ' + f.name); });
        });
      });
      return chain;
    }).then(function(){
      // เลขหน้า + ผู้จัดพิมพ์
      var pages = doc.getPages(), total = pages.length;
      var ft = pages.map(function(pg, i){ return textImage([{ text: r.foot + '     หน้า ' + (i + 1) + ' / ' + total, size: 10, color: '#555', align: 'right' }], 900, { lh: 18 }); });
      return Promise.all(ft.map(function(t){ return doc.embedPng(t.data); })).then(function(imgs){
        imgs.forEach(function(img, i){ var w = A4[0] - 40, h = w * ft[i].h / ft[i].w; pages[i].drawImage(img, { x: 20, y: 8, width: w, height: h }); });
      });
    }).then(function(){ return doc.save(); }).then(function(bytes){
      Swal.close();
      var name = 'ใบลืมสแกน_' + (pid === 'all' ? 'ทุกตำแหน่ง' : posName(pid)) + '_' + thYm(ym).replace(' ', '_') + '_' + new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
      var blob = new Blob([bytes], { type: 'application/pdf' });
      saveBlob(blob, name + '.pdf');
      if (bytes.length < 18 * 1024 * 1024) api('saveExportCopy', { ym: ym, name: name, mimeType: 'application/pdf', data: bytesToB64(bytes), kind: 'attachments', positions: pid }, { quiet: true }).catch(function(){});
      Swal.fire({ icon: fails.length ? 'warning' : 'success', title: 'รวมใบลืมสแกนเรียบร้อย', html: 'รวม ' + (n - fails.length) + ' ไฟล์ ดาวน์โหลดลงเครื่องแล้ว' + (fails.length ? '<div class="text-start small mt-2 text-danger">ไฟล์ที่รวมไม่ได้ (เปิดดูได้ในระบบ):<br>' + fails.map(esc).join('<br>') + '</div>' : ''), confirmButtonText: 'รับทราบ' });
    }).catch(function(e){ Swal.close(); alertBox('รวมเอกสารไม่สำเร็จ', e.message || String(e), 'error'); });
  }).catch(function(){});
}
/* ================= v1.3 ดูไฟล์แนบในหน้าต่าง (ไม่ดาวน์โหลดอัตโนมัติ) ================= */
var _viewUrl = null;
function fileViewer(f, opt){
  opt = opt || {};
  if (_viewUrl) { try { URL.revokeObjectURL(_viewUrl); } catch (e) { } }
  var blob = b64ToBlob(f.data, f.mimeType); _viewUrl = URL.createObjectURL(blob);
  var isImg = /^image\//.test(f.mimeType), isPdf = f.mimeType === 'application/pdf';
  var body = '<div class="viewer">' + (isImg ? '<div class="viewer-img" id="vwBox"><img src="' + _viewUrl + '" alt="' + esc(f.fileName) + '" id="vwImg"></div>' :
    isPdf ? '<iframe class="viewer-pdf" src="' + _viewUrl + '#view=FitH" title="' + esc(f.fileName) + '"></iframe>' :
    '<div class="empty"><i class="bi bi-file-earmark"></i>ไฟล์ประเภทนี้แสดงตัวอย่างไม่ได้ กรุณาดาวน์โหลด</div>') +
    '<div class="viewer-meta"><i class="bi bi-paperclip"></i> ' + esc(f.fileName) + ' <span class="small-muted">· ' + (blob.size / 1024 < 1024 ? Math.round(blob.size / 1024) + ' KB' : (blob.size / 1048576).toFixed(1) + ' MB') + '</span>' +
    (isImg ? '<span class="ms-auto d-flex gap-1"><button class="btn btn-sm btn-ghost" type="button" onclick="vwZoom(-1)" aria-label="ย่อ"><i class="bi bi-zoom-out"></i></button><button class="btn btn-sm btn-ghost" type="button" onclick="vwZoom(0)">พอดีจอ</button><button class="btn btn-sm btn-ghost" type="button" onclick="vwZoom(1)" aria-label="ขยาย"><i class="bi bi-zoom-in"></i></button><button class="btn btn-sm btn-ghost" type="button" onclick="vwRotate()" aria-label="หมุน"><i class="bi bi-arrow-clockwise"></i></button></span>' : '') + '</div></div>';
  var btns = [
    { text: '<i class="bi bi-box-arrow-up-right"></i> เปิดในแท็บใหม่', cls: 'btn-ghost', onClick: function(){ var w = window.open(_viewUrl, '_blank'); if (!w) notify('เบราว์เซอร์บล็อกการเปิดหน้าต่างใหม่', 'info'); return false; } },
    { text: '<i class="bi bi-download"></i> ดาวน์โหลด', cls: 'btn-soft', onClick: function(){ saveBlob(blob, f.fileName); return false; } }
  ];
  if (opt.onDelete) btns.push({ text: '<i class="bi bi-trash3"></i> ลบไฟล์', cls: 'btn-danger-soft', onClick: function(){ opt.onDelete(); return false; } });
  btns.push({ text: 'ปิด', cls: 'btn-brand' });
  modal(f.fileName, body, btns, 'xl');
  window._vw = { z: 1, r: 0 };
}
function vwZoom(d){ var v = window._vw; v.z = d === 0 ? 1 : Math.max(.3, Math.min(5, v.z * (d > 0 ? 1.25 : .8))); vwApply(); }
function vwRotate(){ window._vw.r = (window._vw.r + 90) % 360; vwApply(); }
function vwApply(){ var im = $('vwImg'); if (!im) return; var v = window._vw; im.style.transform = 'rotate(' + v.r + 'deg) scale(' + v.z + ')'; $('vwBox').classList.toggle('zoomed', v.z > 1); }

/* ================= v1.3 พิมพ์รายงาน (A4 แนวนอน) พร้อมเลขอ้างอิงและบันทึกการพิมพ์ ================= */
/**
 * o: {title, subtitle, filters, bodyHtml, count, kind, portrait}
 * ขอเลขอ้างอิงจากเซิร์ฟเวอร์ (บันทึกลงประวัติการใช้งาน) แล้วเปิดหน้าต่างพิมพ์ของเบราว์เซอร์
 */
function printReport(o){
  return api('logPrint', { title: o.title, filters: o.filters, count: o.count || 0, kind: o.kind || '' }, { block: 'กำลังเตรียมเอกสารสำหรับพิมพ์…' }).then(function(m){
    var b = BRAND || {};
    var root = $('printRoot');
    root.className = o.portrait ? 'portrait' : 'landscape';
    $('printPage').textContent = '@page{size:A4 ' + (o.portrait ? 'portrait' : 'landscape') + ';margin:10mm 10mm 14mm 10mm;@bottom-right{content:"หน้า " counter(page) " / " counter(pages);font:9pt "IBM Plex Sans Thai",sans-serif;color:#555}@bottom-left{content:"' + m.ref + '";font:9pt "IBM Plex Sans Thai",sans-serif;color:#555}}';
    root.innerHTML = '<div class="pr-doc">' +
      '<header class="pr-head">' + (b.logo ? '<img class="pr-logo" src="' + b.logo + '" alt="">' : '') +
        '<div class="pr-org"><b>' + esc(m.org) + '</b><span>' + esc(m.system) + '</span></div>' +
        '<div class="pr-ref"><div>เลขอ้างอิง <b>' + esc(m.ref) + '</b></div><div>พิมพ์เมื่อ ' + esc(m.printedAt) + '</div></div></header>' +
      '<h1 class="pr-title">' + esc(o.title) + '</h1>' + (o.subtitle ? '<div class="pr-sub">' + esc(o.subtitle) + '</div>' : '') +
      (o.filters ? '<div class="pr-filters"><b>เงื่อนไข:</b> ' + esc(o.filters) + '</div>' : '') +
      '<div class="pr-body">' + o.bodyHtml + '</div>' +
      '<div class="pr-end">— สิ้นสุดรายงาน · จำนวน ' + fmt(o.count || 0) + ' รายการ —</div>' +
      '<div class="pr-foot">พิมพ์โดย ' + esc(m.printedBy) + ' เมื่อ ' + esc(m.printedAt) + ' · เลขอ้างอิง ' + esc(m.ref) + ' · ' + esc(m.system) + '</div></div>';
    document.body.classList.add('printing');
    var done = function(){ document.body.classList.remove('printing'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(function(){ try { window.print(); } catch (e) { alertBox('เปิดหน้าต่างพิมพ์ไม่ได้', 'กรุณากด Ctrl+P (หรือ ⌘+P) เพื่อพิมพ์', 'info'); } setTimeout(done, 1500); }, 250);
    return m;
  });
}
/** ตารางสำหรับรายงานพิมพ์ */
function prTable(cols, rows, groupBy){
  var h = '<table class="pr-table"><thead><tr>' + cols.map(function(c){ return '<th' + (c.w ? ' style="width:' + c.w + '"' : '') + (c.num ? ' class="num"' : '') + '>' + esc(c.t) + '</th>'; }).join('') + '</tr></thead><tbody>';
  var last = null;
  rows.forEach(function(r){
    if (groupBy) { var g = groupBy(r); if (g !== last) { h += '<tr class="pr-group"><td colspan="' + cols.length + '">' + esc(g) + '</td></tr>'; last = g; } }
    h += '<tr>' + cols.map(function(c){ var v = c.f(r); return '<td' + (c.num ? ' class="num"' : '') + '>' + (c.html ? v : esc(v)) + '</td>'; }).join('') + '</tr>';
  });
  return h + '</tbody></table>';
}

/* ================= v1.3 ตารางแบบ Google Sheet ================= */
/**
 * cfg: {host, dates:[{d,dow,color,note,open}], rows:[{key,pid,groupName?,empCode,name,sub,cells:{d:text},pend:{d:1},editable}],
 *       groups:true (แสดงหัวกลุ่มตามตำแหน่ง), onSave(changes, done), onAddRow(pid), legend}
 * พิมพ์ตัวย่อช่วงเวรในช่อง (เช่น ย, ชบ, ช V/S) · ลูกศร/Enter เลื่อนช่อง · วาง (Ctrl+V) จาก Excel/Google Sheet ได้หลายช่อง
 */
function slotMap(){
  var m = {};
  ['ช1', 'ช2', 'บ1'].forEach(function(k){ var l = slotL(k); m[k] = k; m[l.s] = k; if (l.en) m[String(l.en).toUpperCase()] = k; });
  return m;
}
function parseCell(t){
  t = String(t || '').trim(); if (!t) return { slots: [], note: '' };
  var m = t.match(/^([^\s]+)(?:\s+(.*))?$/), map = slotMap(), out = [], bad = '';
  m[1].split(/[,+\/]/).filter(String).forEach(function(part){
    if (map[part] || map[part.toUpperCase()]) { out.push(map[part] || map[part.toUpperCase()]); return; }
    var i = 0, got = [], ok = true;
    while (i < part.length) { var hit = null; [3, 2, 1].forEach(function(n){ if (!hit && i + n <= part.length) { var sg = part.substr(i, n); if (map[sg] || map[sg.toUpperCase()]) hit = { k: map[sg] || map[sg.toUpperCase()], n: n }; } }); if (!hit) { ok = false; break; } got.push(hit.k); i += hit.n; }
    if (ok) out = out.concat(got); else bad = part;
  });
  if (bad) return { error: 'ไม่รู้จัก "' + bad + '"' };
  var u = []; out.forEach(function(x){ if (u.indexOf(x) < 0) u.push(x); });
  return { slots: u, note: (m[2] || '').trim() };
}
function cellText(slots, note){ return slots.map(function(k){ return slotL(k).s; }).join('') + (note ? ' ' + note : ''); }
function SheetGrid(cfg){
  var G = { cfg: cfg, dirty: {} };
  var host = typeof cfg.host === 'string' ? $(cfg.host) : cfg.host;
  var dates = cfg.dates;
  G.render = function(){
    var anyEdit = cfg.rows.some(function(r){ return r.editable; }) || cfg.canAdd;
    var h = '<div class="sg-bar">' + (anyEdit ? '<span class="small-muted"><i class="bi bi-keyboard"></i> พิมพ์ตัวย่อในช่อง เช่น <b>' + esc(slotL('บ1').s) + '</b>, <b>' + esc(slotL('ช1').s + slotL('ช2').s) + '</b> หรือ <b>' + esc(slotL('บ1').s) + ' V/S</b> · ลบช่องว่าง = ยกเลิกเวร · วางจาก Excel ได้</span>' : '<span class="small-muted"><i class="bi bi-eye"></i> เปิดดูอย่างเดียว</span>') +
      '<span class="ms-auto d-flex gap-2 align-items-center"><span class="sg-cnt" id="sgCnt"></span>' + (anyEdit ? '<button class="btn btn-sm btn-ghost" type="button" id="sgUndo" disabled><i class="bi bi-arrow-counterclockwise"></i> ยกเลิกที่แก้</button><button class="btn btn-sm btn-brand" type="button" id="sgSave" disabled><i class="bi bi-save"></i> บันทึกตาราง</button>' : '') + '</span></div>';
    // v1.2569 คอลัมน์ รหัส · ชื่อ-นามสกุล · ตำแหน่ง · สีสถานะการบันทึกเวลา · แถวรวมรายวันท้ายแต่ละตำแหน่ง
    h += '<div class="sg-wrap"><table class="sg"><thead><tr><th class="sg-code">รหัส</th><th class="sg-name">ชื่อ-นามสกุล</th><th class="sg-hp">ตำแหน่ง</th>' + dates.map(function(x){ return '<th class="' + dk(x.color) + '" title="' + esc(x.note || '') + '"><div>' + x.d + '</div><small>' + TH_D[x.dow] + '</small></th>'; }).join('') + '<th class="sg-tot">รวม</th></tr></thead><tbody>';
    var groupsOrder = [], byG = {};
    cfg.rows.forEach(function(r, i){ var g = cfg.groups ? r.pid : '_'; if (!byG[g]) { byG[g] = []; groupsOrder.push(g); } byG[g].push(i); });
    groupsOrder.forEach(function(g){
      var idx = byG[g], r0 = cfg.rows[idx[0]];
      if (cfg.groups) h += '<tr class="sg-g"><td class="sg-code"></td><td class="sg-name"><b>' + esc(r0.groupName || posName(r0.pid)) + '</b></td><td class="sg-hp">' + (r0.status ? statusPill(r0.status) : '') + '</td><td colspan="' + (dates.length + 1) + '">' + (cfg.onAddRow && cfg.canAddPid && cfg.canAddPid(r0.pid) ? '<button class="btn btn-sm btn-link py-0" type="button" data-addp="' + r0.pid + '"><i class="bi bi-person-plus"></i> เพิ่มบุคลากร</button>' : '') + '</td></tr>';
      idx.forEach(function(i){
        var r = cfg.rows[i];
        h += '<tr data-row="' + i + '"><td class="sg-code tnum">' + esc(r.empCode) + '</td><td class="sg-name"><b>' + esc(r.name) + '</b></td><td class="sg-hp">' + esc(r.hrPos || '') + '</td>';
        dates.forEach(function(x){
          var v = r.cells[x.d] || '', pend = r.pend && r.pend[x.d], st = r.st && r.st[x.d], rc = v ? recCls(st, r.status) : '';
          h += '<td class="' + dk(x.color) + (pend ? ' sg-pend' : '') + (rc ? ' ' + rc : '') + '"' + (v ? ' title="' + esc(recTitle(st, r.status)) + '"' : '') + '>' + (r.editable ? '<input class="sgc" data-r="' + i + '" data-d="' + x.d + '" value="' + esc(v) + '" autocomplete="off" spellcheck="false" aria-label="' + esc(r.name + ' วันที่ ' + x.d) + '">' : '<span class="sgv">' + esc(v) + '</span>') + '</td>';
        });
        h += '<td class="sg-tot" id="sgt_' + i + '">' + rowTotal(r) + '</td></tr>';
      });
      h += '<tr class="sg-sum" data-g="' + g + '"><td class="sg-code"></td><td class="sg-name">รวมคนขึ้นเวรรายวัน</td><td class="sg-hp"></td>' + dates.map(function(x){ return '<td class="' + dk(x.color) + '" data-sd="' + x.d + '"></td>'; }).join('') + '<td class="sg-tot" data-st="1"></td></tr>';
    });
    if (!cfg.rows.length) h += '<tr><td colspan="' + (dates.length + 4) + '">' + empty('calendar-x', 'ยังไม่มีผู้ลงเวร') + '</td></tr>';
    h += '</tbody></table></div>';
    if (cfg.onAddRow && !cfg.groups && cfg.canAdd) h += '<div class="mt-2"><button class="btn btn-sm btn-soft" type="button" data-addp=""><i class="bi bi-person-plus"></i> เพิ่มบุคลากรในตาราง</button></div>';
    host.innerHTML = h;
    G._byG = byG;
    bind();
    count();
    sums();
  };
  function sums(){
    Object.keys(G._byG || {}).forEach(function(g){
      var tr = host.querySelector('tr.sg-sum[data-g="' + g + '"]'); if (!tr) return;
      var tot = 0;
      dates.forEach(function(x){ var n = 0; G._byG[g].forEach(function(i){ var v = cfg.rows[i].cells[x.d]; if (v && !parseCell(v).error && String(v).trim()) n++; }); tot += n; var td = tr.querySelector('[data-sd="' + x.d + '"]'); if (td) td.textContent = n || ''; });
      var tt = tr.querySelector('[data-st]'); if (tt) tt.textContent = tot;
    });
  }
  function rowTotal(r){ var n = 0; Object.keys(r.cells).forEach(function(d){ var p = parseCell(r.cells[d]); if (!p.error) n += p.slots.length; }); return n || ''; }
  function count(){
    var n = Object.keys(G.dirty).length;
    if ($('sgCnt')) $('sgCnt').innerHTML = n ? '<span class="pill p-warn nodot">แก้ไข ' + n + ' ช่อง</span>' : '';
    if ($('sgSave')) $('sgSave').disabled = !n;
    if ($('sgUndo')) $('sgUndo').disabled = !n;
  }
  function setCell(inp, val){
    var r = cfg.rows[+inp.dataset.r], d = +inp.dataset.d;
    inp.value = val;
    var orig = r.orig ? (r.orig[d] || '') : '';
    var p = parseCell(val);
    inp.classList.toggle('bad', !!p.error);
    inp.title = p.error || '';
    var key = r.key + '|' + d;
    if (String(val).trim() === String(orig).trim()) { delete G.dirty[key]; inp.classList.remove('dirty'); }
    else { G.dirty[key] = { row: r, d: d, value: String(val).trim() }; inp.classList.add('dirty'); }
    r.cells[d] = val;
    var t = $('sgt_' + inp.dataset.r); if (t) t.textContent = rowTotal(r);
    count(); sums();
  }
  function bind(){
    cfg.rows.forEach(function(r){ if (!r.orig) { r.orig = {}; for (var k in r.cells) r.orig[k] = r.cells[k]; } });
    var inputs = $$('.sgc', host);
    inputs.forEach(function(inp){
      inp.addEventListener('input', function(){ setCell(inp, inp.value); });
      inp.addEventListener('focus', function(){ inp.select(); var tr = inp.closest('tr'); $$('.sg tr.on', host).forEach(function(x){ x.classList.remove('on'); }); tr.classList.add('on'); });
      inp.addEventListener('keydown', function(e){
        var r = +inp.dataset.r, d = +inp.dataset.d, go = null;
        if (e.key === 'ArrowRight' && (inp.selectionStart === inp.value.length || e.altKey)) go = [r, d + 1];
        else if (e.key === 'ArrowLeft' && (inp.selectionStart === 0 || e.altKey)) go = [r, d - 1];
        else if (e.key === 'ArrowDown' || e.key === 'Enter') go = [r + 1, d];
        else if (e.key === 'ArrowUp') go = [r - 1, d];
        else if ((e.key === 'Delete' || e.key === 'Backspace') && inp.selectionStart === 0 && inp.selectionEnd === inp.value.length) { e.preventDefault(); setCell(inp, ''); return; }
        if (go) { var n = host.querySelector('.sgc[data-r="' + go[0] + '"][data-d="' + go[1] + '"]'); if (n) { e.preventDefault(); n.focus(); } }
      });
      inp.addEventListener('paste', function(e){
        var t = (e.clipboardData || window.clipboardData).getData('text');
        if (!t || (t.indexOf('\t') < 0 && t.indexOf('\n') < 0)) return;
        e.preventDefault();
        var lines = t.replace(/\r/g, '').split('\n'); if (lines[lines.length - 1] === '') lines.pop();
        var r0 = +inp.dataset.r, d0 = +inp.dataset.d, n = 0;
        lines.forEach(function(line, i){ line.split('\t').forEach(function(v, j){ var c = host.querySelector('.sgc[data-r="' + (r0 + i) + '"][data-d="' + (d0 + j) + '"]'); if (c) { setCell(c, v.trim()); n++; } }); });
        notify('วางข้อมูล ' + n + ' ช่อง', 'info');
      });
    });
    if ($('sgSave')) $('sgSave').onclick = function(){ G.save(this); };
    if ($('sgUndo')) $('sgUndo').onclick = function(){ Object.keys(G.dirty).forEach(function(k){ var x = G.dirty[k]; x.row.cells[x.d] = x.row.orig[x.d] || ''; }); G.dirty = {}; G.render(); };
    $$('[data-addp]', host).forEach(function(b){ b.onclick = function(){ cfg.onAddRow(b.dataset.addp); }; });
  }
  G.save = function(btn){
    var bad = $$('.sgc.bad', host);
    if (bad.length) { bad[0].focus(); return alertBox('มีช่องที่ไม่ถูกต้อง', bad.length + ' ช่องใช้ตัวย่อที่ระบบไม่รู้จัก (กรอบสีแดง) กรุณาแก้ไขก่อนบันทึก', 'warning'); }
    var list = Object.keys(G.dirty).map(function(k){ var x = G.dirty[k]; return { pid: x.row.pid, empCode: x.row.empCode, d: x.d, value: x.value }; });
    if (!list.length) return;
    cfg.onSave(list, btn);
  };
  G.hasDirty = function(){ return Object.keys(G.dirty).length > 0; };
  G.render();
  return G;
}

