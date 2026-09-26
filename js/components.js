/* ================= ช่องเลือกแบบค้นหาได้ (พิมพ์ + เลือก) =================
 * ใช้กับ <select data-search> ทุกตัวอัตโนมัติ · ค่าจริงยังอยู่ใน select เดิม (onchange ทำงานเหมือนเดิม)
 */
function enhanceSelects(root){ $$('select[data-search]', root || document).forEach(function(s){ if (!s.dataset.combo) makeCombo(s); else comboSync(s); }); }
function comboSync(sel){ if (sel && sel._combo) sel._combo.label(); }
function setSel(id, v){ var s = $(id); if (!s) return; s.value = v; comboSync(s); }
var _comboOpen = null;
document.addEventListener('mousedown', function(e){ if (_comboOpen && !_comboOpen.wrap.contains(e.target)) _comboOpen.close(); });
window.addEventListener('scroll', function(e){ if (_comboOpen && !(e.target && e.target.closest && e.target.closest('.combo-pop'))) _comboOpen.close(); }, true);
window.addEventListener('resize', function(){ if (_comboOpen) _comboOpen.close(); });
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
    wrap: wrap,
    label: function(){ var o = sel.options[sel.selectedIndex]; btn.innerHTML = '<span class="text-truncate">' + esc(o ? o.text : '—') + '</span>'; btn.disabled = sel.disabled; },
    open: function(){
      if (sel.disabled) return;
      if (_comboOpen && _comboOpen !== api2) _comboOpen.close();
      _comboOpen = api2; wrap.classList.add('open'); q.value = ''; render();
      // วางตำแหน่งแบบ fixed เพื่อไม่ให้ถูกตัดในตาราง/หน้าต่างที่เลื่อนได้
      var r = btn.getBoundingClientRect(), up = window.innerHeight - r.bottom < 300 && r.top > 300;
      pop.style.left = Math.max(8, Math.min(r.left, window.innerWidth - Math.max(r.width, 260) - 8)) + 'px';
      pop.style.minWidth = r.width + 'px';
      if (up) { pop.style.top = 'auto'; pop.style.bottom = (window.innerHeight - r.top + 4) + 'px'; } else { pop.style.bottom = 'auto'; pop.style.top = (r.bottom + 4) + 'px'; }
      setTimeout(function(){ q.focus(); var s = list.querySelector('.sel'); if (s) s.scrollIntoView({ block: 'nearest' }); }, 0);
    },
    close: function(){ wrap.classList.remove('open'); if (_comboOpen === api2) _comboOpen = null; }
  };
  function render(){
    var s = q.value.trim().toLowerCase();
    items = [].slice.call(sel.options).filter(function(o){ return !s || (o.text + ' ' + (o.dataset.sub || '') + ' ' + o.value).toLowerCase().indexOf(s) >= 0; });
    list.innerHTML = items.map(function(o, i){ return '<div class="combo-opt' + (o.selected ? ' sel' : '') + '" data-i="' + i + '" role="option">' + esc(o.text) + (o.dataset.sub ? '<small>' + esc(o.dataset.sub) + '</small>' : '') + '</div>'; }).join('') || '<div class="combo-empty">ไม่พบรายการที่ค้นหา</div>';
    act = -1; items.forEach(function(o, i){ if (o.selected) act = i; }); hl();
  }
  function hl(){ $$('.combo-opt', list).forEach(function(el, i){ el.classList.toggle('act', i === act); }); var a = list.querySelector('.act'); if (a) a.scrollIntoView({ block: 'nearest' }); }
  function pick(i){
    var o = items[i]; if (!o) return;
    var changed = sel.value !== o.value;
    sel.value = o.value; api2.label(); api2.close(); btn.focus();
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
