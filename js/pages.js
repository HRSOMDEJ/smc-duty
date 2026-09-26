var PAGES = {};

/* ================= ภาพรวมการดำเนินงาน ================= */
PAGES.dashboard = function(){
  mount(pageHead('ภาพรวม', 'ภาพรวมการดำเนินงาน', 'ติดตามสถานะการบันทึก การตรวจสอบ และการอนุมัติของแต่ละตำแหน่ง รวมทั้งสรุปจำนวนเวรและค่าตอบแทนตามช่วงเวลาที่ต้องการ') +
    '<ul class="nav nav-tabs mb-3" id="dbTabs"><li class="nav-item"><a class="nav-link' + (S.dbTab !== 'range' ? ' active' : '') + '" href="#" data-t="status"><i class="bi bi-list-check"></i> สถานะรายเดือน</a></li>' +
    '<li class="nav-item"><a class="nav-link' + (S.dbTab === 'range' ? ' active' : '') + '" href="#" data-t="range"><i class="bi bi-bar-chart"></i> สรุปตามช่วงเวลา</a></li></ul><div id="dbPane"></div>');
  $$('#dbTabs [data-t]').forEach(function(a){ a.onclick = function(e){ e.preventDefault(); $$('#dbTabs .nav-link').forEach(function(x){ x.classList.remove('active'); }); a.classList.add('active'); S.dbTab = a.dataset.t; dbPane(); }; });
  dbPane();
};
function dbPane(){
  actionBar('');
  if (S.dbTab === 'range') return rangePane('dbPane', false);
  $('dbPane').innerHTML = '<div class="filters">' + ymSelect('dbYm', S.ym) +
    '<div><label class="form-label" for="dbQ">ค้นหาตำแหน่ง</label><input class="form-control" id="dbQ" placeholder="ชื่อตำแหน่ง / กลุ่ม"></div>' +
    '<div><label class="form-label" for="dbSt">สถานะ</label><select class="form-select" id="dbSt" data-search><option value="">ทุกสถานะ</option>' + Object.keys(S.boot.mstatus).map(function(k){ return '<option value="' + k + '">' + esc(S.boot.mstatus[k]) + '</option>'; }).join('') + '</select></div>' +
    '<div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="dbProb"><label class="form-check-label small" for="dbProb">เรียงรายการติดปัญหาก่อน</label></div>' +
    '<div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="dbHideEmpty" checked><label class="form-check-label small" for="dbHideEmpty">ซ่อนตำแหน่งที่ไม่มีรายการ</label></div>' +
    '<div class="ms-auto small-muted align-self-end" id="dbSync"></div></div><div id="dbBody">' + skeleton(8) + '</div>';
  enhanceSelects($('dbPane'));
  $('dbYm').onchange = function(){ S.ym = this.value; loadDash(); };
  ['dbQ', 'dbSt', 'dbProb', 'dbHideEmpty'].forEach(function(id){ $(id).addEventListener(id === 'dbQ' ? 'input' : 'change', drawDash); });
  loadDash();
}
function loadDash(){
  api('getDashboard', { ym: S.ym }).then(function(d){ S._dash = d; drawDash(); }).catch(function(){});
}
function drawDash(){
  var d = S._dash; if (!d || !$('dbBody')) return;
  $('dbSync').innerHTML = '<i class="bi bi-arrow-repeat"></i> ข้อมูลสแกนล่าสุด ' + esc(d.lastScanSync || '-') + '<br><i class="bi bi-send"></i> ' + esc(d.submitWindow.text) + ' · ส่ง HRMi ภายในวันที่ ' + d.deadline;
  var q = $('dbQ').value.trim().toLowerCase(), stF = $('dbSt').value, hide = $('dbHideEmpty').checked;
  var list = d.positions.filter(function(p){ return (!q || (p.name + ' ' + p.groupName).toLowerCase().indexOf(q) >= 0) && (!stF || p.status === stF) && (!hide || p.records || p.scheduled || p.status !== 'OPEN'); });
  if ($('dbProb').checked) list = list.slice().sort(function(a, b){ return (b.blocking - a.blocking) || (b.pendingScan - a.pendingScan) || (a.sortOrder - b.sortOrder); });
  var t = { rec: 0, blk: 0, sh: 0, ot: 0, amt: 0 }, cnt = { OPEN: 0, RETURNED: 0, SUBMITTED: 0, REVIEWED: 0, APPROVED: 0 };
  d.positions.forEach(function(p){ t.rec += p.records; t.blk += p.blocking; t.sh += p.shifts; t.ot += p.ot; t.amt += p.amount; if (p.records || p.status !== 'OPEN') cnt[p.status] = (cnt[p.status] || 0) + 1; });
  var h = demoBanner(S.ym) + '<div class="kpis">' + kpi('journal-check', 'ic-info', 'รายการที่บันทึกแล้ว', t.rec) + kpi('exclamation-triangle', t.blk ? 'ic-bad' : 'ic-ok', 'รายการที่ต้องแก้ไข', t.blk) +
    kpi('clock-history', 'ic-violet', 'จำนวนเวร (OT ' + fmt(t.ot, 1) + ' ชม.)', t.sh) + kpi('cash-coin', 'ic-brand', 'ค่าตอบแทนรวม (บาท)', t.amt, 2) + '</div>';
  h += '<div class="pipe">' + [['OPEN', 'อยู่ระหว่างบันทึก'], ['RETURNED', 'ส่งกลับแก้ไข'], ['SUBMITTED', 'รอตรวจสอบ'], ['REVIEWED', 'ตรวจแล้ว รออนุมัติ'], ['APPROVED', 'อนุมัติแล้ว']].map(function(x){ return '<button class="st' + (stF === x[0] ? ' on' : '') + '" onclick="setSel(\'dbSt\',\'' + (stF === x[0] ? '' : x[0]) + '\');drawDash()"><b>' + (cnt[x[0]] || 0) + '</b><span>' + x[1] + '</span></button>'; }).join('') + '</div>';
  if (d.archived) h += '<div class="tipbar"><i class="bi bi-archive"></i><div>ข้อมูลเดือนนี้จัดเก็บในคลังข้อมูล (Archive) แล้ว เปิดดูได้อย่างเดียว</div></div>';
  h += '<div class="tbl"><table class="table table-hover"><thead><tr><th style="width:36px"><input class="form-check-input" type="checkbox" id="dbAll" aria-label="เลือกทั้งหมด"></th><th>ตำแหน่ง</th><th>สถานะ</th><th class="num">ในตาราง</th><th class="num">บันทึก</th><th class="num">ต้องแก้ไข</th><th class="num">รอสแกน</th><th class="num">นอกตาราง</th><th class="num">เวร</th><th class="num">OT</th><th class="num">ค่าตอบแทน</th><th></th></tr></thead><tbody>';
  list.forEach(function(p){
    h += '<tr><td><input class="form-check-input db-sel" type="checkbox" data-id="' + p.positionId + '" aria-label="เลือก ' + esc(p.name) + '"></td><td><div class="who"><b>' + esc(p.name) + '</b><small>' + esc(p.groupName) + '</small></div></td><td>' + statusPill(p.status) + (p.reason ? '<span class="flag bad">' + esc(p.reason) + '</span>' : '') + '</td>' +
      '<td class="num">' + p.scheduled + '</td><td class="num">' + p.records + '</td><td class="num">' + (p.blocking ? '<span class="pill p-bad nodot">' + p.blocking + '</span>' : '<span class="text-success fw-semibold">0</span>') + '</td>' +
      '<td class="num">' + p.pendingScan + '</td><td class="num">' + p.notScheduled + '</td><td class="num">' + fmt(p.shifts) + '</td><td class="num">' + fmt(p.ot, 1) + '</td><td class="num fw-semibold">' + fmt(p.amount, 2) + '</td>' +
      '<td class="text-nowrap text-end"><button class="btn btn-sm btn-soft" onclick="S.pid=\'' + p.positionId + '\';go(\'entry\')"><i class="bi bi-ui-checks-grid"></i> บันทึก</button> <button class="btn btn-sm btn-ghost" onclick="S.pid=\'' + p.positionId + '\';go(\'review\')"><i class="bi bi-clipboard2-check"></i> ตรวจสอบ</button></td></tr>';
  });
  if (!list.length) h += '<tr><td colspan="12">' + empty('inboxes', d.positions.length ? 'ไม่พบตำแหน่งตามเงื่อนไขที่เลือก' : 'ยังไม่มีตำแหน่งที่ท่านได้รับสิทธิ์') + '</td></tr>';
  $('dbBody').innerHTML = h + '</tbody></table></div>';
  animateKpis();
  $('dbAll').onchange = function(){ var on = this.checked; $$('.db-sel').forEach(function(c){ c.checked = on; }); dbBar(); };
  $$('.db-sel').forEach(function(c){ c.onchange = dbBar; });
  dbBar();
}
function dbSelected(){ return $$('.db-sel').filter(function(c){ return c.checked; }).map(function(c){ return c.dataset.id; }); }
function dbBar(){
  var ids = dbSelected();
  if (!ids.length) return actionBar('');
  var st = {}; S._dash.positions.forEach(function(p){ st[p.positionId] = p.status; });
  var n = function(list){ return ids.filter(function(id){ return list.indexOf(st[id]) >= 0; }).length; };
  var h = '<span class="cnt">เลือก ' + ids.length + ' ตำแหน่ง</span>';
  if (has('ENTRY') || has('COORD')) h += '<button class="btn btn-sm btn-brand" onclick="bulkSubmit(this)"' + (n(['OPEN', 'RETURNED']) ? '' : ' disabled') + '><i class="bi bi-send"></i> ส่งตรวจสอบ (' + n(['OPEN', 'RETURNED']) + ')</button>';
  if (has('REVIEWER')) h += '<button class="btn btn-sm btn-ok" onclick="bulkReview(this)"' + (n(['SUBMITTED']) ? '' : ' disabled') + '><i class="bi bi-check2-circle"></i> ผ่านการตรวจสอบ (' + n(['SUBMITTED']) + ')</button>';
  if (has('MANAGER')) h += '<button class="btn btn-sm btn-brand" onclick="bulkApprove(this)"' + (n(['REVIEWED']) ? '' : ' disabled') + '><i class="bi bi-lock"></i> อนุมัติ (' + n(['REVIEWED']) + ')</button>';
  if (S._dash.canRollback) h += '<button class="btn btn-sm btn-ghost" onclick="rollbackDlg(dbSelected(), S.ym, loadDash)"' + (n(['SUBMITTED', 'REVIEWED', 'APPROVED', 'RETURNED']) ? '' : ' disabled') + '><i class="bi bi-arrow-counterclockwise"></i> ย้อนสถานะ</button>';
  h += '<button class="btn btn-sm btn-ghost" onclick="$$(\'.db-sel\').forEach(function(c){c.checked=false});$(\'dbAll\').checked=false;dbBar()">ยกเลิกการเลือก</button>';
  actionBar(h);
}
function bulkSubmit(){
  var ids = dbSelected();
  confirmBox('ส่งตรวจสอบหลายตำแหน่ง', 'ระบบจะดึงข้อมูลสแกนล่าสุดและตรวจทุกรายการก่อนส่ง ตำแหน่งที่ยังมีรายการต้องแก้ไขจะไม่ถูกส่ง\nหลังส่งแล้วจะแก้ไขไม่ได้ จนกว่าจะถูกส่งกลับแก้ไข', 'ส่งตรวจสอบ').then(function(ok){
    if (!ok) return;
    api('submitMonths', { ym: S.ym, positionIds: ids }, { block: 'กำลังดึงข้อมูลสแกนและตรวจรายการ…' }).then(function(r){ actionBar(''); resultBox('ผลการส่งตรวจสอบ', r.results); loadDash(); }).catch(function(){});
  });
}
function bulkReview(){
  var ids = dbSelected();
  confirmBox('ยืนยันผลการตรวจสอบ', 'ยืนยันว่าได้ตรวจสอบข้อมูลแล้วถูกต้อง และส่งต่อให้ผู้จัดการพิจารณาอนุมัติ', 'ผ่านการตรวจสอบ').then(function(ok){
    if (!ok) return;
    api('reviewMonths', { ym: S.ym, positionIds: ids }, { block: 'กำลังบันทึกผลการตรวจสอบ…' }).then(function(r){ actionBar(''); resultBox('ผลการตรวจสอบ', r.results); loadDash(); }).catch(function(){});
  });
}
function bulkApprove(){
  var ids = dbSelected().filter(function(id){ return S._dash.positions.some(function(p){ return p.positionId === id && p.status === 'REVIEWED'; }); });
  passwordBox('อนุมัติและล็อกข้อมูล', 'อนุมัติ ' + ids.length + ' ตำแหน่ง ของเดือน ' + thYm(S.ym) + '\nหลังอนุมัติ ข้อมูลจะถูกล็อกและแก้ไขไม่ได้', 'อนุมัติและล็อก', true).then(function(pw){
    if (pw === null) return;
    api('approveMonth', { ym: S.ym, positionIds: ids, password: pw }, { block: 'กำลังบันทึกการอนุมัติ…' }).then(function(){ actionBar(''); notify('อนุมัติและล็อกข้อมูลแล้ว ' + ids.length + ' ตำแหน่ง'); loadDash(); }).catch(function(){});
  });
}
/** ย้อนสถานะ (ผู้จัดการ/ผู้ดูแลระบบ) */
function rollbackDlg(ids, ym, after){
  if (!ids.length) return;
  Swal.fire({ icon: 'warning', title: 'ย้อนสถานะ ' + ids.length + ' ตำแหน่ง',
    html: '<div class="text-start"><label class="form-label">ย้อนกลับไปเป็นสถานะ</label><select id="rbTo" class="form-select mb-3"><option value="OPEN">อยู่ระหว่างบันทึก (ผู้บันทึกแก้ไขได้)</option><option value="SUBMITTED">รอตรวจสอบ</option><option value="REVIEWED">ตรวจสอบแล้ว รออนุมัติ</option></select>' +
      '<label class="form-label">เหตุผล (จะแสดงให้ผู้เกี่ยวข้องเห็น)</label><textarea id="rbWhy" class="form-control mb-3" rows="2" placeholder="เช่น ข้อมูลยังไม่ครบ ขอเปิดให้บันทึกเพิ่ม"></textarea>' +
      (S.boot.requirePw ? '<label class="form-label"><i class="bi bi-shield-lock"></i> รหัสผ่านของท่านเพื่อยืนยัน</label><input id="rbPw" type="password" class="form-control" autocomplete="current-password">' : '') + '</div>',
    showCancelButton: true, confirmButtonText: 'ย้อนสถานะ', cancelButtonText: 'ยกเลิก', reverseButtons: true, customClass: { confirmButton: 'swal-danger' },
    preConfirm: function(){ var w = $('rbWhy').value.trim(); if (!w) { Swal.showValidationMessage('กรุณาระบุเหตุผล'); return false; } if (S.boot.requirePw && !$('rbPw').value) { Swal.showValidationMessage('กรุณาใส่รหัสผ่าน'); return false; } return { to: $('rbTo').value, why: w, pw: S.boot.requirePw ? $('rbPw').value : '' }; }
  }).then(function(r){
    if (!r.isConfirmed) return;
    api('rollbackMonth', { ym: ym, positionIds: ids, toStatus: r.value.to, reason: r.value.why, password: r.value.pw }, { block: 'กำลังย้อนสถานะ…' }).then(function(x){ actionBar(''); resultBox('ผลการย้อนสถานะ', x.results); if (after) after(); }).catch(function(){});
  });
}

/* ---------- สรุปตามช่วงเวลา (ใช้ทั้งภาพรวมและหน้าของฉัน) ---------- */
function rangePane(host, mine){
  var st = S['range_' + (mine ? 'm' : 'd')] || { mode: 'quarter' };
  $(host).innerHTML = '<div class="filters">' + rangePicker(host + 'R', st) + '<button class="btn btn-brand align-self-end" id="' + host + 'Go"><i class="bi bi-funnel"></i> แสดงผล</button></div><div id="' + host + 'Out">' + skeleton(6) + '</div>';
  enhanceSelects($(host));
  var run = function(v){
    S['range_' + (mine ? 'm' : 'd')] = v;
    api('getRangeSummary', { from: v.from, to: v.to, mine: !!mine }, { btn: $(host + 'Go') }).then(function(d){ drawRange(host + 'Out', d, v, mine); }).catch(function(){});
  };
  initRange(host + 'R', run);
  $(host + 'Go').onclick = function(){ run(rangeValue(host + 'R')); };
  run(rangeValue(host + 'R'));
}
function drawRange(el, d, v, mine){
  var t = d.totals;
  var h = '<div class="small-muted mb-2"><i class="bi bi-calendar-range"></i> ' + esc(v.label) + ' (' + thDateFull(d.from) + ' – ' + thDateFull(d.to) + ')</div>';
  h += '<div class="kpis">' + kpi('journal-check', 'ic-info', 'รายการ', t.records) + kpi('calendar-check', 'ic-violet', 'จำนวนเวร', t.shifts) + kpi('hourglass-split', 'ic-warn', 'OT (ชั่วโมง)', t.ot, 1) +
    kpi('cash-coin', 'ic-brand', 'ค่าตอบแทนรวม (บาท)', t.duty + t.otAmt, 2) + (mine ? '' : kpi('people', 'ic-ok', 'จำนวนบุคลากร', t.people)) + '</div>';
  var maxA = Math.max.apply(null, d.months.map(function(m){ return m.duty + m.otAmt; }).concat([1]));
  h += '<div class="row g-3"><div class="col-xl-5"><div class="card h-100"><div class="card-h"><h3><i class="bi bi-bar-chart text-danger"></i> รายเดือน</h3></div><div class="card-b">' +
    d.months.map(function(m){ var a = m.duty + m.otAmt; return '<div class="bar-row"><span class="bl">' + esc(m.thMonth) + '</span><div class="bt"><i style="width:' + (a / maxA * 100) + '%"></i></div><span class="bv">' + fmt(a, 0) + '</span></div><div class="small-muted mb-2" style="padding-left:92px">' + fmt(m.shifts) + ' เวร · OT ' + fmt(m.ot, 1) + ' ชม.</div>'; }).join('') + '</div></div></div>';
  if (!mine) {
    h += '<div class="col-xl-7"><div class="tbl"><table class="table table-hover"><thead><tr><th>ตำแหน่ง</th><th class="num">คน</th><th class="num">เวร</th><th class="num">OT</th><th class="num">ค่าเวร</th><th class="num">ค่า OT</th><th class="num">รวม</th></tr></thead><tbody>' +
      (d.positions.map(function(p){ return '<tr><td><div class="who"><b>' + esc(p.name) + '</b><small>' + esc(p.groupName) + '</small></div></td><td class="num">' + p.people + '</td><td class="num">' + fmt(p.shifts) + '</td><td class="num">' + fmt(p.ot, 1) + '</td><td class="num">' + fmt(p.duty, 2) + '</td><td class="num">' + fmt(p.otAmt, 2) + '</td><td class="num fw-bold">' + fmt(p.duty + p.otAmt, 2) + '</td></tr>'; }).join('') || '<tr><td colspan="7">' + empty('inbox', 'ไม่มีข้อมูลในช่วงเวลานี้') + '</td></tr>') + '</tbody></table></div></div>';
  } else {
    h += '<div class="col-xl-7"><div class="card h-100"><div class="card-b"><div class="d-flex justify-content-between py-1"><span>ค่าเวร</span><b>' + fmt(t.duty, 2) + ' บาท</b></div><div class="d-flex justify-content-between py-1"><span>ค่า OT</span><b>' + fmt(t.otAmt, 2) + ' บาท</b></div><hr><div class="d-flex justify-content-between"><span>รวม</span><b class="text-danger">' + fmt(t.duty + t.otAmt, 2) + ' บาท</b></div><div class="small-muted mt-2">เป็นยอดประมาณการจากรายการที่บันทึก ยอดจริงเป็นไปตามที่อนุมัติและนำเข้า HRMi</div></div></div></div>';
  }
  $(el).innerHTML = h + '</div>';
  animateKpis();
}

/* ================= เวรและค่าตอบแทนของฉัน ================= */
PAGES.my = function(){
  mount(pageHead('งานของฉัน', 'เวรและค่าตอบแทนของฉัน', 'ตารางเวรที่ลงไว้ รายการปฏิบัติงานที่บันทึกแล้ว ผลการตรวจสอบเวลาสแกน และค่าตอบแทนโดยประมาณ') +
    '<ul class="nav nav-tabs mb-3" id="myTabs"><li class="nav-item"><a class="nav-link' + (S.myTab !== 'range' ? ' active' : '') + '" href="#" data-t="month"><i class="bi bi-calendar3"></i> รายเดือน</a></li><li class="nav-item"><a class="nav-link' + (S.myTab === 'range' ? ' active' : '') + '" href="#" data-t="range"><i class="bi bi-bar-chart"></i> สรุปตามช่วงเวลา</a></li></ul><div id="myPane"></div>');
  $$('#myTabs [data-t]').forEach(function(a){ a.onclick = function(e){ e.preventDefault(); $$('#myTabs .nav-link').forEach(function(x){ x.classList.remove('active'); }); a.classList.add('active'); S.myTab = a.dataset.t; myPane(); }; });
  myPane();
};
function myPane(){
  if (S.myTab === 'range') return rangePane('myPane', true);
  $('myPane').innerHTML = '<div class="filters">' + ymSelect('myYm', S.ym, 24, 2) + '<div class="ms-auto"><button class="btn btn-soft" onclick="go(\'booking\')"><i class="bi bi-calendar2-plus"></i> ลงตารางเวร</button></div></div><div id="myBody">' + skeleton(6) + '</div>';
  enhanceSelects($('myPane'));
  $('myYm').onchange = function(){ S.ym = this.value; loadMy(); };
  loadMy();
}
function loadMy(){
  api('getMyMonth', { ym: S.ym }).then(function(d){
    var t = d.totals;
    var h = demoBanner(S.ym) + '<div class="kpis">' + kpi('calendar-check', 'ic-info', 'จำนวนเวร', t.shifts) + kpi('hourglass-split', 'ic-violet', 'OT (ชั่วโมง)', t.ot, 1) + kpi('wallet2', 'ic-brand', 'ค่าเวร (บาท)', t.duty, 2) + kpi('cash-stack', 'ic-ok', 'ค่า OT (บาท)', t.otAmt, 2) + '</div>';
    h += '<div class="card mb-3"><div class="card-h"><h3><i class="bi bi-calendar2-week text-danger"></i> ตารางเวรที่ลงไว้</h3><span class="sub">กรอบเส้นประ = รออนุมัติ</span></div><div class="card-b">';
    h += d.schedule.length ? d.schedule.map(function(s){ return '<span class="chip ' + (s.status === 'PENDING' ? 'pend' : 'mine') + '" style="font-size:13px;padding:3px 9px">' + TH_D[dowOf(s.date)] + ' ' + thDate(s.date) + ' · <b>' + esc(lbl(s.slot)) + '</b> · ' + esc(s.positionName) + (s.note ? ' (' + esc(s.note) + ')' : '') + '</span>'; }).join(' ') : '<div class="small-muted">ยังไม่มีเวรในตาราง</div>';
    h += '</div></div><div class="card"><div class="card-h"><h3><i class="bi bi-journal-check text-danger"></i> รายการปฏิบัติงานที่บันทึกแล้ว</h3></div><div class="tbl border-0 shadow-none"><table class="table"><thead><tr><th>วันที่</th><th>ตำแหน่ง</th><th>เวลา</th><th>เวร</th><th class="num">OT</th><th>ผลสแกน</th><th class="num">ค่าตอบแทน (บาท)</th><th>ใบลืมสแกน</th></tr></thead><tbody>';
    d.records.forEach(function(r){
      var need = r.scanStatus === S.boot.scan.NONE || r.scanStatus === S.boot.scan.FORGOT || r.attachIds.length;
      h += '<tr><td class="text-nowrap">' + TH_D[dowOf(r.date)] + ' ' + thDate(r.date) + '</td><td>' + esc(r.positionName) + '</td><td class="tnum">' + r.timeIn + '–' + r.timeOut + (r.unit ? '<div class="small-muted">' + esc(r.unit) + '</div>' : '') + '</td><td>' + codesTag(r.shiftCodes) + '</td>' +
        '<td class="num">' + (r.noClaim ? '<span class="small-muted" title="' + esc(r.noClaimReason || '') + '">ไม่เบิก</span>' : fmt(r.otHours, 1)) + '</td><td>' + scanPill(r.scanStatus, r.lastScanOut) + '</td><td class="num">' + fmt(r.dutyAmt + r.otAmt, 2) + '</td><td>' + attachCell(r, need) + '</td></tr>';
    });
    if (!d.records.length) h += '<tr><td colspan="8">' + empty('journal', 'ยังไม่มีรายการในเดือนนี้') + '</td></tr>';
    h += '</tbody><tfoot><tr><td colspan="8">' + legendHtml() + '</td></tr></tfoot><tbody>';
    $('myBody').innerHTML = h + '</tbody></table></div></div>';
    animateKpis();
  }).catch(function(){});
}

/* ---------- ไฟล์แนบ ---------- */
function attachCell(r, show){
  var h = r.attachIds.map(function(id, i){ return '<a href="#" onclick="viewAtt(\'' + id + '\');return false" class="me-1 tag"><i class="bi bi-paperclip"></i>' + (i + 1) + '</a>'; }).join('');
  if (show) h += '<button class="btn btn-sm btn-soft py-0" onclick="pickAtt(\'' + r.id + '\')"><i class="bi bi-cloud-upload"></i> แนบไฟล์</button>';
  return h;
}
function pickAtt(recordId){
  var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*,application/pdf';
  inp.onchange = function(){
    var f = inp.files[0]; if (!f) return;
    if (f.size > 8 * 1024 * 1024) return alertBox('ไฟล์มีขนาดใหญ่เกินไป', 'แนบไฟล์ได้ไม่เกิน 8 MB', 'warning');
    var rd = new FileReader();
    rd.onload = function(){
      api('uploadAttachment', { recordId: recordId, fileName: f.name, mimeType: f.type, data: String(rd.result).split(',')[1] }, { block: 'กำลังอัปโหลดไฟล์…' })
        .then(function(rec){ notify('แนบไฟล์เรียบร้อย'); if (S.page === 'entry' && S.enRows) updateRecInBoard(rec); else refreshPage(); }).catch(function(){});
    };
    rd.readAsDataURL(f);
  };
  inp.click();
}
function viewAtt(id){
  api('getAttachment', { id: id }).then(function(f){
    var src = 'data:' + f.mimeType + ';base64,' + f.data;
    var body = f.mimeType.indexOf('image/') === 0 ? '<img src="' + src + '" style="max-width:100%;border-radius:12px">' : '<p><i class="bi bi-filetype-pdf"></i> ' + esc(f.fileName) + '</p>';
    modal(f.fileName, body, [{ text: '<i class="bi bi-download"></i> ดาวน์โหลด', cls: 'btn-soft', onClick: function(){ saveBlob(b64ToBlob(f.data, f.mimeType), f.fileName); return false; } },
      { text: '<i class="bi bi-trash"></i> ลบไฟล์', cls: 'btn-danger-soft', onClick: function(){ confirmBox('ลบไฟล์แนบ', 'ต้องการลบไฟล์นี้ใช่หรือไม่', 'ลบไฟล์', true).then(function(ok){ if (ok) api('deleteAttachment', { id: id }).then(function(rec){ notify('ลบไฟล์เรียบร้อย'); MDL.hide(); if (S.page === 'entry' && rec && rec.id) updateRecInBoard(rec); else refreshPage(); }).catch(function(){}); }); return false; } },
      { text: 'ปิด', cls: 'btn-ghost' }], 'lg');
  }).catch(function(){});
}
function refreshPage(){ go(S.page); }

/* ================= ลงตารางเวร ================= */
function manageIds(){ return posIdsFor(['ENTRY', 'REVIEWER', 'COORD']); }
PAGES.booking = function(){
  var ids = S.boot.positions.map(function(p){ return p.id; });
  var multi = manageIds().length > 1;
  mount(pageHead('งานของฉัน', 'ลงตารางเวร', 'เลือกเดือนและตำแหน่ง แล้วกด "ลงเวร" ในช่วงเวรที่ต้องการ ระบบควบคุมกรอบอัตรากำลังและป้องกันการลงเวรซ้ำช่วงเวลาให้อัตโนมัติ') +
    '<div class="filters">' + ymSelect('bkYm', S.bkYm || addYm(S.boot.ym, 1), 1, 2) + posSelect('bkPos', ids, S.bkPid || S.pid, multi, 'ทุกตาราง (ตำแหน่งที่ท่านดูแล)') + '</div><div id="bkState"></div><div id="bkBody">' + skeleton(8) + '</div>');
  $('bkYm').onchange = function(){ S.bkYm = this.value; loadBoard(); };
  $('bkPos').onchange = function(){ S.bkPid = this.value; if (this.value !== 'all') S.pid = this.value; loadBoard(); };
  loadBoard();
};
function loadBoard(){
  S.bkYm = $('bkYm').value; S.bkPid = $('bkPos').value;
  api('getBookingBoard', { ym: S.bkYm, positionId: S.bkPid }).then(function(b){ b.multi ? renderBoardAll(b) : renderBoard(b); }).catch(function(){});
}
function windowBanner(b, canManage){
  var st = b.windowState;
  var txt = { OPEN: 'เปิดให้ลงตารางเวรรอบเดือน ' + b.thMonth + ' ' + b.windowText, BEFORE: 'ตารางเวรรอบเดือน ' + b.thMonth + ' จะเปิดให้ลงเวร ' + b.windowText,
    CLOSED: 'ตารางเวรรอบเดือน ' + b.thMonth + ' ปิดการลงเวรแล้ว (' + b.windowText + ')', NONE: 'ตารางเวรรอบเดือน ' + b.thMonth + ' ยังไม่ได้กำหนดช่วงเวลาลงเวร' }[st];
  var cls = st === 'OPEN' ? 'wb-ok' : st === 'CLOSED' ? 'wb-closed' : 'wb-warn';
  var extra = st === 'OPEN' ? '' : canManage ? ' · ท่านมีสิทธิ์ลงเวรแทนและจัดตารางได้ตลอดเวลา' : ' · หากต้องการลงเวรหรือแก้ไข โปรดติดต่อแอดมินหน่วยงาน หรือเจ้าหน้าที่ประสานงาน';
  return '<div class="wbanner ' + cls + '">' + windowPill(st) + '<div class="flex-grow-1">' + esc(txt) + esc(extra) + '</div></div>';
}
function renderBoard(b){
  S._board = b;
  var h = demoBanner(b.ym) + windowBanner(b, b.manage);
  h += '<div class="d-flex flex-wrap gap-2 align-items-center mb-3"><span class="pill p-warn nodot"><i class="bi bi-hourglass-split"></i> รออนุมัติ ' + b.pending + '</span><span class="pill p-ok nodot"><i class="bi bi-check2-circle"></i> อนุมัติแล้ว ' + b.approved + '</span>' +
    (b.canApprove && b.pending ? '<button class="btn btn-sm btn-brand ms-auto" onclick="approveSched(this)"><i class="bi bi-check2-all"></i> อนุมัติตารางเวร (' + b.pending + ')</button>' : '') + '</div>' + legendHtml(b.position);
  if (b.manage) {
    h += '<div class="card mb-3"><div class="card-b d-flex flex-wrap gap-2 align-items-end"><div style="min-width:300px"><label class="form-label" for="bkFor">ลงเวรแทนเจ้าหน้าที่ (ไม่เลือก = ลงเวรให้ตนเอง)</label><select class="form-select" data-search id="bkFor"><option value="">— ลงเวรให้ตนเอง —</option>' +
      b.employees.map(function(e){ return '<option value="' + e.empCode + '" data-sub="' + esc(e.empCode + ' · ' + (e.hrPosition || '')) + '">' + esc(e.name) + ' (' + e.empCode + ')</option>'; }).join('') + '</select></div>' +
      '<div><label class="form-label" for="bkNote">หมายเหตุหน้าที่</label><input class="form-control" id="bkNote" placeholder="เช่น V/S, En" style="width:160px"></div></div></div>';
  } else {
    h += '<div class="mb-2" style="max-width:240px"><label class="form-label" for="bkNote">หมายเหตุหน้าที่ (ถ้ามี)</label><input class="form-control" id="bkNote" placeholder="เช่น V/S"></div>';
  }
  var canSelf = b.windowOpen && b.selfAllowed;
  h += '<div class="cal">' + TH_D.map(function(d){ return '<div class="dh">' + d + '</div>'; }).join('');
  for (var i = 0; i < (b.days.length ? b.days[0].dow : 0); i++) h += '<div class="blank"></div>';
  var D = S.boot.dayTypes;
  b.days.forEach(function(d){
    var cls = d.dayType === D.HOLIDAY ? 'hol' : d.dayType === D.CLOSED ? 'closed' : '';
    if (d.date === S.boot.today) cls += ' today';
    h += '<div class="day ' + cls + '"><div class="dn"><span>' + (+d.date.slice(8)) + ' <span class="d-md-none small-muted fw-normal">' + TH_DF[d.dow] + '</span></span>' + (d.dayType === D.HOLIDAY ? '<span class="pill p-brand nodot" style="font-size:11px">วันหยุด</span>' : '') + '</div>';
    if (d.note) h += '<div class="small-muted">' + esc(d.note) + '</div>';
    if (d.dayType === D.CLOSED) h += '<div class="small-muted"><i class="bi bi-slash-circle"></i> ปิดคลินิก</div>';
    else if (!d.slots.length) h += '<div class="small-muted"><i class="bi bi-dash-circle"></i> ไม่เปิดให้ลงเวร</div>';
    d.slots.forEach(function(s){
      var pct = d.quota ? Math.min(100, s.booked.length / d.quota * 100) : 0;
      h += '<div class="slot ' + (s.full ? 'full ' : '') + (s.closed ? 'sclosed' : '') + '"><div class="top"><span class="sl" title="' + esc(slotL(s.slot).name) + '">' + esc(slotL(s.slot).s) + (slotL(s.slot).en ? ' <small>' + esc(slotL(s.slot).en) + '</small>' : '') + '</span><span class="small-muted">' + s.booked.length + '/' + d.quota + '</span></div><div class="bar"><i style="width:' + pct + '%"></i></div>';
      if (s.closed) h += '<div class="small-muted" style="font-size:11px">ช่วงนี้ปิดแล้ว</div>';
      s.booked.forEach(function(x){
        var canX = b.manage || (x.mine && x.status === 'PENDING' && b.windowOpen);
        h += '<span class="chip ' + (x.mine ? 'mine ' : '') + (x.status === 'PENDING' ? 'pend' : '') + '" title="' + esc(x.empCode + ' ' + x.name + (x.note ? ' · ' + x.note : '')) + '">' + esc(shortName(x.name)) + (x.note ? ' <b>' + esc(x.note) + '</b>' : '') +
          (canX ? ' <span class="x" onclick="cancelBk(\'' + x.id + '\')" title="ยกเลิกเวร">×</span>' : '') + '</span>';
      });
      var mineHere = s.booked.some(function(x){ return x.mine; });
      if (!s.closed && !s.full) {
        if (b.manage || canSelf) { if (b.manage || !mineHere) h += '<div><button class="add-slot" onclick="bookSlot(this,\'' + d.date + '\',\'' + s.slot + '\')"><i class="bi bi-plus-circle"></i> ลงเวร</button></div>'; }
        else if (!mineHere) h += '<div><button class="add-slot off" onclick="bookBlocked()"><i class="bi bi-lock"></i> ลงเวร</button></div>';
      }
      h += '</div>';
    });
    h += '</div>';
  });
  $('bkBody').innerHTML = h + '</div><div class="small-muted mt-2"><span class="chip pend">กรอบเส้นประ</span> รออนุมัติ · <span class="chip mine">สีชมพู</span> เวรของท่าน · หลังตารางได้รับอนุมัติ การยกเลิกหรือแลกเวรต้องแจ้งหัวหน้างาน หรือเจ้าหน้าที่ประสานงาน</div>';
  enhanceSelects($('bkBody'));
}
function bookBlocked(){
  var b = S._board;
  if (!b.selfAllowed) return alertBox('ไม่มีสิทธิ์ลงเวรตำแหน่งนี้', 'ท่านยังไม่ได้รับสิทธิ์ขึ้นเวรตำแหน่ง ' + b.position.name + '\nโปรดติดต่อแอดมินหน่วยงาน หรือเจ้าหน้าที่ประสานงาน', 'warning');
  var t = { CLOSED: ['ปิดการลงตารางเวรแล้ว', 'ตารางรอบเดือน ' + b.thMonth + ' ปิดการลงเวรแล้ว'], BEFORE: ['ยังไม่เปิดลงตารางเวร', 'ตารางรอบเดือน ' + b.thMonth + ' จะเปิดให้ลงเวร ' + b.windowText], NONE: ['ยังไม่เปิดลงตารางเวร', 'ตารางรอบเดือน ' + b.thMonth + ' ยังไม่ได้กำหนดช่วงเวลาลงเวร'] }[b.windowState] || ['ไม่สามารถลงเวรได้', ''];
  alertBox(t[0], t[1] + '\nโปรดติดต่อแอดมินหน่วยงาน หรือเจ้าหน้าที่ประสานงาน', 'warning');
}
function shortName(n){ var p = String(n).split(' '); return p.length >= 3 ? p[1] + ' ' + p[2].slice(0, 1) + '.' : n; }
function bookSlot(btn, date, slot){
  var emp = $('bkFor') ? $('bkFor').value : '';
  api('book', { date: date, positionId: S.bkPid, slot: slot, empCode: emp, note: $('bkNote') ? $('bkNote').value : '' }, { btn: btn })
    .then(function(b){ notify('ลง' + slotL(slot).name + ' วันที่ ' + thDate(date) + ' เรียบร้อย'); var y = window.scrollY; var f = $('bkFor') ? $('bkFor').value : '', n = $('bkNote').value; renderBoard(b); if ($('bkFor')) setSel('bkFor', f); $('bkNote').value = n; window.scrollTo({ top: y, behavior: 'instant' }); }).catch(function(){});
}
function cancelBk(id){
  confirmBox('ยกเลิกเวร', 'ต้องการยกเลิกเวรนี้ใช่หรือไม่', 'ยกเลิกเวร', true).then(function(ok){
    if (ok) api('cancelBooking', { id: id }).then(function(b){ notify('ยกเลิกเวรเรียบร้อย'); var y = window.scrollY; renderBoard(b); window.scrollTo({ top: y, behavior: 'instant' }); }).catch(function(){});
  });
}
function approveSched(btn){
  passwordBox('อนุมัติตารางเวร', 'อนุมัติตารางเวร ' + S._board.position.name + ' เดือน ' + thYm(S.bkYm) + ' จำนวน ' + S._board.pending + ' รายการ', 'อนุมัติตารางเวร').then(function(pw){
    if (pw === null) return;
    api('approveSchedule', { ym: S.bkYm, positionId: S.bkPid, password: pw }, { btn: btn }).then(function(b){ notify('อนุมัติตารางเวรเรียบร้อย ' + b.approvedCount + ' รายการ'); renderBoard(b); }).catch(function(){});
  });
}
/** มุมมองทุกตาราง */
function renderBoardAll(b){
  S._boardAll = b;
  var D = S.boot.dayTypes;
  var pend = b.positions.filter(function(p){ return p.canApprove && p.pending; });
  var h = demoBanner(b.ym) + windowBanner(b, true);
  h += '<div class="d-flex flex-wrap gap-2 align-items-center mb-3"><span class="small-muted">' + b.positions.length + ' ตาราง · รออนุมัติรวม ' + b.positions.reduce(function(a, p){ return a + p.pending; }, 0) + ' รายการ · * = รออนุมัติ</span>' +
    (pend.length ? '<button class="btn btn-sm btn-brand ms-auto" onclick="approveAll(this)"><i class="bi bi-check2-all"></i> อนุมัติตารางที่เลือก</button>' : '') + '</div>';
  var emptyPos = b.positions.filter(function(p){ return !p.people.length; });
  if (emptyPos.length) h += '<div class="small-muted mb-3"><i class="bi bi-inbox"></i> ยังไม่มีผู้ลงเวร ' + emptyPos.length + ' ตาราง: ' + emptyPos.map(function(p){ return '<a href="#" class="me-2" onclick="setSel(\'bkPos\',\'' + p.id + '\');$(\'bkPos\').dispatchEvent(new Event(\'change\'));return false">' + esc(p.name) + '</a>'; }).join('') + '</div>';
  b.positions.filter(function(p){ return p.people.length; }).forEach(function(p){
    h += '<div class="card mb-3"><div class="card-h">' + (p.canApprove && p.pending ? '<input class="form-check-input ba-sel" type="checkbox" data-id="' + p.id + '" checked aria-label="เลือกอนุมัติ ' + esc(p.name) + '">' : '') +
      '<h3><a href="#" onclick="setSel(\'bkPos\',\'' + p.id + '\');$(\'bkPos\').dispatchEvent(new Event(\'change\'));return false">' + esc(p.name) + '</a></h3><span class="sub">' + esc(p.groupName) + '</span>' +
      '<span class="ms-auto d-flex gap-2"><span class="pill p-warn nodot">รออนุมัติ ' + p.pending + '</span><span class="pill p-ok nodot">อนุมัติแล้ว ' + p.approved + '</span></span></div>';
    h += '<div class="tbl border-0 shadow-none" style="border-radius:0 0 16px 16px"><table class="table table-bordered matrix"><thead><tr><th class="nm">ชื่อ-นามสกุล</th>' +
      b.dates.map(function(x){ return '<th class="' + (x.dayType !== D.WORKDAY ? 'we' : '') + '">' + x.d + '<br>' + TH_D[x.dow] + '</th>'; }).join('') + '<th>รวม</th></tr></thead><tbody>';
    p.people.forEach(function(x){ h += '<tr><td class="nm">' + esc(x.name) + '</td>' + b.dates.map(function(dd){ var v = x.days[dd.d] || ''; return '<td class="' + (dd.dayType !== D.WORKDAY ? 'we' : '') + (v.indexOf('*') >= 0 ? ' pendc' : '') + '">' + esc(lbl(v)) + '</td>'; }).join('') + '<td class="fw-bold">' + x.n + '</td></tr>'; });
    h += '</tbody></table></div></div>';
  });
  if (!b.positions.length) h += empty('calendar-x', 'ท่านยังไม่ได้รับสิทธิ์ดูแลตารางเวรของตำแหน่งใด');
  else h += legendHtml();
  $('bkBody').innerHTML = h;
}
function approveAll(btn){
  var ids = $$('.ba-sel').filter(function(c){ return c.checked; }).map(function(c){ return c.dataset.id; });
  if (!ids.length) return notify('กรุณาเลือกตารางที่ต้องการอนุมัติ', 'info');
  var n = S._boardAll.positions.filter(function(p){ return ids.indexOf(p.id) >= 0; }).reduce(function(a, p){ return a + p.pending; }, 0);
  passwordBox('อนุมัติตารางเวรหลายตาราง', 'อนุมัติ ' + ids.length + ' ตาราง รวม ' + n + ' รายการ ของเดือน ' + thYm(S.bkYm), 'อนุมัติทั้งหมด').then(function(pw){
    if (pw === null) return;
    api('approveSchedule', { ym: S.bkYm, positionIds: ids, password: pw }, { btn: btn, block: 'กำลังอนุมัติตารางเวร…' }).then(function(b){ notify('อนุมัติตารางเวรเรียบร้อย ' + b.approvedCount + ' รายการ'); renderBoardAll(b); }).catch(function(){});
  });
}

/* ================= ตารางเวรรวม ================= */
PAGES.overview = function(){
  mount(pageHead('งานของฉัน', 'ตารางเวรรวม', 'ภาพรวมตารางเวรของทุกตำแหน่งในเดือนที่เลือก · เครื่องหมาย * หมายถึงรออนุมัติ') + '<div class="filters">' + ymSelect('ovYm', S.ym, 6, 2) +
    '<div><label class="form-label" for="ovQ">ค้นหาชื่อ / ตำแหน่ง</label><input class="form-control" id="ovQ" placeholder="พิมพ์ชื่อบุคลากรหรือตำแหน่ง"></div></div><div id="ovBody">' + skeleton(6) + '</div>');
  $('ovYm').onchange = function(){ S.ym = this.value; loadOv(); };
  $('ovQ').oninput = function(){ if (S._ov) drawOv(); };
  loadOv();
};
function loadOv(){ api('getScheduleOverview', { ym: $('ovYm').value }).then(function(d){ S._ov = d; drawOv(); }).catch(function(){}); }
function drawOv(){
  var d = S._ov, D = S.boot.dayTypes, h = '', q = $('ovQ').value.trim().toLowerCase();
  d.positions.forEach(function(p){
    var pm = !q || p.name.toLowerCase().indexOf(q) >= 0;
    var people = p.people.filter(function(x){ return pm || (x.name + ' ' + x.empCode).toLowerCase().indexOf(q) >= 0; });
    if (!people.length) return;
    h += '<div class="card mb-3"><div class="card-h"><h3>' + esc(p.name) + '</h3><span class="sub">' + people.length + ' คน</span></div><div class="tbl border-0 shadow-none" style="border-radius:0 0 16px 16px"><table class="table table-bordered matrix"><thead><tr><th class="nm">ชื่อ-นามสกุล</th>' +
      d.dates.map(function(x){ return '<th class="' + (x.dayType !== D.WORKDAY ? 'we' : '') + '">' + x.d + '<br>' + TH_D[x.dow] + '</th>'; }).join('') + '</tr></thead><tbody>';
    people.forEach(function(x){ h += '<tr><td class="nm">' + esc(x.name) + '</td>' + d.dates.map(function(dd){ return '<td class="' + (dd.dayType !== D.WORKDAY ? 'we' : '') + '">' + esc(lbl(x.days[dd.d] || '')) + '</td>'; }).join('') + '</tr>'; });
    h += '</tbody></table></div></div>';
  });
  $('ovBody').innerHTML = demoBanner(d.ym) + (h ? h + legendHtml() : '') + (h ? '' : empty('calendar-x', q ? 'ไม่พบข้อมูลตามคำค้นหา' : 'ยังไม่มีตารางเวรในเดือนนี้'));
}

/* ================= บันทึกเวลาปฏิบัติงาน ================= */
var UNITS = ['X-Ray', 'CT Scan', 'MRI', 'ULTRASOUND', 'MAMMOGRAM'];
PAGES.entry = function(){
  var ids = posIdsFor(['ENTRY']);
  mount(pageHead('งานประจำเดือน', 'บันทึกเวลาปฏิบัติงาน', 'บันทึกเวลาเข้า–ออกตามใบลงชื่อ เลือกหลายแถวแล้วกดบันทึกครั้งเดียว ระบบคำนวณเวร/OT และเทียบกับเวลาสแกนให้ทันทีก่อนบันทึก',
      '<button class="btn btn-ghost" onclick="pullScans(this)"><i class="bi bi-fingerprint"></i> ดึงเวลาสแกน</button>' +
      '<div class="dropdown"><button class="btn btn-ghost dropdown-toggle" data-bs-toggle="dropdown"><i class="bi bi-printer"></i> ใบลงชื่อ</button><ul class="dropdown-menu dropdown-menu-end">' +
      '<li><a class="dropdown-item" href="#" onclick="signSheets(false);return false"><i class="bi bi-people me-2"></i>พิมพ์ตามตารางเวร (PDF)</a></li><li><a class="dropdown-item" href="#" onclick="signSheets(true);return false"><i class="bi bi-file-earmark me-2"></i>พิมพ์แบบไม่มีรายชื่อ (PDF)</a></li></ul></div>') +
    '<div class="filters">' + ymSelect('enYm', S.ym, 3, 1) + posSelect('enPos', ids, S.enPid || S.pid, ids.length > 1, 'ทุกตำแหน่งที่ท่านบันทึก') +
    '<div><label class="form-label">แสดง</label><div class="seg" id="enSeg"><button data-f="all" class="on">ทั้งหมด</button><button data-f="todo">ยังไม่บันทึก</button><button data-f="prob">ต้องแก้ไข</button><button data-f="done">บันทึกแล้ว</button></div></div>' +
    '<div><label class="form-label" for="enQ">ค้นหาบุคลากร</label><input class="form-control" id="enQ" placeholder="ชื่อ หรือรหัส" style="min-width:170px"></div>' +
    '<div><label class="form-label" for="enSort">เรียงลำดับ</label><select class="form-select" id="enSort" data-search><option value="date">ตามวันที่</option><option value="prob">รายการต้องแก้ไขก่อน</option><option value="name">ตามชื่อบุคลากร</option></select></div>' +
    '<div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="enAll"><label class="form-check-label small" for="enAll">แสดงทุกวัน</label></div>' +
    '<div class="ms-auto d-flex gap-2 align-self-end"><button class="btn btn-soft" onclick="fillStd()"><i class="bi bi-magic"></i> ใส่เวลามาตรฐาน</button><button class="btn btn-brand" id="enSaveTop" onclick="saveSelected(this)"><i class="bi bi-save"></i> บันทึกรายการที่เลือก</button></div></div>' +
    '<div id="enHead"></div><div id="enBody">' + skeleton(10) + '</div><datalist id="enUnits">' + UNITS.map(function(u){ return '<option value="' + u + '">'; }).join('') + '</datalist>');
  if (!ids.length) { $('enBody').innerHTML = empty('shield-lock', 'ท่านยังไม่ได้รับสิทธิ์ผู้บันทึกข้อมูลของตำแหน่งใด โปรดติดต่อผู้ดูแลระบบ'); return; }
  S.enFilter = 'all';
  $('enYm').onchange = function(){ var el = this; enGuard(function(ok){ if (ok) { S.ym = el.value; loadEntry(); } else setSel('enYm', S.ym); }); };
  $('enPos').onchange = function(){ var el = this; enGuard(function(ok){ if (ok) { S.enPid = el.value; if (el.value !== 'all') S.pid = el.value; loadEntry(); } else setSel('enPos', S.enPid || S.pid); }); };
  $('enAll').onchange = renderEntry;
  $('enSort').onchange = renderEntry;
  var qt = null; $('enQ').oninput = function(){ clearTimeout(qt); qt = setTimeout(renderEntry, 200); };
  $$('#enSeg button').forEach(function(b){ b.onclick = function(){ $$('#enSeg button').forEach(function(x){ x.classList.remove('on'); }); b.classList.add('on'); S.enFilter = b.dataset.f; renderEntry(); }; });
  loadEntry();
};
function enGuard(cb){
  var dirty = Object.keys(S.enRows || {}).filter(function(k){ return S.enRows[k].dirty; }).length;
  if (!dirty) return cb(true);
  confirmBox('มีรายการที่ยังไม่ได้บันทึก', dirty + ' แถวที่แก้ไขแล้วยังไม่ได้กดบันทึก ต้องการออกจากหน้านี้โดยไม่บันทึกใช่หรือไม่', 'ออกโดยไม่บันทึก', true).then(cb);
}
function loadEntry(keep){
  S.ym = $('enYm').value; S.enPid = $('enPos').value;
  return api('getEntrySheet', { ym: S.ym, positionId: S.enPid }).then(function(d){ S._en = d; buildRows(keep); renderEntry(true); }).catch(function(){});
}
function enPos(pid){ return S._en.positions[pid] || {}; }
function enEditable(pid){ return !!S._en.editablePos[pid]; }
function hasUnit(pid){ return /รังสี/.test(enPos(pid).groupName || ''); }
function buildRows(keep){
  var d = S._en, rows = {}, order = [];
  var old = keep ? S.enRows : {};
  d.days.forEach(function(x){
    var recorded = {};
    x.records.forEach(function(r){
      recorded[r.positionId + '|' + r.empCode] = 1;
      var sch = x.scheduled.filter(function(s){ return s.empCode === r.empCode && s.positionId === r.positionId; })[0];
      var k = 'r_' + r.id, o = old[k];
      rows[k] = { key: k, id: r.id, pid: r.positionId, date: x.date, empCode: r.empCode, name: r.name, slot: sch ? sch.slot : '', note: r.note, sheetNo: r.sheetNo,
        tin: o && o.dirty ? o.tin : r.timeIn, tout: o && o.dirty ? o.tout : r.timeOut, noClaim: o && o.dirty ? o.noClaim : r.noClaim, noClaimReason: o && o.dirty ? o.noClaimReason : r.noClaimReason, unit: o && o.dirty ? o.unit : r.unit,
        rec: r, scans: r.scanTimes ? r.scanTimes.split(' ') : (sch ? sch.scans : null), inactive: r.empStatus === 'INACTIVE', dirty: !!(o && o.dirty), sel: !!(o && o.sel), err: '' };
      order.push(k);
    });
    x.scheduled.forEach(function(s){
      if (recorded[s.positionId + '|' + s.empCode]) return;
      var k = 's_' + x.date + '_' + s.positionId + '_' + s.empCode, o = old[k];
      rows[k] = { key: k, pid: s.positionId, date: x.date, empCode: s.empCode, name: s.name, slot: s.slot, note: s.note, sheetNo: String(s.sheetNo), pending: s.status === 'PENDING',
        tin: o ? o.tin : '', tout: o ? o.tout : '', noClaim: o ? o.noClaim : false, noClaimReason: o ? o.noClaimReason : '', unit: o ? o.unit : unitFromNote(s.note, s.positionId), scans: s.scans, covered: s.covered, dirty: !!(o && o.dirty), sel: !!(o && o.sel), err: o ? o.err : '' };
      order.push(k);
    });
  });
  Object.keys(old).forEach(function(k){ if (k.indexOf('n_') === 0 && !rows[k]) { rows[k] = old[k]; order.push(k); } });
  S.enRows = rows; S.enOrder = order;
}
function unitFromNote(note, pid){ if (!hasUnit(pid)) return ''; var n = String(note || '').trim().toLowerCase(); return UNITS.filter(function(u){ return u.toLowerCase() === n; })[0] || ''; }
function dayOf(date){ return S._en.days.filter(function(x){ return x.date === date; })[0]; }
function rowState(r){
  if (r.rec && !r.dirty) return (r.rec.blocking && r.rec.scanStatus !== S.boot.scan.PENDING) ? 'prob' : 'done';
  return 'todo';
}
function defaultTimes(slot, pid){
  var p = enPos(pid), L = +p.shiftMinutes || 240;
  var list = String(slot || 'บ1').split(',');
  var st = list.indexOf('ช1') >= 0 ? (p.morningStart || '08:00') : list.indexOf('ช2') >= 0 ? (p.afternoonStart || '12:00') : String(p.eveningStart || '16:00').split(',')[0];
  var end = addMin(st, L * list.length);
  // พักกลางวัน (เช่น แผนไทย ช2 เริ่ม 13:00)
  if (list.indexOf('ช1') >= 0 && list.indexOf('ช2') >= 0) { var gap = tMin(p.afternoonStart || '12:00') - (tMin(st) + L); if (gap > 0 && gap <= 90) end = addMin(end, gap); }
  return { tin: st, tout: end };
}
function previewHtml(r){
  var day = dayOf(r.date) || { dayType: S.boot.dayTypes.WORKDAY };
  if (r.rec && !r.dirty) {
    var rr = r.rec;
    return codesTag(rr.shiftCodes) + (rr.otHours ? ' <span class="tag">OT ' + fmt(rr.otHours, 1) + '</span>' : '') + (rr.noClaim ? ' <span class="flag">ไม่เบิก OT' + (rr.noClaimReason ? ': ' + esc(rr.noClaimReason) : '') + '</span>' : '') +
      '<div class="mt-1">' + scanPill(rr.scanStatus, rr.lastScanOut) + '</div>' + rr.flags.map(function(f){ return '<span class="flag ' + (rr.blocking ? 'bad' : '') + '">' + esc(f) + '</span>'; }).join('');
  }
  if (!r.tin && !r.tout) return '<span class="small-muted">ยังไม่บันทึก</span>';
  var c = RULES.compute(r.tin, r.tout, day.dayType, enPos(r.pid), S._en.rules);
  if (c.err) return '<span class="err-msg"><i class="bi bi-x-circle"></i> ' + esc(c.err) + '</span>';
  var open = (day.openSlots || {})[r.pid];
  var closed = open && c.codes.some(function(x){ return open.indexOf(x) < 0; });
  var h = codesTag(c.codes.join(',')) + (c.ot ? ' <span class="tag">OT ' + fmt(c.ot, 1) + '</span>' : '') + (c.cap ? ' <span class="flag">ตัด OT เหลือสูงสุด</span>' : '') +
    (c.noOt ? '<span class="flag">ตำแหน่งนี้ไม่มี OT (ไม่คิดส่วนที่เกิน)</span>' : '') + (r.noClaim ? '<span class="flag">ไม่เบิก OT' + (r.noClaimReason ? ': ' + esc(r.noClaimReason) : ' — ยังไม่ระบุเหตุผล') + '</span>' : '') +
    (c.odd ? '<span class="flag">เวลาเริ่มไม่ตรงเวลามาตรฐานของตำแหน่ง</span>' : '') + (closed ? '<span class="flag">ช่วงเวรนี้ไม่ได้เปิดให้ลงเวรในวันดังกล่าว</span>' : '');
  h += '<div class="mt-1">' + scanCompare(r) + '</div>';
  return h + '<span class="small-muted">' + (r.dirty ? 'แก้ไขแล้ว · ยังไม่บันทึก' : '') + '</span>';
}
function scanCompare(r){
  if (!r.scans) return '<span class="pill p-slate">ยังไม่ดึงข้อมูลสแกน</span>';
  var I = tMin(r.tin), O = tMin(r.tout);
  var after = r.scans.map(tMin).filter(function(m){ return m !== null && m >= I; });
  if (!r.scans.length) return '<span class="pill p-bad">ไม่พบข้อมูลสแกนทั้งวัน</span><span class="flag bad">ต้องแนบใบลืมสแกนหลังบันทึก</span>';
  if (!after.length) return '<span class="pill p-bad">ลืมสแกนออก</span><span class="flag bad">ต้องแนบใบลืมสแกนหลังบันทึก</span>';
  var last = Math.max.apply(null, after);
  if (last >= O - (+S._en.rules.tol || 0)) return '<span class="pill p-ok">สแกนออก ' + mTime(last) + '</span>';
  return '<span class="pill p-warn">สแกนออก ' + mTime(last) + ' ก่อนเวลาออก</span><span class="flag bad">แก้เวลาออกให้ไม่เกิน ' + mTime(last) + '</span>';
}
function scanCell(r){
  if (!r.scans) return '<span class="small-muted">—</span>';
  if (!r.scans.length) return '<span class="small-muted">ไม่มี</span>';
  return '<span class="scan-t">' + r.scans.map(function(t){ return '<b>' + esc(t) + '</b>'; }).join(' · ') + '</span>';
}
function visibleKeys(){
  var f = S.enFilter || 'all', q = ($('enQ') ? $('enQ').value : '').trim().toLowerCase();
  return S.enOrder.filter(function(k){ var r = S.enRows[k]; return (f === 'all' || rowState(r) === f) && (!q || (r.name + ' ' + r.empCode).toLowerCase().indexOf(q) >= 0 || r.isNewRow); });
}
function enHeadHtml(){
  var d = S._en;
  if (!d.multi) return '<div class="d-flex flex-wrap gap-2 align-items-center mb-2">' + statusPill(d.status) + '<span class="small-muted">' + esc(d.position.name) + ' · ' + esc(d.thMonth) + ' · สแกนล่าสุด ' + esc(d.lastScanSync || '-') + '</span>' +
    (d.reason ? '<span class="pill p-bad nodot">ส่งกลับแก้ไข: ' + esc(d.reason) + '</span>' : '') + (!d.editable ? '<span class="pill p-closed nodot"><i class="bi bi-lock"></i> เปิดดูอย่างเดียว</span>' : '') + '</div>' + legendHtml(d.position);
  return '<div class="d-flex flex-wrap gap-2 align-items-center mb-2"><span class="small-muted">' + d.positionIds.length + ' ตำแหน่ง · ' + esc(d.thMonth) + ' · สแกนล่าสุด ' + esc(d.lastScanSync || '-') + '</span></div><div class="d-flex flex-wrap gap-1 mb-2">' +
    d.positionIds.map(function(pid){ return '<span class="chip" style="font-size:12.5px;padding:2px 8px">' + esc(d.positions[pid].name) + ' ' + statusPill(d.statuses[pid]) + '</span>'; }).join('') + '</div>' + legendHtml();
}
function renderEntry(first){
  var d = S._en; if (!d) return;
  var y = window.scrollY;
  var all = $('enAll').checked, f = S.enFilter || 'all', sort = $('enSort').value;
  var cnt = { todo: 0, prob: 0, done: 0 };
  S.enOrder.forEach(function(k){ cnt[rowState(S.enRows[k])]++; });
  $$('#enSeg button').forEach(function(b){ var n = b.dataset.f === 'all' ? S.enOrder.length : cnt[b.dataset.f]; b.innerHTML = b.textContent.replace(/\s*\d+$/, '') + '<span class="n">' + n + '</span>'; });
  $('enHead').innerHTML = demoBanner(d.ym) + enHeadHtml();
  var ed = d.editable, unitCol = d.positionIds.some(hasUnit);
  var cols = 9 + (unitCol ? 1 : 0);
  var h = '<div class="tbl"><table class="table"><thead><tr><th style="width:36px">' + (ed ? '<input class="form-check-input" type="checkbox" id="enChkAll" aria-label="เลือกทั้งหมดที่แสดง">' : '') + '</th><th style="width:56px">ใบที่</th><th>บุคลากร</th>' + (unitCol ? '<th>จุดปฏิบัติงาน</th>' : '') + '<th>เวลาเข้า</th><th>เวลาออก</th><th>เวลาสแกนของวัน</th><th>ผลคำนวณ / ตรวจสแกน</th><th title="ไม่เบิกค่า OT">ไม่เบิก OT</th><th></th></tr></thead><tbody>';
  var D = S.boot.dayTypes, shown = 0, vis = visibleKeys();
  if (sort === 'date') {
    d.days.forEach(function(x){
      var keys = vis.filter(function(k){ return S.enRows[k].date === x.date; });
      if (!keys.length && !(all && f === 'all' && !$('enQ').value)) return;
      shown++;
      var cls = x.dayType === D.HOLIDAY ? 'hol' : x.dayType === D.CLOSED ? 'closed' : '';
      var q = d.multi ? '' : ' · กรอบ ' + x.quota;
      h += '<tr class="day-h ' + cls + '" id="dh_' + x.date + '"><td>' + (ed && keys.length ? '<input class="form-check-input en-day" type="checkbox" data-date="' + x.date + '" aria-label="เลือกทั้งวัน">' : '') + '</td><td colspan="' + (cols - 1) + '"><div class="d-flex flex-wrap gap-2 align-items-center">' + TH_DF[x.dow] + ' ' + thDate(x.date) + ' ' + dayTypePill(x.dayType) +
        '<span class="small-muted fw-normal">ในตาราง ' + x.scheduled.length + ' · บันทึกแล้ว ' + x.records.length + q + '</span>' +
        (ed && x.dayType !== D.CLOSED ? '<button class="btn btn-sm btn-link ms-auto py-0 text-decoration-none" onclick="addRow(\'' + x.date + '\')"><i class="bi bi-plus-circle"></i> เพิ่มผู้ปฏิบัติงานนอกตาราง</button>' : '') + '</div></td></tr>';
      keys.forEach(function(k){ h += rowHtml(S.enRows[k], unitCol); });
    });
  } else {
    var keys = vis.slice();
    if (sort === 'prob') keys.sort(function(a, b){ var ra = S.enRows[a], rb = S.enRows[b]; var w = function(r){ var s = rowState(r); return s === 'prob' ? 0 : s === 'todo' ? 1 : 2; }; return (w(ra) - w(rb)) || (ra.date < rb.date ? -1 : 1); });
    else keys.sort(function(a, b){ var ra = S.enRows[a], rb = S.enRows[b]; return ra.name.localeCompare(rb.name, 'th') || (ra.date < rb.date ? -1 : 1); });
    keys.forEach(function(k){ h += rowHtml(S.enRows[k], unitCol, true); });
    shown = keys.length;
  }
  if (!shown) h += '<tr><td colspan="' + cols + '">' + empty(f === 'prob' ? 'emoji-smile' : 'calendar-x', f === 'prob' ? 'ไม่มีรายการที่ต้องแก้ไข' : 'ไม่พบรายการ (เปิด "แสดงทุกวัน" เพื่อบันทึกผู้ปฏิบัติงานนอกตาราง)') + '</td></tr>';
  $('enBody').innerHTML = h + '</tbody></table></div>';
  bindEntry($('enBody'));
  enBar();
  if (!first) window.scrollTo({ top: y, behavior: 'instant' });
}
function rowHtml(r, unitCol, showDate){
  var ed = enEditable(r.pid) || (r.isNewRow && S._en.editable);
  var k = r.key, cls = (r.inactive ? 'inactive ' : '') + (r.dirty ? 'row-dirty ' : '') + (r.err ? 'row-err ' : '') + (r.sel ? 'row-sel' : '');
  var sub = esc(r.empCode) + (r.slot ? ' · ตาราง <span class="tag">' + esc(lbl(r.slot)) + '</span>' : ' · <span class="text-warning">นอกตาราง</span>') + (r.pending ? ' · รออนุมัติ' : '') + (r.note ? ' · ' + esc(r.note) : '');
  var who = '<div class="who"><b>' + esc(r.name) + '</b><small>' + (showDate ? TH_D[dowOf(r.date)] + ' ' + thDate(r.date) + ' · ' : '') + sub + '</small>' + (S._en.multi ? '<span class="tag mt-1">' + esc(enPos(r.pid).name) + '</span>' : '') + '</div>';
  if (r.isNewRow) {
    var eds = S._en.positionIds.filter(enEditable);
    who = (showDate ? '<div class="small-muted">' + thDate(r.date) + '</div>' : '') +
      (S._en.multi ? '<select class="form-select form-select-sm mb-1" data-k="' + k + '" data-f="pid">' + eds.map(function(pid){ return '<option value="' + pid + '"' + (pid === r.pid ? ' selected' : '') + '>' + esc(enPos(pid).name) + '</option>'; }).join('') + '</select>' : '') +
      '<select class="form-select form-select-sm" data-search data-k="' + k + '" data-f="emp"><option value="">— เลือกบุคลากร —</option>' +
      S._en.employees.filter(function(e){ return !e.allowed.length || e.allowed.indexOf(r.pid) >= 0; }).map(function(e){ return '<option value="' + e.empCode + '" data-sub="' + e.empCode + '"' + (e.empCode === r.empCode ? ' selected' : '') + '>' + esc(e.name) + '</option>'; }).join('') + '</select>';
  }
  var menu = '';
  if (r.rec) {
    var need = r.rec.scanStatus === S.boot.scan.NONE || r.rec.scanStatus === S.boot.scan.FORGOT || r.rec.attachIds.length;
    menu = attachCell(r.rec, ed && need) + (ed ? ' <button class="btn btn-icon btn-sm btn-ghost" title="ลบรายการ" onclick="delRec(\'' + r.id + '\')"><i class="bi bi-trash3"></i></button>' : '');
  } else if (r.isNewRow) menu = '<button class="btn btn-icon btn-sm btn-ghost" title="ลบแถว" onclick="delem(\'' + k + '\')"><i class="bi bi-x-lg"></i></button>';
  var dt = defaultTimes(r.slot, r.pid);
  return '<tr id="tr_' + k + '" class="' + cls + '"><td>' + (ed ? '<input class="form-check-input en-sel" type="checkbox" data-k="' + k + '"' + (r.sel ? ' checked' : '') + ' aria-label="เลือก">' : '') + '</td>' +
    '<td>' + (ed ? '<input class="form-control form-control-sm text-center" data-k="' + k + '" data-f="sheetNo" value="' + esc(r.sheetNo) + '" style="width:48px">' : esc(r.sheetNo)) + '</td>' +
    '<td>' + who + (r.err ? '<span class="err-msg"><i class="bi bi-exclamation-circle"></i> ' + esc(r.err) + '</span>' : '') + '</td>' +
    (unitCol ? '<td>' + (hasUnit(r.pid) ? (ed ? '<input class="form-control form-control-sm" list="enUnits" data-k="' + k + '" data-f="unit" value="' + esc(r.unit || '') + '" style="width:110px" placeholder="เช่น X-Ray">' : esc(r.unit || '')) : '') + '</td>' : '') +
    '<td>' + (ed ? '<input class="form-control form-control-sm t-in" data-k="' + k + '" data-f="tin" value="' + esc(r.tin) + '" placeholder="' + dt.tin + '" inputmode="numeric">' : esc(r.tin)) + '</td>' +
    '<td>' + (ed ? '<input class="form-control form-control-sm t-in" data-k="' + k + '" data-f="tout" value="' + esc(r.tout) + '" placeholder="' + dt.tout + '" inputmode="numeric">' : esc(r.tout)) + '</td>' +
    '<td>' + scanCell(r) + '</td><td class="preview" id="pv_' + k + '">' + previewHtml(r) + '</td>' +
    '<td>' + (ed ? '<div class="form-check form-switch m-0"><input class="form-check-input" type="checkbox" data-k="' + k + '" data-f="noClaim"' + (r.noClaim ? ' checked' : '') + ' aria-label="ไม่เบิก OT"></div>' : (r.noClaim ? '<span title="' + esc(r.noClaimReason || '') + '">ไม่เบิก</span>' : '')) + '</td>' +
    '<td class="text-nowrap text-end">' + menu + '</td></tr>';
}
/** อัปเดตเฉพาะแถวที่เปลี่ยน (หน้าจอไม่กระโดด) */
function refreshRows(keys){
  var unitCol = S._en.positionIds.some(hasUnit), flat = $('enSort').value !== 'date';
  keys.forEach(function(k){
    var tr = $('tr_' + k), r = S.enRows[k]; if (!tr || !r) return;
    var tmp = document.createElement('tbody'); tmp.innerHTML = rowHtml(r, unitCol, flat);
    var nt = tmp.firstChild; tr.parentNode.replaceChild(nt, tr);
    bindEntry(nt);
  });
  var cnt = { todo: 0, prob: 0, done: 0 };
  S.enOrder.forEach(function(k){ cnt[rowState(S.enRows[k])]++; });
  $$('#enSeg button').forEach(function(b){ var n = b.dataset.f === 'all' ? S.enOrder.length : cnt[b.dataset.f]; b.innerHTML = b.textContent.replace(/\s*\d+$/, '') + '<span class="n">' + n + '</span>'; });
  enBar();
}
function markRow(k){ var tr = $('tr_' + k), r = S.enRows[k]; if (!tr) return; tr.classList.toggle('row-dirty', !!r.dirty); tr.classList.toggle('row-sel', !!r.sel); tr.classList.toggle('row-err', !!r.err); var c = tr.querySelector('.en-sel'); if (c) c.checked = !!r.sel; }
function bindEntry(root){
  enhanceSelects(root);
  $$('[data-f]', root).forEach(function(inp){
    var k = inp.dataset.k, f = inp.dataset.f;
    if (!k) return;
    var upd = function(final){
      var r = S.enRows[k]; if (!r) return;
      if (f === 'noClaim') {
        if (!final) return;
        r.noClaim = inp.checked;
        if (inp.checked) {
          promptBox('ไม่เบิกค่า OT', 'เหตุผลที่ไม่เบิก OT (จำเป็น)', 'เช่น ขอไม่เบิก / ปฏิบัติงานแทนเวลาราชการ', r.noClaimReason || '').then(function(v){
            if (v === null) { inp.checked = false; r.noClaim = false; } else r.noClaimReason = String(v).trim();
            var pv2 = $('pv_' + k); if (pv2) pv2.innerHTML = previewHtml(r);
          });
        } else r.noClaimReason = '';
      }
      else if (f === 'emp') { var e = S._en.employees.filter(function(x){ return x.empCode === inp.value; })[0]; r.empCode = inp.value; r.name = e ? e.name : ''; }
      else if (f === 'pid') { r.pid = inp.value; r.dirty = true; r.sel = true; refreshRows([k]); return; }
      else if (f === 'tin' || f === 'tout') { if (final) { var n = normT(inp.value); if (inp.value && !n) inp.classList.add('bad'); else { inp.classList.remove('bad'); inp.value = n; } r[f] = n || inp.value; } else r[f] = normT(inp.value) || inp.value; }
      else r[f] = inp.value;
      r.dirty = true; r.err = ''; r.sel = true;
      markRow(k);
      var pv = $('pv_' + k); if (pv) pv.innerHTML = previewHtml(r);
      enBar();
    };
    inp.addEventListener('input', function(){ upd(false); });
    inp.addEventListener('change', function(){ upd(true); });
    if (f === 'tin' || f === 'tout') inp.addEventListener('keydown', function(e){
      if (e.key === 'Enter') { e.preventDefault(); var ins = $$('#enBody .t-in'); var i = ins.indexOf(inp); if (ins[i + 1]) ins[i + 1].focus(); }
    });
  });
  $$('.en-sel', root).forEach(function(c){ c.onchange = function(){ var r = S.enRows[c.dataset.k]; r.sel = c.checked; markRow(r.key); enBar(); }; });
  $$('.en-day', root).forEach(function(c){ c.onchange = function(){ $$('.en-sel').forEach(function(x){ var r = S.enRows[x.dataset.k]; if (r.date === c.dataset.date) { r.sel = c.checked; markRow(r.key); } }); enBar(); }; });
  var all = root.querySelector ? root.querySelector('#enChkAll') : null;
  if (all) all.onchange = function(){ var on = this.checked; $$('.en-sel').forEach(function(x){ S.enRows[x.dataset.k].sel = on; markRow(x.dataset.k); }); enBar(); };
}
function selectedKeys(){ return S.enOrder.filter(function(k){ return S.enRows[k].sel; }); }
function enBar(){
  var ks = selectedKeys();
  if (!ks.length || !S._en || !S._en.editable) return actionBar('');
  actionBar('<span class="cnt"><i class="bi bi-check2-square"></i> เลือก ' + ks.length + ' แถว</span>' +
    '<button class="btn btn-sm btn-ghost" onclick="fillStd()"><i class="bi bi-magic"></i> ใส่เวลามาตรฐาน</button>' +
    '<button class="btn btn-sm btn-brand" onclick="saveSelected(this)"><i class="bi bi-save"></i> บันทึก ' + ks.length + ' แถว</button>' +
    '<button class="btn btn-sm btn-ghost" onclick="clearSel()">ยกเลิกการเลือก</button>');
}
function clearSel(){ var ks = selectedKeys(); ks.forEach(function(k){ S.enRows[k].sel = false; markRow(k); }); $$('.en-day,#enChkAll').forEach(function(c){ c.checked = false; }); enBar(); }
function fillStd(){
  var ks = selectedKeys();
  var auto = false;
  if (!ks.length) { ks = visibleKeys().filter(function(k){ var r = S.enRows[k]; return !r.rec && !r.tin && !r.tout && r.slot && enEditable(r.pid); }); auto = true; }
  if (!ks.length) return notify('ไม่มีแถวที่ต้องใส่เวลา (กรุณาเลือกแถว หรือทุกแถวมีเวลาแล้ว)', 'info');
  var done = [];
  ks.forEach(function(k){ var r = S.enRows[k]; if ((r.rec && !r.dirty && auto) || !enEditable(r.pid)) return; var t = defaultTimes(r.slot, r.pid); r.tin = t.tin; r.tout = t.tout; r.dirty = true; r.sel = true; r.err = ''; done.push(k); });
  refreshRows(done);
  notify('ใส่เวลามาตรฐานให้ ' + done.length + ' แถว กรุณาตรวจกับใบลงชื่อ แก้เฉพาะรายการที่แตกต่าง แล้วกดบันทึก', 'info');
}
function addRow(date){
  var k = 'n_' + Date.now();
  var pid = S._en.multi ? S._en.positionIds.filter(enEditable)[0] : S._en.positionIds[0];
  S.enRows[k] = { key: k, pid: pid, date: date, empCode: '', name: '', slot: '', sheetNo: '', tin: '', tout: '', noClaim: false, unit: '', scans: null, isNewRow: true, dirty: true, sel: true, err: '' };
  var idx = -1; S.enOrder.forEach(function(x, i){ if (S.enRows[x].date === date) idx = i; });
  if (idx < 0) { S.enOrder.push(k); $('enAll').checked = true; } else S.enOrder.splice(idx + 1, 0, k);
  renderEntry();
  var el = document.querySelector('#tr_' + k + ' .combo-btn'); if (el) { el.scrollIntoView({ block: 'center' }); el.click(); }
}
function delem(k){ delete S.enRows[k]; S.enOrder = S.enOrder.filter(function(x){ return x !== k; }); var tr = $('tr_' + k); if (tr) tr.remove(); enBar(); }
function recToRow(rec, prev){
  return { key: 'r_' + rec.id, id: rec.id, pid: rec.positionId, date: rec.date, empCode: rec.empCode, name: rec.name, slot: prev ? prev.slot : '', note: rec.note, sheetNo: rec.sheetNo, tin: rec.timeIn, tout: rec.timeOut, noClaim: rec.noClaim, noClaimReason: rec.noClaimReason || '', unit: rec.unit, rec: rec,
    scans: rec.scanTimes ? rec.scanTimes.split(' ') : (prev ? prev.scans : null), inactive: rec.empStatus === 'INACTIVE', dirty: false, sel: false, err: '' };
}
function updateRecInBoard(rec){
  var k = 'r_' + rec.id; var old = S.enRows[k]; if (!old) return refreshPage();
  S.enRows[k] = recToRow(rec, old);
  var day = dayOf(rec.date); if (day) { day.records = day.records.filter(function(y){ return y.id !== rec.id; }); day.records.push(rec); }
  refreshRows([k]);
}
function saveSelected(btn){
  var ks = selectedKeys().filter(function(k){ var r = S.enRows[k]; return !(r.rec && !r.dirty); });
  if (!ks.length) return notify('ยังไม่ได้เลือกแถวที่ต้องบันทึก (ติ๊กช่องหน้าแถว หรือแก้ไขเวลาแล้วระบบจะเลือกให้)', 'info');
  var missing = ks.filter(function(k){ var r = S.enRows[k]; return !normT(r.tin) || !normT(r.tout) || !r.empCode; });
  if (missing.length) { missing.forEach(function(k){ S.enRows[k].err = 'กรุณาระบุบุคลากรและเวลาเข้า–ออกให้ครบ'; }); refreshRows(missing); return alertBox('ข้อมูลยังไม่ครบถ้วน', missing.length + ' แถวยังไม่มีเวลาเข้า–ออก (แถวที่มีข้อความสีแดง)', 'warning'); }
  var items = ks.map(function(k){ var r = S.enRows[k]; return { key: k, id: r.id || '', date: r.date, positionId: r.pid, empCode: r.empCode, sheetNo: r.sheetNo, timeIn: normT(r.tin), timeOut: normT(r.tout), noClaim: !!r.noClaim, noClaimReason: r.noClaim ? (r.noClaimReason || '') : '', note: r.note || '', unit: r.unit || '' }; });
  api('saveRecords', { items: items }, { btn: btn, btnText: 'กำลังบันทึก ' + items.length + ' แถว', block: items.length > 15 ? 'กำลังบันทึก ' + items.length + ' แถว…' : '' }).then(function(res){
    var changed = [], replaced = false;
    res.results.forEach(function(x){
      var r = S.enRows[x.key]; if (!r) return;
      if (x.ok) {
        var rec = x.rec, nk = 'r_' + rec.id;
        var nr = recToRow(rec, r);
        delete S.enRows[x.key]; S.enRows[nk] = nr;
        S.enOrder = S.enOrder.map(function(k){ return k === x.key ? nk : k; });
        var tr = $('tr_' + x.key); if (tr) tr.id = 'tr_' + nk; else replaced = true;
        var day = dayOf(rec.date); if (day) { day.records = day.records.filter(function(y){ return y.id !== rec.id; }); day.records.push(rec); }
        changed.push(nk);
      } else { r.err = x.error; r.sel = true; changed.push(x.key); }
    });
    if (replaced) renderEntry(); else refreshRows(changed);
    changed.forEach(function(k){ var tr = $('tr_' + k); if (tr && S.enRows[k] && S.enRows[k].rec && !S.enRows[k].err) tr.classList.add('row-saved'); });
    if (res.failed) alertBox('บันทึกแล้ว ' + res.saved + ' แถว · ไม่สำเร็จ ' + res.failed + ' แถว', 'แถวที่ไม่สำเร็จแสดงเหตุผลเป็นข้อความสีแดงใต้ชื่อ กรุณาแก้ไขแล้วกดบันทึกอีกครั้ง', 'warning');
    else notify('บันทึกเรียบร้อย ' + res.saved + ' แถว');
  }).catch(function(){});
}
function delRec(id){
  confirmBox('ลบรายการ', 'ต้องการลบรายการนี้ใช่หรือไม่ (ระบบเก็บประวัติการลบไว้)', 'ลบรายการ', true).then(function(ok){
    if (!ok) return;
    api('deleteRecord', { id: id }).then(function(){ notify('ลบรายการเรียบร้อย'); loadEntry(true); }).catch(function(){});
  });
}
function pullScans(btn){
  var ids = S._en ? S._en.positionIds : [S.pid];
  var chain = Promise.resolve(), tot = 0;
  ids.forEach(function(pid){ chain = chain.then(function(){ return api('syncPositionScans', { ym: S.ym, positionId: pid }, { quiet: true }).then(function(r){ tot += r.codes || 0; }); }); });
  btnBusy(btn, true, 'กำลังดึงข้อมูลสแกน');
  chain.then(function(){ btnBusy(btn, false); notify('ดึงข้อมูลสแกนเรียบร้อย ' + tot + ' คน'); loadEntry(true); }).catch(function(e){ btnBusy(btn, false); alertBox('ดึงข้อมูลสแกนไม่สำเร็จ', e.message, 'warning'); });
}
function signSheets(blank){
  var pid = S.enPid === 'all' ? null : S.enPid;
  if (!pid) return alertBox('กรุณาเลือกตำแหน่ง', 'การพิมพ์ใบลงชื่อ กรุณาเลือกทีละตำแหน่ง', 'info');
  api('exportSignSheets', { ym: S.ym, positionId: pid, blank: blank }, { block: 'กำลังจัดทำใบลงชื่อ…' }).then(function(r){ download(r.files); }).catch(function(){});
}

/* ================= ตรวจสอบและอนุมัติ ================= */
PAGES.review = function(){
  var ids = posIdsFor(['ENTRY', 'REVIEWER', 'MANAGER']);
  mount(pageHead('งานประจำเดือน', 'ตรวจสอบและอนุมัติ', 'ตรวจสอบรายละเอียดทีละตำแหน่ง หากต้องการดำเนินการหลายตำแหน่งพร้อมกัน ใช้หน้า <a href="#" onclick="go(\'dashboard\');return false">ภาพรวมการดำเนินงาน</a>') +
    '<div class="filters">' + ymSelect('rvYm', S.ym, 6, 0) + posSelect('rvPos', ids, S.pid) + '</div><div id="rvBody">' + skeleton(8) + '</div>');
  $('rvYm').onchange = function(){ S.ym = this.value; loadReview(); };
  $('rvPos').onchange = function(){ S.pid = this.value; loadReview(); };
  loadReview();
};
function loadReview(){
  S.ym = $('rvYm').value; S.pid = $('rvPos').value;
  api('getReview', { ym: S.ym, positionId: S.pid }).then(renderReview).catch(function(){});
}
function renderReview(d){
  S._rv = d;
  var st = d.status, blk = d.records.filter(function(r){ return r.blocking && r.scanStatus !== S.boot.scan.PENDING; }).length, fl = d.records.filter(function(r){ return r.flags.length; }).length;
  var btn = '';
  if (d.canSubmit && (st === 'OPEN' || st === 'RETURNED')) btn += '<button class="btn btn-brand" onclick="rvAct(\'submit\',this)"><i class="bi bi-send"></i> ส่งตรวจสอบ</button>';
  if (d.canReview && st === 'SUBMITTED') btn += '<button class="btn btn-ok" onclick="rvAct(\'pass\',this)"><i class="bi bi-check2-circle"></i> ผ่านการตรวจสอบ</button>';
  if (d.canReview && (st === 'SUBMITTED' || st === 'REVIEWED')) btn += '<button class="btn btn-danger-soft" onclick="rvAct(\'return\',this)"><i class="bi bi-arrow-return-left"></i> ส่งกลับแก้ไข</button>';
  if (d.canApprove && st === 'REVIEWED') btn += '<button class="btn btn-brand" onclick="rvAct(\'approve\',this)"><i class="bi bi-lock"></i> อนุมัติและล็อก</button>';
  if (d.canApprove && st !== 'OPEN') btn += '<button class="btn btn-ghost" onclick="rollbackDlg([S.pid], S.ym, loadReview)"><i class="bi bi-arrow-counterclockwise"></i> ย้อนสถานะ</button>';
  var tot = { s: 0, o: 0, a: 0 }; d.people.forEach(function(p){ tot.s += p.shifts; tot.o += p.ot; tot.a += p.duty + p.otAmt; });
  var h = demoBanner(d.ym) + '<div class="card mb-3"><div class="card-b d-flex flex-wrap gap-3 align-items-center"><div>' + statusPill(st) + '</div><div><b>' + esc(d.position.name) + '</b> <span class="small-muted">· ' + esc(d.thMonth) + '</span></div>' +
    '<div class="ms-auto d-flex gap-2 flex-wrap">' + btn + '</div>' + (d.reason ? '<div class="w-100"><span class="pill p-bad nodot">เหตุผล: ' + esc(d.reason) + '</span></div>' : '') + '</div></div>';
  h += '<div class="kpis">' + kpi('journal-check', 'ic-info', 'รายการ', d.records.length) + kpi('exclamation-octagon', blk ? 'ic-bad' : 'ic-ok', 'ต้องแก้ไขก่อนส่ง', blk) + kpi('flag', fl ? 'ic-warn' : 'ic-ok', 'มีข้อสังเกต', fl) + kpi('cash-coin', 'ic-brand', 'ค่าตอบแทน (บาท)', tot.a, 2) + '</div>';
  h += '<ul class="nav nav-tabs mb-3" id="rvTabs"><li class="nav-item"><a class="nav-link active" href="#" data-t="people"><i class="bi bi-people"></i> สรุปรายบุคคล</a></li><li class="nav-item"><a class="nav-link" href="#" data-t="recs"><i class="bi bi-list-ul"></i> รายการทั้งหมด</a></li>' +
    '<li class="nav-item"><a class="nav-link" href="#" data-t="miss"><i class="bi bi-person-dash"></i> ไม่มีรายการบันทึก (' + d.missing.length + ')</a></li><li class="nav-item"><a class="nav-link" href="#" data-t="hist"><i class="bi bi-clock-history"></i> ประวัติสถานะ</a></li></ul><div id="rvTab"></div>';
  $('rvBody').innerHTML = h;
  animateKpis();
  $$('#rvTabs [data-t]').forEach(function(a){ a.onclick = function(e){ e.preventDefault(); $$('#rvTabs .nav-link').forEach(function(x){ x.classList.remove('active'); }); a.classList.add('active'); rvTab(a.dataset.t); }; });
  rvTab('people');
}
function rvTab(t){
  var d = S._rv, h = '';
  if (t === 'people') {
    h = '<div class="tbl"><table class="table table-hover"><thead><tr><th>รหัส</th><th>ชื่อ-นามสกุล</th><th class="num">เวร</th><th class="num">OT (ชม.)</th><th class="num">ค่าเวร</th><th class="num">ค่า OT</th><th class="num">รวม</th></tr></thead><tbody>' +
      (d.people.map(function(p){ return '<tr><td class="tnum">' + p.empCode + '</td><td>' + esc(p.name) + '</td><td class="num">' + fmt(p.shifts) + '</td><td class="num">' + fmt(p.ot, 1) + '</td><td class="num">' + fmt(p.duty, 2) + '</td><td class="num">' + fmt(p.otAmt, 2) + '</td><td class="num fw-bold">' + fmt(p.duty + p.otAmt, 2) + '</td></tr>'; }).join('') || '<tr><td colspan="7">' + empty('people', 'ยังไม่มีรายการ') + '</td></tr>') + '</tbody></table></div>';
  } else if (t === 'recs') {
    $('rvTab').innerHTML = '<div class="d-flex flex-wrap gap-3 align-items-center mb-2"><input class="form-control" id="rvQ" placeholder="ค้นหาชื่อ / รหัส" style="max-width:240px"><div class="form-check form-switch m-0"><input class="form-check-input" type="checkbox" id="rvOnly"><label class="form-check-label" for="rvOnly">เฉพาะรายการที่มีข้อสังเกต</label></div></div><div id="rvRecs"></div>';
    var draw = function(){
      var only = $('rvOnly').checked, q = $('rvQ').value.trim().toLowerCase();
      $('rvRecs').innerHTML = '<div class="tbl"><table class="table table-hover"><thead><tr><th>วันที่</th><th>ใบ</th><th>บุคลากร</th><th>เวลา</th><th>เวร</th><th class="num">OT</th><th>ผลสแกน</th><th>ไฟล์</th><th>ข้อสังเกต</th></tr></thead><tbody>' +
        d.records.filter(function(r){ return (!only || r.flags.length || r.blocking) && (!q || (r.name + ' ' + r.empCode).toLowerCase().indexOf(q) >= 0); }).map(function(r){
          return '<tr' + (r.empStatus === 'INACTIVE' ? ' class="inactive"' : '') + '><td class="text-nowrap">' + TH_D[dowOf(r.date)] + ' ' + thDate(r.date) + '</td><td>' + esc(r.sheetNo) + '</td><td><div class="who"><b>' + esc(r.name) + '</b><small>' + r.empCode + (r.unit ? ' · ' + esc(r.unit) : '') + '</small></div></td><td class="tnum text-nowrap">' + r.timeIn + '–' + r.timeOut + '</td><td>' + codesTag(r.shiftCodes) + '</td>' +
            '<td class="num">' + (r.noClaim ? '<span title="' + esc(r.noClaimReason || '') + '">ไม่เบิก</span>' : fmt(r.otHours, 1)) + '</td><td>' + scanPill(r.scanStatus, r.lastScanOut) + '</td><td>' + attachCell(r, false) + '</td><td>' + r.flags.map(function(f){ return '<span class="flag ' + (r.blocking ? 'bad' : '') + '">' + esc(f) + '</span>'; }).join('') + esc(r.note) + '</td></tr>';
        }).join('') + '</tbody></table></div>' + legendHtml();
    };
    $('rvOnly').onchange = draw; $('rvQ').oninput = draw; draw(); return;
  } else if (t === 'miss') {
    h = d.missing.length ? '<div class="tbl"><table class="table"><thead><tr><th>วันที่</th><th>บุคลากร</th><th>เวร</th></tr></thead><tbody>' + d.missing.map(function(m){ return '<tr><td>' + TH_D[dowOf(m.date)] + ' ' + thDate(m.date) + '</td><td>' + esc(m.name) + '</td><td>' + codesTag(m.slot) + '</td></tr>'; }).join('') + '</tbody></table></div><div class="small-muted mt-2">บุคลากรที่อยู่ในตารางเวรแต่ยังไม่มีรายการบันทึก (อาจไม่ได้มาปฏิบัติงาน หรือยังไม่ได้บันทึก)</div>' : empty('check2-circle', 'บุคลากรทุกคนในตารางมีรายการบันทึกแล้ว');
  } else {
    h = '<div class="card card-b">' + (d.history.slice().reverse().map(function(x){ return '<div class="help-step"><div class="n"><i class="bi bi-dot"></i></div><div><b>' + esc(x.action) + '</b> · ' + esc(x.by) + ' <span class="small-muted">' + esc(x.at) + '</span>' + (x.reason ? '<div class="small-muted">' + esc(x.reason) + '</div>' : '') + '</div></div>'; }).join('') || empty('clock', 'ยังไม่มีประวัติ')) + '</div>';
  }
  $('rvTab').innerHTML = h;
}
function rvAct(a, btn){
  var p = { ym: S.ym, positionId: S.pid };
  if (a === 'return') {
    promptBox('ส่งกลับแก้ไข', 'เหตุผล (ผู้บันทึกข้อมูลจะเห็นข้อความนี้)', 'เช่น โปรดตรวจสอบใบที่ 2 วันที่ 5 อีกครั้ง').then(function(reason){
      if (!reason) return;
      p.action = 'return'; p.reason = reason;
      api('reviewMonth', p).then(function(){ notify('ส่งกลับแก้ไขเรียบร้อย'); loadReview(); }).catch(function(){});
    });
    return;
  }
  if (a === 'approve') {
    passwordBox('อนุมัติและล็อกข้อมูล', 'อนุมัติ ' + S._rv.position.name + ' เดือน ' + S._rv.thMonth + '\nหลังอนุมัติ ข้อมูลจะถูกล็อกและแก้ไขไม่ได้', 'อนุมัติและล็อก', true).then(function(pw){
      if (pw === null) return;
      p.password = pw;
      api('approveMonth', p, { btn: btn }).then(function(){ notify('อนุมัติและล็อกข้อมูลเรียบร้อย'); loadReview(); }).catch(function(){});
    });
    return;
  }
  var txt = { submit: ['ส่งตรวจสอบ', 'ระบบจะดึงข้อมูลสแกนล่าสุดและตรวจทุกรายการก่อนส่ง\nหลังส่งแล้วจะแก้ไขไม่ได้ จนกว่าจะถูกส่งกลับแก้ไข'], pass: ['ยืนยันผลการตรวจสอบ', 'ยืนยันว่าได้ตรวจสอบข้อมูลแล้วถูกต้อง และส่งต่อให้ผู้จัดการพิจารณาอนุมัติ'] }[a];
  confirmBox(txt[0], txt[1], txt[0]).then(function(ok){
    if (!ok) return;
    var call = a === 'submit' ? api('submitMonth', p, { block: 'กำลังดึงข้อมูลสแกนและตรวจรายการ…' }) : api('reviewMonth', Object.assign(p, { action: 'pass' }), { btn: btn });
    call.then(function(){ notify(txt[0] + 'เรียบร้อย'); loadReview(); }).catch(function(){});
  });
}

/* ================= จัดพิมพ์และส่งออกเอกสาร ================= */
PAGES.export = function(){
  var ids = posIdsFor(['ENTRY', 'REVIEWER', 'COORD', 'MANAGER']);
  var xl = S.boot.canExcel;
  var h = pageHead('งานประจำเดือน', 'จัดพิมพ์และส่งออกเอกสาร', 'เอกสารจะดาวน์โหลดลงเครื่องของท่านทันที และระบบเก็บสำเนาทุกฉบับไว้ในคลังเอกสาร (Google Drive) โดยไม่เขียนทับฉบับเดิม') +
    '<div class="filters">' + ymSelect('exYm', S.ym, 14, 0, 'รอบเดือน') + '</div><div id="exDemo"></div><div class="row g-3">';
  h += '<div class="col-xl-6"><div class="card h-100"><div class="card-h"><div class="ic-box ic-brand"><i class="bi bi-table"></i></div><div><h3>ตารางเวรและตาราง OT</h3><div class="sub">รูปแบบเดียวกับเอกสารแนบเบิก มีช่องลงนามผู้ตรวจสอบและผู้รับรอง</div></div></div><div class="card-b">' +
    posSelect('exPos', ids, 'all', true) +
    '<div class="mt-2"><label class="form-label">ประเภทเอกสาร</label><div class="seg w-100" id="exDoc"><button type="button" data-v="duty">ตารางเวร</button><button type="button" data-v="ot">ตาราง OT</button><button type="button" data-v="both" class="on">ทั้งสองแบบ</button></div></div>' +
    '<div class="mt-2"><label class="form-label" for="exKind">ฉบับ</label><select class="form-select" id="exKind"><option value="pay">ฉบับเบิกจ่าย (แสดงจำนวนเงิน)</option><option value="check">ฉบับตรวจสอบ (ไม่แสดงจำนวนเงิน)</option></select></div>' +
    '<div class="mt-3 d-flex gap-2 flex-wrap"><button class="btn btn-brand" onclick="exTables(\'pdf\',this)"><i class="bi bi-filetype-pdf"></i> ดาวน์โหลด PDF</button>' +
    (xl ? '<button class="btn btn-ghost" onclick="exTables(\'xlsx\',this)"><i class="bi bi-file-earmark-excel"></i> ดาวน์โหลด Excel</button>' : '<span class="small-muted align-self-center"><i class="bi bi-lock"></i> ไฟล์ Excel สำหรับผู้ดูแลระบบเท่านั้น</span>') + '</div>' +
    '<div class="small-muted mt-2">ตำแหน่งที่ยังไม่อนุมัติ เอกสารจะมีข้อความ "ฉบับร่าง – ยังไม่ได้รับอนุมัติ" · มีเลขหน้าและข้อมูลผู้จัดพิมพ์ทุกหน้า</div></div></div></div>';
  h += '<div class="col-xl-6"><div class="card h-100"><div class="card-h"><div class="ic-box ic-info"><i class="bi bi-pen"></i></div><div><h3>ใบลงชื่อปฏิบัติงาน FM-HRM-031</h3><div class="sub">ใบที่ k คือบุคลากรลำดับที่ k ของแต่ละวัน</div></div></div><div class="card-b">' + posSelect('exSignPos', posIdsFor(['ENTRY', 'REVIEWER']), S.pid) +
    '<div class="mt-2"><label class="form-label" for="exSheets">จำนวนใบ (ไม่ระบุ = ตามตารางเวร/กรอบ)</label><input class="form-control" id="exSheets" type="number" min="1" max="30" style="max-width:140px"></div>' +
    '<div class="mt-3 d-flex gap-2 flex-wrap"><button class="btn btn-brand" onclick="exSign(false,this)"><i class="bi bi-people"></i> พิมพ์ตามตารางเวร</button><button class="btn btn-ghost" onclick="exSign(true,this)"><i class="bi bi-file-earmark"></i> พิมพ์แบบไม่มีรายชื่อ</button></div></div></div></div>';
  h += '<div class="col-xl-6"><div class="card h-100"><div class="card-h"><div class="ic-box ic-warn"><i class="bi bi-paperclip"></i></div><div><h3>ใบลืมสแกนรวมเล่ม</h3><div class="sub">รวมไฟล์แนบทั้งเดือนเป็น PDF ไฟล์เดียว พร้อมหัวกระดาษระบุรายการ</div></div></div><div class="card-b">' + posSelect('exAttPos', ids, 'all', true) +
    '<div class="mt-3"><button class="btn btn-brand" onclick="printAttachments($(\'exYm\').value,$(\'exAttPos\').value)"><i class="bi bi-printer"></i> รวมเป็น PDF และดาวน์โหลด</button></div><div class="small-muted mt-2">เรียงตามตำแหน่งและวันที่ · ไฟล์รูปและ PDF รวมอยู่ในเล่มเดียว</div></div></div></div>';
  if (has('COORD')) {
    h += '<div class="col-xl-6"><div class="card h-100"><div class="card-h"><div class="ic-box ic-ok"><i class="bi bi-database-up"></i></div><div><h3>ไฟล์นำเข้า HRMi</h3><div class="sub">ส่งออกได้เฉพาะตำแหน่งที่อนุมัติแล้ว · นำเข้า HRMi ภายในวันที่ 4 ของเดือนถัดไป</div></div></div><div class="card-b">' +
      '<div class="row g-2"><div class="col-sm-6"><label class="form-label" for="hrType">ประเภท</label><select class="form-select" id="hrType"><option value="all">ค่าเวรและค่า OT</option><option value="duty">ค่าเวร</option><option value="ot">ค่า OT</option></select></div>' +
      '<div class="col-sm-6"><label class="form-label" for="hrMode">รูปแบบไฟล์</label><select class="form-select" id="hrMode"><option value="combined">ไฟล์เดียว (1 ชีทต่อรหัสรายได้)</option><option value="split">แยกไฟล์ตามรหัสรายได้</option><option value="zip">ZIP (แยกไฟล์รวมในไฟล์เดียว)</option></select></div></div>' +
      '<div class="mt-3"><button class="btn btn-brand" onclick="exHRMi(this)"><i class="bi bi-download"></i> ดาวน์โหลดไฟล์ HRMi</button></div><div id="hrRes" class="small-muted mt-2"></div></div></div></div>';
  }
  mount(h + '</div>');
  $('exYm').onchange = function(){ S.ym = this.value; $('exDemo').innerHTML = demoBanner(S.ym); };
  $('exDemo').innerHTML = demoBanner($('exYm').value);
  $$('#exDoc button').forEach(function(b){ b.onclick = function(){ $$('#exDoc button').forEach(function(x){ x.classList.remove('on'); }); b.classList.add('on'); }; });
};
function exTables(fmt2, btn){
  var on = $$('#exDoc .on')[0], doc = on ? on.dataset.v : 'both';
  api('exportTables', { ym: $('exYm').value, positionIds: [$('exPos').value], docType: doc, kind: $('exKind').value, format: fmt2 }, { btn: btn, block: 'กำลังจัดทำเอกสาร อาจใช้เวลา 10–60 วินาที…' }).then(function(r){ download(r.files); }).catch(function(){});
}
function exSign(blank, btn){
  api('exportSignSheets', { ym: $('exYm').value, positionId: $('exSignPos').value, blank: blank, sheets: $('exSheets').value }, { btn: btn, block: 'กำลังจัดทำใบลงชื่อ…' }).then(function(r){ download(r.files); }).catch(function(){});
}
function exHRMi(btn){
  api('exportHRMi', { ym: $('exYm').value, type: $('hrType').value, mode: $('hrMode').value }, { btn: btn, block: 'กำลังจัดทำไฟล์ HRMi…' }).then(function(r){
    download(r.files);
    $('hrRes').innerHTML = 'รหัสรายได้: ' + esc(r.codes.join(', ')) + (r.notApproved.length ? '<div class="text-danger">ยังไม่อนุมัติ (ไม่รวมในไฟล์): ' + esc(r.notApproved.join(', ')) + '</div>' : '');
  }).catch(function(){});
}
