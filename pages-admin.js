/* ================= ปฏิทิน กรอบเวร และช่วงเวลา ================= */
PAGES.calendar = function(){
  mount(pageHead('การตั้งค่า', 'ปฏิทิน กรอบเวร และช่วงเวลา', 'กำหนดวันหยุดนักขัตฤกษ์ วันปิดคลินิก กรอบอัตรากำลังรายวัน ช่วงเวลาลงตารางเวร และช่วงเวลาส่งตรวจสอบ (วันเสาร์–อาทิตย์เป็นวันหยุดโดยอัตโนมัติ)') +
    '<div class="filters">' + ymSelect('caYm', S.caYm || addYm(S.boot.ym, 1), 2, 3) + '</div><div id="caBody">' + skeleton(8) + '</div>');
  $('caYm').onchange = function(){ S.caYm = this.value; loadCal(); };
  loadCal();
};
function loadCal(){
  S.caYm = $('caYm').value;
  Promise.all([api('getCalendar', { ym: S.caYm }), api('getSubmitWindow', { ym: S.caYm })]).then(function(r){ S._sw = r[1]; renderCal(r[0]); }).catch(function(){});
}
function renderCal(d){
  S._ca = d;
  var D = S.boot.dayTypes, w = d.window || {}, sw = S._sw || {};
  var h = '<div class="row g-3 mb-3"><div class="col-xl-4 col-lg-6"><div class="card h-100"><div class="card-h"><h3><i class="bi bi-door-open text-danger"></i> ช่วงเวลาลงตารางเวร ' + esc(d.thMonth) + '</h3></div><div class="card-b d-flex flex-wrap gap-2 align-items-end">' +
    '<div><label class="form-label" for="bwFrom">เปิดลงเวร</label><input class="form-control" type="datetime-local" id="bwFrom" value="' + esc(w.openFrom || '') + '"></div>' +
    '<div><label class="form-label" for="bwTo">ปิดลงเวร</label><input class="form-control" type="datetime-local" id="bwTo" value="' + esc(w.openTo || '') + '"></div>' +
    '<button class="btn btn-brand" onclick="saveBw(this)">บันทึก</button></div></div></div>';
  h += '<div class="col-xl-4 col-lg-6"><div class="card h-100"><div class="card-h"><h3><i class="bi bi-send-check text-danger"></i> ช่วงเวลาส่งตรวจสอบ</h3><span class="sub">ใช้กับทุกเดือน</span></div><div class="card-b">' +
    '<div class="form-check"><input class="form-check-input" type="radio" name="swMode" id="swWin" value="window"' + (sw.mode !== 'always' ? ' checked' : '') + '><label class="form-check-label" for="swWin">กำหนดช่วงวันที่ของเดือนถัดไป</label></div>' +
    '<div class="d-flex gap-2 align-items-center ms-4 my-2"><span class="small">วันที่</span><input class="form-control form-control-sm" type="number" min="1" max="28" id="swFrom" value="' + (sw.fromDay || 1) + '" style="width:70px"><span class="small">ถึงวันที่</span><input class="form-control form-control-sm" type="number" min="1" max="28" id="swTo" value="' + (sw.toDay || 4) + '" style="width:70px"></div>' +
    '<div class="form-check"><input class="form-check-input" type="radio" name="swMode" id="swAll" value="always"' + (sw.mode === 'always' ? ' checked' : '') + '><label class="form-check-label" for="swAll">ไม่กำหนดช่วง (ส่งตรวจสอบได้ทุกเวลา แม้ยังไม่สิ้นเดือน)</label></div>' +
    '<div class="small-muted mt-2">รายการที่ถูกส่งกลับแก้ไข ส่งตรวจสอบใหม่ได้ทุกเวลา · เดือนทดลองส่งได้ทุกเวลา</div><button class="btn btn-brand btn-sm mt-2" onclick="saveSw(this)">บันทึก</button></div></div></div>';
  h += '<div class="col-xl-4"><div class="card h-100"><div class="card-h"><h3><i class="bi bi-box-arrow-in-down text-danger"></i> นำเข้าตารางเวรจากไฟล์เดิม</h3></div><div class="card-b">' +
    '<input class="form-control mb-2" id="imUrl" placeholder="วางลิงก์ไฟล์ Google Sheet ตารางเวร">' +
    '<button class="btn btn-soft" onclick="importSched(this)">นำเข้าเป็นตารางเวรเดือน ' + esc(d.thMonth) + '</button>' +
    '<div class="small-muted mt-2">รายการเดิมของตำแหน่งที่อยู่ในไฟล์จะถูกแทนที่ · ช→ช1, บ→บ1 · อักษรต่อท้าย (V/S, En) เก็บเป็นหมายเหตุ</div></div></div></div></div>';
  // v1.3.1 กำหนดกรอบเวรรายตำแหน่งทั้งเดือน (ไม่ต้องแก้ทีละวัน) — ยังแก้รายวันได้ในตารางด้านล่างเหมือนเดิม
  S.caMode = S.caMode || 'pos';
  h += '<div class="d-flex flex-wrap gap-2 align-items-center mb-2"><div class="seg" id="caMode"><button type="button" data-v="pos"' + (S.caMode === 'pos' ? ' class="on"' : '') + '><i class="bi bi-person-lines-fill"></i> กำหนดรายตำแหน่ง (ทั้งเดือน)</button><button type="button" data-v="day"' + (S.caMode === 'day' ? ' class="on"' : '') + '><i class="bi bi-calendar3"></i> กำหนดรายวัน / ประเภทวัน</button></div></div>';
  h += '<div id="caPosBox"' + (S.caMode === 'pos' ? '' : ' hidden') + '>' + caPosHtml(d) + '</div><div id="caDayBox"' + (S.caMode === 'day' ? '' : ' hidden') + '>';
  h += '<div class="d-flex flex-wrap gap-3 align-items-center mb-2">' + dayLegend() + '<span class="small-muted">เลือกประเภทวันแล้วกด "บันทึกปฏิทิน" · วันหยุดชดเชยคำนวณเหมือนวันหยุด แต่แสดงสีต่างกัน</span></div>';
  h += '<div class="card"><div class="card-h"><h3>วันและกรอบเวร</h3><span class="sub">จำนวนบุคลากรสูงสุดต่อช่วงเวรของแต่ละตำแหน่ง (ค่าตั้งต้นตามประกาศ)</span><div class="ms-auto d-flex gap-2"><input class="form-control form-control-sm" id="caQ" placeholder="กรองตำแหน่ง" style="width:160px"><button class="btn btn-sm btn-ghost" onclick="saveCal(this)"><i class="bi bi-calendar-check"></i> บันทึกปฏิทิน</button><button class="btn btn-sm btn-brand" onclick="saveQuota(this)"><i class="bi bi-save"></i> บันทึกกรอบเวร</button></div></div>' +
    '<div class="tbl border-0 shadow-none" style="max-height:65vh;border-radius:0 0 16px 16px"><table class="table"><thead><tr><th class="sticky-l">วันที่</th><th>ประเภทวัน</th><th>หมายเหตุ</th>' +
    d.positions.map(function(p){ return '<th class="text-center qcol" data-pn="' + esc(p.name.toLowerCase()) + '" style="min-width:74px;white-space:normal;font-size:11.5px">' + esc(p.name) + '</th>'; }).join('') + '</tr></thead><tbody>';
  d.days.forEach(function(x){
    var types = [[D.WORKDAY, 'วันทำการ'], [D.HOLIDAY, x.dow === 0 || x.dow === 6 ? 'วันหยุด (เสาร์-อาทิตย์)' : 'วันหยุดนักขัตฤกษ์'], [S.boot.dayTypeComp || 'วันหยุดชดเชย', 'วันหยุดชดเชย'], [D.CLOSED, 'ปิดคลินิก']];
    h += '<tr class="cal-row ' + dk(x.color) + '"><td class="text-nowrap fw-semibold sticky-l ' + dk(x.color) + '">' + TH_D[x.dow] + ' ' + thDate(x.date) + '</td>' +
      '<td><select class="form-select form-select-sm day-type-sel" data-cd="' + x.date + '" data-dow="' + x.dow + '" style="min-width:200px">' + types.map(function(t){ return '<option value="' + esc(t[0]) + '"' + (t[0] === (x.rawType || x.dayType) ? ' selected' : '') + '>' + t[1] + '</option>'; }).join('') + '</select></td>' +
      '<td><input class="form-control form-control-sm" data-cn="' + x.date + '" value="' + esc(x.note) + '" placeholder="เช่น วันปิยมหาราช" style="min-width:150px"></td>' +
      d.positions.map(function(p){ return '<td class="qcol" data-pn="' + esc(p.name.toLowerCase()) + '"><input class="form-control form-control-sm text-center tnum" data-q="' + x.date + '|' + p.id + '" value="' + x.quotas[p.id] + '" style="width:58px"></td>'; }).join('') + '</tr>';
  });
  $('caBody').innerHTML = h + '</tbody></table></div></div><div class="small-muted mt-2">กรอบตั้งต้นของแต่ละตำแหน่งแก้ไขได้ที่หน้า "ตำแหน่งและอัตราค่าตอบแทน" · กรอบในตารางนี้ใช้เฉพาะวันนั้น</div></div>';
  $$('#caMode button').forEach(function(b){ b.onclick = function(){ $$('#caMode button').forEach(function(x){ x.classList.remove('on'); }); b.classList.add('on'); S.caMode = b.dataset.v; $('caPosBox').hidden = S.caMode !== 'pos'; $('caDayBox').hidden = S.caMode !== 'day'; }; });
  $$('.cp-in').forEach(function(i){ i.oninput = function(){ i.closest('tr').classList.toggle('cp-dirty', $$('input', i.closest('tr')).some(function(x){ return x.value !== x.dataset.o; })); cpCount(); }; });
  if ($('cpQ')) $('cpQ').oninput = function(){ var q = this.value.trim().toLowerCase(); $$('#cpTbl tbody tr').forEach(function(tr){ tr.hidden = q && tr.dataset.pn.indexOf(q) < 0; }); };
  $$('.day-type-sel').forEach(function(sel){ sel.onchange = function(){
    var tr = sel.closest('tr'), v = sel.value, dw = +sel.dataset.dow, C = S.boot.dayTypes;
    var k = v === C.CLOSED ? 'CLOSED' : v === (S.boot.dayTypeComp || 'วันหยุดชดเชย') ? 'COMP' : v === C.HOLIDAY ? ((dw === 0 || dw === 6) && !tr.querySelector('[data-cn]').value ? 'WEEKEND' : 'PUBHOL') : 'WORK';
    tr.className = 'cal-row ' + dk(k); tr.firstChild.className = 'text-nowrap fw-semibold sticky-l ' + dk(k);
  }; });
  $('caQ').oninput = function(){ var q = this.value.trim().toLowerCase(); $$('.qcol').forEach(function(c){ c.style.display = !q || c.dataset.pn.indexOf(q) >= 0 ? '' : 'none'; }); };
}
/** กลุ่มวัน: วันทำการ / วันหยุด (เสาร์-อาทิตย์ นักขัตฤกษ์ ชดเชย) · วันปิดคลินิกไม่นับ */
function caKind(x){ var C = S.boot.dayTypes; var t = x.dayType; return t === C.CLOSED ? '' : t === C.WORKDAY ? 'W' : 'H'; }
function caMode2(arr){ var c = {}, best = '', n = -1; arr.forEach(function(v){ c[v] = (c[v] || 0) + 1; }); Object.keys(c).forEach(function(k){ if (c[k] > n) { n = c[k]; best = k; } }); return { v: best, mixed: Object.keys(c).length > 1 }; }
function caPosHtml(d){
  var nW = d.days.filter(function(x){ return caKind(x) === 'W'; }).length, nH = d.days.filter(function(x){ return caKind(x) === 'H'; }).length;
  var rows = d.positions.map(function(p){
    var w = caMode2(d.days.filter(function(x){ return caKind(x) === 'W'; }).map(function(x){ return String(x.quotas[p.id]); }));
    var hh = caMode2(d.days.filter(function(x){ return caKind(x) === 'H'; }).map(function(x){ return String(x.quotas[p.id]); }));
    return '<tr data-pid="' + p.id + '" data-pn="' + esc(p.name.toLowerCase()) + '"><td><b>' + esc(p.name) + '</b><div class="small-muted">' + esc(p.groupName || '') + ' · ตั้งต้น ' + p.defaultQuota + '</div></td>' +
      '<td><input class="form-control form-control-sm text-center tnum cp-in" type="number" min="0" max="99" data-k="W" data-o="' + esc(w.v) + '" value="' + esc(w.v) + '"></td><td class="small-muted">' + (w.mixed ? '<span class="pill p-warn nodot">บางวันต่างกัน</span>' : '') + '</td>' +
      '<td><input class="form-control form-control-sm text-center tnum cp-in" type="number" min="0" max="99" data-k="H" data-o="' + esc(hh.v) + '" value="' + esc(hh.v) + '"></td><td class="small-muted">' + (hh.mixed ? '<span class="pill p-warn nodot">บางวันต่างกัน</span>' : '') + '</td></tr>';
  }).join('');
  return '<div class="card mb-3"><div class="card-h"><h3><i class="bi bi-sliders"></i> กรอบเวรรายตำแหน่ง · ' + esc(d.thMonth) + '</h3><span class="sub">ใส่ตัวเลขครั้งเดียว ระบบนำไปใช้ทุกวันของเดือนตามประเภทวัน (วันทำการ ' + nW + ' วัน · วันหยุด ' + nH + ' วัน · ข้ามวันปิดคลินิก)</span>' +
    '<div class="ms-auto d-flex gap-2 align-items-center"><input class="form-control form-control-sm" id="cpQ" placeholder="กรองตำแหน่ง" style="width:160px"><button class="btn btn-sm btn-brand" id="cpSave" onclick="saveQuotaPos(this)"><i class="bi bi-magic"></i> นำไปใช้ทั้งเดือน</button></div></div>' +
    '<div class="tbl border-0 shadow-none" style="max-height:62vh;border-radius:0 0 16px 16px"><table class="table align-middle" id="cpTbl"><thead><tr><th>ตำแหน่ง</th><th class="text-center" style="width:120px">วันทำการ<br><small class="fw-normal">(จ.–ศ.)</small></th><th style="width:110px"></th><th class="text-center" style="width:120px">วันหยุด<br><small class="fw-normal">(ส.–อา. นักขัตฤกษ์ ชดเชย)</small></th><th style="width:110px"></th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '<div class="card-b pt-2 small-muted"><i class="bi bi-info-circle"></i> แถวที่แก้ไขจะมีแถบสีด้านซ้าย · กด "นำไปใช้ทั้งเดือน" แล้วระบบจะตั้งกรอบให้ทุกวันของตำแหน่งนั้นตามประเภทวัน · ต้องการปรับเฉพาะบางวัน ให้ไปที่ "กำหนดรายวัน" <span id="cpCnt"></span></div></div>';
}
function cpCount(){ var n = $$('#cpTbl tr.cp-dirty').length; if ($('cpCnt')) $('cpCnt').innerHTML = n ? ' · <b class="text-danger">แก้ไขแล้ว ' + n + ' ตำแหน่ง</b>' : ''; }
function saveQuotaPos(b){
  var d = S._ca, entries = [], names = [];
  $$('#cpTbl tr.cp-dirty').forEach(function(tr){
    var pid = tr.dataset.pid, v = {}; $$('.cp-in', tr).forEach(function(i){ v[i.dataset.k] = i.value; });
    names.push(posName(pid));
    d.days.forEach(function(x){ var k = caKind(x); if (!k || v[k] === '' || v[k] === undefined) return; if (String(x.quotas[pid]) !== String(+v[k])) entries.push({ date: x.date, positionId: pid, quota: +v[k] }); });
  });
  if (!names.length) return notify('ยังไม่ได้แก้ไขตัวเลขของตำแหน่งใด', 'info');
  if (!entries.length) return notify('กรอบเวรตรงกับค่าเดิมอยู่แล้ว', 'info');
  confirmBox('นำกรอบเวรไปใช้ทั้งเดือน', names.length + ' ตำแหน่ง: ' + names.slice(0, 6).join(', ') + (names.length > 6 ? ' ฯลฯ' : '') + '\nเดือน ' + d.thMonth + ' · ปรับทั้งหมด ' + entries.length + ' ช่อง (วัน×ตำแหน่ง)', 'นำไปใช้').then(function(ok){
    if (ok) api('saveQuotas', { ym: S.caYm, entries: entries, mode: 'กำหนดรายตำแหน่งทั้งเดือน ' + names.length + ' ตำแหน่ง' }, { btn: b }).then(function(r){ notify('ตั้งกรอบเวรทั้งเดือนเรียบร้อย ' + names.length + ' ตำแหน่ง'); renderCal(r); }).catch(function(){});
  });
}
function saveBw(b){ api('saveBookingWindow', { ym: S.caYm, openFrom: $('bwFrom').value, openTo: $('bwTo').value }, { btn: b }).then(function(){ notify('บันทึกช่วงเวลาลงตารางเวรเรียบร้อย'); }).catch(function(){}); }
function saveSw(b){
  var mode = $('swAll').checked ? 'always' : 'window';
  api('saveSubmitWindow', { mode: mode, fromDay: $('swFrom').value, toDay: $('swTo').value }, { btn: b }).then(function(r){ S._sw = r; notify('บันทึกช่วงเวลาส่งตรวจสอบเรียบร้อย'); }).catch(function(){});
}
function saveCal(b){
  var days = S._ca.days.map(function(x){ return { date: x.date, dayType: document.querySelector('[data-cd="' + x.date + '"]').value, note: document.querySelector('[data-cn="' + x.date + '"]').value }; });
  api('saveCalendar', { ym: S.caYm, days: days }, { btn: b }).then(function(d){ notify('บันทึกปฏิทินเรียบร้อย'); renderCal(d); }).catch(function(){});
}
function saveQuota(b){
  var entries = [];
  S._ca.days.forEach(function(x){ S._ca.positions.forEach(function(p){
    var v = document.querySelector('[data-q="' + x.date + '|' + p.id + '"]').value;
    if (String(v) !== String(x.quotas[p.id])) entries.push({ date: x.date, positionId: p.id, quota: v === '' ? '' : +v });
  }); });
  if (!entries.length) return notify('ไม่มีการเปลี่ยนแปลงกรอบเวร', 'info');
  api('saveQuotas', { ym: S.caYm, entries: entries }, { btn: b }).then(function(d){ notify('บันทึกกรอบเวรเรียบร้อย ' + entries.length + ' ช่อง'); renderCal(d); }).catch(function(){});
}
function importSched(){
  var url = $('imUrl').value.trim(); if (!url) return alertBox('ยังไม่ได้ระบุลิงก์', 'กรุณาวางลิงก์ไฟล์ Google Sheet ตารางเวร', 'warning');
  confirmBox('นำเข้าตารางเวร', 'นำเข้าเป็นตารางเวรเดือน ' + thYm(S.caYm) + ' (สถานะอนุมัติแล้ว)\nรายการเดิมของตำแหน่งที่อยู่ในไฟล์จะถูกแทนที่', 'นำเข้า').then(function(ok){
    if (!ok) return;
    api('importScheduleFile', { fileUrl: url, ym: S.caYm }, { block: 'กำลังอ่านไฟล์และนำเข้า…' }).then(function(r){
      var h = '<div class="text-start"><p><b>นำเข้า ' + r.rows + ' เวร</b></p><ul>' + r.report.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
      if (r.quotas.length) h += '<p class="small-muted">ปรับกรอบตั้งต้นจากไฟล์: ' + esc(r.quotas.join(', ')) + '</p>';
      if (r.unknownTabs.length) h += '<div class="alert alert-warning py-2">ชีทที่จับคู่ตำแหน่งไม่ได้: ' + esc(r.unknownTabs.join(', ')) + '<br><small>เพิ่มชื่อชีทในช่อง "ชื่อที่ใช้นำเข้า" ของตำแหน่ง แล้วนำเข้าใหม่</small></div>';
      if (r.skippedCount) h += '<div class="alert alert-secondary py-2"><b>ข้าม ' + r.skippedCount + ' ช่อง</b><br><small>' + r.skipped.map(esc).join('<br>') + '</small></div>';
      Swal.fire({ icon: 'success', title: 'นำเข้าตารางเวรเรียบร้อย', html: h + '</div>', width: 640, confirmButtonText: 'รับทราบ' });
    }).catch(function(){});
  });
}

/* ================= ช่วงเวรที่เปิดให้ลงเวร ================= */
var KINDS = [['workday', 'วันทำการ'], ['sat', 'วันเสาร์'], ['sun', 'วันอาทิตย์'], ['pubhol', 'วันหยุดนักขัตฤกษ์']];
PAGES.slots = function(){
  mount(pageHead('การตั้งค่า', 'ช่วงเวรที่เปิดให้ลงเวร', 'กำหนดว่าแต่ละตำแหน่งเปิดให้ลงเวรช่วงใดบ้างในวันทำการ วันเสาร์ วันอาทิตย์ และวันหยุดนักขัตฤกษ์ พร้อมวันที่มีผล เพื่อป้องกันการลงเวรผิดช่วง',
    '<button class="btn btn-soft" onclick="slotAdd()"><i class="bi bi-plus-lg"></i> เพิ่มกฎ</button><button class="btn btn-brand" onclick="slotSave(this)"><i class="bi bi-save"></i> บันทึกทั้งหมด</button>') +
    '<div class="tipbar"><i class="bi bi-info-circle"></i><div>ระบบใช้กฎของตำแหน่งนั้นก่อน ถ้าไม่มีจะใช้กฎ "ทุกตำแหน่ง" · เลือกกฎที่มีผลล่าสุดไม่เกินวันที่ของเวร · ต้องการเปลี่ยนตั้งแต่เดือนหน้า ให้ "เพิ่มกฎ" พร้อมวันที่มีผลใหม่ (กฎเดิมยังใช้กับเดือนก่อนหน้า)</div></div><div id="slLbl"></div><div id="slBody">' + skeleton(6) + '</div>');
  drawSlotLabels();
  api('listSlotRules').then(function(l){ S._sl = l; S._slDel = []; drawSlots(); }).catch(function(){});
};
function drawSlots(){
  var pos = [{ id: '*', name: 'ทุกตำแหน่ง (ค่าตั้งต้น)' }].concat(S.boot.positions);
  var h = '<div class="tbl"><table class="table"><thead><tr><th>ตำแหน่ง</th><th>มีผลตั้งแต่</th>' + KINDS.map(function(k){ return '<th class="text-center">' + k[1] + '</th>'; }).join('') + '<th>หมายเหตุ</th><th></th></tr></thead><tbody>';
  S._sl.forEach(function(r, i){
    h += '<tr><td style="min-width:230px"><select class="form-select form-select-sm" data-search data-sl="' + i + '" data-k="positionId">' + pos.map(function(p){ return '<option value="' + p.id + '"' + (p.id === r.positionId ? ' selected' : '') + '>' + esc(p.name) + '</option>'; }).join('') + '</select></td>' +
      '<td><input type="date" class="form-control form-control-sm" data-sl="' + i + '" data-k="effectiveFrom" value="' + esc(r.effectiveFrom) + '"></td>' +
      KINDS.map(function(k){ var v = String(r[k[0]] || '').split(','); return '<td class="text-center text-nowrap">' + ['ช1', 'ช2', 'บ1'].map(function(s){ return '<label class="slot-chk"><input type="checkbox" data-sl="' + i + '" data-kind="' + k[0] + '" value="' + s + '"' + (v.indexOf(s) >= 0 ? ' checked' : '') + '><span title="' + esc(slotL(s).name) + '">' + esc(slotL(s).s) + '</span></label>'; }).join('') + '</td>'; }).join('') +
      '<td><input class="form-control form-control-sm" data-sl="' + i + '" data-k="note" value="' + esc(r.note) + '" style="min-width:160px"></td>' +
      '<td><button class="btn btn-icon btn-sm btn-ghost" title="ลบกฎ" onclick="slotDel(' + i + ')"><i class="bi bi-trash3"></i></button></td></tr>';
  });
  if (!S._sl.length) h += '<tr><td colspan="8">' + empty('clock', lbl('ยังไม่มีกฎ ระบบใช้ค่าตั้งต้น: วันทำการ บ1 · วันหยุด ช1 ช2 บ1')) + '</td></tr>';
  $('slBody').innerHTML = h + '</tbody></table></div>';
  enhanceSelects($('slBody'));
  $$('[data-sl]').forEach(function(el){ el.onchange = function(){
    var r = S._sl[+el.dataset.sl];
    if (el.dataset.kind) { r[el.dataset.kind] = $$('[data-sl="' + el.dataset.sl + '"][data-kind="' + el.dataset.kind + '"]').filter(function(c){ return c.checked; }).map(function(c){ return c.value; }).join(','); }
    else r[el.dataset.k] = el.value;
    r._dirty = true;
  }; });
}
function drawSlotLabels(){
  var L = S.boot.slotLabels || {};
  var h = '<div class="card mb-3"><div class="card-h"><h3><i class="bi bi-tags text-danger"></i> ชื่อและตัวย่อช่วงเวร</h3><span class="sub">แสดงบนหน้าเว็บและตารางในเอกสารส่งออก เปลี่ยนได้ทุกเมื่อ (รหัสภายในระบบยังเป็น ช1/ช2/บ1)</span>' +
    '<button class="btn btn-sm btn-brand ms-auto" onclick="saveSlotLabels(this)"><i class="bi bi-save"></i> บันทึกชื่อและตัวย่อ</button></div><div class="tbl border-0 shadow-none" style="border-radius:0 0 16px 16px"><table class="table"><thead><tr><th>รหัสในระบบ</th><th>ตัวย่อ (ไทย)</th><th>ตัวย่อ (อังกฤษ)</th><th>ชื่อเต็ม (ไทย)</th><th>ชื่อเต็ม (อังกฤษ)</th></tr></thead><tbody>';
  ['ช1', 'ช2', 'บ1'].forEach(function(k){
    var l = L[k] || {};
    var inp = function(f, w, max){ return '<input class="form-control form-control-sm" data-lb="' + k + '" data-f="' + f + '" value="' + esc(l[f] || '') + '" maxlength="' + max + '" style="width:' + w + 'px">'; };
    h += '<tr><td class="tnum fw-semibold">' + k + '</td><td>' + inp('s', 70, 3) + '</td><td>' + inp('en', 70, 3) + '</td><td>' + inp('name', 230, 60) + '</td><td>' + inp('nameEn', 170, 40) + '</td></tr>';
  });
  $('slLbl').innerHTML = h + '</tbody></table></div></div>';
}
function saveSlotLabels(b){
  var o = {};
  ['ช1', 'ช2', 'บ1'].forEach(function(k){ o[k] = {}; $$('[data-lb="' + k + '"]').forEach(function(i){ o[k][i.dataset.f] = i.value.trim(); }); });
  api('saveSlotLabels', { labels: o }, { btn: b }).then(function(l){ S.boot.slotLabels = l; drawSlotLabels(); notify('บันทึกชื่อและตัวย่อช่วงเวรเรียบร้อย'); }).catch(function(){});
}
function slotAdd(){ S._sl.unshift({ positionId: '*', effectiveFrom: addYm(S.boot.ym, 1) + '-01', workday: 'บ1', sat: 'ช1', sun: 'ช1', pubhol: 'ช1', note: '', _dirty: true }); drawSlots(); }
function slotDel(i){ var r = S._sl[i]; if (r.id) S._slDel.push(r.id); S._sl.splice(i, 1); drawSlots(); }
function slotSave(b){
  var rules = S._sl.filter(function(r){ return r._dirty; });
  if (!rules.length && !S._slDel.length) return notify('ไม่มีการเปลี่ยนแปลง', 'info');
  api('saveSlotRules', { rules: rules, remove: S._slDel }, { btn: b }).then(function(l){ S._sl = l; S._slDel = []; drawSlots(); notify('บันทึกช่วงเวรที่เปิดเรียบร้อย'); }).catch(function(){});
}

/* ================= ข้อมูลบุคลากร ================= */
PAGES.employees = function(){
  var h = pageHead('การตั้งค่า', 'ข้อมูลบุคลากร', 'ข้อมูลชื่อ ตำแหน่ง ฝ่าย และหน่วยงาน ดึงจากระบบบริหารทรัพยากรบุคคลโดยอัตโนมัติทุกคืน · แถวสีแดง = พ้นสภาพ', has('COORD') ? '<button class="btn btn-ghost" onclick="syncEmp(this)"><i class="bi bi-arrow-repeat"></i> ปรับปรุงข้อมูลทุกคนทันที</button>' : '');
  if (has('COORD')) h += '<div class="card mb-3"><div class="card-b d-flex flex-wrap gap-2 align-items-end"><div class="flex-grow-1"><label class="form-label" for="emAdd">เพิ่มบุคลากร (ระบุรหัสได้หลายคน คั่นด้วยเว้นวรรค จุลภาค หรือขึ้นบรรทัดใหม่)</label><textarea class="form-control" id="emAdd" rows="1" placeholder="55XXXXX 55XXXXX"></textarea></div>' +
    '<button class="btn btn-brand" onclick="addEmp(this)"><i class="bi bi-person-plus"></i> ดึงข้อมูลและเพิ่ม</button></div></div>';
  h += '<div class="filters"><div><label class="form-label" for="emQ">ค้นหา</label><input class="form-control" id="emQ" placeholder="รหัส ชื่อ หรือตำแหน่ง"></div>' +
    '<div><label class="form-label" for="emUnit">หน่วยงาน</label><select class="form-select" data-search id="emUnit"><option value="">ทุกหน่วยงาน</option></select></div>' +
    '<div><label class="form-label" for="emDiv">ฝ่าย</label><select class="form-select" data-search id="emDiv"><option value="">ทุกฝ่าย</option></select></div>' +
    '<div><label class="form-label" for="emSort">เรียงตาม</label><select class="form-select" id="emSort"><option value="div">ฝ่าย แล้วรหัสเจ้าหน้าที่</option><option value="unit">หน่วยงาน แล้วรหัสเจ้าหน้าที่</option><option value="code">รหัสเจ้าหน้าที่</option><option value="name">ชื่อ</option></select></div>' +
    '<div><label class="form-label" for="emSt">สถานะ</label><select class="form-select" id="emSt"><option value="">ทั้งหมด</option><option value="ACTIVE" selected>ปฏิบัติงาน</option><option value="INACTIVE">พ้นสภาพ</option></select></div>' +
    '<div class="align-self-end"><div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="emAllP"' + (S.emAll ? ' checked' : '') + '><label class="form-check-label small" for="emAllP">แสดงบุคลากรทั้งหมดในระบบ (ไม่ใช่เฉพาะ SMC)</label></div></div>' +
    '<div class="ms-auto small-muted align-self-end" id="emCnt"></div></div><div id="emBody">' + skeleton(10) + '</div>';
  mount(h);
  var qt = null; $('emQ').oninput = function(){ clearTimeout(qt); qt = setTimeout(function(){ S.emShow = 100; drawEmp(); }, 150); };
  $('emAllP').onchange = function(){ S.emAll = this.checked; loadEmp(); };
  S.emShow = 100; $('emSt').onchange = drawEmp; $('emSort').onchange = drawEmp; $('emDiv').onchange = function(){ fillUnits(); drawEmp(); }; $('emUnit').onchange = drawEmp;
  loadEmp();
};
function divShort(s){ return String(s || '').replace(/^รพ\.สมเด็จฯ\s*-\s*/, ''); }
function loadEmp(){
  // 1 ต.ค. 69 โหลดครั้งเดียวแล้วจำไว้ (เปิดครั้งต่อไปขึ้นทันที) · ค้นหา/กรองในเครื่อง · แสดงทีละ 100 แถว
  apiView('listEmployees', { v2: 1, all: !!S.emAll }, function(r){
    if (!$('emBody')) return;
    var l = Array.isArray(r) ? r : r.list;
    S._em = l; S._emTotal = Array.isArray(r) ? l.length : r.total;
    var divs = {}, curDv = $('emDiv').value; l.forEach(function(e){ if (e.division) divs[e.division] = 1; });
    $('emDiv').innerHTML = '<option value="">ทุกฝ่าย</option>' + Object.keys(divs).sort().map(function(d){ return '<option value="' + esc(d) + '"' + (d === curDv ? ' selected' : '') + '>' + esc(divShort(d)) + '</option>'; }).join('');
    comboSync($('emDiv')); fillUnits(); drawEmp();
  }).catch(function(){});
}
function fillUnits(){
  var dv = $('emDiv').value, units = {};
  S._em.forEach(function(e){ if (e.orgUnit && (!dv || e.division === dv)) units[e.orgUnit] = 1; });
  var cur = $('emUnit').value;
  $('emUnit').innerHTML = '<option value="">ทุกหน่วยงาน</option>' + Object.keys(units).sort().map(function(u){ return '<option value="' + esc(u) + '"' + (u === cur ? ' selected' : '') + '>' + esc(u) + '</option>'; }).join('');
  comboSync($('emUnit'));
}
function drawEmp(){
  if (!S._em) return;
  var q = $('emQ').value.toLowerCase(), st = $('emSt').value, dv = $('emDiv').value, un = $('emUnit').value;
  var list = S._em.filter(function(e){ return (!st || e.status === st) && (!dv || e.division === dv) && (!un || e.orgUnit === un) && (!q || (e.empCode + ' ' + e.fullName + ' ' + e.hrPosition + ' ' + e.orgUnit + ' ' + e.division).toLowerCase().indexOf(q) >= 0); });
  var so = $('emSort').value, byCode = function(a, b){ return (+a.empCode || 0) - (+b.empCode || 0); }, txt = function(x, y){ if (x === y) return 0; if (!x) return 1; if (!y) return -1; return x.localeCompare(y, 'th'); };
  list.sort(so === 'code' ? byCode : so === 'name' ? function(a, b){ return txt(a.firstName || a.fullName, b.firstName || b.fullName); } : so === 'unit' ? function(a, b){ return txt(a.orgUnit, b.orgUnit) || byCode(a, b); } : function(a, b){ return txt(a.division, b.division) || byCode(a, b); });
  $('emCnt').textContent = list.length + ' คน' + (!S.emAll && S._emTotal > S._em.length ? ' (เฉพาะบุคลากร SMC จากทั้งหมด ' + S._emTotal + ' คน)' : '');
  var lim = S.emShow || 100;
  $('emBody').innerHTML = '<div class="tbl"><table class="table table-hover"><thead><tr><th>รหัส</th><th>ชื่อ-นามสกุล</th><th>ตำแหน่ง (HR)</th><th>หน่วยงาน</th><th>ฝ่าย</th><th>สถานะ</th><th>โทรศัพท์</th><th>ขึ้นเวรได้เฉพาะตำแหน่ง</th></tr></thead><tbody>' +
    (list.slice(0, lim).map(function(e){ return '<tr class="cursor ' + (e.status === 'INACTIVE' ? 'inactive' : '') + '" onclick="empModal(\'' + e.empCode + '\')"><td class="tnum">' + e.empCode + '</td><td><div class="who"><b>' + esc(e.fullName) + '</b></div></td><td>' + esc(e.hrPosition) + '</td><td class="small">' + esc(e.orgUnit) + '</td><td class="small">' + esc(divShort(e.division)) + '</td>' +
      '<td>' + (e.status === 'ACTIVE' ? '<span class="pill p-ok">ปฏิบัติงาน</span>' : '<span class="pill p-bad">พ้นสภาพ</span>') + '</td>' +
      '<td class="tnum">' + esc(e.phone) + '</td><td class="small-muted">' + (e.allowedPositions.length ? e.allowedPositions.map(posName).map(esc).join(', ') : 'ทุกตำแหน่ง') + '</td></tr>'; }).join('') || '<tr><td colspan="8">' + empty('search', 'ไม่พบบุคลากรตามเงื่อนไข') + '</td></tr>') + '</tbody></table></div>' + (list.length > lim ? '<div class="text-center mt-2"><button class="btn btn-sm btn-ghost" onclick="S.emShow=(S.emShow||100)+200;drawEmp()"><i class="bi bi-chevron-down"></i> แสดงเพิ่ม (เหลืออีก ' + (list.length - lim) + ' คน)</button></div>' : '');
}
function addEmp(b){
  api('addEmployees', { codes: $('emAdd').value }, { btn: b, btnText: 'กำลังดึงข้อมูล' }).then(function(r){
    Swal.fire({ icon: r.notFound.length ? 'warning' : 'success', title: 'เพิ่ม ' + r.added.length + ' · ปรับปรุง ' + r.updated.length + ' คน', html: r.notFound.length ? 'ไม่พบในระบบบุคลากร หรือพ้นสภาพแล้ว:<br><b>' + esc(r.notFound.join(', ')) + '</b>' : 'ดึงข้อมูลจากระบบบุคลากรเรียบร้อย', confirmButtonText: 'รับทราบ' });
    $('emAdd').value = ''; loadEmp();
  }).catch(function(){});
}
function syncEmp(b){ api('syncEmployeesNow', {}, { btn: b, btnText: 'กำลังปรับปรุงข้อมูล' }).then(function(r){ notify('ปรับปรุง ' + r.total + ' คน · เปลี่ยนแปลง ' + r.changed + ' · พ้นสภาพ ' + r.inactive); loadEmp(); }).catch(function(){}); }
function empModal(code){
  var e = S._em.filter(function(x){ return x.empCode === code; })[0];
  var canEdit = has('COORD');
  var body = '<div class="d-flex gap-3 align-items-center mb-3"><div class="avatar" style="width:48px;height:48px;font-size:20px">' + esc(initials(e.fullName)) + '</div><div><b>' + esc(e.fullName) + '</b> ' + (e.status === 'ACTIVE' ? '<span class="pill p-ok">ปฏิบัติงาน</span>' : '<span class="pill p-bad">พ้นสภาพ</span>') + '<div class="small-muted">' + e.empCode + ' · ' + esc(e.hrPosition) + ' · ' + esc(e.level) + '<br>หน่วยงาน: ' + esc(e.orgUnit || '-') + '<br>ฝ่าย: ' + esc(divShort(e.division)) + '<br>เริ่มงาน ' + esc(e.dateStart) + ' · ปรับปรุงล่าสุด ' + esc(e.lastSync || '-') + '</div></div></div>' +
    '<label class="form-label" for="epPhone">หมายเลขโทรศัพท์</label><input class="form-control mb-3" id="epPhone" value="' + esc(e.phone) + '"' + (canEdit ? '' : ' disabled') + '>' +
    '<label class="form-label">ขึ้นเวรได้เฉพาะตำแหน่ง (ไม่เลือก = ทุกตำแหน่ง)</label><input class="form-control form-control-sm mb-1" placeholder="กรองตำแหน่ง" oninput="var q=this.value.toLowerCase();$$(\'[data-apw]\').forEach(function(d){d.style.display=d.dataset.apw.indexOf(q)>=0?\'\':\'none\'})"><div class="border rounded-3 p-2 mb-3" style="max-height:220px;overflow:auto">' +
    S.boot.positions.map(function(p){ return '<div class="form-check" data-apw="' + esc(p.name.toLowerCase()) + '"><input class="form-check-input" type="checkbox" data-ap="' + p.id + '" id="ap' + p.id + '"' + (e.allowedPositions.indexOf(p.id) >= 0 ? ' checked' : '') + (canEdit ? '' : ' disabled') + '><label class="form-check-label" for="ap' + p.id + '">' + esc(p.name) + '</label></div>'; }).join('') + '</div>' +
    '<label class="form-label" for="epNote">หมายเหตุ</label><input class="form-control" id="epNote" value="' + esc(e.note) + '"' + (canEdit ? '' : ' disabled') + '>';
  var btns = [{ text: 'ปิด', cls: 'btn-ghost' }];
  if (has('ADMIN')) btns.unshift({ text: '<i class="bi bi-key"></i> รีเซ็ตรหัสผ่าน', cls: 'btn-danger-soft', onClick: function(b){ confirmBox('รีเซ็ตรหัสผ่าน', 'รหัสผ่านของ ' + e.fullName + ' จะกลับเป็นรหัสเจ้าหน้าที่ และต้องกำหนดใหม่เมื่อเข้าใช้งานครั้งถัดไป', 'รีเซ็ต', true).then(function(ok){ if (ok) api('resetPassword', { empCode: code }, { btn: b }).then(function(){ notify('รีเซ็ตรหัสผ่านเรียบร้อย (รหัสผ่านใหม่ = รหัสเจ้าหน้าที่)'); }).catch(function(){}); }); return false; } });
  if (canEdit) btns.push({ text: 'บันทึก', onClick: function(){
    var ap = []; $$('[data-ap]').forEach(function(c){ if (c.checked) ap.push(c.dataset.ap); });
    api('updateEmployee', { empCode: code, phone: $('epPhone').value, allowedPositions: ap, note: $('epNote').value }).then(function(){ notify('บันทึกข้อมูลบุคลากรเรียบร้อย'); loadEmp(); }).catch(function(){});
  } });
  modal('ข้อมูลบุคลากร', body, btns);
}

/* ================= ผู้ใช้งานและสิทธิ์ ================= */
PAGES.users = function(){
  mount(pageHead('การตั้งค่า', 'ผู้ใช้งานและสิทธิ์', 'บุคลากรทุกคนเข้าใช้งานได้โดยอัตโนมัติในบทบาทเจ้าหน้าที่ · กำหนดบทบาทเพิ่มเติมและกลุ่มตำแหน่งที่รับผิดชอบได้ที่หน้านี้') +
    '<div class="filters"><div><label class="form-label" for="usCode">กำหนดสิทธิ์ (รหัสเจ้าหน้าที่)</label><div class="input-group"><input class="form-control" id="usCode" placeholder="55XXXXX"><button class="btn btn-brand" onclick="userModal($(\'usCode\').value.trim())"><i class="bi bi-shield-plus"></i> กำหนดสิทธิ์</button></div></div>' +
    '<div><label class="form-label" for="usQ">ค้นหา</label><input class="form-control" id="usQ" placeholder="ชื่อ รหัส ฝ่าย หน่วยงาน"></div>' +
    '<div><label class="form-label" for="usRole">บทบาท</label><select class="form-select" id="usRole"><option value="">ทุกบทบาท</option>' + ['ENTRY', 'REVIEWER', 'COORD', 'MANAGER', 'ADMIN'].map(function(r){ return '<option value="' + r + '">' + esc(S.boot.roles[r]) + '</option>'; }).join('') + '</select></div>' +
    '<div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="usAll"><label class="form-check-label" for="usAll">แสดงผู้ใช้งานทั้งหมด</label></div></div><div id="usBody">' + skeleton(6) + '</div>');
  $('usAll').onchange = drawUsers; $('usQ').oninput = drawUsers; $('usRole').onchange = drawUsers;
  api('listUsers').then(function(l){ S._us = l; drawUsers(); }).catch(function(){});
};
function drawUsers(){
  if (!S._us) return;
  var all = $('usAll').checked, q = $('usQ').value.toLowerCase(), ro = $('usRole').value;
  var list = S._us.filter(function(u){ return (all || q || u.roles.join(',') !== 'STAFF') && (!ro || u.roles.indexOf(ro) >= 0) && (!q || (u.empCode + ' ' + u.name + ' ' + u.division + ' ' + u.orgUnit + ' ' + u.hrPosition).toLowerCase().indexOf(q) >= 0); });
  $('usBody').innerHTML = '<div class="tbl"><table class="table table-hover"><thead><tr><th>ผู้ใช้งาน</th><th>หน่วยงาน</th><th>ฝ่าย</th><th>บทบาท</th><th>กลุ่มที่รับผิดชอบ</th><th>สถานะ</th><th>เข้าใช้งานล่าสุด</th></tr></thead><tbody>' +
    (list.slice(0, 500).map(function(u){ return '<tr class="cursor" onclick="userModal(\'' + u.empCode + '\')"><td><div class="d-flex gap-2 align-items-center"><div class="avatar">' + esc(initials(u.name)) + '</div><div class="who"><b>' + esc(u.name) + '</b><small>' + u.empCode + ' · ' + esc(u.hrPosition) + '</small></div></div></td><td class="small">' + esc(u.orgUnit) + '</td><td class="small">' + esc(divShort(u.division)) + '</td><td>' + u.roles.filter(function(r){ return r !== 'STAFF'; }).map(function(r){ return '<span class="tag brand me-1">' + esc(S.boot.roles[r]) + '</span>'; }).join('') + '</td>' +
      '<td class="small-muted">' + (u.groups.indexOf('*') >= 0 ? 'ทุกกลุ่ม' : esc(u.groups.join(', '))) + '</td><td>' + (u.active ? '' : '<span class="pill p-bad">ปิดการใช้งาน</span> ') + (u.mustChange ? '<span class="pill p-warn">ยังไม่กำหนดรหัสผ่าน</span>' : '<span class="pill p-ok">ใช้งาน</span>') + '</td><td class="small-muted">' + esc(u.lastLogin) + '</td></tr>'; }).join('') || '<tr><td colspan="7">' + empty('search', 'ไม่พบผู้ใช้งานตามเงื่อนไข') + '</td></tr>') + '</tbody></table></div>';
}
function userModal(code){
  if (!code) return alertBox('ยังไม่ได้ระบุรหัส', 'กรุณาระบุรหัสเจ้าหน้าที่', 'warning');
  var u = S._us.filter(function(x){ return x.empCode === code; })[0] || { empCode: code, name: '', roles: ['STAFF'], groups: [], active: true };
  var roles = [['ENTRY', 'บันทึกเวลาจากใบลงชื่อ ส่งตรวจสอบ พิมพ์ใบลงชื่อ ส่งออก HRMi (ตำแหน่งที่ดูแล)'], ['REVIEWER', 'อนุมัติตารางเวร ตรวจสอบผ่าน/ส่งกลับแก้ไข'], ['COORD', 'ปฏิทิน กรอบเวร ช่วงเวลา ส่งออก HRMi'], ['MANAGER', 'อนุมัติรายเดือน (ล็อกข้อมูล) ย้อนสถานะ'], ['ADMIN', 'ดำเนินการได้ทุกเมนู จัดการผู้ใช้งาน ตั้งค่าระบบ']];
  var body = '<div class="d-flex gap-2 align-items-center mb-3"><div class="avatar">' + esc(initials(u.name || code)) + '</div><div><b>' + esc(u.name || code) + '</b><div class="small-muted">' + code + '</div></div></div><div class="form-label">บทบาท</div>' +
    roles.map(function(r){ return '<div class="form-check mb-1"><input class="form-check-input" type="checkbox" data-ro="' + r[0] + '" id="ro' + r[0] + '"' + (u.roles.indexOf(r[0]) >= 0 ? ' checked' : '') + '><label class="form-check-label" for="ro' + r[0] + '"><b>' + esc(S.boot.roles[r[0]]) + '</b> <span class="small-muted">' + r[1] + '</span></label></div>'; }).join('') +
    '<div class="form-label mt-3">กลุ่มตำแหน่งที่รับผิดชอบ (สำหรับผู้บันทึกข้อมูลและหัวหน้างาน)</div><div class="border rounded-3 p-2" style="max-height:200px;overflow:auto">' +
    '<div class="form-check"><input class="form-check-input" type="checkbox" data-gr="*" id="grAll"' + (u.groups.indexOf('*') >= 0 ? ' checked' : '') + '><label class="form-check-label" for="grAll"><b>ทุกกลุ่ม</b></label></div>' +
    S.boot.groups.map(function(g, i){ return '<div class="form-check"><input class="form-check-input" type="checkbox" data-gr="' + esc(g) + '" id="gr' + i + '"' + (u.groups.indexOf(g) >= 0 ? ' checked' : '') + '><label class="form-check-label" for="gr' + i + '">' + esc(g) + '</label></div>'; }).join('') + '</div>' +
    '<div class="form-check form-switch mt-3"><input class="form-check-input" type="checkbox" id="usActive"' + (u.active ? ' checked' : '') + '><label class="form-check-label" for="usActive">เปิดใช้งานบัญชี</label></div>';
  modal('กำหนดสิทธิ์ผู้ใช้งาน', body, [{ text: 'ยกเลิก', cls: 'btn-ghost' }, { text: 'บันทึกสิทธิ์', onClick: function(){
    var rs = ['STAFF'], gs = [];
    $$('[data-ro]').forEach(function(c){ if (c.checked) rs.push(c.dataset.ro); });
    $$('[data-gr]').forEach(function(c){ if (c.checked) gs.push(c.dataset.gr); });
    api('saveUser', { empCode: code, roles: rs, groups: gs, active: $('usActive').checked }).then(function(l){ S._us = l; drawUsers(); notify('บันทึกสิทธิ์เรียบร้อย'); }).catch(function(){});
  } }]);
}

/* ================= ตำแหน่งและอัตราค่าตอบแทน ================= */
PAGES.positions = function(){
  mount(pageHead('การตั้งค่า', 'ตำแหน่งและอัตราค่าตอบแทน', 'อัตราค่าตอบแทนเก็บประวัติตามวันที่มีผล ระบบใช้อัตราที่ตรงกับวันที่ของแต่ละเวร', has('ADMIN') ? '<button class="btn btn-brand" onclick="posModal()"><i class="bi bi-plus-lg"></i> เพิ่มตำแหน่ง</button>' : '') +
    '<div class="filters"><div><label class="form-label" for="poQ">ค้นหา</label><input class="form-control" id="poQ" placeholder="ชื่อตำแหน่ง กลุ่ม หรือรหัสรายได้"></div><div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="poOff"><label class="form-check-label small" for="poOff">แสดงตำแหน่งที่ปิดใช้งาน</label></div></div><div id="poBody">' + skeleton(10) + '</div>');
  $('poQ').oninput = drawPos; $('poOff').onchange = drawPos;
  api('listPositionsAdmin').then(function(l){ S._po = l; drawPos(); }).catch(function(){});
};
function drawPos(){
  if (!S._po) return;
  var q = $('poQ').value.toLowerCase(), off = $('poOff').checked;
  var list = S._po.filter(function(p){ var r = p.current || {}; return (off || p.active) && (!q || (p.name + ' ' + p.groupName + ' ' + (r.dutyCode || '') + ' ' + (r.otCode || '') + ' ' + p.clinicName).toLowerCase().indexOf(q) >= 0); });
  $('poBody').innerHTML = '<div class="tbl"><table class="table table-hover"><thead><tr><th>#</th><th>ตำแหน่ง</th><th>กลุ่ม</th><th>ค่าเวร</th><th class="num">บาท/เวร</th><th>ค่า OT</th><th class="num">บาท/ชม.</th><th>เวร</th><th>' + lbl('เวลาเริ่ม ช1 / ช2 / บ1') + '</th><th class="num">กรอบ</th><th>มีผลตั้งแต่</th><th></th></tr></thead><tbody>' +
    list.map(function(p){ var r = p.current || {}; return '<tr' + (p.active ? '' : ' class="text-muted"') + '><td>' + p.sortOrder + '</td><td class="fw-semibold">' + esc(p.name) + (p.active ? '' : ' <span class="pill p-closed nodot">ปิดใช้งาน</span>') + (p.paid ? '' : ' <span class="pill p-slate nodot" title="ใช้ตรวจสอบเท่านั้น ไม่รวมในเอกสารจ่ายและ HRMi">ไม่จ่ายค่าเวร</span>') + (p.allowOt ? '' : ' <span class="pill p-warn nodot">ไม่มี OT</span>') + (p.refPositionId ? ' <span class="pill p-info nodot" title="ตรวจว่ามีผู้ปฏิบัติงานตำแหน่งอ้างอิงในวันเดียวกัน">อ้างอิง ' + esc(posName(p.refPositionId)) + '</span>' : '') + '<div class="small-muted fw-normal">' + esc(p.clinicName) + '</div></td><td><span class="tag">' + esc(p.groupName) + '</span></td><td class="tnum">' + esc(r.dutyCode) + '</td><td class="num">' + fmt(r.dutyRate, 2) + '</td><td class="tnum">' + esc(r.otCode) + '</td><td class="num">' + fmt(r.otRate, 2) + '</td><td>' + p.shiftMinutes / 60 + ' ชม.</td><td class="small">' + [['ช1', p.morningStart], ['ช2', p.afternoonStart], ['บ1', p.eveningStart]].map(function(x){ return '<div class="text-nowrap"><span class="tag brand">' + esc(slotL(x[0]).s) + '</span> ' + String(x[1] || '').split(',').map(function(t){ return '<span class="tchip sm">' + esc(t) + '</span>'; }).join('') + '</div>'; }).join('') + '</td><td class="num">' + p.defaultQuota + '</td><td class="tnum">' + esc(r.effectiveFrom) + '</td>' +
      '<td class="text-nowrap text-end">' + (has('ADMIN') ? '<button class="btn btn-sm btn-ghost" title="แก้ไข" onclick="posModal(\'' + p.id + '\')"><i class="bi bi-pencil"></i></button> <button class="btn btn-sm btn-soft" onclick="rateModal(\'' + p.id + '\')">อัตราใหม่</button> ' : '') + '<button class="btn btn-sm btn-link" onclick="rateHist(\'' + p.id + '\')">ประวัติ</button></td></tr>'; }).join('') + '</tbody></table></div>';
}
function posModal(id){
  var p = id ? S._po.filter(function(x){ return x.id === id; })[0] : { name: '', groupName: '', shiftMinutes: 240, morningStart: '08:00', afternoonStart: '12:00', eveningStart: '16:00', defaultQuota: 1, sortOrder: S._po.length + 1, active: true, importAliases: '', clinicName: 'คลินิกพิเศษเฉพาะทางนอกเวลา', allowOt: true, paid: true, refPositionId: '' };
  var f = function(k, l, t, help){ return '<div class="col-6"><label class="form-label" for="pm_' + k + '">' + l + '</label><input class="form-control" id="pm_' + k + '" value="' + esc(p[k]) + '"' + (t ? ' type="' + t + '"' : '') + '>' + (help ? '<div class="small-muted">' + help + '</div>' : '') + '</div>'; };
  modal(id ? 'แก้ไขตำแหน่ง' : 'เพิ่มตำแหน่ง', '<div class="row g-2"><div class="col-12"><label class="form-label" for="pm_name">ชื่อตำแหน่ง (รายได้)</label><input class="form-control" id="pm_name" value="' + esc(p.name) + '"></div>' +
    '<div class="col-12"><label class="form-label" for="pm_clinicName">ชื่อคลินิก (หัวเอกสาร)</label><input class="form-control" id="pm_clinicName" value="' + esc(p.clinicName) + '"></div>' +
    f('groupName', 'กลุ่มตำแหน่ง (ใช้กำหนดสิทธิ์)') + f('sortOrder', 'ลำดับ', 'number') + f('shiftMinutes', 'ความยาว 1 เวร (นาที)', 'number') + f('defaultQuota', 'กรอบเวรตั้งต้น/ช่วง', 'number') +
    '<div class="col-12"><div class="starts-box"><div class="d-flex flex-wrap align-items-center gap-2 mb-1"><b><i class="bi bi-clock"></i> เวลาเริ่มเวรมาตรฐาน</b><span class="small-muted">ใส่ได้หลายเวลาต่อช่วงเวร (พิมพ์แล้วกด Enter) เวลาที่อยู่ในรายการจะไม่ขึ้นเตือน "เวลาเริ่มไม่ตรงช่วงมาตรฐาน"</span></div>' +
      [['morningStart', 'ช1'], ['afternoonStart', 'ช2'], ['eveningStart', 'บ1']].map(function(x){ return '<div class="starts-row"><span class="tag brand" title="' + esc(slotL(x[1]).name) + '">' + esc(slotL(x[1]).s) + '</span><span class="small fw-semibold st-name">' + esc(slotL(x[1]).name) + '</span><div class="tchips" data-st="' + x[0] + '">' + String(p[x[0]] || '').split(',').filter(String).map(function(t){ return tchip(t); }).join('') + '</div><input class="form-control form-control-sm" style="width:100px" placeholder="+ เช่น 16:30" data-sti="' + x[0] + '" inputmode="numeric" aria-label="เพิ่มเวลาเริ่ม"><div class="sugg small-muted w-100" data-sug="' + x[1] + '"></div></div>'; }).join('') +
      '<div class="small-muted mt-1">' + '' + ' ช่วง ' + esc(slotL('ช2').s) + ': ถ้าเริ่มช้ากว่าเวลาจบ ' + esc(slotL('ช1').s) + ' ถือเป็นเวลาพัก</div></div></div>' +
      f('quotaGroup', 'กลุ่มกรอบร่วม (ถ้ามี)') +
    '<div class="col-12"><label class="form-label" for="pm_importAliases">ชื่อที่ใช้นำเข้า (ชื่อชีทในไฟล์ตารางเดิม คั่นด้วย ,)</label><input class="form-control" id="pm_importAliases" value="' + esc(p.importAliases) + '"></div>' +
    '<div class="col-12"><label class="form-label" for="pm_refPositionId">ตำแหน่งอ้างอิง (ตรวจว่ามีผู้ปฏิบัติงานตำแหน่งนี้ในวันเดียวกัน เช่น แพทย์แผนไทย)</label><select class="form-select" id="pm_refPositionId" data-search><option value="">— ไม่ตรวจ —</option>' +
      S._po.filter(function(x){ return x.id !== id; }).map(function(x){ return '<option value="' + x.id + '"' + (x.id === p.refPositionId ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') + '</select></div>' +
    '<div class="col-12 d-flex flex-wrap gap-4"><div class="form-check form-switch"><input class="form-check-input" type="checkbox" id="pm_active"' + (p.active ? ' checked' : '') + '><label class="form-check-label" for="pm_active">เปิดใช้งาน</label></div>' +
    '<div class="form-check form-switch"><input class="form-check-input" type="checkbox" id="pm_allowOt"' + (p.allowOt !== false ? ' checked' : '') + '><label class="form-check-label" for="pm_allowOt">มี OT (ปิด = ไม่คิดส่วนที่เกินเวร เช่น เวร 3 ชม.)</label></div>' +
    '<div class="form-check form-switch"><input class="form-check-input" type="checkbox" id="pm_paid"' + (p.paid !== false ? ' checked' : '') + '><label class="form-check-label" for="pm_paid">จ่ายค่าเวร (ปิด = ใช้ตรวจสอบเท่านั้น)</label></div></div></div>' +
    (id ? '' : '<div class="small-muted mt-2">เมื่อเพิ่มแล้ว กด "อัตราใหม่" เพื่อระบุรหัสรายได้และอัตรา</div>'),
    [{ text: 'ยกเลิก', cls: 'btn-ghost' }, { text: 'บันทึก', onClick: function(){
      var o = { id: id || '', active: $('pm_active').checked, allowOt: $('pm_allowOt').checked, paid: $('pm_paid').checked, refPositionId: $('pm_refPositionId').value };
      ['name', 'clinicName', 'groupName', 'sortOrder', 'shiftMinutes', 'defaultQuota', 'quotaGroup', 'importAliases'].forEach(function(k){ o[k] = $('pm_' + k).value; });
      var badT = false;
      ['morningStart', 'afternoonStart', 'eveningStart'].forEach(function(k){ var l = $$('[data-st="' + k + '"] .tchip').map(function(c){ return c.dataset.t; }); var raw = $$('[data-sti="' + k + '"]')[0].value, extra = normT(raw); if (raw && !extra) badT = true; if (extra && l.indexOf(extra) < 0) l.push(extra); o[k] = l.join(','); });
      if (badT) { notify('รูปแบบเวลาไม่ถูกต้อง (ตัวอย่าง 16:30)', 'warning'); return false; }
      api('savePosition', o, { block: 'กำลังบันทึกและคำนวณข้อสังเกตใหม่…' }).then(function(l){ S._po = l; drawPos(); MDL.hide(); notify('บันทึกตำแหน่งเรียบร้อย'); var bp = posOf(o.id); if (bp) { bp.morningStart = o.morningStart; bp.afternoonStart = o.afternoonStart; bp.eveningStart = o.eveningStart; } }).catch(function(){});
      return false;
    } }], 'lg');
  bindStarts(id);
}
function tchip(t){ return '<span class="tchip" data-t="' + esc(t) + '">' + esc(t) + ' <button type="button" aria-label="ลบ ' + esc(t) + '" onclick="this.parentNode.remove()">×</button></span>'; }
function addTchip(k, t){ t = normT(t); if (!t) return false; var box = $$('[data-st="' + k + '"]')[0]; if ($$('.tchip', box).some(function(c){ return c.dataset.t === t; })) return true; box.insertAdjacentHTML('beforeend', tchip(t)); $$('.tchip', box).sort(function(a, b){ return a.dataset.t < b.dataset.t ? -1 : 1; }).forEach(function(c){ box.appendChild(c); }); return true; }
function bindStarts(id){
  $$('[data-sti]').forEach(function(inp){ inp.onkeydown = function(e){ if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); if (addTchip(inp.dataset.sti, inp.value)) inp.value = ''; else inp.classList.add('is-invalid'); } else inp.classList.remove('is-invalid'); }; inp.onblur = function(){ if (inp.value && addTchip(inp.dataset.sti, inp.value)) inp.value = ''; }; });
  return;   // 1 ต.ค. 69 เลิกดึง "เวลาเริ่มที่เกิดขึ้นจริง 3 เดือน" อัตโนมัติ (ระบบตั้งค่าเสร็จแล้ว ไม่ต้องโหลดเพิ่ม)
  api('suggestStarts', { positionId: id }, { quiet: true }).then(function(r){
    var map = { 'ช1': 'morningStart', 'ช2': 'afternoonStart', 'บ1': 'eveningStart' }, any = false;
    Object.keys(r.starts).forEach(function(sl){
      var el = $$('[data-sug="' + sl + '"]')[0]; if (!el) return;
      var have = $$('[data-st="' + map[sl] + '"] .tchip').map(function(c){ return c.dataset.t; });
      var l = r.starts[sl].filter(function(x){ return have.indexOf(x.time) < 0; });
      if (l.length) any = true;
      el.innerHTML = l.length ? 'พบจริงแต่ยังไม่อยู่ในรายการ: ' + l.map(function(x){ return '<button type="button" class="tchip add" onclick="addTchip(\'' + map[sl] + '\',\'' + x.time + '\');this.remove()" title="เพิ่ม ' + x.time + ' (พบ ' + x.n + ' ครั้ง)">+ ' + x.time + ' <small>' + x.n + ' ครั้ง</small></button>'; }).join('') : '';
    });
    if ($('pmSugInfo')) $('pmSugInfo').innerHTML = any ? '<i class="bi bi-lightbulb text-warning"></i> กด "+ เวลา" เพื่อเพิ่มเวลาที่พบจริงในรายการมาตรฐาน · บันทึกแล้วระบบคำนวณข้อสังเกตของเดือนนี้และเดือนก่อนใหม่' : '<i class="bi bi-check2-circle text-success"></i> เวลาเริ่มที่เกิดขึ้นจริง 3 เดือนล่าสุดอยู่ในรายการครบแล้ว ·';
  }).catch(function(){ if ($('pmSugInfo')) $('pmSugInfo').textContent = ''; });
}
function rateModal(pid){
  var p = S._po.filter(function(x){ return x.id === pid; })[0], r = p.current || {};
  var f = function(k, l, v, t){ return '<div class="col-6"><label class="form-label" for="rm_' + k + '">' + l + '</label><input class="form-control" id="rm_' + k + '" value="' + esc(v == null ? '' : v) + '"' + (t ? ' type="' + t + '"' : '') + '></div>'; };
  modal('อัตราใหม่: ' + p.name, '<div class="row g-2">' + f('effectiveFrom', 'มีผลตั้งแต่วันที่', '', 'date') + '<div class="col-6"></div>' +
    f('dutyCode', 'รหัสรายได้ค่าเวร', r.dutyCode) + f('dutyRate', 'อัตราค่าเวร (บาท/เวร)', r.dutyRate, 'number') +
    '<div class="col-12"><label class="form-label" for="rm_dutyName">ชื่อรายได้ค่าเวร</label><input class="form-control" id="rm_dutyName" value="' + esc(r.dutyName) + '"></div>' + f('dutyPer', 'หน่วย', r.dutyPer || '4 ชั่วโมง') + '<div class="col-6"></div>' +
    f('otCode', 'รหัสรายได้ OT', r.otCode) + f('otRate', 'อัตรา OT (บาท/ชม.)', r.otRate, 'number') +
    '<div class="col-12"><label class="form-label" for="rm_otName">ชื่อรายได้ OT</label><input class="form-control" id="rm_otName" value="' + esc(r.otName) + '"></div></div><div class="small-muted mt-2">อัตราเดิมจะสิ้นสุดวันก่อนวันที่มีผลโดยอัตโนมัติ</div>',
    [{ text: 'ยกเลิก', cls: 'btn-ghost' }, { text: 'บันทึกอัตรา', onClick: function(){
      var o = { positionId: pid };
      ['effectiveFrom', 'dutyCode', 'dutyRate', 'dutyName', 'dutyPer', 'otCode', 'otRate', 'otName'].forEach(function(k){ o[k] = $('rm_' + k).value; });
      api('saveRate', o).then(function(l){ S._po = l; drawPos(); notify('บันทึกอัตราเรียบร้อย'); }).catch(function(){});
    } }]);
}
function rateHist(pid){
  var p = S._po.filter(function(x){ return x.id === pid; })[0];
  modal('ประวัติอัตรา: ' + p.name, '<div class="tbl"><table class="table"><thead><tr><th>ตั้งแต่</th><th>ถึง</th><th>ค่าเวร</th><th>OT</th><th>โดย</th></tr></thead><tbody>' +
    p.history.map(function(r){ return '<tr><td>' + r.effectiveFrom + '</td><td>' + (r.effectiveTo || 'ปัจจุบัน') + '</td><td>' + esc(r.dutyCode) + ' · ' + fmt(r.dutyRate, 2) + '</td><td>' + esc(r.otCode) + ' · ' + fmt(r.otRate, 2) + '</td><td class="small-muted">' + esc(r.updatedBy) + '</td></tr>'; }).join('') + '</tbody></table></div>', null, 'lg');
}

/* ================= รูปลักษณ์และประกาศ ================= */
var COLORS = [['#d72638', 'แดงสภากาชาด'], ['#b91c1c', 'แดงเข้ม'], ['#be185d', 'ชมพูเข้ม'], ['#1d4ed8', 'น้ำเงิน'], ['#0f766e', 'เขียวหัวเป็ด'], ['#15803d', 'เขียว'], ['#7c3aed', 'ม่วง'], ['#334155', 'เทาเข้ม']];
PAGES.branding = function(){
  var b = BRAND || {};
  var f = function(k, l, v, ph){ return '<div class="col-md-6"><label class="form-label" for="br_' + k + '">' + l + '</label><input class="form-control" id="br_' + k + '" value="' + esc(v || '') + '" placeholder="' + esc(ph || '') + '"></div>'; };
  mount(pageHead('การตั้งค่า', 'รูปลักษณ์และประกาศ', 'กำหนดชื่อระบบ โลโก้ สีหลัก ข้อมูลการติดต่อ และข้อความประกาศที่แสดงบนหน้าเว็บ', '<button class="btn btn-brand" onclick="saveBrand(this)"><i class="bi bi-save"></i> บันทึก</button>') +
    '<div class="row g-3"><div class="col-xl-7"><div class="card mb-3"><div class="card-h"><h3><i class="bi bi-megaphone text-danger"></i> ข้อความประกาศ</h3></div><div class="card-b row g-2">' +
    '<div class="col-12"><textarea class="form-control" id="br_announcement" rows="3" placeholder="เช่น ขอให้ส่งตรวจสอบตารางเดือนกันยายน ภายในวันที่ 2 ตุลาคม 2569">' + esc(b.announcement || '') + '</textarea></div>' +
    '<div class="col-md-6"><label class="form-label" for="br_announceLevel">ระดับความสำคัญ</label><select class="form-select" id="br_announceLevel"><option value="info">ข่าวสารทั่วไป (สีฟ้า)</option><option value="warning">โปรดทราบ (สีเหลือง)</option><option value="danger">สำคัญมาก (สีแดง)</option></select></div>' +
    '<div class="col-md-6"><label class="form-label" for="br_announceUntil">แสดงถึงวันที่ (ไม่ระบุ = ไม่มีกำหนด)</label><input type="date" class="form-control" id="br_announceUntil"></div></div></div>' +
    '<div class="card"><div class="card-h"><h3><i class="bi bi-card-text text-danger"></i> ชื่อระบบและการติดต่อ</h3></div><div class="card-b row g-2">' +
    '<div class="col-12"><label class="form-label" for="br_systemName">ชื่อระบบ (แสดงในส่วนท้ายและเอกสาร)</label><input class="form-control" id="br_systemName" value="' + esc(b.name || '') + '"></div>' +
    '<div class="col-12"><label class="form-label" for="br_systemNameEn">ชื่อระบบภาษาอังกฤษ</label><input class="form-control" id="br_systemNameEn" value="' + esc(b.nameEn || '') + '" placeholder="SMC Duty Scheduling and Attendance System"></div>' +
    f('systemShortName', 'ชื่อย่อระบบ', b.short) + f('copyrightYear', 'ปี พ.ศ. ลิขสิทธิ์', b.year) +
    '<div class="col-12"><label class="form-label" for="br_orgName">ชื่อหน่วยงาน</label><input class="form-control" id="br_orgName" value="' + esc(b.org || '') + '"></div>' +
    '<div class="col-12"><label class="form-label" for="br_developerName">พัฒนาระบบโดย</label><input class="form-control" id="br_developerName" value="' + esc(b.developer || '') + '"></div>' +
    f('contactPhone', 'โทรภายใน', b.phone, '23411, 23412') + f('contactEmail', 'อีเมล', b.email) + '</div></div></div>' +
    '<div class="col-xl-5"><div class="card mb-3"><div class="card-h"><h3><i class="bi bi-palette text-danger"></i> สีหลักและโลโก้</h3></div><div class="card-b">' +
    '<label class="form-label">สีหลัก</label><div class="d-flex flex-wrap gap-2 mb-2">' + COLORS.map(function(c){ return '<button type="button" class="swatch" title="' + c[1] + '" style="background:' + c[0] + '" onclick="$(\'br_brandColor\').value=\'' + c[0] + '\';previewBrand()"></button>'; }).join('') + '</div>' +
    '<div class="d-flex gap-2 align-items-center mb-3"><input type="color" class="form-control form-control-color" id="br_brandColor" value="' + esc(b.brandColor || '#d72638') + '" oninput="previewBrand()"><span class="small-muted">หรือเลือกสีเอง</span></div>' +
    '<label class="form-label">โลโก้ (ระบบย่อขนาดให้อัตโนมัติ)</label><div class="d-flex gap-3 align-items-center"><div class="logo brand-logo" id="brLogoPrev" style="width:112px;height:112px;border-radius:24px"></div><div class="d-flex flex-column gap-2"><input type="file" class="form-control form-control-sm" accept="image/*" onchange="pickLogo(this)"><button class="btn btn-sm btn-ghost" onclick="S._logo=\'\';previewBrand()"><i class="bi bi-x-circle"></i> ใช้โลโก้ตั้งต้น</button></div></div></div></div>' +
    '<div class="card"><div class="card-h"><h3>ตัวอย่าง</h3></div><div class="card-b"><div class="d-flex gap-2 flex-wrap mb-2"><button class="btn btn-brand btn-sm">ปุ่มหลัก</button><button class="btn btn-soft btn-sm">ปุ่มรอง</button><span class="pill p-brand">ป้ายสถานะ</span></div><div class="small-muted">การเปลี่ยนแปลงมีผลกับผู้ใช้ทุกคนหลังกดบันทึก</div></div></div></div></div>');
  setSel('br_announceLevel', b.announceLevel || 'info');
  S._logo = b.logo || '';
  api('getSettings').then(function(s){ if (s.announceUntil) $('br_announceUntil').value = s.announceUntil.value || ''; }).catch(function(){});
  previewBrand();
};
function brandValues(){
  var o = {};
  ['announcement', 'announceLevel', 'announceUntil', 'systemName', 'systemNameEn', 'systemShortName', 'copyrightYear', 'orgName', 'developerName', 'contactPhone', 'contactEmail', 'brandColor'].forEach(function(k){ o[k] = $('br_' + k).value; });
  o.logoData = S._logo || '';
  return o;
}
function previewBrand(){
  var v = brandValues(), b = {}; for (var k in BRAND) b[k] = BRAND[k];
  b.brandColor = v.brandColor; b.logo = v.logoData;
  applyBrand(b);
}
function pickLogo(inp){
  var f = inp.files[0]; if (!f) return;
  var rd = new FileReader();
  rd.onload = function(){
    var im = new Image();
    im.onload = function(){
      // v1.3 เก็บความละเอียดสูง (สูงสุด 512 px) ให้โลโก้คมชัดบนจอความละเอียดสูง
      var s = 512, c = document.createElement('canvas'), k = Math.min(1, s / Math.max(im.width, im.height));
      c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      var g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(im, 0, 0, c.width, c.height);
      var d = c.toDataURL('image/png');
      if (d.length > 340000) d = c.toDataURL('image/webp', 0.92);
      if (d.length > 340000 || d.indexOf('data:image/webp') !== 0 && d.length > 340000) d = c.toDataURL('image/jpeg', 0.9);
      S._logo = d; previewBrand();
    };
    im.src = rd.result;
  };
  rd.readAsDataURL(f);
}
function saveBrand(b){
  api('saveBranding', { values: brandValues() }, { btn: b }).then(function(br){ applyBrand(br); notify('บันทึกรูปลักษณ์และประกาศเรียบร้อย'); }).catch(function(){});
}

/* ================= ตั้งค่าระบบและนำเข้าข้อมูล ================= */
PAGES.settings = function(){
  mount(pageHead('การตั้งค่า', 'ตั้งค่าระบบและนำเข้าข้อมูล', 'ผู้ลงนามในเอกสาร สถานะการเชื่อมต่อ การนำเข้าข้อมูลระบบเดิม ข้อมูลทดลอง และค่าระบบ') + '<div id="stBody">' + skeleton(8) + '</div>');
  api('getSettings').then(function(s){ S._st = s; drawSettings(); }).catch(function(){});
};
function drawSettings(){
  var s = S._st, admin = has('ADMIN');
  var v = function(k){ return s[k] ? s[k].value : ''; };
  var h = '<div class="row g-3"><div class="col-lg-6"><div class="card h-100"><div class="card-h"><h3><i class="bi bi-pen text-danger"></i> ผู้ลงนามในเอกสาร</h3></div><div class="card-b row g-2">' +
    ['signer1Name|ผู้ตรวจสอบกลาง (ชื่อ) · ตำแหน่งที่ไม่ได้ตั้งผู้ตรวจสอบเอง', 'signer1Title|ตำแหน่ง', 'signer2Name|ผู้รับรอง (ชื่อ) · ผู้จัดการคลินิก ใช้ทุกเอกสาร', 'signer2Title|ตำแหน่ง'].map(function(x){ var p = x.split('|'); return '<div class="col-12"><label class="form-label" for="sg_' + p[0] + '">' + p[1] + '</label><input class="form-control" id="sg_' + p[0] + '" value="' + esc(v(p[0])) + '"></div>'; }).join('') +
    '<div class="col-12"><button class="btn btn-brand" onclick="saveSigners(this)">บันทึกผู้ลงนาม</button></div></div></div></div>';
  h += '<div class="col-lg-6"><div class="card h-100"><div class="card-h"><h3><i class="bi bi-plug text-danger"></i> สถานะการเชื่อมต่อ</h3></div><div class="card-b">' +
    '<div class="d-flex justify-content-between py-1"><span>SmartAPI (Script Properties)</span>' + (s._api.user && s._api.pass ? '<span class="pill p-ok">ตั้งค่าแล้ว</span>' : '<span class="pill p-bad">ยังไม่ตั้งค่า</span>') + '</div>' +
    '<div class="d-flex justify-content-between py-1"><span>งานอัตโนมัติทุกคืน 01:00 น.</span>' + (s._triggers.indexOf('nightlyJob') >= 0 ? '<span class="pill p-ok">ติดตั้งแล้ว</span>' : '<span class="pill p-bad">ยังไม่ติดตั้ง</span>') + '</div>' +
    '<div class="d-flex justify-content-between py-1"><span>ปรับปรุงข้อมูลบุคลากรล่าสุด</span><span class="small-muted">' + esc(v('lastEmpSync') || '-') + '</span></div>' +
    '<div class="d-flex justify-content-between py-1"><span>ดึงข้อมูลสแกนล่าสุด</span><span class="small-muted">' + esc(v('lastScanSync') || '-') + '</span></div></div></div></div>';
  if (admin) {
    var sv = v('scheduleView') === 'own' ? 'own' : 'all';
    h += '<div class="col-12"><div class="card"><div class="card-h"><h3><i class="bi bi-eye text-danger"></i> การมองเห็นตารางเวร</h3><span class="sub">ใช้กับเมนู ลงตารางเวร และ ตารางเวรรวม (ทั้งมุมมองปฏิทิน/ตาราง และแบบ Google Sheet)</span></div><div class="card-b">' +
      '<div class="row g-2 sv-opts">' +
      [['all', 'globe2', 'เห็นทุกตาราง', 'ผู้ใช้ทุกคนดูตารางเวรของทุกตำแหน่งได้'], ['own', 'person-lock', 'เห็นเฉพาะตำแหน่งของตน', 'ผู้ใช้ทั่วไปเห็นเฉพาะตำแหน่งที่ขึ้นเวรได้ (ข้อมูลบุคลากร → ขึ้นเวรได้เฉพาะตำแหน่ง) และตำแหน่งที่ขึ้นเวร/ลงเวรใน 3 เดือนล่าสุด · ผู้บันทึกข้อมูล/ผู้ตรวจสอบเห็นตำแหน่งในกลุ่มที่ดูแลด้วย']].map(function(o){
        return '<div class="col-md-6"><label class="sv-opt' + (sv === o[0] ? ' on' : '') + '"><input class="form-check-input" type="radio" name="svMode" value="' + o[0] + '"' + (sv === o[0] ? ' checked' : '') + '><i class="bi bi-' + o[1] + '"></i><span><b>' + o[2] + '</b><small>' + o[3] + '</small></span></label></div>';
      }).join('') + '</div>' +
      '<div class="small-muted mt-2"><i class="bi bi-info-circle"></i> ทั้งสองแบบ: สิทธิ์ลงเวร แก้ไขตาราง และอนุมัติ เป็นไปตามสิทธิ์เดิม (ผู้ใช้ทั่วไปดูตารางแบบ Google Sheet ได้อย่างเดียว) · เจ้าหน้าที่ประสานงาน ผู้จัดการคลินิก และผู้ดูแลระบบ เห็นทุกตารางเสมอ · ผู้ใช้เห็นผลเมื่อเข้าสู่ระบบครั้งถัดไปหรือรีเฟรชหน้า</div>' +
      '<div class="mt-2"><button class="btn btn-brand" onclick="saveSchedView(this)"><i class="bi bi-save"></i> บันทึกการมองเห็น</button></div></div></div></div>';
    h += '<div class="col-12"><div class="card"><div class="card-h"><h3><i class="bi bi-cone-striped text-danger"></i> ข้อมูลทดลอง (ทดสอบขั้นตอนก่อนใช้งานจริง)</h3></div><div class="card-b">' +
      '<div class="small-muted mb-2">ตั้งเดือนใดเดือนหนึ่งเป็น "เดือนทดลอง" (แนะนำ กันยายน 2569 ซึ่งไฟล์ทดลองจัดทำไว้ให้ตรงกับวันในสัปดาห์และวันหยุดของเดือนนั้นแล้ว) แล้วนำเข้าไฟล์ demo_schedule.csv และ demo_records.csv เพื่อทดลองบันทึก ส่งตรวจสอบ อนุมัติ และพิมพ์เอกสารได้ทันที (ส่งตรวจสอบได้ทุกเวลา) เอกสารจะมีข้อความ "ข้อมูลทดลอง" กำกับ เมื่อทดสอบเสร็จกด "ล้างข้อมูลทดลอง"</div>' +
      '<div class="d-flex flex-wrap gap-2 align-items-end mb-2">' + ymSelect('dmYm', S.boot.ym, 3, 1, 'เดือนทดลอง') + '<button class="btn btn-soft" onclick="demoOn(this,true)"><i class="bi bi-toggle-on"></i> ตั้งเป็นเดือนทดลอง</button><button class="btn btn-ghost" onclick="demoOn(this,false)">ยกเลิกเดือนทดลอง</button></div>' +
      '<div class="row g-2"><div class="col-md-6"><label class="form-label" for="dmSch">ตารางเวรทดลอง (demo_schedule.csv)</label><input class="form-control" type="file" id="dmSch" accept=".csv,text/csv"></div><div class="col-md-6"><label class="form-label" for="dmRec">รายการเวลาทดลอง (demo_records.csv)</label><input class="form-control" type="file" id="dmRec" accept=".csv,text/csv"></div></div>' +
      '<div class="mt-2 d-flex gap-2 flex-wrap"><button class="btn btn-brand" onclick="demoImport(this)"><i class="bi bi-upload"></i> นำเข้าข้อมูลทดลอง</button><button class="btn btn-danger-soft" onclick="demoClear(this)"><i class="bi bi-trash3"></i> ล้างข้อมูลทดลองทั้งเดือน</button></div>' +
      '<div class="small-muted mt-2">เดือนทดลองปัจจุบัน: <b id="dmList">' + esc((S.boot.demoMonths || []).map(thYm).join(', ') || 'ไม่มี') + '</b></div></div></div></div>';
    h += '<div class="col-12"><div class="card"><div class="card-h"><h3><i class="bi bi-rocket-takeoff text-danger"></i> เริ่มใช้งานจริง: นำเข้ารายการที่ตรวจจากใบลงชื่อแล้ว</h3><span class="sub">สำหรับเดือนที่ยังเปิดอยู่ แล้วบันทึกต่อในระบบ</span></div><div class="card-b">' +
      '<div class="small-muted mb-2">รายการจะเข้าเป็นข้อมูลปกติของระบบ (ไม่ใช่ข้อมูลทดลอง/Archive) ผ่านการตรวจเหมือนคีย์ด้วยมือ: เวลาทับซ้อน กรอบเวร ช่วงเวรที่เปิด และตรวจสแกนนิ้วตามรอบ · รายการที่ไม่ผ่านจะแสดงเหตุผลให้ดาวน์โหลดไปแก้ แล้วบันทึกในหน้าบันทึกเวลา · นำเข้าซ้ำได้ (รายการที่มีแล้วจะข้าม)</div>' +
      '<div class="d-flex flex-wrap gap-2 align-items-end mb-2">' + ymSelect('lvYm', S.boot.ym, 2, 0, 'เดือน') + '<div style="min-width:280px"><label class="form-label" for="lvRec">ไฟล์รายการปฏิบัติงาน (.csv)</label><input class="form-control" type="file" id="lvRec" accept=".csv,text/csv"></div></div>' +
      '<div class="form-check"><input class="form-check-input" type="checkbox" id="lvSch" checked><label class="form-check-label" for="lvSch">สร้างตารางเวร (อนุมัติแล้ว) จากรายการที่นำเข้า เพื่อไม่ให้ติดข้อสังเกต "ไม่อยู่ในตารางเวร"</label></div>' +
      '<div class="mt-2 d-flex gap-2 flex-wrap"><button class="btn btn-brand" onclick="liveImport(this)"><i class="bi bi-upload"></i> นำเข้ารายการจริง</button></div><div id="lvOut" class="mt-3"></div></div></div></div>';
    h += '<div class="col-12"><div class="card"><div class="card-h"><h3><i class="bi bi-cloud-upload text-danger"></i> นำเข้าข้อมูลระบบเดิม</h3><span class="sub">ไฟล์ legacy_employees_ทุกหน่วยงาน.csv และ legacy_work_records_ทุกหน่วยงาน.csv</span></div><div class="card-b">' +
      '<div class="row g-3"><div class="col-md-6"><label class="form-label" for="csvEmp">1. รายชื่อบุคลากร</label><input class="form-control" type="file" id="csvEmp" accept=".csv,text/csv"></div>' +
      '<div class="col-md-6"><label class="form-label" for="csvRec">2. รายการปฏิบัติงานเดิม</label><input class="form-control" type="file" id="csvRec" accept=".csv,text/csv"></div></div>' +
      '<div class="form-check mt-2"><input class="form-check-input" type="checkbox" id="csvReplace"><label class="form-check-label" for="csvReplace">แทนที่เดือนที่เคยนำเข้าแล้ว (ใช้เมื่อเคยนำเข้าไฟล์ชุดเก่าที่มีเฉพาะ SMC)</label></div>' +
      '<div class="mt-3 d-flex gap-2 align-items-center flex-wrap"><button class="btn btn-brand" onclick="importLegacy()"><i class="bi bi-upload"></i> เริ่มนำเข้า</button><span class="small-muted">ข้อมูลแต่ละเดือนจัดเก็บเป็นไฟล์ Archive (สถานะอนุมัติแล้ว) · ใช้เวลาประมาณ 2–5 นาที</span></div><div id="impLog" class="mt-3"></div></div></div></div>';
    h += '<div class="col-12"><div class="card"><div class="card-h"><h3><i class="bi bi-gear-wide-connected text-danger"></i> คำสั่งระบบ</h3></div><div class="card-b"><div class="d-flex flex-wrap gap-2 align-items-end mb-2">' + ymSelect('jbYm', S.boot.ym, 14, 1) + '</div><div class="d-flex flex-wrap gap-2">' +
      [['testApi', 'plug', 'ทดสอบการเชื่อมต่อ API'], ['syncEmployees', 'people', 'ปรับปรุงข้อมูลบุคลากร'], ['syncScans', 'fingerprint', 'ดึงข้อมูลสแกนเดือนที่เลือก'], ['recalc', 'calculator', 'คำนวณเดือนที่เลือกใหม่'], ['archive', 'archive', 'จัดเก็บเดือนที่เลือกเข้า Archive'],
        ['allowedFromHistory', 'person-check', 'กำหนดตำแหน่งที่ขึ้นเวรได้จากประวัติ 12 เดือน'], ['seedV13', 'box-seam', 'อัปเกรดค่าตั้งต้นของระบบ'], ['archiveAudit', 'archive', 'ย้ายประวัติการใช้งานเก่าไปไดรฟ์'], ['installTriggers', 'alarm', 'ติดตั้งงานอัตโนมัติ'], ['normalizeUnits', 'magic', 'แปลงชื่อจุดปฏิบัติงานรังสี (เดือนที่เลือก)'], ['clearCache', 'lightning', 'ล้างแคช']].map(function(j){ return '<button class="btn btn-sm btn-ghost" onclick="job(\'' + j[0] + '\',this)"><i class="bi bi-' + j[1] + '"></i> ' + j[2] + '</button>'; }).join('') +
      '</div><pre id="jbOut" class="small mt-2 mb-0" style="white-space:pre-wrap"></pre></div></div></div>';
    h += '<div class="col-12"><div class="card"><div class="card-h"><h3><i class="bi bi-sliders text-danger"></i> ค่าระบบ</h3><button class="btn btn-sm btn-brand ms-auto" onclick="saveSet(this)">บันทึกค่าระบบ</button></div><div class="card-b row g-3">' +
      Object.keys(s).filter(function(k){ return k[0] !== '_' && s[k].editable && k.indexOf('signer') < 0; }).map(function(k){ return '<div class="col-md-6"><label class="form-label">' + esc(s[k].note || k) + ' <span class="text-secondary">(' + esc(k) + ')</span></label><input class="form-control" data-set="' + k + '" value="' + esc(s[k].value) + '"></div>'; }).join('') + '</div></div></div>';
    h += '<div class="col-12"><div class="card"><div class="card-h"><h3><i class="bi bi-archive text-danger"></i> ข้อมูลรายเดือนใน Archive</h3></div><div class="card-b" id="arList"><div class="skel"></div></div></div></div>';
  }
  $('stBody').innerHTML = h + '</div>';
  enhanceSelects($('stBody'));
  $$('input[name="svMode"]').forEach(function(r){ r.onchange = function(){ $$('.sv-opt').forEach(function(l){ l.classList.toggle('on', l.querySelector('input').checked); }); }; });
  if (admin) api('getArchiveList', {}).then(function(l){ $('arList').innerHTML = l.length ? l.map(function(a){ return '<span class="chip" style="font-size:13px;padding:3px 9px"><i class="bi bi-archive"></i> ' + esc(a.thMonth) + ' · ' + fmt(a.rows) + ' รายการ</span>'; }).join(' ') : '<span class="small-muted">ยังไม่มี</span>'; }).catch(function(){});
}
function saveSigners(b){ var o = {}; ['signer1Name', 'signer1Title', 'signer2Name', 'signer2Title'].forEach(function(k){ o[k] = $('sg_' + k).value; }); api('saveSigners', o, { btn: b }).then(function(s){ S._st = s; notify('บันทึกผู้ลงนามเรียบร้อย'); }).catch(function(){}); }
function saveSchedView(b){
  var r = $$('input[name="svMode"]').filter(function(x){ return x.checked; })[0]; if (!r) return;
  api('saveScheduleView', { mode: r.value }, { btn: b }).then(function(x){ if (S._st) S._st.scheduleView = { value: x.mode }; S.boot.scheduleView = x.mode; notify(x.mode === 'own' ? 'ตั้งเป็น เห็นเฉพาะตำแหน่งของตน แล้ว' : 'ตั้งเป็น เห็นทุกตาราง แล้ว'); }).catch(function(){});
}
function saveSet(b){ var o = {}; $$('[data-set]').forEach(function(i){ o[i.dataset.set] = i.value; }); api('saveSettings', { values: o }, { btn: b }).then(function(s){ S._st = s; notify('บันทึกค่าระบบเรียบร้อย'); }).catch(function(){}); }
function job(name, b){
  var ym = $('jbYm').value;
  var run = function(){ api('runJob', { job: name, ym: ym, untilYm: ym, months: 12 }, { btn: b }).then(function(r){ $('jbOut').textContent = JSON.stringify(r, null, 2); notify('ดำเนินการเรียบร้อย'); }).catch(function(e){ $('jbOut').textContent = e.message; }); };
  if (name === 'archive') confirmBox('จัดเก็บเข้า Archive', 'จัดเก็บเดือน ' + thYm(ym) + ' เข้า Archive (ต้องอนุมัติครบทุกตำแหน่งแล้ว)', 'ดำเนินการ').then(function(ok){ if (ok) run(); });
  else if (name === 'allowedFromHistory') confirmBox('กำหนดตำแหน่งจากประวัติ', 'ระบบจะกำหนด "ขึ้นเวรได้เฉพาะตำแหน่ง" ให้บุคลากรที่ยังไม่ได้กำหนด ตามตำแหน่งที่เคยขึ้นเวรใน 12 เดือนล่าสุด (ผู้ที่กำหนดไว้แล้วจะไม่เปลี่ยน)', 'ดำเนินการ').then(function(ok){ if (ok) run(); });
  else run();
}
function importLegacy(){
  Promise.all([readFile($('csvEmp')), readFile($('csvRec'))]).then(function(t){
    if (!t[0] && !t[1]) return alertBox('ยังไม่ได้เลือกไฟล์', 'กรุณาเลือกไฟล์ CSV อย่างน้อย 1 ไฟล์', 'warning');
    var emps = t[0] ? parseCsv(t[0]) : [], recs = t[1] ? parseCsv(t[1]) : [];
    var replace = $('csvReplace').checked;
    var byYm = {}; recs.forEach(function(r){ var ym = String(r.date).slice(0, 7); (byYm[ym] = byYm[ym] || []).push(r); });
    var months = Object.keys(byYm).sort().filter(function(ym){ return ym < S.boot.ym; });
    var later = Object.keys(byYm).filter(function(ym){ return ym >= S.boot.ym; });
    confirmBox('นำเข้าข้อมูลระบบเดิม', 'บุคลากร ' + emps.length + ' คน\nรายการปฏิบัติงาน ' + recs.length + ' รายการ (' + months.length + ' เดือน: ' + (months.length ? thYm(months[0]) + ' – ' + thYm(months[months.length - 1]) : '-') + ')' +
      (later.length ? '\nเดือนที่ยังไม่สิ้นสุด (' + later.map(thYm).join(', ') + ') จะยังไม่นำเข้า' : '') + (replace ? '\nเดือนที่เคยนำเข้าแล้วจะถูกแทนที่' : ''), 'เริ่มนำเข้า').then(function(ok){
      if (!ok) return;
      var log = $('impLog'); log.innerHTML = '<div class="progress mb-2" style="height:10px;border-radius:10px"><div class="progress-bar bg-danger progress-bar-striped progress-bar-animated" id="impBar" style="width:0%"></div></div><div id="impTxt" class="small"></div>';
      var total = months.length + (emps.length ? 1 : 0), done = 0, lines = [];
      var step = function(msg){ done++; $('impBar').style.width = Math.round(done / total * 100) + '%'; lines.push(msg); $('impTxt').innerHTML = lines.map(function(x){ return '<div>' + x + '</div>'; }).join(''); };
      var chain = Promise.resolve();
      if (emps.length) chain = chain.then(function(){ return api('importEmployeesCsv', { rows: emps }, { quiet: true }).then(function(r){ step('<i class="bi bi-check-circle text-success"></i> บุคลากร: เพิ่ม ' + r.added + ' · ปรับปรุง ' + r.updated); }, function(e){ step('<i class="bi bi-x-circle text-danger"></i> บุคลากร: ' + esc(e.message)); }); });
      months.forEach(function(ym){
        chain = chain.then(function(){ return api('importLegacyMonth', { ym: ym, rows: byYm[ym], replace: replace }, { quiet: true }).then(function(r){
          step(r.skipped ? '<i class="bi bi-skip-forward text-secondary"></i> ' + thYm(ym) + ': มีใน Archive แล้ว ข้าม' : '<i class="bi bi-check-circle text-success"></i> ' + thYm(ym) + ': ' + fmt(r.rows) + ' รายการ' + (r.replaced ? ' (แทนที่ของเดิม)' : '') + (r.badCount ? ' (ข้าม ' + r.badCount + ' แถวที่ไม่ถูกต้อง)' : ''));
        }, function(e){ step('<i class="bi bi-x-circle text-danger"></i> ' + thYm(ym) + ': ' + esc(e.message)); }); });
      });
      chain.then(function(){ $('impBar').classList.remove('progress-bar-animated'); Swal.fire({ icon: 'success', title: 'นำเข้าข้อมูลเสร็จสิ้น', text: 'ดูผลแต่ละเดือนด้านล่าง · ข้อมูลย้อนหลังเปิดดูได้ที่หน้าตรวจสอบและหน้าของฉัน โดยเลือกเดือน', confirmButtonText: 'รับทราบ' }); });
    });
  });
}
function liveImport(b){
  var ym = $('lvYm').value;
  readFile($('lvRec')).then(function(t){
    if (!t) return alertBox('ยังไม่ได้เลือกไฟล์', 'กรุณาเลือกไฟล์รายการปฏิบัติงาน (.csv)', 'warning');
    var rows = parseCsv(t).filter(function(r){ return r.date; });
    var mine = rows.filter(function(r){ return String(r.date).slice(0, 7) === ym; });
    if (!mine.length) return alertBox('ไม่พบรายการของเดือนที่เลือก', 'ไฟล์มี ' + rows.length + ' รายการ แต่ไม่มีรายการของเดือน ' + thYm(ym), 'warning');
    if (isDemo(ym)) return alertBox('เดือนนี้ยังเป็นเดือนทดลอง', 'กรุณากด "ล้างข้อมูลทดลองทั้งเดือน" ของเดือน ' + thYm(ym) + ' ก่อนนำเข้าข้อมูลจริง', 'warning');
    passwordBox('นำเข้ารายการจริง', 'เดือน ' + thYm(ym) + ' จำนวน ' + fmt(mine.length) + ' รายการ\nรายการจะเข้าเป็นข้อมูลจริงของระบบ และใช้เบิกจ่ายหลังผ่านการตรวจสอบและอนุมัติ', 'นำเข้า').then(function(pw){
      if (pw === null) return;
      api('importLiveMonth', { ym: ym, password: pw, makeSchedule: $('lvSch').checked, rows: mine }, { btn: b, block: 'กำลังนำเข้าและตรวจสอบ ' + fmt(mine.length) + ' รายการ… (ประมาณ 1–3 นาที)' }).then(function(r){
        S._lv = r;
        var h = '<div class="d-flex flex-wrap gap-2 mb-2"><span class="pill p-ok nodot">บันทึกแล้ว ' + fmt(r.saved) + '</span>' + (r.duplicate ? '<span class="pill p-slate nodot">มีในระบบแล้ว (ข้าม) ' + fmt(r.duplicate) + '</span>' : '') +
          '<span class="pill ' + (r.problems.length ? 'p-bad' : 'p-ok') + ' nodot">ไม่ผ่าน ' + fmt(r.problems.length) + '</span>' + (r.schedule ? '<span class="pill p-info nodot">สร้างตารางเวร ' + fmt(r.schedule) + ' ช่วง</span>' : '') + '</div>';
        if (r.problems.length) h += '<div class="d-flex gap-2 align-items-center mb-2"><b>รายการที่ไม่ผ่าน</b><button class="btn btn-sm btn-ghost ms-auto" onclick="liveProbCsv()"><i class="bi bi-download"></i> ดาวน์โหลด (.csv)</button></div><div class="tbl" style="max-height:360px"><table class="table"><thead><tr><th>แถว</th><th>วันที่</th><th>บุคลากร</th><th>ตำแหน่ง</th><th>เวลา</th><th>เหตุผล</th></tr></thead><tbody>' +
          r.problems.map(function(x){ return '<tr><td>' + x.row + '</td><td class="text-nowrap">' + esc(x.date) + '</td><td>' + esc(x.name) + ' <small class="text-secondary">' + esc(x.empCode) + '</small></td><td>' + esc(x.positionName) + '</td><td class="tnum">' + esc(x.time) + '</td><td class="text-danger">' + esc(x.error) + '</td></tr>'; }).join('') + '</tbody></table></div>';
        h += '<div class="small-muted mt-2">ขั้นต่อไป: คำสั่งระบบ → "ดึงข้อมูลสแกนเดือนที่เลือก" (หรือรอรอบอัตโนมัติคืนนี้) แล้วตรวจรายการที่หน้าบันทึกเวลา/ภาพรวม</div>';
        $('lvOut').innerHTML = h;
        alertBox('นำเข้าเรียบร้อย', 'บันทึก ' + fmt(r.saved) + ' รายการ' + (r.problems.length ? ' · ไม่ผ่าน ' + r.problems.length + ' รายการ (ดูเหตุผลด้านล่าง)' : ''), r.problems.length ? 'warning' : 'success');
      }).catch(function(){});
    });
  });
}
function liveProbCsv(){
  var q = function(v){ v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  var lines = [['แถวในไฟล์', 'วันที่', 'รหัส', 'ชื่อ', 'ตำแหน่ง', 'เวลา', 'เหตุผล'].join(',')].concat(S._lv.problems.map(function(x){ return [x.row, x.date, x.empCode, x.name, x.positionName, x.time, x.error].map(q).join(','); }));
  saveBlob(new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv' }), 'รายการที่ไม่ผ่าน_' + S._lv.ym + '.csv');
}
function demoOn(b, on){
  var ym = $('dmYm').value;
  api('setDemoMonth', { ym: ym, on: on }, { btn: b }).then(function(r){ S.boot.demoMonths = r.demoMonths; $('dmList').textContent = r.demoMonths.map(thYm).join(', ') || 'ไม่มี'; notify(on ? 'ตั้งเดือน ' + thYm(ym) + ' เป็นเดือนทดลองแล้ว' : 'ยกเลิกเดือนทดลองแล้ว'); }).catch(function(){});
}
function demoImport(b){
  var ym = $('dmYm').value;
  Promise.all([readFile($('dmSch')), readFile($('dmRec'))]).then(function(t){
    if (!t[0] && !t[1]) return alertBox('ยังไม่ได้เลือกไฟล์', 'กรุณาเลือกไฟล์ข้อมูลทดลองอย่างน้อย 1 ไฟล์', 'warning');
    var sch = t[0] ? parseCsv(t[0]) : [], rec = t[1] ? parseCsv(t[1]) : [];
    // ถ้าไฟล์เป็นคนละเดือน เลื่อนวันที่ทีละ 7 วัน (วันในสัปดาห์ตรงกัน) ให้อยู่ในเดือนที่เลือก
    var toD = function(s){ var p = s.split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]); };
    var toS = function(t){ var d = new Date(t); return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0'); };
    var remap = function(rows){
      if (!rows.length || rows[0].date.slice(0, 7) === ym) return rows;
      var src = rows[0].date.slice(0, 7), wk = Math.round((toD(ym + '-01') - toD(src + '-01')) / 604800000) * 604800000;
      return rows.map(function(r){ var o = {}; for (var k in r) o[k] = r[k]; o.date = toS(toD(r.date) + wk); return o; }).filter(function(o){ return o.date.slice(0, 7) === ym; });
    };
    api('importDemo', { ym: ym, schedule: remap(sch), records: remap(rec) }, { btn: b, block: 'กำลังนำเข้าข้อมูลทดลอง…' }).then(function(r){
      Swal.fire({ icon: r.failed ? 'warning' : 'success', title: 'นำเข้าข้อมูลทดลองเรียบร้อย', html: '<div class="text-start">ตารางเวร ' + r.schedule + ' รายการ<br>รายการเวลา ' + r.records + ' รายการ' + (r.failed ? '<br><span class="text-danger">ไม่สำเร็จ ' + r.failed + ' รายการ</span><div class="small">' + r.failedSample.map(esc).join('<br>') + '</div>' : '') + (r.missingEmployees.length ? '<div class="small text-warning mt-2">ไม่พบรหัสบุคลากร: ' + esc(r.missingEmployees.join(', ')) + ' (นำเข้ารายชื่อบุคลากรก่อน)</div>' : '') + '</div>', confirmButtonText: 'รับทราบ' });
    }).catch(function(){});
  });
}
function demoClear(b){
  var ym = $('dmYm').value;
  passwordBox('ล้างข้อมูลทดลอง', 'ลบตารางเวร รายการเวลา ไฟล์แนบ และสถานะทั้งหมดของเดือน ' + thYm(ym) + '\nไม่สามารถกู้คืนได้', 'ล้างข้อมูล', true).then(function(pw){
    if (pw === null) return;
    api('clearDemo', { ym: ym, password: pw }, { btn: b, block: 'กำลังล้างข้อมูลทดลอง…' }).then(function(r){ S.boot.demoMonths = (S.boot.demoMonths || []).filter(function(x){ return x !== ym; }); $('dmList').textContent = S.boot.demoMonths.map(thYm).join(', ') || 'ไม่มี'; alertBox('ล้างข้อมูลทดลองเรียบร้อย', 'ลบรายการเวลา ' + r.records + ' · ตารางเวร ' + r.schedule + ' · ไฟล์แนบ ' + r.files, 'success'); }).catch(function(){});
  });
}

/* ================= ประวัติการใช้งาน ================= */
PAGES.audit = function(){
  mount(pageHead('การตั้งค่า', 'ประวัติการใช้งาน', 'บันทึกการเพิ่ม แก้ไข ลบ อนุมัติ การพิมพ์ และการส่งออกเอกสารทั้งหมด · ประวัติเก่ากว่า 2 เดือนย้ายไปเก็บเป็นไฟล์รายเดือนในไดรฟ์อัตโนมัติทุกวันที่ 1 (ไม่ลบทิ้ง)',
      '<button class="btn btn-ghost" onclick="auArchive(this)"><i class="bi bi-archive"></i> ย้ายประวัติเก่าไปไดรฟ์ตอนนี้</button>') +
    '<div class="filters"><div><label class="form-label" for="auYm">เดือน</label><select class="form-select" id="auYm"><option value="">ล่าสุด (ในชีทหลัก)</option></select></div>' +
    '<div><label class="form-label" for="auQ">ค้นหา</label><input class="form-control" id="auQ" placeholder="รหัสผู้ใช้ / การดำเนินการ / รหัสรายการ / เลขอ้างอิง"></div><button class="btn btn-brand align-self-end" onclick="loadAudit(this)"><i class="bi bi-search"></i> ค้นหา</button><div class="ms-auto small-muted align-self-end" id="auInfo"></div></div><div id="auBody">' + skeleton(10) + '</div>');
  $('auQ').addEventListener('keydown', function(e){ if (e.key === 'Enter') loadAudit(); });
  $('auYm').onchange = function(){ loadAudit(); };
  loadAudit(null, true);
};
var AU_TXT = { LOGIN: 'เข้าสู่ระบบ', CREATE_RECORD: 'บันทึกเวลา', UPDATE_RECORD: 'แก้ไขเวลา', DELETE_RECORD: 'ลบรายการ', SUBMIT: 'ส่งตรวจสอบ', REVIEW_PASS: 'ผ่านการตรวจสอบ', RETURN: 'ส่งกลับแก้ไข', APPROVE_LOCK: 'อนุมัติ', PRINT_REPORT: 'พิมพ์รายงาน', SCHEDULE_GRID: 'แก้ตารางเวร (Sheet)', SCHEDULE_AUTO_SYNC: 'แก้ตารางเวรอัตโนมัติ', BOOK: 'ลงเวร', CANCEL_BOOKING: 'ยกเลิกเวร', APPROVE_SCHEDULE: 'อนุมัติตารางเวร', EXPORT_TABLES: 'ส่งออกตาราง', EXPORT_HRMI: 'ส่งออก HRMi', AUDIT_ARCHIVE: 'ย้ายประวัติไปไดรฟ์', UPLOAD_ATTACHMENT: 'แนบไฟล์', DELETE_ATTACHMENT: 'ลบไฟล์แนบ' };
function loadAudit(b, first){
  api('getAudit', { q: $('auQ').value, ym: $('auYm').value, limit: 500, months: !!first }, { btn: b }).then(function(r){
    var l = r.rows || r;
    if (r.months) { $('auYm').innerHTML = '<option value="">ล่าสุด (ในชีทหลัก)</option>' + r.months.map(function(m){ return '<option value="' + m.ym + '">' + esc(m.thMonth) + (m.where === 'drive' ? ' · ไดรฟ์' : '') + '</option>'; }).join(''); }
    $('auInfo').textContent = 'แสดง ' + l.length + ' รายการล่าสุด';
    $('auBody').innerHTML = '<div class="tbl"><table class="table table-hover"><thead><tr><th>เวลา</th><th>ผู้ใช้งาน</th><th>การดำเนินการ</th><th>รายการ</th><th>รายละเอียด</th></tr></thead><tbody>' +
      (l.map(function(a){ return '<tr><td class="text-nowrap small tnum">' + esc(a.ts) + '</td><td class="tnum">' + esc(a.user) + '</td><td><span class="tag" title="' + esc(a.action) + '">' + esc(AU_TXT[a.action] || a.action) + '</span></td><td class="small-muted">' + esc(a.entity) + ' ' + esc(a.entityId) + '</td><td class="small" style="max-width:520px;word-break:break-word">' + esc(String(a.detail).slice(0, 400)) + '</td></tr>'; }).join('') || '<tr><td colspan="5">' + empty('search', 'ไม่พบประวัติตามเงื่อนไข') + '</td></tr>') + '</tbody></table></div>';
  }).catch(function(){});
}
function auArchive(b){
  confirmBox('ย้ายประวัติเก่าไปไดรฟ์', 'ย้ายประวัติที่เก่ากว่า 2 เดือนไปเก็บเป็นไฟล์ Google Sheet รายเดือน ในโฟลเดอร์ SMC_AuditLog (ไม่ลบทิ้ง)', 'ย้ายเลย').then(function(ok){
    if (ok) api('archiveAuditNow', {}, { btn: b, block: 'กำลังย้ายประวัติการใช้งาน…' }).then(function(r){ alertBox('ย้ายประวัติเรียบร้อย', r.moved ? 'ย้าย ' + fmt(r.moved) + ' รายการ (' + (r.files || []).join(', ') + ') · เหลือในชีทหลัก ' + fmt(r.remain) + ' รายการ' : (r.reason || 'ไม่มีประวัติเก่าที่ต้องย้าย'), 'success'); loadAudit(null, true); }).catch(function(){});
  });
}
