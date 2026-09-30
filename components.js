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
  var q = pop.querySelector('.combo-q'), list = pop.querySelector('.combo-list'), items = [], act = -1, showMore = false;
  var api2 = {
    wrap: wrap, pop: pop,
    label: function(){ var o = sel.options[sel.selectedIndex]; btn.innerHTML = '<span class="text-truncate">' + esc(o ? o.text : '—') + '</span>'; btn.disabled = sel.disabled; },
    open: function(){
      if (sel.disabled) return;
      if (_comboOpen && _comboOpen !== api2) _comboOpen.close();
      _comboOpen = api2; wrap.classList.add('open'); q.value = ''; showMore = false; render();
      // ย้ายรายการตัวเลือกไปไว้ชั้นบนสุดของหน้า (ไม่ถูกส่วนอื่นของหน้าทับหรือตัด) แล้ววางตำแหน่งใต้/เหนือช่องเลือก
      // 30 ก.ย. 69: ถ้าอยู่ในหน้าต่าง (modal) ให้วางไว้ในหน้าต่างนั้น — ไม่งั้นหน้าต่างดึงโฟกัสกลับ พิมพ์ค้นหาไม่ได้
      (btn.closest('.modal') || document.body).appendChild(pop); pop.classList.add('show');
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
    close: function(){ wrap.classList.remove('open'); pop.classList.remove('show'); if (pop.parentNode !== wrap) wrap.appendChild(pop); if (_comboOpen === api2) _comboOpen = null; }
  };
  function render(){
    var s = q.value.trim().toLowerCase();
    // 30 ก.ย. 69: ตัวเลือกที่มี data-more (เช่น บุคลากรที่ยังไม่ได้รับอนุมัติให้ขึ้นตำแหน่งนี้) ซ่อนไว้ จนกว่าจะกด "แสดงเพิ่ม"
    var hidden = 0;
    items = [].slice.call(sel.options).filter(function(o){
      if (s && (o.text + ' ' + (o.dataset.sub || '') + ' ' + o.value).toLowerCase().indexOf(s) < 0) return false;
      if (o.dataset.more && !showMore && !o.selected) { hidden++; return false; }
      return true;
    });
    list.innerHTML = (items.map(function(o, i){ return '<div class="combo-opt' + (o.selected ? ' sel' : '') + (o.dataset.more ? ' more' : '') + '" data-i="' + i + '" role="option">' + esc(o.text) + (o.dataset.sub ? '<small>' + esc(o.dataset.sub) + '</small>' : '') + '</div>'; }).join('') || '<div class="combo-empty">' + (!s && hidden ? 'ไม่มีรายชื่อที่ได้รับอนุมัติตำแหน่งนี้เหลือให้เลือก' : 'ไม่พบรายการที่ค้นหา') + '</div>') +
      (hidden ? '<div class="combo-more" data-more="1"><i class="bi bi-people"></i> แสดงบุคลากรที่ยังไม่ได้กำหนดตำแหน่ง (' + hidden + ' คน)</div>' : '');
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
  list.onmousedown = function(e){
    if (e.target.closest('.combo-more')) { e.preventDefault(); e.stopPropagation(); showMore = true; render(); try { q.focus({ preventScroll: true }); } catch (x) { } return; }
    var el = e.target.closest('.combo-opt'); if (el) { e.preventDefault(); pick(+el.dataset.i); }
  };
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
  // 1 ต.ค. 69 pid = รหัสตำแหน่ง | 'all' | [รายการตำแหน่ง]
  var arr = Array.isArray(pid) ? pid : [pid], one = arr.length === 1 ? arr[0] : '';
  var posLabel = one === 'all' ? 'ทุกตำแหน่ง' : one ? posName(one) : arr.length + ' ตำแหน่ง';
  api('listPrintAttachments', { ym: ym, positionId: one || 'all', positionIds: one ? [] : arr }, { block: 'กำลังรวบรวมรายการเอกสาร…' }).then(function(r){
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
      // 29 ก.ย. 69: เปิดเล่มให้ดู/พิมพ์ทันที (กด "เปิดในแท็บใหม่" แล้วสั่งพิมพ์ หรือ "ดาวน์โหลด") · ไม่เก็บสำเนาใน Drive
      fileViewer({ fileName: name + '.pdf', mimeType: 'application/pdf', data: bytesToB64(bytes) });
      if (fails.length) alertBox('รวมได้ ' + (n - fails.length) + ' ไฟล์ · รวมไม่ได้ ' + fails.length + ' ไฟล์', 'ไฟล์ที่รวมไม่ได้ (เปิดดูได้ในระบบ):\n' + fails.join('\n'), 'warning');
      else notify('รวมใบลืมสแกน ' + n + ' ไฟล์เรียบร้อย');
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
/* ================= 29 ก.ย. 69 พิมพ์เอกสารจากเบราว์เซอร์ (ตารางเวร/OT · ใบลงชื่อ FM-HRM-031) =================
 * เซิร์ฟเวอร์ส่งเฉพาะข้อมูล → จัดหน้า A4 ที่นี่ → เปิดหน้าต่างพิมพ์ทันที (ต้องการไฟล์: เลือก "บันทึกเป็น PDF")
 * ไม่สร้าง Google Sheet ชั่วคราว ไม่เก็บไฟล์ใน Drive · ทุกหน้าย่อให้พอดีกระดาษ 1 หน้าอัตโนมัติ */
function ensureDocFont(){
  // 30 ก.ย. 69: ฟอนต์ Sarabun (แบบเดียวกับ TH Sarabun New ฟอนต์ราชการ) · โหลดครบ 400/600/700 ก่อนจัดหน้า รอได้ถึง 6 วิ
  if (!$('fSarabun')) { var l = document.createElement('link'); l.id = 'fSarabun'; l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,400;0,600;0,700;1,400&display=swap'; document.head.appendChild(l); }
  var TXT = 'ตารางเวรคลินิก 0123456789';
  var p = (document.fonts && document.fonts.load) ? Promise.all(['400', '600', '700', 'italic 400'].map(function(w){ return document.fonts.load(w + ' 14px Sarabun', TXT); })).catch(function(){}) : Promise.resolve();
  return Promise.race([p, new Promise(function(r){ setTimeout(r, 6000); })]);
}
/** o: {orient:'landscape'|'portrait', pages:[html], title} */
function printDoc(o){
  return ensureDocFont().then(function(){
    var root = $('printRoot');
    root.className = 'docs ' + o.orient + ' measuring';
    $('printPage').textContent = '@page{size:A4 ' + o.orient + ';margin:8mm}';
    root.innerHTML = o.pages.map(function(h){ return '<section class="dp' + (o.flow ? ' flow' : '') + '"><div class="dp-in">' + h + '</div></section>'; }).join('');
    $$('.dp', root).forEach(function(sec){
      // ย่อให้พอดีหน้า (flow = พอดีความกว้าง ยาวต่อหลายหน้าได้) · ใช้ zoom (ไม่ใช้ transform) เพื่อให้เครื่องพิมพ์ตัดหน้าตามขนาดที่ย่อแล้วจริง
      var inn = sec.firstChild, W = sec.clientWidth, H = o.flow ? 1e9 : sec.clientHeight, w = inn.scrollWidth, h = inn.scrollHeight;
      var k = Math.min(1, W / Math.max(1, w), H / Math.max(1, h)) * 0.99;
      for (var i = 0; i < 4; i++) {   // ตัวอักษรจัดบรรทัดใหม่หลังย่อ → วัดซ้ำจนพอดี
        inn.style.zoom = k.toFixed(4);
        var r = inn.getBoundingClientRect(), a = sec.getBoundingClientRect();
        var over = Math.max(r.width / Math.max(1, a.width), o.flow ? 0 : r.height / Math.max(1, a.height));
        if (over <= 1) break;
        k = k / over * 0.99;
      }
    });
    root.classList.remove('measuring');
    var t0 = document.title; if (o.title) document.title = o.title;   // ชื่อไฟล์ตั้งต้นเมื่อเลือก "บันทึกเป็น PDF"
    document.body.classList.add('printing');
    var done = function(){ document.body.classList.remove('printing'); document.title = t0; window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(function(){ try { window.print(); } catch (e) { alertBox('เปิดหน้าต่างพิมพ์ไม่ได้', 'กรุณากด Ctrl+P (หรือ ⌘+P) เพื่อพิมพ์', 'info'); } setTimeout(done, 1500); }, 150);
  });
}
function docNum(v, d){ v = +v || 0; return d ? v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (v % 1 === 0 ? v.toLocaleString('en-US') : String(+v.toFixed(2))); }
function docSignHtml(L, R){
  var blk = function(x){ return x ? '<div class="ds-b"><div class="ds-tt">' + esc(x.title) + '</div><div class="ds-gap"></div><div class="ds-ln"></div><div>' + esc(x.name) + '</div><div>' + esc(x.role || '') + '</div></div>' : '<div class="ds-b"></div>'; };
  return '<div class="ds">' + blk(L) + blk(R) + '</div>';
}
/** ตารางเวร / ตาราง OT 1 หน้า (รูปแบบเดียวกับเอกสารแนบเบิกเดิม)
 *  30 ก.ย. 69: จัดขนาดให้พอดีกระดาษ A4 แนวนอนที่ขนาดจริง (ย่อน้อยที่สุด) · ตัวอักษรขนาดเอกสารราชการ · หัวตารางตัดบรรทัดเฉพาะจุดที่กำหนด */
function docTableHtml(m, foot, page, pages){
  var nD = m.dates.length, n = m.rows.length, ot = m.type === 'ot';
  var wNo = 32, wCode = 56, wName = m.withUnit ? 150 : 176, wPos = m.withUnit ? 108 : 140, wUnit = 80, wTot = 36, wAmt = m.pay ? 72 : 0, wDay = 20;
  var totalW = wNo + wCode + wName + wPos + (m.withUnit ? wUnit : 0) + wTot + wAmt + wDay * nD;
  // ความสูงแถว: ให้ตารางกินพื้นที่หน้าพอดี แต่ไม่สูงเกิน (หน้า A4 แนวนอนสูง ~730px หักหัว/ลงนาม ~290px)
  var avail = 730 * Math.max(1, totalW / 1062) - 290;
  var rowH = Math.max(24, Math.min(32, Math.floor(avail / Math.max(1, n + 1))));
  var cols = '<col style="width:' + wNo + 'px"><col style="width:' + wCode + 'px"><col style="width:' + wName + 'px"><col style="width:' + wPos + 'px">' + (m.withUnit ? '<col style="width:' + wUnit + 'px">' : '') +
    m.dates.map(function(){ return '<col style="width:' + wDay + 'px">'; }).join('') + '<col style="width:' + wTot + 'px">' + (m.pay ? '<col style="width:' + wAmt + 'px">' : '');
  var bg = function(x){ return x.bg ? ' style="background:' + x.bg + '"' : ''; };
  var h = '<div class="dt' + (ot ? ' ot' : '') + '" style="width:' + totalW + 'px">' +
    '<div class="dt-h1">' + esc(m.head) + '</div><div class="dt-h2">' + esc(m.posLine) + '</div><div class="dt-h3">' + esc(m.code) + '</div>' + (m.mark ? '<div class="dt-mark">' + esc(m.mark) + '</div>' : '<div class="dt-gap"></div>') +
    '<table class="dt-t"><colgroup>' + cols + '</colgroup><thead><tr><th rowspan="2">ลำดับ</th><th rowspan="2">รหัส<br>เจ้าหน้าที่</th><th rowspan="2">ชื่อ - นามสกุล</th><th rowspan="2">ตำแหน่ง</th>' + (m.withUnit ? '<th rowspan="2">จุด<br>ปฏิบัติงาน</th>' : '') +
    m.dates.map(function(x){ return '<th class="dn"' + bg(x) + '>' + x.d + '</th>'; }).join('') + '<th rowspan="2">' + (ot ? 'รวม<br>OT' : 'รวม') + '</th>' + (m.pay ? '<th rowspan="2">' + (ot ? 'รายได้ OT<br>(บาท)' : 'รายได้<br>(บาท)') + '</th>' : '') + '</tr><tr>' +
    m.dates.map(function(x){ return '<th class="dw"' + bg(x) + '>' + esc(x.dow) + '</th>'; }).join('') + '</tr></thead><tbody>';
  m.rows.forEach(function(r){
    h += '<tr style="height:' + rowH + 'px"><td class="c">' + r.no + '</td><td class="c">' + esc(r.code) + '</td><td class="nm">' + esc(r.name) + '</td><td class="ps">' + esc(r.pos) + '</td>' + (m.withUnit ? '<td class="ps">' + esc(r.unit) + '</td>' : '') +
      r.days.map(function(v, i){ return '<td class="d"' + bg(m.dates[i]) + '>' + (v === '' ? '' : esc(ot ? docNum(v) : v)) + '</td>'; }).join('') +
      '<td class="t">' + docNum(r.total) + '</td>' + (m.pay ? '<td class="a">' + docNum(r.amt, 2) + '</td>' : '') + '</tr>';
  });
  h += '<tr class="sum"><td colspan="' + (m.withUnit ? 5 : 4) + '" class="c">รวมประจำวัน</td>' + m.daily.map(function(v){ return '<td class="c">' + (v ? docNum(v) : '') + '</td>'; }).join('') +
    '<td class="t">' + docNum(m.sumTotal) + '</td>' + (m.pay ? '<td class="a">' + docNum(m.sumAmt, 2) + '</td>' : '') + '</tr></tbody></table>' +
    '<div class="dt-leg">' + esc(m.legend) + '</div>' + docSignHtml(m.sign.left, m.sign.right) +
    '<div class="dt-foot"><i>' + esc(foot) + '</i><span>หน้า ' + page + ' / ' + pages + '</span></div></div>';
  return h;
}
/** ใบลงชื่อ FM-HRM-031 1 ใบ (A4 แนวตั้ง) */
function docSignSheetHtml(pg, foot){
  var W = [64, 78, 70, 226, 62, 62, 38, 126];
  var h = '<div class="dss"><div class="dss-t1">' + esc(pg.t1) + '</div><div class="dss-t2">' + esc(pg.t2) + '</div><div class="dss-t3">' + esc(pg.t3) + '</div>' +
    '<table class="dss-t"><colgroup>' + W.map(function(w){ return '<col style="width:' + w + 'px">'; }).join('') + '</colgroup><thead><tr><th>วัน</th><th>วันที่</th><th>รหัส<br>เจ้าหน้าที่</th><th>ชื่อ - นามสกุล</th><th>เวลา<br>เข้างาน</th><th>เวลา<br>ออกงาน</th><th>OT</th><th>ลงลายมือชื่อ</th></tr></thead><tbody>';
  pg.rows.forEach(function(r){
    var b = r[5] ? ' style="background:' + r[5] + '"' : '';
    var dk = r[4] ? ' class="dk"' : b;
    h += '<tr><td class="c"' + b + '>' + esc(r[0]) + '</td><td class="c"' + b + '>' + esc(r[1]) + '</td><td class="c"' + dk + '>' + esc(r[2]) + '</td><td' + (r[4] ? ' class="dk nm"' : b) + '>' + esc(r[3]) + '</td>' +
      '<td' + dk + '></td><td' + dk + '></td><td' + dk + '></td><td' + dk + '></td></tr>';
  });
  return h + '</tbody></table><div class="dss-note">ช่องสีเทาทึบ = วันปิดคลินิก หรือไม่มีกรอบเวรสำหรับใบนี้ (ห้ามลงชื่อ) · ลงเวลาเข้า-ออกงานตามจริง</div>' +
    docSignHtml(pg.left, pg.right) + '<div class="dss-foot"><i>' + esc(foot || '') + '</i></div><div class="dss-pg">' + esc(pg.page) + '</div></div>';
}
/* ================= 1 ต.ค. 69 เลือกหลายตำแหน่ง (ติ๊กเลือก แยกตามกลุ่ม) ================= */
function posPickSummary(ids, sel){
  if (!sel || !sel.length || sel.length >= ids.length) return 'ทุกตำแหน่ง (' + ids.length + ')';
  var names = sel.map(posName);
  return 'เลือก ' + sel.length + ' ตำแหน่ง: ' + names.slice(0, 3).join(', ') + (names.length > 3 ? ' และอีก ' + (names.length - 3) : '');
}
/** ids = ตำแหน่งที่เลือกได้ · sel = ที่เลือกไว้ (ว่าง = ทั้งหมด) · onOk(list) list ว่าง = ทั้งหมด */
function posPickModal(title, ids, sel, okText, onOk){
  var on = {}; (sel && sel.length ? sel : ids).forEach(function(id){ on[id] = 1; });
  var groups = [], gmap = {};
  S.boot.positions.forEach(function(p){ if (ids.indexOf(p.id) < 0) return; var g = p.groupName || 'อื่น ๆ'; if (!gmap[g]) { gmap[g] = []; groups.push(g); } gmap[g].push(p); });
  var body = '<div class="d-flex gap-2 mb-2 flex-wrap"><input class="form-control form-control-sm flex-grow-1" id="ppQ" placeholder="ค้นหาตำแหน่ง / กลุ่ม" style="max-width:260px">' +
    '<button type="button" class="btn btn-sm btn-ghost" id="ppAll"><i class="bi bi-check2-all"></i> เลือกทั้งหมด</button><button type="button" class="btn btn-sm btn-ghost" id="ppNone"><i class="bi bi-x-lg"></i> ล้าง</button></div>' +
    '<div class="pp-list">' + groups.map(function(g, gi){
      return '<div class="pp-g" data-g="' + gi + '"><label class="pp-gh"><input class="form-check-input" type="checkbox" data-pg="' + gi + '"> <b>' + esc(g) + '</b> <span class="small-muted">(' + gmap[g].length + ')</span></label><div class="pp-items">' +
        gmap[g].map(function(p){ return '<label class="pp-i" data-q="' + esc((p.name + ' ' + g).toLowerCase()) + '"><input class="form-check-input" type="checkbox" data-pp="' + p.id + '" data-gi="' + gi + '"' + (on[p.id] ? ' checked' : '') + '> ' + esc(p.name) + '</label>'; }).join('') + '</div></div>';
    }).join('') + '</div><div class="small-muted mt-2" id="ppCnt"></div>';
  modal(title, body, [{ text: 'ยกเลิก', cls: 'btn-ghost' }, { text: okText || 'ตกลง', onClick: function(){
    var list = $$('[data-pp]').filter(function(c){ return c.checked; }).map(function(c){ return c.dataset.pp; });
    if (!list.length) { notify('กรุณาเลือกอย่างน้อย 1 ตำแหน่ง', 'info'); return false; }
    onOk(list.length >= ids.length ? [] : list);
  } }], 'lg');
  var sync = function(){
    groups.forEach(function(g, gi){ var cs = $$('[data-gi="' + gi + '"]'), n = cs.filter(function(c){ return c.checked; }).length, h = document.querySelector('[data-pg="' + gi + '"]'); h.checked = n === cs.length; h.indeterminate = n > 0 && n < cs.length; });
    var n2 = $$('[data-pp]').filter(function(c){ return c.checked; }).length; $('ppCnt').textContent = 'เลือกแล้ว ' + n2 + ' จาก ' + ids.length + ' ตำแหน่ง';
  };
  setTimeout(function(){
    $$('[data-pp]').forEach(function(c){ c.onchange = sync; });
    $$('[data-pg]').forEach(function(h){ h.onchange = function(){ $$('[data-gi="' + h.dataset.pg + '"]').forEach(function(c){ if (c.closest('.pp-i').style.display !== 'none') c.checked = h.checked; }); sync(); }; });
    $('ppAll').onclick = function(){ $$('[data-pp]').forEach(function(c){ if (c.closest('.pp-i').style.display !== 'none') c.checked = true; }); sync(); };
    $('ppNone').onclick = function(){ $$('[data-pp]').forEach(function(c){ if (c.closest('.pp-i').style.display !== 'none') c.checked = false; }); sync(); };
    $('ppQ').oninput = function(){ var q = this.value.trim().toLowerCase(); $$('.pp-i').forEach(function(l){ l.style.display = !q || l.dataset.q.indexOf(q) >= 0 ? '' : 'none'; }); $$('.pp-g').forEach(function(g){ g.style.display = $$('.pp-i', g).some(function(l){ return l.style.display !== 'none'; }) ? '' : 'none'; }); };
    sync();
  }, 30);
}
/** 1 ต.ค. 69 สำเนาตรวจทานใบลงชื่อ (ข้อมูลในระบบ) 1 ใบ = 1 หน้า A4 แนวตั้ง · หัวกระดาษเดียวกันทุกหน้า · ช่อง ✓ ไว้ติ๊กด้วยปากกา
 *  pg: {form, clinic, month, posName, k, n, unit, rows:[{dow, date, code, name, unit, tin, tout, ot, scan, bg, closed, dup}]} · m: {ref, printedAt, printedBy} */
function docReviewSheetHtml(pg, m){
  var W = pg.unit ? [34, 64, 64, 190, 74, 52, 52, 34, 104, 28] : [36, 70, 68, 238, 56, 56, 36, 110, 30];
  var tw = W.reduce(function(a, b){ return a + b; }, 0);
  var h = '<div class="drv" style="width:' + tw + 'px"><div class="drv-top"><span>สำเนาตรวจทาน (ข้อมูลในระบบ) · ใช้เทียบกับใบลงชื่อจริง ไม่ใช้แทนใบลงชื่อ</span><span>เลขอ้างอิง ' + esc(m.ref) + ' · พิมพ์ ' + esc(m.printedAt) + '</span></div>' +
    '<div class="drv-hd"><span class="drv-form">' + esc(pg.form) + '</span><span class="drv-no">ใบที่ <b>' + pg.k + '</b> / ' + pg.n + '</span></div>' +
    '<div class="dss-t1">แบบบันทึกเวลาการปฏิบัติงาน (' + esc(pg.clinic) + ')</div>' +
    '<div class="dss-t2">ประจำเดือน ' + esc(pg.month) + '   ตำแหน่ง ' + esc(pg.posName) + '   ใบที่ ' + pg.k + '</div>' +
    '<table class="dss-t drv-t" style="width:' + tw + 'px"><colgroup>' + W.map(function(w){ return '<col style="width:' + w + 'px">'; }).join('') + '</colgroup><thead><tr><th>วัน</th><th>วันที่</th><th>รหัส</th><th>ชื่อ - นามสกุล</th>' + (pg.unit ? '<th>จุด<br>ปฏิบัติงาน</th>' : '') + '<th>เข้า</th><th>ออก</th><th>OT</th><th>ตรวจสแกน</th><th>✓</th></tr></thead><tbody>';
  pg.rows.forEach(function(r){
    var b = r.bg ? ' style="background:' + r.bg + '"' : '';
    h += '<tr' + (r.dup ? ' class="dup"' : '') + '><td class="c"' + b + '>' + esc(r.dow) + '</td><td class="c"' + b + '>' + esc(r.date) + '</td><td class="c">' + esc(r.code || '') + '</td><td class="nm">' + (r.closed ? '<span class="drv-cl">— ปิดคลินิก —</span>' : esc(r.name || '')) + (r.dup ? ' <b class="drv-dup">(เลขใบซ้ำ)</b>' : '') + '</td>' +
      (pg.unit ? '<td class="c sm">' + esc(r.unit || '') + '</td>' : '') + '<td class="c">' + esc(r.tin || '') + '</td><td class="c">' + esc(r.tout || '') + '</td><td class="c">' + esc(r.ot || '') + '</td><td class="sm">' + esc(r.scan || '') + '</td><td></td></tr>';
  });
  return h + '</tbody></table><div class="dss-note">ช่อง ✓ = ผู้ตรวจทานติ๊กเมื่อตรงกับใบลงชื่อจริง · แถวที่ไม่ตรงให้แก้ในระบบ (หน้า บันทึกเวลาปฏิบัติงาน → ดูเป็นใบ)</div>' +
    '<div class="drv-foot"><span>พิมพ์โดย ' + esc(m.printedBy) + '</span><span>' + esc(pg.posName) + ' · ใบที่ ' + pg.k + ' / ' + pg.n + '</span></div></div>';
}
/** 1 ต.ค. 69 ตารางเวรสำหรับแจกหน่วยงาน (A4 แนวนอน แบบ Google Sheet) 1 ตำแหน่ง = 1 หน้า */
function docRosterHtml(r, p, i, n){
  var nD = r.dates.length, wNo = 28, wName = 168, wHr = 104, wDay = 23, wTot = 34;
  var tw = wNo + wName + wHr + wDay * nD + wTot;
  var bg = function(x){ return x.bg ? ' style="background:' + x.bg + '"' : ''; };
  var rowH = Math.max(20, Math.min(30, Math.floor((730 * Math.max(1, tw / 1062) - 250) / Math.max(1, p.rows.length + 3))));
  var h = '<div class="dt drs" style="width:' + tw + 'px"><div class="dt-h1">ตารางเวรปฏิบัติงาน ' + esc(p.clinic) + '</div>' +
    '<div class="dt-h2">ตำแหน่ง ' + esc(p.name) + '   ประจำเดือน ' + esc(r.month) + '</div><div class="dt-h3">' + esc(r.org) + '</div>' +
    (r.demo ? '<div class="dt-mark">ข้อมูลทดลอง</div>' : p.draft ? '<div class="dt-mark">ฉบับร่าง – ตารางเวรยังไม่ได้รับอนุมัติครบ' + (p.pending ? ' (เครื่องหมาย * = รออนุมัติ ' + p.pending + ' เวร)' : '') + '</div>' : '<div class="dt-gap"></div>') +
    '<table class="dt-t"><colgroup><col style="width:' + wNo + 'px"><col style="width:' + wName + 'px"><col style="width:' + wHr + 'px">' + r.dates.map(function(){ return '<col style="width:' + wDay + 'px">'; }).join('') + '<col style="width:' + wTot + 'px"></colgroup>' +
    '<thead><tr><th rowspan="2">ที่</th><th rowspan="2">ชื่อ - นามสกุล</th><th rowspan="2">ตำแหน่ง</th>' + r.dates.map(function(x){ return '<th class="dn"' + bg(x) + '>' + x.d + '</th>'; }).join('') + '<th rowspan="2">รวม<br>(เวร)</th></tr><tr>' +
    r.dates.map(function(x){ return '<th class="dw"' + bg(x) + '>' + esc(x.dow) + '</th>'; }).join('') + '</tr></thead><tbody>';
  p.rows.forEach(function(x, j){
    h += '<tr style="height:' + rowH + 'px"><td class="c">' + (j + 1) + '</td><td class="nm">' + esc(x.name) + '</td><td class="ps">' + esc(x.hr) + '</td>' +
      x.days.map(function(v, k){ var cl = r.dates[k].closed; return '<td class="d' + (cl ? ' cl' : '') + '"' + bg(r.dates[k]) + '>' + esc(v) + '</td>'; }).join('') + '<td class="t">' + x.n + '</td></tr>';
  });
  var tot = p.rows.reduce(function(a, x){ return a + x.n; }, 0);
  h += '<tr class="sum"><td colspan="3" class="c">ลงเวรแล้ว (คน)</td>' + p.count.map(function(v, k){ var q = p.quota[k], over = q > 0 && v > q, lack = q > 0 && v < q; return '<td class="c' + (over ? ' over' : lack ? ' lack' : '') + '">' + (v || (r.dates[k].closed ? '' : '0')) + '</td>'; }).join('') + '<td class="t">' + tot + '</td></tr>' +
    '<tr class="sum q"><td colspan="3" class="c">กรอบต่อวัน (คน)</td>' + p.quota.map(function(q, k){ return '<td class="c">' + (r.dates[k].closed ? '' : q || '-') + '</td>'; }).join('') + '<td></td></tr></tbody></table>' +
    '<div class="dt-leg">ตัวย่อเวร: ' + esc(r.labels) + ' · * = รออนุมัติ · ช่องสีตามประเภทวัน (เสาร์-อาทิตย์ / วันหยุด) · ตัวเลขสีแดง = เกินกรอบ ตัวเลขเอียง = ยังไม่ครบกรอบ</div>' +
    '<div class="drs-note"><b>หมายเหตุ</b> ตารางนี้เป็นตารางเวรตามที่ลงไว้ในระบบ ณ วันที่พิมพ์ ใช้เพื่อแจ้งให้ทราบเท่านั้น ไม่ใช่เอกสารบันทึกเวลาปฏิบัติงานหรือเอกสารประกอบการเบิกจ่าย · หากมีการแลกเวร ขอเปลี่ยนแปลง หรือยกเลิกเวร กรุณาติดต่อเจ้าหน้าที่ประสานงานคลินิก</div>' +
    '<div class="dt-foot"><i>' + esc(r.foot) + '</i><span>หน้า ' + i + ' / ' + n + '</span></div></div>';
  return h;
}
function printRosterDoc(r){ return printDoc({ orient: 'landscape', title: r.title, pages: r.pages.map(function(p, i){ return docRosterHtml(r, p, i + 1, r.pages.length); }) }); }
function printTablesDoc(r){ return printDoc({ orient: 'landscape', title: r.title, pages: r.pages.map(function(m, i){ return docTableHtml(m, r.foot, i + 1, r.pages.length); }) }); }
function printSignDoc(r){ return printDoc({ orient: 'portrait', title: r.title, pages: r.pages.map(function(pg){ return docSignSheetHtml(pg, r.foot); }) }); }

/* ================= 29 ก.ย. 69 สร้างไฟล์ Excel (.xlsx) และ ZIP ในเครื่อง (ไม่ต้องใช้ไลบรารีภายนอก) ================= */
var CRC_T = null;
function crc32(u8){ if (!CRC_T) { CRC_T = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRC_T[n] = c >>> 0; } } var x = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) x = CRC_T[(x ^ u8[i]) & 255] ^ (x >>> 8); return (x ^ 0xFFFFFFFF) >>> 0; }
/** files: [{name, data: Uint8Array|string}] → Blob (ZIP แบบไม่บีบอัด) */
function zipBlob(files, type){
  var enc = new TextEncoder(), parts = [], cen = [], off = 0;
  var d = new Date(), dt = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xFFFF, dd = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
  files.forEach(function(f){
    var nm = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, crc = crc32(data);
    var h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint16(10, dt, true); h.setUint16(12, dd, true);
    h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, nm.length, true); h.setUint16(28, 0, true);
    parts.push(new Uint8Array(h.buffer), nm, data);
    var c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true); c.setUint16(12, dt, true); c.setUint16(14, dd, true);
    c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, nm.length, true); c.setUint32(42, off, true);
    cen.push(new Uint8Array(c.buffer), nm);
    off += 30 + nm.length + data.length;
  });
  var csize = cen.reduce(function(a, x){ return a + x.length; }, 0);
  var e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, csize, true); e.setUint32(16, off, true);
  return new Blob(parts.concat(cen).concat([new Uint8Array(e.buffer)]), { type: type || 'application/zip' });
}
function xmlEsc(v){ return String(v).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function colName(i){ var s = ''; i++; while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
/** sheets: [{name, rows:[[...]]}] แถวแรก = หัวตาราง (ตัวหนา พื้นเทา) · ทุกช่องมีเส้นขอบ · ฟอนต์ Tahoma 10 */
function xlsxBlob(sheets){
  var sheetXml = function(sh){
    var widths = [];
    sh.rows.forEach(function(r){ r.forEach(function(v, i){ var l = String(v == null ? '' : v).length; widths[i] = Math.max(widths[i] || 8, Math.min(40, l + 2)); }); });
    var x = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols>' +
      widths.map(function(w, i){ return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + (w * 1.4).toFixed(1) + '" customWidth="1"/>'; }).join('') + '</cols><sheetData>';
    sh.rows.forEach(function(r, ri){
      x += '<row r="' + (ri + 1) + '">' + r.map(function(v, ci){
        var ref = colName(ci) + (ri + 1), st = ri === 0 ? 1 : 2;
        if (typeof v === 'number' && isFinite(v)) return '<c r="' + ref + '" s="' + st + '"><v>' + v + '</v></c>';
        return '<c r="' + ref + '" s="' + st + '" t="inlineStr"><is><t xml:space="preserve">' + xmlEsc(v == null ? '' : v) + '</t></is></c>';
      }).join('') + '</row>';
    });
    return x + '</sheetData></worksheet>';
  };
  var names = sheets.map(function(s, i){ return xmlEsc(String(s.name || ('Sheet' + (i + 1))).replace(/[\[\]\*\?\/\\:]/g, ' ').slice(0, 31)); });
  var files = [
    { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      sheets.map(function(s, i){ return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join('') + '</Types>' },
    { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
    { name: 'xl/workbook.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
      names.map(function(n, i){ return '<sheet name="' + n + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'; }).join('') + '</sheets></workbook>' },
    { name: 'xl/_rels/workbook.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      sheets.map(function(s, i){ return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join('') +
      '<Relationship Id="rId' + (sheets.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
    { name: 'xl/styles.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="10"/><name val="Tahoma"/></font><font><b/><sz val="10"/><name val="Tahoma"/></font></fonts>' +
      '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF2F2F2"/><bgColor indexed="64"/></patternFill></fill></fills>' +
      '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color auto="1"/></left><right style="thin"><color auto="1"/></right><top style="thin"><color auto="1"/></top><bottom style="thin"><color auto="1"/></bottom><diagonal/></border></borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/></cellXfs></styleSheet>' }
  ];
  sheets.forEach(function(sh, i){ files.push({ name: 'xl/worksheets/sheet' + (i + 1) + '.xml', data: sheetXml(sh) }); });
  return zipBlob(files, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
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

