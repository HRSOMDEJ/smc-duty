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
  $('dbPane').innerHTML = '<div class="filters">' + ymSelect('dbYm', S.ym) + pickBtn('dbPick', dbIds()) +
    '<div><label class="form-label" for="dbQ">ค้นหาตำแหน่ง</label><input class="form-control" id="dbQ" placeholder="ชื่อตำแหน่ง / กลุ่ม"></div>' +
    '<div><label class="form-label" for="dbSt">สถานะ</label><select class="form-select" id="dbSt" data-search><option value="">ทุกสถานะ</option>' + Object.keys(S.boot.mstatus).map(function(k){ return '<option value="' + k + '">' + esc(S.boot.mstatus[k]) + '</option>'; }).join('') + '</select></div>' +
    '<div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="dbProb"><label class="form-check-label small" for="dbProb">เรียงรายการติดปัญหาก่อน</label></div>' +
    '<div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="dbHideEmpty" checked><label class="form-check-label small" for="dbHideEmpty">ซ่อนตำแหน่งที่ไม่มีรายการ</label></div>' +
    '<div class="ms-auto small-muted align-self-end" id="dbSync"></div></div><div id="dbBody">' + skeleton(8) + '</div>';
  enhanceSelects($('dbPane'));
  $('dbYm').onchange = function(){ S.ym = this.value; loadDash(); };
  ['dbQ', 'dbSt', 'dbProb', 'dbHideEmpty'].forEach(function(id){ $(id).addEventListener(id === 'dbQ' ? 'input' : 'change', drawDash); });
  pickBind('dbPick', dbIds(), drawDash);
  loadDash();
}
function dbIds(){ return has('COORD') || has('MANAGER') ? S.boot.positions.map(function(p){ return p.id; }) : posIdsFor(['ENTRY', 'REVIEWER']); }
function loadDash(){
  apiView('getDashboard', { ym: S.ym }, function(d){ if (d.ym && d.ym !== S.ym) return; S._dash = d; drawDash(); }).catch(function(){});
}
function drawDash(){
  var d = S._dash; if (!d || !$('dbBody')) return;
  $('dbSync').innerHTML = '<i class="bi bi-arrow-repeat"></i> ข้อมูลสแกนล่าสุด ' + esc(d.lastScanSync || '-') + '<br><i class="bi bi-send"></i> ' + esc(d.submitWindow.text) + ' · ส่ง HRMi ภายในวันที่ ' + d.deadline;
  var q = $('dbQ').value.trim().toLowerCase(), stF = $('dbSt').value, hide = $('dbHideEmpty').checked;
  var ps = pickIn(dbIds());
  var list = d.positions.filter(function(p){ return (!ps.length || ps.indexOf(p.positionId) >= 0) && (!q || (p.name + ' ' + p.groupName).toLowerCase().indexOf(q) >= 0) && (!stF || p.status === stF) && (!hide || p.records || p.scheduled || p.status !== 'OPEN'); });
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
      '<td class="text-nowrap text-end"><button class="btn btn-sm btn-soft" onclick="S.pid=\'' + p.positionId + '\';S.enPid=\'' + p.positionId + '\';go(\'entry\')"><i class="bi bi-ui-checks-grid"></i> บันทึก</button> <button class="btn btn-sm btn-ghost" onclick="S.rvSt=\'' + p.status + '\';go(\'review\');setTimeout(function(){rvDetail([\'' + p.positionId + '\'])},900)"><i class="bi bi-patch-check"></i> ตรวจสอบ</button></td></tr>';
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
  if (has('REVIEWER') || has('COORD')) h += '<button class="btn btn-sm btn-ok" onclick="bulkReview(this)"' + (n(['SUBMITTED']) ? '' : ' disabled') + '><i class="bi bi-check2-circle"></i> ผ่านการตรวจสอบ (' + n(['SUBMITTED']) + ')</button>';
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
    api('approveMonths', { ym: S.ym, positionIds: ids, password: pw }, { block: 'กำลังบันทึกการอนุมัติ…' }).then(function(r){ actionBar(''); resultBox('ผลการอนุมัติ', r.results); loadDash(); }).catch(function(){});
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
  apiView('getMyMonth', { ym: S.ym }, function(d){ drawMy(d); }).catch(function(){});
}
function drawMy(d){
  if (!d || (d.ym && d.ym !== S.ym)) return;
  {
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
    if (!$('myBody')) return;
    $('myBody').innerHTML = h + '</tbody></table></div></div>';
    animateKpis();
  }
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
  api('getAttachment', { id: id }, { block: 'กำลังเปิดไฟล์…' }).then(function(f){
    fileViewer(f, { onDelete: function(){
      confirmBox('ลบไฟล์แนบ', 'ต้องการลบไฟล์ "' + f.fileName + '" ใช่หรือไม่', 'ลบไฟล์', true).then(function(ok){
        if (ok) api('deleteAttachment', { id: id }).then(function(rec){ notify('ลบไฟล์เรียบร้อย'); MDL.hide(); if (S.page === 'entry' && rec && rec.id) updateRecInBoard(rec); else refreshPage(); }).catch(function(){});
      });
    } });
  }).catch(function(){});
}
function refreshPage(){ go(S.page); }

/* ================= ลงตารางเวร ================= */
function manageIds(){ return posIdsFor(['ENTRY', 'REVIEWER', 'COORD']); }
PAGES.booking = function(){
  var ids = viewIds();
  var multi = ids.length > 1;
  // ผู้ใช้ทั่วไป: เปิดครั้งแรกที่ตำแหน่งที่ขึ้นเวรประจำ (ลงเวรได้ทันที)
  if (!S.bkPid && !S.pid && !manageIds().length) S.bkPid = (S.boot.usualPositions || []).filter(function(id){ return ids.indexOf(id) >= 0; })[0] || ids[0];
  mount(pageHead('งานของฉัน', 'ลงตารางเวร', 'เลือกเดือนและตำแหน่ง แล้วกด "ลงเวร" ในช่วงเวรที่ต้องการ ระบบควบคุมกรอบอัตรากำลังและป้องกันการลงเวรซ้ำช่วงเวลาให้อัตโนมัติ', '<button class="btn btn-ghost" onclick="rosterDlg()"><i class="bi bi-printer"></i> พิมพ์ตารางเวร (แจกหน่วยงาน)</button>') +
    '<div class="filters">' + ymSelect('bkYm', S.bkYm || addYm(S.boot.ym, 1), 1, 2) + posSelect('bkPos', ids, S.bkPid || S.pid, multi, manageIds().length ? 'ทุกตาราง' : 'ทุกตาราง (ดูอย่างเดียว)') +
    '<div><label class="form-label">มุมมอง</label><div class="seg" id="bkMode"><button type="button" data-v="cal"' + (S.bkMode !== 'sheet' ? ' class="on"' : '') + '><i class="bi bi-calendar3"></i> ปฏิทิน</button><button type="button" data-v="sheet"' + (S.bkMode === 'sheet' ? ' class="on"' : '') + '><i class="bi bi-grid-3x3"></i> แบบ Google Sheet</button></div></div>' +
    '<div class="ms-auto align-self-end"><button type="button" class="btn btn-sm btn-ghost" onclick="S.ym=$(\'bkYm\').value;go(\'overview\')" title="ดูตารางเวรเดือนก่อน ๆ ย้อนหลังได้ 3 ปี"><i class="bi bi-clock-history"></i> ดูตารางเวรย้อนหลัง</button></div>' +
    '</div><div id="bkState"></div><div id="bkBody">' + skeleton(8) + '</div>');
  $('bkYm').onchange = function(){ var el = this; gridGuard(function(){ S.bkYm = el.value; loadBoard(); }); };
  $('bkPos').onchange = function(){ var el = this; gridGuard(function(){ S.bkPid = el.value; if (el.value !== 'all') S.pid = el.value; loadBoard(); }); };
  $$('#bkMode button').forEach(function(b){ b.onclick = function(){ gridGuard(function(){ $$('#bkMode button').forEach(function(x){ x.classList.remove('on'); }); b.classList.add('on'); S.bkMode = b.dataset.v; store('smc_bkMode', S.bkMode); loadBoard(); }); }; });
  S._bkSel = {}; S.bkMulti = false;
  loadBoard();
  // 2 ต.ค. 69 (ง) ระหว่างหลายคนลงเวรพร้อมกัน: ตรวจทุก 12 วินาทีว่ามีคนลงช่องไหนเพิ่ม → อัปเดตตารางให้เอง (ถามเลขรุ่นอย่างเดียว เบามาก)
  livePoll('booking', 12000, bkMemoKey, function(){ if (!S._bkBusy && !S._bkQ.length && !(GRID && GRID.hasDirty()) && !Object.keys(S._bkSel || {}).length && !document.querySelector('.modal.show')) loadBoard(); });
};
function bkMemoKey(){ if (!S.bkYm || !S.bkPid) return ''; return S.bkMode === 'sheet' ? memoKey('getScheduleGrid', { ym: S.bkYm, positionId: S.bkPid, scope: 'view' }) : memoKey('getBookingBoard', { ym: S.bkYm, positionId: S.bkPid }); }
function loadBoard(){
  S.bkYm = $('bkYm').value; S.bkPid = $('bkPos').value;
  S.bkMode = S.bkMode || store('smc_bkMode') || 'cal';
  if (!S.bkPid) { $('bkBody').innerHTML = empty('calendar-x', 'ยังไม่มีตำแหน่งที่ท่านดูตารางเวรได้ โปรดติดต่อผู้ดูแลระบบ'); return; }
  if (S.bkMode === 'sheet') {
    var gy = S.bkYm, gp = S.bkPid;
    return gridView({ ym: gy, positionId: gp, scope: 'view' }, function(){ return S.page === 'booking' && S.bkMode === 'sheet' && S.bkYm === gy && S.bkPid === gp && $('bkBody'); }, function(g){ $('bkBody').innerHTML = demoBanner(g.ym) + '<div id="bkGrid"></div>'; renderGrid('bkGrid', g, loadBoard); });
  }
  var ym = S.bkYm, pid = S.bkPid, n = 0;
  apiView('getBookingBoard', { ym: ym, positionId: pid }, function(b){ if (S.bkYm !== ym || S.bkPid !== pid || !$('bkBody') || S.bkMode === 'sheet') return; drawBoardKeep(b, n++ > 0); }).catch(function(){});
}
/** วาดตารางลงเวรใหม่ โดยคงค่าที่กรอกไว้ (ลงเวรแทน/หมายเหตุ) และตำแหน่งเลื่อนจอ */
function drawBoardKeep(b, keepScroll){
  var y = window.scrollY, f = $('bkFor') ? $('bkFor').value : '', nt = $('bkNote') ? $('bkNote').value : '';
  S._bkLast = b; S._lnRedraw = function(){ drawBoardKeep(S._bkLast); };
  b.multi ? renderBoardAll(b) : renderBoard(b);
  if (f && $('bkFor')) setSel('bkFor', f);
  if ($('bkNote')) $('bkNote').value = nt;
  bkApplyPending();
  if (keepScroll !== false) window.scrollTo({ top: y, behavior: 'instant' });
}
/* 29 ก.ย. 69 ลงเวร/ยกเลิกเวรแบบไม่ต้องรอ: ชื่อขึ้นในช่องทันที (กรอบกะพริบ = กำลังบันทึก) แล้วระบบบันทึกเบื้องหลัง */
S._bkPend = {};
function bkApplyPending(){
  $$('#bkBody .chip.saving.opt').forEach(function(el){ el.remove(); });
  Object.keys(S._bkPend).forEach(function(k){
    var p = S._bkPend[k];
    if (p.pid !== S.bkPid || p.ym !== S.bkYm) return;
    var slot = document.querySelector('#bkBody .slot[data-d="' + p.date + '"][data-s="' + p.slot + '"]'); if (!slot) return;
    var chip = document.createElement('span'); chip.className = 'chip mine pend saving opt'; chip.title = 'กำลังบันทึก…';
    chip.innerHTML = esc(shortName(p.name)) + (p.note ? ' <b>' + esc(p.note) + '</b>' : '') + ' <i class="bi bi-hourglass-split"></i>';
    var add = slot.querySelector('.add-slot'); var host = add ? add.parentNode : null;
    if (host) slot.insertBefore(chip, host); else slot.appendChild(chip);
    if (host && !p.manage) host.hidden = true;
  });
}
/* ---------- v1.3 ตารางเวรแบบ Google Sheet (ใช้ทั้งหน้าลงตารางเวรและตารางเวรรวม) ---------- */
var GRID = null;
/** 1 ต.ค. 69 ตารางแบบ Google Sheet: แสดงที่จำไว้ทันที แล้วอัปเดตเบื้องหลัง (ไม่วาดทับถ้ากำลังแก้ไขช่องอยู่) */
function gridView(payload, still, draw){
  return apiView('getScheduleGrid', payload, function(g){
    if (!still()) return;
    if (GRID && GRID.hasDirty() && document.body.contains($('sgCnt'))) return;
    draw(g);
  }).catch(function(){});
}
function gridGuard(cb){
  if (!GRID || !GRID.hasDirty() || !document.body.contains($('sgCnt'))) return cb();
  confirmBox('ยังไม่ได้บันทึกตาราง', 'มีช่องที่แก้ไขแล้วยังไม่ได้บันทึก ต้องการออกโดยไม่บันทึกใช่หรือไม่', 'ออกโดยไม่บันทึก', true).then(function(ok){ if (ok) { GRID = null; cb(); } });
}
function renderGrid(host, g, reload){
  var rows = [], empty2 = [];
  var toRow = function(pid, gname, x, manage, status){ var cells = {}; Object.keys(x.cells).forEach(function(d){ cells[d] = cellText(x.cells[d].slots, x.cells[d].note); }); return { key: pid + '|' + x.empCode, pid: pid, groupName: gname, empCode: x.empCode, name: x.name, hrPos: x.hrPos, sub: x.empCode, cells: cells, pend: x.pend, st: x.st, ln: x.ln || {}, status: status, editable: manage }; };
  var lines = {}; if (g.multi) g.positions.forEach(function(p){ lines[p.id] = p.lines || 0; }); else lines[g.position.id] = g.lines || 0;
  if (g.multi) g.positions.forEach(function(p){ if (!p.people.length) { if (p.manage) empty2.push(p); return; } p.people.forEach(function(x){ rows.push(toRow(p.id, p.name, x, p.manage, p.status)); }); });
  else g.people.forEach(function(x){ rows.push(toRow(g.position.id, g.position.name, x, g.manage, g.status)); });
  var posManage = {}; if (g.multi) g.positions.forEach(function(p){ posManage[p.id] = p.manage; }); else posManage[g.position.id] = g.manage;
  var legend = '<div class="d-flex flex-wrap gap-3 align-items-center mt-2">' + recLegend() + '</div><div class="d-flex flex-wrap gap-3 align-items-center mt-2">' + dayLegend() + '<span class="small-muted"><span class="sg-pend-demo"></span> รออนุมัติ</span></div>' + legendHtml(g.multi ? null : g.position);
  $(host).innerHTML = '<div id="' + host + 'In"></div>' + (empty2.length ? '<div class="small-muted mt-2"><i class="bi bi-inbox"></i> ยังไม่มีผู้ลงเวร: ' + empty2.map(function(p){ return '<a href="#" class="me-2" onclick="gridAdd(\'' + p.id + '\');return false"><i class="bi bi-person-plus"></i> ' + esc(p.name) + '</a>'; }).join('') + '</div>' : '') + legend;
  S._grid = g; S._gridReload = reload;
  S._lnRedraw = function(){ if (GRID) GRID.render(); };
  GRID = SheetGrid({ host: host + 'In', dates: g.dates, rows: rows, groups: !!g.multi, canAdd: !g.multi && g.manage, lines: lines,
    canAddPid: function(pid){ return posManage[pid]; }, onAddRow: function(pid){ gridAdd(pid || (g.position && g.position.id)); },
    onSave: function(list, btn){ gridSave(list, btn); } });
}
function gridAdd(pid){
  var g = S._grid;
  var have = {}; GRID.cfg.rows.forEach(function(r){ if (r.pid === pid) have[r.empCode] = 1; });
  var list = g.employees || [];
  modal('เพิ่มบุคลากรในตาราง · ' + posName(pid), '<label class="form-label" for="gaEmp">บุคลากร</label><select class="form-select" id="gaEmp" data-search><option value="">— เลือกบุคลากร —</option>' + empOptions(list, pid, { skip: have, sub: function(e){ return e.empCode + ' · ' + (e.hrPosition || ''); } }) + '</select><div class="small-muted mt-2">เพิ่มแถวแล้วพิมพ์ตัวย่อเวรในช่องวันที่ แล้วกด "บันทึกตาราง"</div>',
    [{ text: 'ยกเลิก', cls: 'btn-ghost' }, { text: 'เพิ่มแถว', onClick: function(){
      var code = $('gaEmp').value; if (!code) { notify('กรุณาเลือกบุคลากร', 'info'); return false; }
      var e = list.filter(function(x){ return x.empCode === code; })[0];
      var rows = GRID.cfg.rows, idx = -1; rows.forEach(function(r, i){ if (r.pid === pid) idx = i; });
      var nr = { key: pid + '|' + code, pid: pid, groupName: posName(pid), empCode: code, name: e.name, hrPos: String(e.hrPosition || '').replace(/\s*\(\d+\)\s*$/, ''), sub: code, cells: {}, pend: {}, st: {}, ln: {}, editable: true, orig: {}, isNew: true };
      S.lnSel[pid] = [];   // เพิ่มบุคลากรใหม่ → แสดงทุกใบ (ให้พิมพ์เวรได้ทุกช่อง)
      if (idx < 0) rows.push(nr); else rows.splice(idx + 1, 0, nr);
      GRID.render();
      setTimeout(function(){ var c = document.querySelector('.sgc[data-r="' + rows.indexOf(nr) + '"]'); if (c) c.focus(); }, 50);
    } }]);
}
function gridSave(list, btn){
  var by = {}; list.forEach(function(x){ (by[x.pid] = by[x.pid] || []).push({ empCode: x.empCode, d: x.d, value: x.value }); });
  var pids = Object.keys(by), fails = [], okN = 0, chain = Promise.resolve();
  btnBusy(btn, true, 'กำลังบันทึก');
  pids.forEach(function(pid){ chain = chain.then(function(){ return api('saveScheduleGrid', { ym: S._grid.ym, positionId: pid, changes: by[pid] }, { quiet: true }).then(function(r){
    r.results.forEach(function(x){ if (x.ok) okN++; else fails.push(posName(pid) + ' · ' + x.empCode + ' วันที่ ' + x.d + ': ' + x.error); });
  }, function(e){ fails.push(posName(pid) + ': ' + e.message); }); }); });
  chain.then(function(){
    btnBusy(btn, false);
    GRID = null;
    if (fails.length) Swal.fire({ icon: okN ? 'warning' : 'error', title: 'บันทึกแล้ว ' + okN + ' ช่อง · ไม่สำเร็จ ' + fails.length + ' ช่อง', html: '<div class="text-start small" style="max-height:300px;overflow:auto">' + fails.map(esc).join('<br>') + '</div>', confirmButtonText: 'รับทราบ' });
    else notify('บันทึกตารางเวรเรียบร้อย ' + okN + ' ช่อง');
    if (S._gridReload) S._gridReload();
  });
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
  var canAny = b.manage || (b.windowOpen && b.selfAllowed);
  h += '<div class="d-flex flex-wrap gap-2 align-items-center mb-3"><span class="pill p-warn nodot"><i class="bi bi-hourglass-split"></i> รออนุมัติ ' + b.pending + '</span><span class="pill p-ok nodot"><i class="bi bi-check2-circle"></i> อนุมัติแล้ว ' + b.approved + '</span>' + lnChips(b.position.id, b.lines) +
    (canAny ? '<button type="button" class="btn btn-sm ' + (S.bkMulti ? 'btn-brand' : 'btn-ghost') + '" id="bkMultiBtn" onclick="bkMultiToggle()" title="ติ๊กหลายช่องแล้วกดลงเวรครั้งเดียว"><i class="bi bi-ui-checks"></i> ' + (S.bkMulti ? 'กำลังเลือกหลายช่อง' : 'เลือกหลายช่อง') + '</button>' : '') +
    (b.canApprove && b.pending ? '<button class="btn btn-sm btn-brand ms-auto" onclick="approveSched(this)"><i class="bi bi-check2-all"></i> อนุมัติตารางเวร (' + b.pending + ')</button>' : '') + '</div>' + legendHtml(b.position) +
    (S.bkMulti ? '<div class="tipbar"><i class="bi bi-ui-checks"></i><div>โหมดเลือกหลายช่อง: กดช่อง "ลงเวร" ที่ต้องการ (ช่องที่เลือกเป็นสีชมพู) แล้วกด <b>ลงเวร n ช่อง</b> ด้านล่าง ระบบส่งครั้งเดียว</div></div>' : '');
  if (b.manage) {
    h += '<div class="card mb-3"><div class="card-b d-flex flex-wrap gap-2 align-items-end"><div style="min-width:300px"><label class="form-label" for="bkFor">ลงเวรแทนเจ้าหน้าที่ (ไม่เลือก = ลงเวรให้ตนเอง)</label><select class="form-select" data-search id="bkFor"><option value="">— ลงเวรให้ตนเอง —</option>' +
      empOptions(b.employees, b.position.id, { sub: function(e){ return e.empCode + ' · ' + (e.hrPosition || ''); }, text: function(e){ return e.name + ' (' + e.empCode + ')'; } }) + '</select></div>' +
      '<div><label class="form-label" for="bkNote">หมายเหตุหน้าที่</label><input class="form-control" id="bkNote" placeholder="เช่น V/S, En" style="width:160px"></div></div></div>';
  } else {
    h += '<div class="mb-2" style="max-width:240px"><label class="form-label" for="bkNote">หมายเหตุหน้าที่ (ถ้ามี)</label><input class="form-control" id="bkNote" placeholder="เช่น V/S"></div>';
  }
  var canSelf = b.windowOpen && b.selfAllowed;
  h += '<div class="cal">' + TH_D.map(function(d){ return '<div class="dh">' + d + '</div>'; }).join('');
  for (var i = 0; i < (b.days.length ? b.days[0].dow : 0); i++) h += '<div class="blank"></div>';
  var D = S.boot.dayTypes;
  b.days.forEach(function(d){
    var cls = dk(d.color) + (d.dayType === D.CLOSED ? ' closed' : '');
    if (d.date === S.boot.today) cls += ' today';
    h += '<div class="day ' + cls + '"><div class="dn"><span>' + (+d.date.slice(8)) + ' <span class="d-md-none small-muted fw-normal">' + TH_DF[d.dow] + '</span></span>' + dayTypePill(d.dayType, d.color, d.color === 'WEEKEND' ? '' : '') + '</div>';
    if (d.note) h += '<div class="small-muted">' + esc(d.note) + '</div>';
    if (d.dayType === D.CLOSED) h += '<div class="small-muted"><i class="bi bi-slash-circle"></i> ปิดคลินิก</div>';
    else if (!d.slots.length) h += '<div class="small-muted"><i class="bi bi-dash-circle"></i> ไม่เปิดให้ลงเวร</div>';
    d.slots.forEach(function(s){
      var pct = d.quota ? Math.min(100, s.booked.length / d.quota * 100) : 0;
      h += '<div class="slot ' + (s.full ? 'full ' : '') + (s.closed ? 'sclosed' : '') + '" data-d="' + d.date + '" data-s="' + s.slot + '"><div class="top"><span class="sl" title="' + esc(slotL(s.slot).name) + '">' + esc(slotL(s.slot).s) + (slotL(s.slot).en ? ' <small>' + esc(slotL(s.slot).en) + '</small>' : '') + '</span><span class="small-muted">' + s.booked.length + '/' + d.quota + '</span></div><div class="bar"><i style="width:' + pct + '%"></i></div>';
      if (s.closed) h += '<div class="small-muted" style="font-size:11px">ช่วงนี้ปิดแล้ว</div>';
      s.booked.forEach(function(x){
        var canX = b.manage || (x.mine && x.status === 'PENDING' && b.windowOpen);
        if (!lnShow(b.position.id, x.ln)) return;   // 2 ต.ค. 69 เลือกใบเซ็นชื่อ → แสดงเฉพาะชื่อในใบนั้น
        h += '<span class="chip ' + (x.mine ? 'mine ' : '') + (x.status === 'PENDING' ? 'pend' : '') + '" data-id="' + x.id + '" title="' + esc(x.empCode + ' ' + x.name + (x.note ? ' · ' + x.note : '') + lnTip(x.ln)) + '">' + (x.ln && b.lines > 1 ? '<small class="ln-n">' + x.ln + '</small>' : '') + esc(shortName(x.name)) + (x.note ? ' <b>' + esc(x.note) + '</b>' : '') +
          (canX ? ' <span class="x" onclick="cancelBk(\'' + x.id + '\')" title="ยกเลิกเวร">×</span>' : '') + '</span>';
      });
      var mineHere = s.booked.some(function(x){ return x.mine; });
      if (!s.closed && !s.full) {
        var sk = d.date + '|' + s.slot, on = S.bkMulti && S._bkSel[sk];
        if (b.manage || canSelf) { if (b.manage || !mineHere) h += '<div><button class="add-slot' + (on ? ' picked' : '') + '" data-sk="' + sk + '" onclick="bookSlot(this,\'' + d.date + '\',\'' + s.slot + '\')"><i class="bi bi-' + (S.bkMulti ? (on ? 'check-square-fill' : 'square') : 'plus-circle') + '"></i> ลงเวร</button></div>'; }
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
/* 2 ต.ค. 69 (ชุด 21) ลงเวร/ยกเลิกแบบคิว: กดได้ต่อเนื่องไม่ต้องรอ · ช่องที่กดระหว่างรอผล รวมส่งเป็นคำขอเดียว (bookBatch)
 * เดิมกด 1 ช่อง = 1 คำขอ (หลายคนกดพร้อมกัน → คิวที่ Google ยาว "เซิร์ฟเวอร์ไม่ว่างชั่วคราว" / ลงไม่ทัน) */
S._bkQ = []; S._bkBusy = false; S._bkSel = {};
function bookSlot(btn, date, slot){
  if (S.bkMulti) {   // (ข) โหมดเลือกหลายช่อง: กดเพื่อเลือก/ยกเลิกการเลือก แล้วกด "ลงเวร n ช่อง" ครั้งเดียว
    var sk = date + '|' + slot;
    if (S._bkSel[sk]) delete S._bkSel[sk]; else S._bkSel[sk] = { date: date, slot: slot };
    btn.classList.toggle('picked', !!S._bkSel[sk]); var ic = btn.querySelector('i'); if (ic) ic.className = 'bi bi-' + (S._bkSel[sk] ? 'check-square-fill' : 'square');
    return bkMultiBar();
  }
  bkAdd([{ date: date, slot: slot }]);
}
/** ใส่ช่องลงคิว (แสดงชื่อในช่องทันที) แล้วส่ง */
function bkAdd(list){
  var b0 = S._board || {}, emp = $('bkFor') ? $('bkFor').value : '', note = $('bkNote') ? $('bkNote').value : '';
  var who = emp ? ((b0.employees || []).filter(function(e){ return e.empCode === emp; })[0] || {}).name || emp : S.boot.me.name;
  list.forEach(function(x){
    var key = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    S._bkPend[key] = { pid: S.bkPid, ym: S.bkYm, date: x.date, slot: x.slot, name: who, note: note, manage: !!b0.manage };
    S._bkQ.push({ key: key, op: 'book', date: x.date, slot: x.slot, positionId: S.bkPid, empCode: emp, note: note, ym: S.bkYm });
  });
  bkApplyPending(); bkFlush();
}
function bkMultiToggle(){ S.bkMulti = !S.bkMulti; if (!S.bkMulti) S._bkSel = {}; if (S._bkLast) drawBoardKeep(S._bkLast); bkMultiBar(); }
function bkMultiBar(){
  var n = Object.keys(S._bkSel || {}).length;
  if (!S.bkMulti || S.page !== 'booking') return actionBar('');
  actionBar('<span class="cnt"><i class="bi bi-ui-checks"></i> เลือก ' + n + ' ช่อง</span>' + (n ? '<button class="btn btn-sm btn-brand" onclick="bkMultiGo()"><i class="bi bi-calendar2-plus"></i> ลงเวร ' + n + ' ช่อง</button>' : '<span class="small-muted">กดช่อง "ลงเวร" ที่ต้องการ</span>') +
    '<button class="btn btn-sm btn-ghost" onclick="S._bkSel={};bkMultiToggle()">ปิดโหมดเลือกหลายช่อง</button>');
}
function bkMultiGo(){
  var list = Object.keys(S._bkSel).map(function(k){ return S._bkSel[k]; }).sort(function(a, b){ return a.date < b.date ? -1 : a.date > b.date ? 1 : (a.slot < b.slot ? -1 : 1); });
  if (!list.length) return;
  S._bkSel = {}; S.bkMulti = false; actionBar('');
  bkAdd(list);
  if (S._bkLast) drawBoardKeep(S._bkLast);
}
/** ส่งทุกอย่างในคิวเป็นคำขอเดียว · ระหว่างรอผล ช่องที่กดเพิ่มจะรอส่งรอบถัดไป */
function bkFlush(){
  if (S._bkBusy || !S._bkQ.length) return;
  var batch = S._bkQ.splice(0, 60);
  S._bkBusy = true; savingChip(1);
  var view = S.page === 'booking' && S.bkMode !== 'sheet' && S.bkPid && S.bkPid !== 'all' ? { ym: S.bkYm, positionId: S.bkPid } : null;
  var items = batch.map(function(x){ return { key: x.key, op: x.op, date: x.date, slot: x.slot, positionId: x.positionId, empCode: x.empCode, note: x.note, id: x.id }; });
  var fin = function(ok){ S._bkBusy = false; savingChip(-1, ok); if (S._bkQ.length) setTimeout(bkFlush, 50); };
  api('bookBatch', { items: items, view: view }, { quiet: true, rid: true }).then(function(r){
    var fails = [], okN = 0, cancelN = 0;
    (r && r.results || []).forEach(function(x, i){
      var q = batch[i] || {}; delete S._bkPend[q.key];
      if (x.ok) { if (q.op === 'cancel') cancelN++; else okN++; }
      else fails.push((q.op === 'cancel' ? 'ยกเลิกเวร' : (q.date ? thDate(q.date) + ' ' + slotL(q.slot).name : '')) + ': ' + String(x.error || '').replace('||', ' · '));
    });
    if (!r || !r.results) batch.forEach(function(q){ delete S._bkPend[q.key]; });
    var here = S.page === 'booking' && S.bkMode !== 'sheet' && $('bkBody');
    if (r && r.board && view && here && S.bkPid === view.positionId && S.bkYm === view.ym) { memoFresh(memoKey('getBookingBoard', view), r.board); drawBoardKeep(r.board); }
    else if (here) { bkApplyPending(); loadBoard(); }
    if (fails.length) Swal.fire({ icon: okN + cancelN ? 'warning' : 'error', title: (okN ? 'ลงเวรแล้ว ' + okN + ' ช่อง · ' : '') + (cancelN ? 'ยกเลิกแล้ว ' + cancelN + ' · ' : '') + 'ไม่สำเร็จ ' + fails.length + ' รายการ',
      html: '<div class="text-start small" style="max-height:320px;overflow:auto;white-space:pre-line">' + fails.map(esc).join('\n') + '</div>', confirmButtonText: 'รับทราบ' });
    else notify((okN ? 'ลงเวรเรียบร้อย ' + okN + ' ช่อง' : '') + (okN && cancelN ? ' · ' : '') + (cancelN ? 'ยกเลิกเวรเรียบร้อย' + (cancelN > 1 ? ' ' + cancelN + ' รายการ' : '') : ''));
    fin(!fails.length);
  }, function(e){
    batch.forEach(function(q){ delete S._bkPend[q.key]; });
    if (S.page === 'booking' && $('bkBody')) { bkApplyPending(); $$('#bkBody .chip.saving').forEach(function(ch){ ch.classList.remove('saving'); ch.style.textDecoration = ''; }); $$('#bkBody div[hidden]').forEach(function(x){ x.hidden = false; }); loadBoard(); }
    alertBox('ลงเวรไม่สำเร็จ', (e && e.message ? e.message : 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้') + '\n\nระบบลองส่งใหม่ให้แล้ว · ตารางโหลดใหม่ให้ตรวจสอบก่อนกดอีกครั้ง', 'warning');
    fin(false);
  });
}
function cancelBk(id){
  confirmBox('ยกเลิกเวร', 'ต้องการยกเลิกเวรนี้ใช่หรือไม่', 'ยกเลิกเวร', true).then(function(ok){
    if (!ok) return;
    var chip = document.querySelector('#bkBody .chip[data-id="' + id + '"]');
    if (chip) { chip.classList.add('saving'); chip.style.textDecoration = 'line-through'; }
    S._bkQ.push({ key: 'c' + Date.now().toString(36), op: 'cancel', id: id });
    bkFlush();
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
  var h = demoBanner(b.ym) + windowBanner(b, b.positions.some(function(p){ return p.manage; }));
  h += '<div class="d-flex flex-wrap gap-2 align-items-center mb-3"><span class="small-muted">' + b.positions.length + ' ตาราง · รออนุมัติรวม ' + b.positions.reduce(function(a, p){ return a + p.pending; }, 0) + ' รายการ · * = รออนุมัติ</span>' +
    (pend.length ? '<button class="btn btn-sm btn-brand ms-auto" onclick="approveAll(this)"><i class="bi bi-check2-all"></i> อนุมัติตารางที่เลือก</button>' : '') + '</div>';
  // v1.3.1 ภาพรวมกรอบเวรทุกตำแหน่ง (แสดงทุกตาราง แม้ยังไม่มีผู้ลงเวร) กดชื่อตำแหน่งหรือช่องวันเพื่อเปิดตารางลงเวร
  if (b.positions.length) h += heatmapHtml(b);
  b.positions.filter(function(p){ return p.people.length; }).forEach(function(p){
    h += '<div class="card mb-3"><div class="card-h">' + (p.canApprove && p.pending ? '<input class="form-check-input ba-sel" type="checkbox" data-id="' + p.id + '" checked aria-label="เลือกอนุมัติ ' + esc(p.name) + '">' : '') +
      '<h3><a href="#" onclick="setSel(\'bkPos\',\'' + p.id + '\');$(\'bkPos\').dispatchEvent(new Event(\'change\'));return false">' + esc(p.name) + '</a></h3><span class="sub">' + esc(p.groupName) + '</span>' + lnChips(p.id, p.lines) +
      '<span class="ms-auto d-flex gap-2"><span class="pill p-warn nodot">รออนุมัติ ' + p.pending + '</span><span class="pill p-ok nodot">อนุมัติแล้ว ' + p.approved + '</span></span></div>';
    h += schedMatrix(p, b.dates, p.people) + '</div>';
  });
  if (!b.positions.length) h += empty('calendar-x', 'ยังไม่มีตำแหน่งที่ท่านดูตารางเวรได้');
  else h += recLegend() + legendHtml();
  $('bkBody').innerHTML = h;
}
function openBkPos(pid){ setSel('bkPos', pid); $('bkPos').dispatchEvent(new Event('change')); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function heatmapHtml(b){
  var tot = { q: 0, n: 0 };
  var rows = b.positions.map(function(p){
    var pq = 0, pn = 0;
    var cells = b.dates.map(function(dd){
      var f = p.fill && p.fill[dd.d];
      if (!f) return '<td class="hm-x ' + dk(dd.color) + '" title="ไม่เปิดให้ลงเวร">·</td>';
      var q = f[0] * f[1].length, n = f[1].reduce(function(a, x){ return a + x[1]; }, 0);
      pq += q; pn += n;
      var r = q ? n / q : (n ? 1 : 0), cls = !q ? 'hm-0' : n === 0 ? 'hm-e' : r < .5 ? 'hm-l' : r < 1 ? 'hm-m' : r === 1 ? 'hm-f' : 'hm-o';
      var tip = TH_DF[dd.dow] + ' ' + thDate(dd.date) + '\n' + f[1].map(function(x){ return slotL(x[0]).name + ' ' + x[1] + '/' + f[0]; }).join('\n');
      return '<td class="hm ' + cls + '" title="' + esc(tip) + '" onclick="openBkPos(\'' + p.id + '\')"><span>' + n + '<small>/' + q + '</small></span></td>';
    }).join('');
    tot.q += pq; tot.n += pn;
    var pct = pq ? Math.round(pn / pq * 100) : 0;
    return '<tr><td class="nm"><a href="#" onclick="openBkPos(\'' + p.id + '\');return false">' + esc(p.name) + '</a><div class="hm-bar"><i style="width:' + Math.min(100, pct) + '%"></i></div></td><td class="hm-pct">' + pct + '%</td>' + cells + '</tr>';
  }).join('');
  return '<div class="card mb-3 hm-card"><div class="card-h"><h3><i class="bi bi-grid-3x3-gap"></i> ภาพรวมกรอบเวรทุกตำแหน่ง</h3><span class="sub">ลงแล้ว / กรอบ ของแต่ละวัน · กดที่ชื่อตำแหน่งหรือช่องวันเพื่อเปิดตารางลงเวร</span>' +
    '<span class="ms-auto d-flex flex-wrap gap-2 small-muted align-items-center"><span class="hm-lg hm-e"></span>ยังไม่มีผู้ลง <span class="hm-lg hm-l"></span>ไม่ถึงครึ่ง <span class="hm-lg hm-m"></span>เกินครึ่ง <span class="hm-lg hm-f"></span>เต็มกรอบ <span class="hm-lg hm-o"></span>เกินกรอบ · รวม ' + fmt(tot.n) + '/' + fmt(tot.q) + '</span></div>' +
    '<div class="tbl border-0 shadow-none hm-wrap"><table class="table table-bordered matrix hm-t"><thead><tr><th class="nm">ตำแหน่ง</th><th>ลงแล้ว</th>' +
    b.dates.map(function(x){ return '<th class="' + dk(x.color) + '">' + x.d + '<br>' + TH_D[x.dow] + '</th>'; }).join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div></div>';
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
  S.ovMode = S.ovMode || store('smc_ovMode') || 'card';
  var ids = viewIds();
  mount(pageHead('งานของฉัน', 'ตารางเวรรวม', 'ภาพรวมตารางเวรทุกตำแหน่งในเดือนที่เลือก พร้อมสถานะการบันทึกเวลาในแต่ละช่อง · เลือกใบเซ็นชื่อ (ใบ 1 / ใบ 2…) เพื่อดูเฉพาะเวรในใบนั้น · สลับเป็น "แบบ Google Sheet" เพื่อแก้ไขตำแหน่งที่ท่านดูแล', '<button class="btn btn-ghost" onclick="rosterDlg()"><i class="bi bi-printer"></i> พิมพ์ตารางเวร (แจกหน่วยงาน)</button>') + '<div class="filters">' + ymSelect('ovYm', S.ym, 36, 2, 'เดือน (ย้อนหลังได้ 3 ปี)') +
    pickBtn('ovPick', ids) +
    '<div><label class="form-label">มุมมอง</label><div class="seg" id="ovMode"><button type="button" data-v="card"' + (S.ovMode !== 'sheet' ? ' class="on"' : '') + '><i class="bi bi-view-stacked"></i> แยกตามตำแหน่ง</button><button type="button" data-v="sheet"' + (S.ovMode === 'sheet' ? ' class="on"' : '') + '><i class="bi bi-grid-3x3"></i> แบบ Google Sheet</button></div></div>' +
    '<div id="ovQBox"><label class="form-label" for="ovQ">ค้นหาชื่อ / รหัส</label><input class="form-control" id="ovQ" placeholder="ชื่อ หรือรหัสเจ้าหน้าที่"></div></div><div id="ovBody">' + skeleton(6) + '</div>');
  $('ovYm').onchange = function(){ var el = this; gridGuard(function(){ S.ym = el.value; loadOv(); }); };
  pickBind('ovPick', ids, function(){ gridGuard(function(){ S.ovMode === 'sheet' ? loadOv() : drawOv(); }); });
  $('ovQ').oninput = function(){ if (S._ov) drawOv(); };
  $$('#ovMode button').forEach(function(b){ b.onclick = function(){ gridGuard(function(){ $$('#ovMode button').forEach(function(x){ x.classList.remove('on'); }); b.classList.add('on'); S.ovMode = b.dataset.v; store('smc_ovMode', S.ovMode); loadOv(); }); }; });
  loadOv();
};
/** 2 ต.ค. 69 ตำแหน่งที่แสดงในหน้าตารางเวรรวม (เลือกหลายตำแหน่ง/กลุ่มได้) */
function ovSel(){ return pickIn(viewIds()); }
function loadOv(){
  $('ovQBox').hidden = S.ovMode === 'sheet';
  var sel = ovSel();
  if (S.ovMode === 'sheet') {
    var oy = $('ovYm').value, pl = { ym: oy, positionId: sel.length === 1 ? sel[0] : 'all', scope: 'all' }, key = JSON.stringify(sel);
    if (sel.length > 1) pl.positionIds = sel;
    return gridView(pl, function(){ return S.page === 'overview' && S.ovMode === 'sheet' && $('ovYm') && $('ovYm').value === oy && JSON.stringify(ovSel()) === key; }, function(g){ $('ovBody').innerHTML = demoBanner(g.ym) + histNote(g) + '<div id="ovGrid"></div>' + rosterBtn(g); renderGrid('ovGrid', g, loadOv); });
  }
  var ovYmNow = $('ovYm').value; apiView('getScheduleOverview', { ym: ovYmNow }, function(d){ if (!$('ovYm') || $('ovYm').value !== ovYmNow) return; S._ov = d; drawOv(); }).catch(function(){});
}
/** v1.2569.2 ป้ายบอกว่าเป็นตารางเวรย้อนหลัง (ดูได้อย่างเดียว) */
function histNote(d){
  if (!d || !d.readOnly) return '';
  return '<div class="hist-note"><i class="bi bi-clock-history"></i> <b>ตารางเวรย้อนหลัง เดือน' + esc(thYm(d.ym)) + '</b> · จัดเก็บในคลังข้อมูลแล้ว ดูได้อย่างเดียว' +
    (d.source === 'records' ? ' · เดือนนี้มาจากระบบเดิม จึงแสดงตามรายการปฏิบัติงานจริงที่อนุมัติแล้ว' : '') + '</div>';
}
/** ตารางเวรแบบเมทริกซ์ (ใช้ร่วม: ตารางเวรรวม / ลงตารางเวรทุกตาราง) · รหัส ชื่อ ตำแหน่ง · สีสถานะบันทึก · รวมรายคน/รายวัน
 *  2 ต.ค. 69 เลือกใบเซ็นชื่อแล้ว (S.lnSel[ตำแหน่ง]) แสดงเฉพาะเวรในใบนั้น · ชี้ช่องเห็นว่าอยู่ใบที่เท่าไร */
function schedMatrix(p, dates, people, opt){
  opt = opt || {};
  var sel = lnSelOf(p.id), on = function(x, d){ return !sel.length || (x.ln && lnShow(p.id, x.ln[d])); };
  if (sel.length) people = people.filter(function(x){ return dates.some(function(dd){ return x.days[dd.d] && on(x, dd.d); }); });
  var h = '<div class="tbl border-0 shadow-none mx-wrap" style="border-radius:0 0 16px 16px"><table class="table table-bordered matrix mx"><thead><tr><th class="cd">รหัส</th><th class="nm">ชื่อ-นามสกุล</th><th class="hp">ตำแหน่ง</th>' +
    dates.map(function(x){ return '<th class="' + dk(x.color) + '" title="' + esc(x.note || '') + '">' + x.d + '<br>' + TH_D[x.dow] + '</th>'; }).join('') + '<th class="tt">รวม</th></tr></thead><tbody>';
  var daily = {};
  people.forEach(function(x){
    var n = 0;
    h += '<tr><td class="cd tnum">' + esc(x.empCode) + '</td><td class="nm">' + esc(x.name) + '</td><td class="hp">' + esc(x.hrPos || '') + '</td>' + dates.map(function(dd){
      var v = on(x, dd.d) ? (x.days[dd.d] || '') : '', st = x.st ? x.st[dd.d] : '', ln = x.ln && x.ln[dd.d];
      if (v) { var k = lbl(v).replace(/\*/g, ''); var c = (k.match(/[^\s,]/g) ? String(v).split(',').length : 0); n += c || 1; daily[dd.d] = (daily[dd.d] || 0) + 1; }
      var rc = v ? recCls(st, p.status) : '';
      return '<td class="' + dk(dd.color) + (v.indexOf('*') >= 0 ? ' pendc' : '') + (rc ? ' ' + rc : '') + '"' + (v ? ' title="' + esc(recTitle(st, p.status) + lnTip(ln)) + '"' : '') + '>' + esc(lbl(v)) + '</td>';
    }).join('') + '<td class="tt">' + (x.n != null && !sel.length ? x.n : n) + '</td></tr>';
  });
  if (!people.length) h += '<tr><td colspan="' + (dates.length + 4) + '" class="small-muted text-center">ใบที่เลือกยังไม่มีเวร</td></tr>';
  var tot = 0;
  h += '</tbody><tfoot><tr><td class="cd"></td><td class="nm">รวมคนขึ้นเวรรายวัน' + (sel.length ? ' (ใบที่เลือก)' : '') + '</td><td class="hp"></td>' + dates.map(function(dd){ var v = daily[dd.d] || 0; tot += v; return '<td class="' + dk(dd.color) + '">' + (v || '') + '</td>'; }).join('') + '<td class="tt">' + tot + '</td></tr></tfoot></table></div>';
  return h;
}
function drawOv(){
  var d = S._ov; if (!d || !$('ovBody')) return;
  var h = '', q = ($('ovQ').value || '').trim().toLowerCase(), sel = ovSel();
  S._lnRedraw = drawOv;
  d.positions.forEach(function(p){
    if (sel.length && sel.indexOf(p.id) < 0) return;
    var people = p.people.filter(function(x){ return !q || (x.name + ' ' + x.empCode + ' ' + (x.hrPos || '')).toLowerCase().indexOf(q) >= 0; });
    if (!people.length) return;
    h += '<div class="card mb-3"><div class="card-h flex-wrap"><h3>' + esc(p.name) + '</h3><span class="sub">' + people.length + ' คน</span>' + lnChips(p.id, p.lines) + '<span class="ms-auto">' + statusPill(p.status) + '</span></div>' + schedMatrix(p, d.dates, people) + '</div>';
  });
  $('ovBody').innerHTML = demoBanner(d.ym) + histNote(d) + (h ? '<div class="d-flex flex-wrap gap-3 mb-2">' + recLegend() + '</div>' + h + '<div class="d-flex flex-wrap gap-3">' + dayLegend() + '</div>' + legendHtml() : empty('calendar-x', q ? 'ไม่พบข้อมูลตามคำค้นหา' : sel.length ? 'ตำแหน่งที่เลือกยังไม่มีตารางเวรในเดือนนี้' : 'ยังไม่มีตารางเวรในเดือนนี้'));
}

/* ================= บันทึกเวลาปฏิบัติงาน ================= */
var UNITS = ['X-Ray', 'CT Scan', 'MRI', 'ULTRASOUND', 'MAMMOGRAM'];
PAGES.entry = function(){
  var ids = posIdsFor(['ENTRY']);
  mount(pageHead('งานประจำเดือน', 'บันทึกเวลาปฏิบัติงาน', 'บันทึกเวลาเข้า–ออกตามใบลงชื่อ ดูได้ทั้งภาพรวมทุกตำแหน่งและแบบรายใบ (เหมือนใบลงชื่อจริง) ระบบคำนวณเวร/OT และเทียบกับเวลาสแกนให้ทันที',
      '<button class="btn btn-ghost" onclick="pullScans(this)"><i class="bi bi-fingerprint"></i> ดึงเวลาสแกน</button>' +
      '<div class="dropdown"><button class="btn btn-ghost dropdown-toggle" data-bs-toggle="dropdown"><i class="bi bi-printer"></i> พิมพ์</button><ul class="dropdown-menu dropdown-menu-end">' +
      '<li><h6 class="dropdown-header">รายงานจากหน้าจอ (A4 แนวนอน)</h6></li>' +
      '<li><a class="dropdown-item" href="#" onclick="printEntry(\'all\');return false"><i class="bi bi-list-ul me-2"></i>ทุกรายการที่แสดง (แยกตามตำแหน่ง)</a></li>' +
      '<li><a class="dropdown-item" href="#" onclick="printEntry(\'prob\');return false"><i class="bi bi-exclamation-triangle me-2"></i>เฉพาะรายการที่มีปัญหา</a></li>' +
      '<li><a class="dropdown-item" href="#" onclick="printEntry(\'types\');return false"><i class="bi bi-funnel me-2"></i>เลือกประเภทปัญหา…</a></li>' +
      '<li><hr class="dropdown-divider"></li><li><h6 class="dropdown-header">ใบลงชื่อ FM-HRM-031 (พิมพ์ / บันทึก PDF)</h6></li>' +
      '<li><a class="dropdown-item" href="#" onclick="signSheets(false);return false"><i class="bi bi-people me-2"></i>พิมพ์ตามตารางเวร</a></li><li><a class="dropdown-item" href="#" onclick="signSheets(true);return false"><i class="bi bi-file-earmark me-2"></i>พิมพ์แบบไม่มีรายชื่อ</a></li></ul></div>') +
    '<div class="filters">' + ymSelect('enYm', S.ym, 3, 1) + posSelect('enPos', ids, S.enPid || (ids.indexOf(S.pid) >= 0 ? S.pid : usualFirst(ids)), ids.length > 1, 'ภาพรวมทุกตำแหน่งที่ท่านบันทึก') +
    '<div><label class="form-label">มุมมอง</label><div class="seg" id="enView"><button data-v="list"' + (S.enView !== 'sheet' ? ' class="on"' : '') + '><i class="bi bi-list-ul"></i> ดูรวม</button><button data-v="sheet"' + (S.enView === 'sheet' ? ' class="on"' : '') + '><i class="bi bi-file-earmark-text"></i> ดูเป็นใบ</button></div></div>' +
    '<div><label class="form-label">แสดง</label><div class="seg" id="enSeg"><button data-f="all" class="on">ทั้งหมด</button><button data-f="todo">ยังไม่บันทึก</button><button data-f="prob">ต้องแก้ไข</button><button data-f="done">บันทึกแล้ว</button></div></div>' +
    '<div><label class="form-label" for="enQ">ค้นหาบุคลากร</label><input class="form-control" id="enQ" placeholder="ชื่อ หรือรหัส" style="min-width:170px"></div>' +
    '<div id="enSortBox"><label class="form-label" for="enSort">เรียงลำดับ</label><select class="form-select" id="enSort" data-search><option value="date">ตามวันที่</option><option value="pos">ตามตำแหน่ง</option><option value="prob">รายการต้องแก้ไขก่อน</option><option value="name">ตามชื่อบุคลากร</option></select></div>' +
    '<div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="enAll"><label class="form-check-label small" for="enAll">แสดงทุกวัน</label></div>' +
    '<div class="ms-auto d-flex gap-2 align-self-end"><button class="btn btn-soft" onclick="fillStd()"><i class="bi bi-magic"></i> ใส่เวลามาตรฐาน</button><button class="btn btn-brand" id="enSaveTop" onclick="saveSelected(this)"><i class="bi bi-save"></i> บันทึกรายการที่เลือก</button></div></div>' +
    '<div id="enHead"></div><div id="enBody">' + skeleton(10) + '</div><datalist id="enUnits">' + UNITS.map(function(u){ return '<option value="' + u + '">'; }).join('') + '</datalist>');
  if (!ids.length) { $('enBody').innerHTML = empty('shield-lock', 'ท่านยังไม่ได้รับสิทธิ์ผู้บันทึกข้อมูลของตำแหน่งใด โปรดติดต่อผู้ดูแลระบบ'); return; }
  S.enFilter = 'all';
  $('enYm').onchange = function(){ var el = this; enGuard(function(ok){ if (ok) { S.ym = el.value; loadEntry(); } else setSel('enYm', S.ym); }); };
  $('enPos').onchange = function(){ var el = this; enGuard(function(ok){ if (ok) { S.enPid = el.value; if (el.value !== 'all') S.pid = el.value; loadEntry(); } else setSel('enPos', S.enPid || S.pid); }); };
  $('enAll').onchange = renderEntry;
  $('enSort').onchange = function(){ S.enSort = this.value; renderEntry(); };
  S.enView = S.enView || store('smc_enView') || 'list';
  var qt = null; $('enQ').oninput = function(){ clearTimeout(qt); qt = setTimeout(renderEntry, 200); };
  $$('#enSeg button').forEach(function(b){ b.onclick = function(){ $$('#enSeg button').forEach(function(x){ x.classList.remove('on'); }); b.classList.add('on'); S.enFilter = b.dataset.f; renderEntry(); }; });
  $$('#enView button').forEach(function(b){ b.onclick = function(){ $$('#enView button').forEach(function(x){ x.classList.remove('on'); }); b.classList.add('on'); S.enView = b.dataset.v; store('smc_enView', S.enView); renderEntry(); }; });
  if (S.enSort) setSel('enSort', S.enSort);
  loadEntry();
};
function enGuard(cb){
  var dirty = Object.keys(S.enRows || {}).filter(function(k){ return S.enRows[k].dirty && !S.enRows[k].saving; }).length;
  if (!dirty) return cb(true);
  confirmBox('มีรายการที่ยังไม่ได้บันทึก', dirty + ' แถวที่แก้ไขแล้วยังไม่ได้กดบันทึก ต้องการออกจากหน้านี้โดยไม่บันทึกใช่หรือไม่', 'ออกโดยไม่บันทึก', true).then(cb);
}
function loadEntry(keep){
  S.ym = $('enYm').value; S.enPid = $('enPos').value;
  var ym = S.ym, pid = S.enPid, n = 0;
  var draw = function(d){
    if (S.ym !== ym || S.enPid !== pid || !$('enBody')) return;
    var first = n++ === 0, fo = enFocus();
    S._en = d; buildRows(first ? keep : true); renderEntry(first);
    enRestoreFocus(fo);
  };
  // หลังบันทึก/ลบ (keep) โหลดข้อมูลล่าสุดตรง ๆ · เปิดหน้า/เปลี่ยนตัวกรอง แสดงข้อมูลที่จำไว้ก่อน แล้วอัปเดตเบื้องหลัง
  if (keep) return api('getEntrySheet', { ym: ym, positionId: pid }, { fresh: true }).then(draw).catch(function(){});
  return apiView('getEntrySheet', { ym: ym, positionId: pid }, draw).catch(function(){});
}
/** จำช่องที่กำลังพิมพ์ แล้วคืนโฟกัสหลังวาดตารางใหม่ (ข้อมูลอัปเดตเบื้องหลังไม่ทำให้พิมพ์สะดุด) */
function enFocus(){ var a = document.activeElement; if (!a || !a.dataset || !a.dataset.k || !$('enBody') || !$('enBody').contains(a)) return null; return { k: a.dataset.k, f: a.dataset.f, s: a.selectionStart, e: a.selectionEnd }; }
function enRestoreFocus(fo){
  if (!fo) return;
  var el = document.querySelector('#enBody [data-k="' + fo.k + '"][data-f="' + fo.f + '"]'); if (!el) return;
  el.focus({ preventScroll: true }); try { if (fo.s != null) el.setSelectionRange(fo.s, fo.e); } catch (e) { }
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
        rec: r, scans: r.scanTimes ? r.scanTimes.split(' ') : (sch ? sch.scans : null), inactive: r.empStatus === 'INACTIVE', dirty: !!(o && o.dirty), sel: !!(o && o.sel), saving: !!(o && o.saving), err: '' };
      order.push(k);
    });
    x.scheduled.forEach(function(s){
      if (recorded[s.positionId + '|' + s.empCode]) return;
      var k = 's_' + x.date + '_' + s.positionId + '_' + s.empCode, o = old[k];
      rows[k] = { key: k, pid: s.positionId, date: x.date, empCode: s.empCode, name: s.name, slot: s.slot, note: s.note, sheetNo: String(s.sheetNo), pending: s.status === 'PENDING',
        tin: o ? o.tin : '', tout: o ? o.tout : '', noClaim: o ? o.noClaim : false, noClaimReason: o ? o.noClaimReason : '', unit: o ? o.unit : unitFromNote(s.note, s.positionId), scans: s.scans, covered: s.covered, dirty: !!(o && o.dirty), sel: !!(o && o.sel), saving: !!(o && o.saving), err: o ? o.err : '' };
      order.push(k);
    });
  });
  Object.keys(old).forEach(function(k){ if (k.indexOf('n_') === 0 && !rows[k]) { rows[k] = old[k]; order.push(k); } });
  S.enRows = rows; S.enOrder = order;
}
function unitFromNote(note, pid){ if (!hasUnit(pid)) return ''; var n = normUnit(note); return UNITS.indexOf(n) >= 0 ? n : ''; }
/** 1 ต.ค. 69 จุดปฏิบัติงานรังสี: หน้างานพิมพ์ย่อ (ct, mri, mam, x, us) → ชื่อมาตรฐาน (ตรงกับ normUnit_ ใน Records.gs) */
function normUnit(v){
  var s = String(v || '').trim(); if (!s) return '';
  var k = s.toLowerCase().replace(/[\s._\-\/]+/g, '');
  if (/^(ct|ctscan|ซีที)/.test(k)) return 'CT Scan';
  if (/^(mri|เอ็มอาร์ไอ)/.test(k)) return 'MRI';
  if (/^(mam|mamo|mammo|mammogram|mammography|แมม|แมมโม)/.test(k)) return 'MAMMOGRAM';
  if (/^(us|ultra|ultrasound|อัลตรา|อัลตร้า|อัลตราซาวด์|อัลตร้าซาวด์)/.test(k)) return 'ULTRASOUND';
  if (/^(x|xray|xr|เอกซเรย์|เอ็กซเรย์|เอ็กซ์เรย์|เอกซ์เรย์)$/.test(k) || /^xray/.test(k)) return 'X-Ray';
  return s;
}
/** 1 ต.ค. 69 เลขใบซ้ำ (คำนวณสดในหน้าเว็บ): ตำแหน่ง+วัน+ใบเดียวกัน มีมากกว่า 1 คน → คืน {key: [ชื่อคนอื่น]} */
function sheetDups(){
  var g = {}, out = {};
  S.enOrder.forEach(function(k){ var r = S.enRows[k]; if (!r || !r.sheetNo || !r.empCode || !(r.rec || r.dirty)) return; var gk = r.pid + '|' + r.date + '|' + (+r.sheetNo); (g[gk] = g[gk] || []).push(r); });
  Object.keys(g).forEach(function(gk){
    var list = g[gk]; if (list.length < 2) return;
    list.forEach(function(r){ var others = list.filter(function(o){ return o.empCode !== r.empCode; }); if (others.length) out[r.key] = others.map(function(o){ return o.name || o.empCode; }); });
  });
  return out;
}
function dupHtml(r){ var d = (S._dups || {})[r.key]; return d ? '<span class="flag bad dup-flag"><i class="bi bi-files"></i> เลขใบที่ ' + esc(r.sheetNo) + ' ซ้ำกับ ' + esc(d.join(', ')) + ' · ตรวจกับใบลงชื่อจริงแล้วแก้เลขใบ</span>' : ''; }
function dayOf(date){ return S._en.days.filter(function(x){ return x.date === date; })[0]; }
function rowState(r){
  if ((S._dups || {})[r.key]) return 'prob';
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
/* ---------- 2 ต.ค. 69 (ชุด 21) ตารางเวรเป็นตัวตั้ง: ช่วงที่ไม่ได้ลงเวรไว้ คิดเป็น OT · ปุ่มเพิ่มเวรในตารางเวร (ตรวจกรอบ) ---------- */
function allowedFor(r){
  var day = dayOf(r.date); if (!day) return [];
  var sch = day.scheduled.filter(function(s){ return s.empCode === r.empCode && s.positionId === r.pid; })[0];
  return sch && sch.slot ? String(sch.slot).split(',').filter(String) : [];
}
function extraInfo(r){
  var day = dayOf(r.date); if (!day || !r.empCode) return null;
  var allowed = allowedFor(r); if (!allowed.length) return null;
  var saved = r.rec && !r.dirty, tin = saved ? r.rec.timeIn : r.tin, tout = saved ? r.rec.timeOut : r.tout;
  if (saved && (r.rec.flagCodes || []).indexOf('EXTRA_OT') < 0) return null;
  var c = RULES.compute(tin, tout, day.dayType, enPos(r.pid), S._en.rules, allowed);
  if (c.err || !c.dropped || !c.dropped.length) return null;
  return { codes: c.codes, dropped: c.dropped, ot: c.ot, cap: c.cap, allowed: allowed, tin: tin, tout: tout };
}
function xoText(x){ return 'ลงเวรไว้ ' + lbl(x.allowed.join(',')) + ' อย่างเดียว · เวลา ' + x.tin + '–' + x.tout + ' คิดเป็น ' + lbl(x.codes.join(',')) + ' + OT ' + fmt(x.ot, x.ot % 1 ? 1 : 0) + ' ชม.' + (x.cap ? ' (ตัดเหลือสูงสุด)' : ''); }
function xoBtnText(x){ return 'เพิ่ม' + x.dropped.map(function(c){ return slotL(c).name; }).join(' และ ') + 'ในตารางเวร'; }
function xoHtml(r){
  var x = extraInfo(r); if (!x) return '';
  var ed = enEditable(r.pid);
  return '<div class="flag xo-flag"><i class="bi bi-hourglass-split"></i> ' + esc(xoText(x)) + (ed ? ' <button type="button" class="btn btn-link btn-sm p-0 align-baseline xo-add" onclick="addSlotsFor(\'' + r.key + '\')">' + esc(xoBtnText(x)) + '</button>' : '') + '</div>';
}
function addSlotsFor(k, done){
  var r = S.enRows[k]; if (!r) return;
  var x = extraInfo(r); if (!x) return;
  api('addScheduleSlots', { empCode: r.empCode, date: r.date, positionId: r.pid, slots: x.dropped }, { block: 'กำลังเพิ่มเวรในตารางเวร (ตรวจกรอบเวร)…' }).then(function(res){
    var day = dayOf(r.date), slots = res.slots.join(',');
    if (day) day.scheduled.forEach(function(s){ if (s.empCode === r.empCode && s.positionId === r.pid) s.slot = slots; });
    r.slot = slots;
    notify('เพิ่ม' + x.dropped.map(function(c){ return slotL(c).name; }).join(' และ ') + 'ในตารางเวรแล้ว · คิดเป็น ' + lbl(slots) + (r.rec && !r.dirty ? '' : ' (กดบันทึกแถวนี้)'));
    if (done) done(true);
    if (r.rec && !r.dirty) loadEntry(true); else refreshRows([k]);
  }).catch(function(){ if (done) done(false); });
}
function previewHtml(r){
  var day = dayOf(r.date) || { dayType: S.boot.dayTypes.WORKDAY };
  if (r.rec && !r.dirty) {
    var rr = r.rec, xo = xoHtml(r);
    return codesTag(rr.shiftCodes) + (rr.otHours ? ' <span class="tag">OT ' + fmt(rr.otHours, 1) + '</span>' : '') + (rr.noClaim ? ' <span class="flag">ไม่เบิก OT' + (rr.noClaimReason ? ': ' + esc(rr.noClaimReason) : '') + '</span>' : '') +
      '<div class="mt-1">' + scanPill(rr.scanStatus, rr.lastScanOut) + '</div>' + rr.flags.map(function(f, i){ var code = (rr.flagCodes || [])[i]; if (code === 'SHEET_DUP' || (code === 'EXTRA_OT' && xo)) return ''; return '<span class="flag ' + (rr.blocking && code !== 'UNIT_ODD' && code !== 'RESIGNED' && code !== 'EXTRA_OT' ? 'bad' : '') + '">' + esc(f) + (code === 'RESIGNED' && rr.stopNote ? ' · ' + esc(rr.stopNote) : '') + '</span>'; }).join('') + xo + dupHtml(r);
  }
  if (!r.tin && !r.tout) return '<span class="small-muted">ยังไม่บันทึก</span>';
  var c = RULES.compute(r.tin, r.tout, day.dayType, enPos(r.pid), S._en.rules, allowedFor(r));
  if (c.err) return '<span class="err-msg"><i class="bi bi-x-circle"></i> ' + esc(c.err) + '</span>';
  var open = (day.openSlots || {})[r.pid];
  var closed = open && c.codes.some(function(x){ return open.indexOf(x) < 0; });
  var h = codesTag(c.codes.join(',')) + (c.ot ? ' <span class="tag">OT ' + fmt(c.ot, 1) + '</span>' : '') + (c.cap ? ' <span class="flag">ตัด OT เหลือสูงสุด</span>' : '') +
    (c.noOt ? '<span class="flag">ตำแหน่งนี้ไม่มี OT (ไม่คิดส่วนที่เกิน)</span>' : '') + (r.noClaim ? '<span class="flag">ไม่เบิก OT' + (r.noClaimReason ? ': ' + esc(r.noClaimReason) : ' — ยังไม่ระบุเหตุผล') + '</span>' : '') +
    (c.odd ? '<span class="flag">เวลาเริ่มไม่ตรงเวลามาตรฐานของตำแหน่ง</span>' : '') + (closed ? '<span class="flag">ช่วงเวรนี้ไม่ได้เปิดให้ลงเวรในวันดังกล่าว</span>' : '');
  h += xoHtml(r) + '<div class="mt-1">' + scanCompare(r) + '</div>' + dupHtml(r);
  var emp = r.empCode && S._en.employees.filter(function(e){ return e.empCode === r.empCode; })[0];
  if (emp && emp.x) h += '<span class="flag">' + esc(emp.stop || 'พ้นสภาพแล้ว') + ' · บันทึกได้ ผู้ตรวจสอบจะเห็นธงนี้</span>';
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
  var byS = {}; d.positionIds.forEach(function(pid){ (byS[d.statuses[pid]] = byS[d.statuses[pid]] || []).push(pid); });
  var used = {}; S.enOrder.forEach(function(k){ used[S.enRows[k].pid] = 1; });
  return '<details class="pos-sum mb-2"><summary><span class="fw-semibold">ภาพรวม ' + d.positionIds.length + ' ตำแหน่ง</span> <span class="small-muted">(มีรายการ ' + Object.keys(used).length + ')</span> ' +
    ['OPEN', 'RETURNED', 'SUBMITTED', 'REVIEWED', 'APPROVED'].filter(function(k){ return byS[k]; }).map(function(k){ return statusPill(k).replace('</span>', ' ' + byS[k].length + '</span>'); }).join(' ') +
    ' <span class="small-muted ms-auto">สแกนล่าสุด ' + esc(d.lastScanSync || '-') + ' · กดเพื่อดูรายตำแหน่ง</span></summary><div class="d-flex flex-wrap gap-1 mt-2">' +
    d.positionIds.map(function(pid){ return '<span class="chip' + (used[pid] ? '' : ' op50') + '" style="font-size:12.5px;padding:2px 8px">' + esc(d.positions[pid].name) + ' ' + statusPill(d.statuses[pid]) + '</span>'; }).join('') + '</div></details>' + legendHtml();
}
function renderEntry(first){
  var d = S._en; if (!d) return;
  S._dups = sheetDups();
  if (S.enView === 'sheet') return renderSheetView(first);
  if ($('enSortBox')) $('enSortBox').hidden = false;
  var y = window.scrollY;
  var all = $('enAll').checked, f = S.enFilter || 'all', sort = $('enSort').value;
  var cnt = { todo: 0, prob: 0, done: 0 };
  S.enOrder.forEach(function(k){ cnt[rowState(S.enRows[k])]++; });
  $$('#enSeg button').forEach(function(b){ var n = b.dataset.f === 'all' ? S.enOrder.length : cnt[b.dataset.f]; b.innerHTML = b.textContent.replace(/\s*\d+$/, '') + '<span class="n">' + n + '</span>'; });
  $('enHead').innerHTML = demoBanner(d.ym) + enHeadHtml();
  var ed = d.editable, unitCol = d.positionIds.some(hasUnit);
  var cols = 9 + (unitCol ? 1 : 0);
  var h = '<div class="tbl"><table class="table entry-t"><thead><tr><th style="width:36px">' + (ed ? '<input class="form-check-input" type="checkbox" id="enChkAll" aria-label="เลือกทั้งหมดที่แสดง">' : '') + '</th><th style="width:56px">ใบที่</th><th>บุคลากร</th>' + (unitCol ? '<th>จุดปฏิบัติงาน</th>' : '') + '<th>เวลาเข้า</th><th>เวลาออก</th><th>เวลาสแกนของวัน</th><th>ผลคำนวณ / ตรวจสแกน</th><th title="ไม่เบิกค่า OT">ไม่เบิก OT</th><th></th></tr></thead><tbody>';
  var D = S.boot.dayTypes, shown = 0, vis = visibleKeys();
  if (sort === 'pos') {
    d.positionIds.forEach(function(pid){
      var pk = vis.filter(function(k){ return S.enRows[k].pid === pid; });
      if (!pk.length && !all) return;
      h += '<tr class="pos-h"><td colspan="' + cols + '"><div class="d-flex flex-wrap gap-2 align-items-center"><b>' + esc(enPos(pid).name) + '</b> ' + statusPill(d.statuses[pid]) + '<span class="small-muted fw-normal">' + pk.length + ' แถว</span>' + (d.reasons[pid] ? '<span class="pill p-bad nodot">ส่งกลับแก้ไข: ' + esc(d.reasons[pid]) + '</span>' : '') + '</div></td></tr>';
      d.days.forEach(function(x){
        var keys = pk.filter(function(k){ return S.enRows[k].date === x.date; });
        if (!keys.length) return;
        shown++;
        h += '<tr class="day-h ' + dk(x.color) + '"><td></td><td colspan="' + (cols - 1) + '"><div class="d-flex flex-wrap gap-2 align-items-center">' + TH_DF[x.dow] + ' ' + thDate(x.date) + ' ' + dayTypePill(x.dayType, x.color, x.note) +
          (enEditable(pid) && x.dayType !== D.CLOSED ? '<button class="btn btn-sm btn-link ms-auto py-0 text-decoration-none" onclick="addRow(\'' + x.date + '\',{pid:\'' + pid + '\'})"><i class="bi bi-person-plus"></i> เพิ่มผู้ปฏิบัติงาน</button>' : '') + '</div></td></tr>';
        keys.forEach(function(k){ h += rowHtml(S.enRows[k], unitCol); });
      });
    });
  } else if (sort === 'date') {
    d.days.forEach(function(x){
      var keys = vis.filter(function(k){ return S.enRows[k].date === x.date; });
      if (!keys.length && !(all && f === 'all' && !$('enQ').value)) return;
      shown++;
      var q = d.multi ? '' : ' · กรอบ ' + x.quota;
      h += '<tr class="day-h ' + dk(x.color) + '" id="dh_' + x.date + '"><td>' + (ed && keys.length ? '<input class="form-check-input en-day" type="checkbox" data-date="' + x.date + '" aria-label="เลือกทั้งวัน">' : '') + '</td><td colspan="' + (cols - 1) + '"><div class="d-flex flex-wrap gap-2 align-items-center">' + TH_DF[x.dow] + ' ' + thDate(x.date) + ' ' + dayTypePill(x.dayType, x.color, x.note) +
        '<span class="small-muted fw-normal">ในตาราง ' + x.scheduled.length + ' · บันทึกแล้ว ' + x.records.length + q + '</span>' +
        (ed && x.dayType !== D.CLOSED ? '<button class="btn btn-sm btn-link ms-auto py-0 text-decoration-none" onclick="addRow(\'' + x.date + '\')"><i class="bi bi-person-plus"></i> เพิ่มผู้ปฏิบัติงาน</button>' : '') + '</div></td></tr>';
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
  var k = r.key, cls = (r.inactive ? 'inactive ' : '') + (r.dirty ? 'row-dirty ' : '') + (r.err ? 'row-err ' : '') + (r.saving ? 'row-saving ' : '') + (r.sel ? 'row-sel' : '');
  var sub = esc(r.empCode) + (r.slot ? ' · ตาราง <span class="tag">' + esc(lbl(r.slot)) + '</span>' : ' · <span class="text-warning">นอกตาราง</span>') + (r.pending ? ' · รออนุมัติ' : '') + (r.note ? ' · ' + esc(r.note) : '');
  var who = '<div class="who"><b>' + esc(r.name) + whoEditBtn(r, ed) + '</b><small>' + (showDate ? TH_D[dowOf(r.date)] + ' ' + thDate(r.date) + ' · ' : '') + sub + '</small>' + (S._en.multi ? '<span class="tag mt-1">' + esc(enPos(r.pid).name) + '</span>' : '') + '</div>';
  if (r.isNewRow) {
    var eds = S._en.positionIds.filter(enEditable);
    who = (showDate ? '<div class="small-muted">' + thDate(r.date) + '</div>' : '') +
      (S._en.multi ? '<select class="form-select form-select-sm mb-1" data-k="' + k + '" data-f="pid">' + eds.map(function(pid){ return '<option value="' + pid + '"' + (pid === r.pid ? ' selected' : '') + '>' + esc(enPos(pid).name) + '</option>'; }).join('') + '</select>' : '') +
      '<select class="form-select form-select-sm" data-search data-k="' + k + '" data-f="emp"><option value="">— เลือกบุคลากร —</option>' +
      empOptions(S._en.employees, r.pid, { cur: r.empCode }) + '</select>';
  }
  var menu = '';
  if (r.rec) {
    var need = r.rec.scanStatus === S.boot.scan.NONE || r.rec.scanStatus === S.boot.scan.FORGOT || r.rec.attachIds.length;
    menu = attachCell(r.rec, ed && need) + (ed ? ' <button class="btn btn-icon btn-sm btn-ghost" title="เปลี่ยนบุคลากร (เวลาเดิม)" onclick="swapEmp(\'' + k + '\')"><i class="bi bi-arrow-left-right"></i></button> <button class="btn btn-icon btn-sm btn-ghost" title="ลบรายชื่อออกจากใบลงชื่อ" onclick="delRec(\'' + r.id + '\')"><i class="bi bi-trash3"></i></button>' : '');
  } else if (r.isNewRow) menu = '<button class="btn btn-icon btn-sm btn-ghost" title="ลบแถว" onclick="delem(\'' + k + '\')"><i class="bi bi-x-lg"></i></button>';
  else if (ed && !r.dirty) menu = '<button class="btn btn-icon btn-sm btn-ghost" title="นำออกจากตารางเวร (ไม่ได้มาปฏิบัติงาน / ลงผิดคน)" onclick="unschedRow(\'' + k + '\')"><i class="bi bi-person-x"></i></button>';
  var dt = defaultTimes(r.slot, r.pid);
  return '<tr id="tr_' + k + '" class="' + cls + '"><td>' + (ed ? '<input class="form-check-input en-sel" type="checkbox" data-k="' + k + '"' + (r.sel ? ' checked' : '') + ' aria-label="เลือก">' : '') + '</td>' +
    '<td>' + (ed ? '<input class="form-control form-control-sm text-center" data-k="' + k + '" data-f="sheetNo" value="' + esc(r.sheetNo) + '" style="width:48px">' : esc(r.sheetNo)) + '</td>' +
    '<td id="who_' + k + '">' + who + (r.err ? '<span class="err-msg"><i class="bi bi-exclamation-circle"></i> ' + esc(r.err) + '</span>' : '') + '</td>' +
    (unitCol ? '<td>' + (hasUnit(r.pid) ? (ed ? '<input class="form-control form-control-sm" list="enUnits" data-k="' + k + '" data-f="unit" value="' + esc(r.unit || '') + '" style="width:110px" placeholder="เช่น CT, MRI">' : esc(r.unit || '')) : '') + '</td>' : '') +
    '<td>' + (ed ? '<input class="form-control form-control-sm t-in" data-k="' + k + '" data-f="tin" value="' + esc(r.tin) + '" placeholder="' + dt.tin + '" inputmode="numeric">' : esc(r.tin)) + '</td>' +
    '<td>' + (ed ? '<input class="form-control form-control-sm t-in" data-k="' + k + '" data-f="tout" value="' + esc(r.tout) + '" placeholder="' + dt.tout + '" inputmode="numeric">' : esc(r.tout)) + '</td>' +
    '<td>' + scanCell(r) + '</td><td class="preview" id="pv_' + k + '">' + previewHtml(r) + '</td>' +
    '<td>' + (ed ? '<div class="form-check form-switch m-0"><input class="form-check-input" type="checkbox" data-k="' + k + '" data-f="noClaim"' + (r.noClaim ? ' checked' : '') + ' aria-label="ไม่เบิก OT"></div>' : (r.noClaim ? '<span title="' + esc(r.noClaimReason || '') + '">ไม่เบิก</span>' : '')) + '</td>' +
    '<td class="text-nowrap text-end">' + menu + '</td></tr>';
}
/** อัปเดตเฉพาะแถวที่เปลี่ยน (หน้าจอไม่กระโดด) */
function refreshRows(keys){
  S._dups = sheetDups();
  var unitCol = S._en.positionIds.some(hasUnit), flat = ['date', 'pos'].indexOf($('enSort').value) < 0;
  keys.forEach(function(k){
    var tr = $('tr_' + k), r = S.enRows[k]; if (!tr || !r) return;
    var tmp = document.createElement('tbody'); tmp.innerHTML = S.enView === 'sheet' ? sheetRowHtml(r, dayOf(r.date), +r.sheetNo) : rowHtml(r, unitCol, flat);
    var nt = tmp.firstChild; tr.parentNode.replaceChild(nt, tr);
    bindEntry(nt);
  });
  var cnt = { todo: 0, prob: 0, done: 0 };
  S.enOrder.forEach(function(k){ cnt[rowState(S.enRows[k])]++; });
  $$('#enSeg button').forEach(function(b){ var n = b.dataset.f === 'all' ? S.enOrder.length : cnt[b.dataset.f]; b.innerHTML = b.textContent.replace(/\s*\d+$/, '') + '<span class="n">' + n + '</span>'; });
  enBar();
}
/** เลขใบ/บุคลากรเปลี่ยน → อัปเดตธง "เลขใบซ้ำ" ของทุกแถวที่เกี่ยวข้องทันที (ไม่ต้องรอบันทึก) */
function dupRefresh(){
  var before = S._dups || {}; S._dups = sheetDups();
  Object.keys(before).concat(Object.keys(S._dups)).forEach(function(k){ var r = S.enRows[k]; var pv = $('pv_' + k); if (r && pv) pv.innerHTML = previewHtml(r); });
}
/** 1 ต.ค. 69 เปลี่ยนชื่อผู้ปฏิบัติงานในแถวที่บันทึกแล้ว ได้ในหน้าเลย (บันทึกพร้อมแถวอื่นด้วยปุ่ม "บันทึก") */
function pickEmp(k){
  var r = S.enRows[k]; if (!r) return;
  var td = $('who_' + k); if (!td) return;
  td.innerHTML = '<select class="form-select form-select-sm" data-search data-k="' + k + '" data-f="emp">' + '<option value="' + esc(r.empCode) + '" selected>' + esc(r.name) + '</option>' +
    empOptions(S._en.employees, r.pid, { except: r.empCode }) + '</select><div class="small-muted">เลือกชื่อที่ถูกต้องตามใบลงชื่อ แล้วกด "บันทึก"</div>';
  bindEntry(td);
  var c = td.querySelector('.combo-in, input'); if (c) setTimeout(function(){ c.focus(); if (c.click) c.click(); }, 30);
}
function whoEditBtn(r, ed){ return ed && r.rec ? ' <button type="button" class="btn-who" title="เปลี่ยนชื่อผู้ปฏิบัติงาน (แก้ให้ตรงกับใบลงชื่อ)" onclick="pickEmp(\'' + r.key + '\')"><i class="bi bi-pencil"></i></button>' : ''; }
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
      else if (f === 'unit') { r.unit = final ? normUnit(inp.value) : inp.value; if (final) inp.value = r.unit; }
      else if (f === 'sheetNo') { r.sheetNo = inp.value.replace(/\D/g, '').slice(0, 3); if (final) inp.value = r.sheetNo; }
      else if (f === 'tin' || f === 'tout') { if (final) { var n = normT(inp.value); if (inp.value && !n) inp.classList.add('bad'); else { inp.classList.remove('bad'); inp.value = n; } r[f] = n || inp.value; } else r[f] = normT(inp.value) || inp.value; }
      else r[f] = inp.value;
      r.dirty = true; r.err = ''; r.sel = true;
      markRow(k);
      if (final && (f === 'sheetNo' || f === 'emp')) dupRefresh();
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
function addRow(date, o){
  o = o || {};
  var k = 'n_' + Date.now();
  var pid = o.pid || (S._en.multi ? S._en.positionIds.filter(enEditable)[0] : S._en.positionIds[0]);
  S.enRows[k] = { key: k, pid: pid, date: date, empCode: '', name: '', slot: '', sheetNo: o.sheetNo ? String(o.sheetNo) : '', tin: '', tout: '', noClaim: false, unit: '', scans: null, isNewRow: true, dirty: true, sel: true, err: '' };
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
  var ks = selectedKeys().filter(function(k){ var r = S.enRows[k]; return !(r.rec && !r.dirty) && !r.saving; });
  if (!ks.length) return notify('ยังไม่ได้เลือกแถวที่ต้องบันทึก (ติ๊กช่องหน้าแถว หรือแก้ไขเวลาแล้วระบบจะเลือกให้)', 'info');
  // 2 ต.ค. 69 เวลาเกินช่วงเวรที่ลงไว้ → แจ้งก่อนบันทึก: คิดเป็น OT หรือเพิ่มเวรในตารางเวร (ตรวจกรอบ)
  var xo = ks.filter(function(k){ var r = S.enRows[k]; return normT(r.tin) && normT(r.tout) && extraInfo(r); });
  if (xo.length) return xoDialog(xo, function(){ saveRows(ks); });
  saveRows(ks);
}
function xoDialog(keys, go){
  var line = function(k){
    var r = S.enRows[k], x = extraInfo(r);
    if (!x) return '<div class="xo-line ok" id="xo_' + k + '"><i class="bi bi-check2-circle text-success"></i> <b>' + esc(r.name) + '</b> · ' + thDate(r.date) + ' · เพิ่มเวรในตารางแล้ว คิดเป็น ' + esc(lbl(allowedFor(r).join(','))) + '</div>';
    return '<div class="xo-line" id="xo_' + k + '"><div><b>' + esc(r.name) + '</b> · ' + TH_D[dowOf(r.date)] + ' ' + thDate(r.date) + (S._en.multi ? ' · ' + esc(enPos(r.pid).name) : '') + '</div><div class="small">' + esc(xoText(x)) + '</div>' +
      (enEditable(r.pid) ? '<button type="button" class="btn btn-sm btn-soft mt-1" data-xo="' + k + '"><i class="bi bi-calendar2-plus"></i> ' + esc(xoBtnText(x)) + '</button>' : '') + '</div>';
  };
  modal('เวลาเกินช่วงเวรที่ลงไว้ในตารางเวร', '<div class="small-muted mb-2">ระบบใช้ตารางเวรเป็นตัวตั้ง: ช่วงที่ไม่ได้ลงเวรไว้จะคิดเป็น <b>OT</b> (ไม่เปิดเวรเพิ่มเกินกรอบเอง) · ถ้าขึ้นเวรเพิ่มจริงตามที่ได้รับมอบหมาย กด "เพิ่ม…ในตารางเวร" (ระบบตรวจกรอบให้) แล้วจะคิดเป็นเวร</div><div id="xoList">' + keys.map(line).join('') + '</div>',
    [{ text: 'กลับไปแก้ไข', cls: 'btn-ghost' }, { text: '<i class="bi bi-save"></i> บันทึก ' + keys.length + ' แถว (ส่วนที่เกินคิดเป็น OT)', onClick: function(){ setTimeout(go, 250); } }], 'lg');
  setTimeout(function(){
    $$('[data-xo]').forEach(function(b){ b.onclick = function(){ var k = b.dataset.xo; btnBusy(b, true, 'กำลังเพิ่ม'); addSlotsFor(k, function(ok){ btnBusy(b, false); if (ok) { var el = $('xo_' + k); if (el) el.outerHTML = line(k); } }); }; });
  }, 60);
}
function saveRows(ks){
  var missing = ks.filter(function(k){ var r = S.enRows[k]; return !normT(r.tin) || !normT(r.tout) || !r.empCode; });
  if (missing.length) { missing.forEach(function(k){ S.enRows[k].err = 'กรุณาระบุบุคลากรและเวลาเข้า–ออกให้ครบ'; }); refreshRows(missing); return alertBox('ข้อมูลยังไม่ครบถ้วน', missing.length + ' แถวยังไม่มีเวลาเข้า–ออก (แถวที่มีข้อความสีแดง)', 'warning'); }
  var items = ks.map(function(k){ var r = S.enRows[k]; return { key: k, id: r.id || '', date: r.date, positionId: r.pid, empCode: r.empCode, sheetNo: r.sheetNo, timeIn: normT(r.tin), timeOut: normT(r.tout), noClaim: !!r.noClaim, noClaimReason: r.noClaim ? (r.noClaimReason || '') : '', note: r.note || '', unit: r.unit || '' }; });
  // 29 ก.ย. 69 บันทึกเบื้องหลัง: แถวที่ส่งแล้วขึ้นสีเหลือง "กำลังบันทึก…" ผู้ใช้กรอกแถวอื่นต่อได้ทันที ไม่ต้องรอ
  var sent = {}, ym0 = S.ym, pid0 = S.enPid;
  ks.forEach(function(k){ var r = S.enRows[k]; r.saving = true; r.sel = false; sent[k] = JSON.stringify([r.tin, r.tout, r.noClaim, r.noClaimReason, r.unit, r.sheetNo, r.empCode, r.pid]); var tr = $('tr_' + k); if (tr) { tr.classList.add('row-saving'); tr.classList.remove('row-sel'); var c = tr.querySelector('.en-sel'); if (c) c.checked = false; } });
  enBar(); savingChip(1);
  var stillHere = function(){ return S.page === 'entry' && S.ym === ym0 && S.enPid === pid0 && $('enBody'); };
  api('saveRecords', { items: items }, { rid: true }).then(function(res){
    if (!res) { savingChip(-1, true); ks.forEach(function(k){ if (S.enRows[k]) S.enRows[k].saving = false; }); notify('บันทึกเรียบร้อย · กำลังโหลดข้อมูลล่าสุด'); if (stillHere()) loadEntry(true); return; }   // ส่งซ้ำหลังเครือข่ายสะดุด: บันทึกไว้แล้ว
    savingChip(-1, !res.failed);
    ks.forEach(function(k){ if (S.enRows[k]) S.enRows[k].saving = false; var tr = $('tr_' + k); if (tr) tr.classList.remove('row-saving'); });
    if (!stillHere()) { if (res.failed) alertBox('บันทึกแล้ว ' + res.saved + ' แถว · ไม่สำเร็จ ' + res.failed + ' แถว', 'กรุณากลับไปที่หน้าบันทึกเวลาเพื่อแก้ไขแถวที่ไม่สำเร็จ', 'warning'); else notify('บันทึกเรียบร้อย ' + res.saved + ' แถว'); return; }
    var changed = [], replaced = false;
    res.results.forEach(function(x){
      var r = S.enRows[x.key]; if (!r) return;
      // ถ้าผู้ใช้แก้แถวนี้ต่อระหว่างรอบันทึก → เก็บค่าที่แก้ใหม่ไว้ (ให้กดบันทึกอีกครั้ง)
      var editedAgain = sent[x.key] !== JSON.stringify([r.tin, r.tout, r.noClaim, r.noClaimReason, r.unit, r.sheetNo, r.empCode, r.pid]);
      if (x.ok && editedAgain) {
        var rec0 = x.rec, nk0 = 'r_' + rec0.id;
        r.id = rec0.id; r.rec = rec0; r.dirty = true; r.sel = true;
        if (nk0 !== x.key) { delete S.enRows[x.key]; r.key = nk0; S.enRows[nk0] = r; S.enOrder = S.enOrder.map(function(k){ return k === x.key ? nk0 : k; }); var tr0 = $('tr_' + x.key); if (tr0) tr0.id = 'tr_' + nk0; else replaced = true; }
        var day0 = dayOf(rec0.date); if (day0) { day0.records = day0.records.filter(function(y){ return y.id !== rec0.id; }); day0.records.push(rec0); }
        changed.push(nk0); return;
      }
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
    // 1 ต.ค. 69 รายการข้างเคียง (วัน/ตำแหน่งเดียวกัน) ที่ธงเปลี่ยน เช่น เลขใบซ้ำหายไปหลังสลับใบ
    (res.siblings || []).forEach(function(rec){ var sk = 'r_' + rec.id, sr = S.enRows[sk]; if (!sr || sr.dirty || sr.saving) return; S.enRows[sk] = recToRow(rec, sr); var dd = dayOf(rec.date); if (dd) { dd.records = dd.records.filter(function(y){ return y.id !== rec.id; }); dd.records.push(rec); } changed.push(sk); });
    var moved = S.enView === 'sheet' && res.results.some(function(x){ return x.ok && x.rec && +x.rec.sheetNo !== S.enSheetNo; });
    if (replaced || moved) renderEntry(); else refreshRows(changed);
    changed.forEach(function(k){ var tr = $('tr_' + k); if (tr && S.enRows[k] && S.enRows[k].rec && !S.enRows[k].err) tr.classList.add('row-saved'); });
    if (res.failed) alertBox('บันทึกแล้ว ' + res.saved + ' แถว · ไม่สำเร็จ ' + res.failed + ' แถว', 'แถวที่ไม่สำเร็จแสดงเหตุผลเป็นข้อความสีแดงใต้ชื่อ กรุณาแก้ไขแล้วกดบันทึกอีกครั้ง', 'warning');
    else notify('บันทึกเรียบร้อย ' + res.saved + ' แถว');
  }).catch(function(){
    savingChip(-1, false);
    ks.forEach(function(k){ var r = S.enRows[k]; if (r) { r.saving = false; r.sel = true; } var tr = $('tr_' + k); if (tr) { tr.classList.remove('row-saving'); tr.classList.add('row-sel'); var c = tr.querySelector('.en-sel'); if (c) c.checked = true; } });
    if (stillHere()) enBar();
  });
}
function delRec(id){
  var r = S.enRows['r_' + id] || {};
  Swal.fire({ icon: 'warning', title: 'ลบรายชื่อออกจากใบลงชื่อ',
    html: '<div class="text-start"><div class="mb-2"><b>' + esc(r.name || '') + '</b> <span class="small-muted">' + esc(r.empCode || '') + ' · ' + (r.date ? thDateFull(r.date) : '') + (r.rec ? ' · ' + esc(r.rec.timeIn + '–' + r.rec.timeOut) : '') + '</span></div>' +
      '<label class="form-label">เหตุผลการลบ (จำเป็น · เก็บในประวัติการใช้งาน)</label><select id="drWhy" class="form-select mb-2"><option>บันทึกผิดคน</option><option>บันทึกผิดวันที่</option><option>ไม่ได้มาปฏิบัติงาน</option><option>บันทึกซ้ำ</option><option value="">อื่น ๆ (ระบุ)</option></select>' +
      '<input id="drTxt" class="form-control mb-2" placeholder="รายละเอียดเพิ่มเติม">' +
      (S._en.autoSchedule ? '<div class="form-check"><input class="form-check-input" type="checkbox" id="drSch" checked><label class="form-check-label" for="drSch">ลบเวรของคนนี้ในวันนั้นออกจากตารางเวรด้วย</label></div>' : '') +
      '<div class="small-muted mt-2">ไฟล์แนบของรายการนี้จะถูกลบด้วย · ถ้าต้องการใส่คนอื่นแทน กด "เพิ่มผู้ปฏิบัติงาน" ในวันเดียวกัน หรือใช้ปุ่ม "เปลี่ยนบุคลากร"</div></div>',
    showCancelButton: true, confirmButtonText: 'ลบรายการ', cancelButtonText: 'ยกเลิก', reverseButtons: true, customClass: { confirmButton: 'swal-danger' },
    preConfirm: function(){ var w = [$('drWhy').value, $('drTxt').value.trim()].filter(String).join(' · '); if (!w) { Swal.showValidationMessage('กรุณาระบุเหตุผล'); return false; } return { why: w, keep: $('drSch') ? !$('drSch').checked : true }; }
  }).then(function(x){
    if (!x.isConfirmed) return;
    api('deleteRecord', { id: id, reason: x.value.why, keepSchedule: x.value.keep }, { block: 'กำลังลบรายการ…' }).then(function(res){
      notify('ลบรายการเรียบร้อย' + (res && res.scheduleRemoved ? ' · นำออกจากตารางเวร ' + res.scheduleRemoved + ' ช่วง' : ''));
      loadEntry(true);
    }).catch(function(){});
  });
}
/** นำคนที่อยู่ในตารางเวร (ยังไม่บันทึกเวลา) ออกจากตารางของวันนั้น */
function unschedRow(k){
  var r = S.enRows[k]; if (!r) return;
  confirmBox('นำออกจากตารางเวร', r.name + ' · ' + thDateFull(r.date) + '\nนำรายชื่อนี้ออกจากตารางเวรของวันนั้น (ไม่ได้มาปฏิบัติงาน / ลงผิดคน)', 'นำออกจากตาราง', true).then(function(ok){
    if (!ok) return;
    api('saveScheduleGrid', { ym: r.date.slice(0, 7), positionId: r.pid, changes: [{ empCode: r.empCode, d: +r.date.slice(8), value: '' }] }, { block: 'กำลังแก้ตารางเวร…' }).then(function(res){
      var x = res.results[0];
      if (!x.ok) return alertBox('แก้ตารางเวรไม่สำเร็จ', x.error, 'warning');
      notify('นำออกจากตารางเวรเรียบร้อย'); loadEntry(true);
    }).catch(function(){});
  });
}
/** เปลี่ยนบุคลากรของรายการที่บันทึกแล้ว (เวลาเดิม) → ระบบแก้ตารางเวรให้ */
function swapEmp(k){
  var r = S.enRows[k]; if (!r || !r.rec) return;
  var list = S._en.employees;
  modal('เปลี่ยนบุคลากร', '<div class="mb-2 small-muted">' + esc(posName(r.pid)) + ' · ' + thDateFull(r.date) + ' · ใบที่ ' + esc(r.sheetNo) + ' · ' + esc(r.rec.timeIn + '–' + r.rec.timeOut) + '</div>' +
    '<div class="mb-2">จาก <b>' + esc(r.name) + '</b> (' + esc(r.empCode) + ')</div><label class="form-label" for="swEmp">เปลี่ยนเป็น</label><select class="form-select" id="swEmp" data-search><option value="">— เลือกบุคลากร —</option>' +
    empOptions(list, r.pid, { except: r.empCode }) + '</select>' +
    (S._en.autoSchedule ? '<div class="small-muted mt-2"><i class="bi bi-magic"></i> ระบบจะนำคนเดิมออกจากตารางเวรวันนั้น และลงเวรให้คนใหม่อัตโนมัติ</div>' : ''),
    [{ text: 'ยกเลิก', cls: 'btn-ghost' }, { text: 'บันทึกการเปลี่ยน', onClick: function(b){
      var code = $('swEmp').value; if (!code) { notify('กรุณาเลือกบุคลากร', 'info'); return false; }
      var it = { key: k, id: r.id, date: r.date, positionId: r.pid, empCode: code, sheetNo: r.sheetNo, timeIn: r.rec.timeIn, timeOut: r.rec.timeOut, noClaim: !!r.rec.noClaim, noClaimReason: r.rec.noClaimReason || '', note: r.note || '', unit: r.rec.unit || '' };
      api('saveRecords', { items: [it] }, { btn: b }).then(function(res){
        var x = res.results[0];
        if (!x.ok) return alertBox('เปลี่ยนบุคลากรไม่สำเร็จ', x.error, 'warning');
        MDL.hide(); notify('เปลี่ยนบุคลากรเรียบร้อย'); loadEntry(true);
      }).catch(function(){});
      return false;
    } }]);
}
function pullScans(btn){
  var ids = S._en ? S._en.positionIds : [S.pid];
  var chain = Promise.resolve(), tot = 0;
  ids.forEach(function(pid){ chain = chain.then(function(){ return api('syncPositionScans', { ym: S.ym, positionId: pid }, { quiet: true }).then(function(r){ tot += r.codes || 0; }); }); });
  btnBusy(btn, true, 'กำลังดึงข้อมูลสแกน');
  chain.then(function(){ btnBusy(btn, false); notify('ดึงข้อมูลสแกนเรียบร้อย ' + tot + ' คน'); loadEntry(true); }).catch(function(e){ btnBusy(btn, false); alertBox('ดึงข้อมูลสแกนไม่สำเร็จ', e.message, 'warning'); });
}
/** 2 ต.ค. 69 ทุกปุ่มพิมพ์เลือกกลุ่ม/ตำแหน่งได้ (ติ๊กตำแหน่งที่แสดงอยู่ไว้ให้ก่อน) */
function signSheets(blank){
  var ids = S._en ? S._en.positionIds : posIdsFor(['ENTRY']);
  var cur = S.enPid && S.enPid !== 'all' ? [S.enPid] : pickIn(ids);
  printPick('พิมพ์ใบลงชื่อ FM-HRM-031' + (blank ? ' (ไม่มีรายชื่อ)' : '') + ' · เลือกตำแหน่ง', ids, cur, function(list){
    api('printSignSheets', { ym: S.ym, positionId: list.length === 1 ? list[0] : 'all', positionIds: list, blank: blank }, { block: 'กำลังเตรียมใบลงชื่อสำหรับพิมพ์…' }).then(printSignDoc).catch(function(){});
  });
}

/* ---------- v1.3 มุมมอง "ดูเป็นใบ" (เหมือนใบลงชื่อ FM-HRM-031: 1 ใบ = 1 ลำดับคนต่อวัน ทั้งเดือน) ---------- */
function sheetCount(pid){
  var n = 1;
  S.enOrder.forEach(function(k){ var r = S.enRows[k]; if (r.pid === pid && +r.sheetNo > n) n = +r.sheetNo; });
  return Math.max(n, S['enSheetMax_' + pid] || 0);
}
/* v1.3.1 "ดูเป็นใบ": เรียงเป็นหน้ากระดาษ ตำแหน่ง → ใบที่ → วันที่ เหมือนใบลงชื่อจริง พลิกดูทีละใบ (ปุ่ม ◀ ▶ หรือแป้นลูกศร) */
function pvPages(){
  var d = S._en, out = [];
  d.positionIds.forEach(function(pid){
    var has = S.enOrder.some(function(k){ return S.enRows[k].pid === pid; });
    if (!has && !(enEditable(pid) && !d.multi) && pid !== S.enSheetPid) return;
    for (var k = 1; k <= sheetCount(pid); k++) out.push({ pid: pid, k: k });
  });
  if (!out.length && d.positionIds.length) out.push({ pid: d.positionIds[0], k: 1 });
  return out;
}
function pvGo(step){
  var pg = pvPages(), i = pg.findIndex(function(x){ return x.pid === S.enSheetPid && x.k === S.enSheetNo; });
  var j = Math.max(0, Math.min(pg.length - 1, i + step)); if (j === i) return;
  S.enSheetPid = pg[j].pid; S.enSheetNo = pg[j].k; S.pvDir = step > 0 ? 'next' : 'prev'; renderEntry(); window.scrollTo({ top: $('enBody').offsetTop - 80, behavior: 'smooth' });
}
function pvJump(v){ var p = v.split('|'); S.pvDir = ''; S.enSheetPid = p[0]; S.enSheetNo = +p[1]; renderEntry(); }
document.addEventListener('keydown', function(e){
  if (S.page !== 'entry' || S.enView !== 'sheet' || !S._en) return;
  var t = e.target, tag = t && t.tagName; if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable) || document.querySelector('.modal.show,.swal2-container')) return;
  if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); pvGo(1); } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); pvGo(-1); }
});
function paperHead(pid, k, nSheet){
  var d = S._en, P = enPos(pid), ym = d.ym.split('-');
  return '<div class="paper-top"><span class="paper-form">FM-HRM-031</span><span class="paper-no">ใบที่ <b>' + k + '</b>' + (nSheet ? ' / ' + nSheet : '') + '</span></div>' +
    '<div class="paper-t">แบบบันทึกเวลาการปฏิบัติงาน (' + esc(P.clinicName || 'คลินิกพิเศษเฉพาะทางนอกเวลา') + ')</div>' +
    '<div class="paper-s">ประจำเดือน ' + TH_MF[+ym[1] - 1] + ' ปี พ.ศ. ' + (+ym[0] + 543) + ' &nbsp;·&nbsp; ตำแหน่ง <b>' + esc(P.name) + '</b> &nbsp;·&nbsp; ใบที่ ' + k + '</div>';
}
function renderSheetView(first){
  var d = S._en, y = window.scrollY;
  if ($('enSortBox')) $('enSortBox').hidden = true;
  var cnt = { todo: 0, prob: 0, done: 0 };
  S.enOrder.forEach(function(k){ cnt[rowState(S.enRows[k])]++; });
  $$('#enSeg button').forEach(function(b){ var n = b.dataset.f === 'all' ? S.enOrder.length : cnt[b.dataset.f]; b.innerHTML = b.textContent.replace(/\s*\d+$/, '') + '<span class="n">' + n + '</span>'; });
  $('enHead').innerHTML = demoBanner(d.ym) + enHeadHtml();
  if (d.positionIds.indexOf(S.enSheetPid) < 0) S.enSheetPid = (d.positionIds.filter(function(x){ return S.enOrder.some(function(k){ return S.enRows[k].pid === x; }); })[0]) || d.positionIds[0];
  var pid = S.enSheetPid, nSheet = sheetCount(pid);
  if (!S.enSheetNo || S.enSheetNo > nSheet) S.enSheetNo = 1;
  var k0 = S.enSheetNo, ed = enEditable(pid);
  var pg = pvPages(), idx = pg.findIndex(function(x){ return x.pid === pid && x.k === k0; });
  var h = '<div class="pv-bar">' +
    '<button class="pv-nav" onclick="pvGo(-1)"' + (idx <= 0 ? ' disabled' : '') + ' title="ใบก่อนหน้า (←)"><i class="bi bi-chevron-left"></i></button>' +
    '<div class="pv-where"><div class="pv-pos">' + esc(enPos(pid).name) + ' ' + statusPill(d.statuses[pid]) + '</div><div class="pv-sub">ใบที่ <b>' + k0 + '</b> จาก ' + nSheet + ' ใบ · หน้า ' + (idx + 1) + ' จาก ' + pg.length + (d.multi ? ' (ทุกตำแหน่ง)' : '') + '</div>' +
    '<div class="pv-dots">' + pg.map(function(x, i){ return '<i class="' + (i === idx ? 'on' : '') + (x.k === 1 && i ? ' gap' : '') + '" title="' + esc(enPos(x.pid).name + ' ใบที่ ' + x.k) + '" onclick="pvJump(\'' + x.pid + '|' + x.k + '\')"></i>'; }).join('') + '</div></div>' +
    '<select class="form-select form-select-sm pv-jump" onchange="pvJump(this.value)" aria-label="ไปที่ใบ">' + pg.map(function(x){ return '<option value="' + x.pid + '|' + x.k + '"' + (x.pid === pid && x.k === k0 ? ' selected' : '') + '>' + esc(enPos(x.pid).name) + ' · ใบที่ ' + x.k + '</option>'; }).join('') + '</select>' +
    '<div class="pv-tools"><button class="btn btn-sm btn-ghost" onclick="printPaper(false)" title="พิมพ์ใบที่แสดง"><i class="bi bi-printer"></i> ใบนี้</button><button class="btn btn-sm btn-ghost" onclick="printPaper(true)" title="พิมพ์ทุกใบ (เลือกตำแหน่ง/กลุ่มได้)"><i class="bi bi-files"></i> ทุกใบ…</button>' +
    (ed ? '<button class="btn btn-sm btn-soft" title="เพิ่มใบใหม่" onclick="S[\'enSheetMax_' + pid + '\']=' + (nSheet + 1) + ';S.enSheetNo=' + (nSheet + 1) + ';S.pvDir=\'next\';renderEntry()"><i class="bi bi-plus-lg"></i> เพิ่มใบ</button>' : '') + '</div>' +
    '<button class="pv-nav" onclick="pvGo(1)"' + (idx >= pg.length - 1 ? ' disabled' : '') + ' title="ใบถัดไป (→)"><i class="bi bi-chevron-right"></i></button></div>';
  h += '<div class="paper-stage"><div class="paper ' + (S.pvDir ? 'flip-' + S.pvDir : '') + '">' + paperHead(pid, k0, nSheet) +
    '<div class="sheet-tabs">' + Array.apply(null, Array(nSheet)).map(function(_, i){ return '<button type="button" class="' + (i + 1 === k0 ? 'on' : '') + '" onclick="S.pvDir=\'' + (i + 1 > k0 ? 'next' : 'prev') + '\';S.enSheetNo=' + (i + 1) + ';renderEntry()">ใบที่ ' + (i + 1) + '</button>'; }).join('') + '</div>';
  h += '<div class="tbl paper-tbl"><table class="table sheet-t"><thead><tr><th style="width:34px"></th><th style="width:96px">วัน / วันที่</th><th style="width:58px" title="แก้เลขใบให้ตรงกับใบลงชื่อจริง แล้วกดบันทึก รายการจะย้ายไปใบนั้น">ใบที่</th><th style="width:86px">รหัส</th><th>ชื่อ-นามสกุล</th>' + (hasUnit(pid) ? '<th>จุดปฏิบัติงาน</th>' : '') + '<th>เวลาเข้างาน</th><th>เวลาออกงาน</th><th>เวลาสแกนของวัน</th><th>ผลคำนวณ / ตรวจสแกน</th><th title="ไม่เบิกค่า OT">ไม่เบิก OT</th><th></th></tr></thead><tbody>';
  var vis = visibleKeys(), f = S.enFilter || 'all';
  d.days.forEach(function(x){
    var keys = vis.filter(function(k){ var r = S.enRows[k]; return r.pid === pid && r.date === x.date && +r.sheetNo === k0; });
    if (keys.length) keys.forEach(function(k){ h += sheetRowHtml(S.enRows[k], x, k0); });
    else if (f === 'all' && !($('enQ') && $('enQ').value)) {
      h += '<tr class="sheet-empty ' + dk(x.color) + '"><td></td><td class="text-nowrap"><b>' + TH_D[x.dow] + '</b> ' + thDate(x.date) + '</td><td colspan="' + (hasUnit(pid) ? 10 : 9) + '">' + (x.dayType === S.boot.dayTypes.CLOSED ? '<span class="small-muted">— ปิดคลินิก —</span>' : (ed ? '<button class="btn btn-sm btn-link py-0 text-decoration-none" onclick="addRow(\'' + x.date + '\',{pid:\'' + pid + '\',sheetNo:' + k0 + '})"><i class="bi bi-plus-circle"></i> เพิ่มผู้ปฏิบัติงานในใบที่ ' + k0 + '</button>' : '')) + (x.note ? ' <span class="small-muted">' + esc(x.note) + '</span>' : '') + '</td></tr>';
    }
  });
  h += '</tbody></table></div><div class="paper-sign"><div><span>ผู้ตรวจสอบการลงเวลาปฏิบัติงาน</span><i></i></div><div><span>ข้าพเจ้าขอรับรองว่าผู้มีรายนามข้างต้นได้มาปฏิบัติงานจริง</span><i></i></div></div>' +
    '<div class="paper-f"><span>' + legendHtml(enPos(pid)).replace('class="legend"', 'class="legend m-0"') + '</span><span class="small-muted"><i class="bi bi-keyboard"></i> ใช้แป้น ← → พลิกใบ</span></div></div></div>';
  S.pvDir = '';
  $('enBody').innerHTML = h;
  bindEntry($('enBody'));
  enBar();
  if (!first) window.scrollTo({ top: y, behavior: 'instant' });
}
/** พิมพ์ใบที่แสดง / ทุกใบของตำแหน่ง (A4 แนวตั้ง จากข้อมูลในระบบ ใช้ตรวจทานกับใบจริง)
 *  1 ต.ค. 69: 1 ใบ = 1 หน้าพอดี (ย่ออัตโนมัติ) · หัวกระดาษเดียวกันทุกหน้า · ช่อง ✓ สำหรับติ๊กด้วยปากกา · แถวเลขใบซ้ำมีสีแดง */
function printPaper(all, pids){
  var d = S._en;
  // 2 ต.ค. 69 "ทุกใบ" เลือกได้หลายตำแหน่ง/ทั้งกลุ่ม (ติ๊กตำแหน่งที่ดูอยู่ไว้ให้ก่อน)
  if (all && !pids && d.positionIds.length > 1) return printPick('พิมพ์สำเนาตรวจทาน (ทุกใบ) · เลือกตำแหน่ง', d.positionIds.filter(function(id){ return S.enOrder.some(function(k){ return S.enRows[k].pid === id; }); }), [S.enSheetPid], function(list){ printPaper(true, list); });
  if (all && pids && pids.length > 1) return printPapers(pids);
  var pid = pids ? pids[0] : S.enSheetPid, n = sheetCount(pid), list = all ? Array.apply(null, Array(n)).map(function(_, i){ return i + 1; }) : [S.enSheetNo], cnt = 0;
  var pages = paperPages(pid, list, function(c){ cnt += c; }), P = enPos(pid);
  api('logPrint', { title: 'สำเนาตรวจทานใบลงชื่อ (ข้อมูลในระบบ) · ' + P.name, filters: d.thMonth + ' · ' + (all ? 'ทุกใบ (' + n + ' ใบ)' : 'ใบที่ ' + S.enSheetNo), count: cnt, kind: 'paper' }, { block: 'กำลังเตรียมเอกสารสำหรับพิมพ์…' }).then(function(m){
    return printDoc({ orient: 'portrait', title: 'สำเนาตรวจทาน_' + P.name + '_' + d.thMonth.replace(' ', '_') + (all ? '_ทุกใบ' : '_ใบที่' + S.enSheetNo), pages: pages.map(function(pg){ return docReviewSheetHtml(pg, m); }) });
  }).catch(function(){});
}
function printPapers(pids){
  var d = S._en, cnt = 0, pages = [];
  pids.forEach(function(pid){ var n = sheetCount(pid); pages = pages.concat(paperPages(pid, Array.apply(null, Array(n)).map(function(_, i){ return i + 1; }), function(c){ cnt += c; })); });
  api('logPrint', { title: 'สำเนาตรวจทานใบลงชื่อ (ข้อมูลในระบบ) · ' + pids.length + ' ตำแหน่ง', filters: d.thMonth + ' · ทุกใบ ' + pages.length + ' ใบ · ' + pids.map(function(id){ return enPos(id).name; }).join(', '), count: cnt, kind: 'paper' }, { block: 'กำลังเตรียมเอกสารสำหรับพิมพ์…' }).then(function(m){
    return printDoc({ orient: 'portrait', title: 'สำเนาตรวจทาน_' + pids.length + 'ตำแหน่ง_' + d.thMonth.replace(' ', '_'), pages: pages.map(function(pg){ return docReviewSheetHtml(pg, m); }) });
  }).catch(function(){});
}
/** หน้ากระดาษสำเนาตรวจทานของ 1 ตำแหน่ง ตามรายการเลขใบ */
function paperPages(pid, list, addCnt){
  var d = S._en, n = sheetCount(pid);
  var P = enPos(pid), ym = d.ym.split('-'), month = TH_MF[+ym[1] - 1] + ' ปี พ.ศ. ' + (+ym[0] + 543), unit = hasUnit(pid);
  var colors = (S.boot && S.boot.dayColors) || {}, dups = S._dups || {};
  var bgOf = function(x){ var c = colors[x.color]; return x.color && x.color !== 'WORK' && c ? c.print : ''; };
  var cnt = 0;
  var pages = list.map(function(k){
    var rows = [];
    d.days.forEach(function(x){
      var keys = S.enOrder.filter(function(kk){ var r = S.enRows[kk]; return r.pid === pid && r.date === x.date && +r.sheetNo === k; });
      var base = { dow: TH_D[x.dow], date: thDate(x.date), bg: bgOf(x) };
      if (!keys.length) { rows.push(Object.assign({ closed: x.dayType === S.boot.dayTypes.CLOSED }, base)); return; }
      keys.forEach(function(kk){ var r = S.enRows[kk], rec = r.rec || {}; cnt++;
        rows.push(Object.assign({ code: r.empCode, name: r.name, unit: r.unit || '', tin: r.tin || '', tout: r.tout || '', ot: rec.otHours ? fmt(rec.otHours, 1) : '', scan: rec.scanStatus || (r.rec ? '' : 'ยังไม่บันทึก'), dup: !!dups[kk] }, base)); });
    });
    return { form: 'FM-HRM-031', clinic: P.clinicName || 'คลินิกพิเศษเฉพาะทางนอกเวลา', month: month, posName: P.name, k: k, n: n, unit: unit, rows: rows };
  });
  if (addCnt) addCnt(cnt);
  return pages;
}
function sheetRowHtml(r, x, k0){
  x = x || dayOf(r.date) || {};
  var ed = enEditable(r.pid) || (r.isNewRow && S._en.editable);
  var k = r.key, cls = (r.inactive ? 'inactive ' : '') + (r.dirty ? 'row-dirty ' : '') + (r.err ? 'row-err ' : '') + (r.sel ? 'row-sel ' : '') + (r.saving ? 'row-saving ' : '') + dk(x.color);
  var who = '<div class="who"><b>' + esc(r.name) + whoEditBtn(r, ed) + '</b><small>' + (r.slot ? 'ตาราง <span class="tag">' + esc(lbl(r.slot)) + '</span>' : '<span class="text-warning">นอกตาราง</span>') + (r.note ? ' · ' + esc(r.note) : '') + '</small></div>';
  if (r.isNewRow) who = '<select class="form-select form-select-sm" data-search data-k="' + k + '" data-f="emp"><option value="">— เลือกบุคลากร —</option>' +
    empOptions(S._en.employees, r.pid, { cur: r.empCode }) + '</select>';
  var menu = '';
  if (r.rec) { var need = r.rec.scanStatus === S.boot.scan.NONE || r.rec.scanStatus === S.boot.scan.FORGOT || r.rec.attachIds.length; menu = attachCell(r.rec, ed && need) + (ed ? ' <button class="btn btn-icon btn-sm btn-ghost" title="เปลี่ยนบุคลากร" onclick="swapEmp(\'' + k + '\')"><i class="bi bi-arrow-left-right"></i></button> <button class="btn btn-icon btn-sm btn-ghost" title="ลบรายชื่อออกจากใบลงชื่อ" onclick="delRec(\'' + r.id + '\')"><i class="bi bi-trash3"></i></button>' : ''); }
  else if (r.isNewRow) menu = '<button class="btn btn-icon btn-sm btn-ghost" title="ลบแถว" onclick="delem(\'' + k + '\')"><i class="bi bi-x-lg"></i></button>';
  else if (ed && !r.dirty) menu = '<button class="btn btn-icon btn-sm btn-ghost" title="นำออกจากตารางเวร" onclick="unschedRow(\'' + k + '\')"><i class="bi bi-person-x"></i></button>';
  var dt = defaultTimes(r.slot, r.pid);
  return '<tr id="tr_' + k + '" class="' + cls + '"><td>' + (ed ? '<input class="form-check-input en-sel" type="checkbox" data-k="' + k + '"' + (r.sel ? ' checked' : '') + ' aria-label="เลือก">' : '') + '</td>' +
    '<td class="text-nowrap"><b>' + TH_D[dowOf(r.date)] + '</b> ' + thDate(r.date) + '</td>' +
    '<td>' + (ed ? '<input class="form-control form-control-sm text-center" data-k="' + k + '" data-f="sheetNo" value="' + esc(r.sheetNo) + '" style="width:48px" inputmode="numeric" aria-label="เลขใบ">' : esc(r.sheetNo)) + '</td>' +
    '<td class="tnum">' + esc(r.empCode) + '</td>' +
    '<td id="who_' + k + '">' + who + (r.err ? '<span class="err-msg"><i class="bi bi-exclamation-circle"></i> ' + esc(r.err) + '</span>' : '') + '</td>' +
    (hasUnit(r.pid) ? '<td>' + (ed ? '<input class="form-control form-control-sm" list="enUnits" data-k="' + k + '" data-f="unit" value="' + esc(r.unit || '') + '" style="width:110px" placeholder="เช่น CT, MRI">' : esc(r.unit || '')) + '</td>' : '') +
    '<td>' + (ed ? '<input class="form-control form-control-sm t-in" data-k="' + k + '" data-f="tin" value="' + esc(r.tin) + '" placeholder="' + dt.tin + '" inputmode="numeric">' : esc(r.tin)) + '</td>' +
    '<td>' + (ed ? '<input class="form-control form-control-sm t-in" data-k="' + k + '" data-f="tout" value="' + esc(r.tout) + '" placeholder="' + dt.tout + '" inputmode="numeric">' : esc(r.tout)) + '</td>' +
    '<td>' + scanCell(r) + '</td><td class="preview" id="pv_' + k + '">' + previewHtml(r) + '</td>' +
    '<td>' + (ed ? '<div class="form-check form-switch m-0"><input class="form-check-input" type="checkbox" data-k="' + k + '" data-f="noClaim"' + (r.noClaim ? ' checked' : '') + ' aria-label="ไม่เบิก OT"></div>' : (r.noClaim ? 'ไม่เบิก' : '')) + '</td>' +
    '<td class="text-nowrap text-end">' + menu + '</td></tr>';
}

/* ---------- v1.3 พิมพ์รายงานจากหน้าบันทึกเวลา ---------- */
function issueTypesDlg(title, cb){
  var T = S.boot.issues || {};
  modal(title, '<div class="small-muted mb-2">เลือกประเภทปัญหาที่ต้องการพิมพ์ (เลือกได้หลายข้อ)</div><div class="row g-2">' + Object.keys(T).map(function(k){ return '<div class="col-sm-6"><label class="issue-chk"><input type="checkbox" data-it="' + k + '" checked><span class="it it-' + k + '"></span>' + esc(T[k]) + '</label></div>'; }).join('') + '</div>' +
    '<div class="mt-3"><label class="form-label">รูปแบบ</label><div class="seg" id="itMode"><button type="button" data-v="all" class="on">รวมทุกปัญหา</button><button type="button" data-v="split">แยกตามประเภทปัญหา</button></div></div>',
    [{ text: 'ยกเลิก', cls: 'btn-ghost' }, { text: '<i class="bi bi-printer"></i> พิมพ์', onClick: function(){
      var types = $$('[data-it]').filter(function(c){ return c.checked; }).map(function(c){ return c.dataset.it; });
      if (!types.length) { notify('กรุณาเลือกอย่างน้อย 1 ประเภท', 'info'); return false; }
      var m = $$('#itMode .on')[0].dataset.v;
      setTimeout(function(){ cb(types, m); }, 250);
    } }]);
  $$('#itMode button').forEach(function(b){ b.onclick = function(){ $$('#itMode button').forEach(function(x){ x.classList.remove('on'); }); b.classList.add('on'); }; });
}
function printEntry(mode, pids){
  var d = S._en; if (!d) return;
  if (!pids && d.positionIds.length > 1) return printPick('พิมพ์รายงาน · เลือกตำแหน่ง', d.positionIds, pickIn(d.positionIds), function(list){ printEntry(mode, list); });
  pids = pids || d.positionIds;
  if (mode === 'types') return issueTypesDlg('พิมพ์รายงานตามประเภทปัญหา', function(types, m){
    api('getFollowup', { ym: d.ym, positionIds: pids, types: types }, { block: 'กำลังรวบรวมรายการ…' }).then(function(r){ printFollowup(r, types, m); }).catch(function(){});
  });
  var keys = S.enOrder.filter(function(k){ var r = S.enRows[k]; if (r.isNewRow || pids.indexOf(r.pid) < 0) return false; if (mode === 'prob') return rowState(r) === 'prob' || (r.rec && r.rec.flags.length) || (!r.rec && r.date <= S.boot.today); return visibleKeys().indexOf(k) >= 0; });
  if (!keys.length) return notify(mode === 'prob' ? 'ไม่มีรายการที่มีปัญหา' : 'ไม่มีรายการที่จะพิมพ์', 'info');
  var order = {}; d.positionIds.forEach(function(p, i){ order[p] = i; });
  var rows = keys.map(function(k){ return S.enRows[k]; }).sort(function(a, b){ return (order[a.pid] - order[b.pid]) || (a.date < b.date ? -1 : a.date > b.date ? 1 : (+a.sheetNo) - (+b.sheetNo)); });
  var cols = [
    { t: 'วันที่', w: '10%', f: function(r){ return TH_D[dowOf(r.date)] + ' ' + thDate(r.date); } },
    { t: 'ใบ', w: '4%', f: function(r){ return r.sheetNo; } },
    { t: 'รหัส', w: '8%', f: function(r){ return r.empCode; } },
    { t: 'ชื่อ-นามสกุล', w: '18%', f: function(r){ return r.name; } },
    { t: 'เวลา', w: '10%', f: function(r){ return r.rec ? r.rec.timeIn + '–' + r.rec.timeOut : (r.tin ? r.tin + '–' + r.tout + ' (ยังไม่บันทึก)' : 'ยังไม่บันทึก'); } },
    { t: 'เวร', w: '6%', f: function(r){ return r.rec ? lbl(r.rec.shiftCodes) : lbl(r.slot); } },
    { t: 'OT', w: '5%', num: true, f: function(r){ return r.rec ? (r.rec.noClaim ? 'ไม่เบิก' : fmt(r.rec.otHours, 1)) : ''; } },
    { t: 'ผลสแกน', w: '13%', f: function(r){ return r.rec ? r.rec.scanStatus + (r.rec.lastScanOut ? ' ' + r.rec.lastScanOut : '') : (r.scans ? r.scans.join(' ') : '-'); } },
    { t: 'ข้อสังเกต / สิ่งที่ต้องแก้ไข', f: function(r){ return r.rec ? r.rec.flags.join(' · ') + (r.rec.attachIds.length ? ' (แนบไฟล์ ' + r.rec.attachIds.length + ')' : '') : (r.date <= S.boot.today ? 'มีเวรแต่ไม่มีบันทึกเวลา' : 'ยังไม่ถึงวัน'); } },
    { t: 'ลงชื่อรับทราบ', w: '10%', f: function(){ return ''; } }
  ];
  var groups = {}; rows.forEach(function(r){ (groups[r.pid] = groups[r.pid] || []).push(r); });
  var body = Object.keys(groups).sort(function(a, b){ return order[a] - order[b]; }).map(function(pid, i){
    return '<section class="pr-sec' + (i ? ' pr-break' : '') + '"><h2>' + esc(enPos(pid).name) + ' <small>' + esc(S.boot.mstatus[d.statuses[pid]] || '') + ' · ' + groups[pid].length + ' รายการ</small></h2>' + prTable(cols, groups[pid]) + '</section>';
  }).join('');
  var fl = S.enFilter && S.enFilter !== 'all' ? $$('#enSeg .on')[0].textContent.replace(/\d+$/, '') : 'ทั้งหมด';
  printReport({ title: mode === 'prob' ? 'รายงานรายการที่มีปัญหา (บันทึกเวลาปฏิบัติงาน)' : 'รายงานบันทึกเวลาปฏิบัติงาน',
    subtitle: 'รอบเดือน ' + d.thMonth + ' · ' + (d.multi ? d.positionIds.length + ' ตำแหน่ง' : d.position.name),
    filters: 'ตำแหน่ง: ' + (d.multi ? (pids.length < d.positionIds.length ? 'ที่เลือก ' + pids.length + ' ตำแหน่ง' : 'ทุกตำแหน่งที่มีสิทธิ์') + ' (' + Object.keys(groups).length + ' ตำแหน่งที่มีรายการ)' : d.position.name) + ' · แสดง: ' + (mode === 'prob' ? 'เฉพาะรายการที่มีปัญหา' : fl) + ($('enQ').value ? ' · ค้นหา "' + $('enQ').value + '"' : ''),
    bodyHtml: body, count: rows.length, kind: 'entry-' + mode }).catch(function(){});
}
function printFollowup(r, types, mode){
  var T = S.boot.issues || {};
  var cols = [
    { t: 'ปัญหา', w: '13%', html: true, f: function(x){ return '<span class="pr-tag ' + (x.severity === 'bad' ? 'bad' : 'warn') + '">' + esc(x.typeText) + '</span>'; } },
    { t: 'วันที่', w: '9%', f: function(x){ return TH_D[dowOf(x.date)] + ' ' + thDate(x.date); } },
    { t: 'ตำแหน่ง', w: '14%', f: function(x){ return x.positionName; } },
    { t: 'ใบ', w: '4%', f: function(x){ return x.sheetNo || ''; } },
    { t: 'รหัส', w: '7%', f: function(x){ return x.empCode || ''; } },
    { t: 'ชื่อ-นามสกุล', w: '15%', f: function(x){ return x.name || ''; } },
    { t: 'เวลา', w: '8%', f: function(x){ return x.time || ''; } },
    { t: 'รายละเอียด', f: function(x){ return x.detail || ''; } },
    { t: 'ติดตามแล้ว', w: '8%', f: function(){ return '☐'; } }
  ];
  var body;
  if (mode === 'split') {
    body = types.filter(function(t){ return r.counts[t]; }).map(function(t, i){
      var list = r.items.filter(function(x){ return x.type === t; });
      return '<section class="pr-sec' + (i ? ' pr-break' : '') + '"><h2>' + esc(T[t]) + ' <small>' + list.length + ' รายการ</small></h2>' + prTable(cols.filter(function(c){ return c.t !== 'ปัญหา'; }), list) + '</section>';
    }).join('');
  } else body = '<div class="pr-sum">' + types.filter(function(t){ return r.counts[t]; }).map(function(t){ return '<span>' + esc(T[t]) + ' <b>' + r.counts[t] + '</b></span>'; }).join('') + '</div>' + prTable(cols, r.items, function(x){ return x.positionName; });
  if (!r.items.length) body = '<div class="pr-none">ไม่พบรายการตามเงื่อนไขที่เลือก</div>';
  return printReport({ title: 'รายงานติดตามปัญหาการลงเวลาปฏิบัติงาน', subtitle: 'รอบเดือน ' + r.thMonth + ' · ' + r.items.length + ' รายการ · บุคลากร ' + r.people + ' คน',
    filters: 'ตำแหน่ง: ' + (r.positions.length > 3 ? r.positions.length + ' ตำแหน่ง' : r.positions.map(function(p){ return p.name; }).join(', ')) + ' · ปัญหา: ' + (types.length === Object.keys(T).length ? 'ทุกประเภท' : types.map(function(t){ return T[t]; }).join(', ')) + ' · รูปแบบ: ' + (mode === 'split' ? 'แยกตามประเภทปัญหา' : 'รวมทุกปัญหา') + ' · ข้อมูลสแกนล่าสุด ' + (r.lastScanSync || '-'),
    bodyHtml: body, count: r.items.length, kind: 'followup-' + mode });
}

/* ================= v1.3 ส่งตรวจสอบ (ผู้บันทึกข้อมูล) ================= */
PAGES.submit = function(){
  mount(pageHead('งานประจำเดือน', 'ส่งตรวจสอบ', 'ตำแหน่งที่ท่านเป็นผู้บันทึกข้อมูล ตรวจว่าไม่มีรายการต้องแก้ไข แล้วส่งให้ประสานงานคลินิก/ผู้ตรวจสอบ ส่งได้ทีละหลายตำแหน่ง') +
    '<div class="filters">' + ymSelect('sbYm', S.ym, 6, 0) + '<div><label class="form-label">แสดง</label><div class="seg" id="sbSeg"><button data-f="todo" class="on">รอส่งตรวจสอบ</button><button data-f="sent">ส่งแล้ว</button><button data-f="all">ทั้งหมด</button></div></div>' +
    pickBtn('sbPick', posIdsFor(['ENTRY'])) + '<div><label class="form-label" for="sbQ">ค้นหาตำแหน่ง</label><input class="form-control" id="sbQ" placeholder="ชื่อตำแหน่ง"></div><div class="ms-auto small-muted align-self-end" id="sbInfo"></div></div><div id="sbBody">' + skeleton(8) + '</div>');
  S.sbF = 'todo';
  $('sbYm').onchange = function(){ S.ym = this.value; loadSubmit(); };
  $('sbQ').oninput = drawSubmit; pickBind('sbPick', posIdsFor(['ENTRY']), drawSubmit);
  $$('#sbSeg button').forEach(function(b){ b.onclick = function(){ $$('#sbSeg button').forEach(function(x){ x.classList.remove('on'); }); b.classList.add('on'); S.sbF = b.dataset.f; drawSubmit(); }; });
  loadSubmit();
};
function loadSubmit(){ var ym = S.ym; apiView('getSubmitBoard', { ym: ym }, function(d){ if (S.ym !== ym) return; S._sb = d; drawSubmit(); }).catch(function(){}); }
function drawSubmit(){
  var d = S._sb; if (!d || !$('sbBody')) return;
  $('sbInfo').innerHTML = '<i class="bi bi-send"></i> ' + esc(d.submitWindow.text) + '<br><i class="bi bi-fingerprint"></i> สแกนล่าสุด ' + esc(d.lastScanSync || '-');
  var q = $('sbQ').value.trim().toLowerCase();
  var todoSt = ['OPEN', 'RETURNED'];
  var ps = pickIn(posIdsFor(['ENTRY']));
  var list = d.positions.filter(function(p){ return (!ps.length || ps.indexOf(p.positionId) >= 0) && (p.records || p.status !== 'OPEN' || p.missing) && (!q || p.name.toLowerCase().indexOf(q) >= 0) && (S.sbF === 'all' || (S.sbF === 'todo' ? todoSt.indexOf(p.status) >= 0 : todoSt.indexOf(p.status) < 0)); });
  var nTodo = d.positions.filter(function(p){ return todoSt.indexOf(p.status) >= 0 && p.records; }).length, ready = d.positions.filter(function(p){ return todoSt.indexOf(p.status) >= 0 && p.records && !p.blocking; }).length;
  var h = demoBanner(d.ym) + (d.submitWindow.open ? '' : '<div class="wbanner wb-warn"><i class="bi bi-clock"></i><div>ขณะนี้อยู่นอกช่วงเวลาส่งตรวจสอบ (' + esc(d.submitWindow.text) + ') · ตำแหน่งที่ถูกส่งกลับแก้ไขส่งใหม่ได้ทุกเวลา</div></div>') +
    '<div class="kpis">' + kpi('hourglass-split', 'ic-info', 'ตำแหน่งรอส่งตรวจสอบ', nTodo) + kpi('check2-circle', 'ic-ok', 'พร้อมส่ง (ไม่มีรายการต้องแก้ไข)', ready) +
    kpi('exclamation-octagon', 'ic-bad', 'รายการต้องแก้ไขก่อนส่ง', d.positions.reduce(function(a, p){ return a + (todoSt.indexOf(p.status) >= 0 ? p.blocking : 0); }, 0)) +
    kpi('person-dash', 'ic-warn', 'มีเวรแต่ไม่มีบันทึกเวลา', d.positions.reduce(function(a, p){ return a + (todoSt.indexOf(p.status) >= 0 ? p.missing : 0); }, 0)) + '</div>';
  // v1.3.1 ปุ่มส่งทุกตำแหน่งที่พร้อมในครั้งเดียว
  var readyIds = d.positions.filter(function(p){ return todoSt.indexOf(p.status) >= 0 && p.records && !p.blocking; }).map(function(p){ return p.positionId; });
  var notReady = nTodo - readyIds.length;
  if (nTodo) h += '<div class="cta' + (readyIds.length ? '' : ' cta-off') + '"><div class="cta-ic"><i class="bi bi-send-check"></i></div><div class="flex-grow-1"><b>' + (readyIds.length ? 'ส่งตรวจสอบทุกตำแหน่งที่พร้อมได้ในครั้งเดียว' : 'ยังไม่มีตำแหน่งที่พร้อมส่ง') + '</b><div class="small-muted">พร้อมส่ง ' + readyIds.length + ' ตำแหน่ง' + (notReady ? ' · ยังมีรายการต้องแก้ไข ' + notReady + ' ตำแหน่ง (แก้ไขแล้วค่อยส่ง)' : '') + '</div></div>' +
    '<button class="btn btn-ghost" onclick="$$(\'.sb-sel\').forEach(function(c){c.checked=true});$(\'sbAll\').checked=true;sbBar()"><i class="bi bi-check2-square"></i> เลือกทั้งหมด</button>' +
    (readyIds.length ? '<button class="btn btn-brand" onclick="doSubmit(' + JSON.stringify(readyIds).replace(/"/g, '&quot;') + ')"><i class="bi bi-send"></i> ส่งตรวจสอบทั้งหมด (' + readyIds.length + ')</button>' : '') + '</div>';
  h += '<div class="tbl"><table class="table table-hover"><thead><tr><th style="width:36px"><input class="form-check-input" type="checkbox" id="sbAll" aria-label="เลือกทั้งหมด"></th><th>ตำแหน่ง</th><th>สถานะ</th><th class="num">บันทึก</th><th class="num">ต้องแก้ไข</th><th class="num">ข้อสังเกต</th><th class="num">ไม่มีบันทึก</th><th class="num">รอสแกน</th><th class="num">ค่าตอบแทน</th><th></th></tr></thead><tbody>';
  list.forEach(function(p){
    var can = todoSt.indexOf(p.status) >= 0 && p.records;
    h += '<tr><td>' + (can ? '<input class="form-check-input sb-sel" type="checkbox" data-id="' + p.positionId + '"' + (!p.blocking ? '' : '') + ' aria-label="เลือก ' + esc(p.name) + '">' : '') + '</td><td><div class="who"><b>' + esc(p.name) + '</b><small>' + esc(p.groupName) + ' · ' + p.people + ' คน</small></div></td>' +
      '<td>' + statusPill(p.status) + (p.reason ? '<span class="flag bad">' + esc(p.reason) + '</span>' : '') + (p.submittedAt && p.status !== 'OPEN' ? '<div class="small-muted">ส่งเมื่อ ' + esc(p.submittedAt) + '</div>' : '') + hrmiNote(p) + '</td>' +
      '<td class="num">' + p.records + '</td><td class="num">' + (p.blocking ? '<span class="pill p-bad nodot">' + p.blocking + '</span>' : '<span class="text-success fw-semibold">0</span>') + '</td><td class="num">' + (p.flagged ? '<span class="pill p-warn nodot">' + p.flagged + '</span>' : '0') + '</td>' +
      '<td class="num">' + (p.missing ? '<span class="pill p-warn nodot">' + p.missing + '</span>' : '0') + '</td><td class="num">' + p.pendingScan + '</td><td class="num">' + fmt(p.amount, 2) + '</td>' +
      '<td class="text-nowrap text-end"><button class="btn btn-sm btn-ghost" onclick="S.enPid=\'' + p.positionId + '\';S.pid=\'' + p.positionId + '\';go(\'entry\')"><i class="bi bi-ui-checks-grid"></i> ' + (p.blocking ? 'ไปแก้ไข' : 'เปิดบันทึก') + '</button> ' +
      (can ? '<button class="btn btn-sm btn-brand" onclick="doSubmit([\'' + p.positionId + '\'])"' + (p.blocking ? ' disabled title="ยังมีรายการต้องแก้ไข"' : '') + '><i class="bi bi-send"></i> ส่ง</button>' : '') + '</td></tr>';
  });
  if (!list.length) h += '<tr><td colspan="10">' + empty(S.sbF === 'todo' ? 'emoji-smile' : 'inboxes', S.sbF === 'todo' ? 'ไม่มีตำแหน่งที่รอส่งตรวจสอบ' : 'ไม่พบตำแหน่งตามเงื่อนไข') + '</td></tr>';
  $('sbBody').innerHTML = h + '</tbody></table></div><div class="small-muted mt-2"><i class="bi bi-info-circle"></i> ก่อนส่ง ระบบจะดึงเวลาสแกนล่าสุดและตรวจอีกครั้ง ตำแหน่งที่ยังมีรายการต้องแก้ไขจะไม่ถูกส่ง · ข้อสังเกต (สีส้ม) ส่งได้ แต่ผู้ตรวจสอบจะเห็น</div>';
  animateKpis();
  $('sbAll').onchange = function(){ var on = this.checked; $$('.sb-sel').forEach(function(c){ c.checked = on; }); sbBar(); };
  $$('.sb-sel').forEach(function(c){ c.onchange = sbBar; });
  sbBar();
}
function sbBar(){
  var ids = $$('.sb-sel').filter(function(c){ return c.checked; }).map(function(c){ return c.dataset.id; });
  if (!ids.length) return actionBar('');
  actionBar('<span class="cnt">เลือก ' + ids.length + ' ตำแหน่ง</span><button class="btn btn-sm btn-brand" onclick="doSubmit(null)"><i class="bi bi-send"></i> ส่งตรวจสอบ ' + ids.length + ' ตำแหน่ง</button><button class="btn btn-sm btn-ghost" onclick="$$(\'.sb-sel\').forEach(function(c){c.checked=false});$(\'sbAll\').checked=false;sbBar()">ยกเลิกการเลือก</button>');
}
function doSubmit(ids){
  ids = ids || $$('.sb-sel').filter(function(c){ return c.checked; }).map(function(c){ return c.dataset.id; });
  confirmBox('ส่งตรวจสอบ ' + ids.length + ' ตำแหน่ง', 'ระบบจะดึงข้อมูลสแกนล่าสุดและตรวจทุกรายการก่อนส่ง ตำแหน่งที่ยังมีรายการต้องแก้ไขจะไม่ถูกส่ง\nหลังส่งแล้วจะแก้ไขไม่ได้ จนกว่าจะถูกส่งกลับแก้ไข', 'ส่งตรวจสอบ').then(function(ok){
    if (!ok) return;
    api('submitMonths', { ym: S.ym, positionIds: ids }, { block: 'กำลังดึงข้อมูลสแกนและตรวจรายการ…' }).then(function(r){ actionBar(''); resultBox('ผลการส่งตรวจสอบ', r.results); loadSubmit(); }).catch(function(){});
  });
}

/* ================= v1.3 ตรวจสอบและอนุมัติ (ทุกตำแหน่ง) ================= */
var RV_TABS = [['SUBMITTED', 'รอตรวจสอบ', 'hourglass-split'], ['REVIEWED', 'รออนุมัติ', 'patch-check'], ['RETURNED', 'ส่งกลับแก้ไข', 'arrow-return-left'], ['APPROVED', 'อนุมัติแล้ว', 'lock-fill'], ['OPEN', 'ยังไม่ส่ง', 'pencil-square'], ['', 'ทั้งหมด', 'grid']];
PAGES.review = function(){
  var who = S.boot.canApprove ? 'ผู้จัดการคลินิก/ผู้ดูแลระบบ: อนุมัติได้หลายตำแหน่งพร้อมกัน' : 'ประสานงานคลินิก/ผู้ตรวจสอบ: ตรวจแล้วกด "ผ่านการตรวจสอบ" เพื่อส่งให้ผู้จัดการคลินิกอนุมัติ';
  mount(pageHead('งานประจำเดือน', 'ตรวจสอบและอนุมัติ', 'ดูได้ทุกตำแหน่งในหน้าเดียว เลือกหลายตำแหน่งแล้วดำเนินการครั้งเดียว · ' + who) +
    '<div class="filters">' + ymSelect('rvYm', S.ym, 6, 0) + pickBtn('rvPick', rvIds()) + '<div><label class="form-label" for="rvQ">ค้นหาตำแหน่ง</label><input class="form-control" id="rvQ" placeholder="ชื่อตำแหน่ง"></div>' +
    '<div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="rvFix"><label class="form-check-label small" for="rvFix">เฉพาะตำแหน่งที่มีรายการต้องแก้ไข</label></div></div>' +
    '<div class="stabs" id="rvStabs"></div><div id="rvBody">' + skeleton(8) + '</div><div id="rvDetail" class="mt-4"></div>');
  if (S.rvSt === undefined) S.rvSt = S.boot.canApprove && !S.boot.canReview ? 'REVIEWED' : 'SUBMITTED';
  $('rvYm').onchange = function(){ S.ym = this.value; $('rvDetail').innerHTML = ''; loadApproval(); };
  $('rvQ').oninput = drawApproval; $('rvFix').onchange = drawApproval;
  pickBind('rvPick', rvIds(), drawApproval);
  loadApproval();
};
/** ตำแหน่งที่เห็นในหน้าตรวจสอบ (ตามสิทธิ์) */
function rvIds(){ return has('COORD') || has('MANAGER') ? S.boot.positions.map(function(p){ return p.id; }) : posIdsFor(['ENTRY', 'REVIEWER']); }
function loadApproval(){ var ym = S.ym; apiView('getApprovalBoard', { ym: ym }, function(d){ if (S.ym !== ym) return; S._ap = d; drawApproval(); }).catch(function(){}); }
/** 1 ต.ค. 69 ไฟล์ HRMi: ดาวน์โหลดแล้วเมื่อไร · มีการแก้ไขหลังดาวน์โหลด → เตือนให้ดาวน์โหลดใหม่ */
function hrmiNote(p){
  if (!p || !p.exportedAt) return '';
  if (p.hrmiChanged) return '<span class="flag bad"><i class="bi bi-exclamation-triangle"></i> แก้ไขข้อมูลหลังดาวน์โหลดไฟล์ HRMi (' + esc(p.exportedAt.slice(5, 16)) + ') · ดาวน์โหลดใหม่</span>';
  return '<div class="small-muted"><i class="bi bi-database-check"></i> ดาวน์โหลด HRMi แล้ว ' + esc(p.exportedAt.slice(5, 16)) + '</div>';
}
function drawApproval(){
  var d = S._ap; if (!d || !$('rvBody')) return;
  var ps0 = pickIn(rvIds()), cnt = {}; d.positions.forEach(function(p){ if (!ps0.length || ps0.indexOf(p.positionId) >= 0) cnt[p.status] = (cnt[p.status] || 0) + 1; });
  var active = d.positions.filter(function(p){ return (p.records || p.status !== 'OPEN') && (!ps0.length || ps0.indexOf(p.positionId) >= 0); });
  $('rvStabs').innerHTML = RV_TABS.map(function(t){ var n = t[0] ? (cnt[t[0]] || 0) : active.length; return '<button type="button" class="stab st-' + (t[0] || 'ALL') + (S.rvSt === t[0] ? ' on' : '') + '" data-s="' + t[0] + '"><i class="bi bi-' + t[2] + '"></i><span>' + t[1] + '</span><b>' + n + '</b></button>'; }).join('');
  $$('#rvStabs .stab').forEach(function(b){ b.onclick = function(){ S.rvSt = b.dataset.s; drawApproval(); }; });
  var q = $('rvQ').value.trim().toLowerCase(), fix = $('rvFix').checked, ps = pickIn(rvIds()), inPick = function(p){ return !ps.length || ps.indexOf(p.positionId) >= 0; };
  var list = active.filter(function(p){ return inPick(p) && (!S.rvSt || p.status === S.rvSt) && (!q || p.name.toLowerCase().indexOf(q) >= 0) && (!fix || p.blocking); });
  if (S.rvSt === 'OPEN') list = d.positions.filter(function(p){ return inPick(p) && p.status === 'OPEN' && (p.records || p.missing) && (!q || p.name.toLowerCase().indexOf(q) >= 0) && (!fix || p.blocking); });
  var t = { rec: 0, blk: 0, fl: 0, amt: 0 }; list.forEach(function(p){ t.rec += p.records; t.blk += p.blocking; t.fl += p.flagged; t.amt += p.amount; });
  var h = demoBanner(d.ym) + '<div class="kpis">' + kpi('journal-check', 'ic-info', 'รายการ (ตำแหน่งที่แสดง)', t.rec) + kpi('exclamation-octagon', t.blk ? 'ic-bad' : 'ic-ok', 'ต้องแก้ไข', t.blk) + kpi('flag', t.fl ? 'ic-warn' : 'ic-ok', 'มีข้อสังเกต', t.fl) + kpi('cash-coin', 'ic-brand', 'ค่าตอบแทน (บาท)', t.amt, 2) + '</div>';
  h += apCta(list);
  h += '<div class="tbl"><table class="table table-hover"><thead><tr><th style="width:36px"><input class="form-check-input" type="checkbox" id="apAll" aria-label="เลือกทั้งหมด"></th><th>ตำแหน่ง</th><th>สถานะ</th><th class="num">คน</th><th class="num">รายการ</th><th class="num">ต้องแก้ไข</th><th class="num">ข้อสังเกต</th><th class="num">ไม่มีบันทึก</th><th class="num">เวร / OT</th><th class="num">ค่าตอบแทน</th><th></th></tr></thead><tbody>';
  list.forEach(function(p){
    var st = p.status === 'SUBMITTED' ? 'ส่งเมื่อ ' + p.submittedAt : p.status === 'REVIEWED' ? 'ตรวจแล้ว ' + p.reviewedAt : p.status === 'APPROVED' ? 'อนุมัติ ' + p.approvedAt : '';
    h += '<tr><td><input class="form-check-input ap-sel" type="checkbox" data-id="' + p.positionId + '" aria-label="เลือก ' + esc(p.name) + '"></td><td><div class="who"><b>' + esc(p.name) + '</b><small>' + esc(p.groupName) + '</small></div></td>' +
      '<td>' + statusPill(p.status) + (st ? '<div class="small-muted">' + esc(st) + '</div>' : '') + (p.reason ? '<span class="flag bad">' + esc(p.reason) + '</span>' : '') + hrmiNote(p) + '</td>' +
      '<td class="num">' + p.people + '</td><td class="num">' + p.records + '</td><td class="num">' + (p.blocking ? '<a href="#" class="pill p-bad nodot" onclick="rvDetail([\'' + p.positionId + '\'],\'fix\');return false">' + p.blocking + '</a>' : '<span class="text-success fw-semibold">0</span>') + '</td>' +
      '<td class="num">' + (p.flagged ? '<a href="#" class="pill p-warn nodot" onclick="rvDetail([\'' + p.positionId + '\'],\'flag\');return false">' + p.flagged + '</a>' : '0') + '</td><td class="num">' + (p.missing ? '<a href="#" class="pill p-warn nodot" onclick="rvDetail([\'' + p.positionId + '\'],\'miss\');return false">' + p.missing + '</a>' : '0') + '</td>' +
      '<td class="num">' + fmt(p.shifts) + ' / ' + fmt(p.ot, 1) + '</td><td class="num fw-semibold">' + fmt(p.amount, 2) + '</td>' +
      '<td class="text-nowrap text-end"><button class="btn btn-sm btn-ghost" onclick="rvDetail([\'' + p.positionId + '\'])"><i class="bi bi-search"></i> รายละเอียด</button></td></tr>';
  });
  if (!list.length) h += '<tr><td colspan="11">' + empty('inboxes', 'ไม่มีตำแหน่งในสถานะนี้') + '</td></tr>';
  h += '</tbody></table></div>';
  if (list.length > 1) h += '<div class="mt-2"><button class="btn btn-sm btn-soft" onclick="rvDetail(' + JSON.stringify(list.map(function(p){ return p.positionId; })).replace(/"/g, '&quot;') + ')"><i class="bi bi-list-ul"></i> ดูรายละเอียดทุกตำแหน่งที่แสดง (' + list.length + ')</button></div>';
  $('rvBody').innerHTML = h;
  animateKpis();
  $('apAll').onchange = function(){ var on = this.checked; $$('.ap-sel').forEach(function(c){ c.checked = on; }); apBar(); };
  $$('.ap-sel').forEach(function(c){ c.onchange = apBar; });
  apBar();
}
/** v1.3.1 ปุ่มดำเนินการทั้งหมดในแท็บที่เลือก (ไม่ต้องทำทีละตำแหน่ง) */
function apCta(list){
  var st = S.rvSt, ids, txt, fn, ic, cls = 'btn-brand';
  var entryIds = posIdsFor(['ENTRY']);
  if (st === 'SUBMITTED' && S._ap.canReviewAny) { ids = list.filter(function(p){ return p.canReview; }); txt = 'ผ่านการตรวจสอบทั้งหมด'; fn = 'apAllDo(\'review\')'; ic = 'check2-circle'; cls = 'btn-ok'; }
  else if (st === 'REVIEWED' && S._ap.canApprove) { ids = list; txt = 'อนุมัติทั้งหมด'; fn = 'apAllDo(\'approve\')'; ic = 'lock'; }
  else if ((st === 'OPEN' || st === 'RETURNED') && entryIds.length) { ids = list.filter(function(p){ return entryIds.indexOf(p.positionId) >= 0 && p.records && !p.blocking; }); txt = 'ส่งตรวจสอบทั้งหมดที่พร้อม'; fn = 'apAllDo(\'submit\')'; ic = 'send'; }
  if (!ids) return '';
  S._apAll = ids.map(function(p){ return p.positionId; });
  var blk = list.filter(function(p){ return p.blocking; }).length;
  return '<div class="cta' + (ids.length ? '' : ' cta-off') + '"><div class="cta-ic"><i class="bi bi-' + ic + '"></i></div><div class="flex-grow-1"><b>' + txt + '</b><div class="small-muted">' + ids.length + ' ตำแหน่งในแท็บนี้' + (blk ? ' · มีรายการต้องแก้ไข ' + blk + ' ตำแหน่ง (กดตัวเลขสีแดงเพื่อดู)' : '') + '</div></div>' +
    '<button class="btn btn-ghost" onclick="$$(\'.ap-sel\').forEach(function(c){c.checked=true});$(\'apAll\').checked=true;apBar()"><i class="bi bi-check2-square"></i> เลือกทั้งหมด</button>' +
    (ids.length ? '<button class="btn ' + cls + '" onclick="' + fn + '"><i class="bi bi-' + ic + '"></i> ' + txt + ' (' + ids.length + ')</button>' : '') + '</div>';
}
function apAllDo(kind){
  var ids = S._apAll || []; if (!ids.length) return;
  $$('.ap-sel').forEach(function(c){ c.checked = ids.indexOf(c.dataset.id) >= 0; });
  if (kind === 'review') return apReview();
  if (kind === 'approve') return apApprove();
  confirmBox('ส่งตรวจสอบ ' + ids.length + ' ตำแหน่ง', 'ระบบจะดึงข้อมูลสแกนล่าสุดและตรวจทุกรายการก่อนส่ง ตำแหน่งที่ยังมีรายการต้องแก้ไขจะไม่ถูกส่ง', 'ส่งตรวจสอบ').then(function(ok){
    if (ok) api('submitMonths', { ym: S.ym, positionIds: ids }, { block: 'กำลังดึงข้อมูลสแกนและตรวจรายการ…' }).then(function(r){ actionBar(''); resultBox('ผลการส่งตรวจสอบ', r.results); loadApproval(); }).catch(function(){});
  });
}
function apSelected(){ return $$('.ap-sel').filter(function(c){ return c.checked; }).map(function(c){ return c.dataset.id; }); }
function apBar(){
  var ids = apSelected();
  if (!ids.length) return actionBar('');
  var st = {}; S._ap.positions.forEach(function(p){ st[p.positionId] = p; });
  var n = function(list, needReview){ return ids.filter(function(id){ return list.indexOf(st[id].status) >= 0 && (!needReview || st[id].canReview); }).length; };
  var h = '<span class="cnt">เลือก ' + ids.length + ' ตำแหน่ง</span>';
  if (S._ap.canReviewAny) {
    h += '<button class="btn btn-sm btn-ok" onclick="apReview()"' + (n(['SUBMITTED'], 1) ? '' : ' disabled') + '><i class="bi bi-check2-circle"></i> ผ่านการตรวจสอบ (' + n(['SUBMITTED'], 1) + ')</button>';
    h += '<button class="btn btn-sm btn-ghost" onclick="apReturn()"' + (n(['SUBMITTED', 'REVIEWED'], 1) ? '' : ' disabled') + '><i class="bi bi-arrow-return-left"></i> ส่งกลับแก้ไข (' + n(['SUBMITTED', 'REVIEWED'], 1) + ')</button>';
  }
  if (S._ap.canApprove) h += '<button class="btn btn-sm btn-brand" onclick="apApprove()"' + (n(['REVIEWED']) ? '' : ' disabled') + '><i class="bi bi-lock"></i> อนุมัติ (' + n(['REVIEWED']) + ')</button>';
  if (S._ap.canRollback) h += '<button class="btn btn-sm btn-ghost" onclick="rollbackDlg(apSelected(), S.ym, loadApproval)"' + (n(['SUBMITTED', 'REVIEWED', 'APPROVED', 'RETURNED']) ? '' : ' disabled') + '><i class="bi bi-arrow-counterclockwise"></i> ย้อนสถานะ</button>';
  h += '<button class="btn btn-sm btn-ghost" onclick="rvDetail(apSelected())"><i class="bi bi-search"></i> รายละเอียด</button>';
  h += '<button class="btn btn-sm btn-ghost" onclick="$$(\'.ap-sel\').forEach(function(c){c.checked=false});$(\'apAll\').checked=false;apBar()">ยกเลิก</button>';
  actionBar(h);
}
function apPick(status, needReview){ var st = {}; S._ap.positions.forEach(function(p){ st[p.positionId] = p; }); return apSelected().filter(function(id){ return status.indexOf(st[id].status) >= 0 && (!needReview || st[id].canReview); }); }
function apReview(){
  var ids = apPick(['SUBMITTED'], 1);
  confirmBox('ผ่านการตรวจสอบ ' + ids.length + ' ตำแหน่ง', 'ยืนยันว่าได้ตรวจสอบข้อมูลแล้วถูกต้อง และส่งต่อให้ผู้จัดการคลินิกพิจารณาอนุมัติ', 'ผ่านการตรวจสอบ').then(function(ok){
    if (ok) api('reviewMonths', { ym: S.ym, positionIds: ids }, { block: 'กำลังบันทึกผลการตรวจสอบ…' }).then(function(r){ actionBar(''); resultBox('ผลการตรวจสอบ', r.results); loadApproval(); }).catch(function(){});
  });
}
function apReturn(){
  var ids = apPick(['SUBMITTED', 'REVIEWED'], 1);
  promptBox('ส่งกลับแก้ไข ' + ids.length + ' ตำแหน่ง', 'เหตุผล (ผู้บันทึกข้อมูลจะเห็นข้อความนี้)', 'เช่น โปรดตรวจสอบใบที่ 2 วันที่ 5 อีกครั้ง').then(function(reason){
    if (reason) api('returnMonths', { ym: S.ym, positionIds: ids, reason: reason }, { block: 'กำลังส่งกลับแก้ไข…' }).then(function(r){ actionBar(''); resultBox('ผลการส่งกลับแก้ไข', r.results); loadApproval(); }).catch(function(){});
  });
}
function apApprove(){
  var ids = apPick(['REVIEWED']);
  var amt = S._ap.positions.filter(function(p){ return ids.indexOf(p.positionId) >= 0; }).reduce(function(a, p){ return a + p.amount; }, 0);
  passwordBox('อนุมัติและล็อก ' + ids.length + ' ตำแหน่ง', 'เดือน ' + thYm(S.ym) + ' · ค่าตอบแทนรวม ' + fmt(amt, 2) + ' บาท\nหลังอนุมัติ ข้อมูลจะถูกล็อกและแก้ไขไม่ได้', 'อนุมัติและล็อก', true).then(function(pw){
    if (pw !== null) api('approveMonths', { ym: S.ym, positionIds: ids, password: pw }, { block: 'กำลังบันทึกการอนุมัติ…' }).then(function(r){ actionBar(''); resultBox('ผลการอนุมัติ', r.results); loadApproval(); }).catch(function(){});
  });
}
/* ---------- รายละเอียด (ตำแหน่งเดียวหรือหลายตำแหน่ง) ---------- */
function rvDetail(ids, tab){
  if (!ids || !ids.length) return;
  $('rvDetail').innerHTML = skeleton(6);
  $('rvDetail').scrollIntoView({ behavior: 'smooth', block: 'start' });
  api('getReview', { ym: S.ym, positionIds: ids }).then(function(d){ S._rv = d; S.rvF = tab === 'fix' ? 'fix' : tab === 'flag' ? 'flag' : 'all'; renderReviewDetail(tab === 'miss' ? 'miss' : tab ? 'recs' : 'people'); }).catch(function(){ $('rvDetail').innerHTML = ''; });
}
function renderReviewDetail(tab){
  var d = S._rv;
  var blk = d.records.filter(function(r){ return r.blocking && r.scanStatus !== S.boot.scan.PENDING; }).length, fl = d.records.filter(function(r){ return !r.blocking && r.flags.length; }).length;
  var h = '<div class="card"><div class="card-h"><div class="ic-box ic-brand"><i class="bi bi-search"></i></div><div><h3>รายละเอียด: ' + (d.multi ? d.positionIds.length + ' ตำแหน่ง' : esc(d.position.name)) + '</h3><div class="sub">' + esc(d.thMonth) + (d.multi ? ' · ' + d.positions.map(function(p){ return esc(p.name); }).join(', ') : ' · ' + esc(S.boot.mstatus[d.status])) + '</div></div>' +
    '<div class="ms-auto d-flex gap-2"><button class="btn btn-sm btn-ghost" onclick="printReview()"><i class="bi bi-printer"></i> พิมพ์</button><button class="btn btn-sm btn-ghost" onclick="$(\'rvDetail\').innerHTML=\'\'" aria-label="ปิด"><i class="bi bi-x-lg"></i></button></div></div><div class="card-b">';
  h += '<ul class="nav nav-tabs mb-3" id="rvTabs"><li class="nav-item"><a class="nav-link" href="#" data-t="people"><i class="bi bi-people"></i> สรุปรายบุคคล</a></li><li class="nav-item"><a class="nav-link" href="#" data-t="recs"><i class="bi bi-list-ul"></i> รายการทั้งหมด (' + d.records.length + ')</a></li>' +
    '<li class="nav-item"><a class="nav-link" href="#" data-t="miss"><i class="bi bi-person-dash"></i> ไม่มีรายการบันทึก (' + d.missing.length + ')</a></li><li class="nav-item"><a class="nav-link" href="#" data-t="hist"><i class="bi bi-clock-history"></i> ประวัติสถานะ</a></li></ul>' +
    '<div class="d-flex flex-wrap gap-2 align-items-center mb-2" id="rvFbar"><div class="seg" id="rvF"><button data-f="all">ทั้งหมด</button><button data-f="fix">ต้องแก้ไข <span class="n">' + blk + '</span></button><button data-f="flag">มีข้อสังเกต <span class="n">' + fl + '</span></button></div><input class="form-control form-control-sm" id="rvQ2" placeholder="ค้นหาชื่อ / รหัส" style="max-width:220px"></div><div id="rvTab"></div></div></div>';
  $('rvDetail').innerHTML = h;
  $$('#rvTabs [data-t]').forEach(function(a){ a.classList.toggle('active', a.dataset.t === tab); a.onclick = function(e){ e.preventDefault(); $$('#rvTabs .nav-link').forEach(function(x){ x.classList.remove('active'); }); a.classList.add('active'); S.rvTab = a.dataset.t; rvTab(a.dataset.t); }; });
  $$('#rvF button').forEach(function(b){ b.classList.toggle('on', b.dataset.f === (S.rvF || 'all')); b.onclick = function(){ $$('#rvF button').forEach(function(x){ x.classList.remove('on'); }); b.classList.add('on'); S.rvF = b.dataset.f; rvTab(S.rvTab); }; });
  $('rvQ2').oninput = function(){ rvTab(S.rvTab); };
  S.rvTab = tab; rvTab(tab);
}
function rvMatch(r){
  var q = ($('rvQ2') ? $('rvQ2').value : '').trim().toLowerCase(), f = S.rvF || 'all';
  if (q && (r.name + ' ' + r.empCode).toLowerCase().indexOf(q) < 0) return false;
  if (f === 'fix') return r.blocking ? (r.blocking > 0 && (r.scanStatus === undefined || r.scanStatus !== S.boot.scan.PENDING)) : false;
  if (f === 'flag') return r.flagged !== undefined ? r.flagged > 0 : (!r.blocking && r.flags.length > 0);
  return true;
}
function rvTab(t){
  var d = S._rv, h = '';
  $('rvFbar').style.display = (t === 'hist') ? 'none' : '';
  if (t === 'people') {
    var list = d.people.filter(rvMatch);
    h = '<div class="tbl"><table class="table table-hover"><thead><tr><th>รหัส</th><th>ชื่อ-นามสกุล</th>' + (d.multi ? '<th>ตำแหน่ง</th>' : '') + '<th class="num">รายการ</th><th class="num">ต้องแก้ไข</th><th class="num">ข้อสังเกต</th><th class="num">เวร</th><th class="num">OT (ชม.)</th><th class="num">ค่าเวร</th><th class="num">ค่า OT</th><th class="num">รวม</th></tr></thead><tbody>' +
      (list.map(function(p){ return '<tr class="cursor" onclick="S.rvF=\'all\';$(\'rvQ2\').value=\'' + p.empCode + '\';$$(\'#rvTabs [data-t=recs]\')[0].click()"><td class="tnum">' + p.empCode + '</td><td>' + esc(p.name) + '</td>' + (d.multi ? '<td class="small">' + esc(p.positionName) + '</td>' : '') + '<td class="num">' + p.records + '</td><td class="num">' + (p.blocking ? '<span class="pill p-bad nodot">' + p.blocking + '</span>' : '0') + '</td><td class="num">' + (p.flagged ? '<span class="pill p-warn nodot">' + p.flagged + '</span>' : '0') + '</td><td class="num">' + fmt(p.shifts) + '</td><td class="num">' + fmt(p.ot, 1) + '</td><td class="num">' + fmt(p.duty, 2) + '</td><td class="num">' + fmt(p.otAmt, 2) + '</td><td class="num fw-bold">' + fmt(p.duty + p.otAmt, 2) + '</td></tr>'; }).join('') ||
      '<tr><td colspan="11">' + empty(S.rvF === 'fix' ? 'emoji-smile' : 'people', S.rvF === 'fix' ? 'ไม่มีบุคลากรที่ต้องแก้ไข' : 'ไม่พบข้อมูล') + '</td></tr>') + '</tbody></table></div>';
  } else if (t === 'recs') {
    var recs = d.records.filter(rvMatch);
    h = '<div class="tbl"><table class="table table-hover"><thead><tr><th>วันที่</th>' + (d.multi ? '<th>ตำแหน่ง</th>' : '') + '<th>ใบ</th><th>บุคลากร</th><th>เวลา</th><th>เวร</th><th class="num">OT</th><th>ผลสแกน</th><th>ไฟล์</th><th>ข้อสังเกต</th></tr></thead><tbody>' +
      (recs.map(function(r){
        return '<tr' + (r.empStatus === 'INACTIVE' ? ' class="inactive"' : '') + '><td class="text-nowrap">' + TH_D[dowOf(r.date)] + ' ' + thDate(r.date) + '</td>' + (d.multi ? '<td class="small">' + esc(r.positionName) + '</td>' : '') + '<td>' + esc(r.sheetNo) + '</td><td><div class="who"><b>' + esc(r.name) + '</b><small>' + r.empCode + (r.unit ? ' · ' + esc(r.unit) : '') + '</small></div></td><td class="tnum text-nowrap">' + r.timeIn + '–' + r.timeOut + '</td><td>' + codesTag(r.shiftCodes) + '</td>' +
          '<td class="num">' + (r.noClaim ? '<span title="' + esc(r.noClaimReason || '') + '">ไม่เบิก</span>' : fmt(r.otHours, 1)) + '</td><td>' + scanPill(r.scanStatus, r.lastScanOut) + '</td><td>' + attachCell(r, false) + '</td><td>' + r.flags.map(function(f){ return '<span class="flag ' + (r.blocking ? 'bad' : '') + '">' + esc(f) + '</span>'; }).join('') + esc(r.note) + '</td></tr>';
      }).join('') || '<tr><td colspan="10">' + empty('emoji-smile', 'ไม่พบรายการตามเงื่อนไข') + '</td></tr>') + '</tbody></table></div>' + legendHtml();
  } else if (t === 'miss') {
    var ms = d.missing.filter(function(m){ var q = ($('rvQ2').value || '').trim().toLowerCase(); return !q || (m.name + ' ' + m.empCode).toLowerCase().indexOf(q) >= 0; });
    h = ms.length ? '<div class="tbl"><table class="table"><thead><tr><th>วันที่</th>' + (d.multi ? '<th>ตำแหน่ง</th>' : '') + '<th>บุคลากร</th><th>เวร</th></tr></thead><tbody>' + ms.map(function(m){ return '<tr><td>' + TH_D[dowOf(m.date)] + ' ' + thDate(m.date) + '</td>' + (d.multi ? '<td class="small">' + esc(m.positionName) + '</td>' : '') + '<td><div class="who"><b>' + esc(m.name) + '</b><small>' + m.empCode + '</small></div></td><td>' + codesTag(m.slot) + '</td></tr>'; }).join('') + '</tbody></table></div><div class="small-muted mt-2">บุคลากรที่อยู่ในตารางเวร (ถึงวันนี้) แต่ยังไม่มีรายการบันทึก — อาจไม่ได้มาปฏิบัติงาน หรือยังไม่ได้บันทึก</div>' : empty('check2-circle', 'บุคลากรทุกคนในตารางมีรายการบันทึกแล้ว');
  } else {
    h = '<div class="timeline">' + (d.history.slice().reverse().map(function(x){ return '<div class="tl"><i class="dot"></i><div><b>' + esc(histText(x.action)) + '</b>' + (d.multi ? ' · ' + esc(x.positionName) : '') + ' · ' + esc(x.by) + ' <span class="small-muted">' + esc(x.at) + '</span>' + (x.reason ? '<div class="small-muted">' + esc(x.reason) + '</div>' : '') + '</div></div>'; }).join('') || empty('clock', 'ยังไม่มีประวัติ')) + '</div>';
  }
  $('rvTab').innerHTML = h;
}
function histText(a){ return { SUBMIT: 'ส่งตรวจสอบ', REVIEW_PASS: 'ผ่านการตรวจสอบ', RETURN: 'ส่งกลับแก้ไข', APPROVE_LOCK: 'อนุมัติและล็อก' }[a] || (String(a).indexOf('ROLLBACK') === 0 ? 'ย้อนสถานะ' : a); }
/** 2 ต.ค. 69 พิมพ์รายงานผลการตรวจสอบ: เลือกตำแหน่ง/กลุ่มที่จะพิมพ์ได้ (ติ๊กตำแหน่งที่เปิดดูอยู่ไว้ให้ก่อน) */
function printReview(){
  var cur = S._rv ? S._rv.positionIds : [], ids = (S._ap ? S._ap.positions : []).map(function(p){ return p.positionId; });
  if (ids.length < 2) return printReviewData(S._rv);
  printPick('พิมพ์รายงานผลการตรวจสอบ · เลือกตำแหน่ง', ids, cur, function(list){
    if (S._rv && JSON.stringify(list.slice().sort()) === JSON.stringify(cur.slice().sort())) return printReviewData(S._rv);
    api('getReview', { ym: S.ym, positionIds: list }, { block: 'กำลังรวบรวมรายการ…' }).then(printReviewData).catch(function(){});
  });
}
function printReviewData(d){
  if (!d) return;
  var recs = d.records.filter(rvMatch);
  var cols = [
    { t: 'วันที่', w: '9%', f: function(r){ return TH_D[dowOf(r.date)] + ' ' + thDate(r.date); } },
    { t: 'ใบ', w: '4%', f: function(r){ return r.sheetNo; } },
    { t: 'รหัส', w: '8%', f: function(r){ return r.empCode; } },
    { t: 'ชื่อ-นามสกุล', w: '17%', f: function(r){ return r.name; } },
    { t: 'เวลา', w: '9%', f: function(r){ return r.timeIn + '–' + r.timeOut; } },
    { t: 'เวร', w: '5%', f: function(r){ return lbl(r.shiftCodes); } },
    { t: 'OT', w: '5%', num: true, f: function(r){ return r.noClaim ? 'ไม่เบิก' : fmt(r.otHours, 1); } },
    { t: 'ผลสแกน', w: '12%', f: function(r){ return r.scanStatus + (r.lastScanOut ? ' ' + r.lastScanOut : ''); } },
    { t: 'ข้อสังเกต', f: function(r){ return r.flags.join(' · '); } }
  ];
  printReport({ title: 'รายงานผลการตรวจสอบการลงเวลาปฏิบัติงาน', subtitle: 'รอบเดือน ' + d.thMonth + ' · ' + (d.multi ? d.positionIds.length + ' ตำแหน่ง' : d.position.name),
    filters: 'แสดง: ' + ({ all: 'ทั้งหมด', fix: 'เฉพาะรายการต้องแก้ไข', flag: 'เฉพาะรายการมีข้อสังเกต' }[S.rvF || 'all']) + ($('rvQ2').value ? ' · ค้นหา "' + $('rvQ2').value + '"' : ''),
    bodyHtml: prTable(cols, recs, d.multi ? function(r){ return r.positionName; } : null), count: recs.length, kind: 'review' }).catch(function(){});
}

/* ================= v1.3 รายงานติดตามปัญหา ================= */
PAGES.followup = function(){
  var ids = posIdsFor(['ENTRY', 'REVIEWER', 'COORD', 'MANAGER']);
  var T = S.boot.issues || {};
  S.fuTypes = S.fuTypes || Object.keys(T).filter(function(k){ return k !== 'PENDING'; });
  mount(pageHead('งานประจำเดือน', 'รายงานติดตามปัญหา', 'รวมรายการที่ต้องติดตาม เช่น มีเวรแต่ไม่มีบันทึกเวลา ไม่พบสแกน ยังไม่แนบใบลืมสแกน เพื่อพิมพ์ไปติดตามกับเจ้าตัว (A4 แนวนอน พร้อมเลขอ้างอิง)',
      '<button class="btn btn-brand" onclick="fuPrint()"><i class="bi bi-printer"></i> พิมพ์รายงาน</button>') +
    '<div class="filters">' + ymSelect('fuYm', S.ym, 6, 0) + pickBtn('fuPick', ids) +
    '<div><label class="form-label">รูปแบบ</label><div class="seg" id="fuMode"><button data-v="all"' + (S.fuMode !== 'split' ? ' class="on"' : '') + '>รวมทุกปัญหา</button><button data-v="split"' + (S.fuMode === 'split' ? ' class="on"' : '') + '>แยกตามประเภท</button></div></div>' +
    '<div><label class="form-label" for="fuQ">ค้นหาบุคลากร</label><input class="form-control" id="fuQ" placeholder="ชื่อ หรือรหัส"></div>' +
    '<button class="btn btn-ghost align-self-end" onclick="loadFollow(this)"><i class="bi bi-arrow-repeat"></i> โหลดใหม่</button></div>' +
    '<div class="issue-chips" id="fuTypes"></div><div id="fuBody">' + skeleton(8) + '</div>');
  $('fuYm').onchange = function(){ S.ym = this.value; loadFollow(); };
  S._fuIds = ids; pickBind('fuPick', ids, function(){ loadFollow(); });
  $('fuQ').oninput = drawFollow;
  $$('#fuMode button').forEach(function(b){ b.onclick = function(){ $$('#fuMode button').forEach(function(x){ x.classList.remove('on'); }); b.classList.add('on'); S.fuMode = b.dataset.v; drawFollow(); }; });
  loadFollow();
};
function fuSel(){ var p = pickIn(S._fuIds || []); return p.length ? p : ['all']; }
function loadFollow(btn){
  var sel = fuSel(), fk = $('fuYm').value + '|' + sel.join(','); apiView('getFollowup', { ym: $('fuYm').value, positionIds: sel }, function(d){ if (!$('fuYm') || $('fuYm').value + '|' + fuSel().join(',') !== fk) return; S._fu = d; drawFollow(); }, { btn: btn }).catch(function(){});
}
function fuItems(){
  var d = S._fu, q = ($('fuQ').value || '').trim().toLowerCase();
  return d.items.filter(function(x){ return S.fuTypes.indexOf(x.type) >= 0 && (!q || (x.name + ' ' + x.empCode).toLowerCase().indexOf(q) >= 0); });
}
function drawFollow(){
  var d = S._fu; if (!d || !$('fuBody')) return;
  var T = S.boot.issues || {};
  $('fuTypes').innerHTML = Object.keys(T).map(function(k){ var on = S.fuTypes.indexOf(k) >= 0; return '<button type="button" class="ichip' + (on ? ' on' : '') + '" data-t="' + k + '"><span class="it it-' + k + '"></span>' + esc(T[k]) + ' <b>' + (d.counts[k] || 0) + '</b></button>'; }).join('') +
    '<button type="button" class="ichip ghost" data-t="*">เลือกทั้งหมด</button><button type="button" class="ichip ghost" data-t="-">ล้าง</button>';
  $$('#fuTypes .ichip').forEach(function(b){ b.onclick = function(){ var t = b.dataset.t; if (t === '*') S.fuTypes = Object.keys(T); else if (t === '-') S.fuTypes = []; else { var i = S.fuTypes.indexOf(t); if (i >= 0) S.fuTypes.splice(i, 1); else S.fuTypes.push(t); } drawFollow(); }; });
  var items = fuItems();
  var ppl = {}; items.forEach(function(x){ if (x.empCode) ppl[x.empCode] = 1; });
  var bad = items.filter(function(x){ return x.severity === 'bad'; }).length;
  var h = demoBanner(d.ym) + '<div class="kpis">' + kpi('clipboard2-pulse', 'ic-brand', 'รายการที่ต้องติดตาม', items.length) + kpi('person-exclamation', 'ic-warn', 'บุคลากรที่เกี่ยวข้อง', Object.keys(ppl).length) + kpi('exclamation-octagon', bad ? 'ic-bad' : 'ic-ok', 'ต้องแก้ไขก่อนส่งตรวจ', bad) + kpi('diagram-3', 'ic-info', 'ตำแหน่งที่มีรายการต้องติดตาม', (function(){ var o = {}; items.forEach(function(x){ o[x.positionId] = 1; }); return Object.keys(o).length; })()) + '</div>' +
    '<div class="small-muted mb-2"><i class="bi bi-fingerprint"></i> ข้อมูลสแกนล่าสุด ' + esc(d.lastScanSync || '-') + ' · "มีเวรแต่ไม่มีบันทึกเวลา" นับถึงวันนี้</div>';
  var row = function(x, noType){
    return '<tr><td>' + (noType ? '' : '<span class="itag ' + x.severity + '"><span class="it it-' + x.type + '"></span>' + esc(x.typeText) + '</span>') + '</td><td class="text-nowrap">' + TH_D[dowOf(x.date)] + ' ' + thDate(x.date) + '</td><td class="small">' + esc(x.positionName) + '</td><td>' + esc(x.sheetNo || '') + '</td>' +
      '<td>' + (x.empCode ? '<div class="who"><b>' + esc(x.name) + '</b><small>' + esc(x.empCode) + '</small></div>' : '—') + '</td><td class="tnum text-nowrap">' + esc(x.time || '') + '</td><td class="small">' + esc(x.detail) + '</td>' +
      '<td class="text-end">' + (x.empCode ? '<button class="btn btn-sm btn-ghost" onclick="S.enPid=\'' + x.positionId + '\';S.ym=\'' + d.ym + '\';go(\'entry\')" title="ไปหน้าบันทึกเวลา"><i class="bi bi-box-arrow-up-right"></i></button>' : '') + '</td></tr>';
  };
  var head = '<thead><tr><th style="width:190px">ปัญหา</th><th>วันที่</th><th>ตำแหน่ง</th><th>ใบ</th><th>บุคลากร</th><th>เวลา</th><th>รายละเอียด</th><th></th></tr></thead>';
  if (!items.length) h += empty('emoji-smile', 'ไม่พบรายการที่ต้องติดตามตามเงื่อนไขที่เลือก');
  else if (S.fuMode === 'split') {
    Object.keys(T).forEach(function(t){
      var l = items.filter(function(x){ return x.type === t; }); if (!l.length) return;
      h += '<div class="card mb-3"><div class="card-h"><span class="it it-' + t + ' big"></span><h3>' + esc(T[t]) + '</h3><span class="sub">' + l.length + ' รายการ</span></div><div class="tbl border-0 shadow-none" style="border-radius:0 0 16px 16px"><table class="table">' + head + '<tbody>' + l.map(function(x){ return row(x, true); }).join('') + '</tbody></table></div></div>';
    });
  } else {
    var last = null, rows = '';
    items.forEach(function(x){ if (x.positionName !== last) { last = x.positionName; rows += '<tr class="pos-h"><td colspan="8"><b>' + esc(last) + '</b></td></tr>'; } rows += row(x); });
    h += '<div class="tbl"><table class="table">' + head + '<tbody>' + rows + '</tbody></table></div>';
  }
  $('fuBody').innerHTML = h;
  animateKpis();
}
/** 2 ต.ค. 69 พิมพ์รายงานติดตาม: เลือกตำแหน่ง/กลุ่มที่จะพิมพ์ได้ (ติ๊กตำแหน่งที่แสดงอยู่ไว้ให้ก่อน) */
function fuPrint(){
  if (!S._fu) return;
  var ids = S._fuIds || [], cur = pickIn(ids);
  printPick('พิมพ์รายงานติดตามปัญหา · เลือกตำแหน่ง', ids, cur, function(list, all){
    var same = JSON.stringify((all ? [] : list).slice().sort()) === JSON.stringify(cur.slice().sort());
    if (same) return fuPrintData(S._fu);
    api('getFollowup', { ym: $('fuYm').value, positionIds: all ? ['all'] : list }, { block: 'กำลังรวบรวมรายการ…' }).then(fuPrintData).catch(function(){});
  });
}
function fuPrintData(d){
  var keep = S._fu; S._fu = d;
  var items = fuItems();
  S._fu = keep;
  var r = {}; for (var k in d) r[k] = d[k];
  r.items = items; r.counts = {}; items.forEach(function(x){ r.counts[x.type] = (r.counts[x.type] || 0) + 1; });
  var ppl = {}; items.forEach(function(x){ if (x.empCode) ppl[x.empCode] = 1; }); r.people = Object.keys(ppl).length;
  printFollowup(r, S.fuTypes.slice(), S.fuMode === 'split' ? 'split' : 'all').catch(function(){});
}

/* ================= จัดพิมพ์และส่งออกเอกสาร ================= */
PAGES.export = function(){
  var ids = posIdsFor(['ENTRY', 'REVIEWER', 'COORD', 'MANAGER']);
  var xl = S.boot.canExcel;
  var h = pageHead('งานประจำเดือน', 'จัดพิมพ์และส่งออกเอกสาร', 'กด "พิมพ์" แล้วหน้าต่างพิมพ์จะขึ้นทันที (ต้องการไฟล์ ให้เลือกเครื่องพิมพ์เป็น "บันทึกเป็น PDF") · ไฟล์ HRMi ดาวน์โหลดลงเครื่อง · ระบบไม่เก็บสำเนาไว้ใน Drive') +
    '<div class="filters">' + ymSelect('exYm', S.ym, 14, 2, 'รอบเดือน') +
    '<div class="flex-grow-1" style="min-width:260px;max-width:560px"><label class="form-label">ตำแหน่งที่จะพิมพ์ / ส่งออก (ใช้กับทุกเอกสารในหน้านี้)</label><button type="button" class="form-select pp-btn" id="exPick" onclick="exPick()"></button></div></div><div id="exDemo"></div><div class="row g-3">';
  h += '<div class="col-xl-6"><div class="card h-100"><div class="card-h"><div class="ic-box ic-brand"><i class="bi bi-table"></i></div><div><h3>ตารางเวรและตาราง OT</h3><div class="sub">รูปแบบเดียวกับเอกสารแนบเบิก มีช่องลงนามผู้ตรวจสอบและผู้รับรอง</div></div></div><div class="card-b">' +
    '<div><label class="form-label">ประเภทเอกสาร</label><div class="seg w-100" id="exDoc"><button type="button" data-v="duty">ตารางเวร</button><button type="button" data-v="ot">ตาราง OT</button><button type="button" data-v="both" class="on">ทั้งสองแบบ</button></div></div>' +
    '<div class="mt-2"><label class="form-label" for="exKind">ฉบับ</label><select class="form-select" id="exKind"><option value="pay">ฉบับเบิกจ่าย (แสดงจำนวนเงิน)</option><option value="check">ฉบับตรวจสอบ (ไม่แสดงจำนวนเงิน)</option></select></div>' +
    '<div class="mt-3 d-flex gap-2 flex-wrap"><button class="btn btn-brand" onclick="exTables(\'pdf\',this)"><i class="bi bi-printer"></i> พิมพ์ / บันทึก PDF</button>' +
    (xl ? '<button class="btn btn-ghost" onclick="exTables(\'xlsx\',this)"><i class="bi bi-file-earmark-excel"></i> ดาวน์โหลด Excel</button>' : '<span class="small-muted align-self-center"><i class="bi bi-lock"></i> ไฟล์ Excel สำหรับผู้ดูแลระบบเท่านั้น</span>') + '</div>' +
    '<div class="small-muted mt-2">ตำแหน่งที่ยังไม่อนุมัติ เอกสารจะมีข้อความ "ฉบับร่าง – ยังไม่ได้รับอนุมัติ" · มีเลขหน้าและข้อมูลผู้จัดพิมพ์ทุกหน้า</div></div></div></div>';
  h += '<div class="col-xl-6"><div class="card h-100"><div class="card-h"><div class="ic-box ic-info"><i class="bi bi-pen"></i></div><div><h3>ใบลงชื่อปฏิบัติงาน FM-HRM-031</h3><div class="sub">พิมพ์ได้ทุกตำแหน่งพร้อมกัน จำนวนใบตามกรอบเวรที่คลินิกกำหนด</div></div></div><div class="card-b">' +
    '<div><label class="form-label">รายชื่อในใบ</label><div class="seg w-100" id="exSignMode"><button type="button" data-v="names" class="on">ใส่รายชื่อตามตารางเวร</button><button type="button" data-v="blank">ไม่ใส่รายชื่อ (ใบเปล่า)</button></div></div>' +
    '<div class="mt-2" id="exSheetsBox" hidden><label class="form-label" for="exSheets">จำนวนใบ (ไม่ระบุ = ตามกรอบเวร)</label><input class="form-control" id="exSheets" type="number" min="1" max="40" style="max-width:140px"></div>' +
    '<div class="mt-3 d-flex gap-2 flex-wrap"><button class="btn btn-brand" onclick="exSign(\'pdf\',this)"><i class="bi bi-printer"></i> พิมพ์ / บันทึก PDF</button>' +
    (xl ? '<button class="btn btn-ghost" onclick="exSign(\'xlsx\',this)"><i class="bi bi-file-earmark-excel"></i> ดาวน์โหลด Excel</button>' : '') + '</div>' +
    '<div class="small-muted mt-2">ตัวอย่าง: กรอบพยาบาลเดือนนี้สูงสุด 7 คน → ได้ใบที่ 1–7 · วันที่กรอบน้อยกว่า (เช่น 5 คน) ใบที่ 6–7 ของวันนั้นเป็นช่องสีเทาทึบ ห้ามลงชื่อ · วันปิดคลินิกทึบทั้งแถว</div></div></div></div>';
  h += '<div class="col-xl-6"><div class="card h-100"><div class="card-h"><div class="ic-box ic-warn"><i class="bi bi-paperclip"></i></div><div><h3>ใบลืมสแกนรวมเล่ม</h3><div class="sub">รวมไฟล์แนบทั้งเดือนเป็น PDF ไฟล์เดียว พร้อมหัวกระดาษระบุรายการ</div></div></div><div class="card-b">' +
    '<div><button class="btn btn-brand" onclick="exAtt()"><i class="bi bi-printer"></i> รวมเป็นเล่ม PDF เพื่อพิมพ์</button></div><div class="small-muted mt-2">เรียงตามตำแหน่งและวันที่ · ไฟล์รูปและ PDF รวมอยู่ในเล่มเดียว</div></div></div></div>';
  // 28 ก.ย. 69: ผู้บันทึกข้อมูลส่งออก HRMi ได้ (เฉพาะตำแหน่งที่ตนดูแล) · ประสานงาน/แอดมิน ทุกตำแหน่ง
  if (has('COORD') || has('ENTRY')) {
    var hrIds = has('COORD') ? S.boot.positions.filter(function(p){ return p.paid !== false; }).map(function(p){ return p.id; }) : posIdsFor(['ENTRY']).filter(function(id){ var p = posOf(id); return p && p.paid !== false; });
    h += '<div class="col-xl-6"><div class="card h-100"><div class="card-h"><div class="ic-box ic-ok"><i class="bi bi-database-up"></i></div><div><h3>ไฟล์นำเข้า HRMi</h3><div class="sub">ดาวน์โหลดได้ตั้งแต่ตำแหน่งนั้น "ส่งตรวจแล้ว" ไม่ต้องรออนุมัติ · นำเข้า HRMi ภายในวันที่ 4 ของเดือนถัดไป</div></div></div><div class="card-b">' +
      '<div class="row g-2"><div class="col-sm-6"><label class="form-label" for="hrType">ประเภท</label><select class="form-select" id="hrType"><option value="all">ค่าเวรและค่า OT</option><option value="duty">ค่าเวร</option><option value="ot">ค่า OT</option></select></div>' +
      '<div class="col-sm-6"><label class="form-label" for="hrMode">รูปแบบไฟล์</label><select class="form-select" id="hrMode"><option value="combined">ไฟล์เดียว (1 ชีทต่อรหัสรายได้)</option><option value="split">แยกไฟล์ตามรหัสรายได้</option><option value="zip">ZIP (แยกไฟล์รวมในไฟล์เดียว)</option></select></div></div>' +
      '<div class="mt-3"><button class="btn btn-brand" onclick="exHRMi(this)"><i class="bi bi-download"></i> ดาวน์โหลดไฟล์ HRMi</button></div><div id="hrRes" class="small-muted mt-2"></div></div></div></div>';
  }
  h += '<div class="col-xl-6"><div class="card h-100"><div class="card-h"><div class="ic-box ic-info"><i class="bi bi-calendar3"></i></div><div><h3>ตารางเวรสำหรับแจกหน่วยงาน</h3><div class="sub">A4 แนวนอน แบบ Google Sheet · ใครขึ้นเวรวันไหน กรอบต่อวัน รวมต่อคน (ไม่แสดงเงิน)</div></div></div><div class="card-b">' +
    '<button class="btn btn-brand" onclick="exRoster(this)"><i class="bi bi-printer"></i> พิมพ์ / บันทึก PDF</button><div class="small-muted mt-2">ตำแหน่งละ 1 หน้า · เวรที่ยังรออนุมัติมีเครื่องหมาย * และหัวกระดาษระบุ "ฉบับร่าง" · บุคลากรทุกคนพิมพ์ได้จากหน้า "ตารางเวรรวม"</div></div></div></div>';
  h += '<div class="col-12"><div class="card"><div class="card-h"><div class="ic-box ic-violet"><i class="bi bi-person-check"></i></div><div><h3>ผู้ลงนามในเอกสาร</h3><div class="sub">ผู้ตรวจสอบตั้งแยกตามตำแหน่งได้ · ผู้รับรองคือผู้จัดการคลินิกคนเดียวทุกเอกสาร</div></div><button class="btn btn-sm btn-ghost ms-auto" id="psToggle" onclick="psToggle()"><i class="bi bi-sliders"></i> ตั้งผู้ตรวจสอบรายตำแหน่ง</button></div><div class="card-b" id="psBody"><div class="skel"></div></div></div></div>';
  mount(h + '</div>');
  S._exIds = ids; S._hrIds = (has('COORD') || has('ENTRY')) ? hrIds : [];
  exPickShow();
  loadPosSigners();
  $$('#exSignMode button').forEach(function(b){ b.onclick = function(){ $$('#exSignMode button').forEach(function(x){ x.classList.remove('on'); }); b.classList.add('on'); }; });
  // 28 ก.ย. 69: เลือกเดือนล่วงหน้าได้ (พิมพ์ใบลงชื่อไปให้ลงชื่อระหว่างเดือน) · ไม่เปลี่ยนเดือนของหน้าอื่นเป็นเดือนอนาคต
  $('exYm').onchange = function(){ if (this.value <= S.boot.ym) S.ym = this.value; $('exDemo').innerHTML = demoBanner(this.value) + (this.value > S.boot.ym ? '<div class="alert alert-info py-2 small mb-3"><i class="bi bi-calendar-plus"></i> เดือนล่วงหน้า: ใบลงชื่อใส่รายชื่อตามตารางเวรที่ลงไว้ขณะนี้ (รวมรายการที่ยังรอยืนยัน) · ตารางเวร/OT และไฟล์ HRMi ใช้ได้หลังปฏิบัติงานและอนุมัติแล้ว</div>' : ''); };
  $('exDemo').innerHTML = demoBanner($('exYm').value);
  $$('#exDoc button').forEach(function(b){ b.onclick = function(){ $$('#exDoc button').forEach(function(x){ x.classList.remove('on'); }); b.classList.add('on'); }; });
};
/** 1 ต.ค. 69 ตำแหน่งที่เลือก (ใช้ร่วมทุกเอกสารในหน้า) · ว่าง = ทุกตำแหน่ง */
function exPickShow(){
  var sel = pickIn(S._exIds);
  if ($('exPick')) $('exPick').innerHTML = '<i class="bi bi-ui-checks me-1"></i> ' + esc(posPickSummary(S._exIds, sel));
  if ($('exSheetsBox')) $('exSheetsBox').hidden = sel.length !== 1;
}
function exPick(){ posPickModal('เลือกตำแหน่งที่จะพิมพ์ / ส่งออก (ใช้ร่วมกันทุกหน้า)', S._exIds, pickIn(S._exIds), 'ใช้ตำแหน่งที่เลือก', function(list){ pickSet(list); exPickShow(); }); }
/** ตำแหน่งที่เลือก ภายในรายการที่เอกสารนั้นรองรับ → ['all'] หรือ [ids] · null = ไม่มีตำแหน่งที่พิมพ์ได้ */
function exSel(allowed){
  var sel = pickIn(S._exIds);
  if (!sel.length) return ['all'];
  var ok = sel.filter(function(id){ return !allowed || allowed.indexOf(id) >= 0; });
  if (!ok.length) { alertBox('ไม่มีตำแหน่งที่ใช้กับเอกสารนี้ได้', 'ตำแหน่งที่เลือกไม่มีสิทธิ์หรือไม่อยู่ในเอกสารประเภทนี้ กรุณาเลือกตำแหน่งใหม่', 'info'); return null; }
  return ok;
}
function exAtt(){ var s = exSel(); if (s) printAttachments($('exYm').value, s); }
function exRoster(btn){ var s = exSel(); if (!s) return; api('printRoster', { ym: $('exYm').value, positionIds: s }, { btn: btn, block: 'กำลังเตรียมตารางเวรสำหรับพิมพ์…' }).then(printRosterDoc).catch(function(){}); }
/** หน้าตารางเวรรวม: ทุกคนพิมพ์ตารางเวรแนวนอนของตำแหน่งที่ตนเห็นได้ */
function rosterDlg(){
  var ids = viewIds(), ymEl = $('ovYm') || $('bkYm'), posEl = $('bkPos'), ym = ymEl ? ymEl.value : S.ym;
  var cur = posEl && posEl.value && posEl.value !== 'all' && ids.indexOf(posEl.value) >= 0 ? [posEl.value] : pickIn(ids);   // 2 ต.ค. 69 ใช้ตำแหน่งที่เลือกไว้ (ร่วมทุกหน้า)
  posPickModal('พิมพ์ตารางเวร (แจกหน่วยงาน) · ' + thYm(ym), ids, cur, '<i class="bi bi-printer"></i> พิมพ์', function(list){
    S.rosterPids = list;
    api('printRoster', { ym: ym, positionIds: list.length ? list : ['all'] }, { block: 'กำลังเตรียมตารางเวรสำหรับพิมพ์…' }).then(printRosterDoc).catch(function(){});
  });
}
function rosterBtn(){ return ''; }
function exTables(fmt2, btn){
  var on = $$('#exDoc .on')[0], doc = on ? on.dataset.v : 'both';
  // 29 ก.ย. 69: PDF = พิมพ์จากเบราว์เซอร์ทันที (ไม่สร้างไฟล์ที่เซิร์ฟเวอร์) · Excel (ผู้ดูแลระบบ) ยังสร้างที่เซิร์ฟเวอร์
  var sel = exSel(); if (!sel) return;
  if (fmt2 !== 'xlsx') return api('printTables', { ym: $('exYm').value, positionIds: sel, docType: doc, kind: $('exKind').value }, { btn: btn, block: 'กำลังเตรียมเอกสารสำหรับพิมพ์…' }).then(printTablesDoc).catch(function(){});
  api('exportTables', { ym: $('exYm').value, positionIds: sel, docType: doc, kind: $('exKind').value, format: fmt2 }, { btn: btn, timeout: 360000, block: 'กำลังจัดทำเอกสาร อาจใช้เวลา 10–90 วินาที…' }).then(function(r){ download(r.files); }).catch(function(){});
}
function exSign(fmt2, btn){
  var on = $$('#exSignMode .on')[0], blank = on && on.dataset.v === 'blank', sel = exSel(); if (!sel) return;
  var pid = sel.length === 1 ? sel[0] : 'all';
  if (fmt2 !== 'xlsx') return api('printSignSheets', { ym: $('exYm').value, positionId: pid, positionIds: sel, blank: blank, sheets: pid === 'all' ? '' : $('exSheets').value }, { btn: btn, block: 'กำลังเตรียมใบลงชื่อสำหรับพิมพ์…' }).then(function(r){
    if (r.positions > 1 || r.skipped) notify('ใบลงชื่อ ' + r.sheets + ' ใบ' + (r.positions > 1 ? ' (' + r.positions + ' ตำแหน่ง)' : '') + (r.skipped ? ' · ข้าม ' + r.skipped + ' ตำแหน่งที่ไม่มีกรอบเวร' : ''), 'info');
    return printSignDoc(r);
  }).catch(function(){});
  api('exportSignSheets', { ym: $('exYm').value, positionId: pid, blank: blank, sheets: pid === 'all' ? '' : $('exSheets').value, format: fmt2 },
    { btn: btn, timeout: 360000, block: pid === 'all' ? 'กำลังจัดทำใบลงชื่อทุกตำแหน่ง อาจใช้เวลา 1–3 นาที…' : 'กำลังจัดทำใบลงชื่อ…' }).then(function(r){
    download(r.files);
    notify('จัดทำใบลงชื่อ ' + r.sheets + ' ใบ' + (r.positions > 1 ? ' (' + r.positions + ' ตำแหน่ง)' : '') + (r.skipped ? ' · ข้าม ' + r.skipped + ' ตำแหน่งที่ไม่มีกรอบเวร' : ''));
  }).catch(function(){});
}
/* ---------- ผู้ลงนาม: ผู้ตรวจสอบรายตำแหน่ง ---------- */
var PS_MODES = [['default', 'ผู้ตรวจสอบกลาง'], ['custom', 'ระบุชื่อผู้ตรวจสอบ'], ['blank', 'เว้นว่าง (เขียนชื่อเอง)'], ['none', 'ไม่มีช่องผู้ตรวจสอบ']];
function loadPosSigners(){
  api('getPosSigners', {}).then(function(d){ S._ps = d; S._psOpen = S._psOpen || false; drawPosSigners(); }).catch(function(){ if ($('psBody')) $('psBody').innerHTML = '<span class="small-muted">โหลดข้อมูลผู้ลงนามไม่สำเร็จ</span>'; });
}
function psToggle(){ S._psOpen = !S._psOpen; drawPosSigners(); }
function psLabel(x, d){
  if (x.m === 'custom') return esc(x.n) + (x.t ? '<div class="small-muted">' + esc(x.t) + '</div>' : '');
  if (x.m === 'blank') return '<span class="text-secondary">เว้นว่างให้เขียนชื่อ</span>';
  if (x.m === 'none') return '<span class="text-secondary">ไม่มีช่องผู้ตรวจสอบ</span>';
  return esc(d.s1) + ' <span class="pill p-mute">ผู้ตรวจสอบกลาง</span>';
}
function drawPosSigners(){
  var d = S._ps, box = $('psBody'); if (!d || !box) return;
  $('psToggle').innerHTML = S._psOpen ? '<i class="bi bi-chevron-up"></i> ย่อ' : '<i class="bi bi-sliders"></i> ตั้งผู้ตรวจสอบรายตำแหน่ง';
  var h = '<div class="row g-3 mb-2"><div class="col-md-6"><div class="ps-def"><div class="small-muted">ผู้ตรวจสอบกลาง (ใช้เมื่อตำแหน่งไม่ได้ระบุ)</div><b>' + esc(d.def.s1 || '-') + '</b><div class="small-muted">' + esc(d.def.t1 || '') + '</div></div></div>' +
    '<div class="col-md-6"><div class="ps-def"><div class="small-muted">ผู้รับรอง (ทุกเอกสาร)</div><b>' + esc(d.def.s2 || '-') + '</b><div class="small-muted">' + esc(d.def.t2 || '') + '</div></div></div></div>' +
    (d.canDefault ? '<div class="small-muted mb-2"><i class="bi bi-info-circle"></i> แก้ชื่อผู้ตรวจสอบกลางและผู้รับรองได้ที่เมนู การตั้งค่า → ผู้ลงนามในเอกสาร</div>' : '');
  if (!d.list.length) { box.innerHTML = h + '<span class="small-muted">ท่านไม่มีตำแหน่งที่ตั้งผู้ตรวจสอบได้</span>'; return; }
  if (!S._psOpen) {
    var custom = d.list.filter(function(x){ return x.m !== 'default'; });
    h += '<div class="small-muted">' + (custom.length ? 'ตำแหน่งที่ตั้งผู้ตรวจสอบเอง ' + custom.length + ' ตำแหน่ง: ' + custom.map(function(x){ return '<span class="chip">' + esc(x.name) + '</span>'; }).join(' ') : 'ทุกตำแหน่งใช้ผู้ตรวจสอบกลาง') + '</div>';
    box.innerHTML = h; return;
  }
  h += '<div class="tbl"><table class="table ps-tbl mb-0"><thead><tr><th>ตำแหน่ง</th><th style="width:210px">ผู้ตรวจสอบ</th><th>ชื่อ-นามสกุล</th><th>ตำแหน่งผู้ตรวจสอบ</th><th style="width:44px"></th></tr></thead><tbody>';
  var lastG = null;
  d.list.forEach(function(x, i){
    if (x.groupName !== lastG) { lastG = x.groupName; h += '<tr class="ps-g"><td colspan="5">' + esc(x.groupName || 'ไม่ระบุกลุ่ม') + '</td></tr>'; }
    h += '<tr data-i="' + i + '"><td><b>' + esc(x.name) + '</b>' + (x.by ? '<div class="small-muted">แก้ไขล่าสุด ' + esc(x.by) + '</div>' : '') + '</td>' +
      '<td><select class="form-select form-select-sm ps-m" aria-label="รูปแบบผู้ตรวจสอบ ' + esc(x.name) + '">' + PS_MODES.map(function(m){ return '<option value="' + m[0] + '"' + (x.m === m[0] ? ' selected' : '') + '>' + m[1] + '</option>'; }).join('') + '</select></td>' +
      '<td><input class="form-control form-control-sm ps-n" maxlength="80" value="' + esc(x.n) + '" placeholder="เช่น นางสาวสมใจ ใจดี" aria-label="ชื่อผู้ตรวจสอบ"></td>' +
      '<td><input class="form-control form-control-sm ps-t" maxlength="120" value="' + esc(x.t) + '" placeholder="เช่น หัวหน้าฝ่ายเภสัชกรรม" aria-label="ตำแหน่งผู้ตรวจสอบ"></td>' +
      '<td><button type="button" class="btn btn-sm btn-ghost ps-cp" title="ใช้กับทุกตำแหน่งในกลุ่ม ' + esc(x.groupName || '') + '"><i class="bi bi-copy"></i></button></td></tr>';
  });
  h += '</tbody></table></div><div class="d-flex gap-2 flex-wrap align-items-center mt-2"><button class="btn btn-brand" onclick="savePosSigners(this)"><i class="bi bi-save"></i> บันทึกผู้ตรวจสอบ</button><span class="small-muted">ปุ่ม <i class="bi bi-copy"></i> คัดลอกผู้ตรวจสอบไปทุกตำแหน่งในกลุ่มเดียวกัน · มีผลกับตารางเวร ตาราง OT และใบลงชื่อที่พิมพ์หลังบันทึก</span></div>';
  box.innerHTML = h;
  var sync = function(tr){ var m = tr.querySelector('.ps-m').value; tr.querySelector('.ps-n').disabled = m !== 'custom'; tr.querySelector('.ps-t').disabled = m === 'default' || m === 'none'; tr.querySelector('.ps-n').placeholder = m === 'default' ? d.def.s1 : m === 'blank' ? 'เขียนชื่อด้วยมือ' : m === 'none' ? '-' : 'เช่น นางสาวสมใจ ใจดี'; };
  $$('.ps-tbl tbody tr[data-i]').forEach(function(tr){
    sync(tr);
    tr.querySelector('.ps-m').onchange = function(){ sync(tr); };
    tr.querySelector('.ps-cp').onclick = function(){
      var g = d.list[+tr.dataset.i].groupName, m = tr.querySelector('.ps-m').value, n = tr.querySelector('.ps-n').value, t = tr.querySelector('.ps-t').value, cnt = 0;
      $$('.ps-tbl tbody tr[data-i]').forEach(function(o){ if (d.list[+o.dataset.i].groupName !== g || o === tr) return; o.querySelector('.ps-m').value = m; o.querySelector('.ps-n').value = n; o.querySelector('.ps-t').value = t; sync(o); o.classList.add('ps-chg'); cnt++; });
      notify(cnt ? 'คัดลอกไป ' + cnt + ' ตำแหน่งในกลุ่ม ' + (g || '') + ' แล้ว กด บันทึกผู้ตรวจสอบ' : 'กลุ่มนี้มีตำแหน่งเดียว');
    };
  });
}
function savePosSigners(btn){
  var items = $$('.ps-tbl tbody tr[data-i]').map(function(tr){ return { id: S._ps.list[+tr.dataset.i].id, m: tr.querySelector('.ps-m').value, n: tr.querySelector('.ps-n').value.trim(), t: tr.querySelector('.ps-t').value.trim() }; });
  var bad = items.filter(function(x){ return x.m === 'custom' && !x.n; })[0];
  if (bad) { var tr = $$('.ps-tbl tbody tr[data-i]').filter(function(t){ return S._ps.list[+t.dataset.i].id === bad.id; })[0]; if (tr) { tr.querySelector('.ps-n').classList.add('is-invalid'); tr.querySelector('.ps-n').focus(); } return notify('กรุณาระบุชื่อผู้ตรวจสอบ', 'error'); }
  var changed = items.filter(function(x){ var o = S._ps.list.filter(function(y){ return y.id === x.id; })[0]; return o.m !== x.m || (o.n || '') !== x.n || (o.t || '') !== x.t; });
  if (!changed.length) return notify('ไม่มีรายการที่เปลี่ยนแปลง');
  api('savePosSigners', { items: changed }, { btn: btn }).then(function(d){ S._ps = d; drawPosSigners(); notify('บันทึกผู้ตรวจสอบ ' + changed.length + ' ตำแหน่งเรียบร้อย'); }).catch(function(){});
}
function exHRMi(btn){
  var sel = exSel(S._hrIds); if (!sel) return; var mode = $('hrMode').value;
  // 29 ก.ย. 69: เซิร์ฟเวอร์ส่งเฉพาะตัวเลข หน้าเว็บสร้างไฟล์ .xlsx ในเครื่อง (เร็วขึ้นมาก ไม่ต้องสร้าง Google Sheet ชั่วคราว)
  api('hrmiData', { ym: $('exYm').value, type: $('hrType').value, mode: mode, positionIds: sel[0] === 'all' ? [] : sel }, { btn: btn }).then(function(r){
    var toSheet = function(x){ return { name: x.code, rows: [r.header].concat(x.rows.map(function(row){ return [/^\d+$/.test(String(row[0])) ? +row[0] : row[0]].concat(row.slice(1)); })) }; };
    var files;
    if (mode === 'combined') files = [{ name: r.tag + '.xlsx', blob: xlsxBlob(r.sheets.map(toSheet)) }];
    else {
      files = r.sheets.map(function(x){ return { name: x.code + '.xlsx', blob: xlsxBlob([toSheet(x)]) }; });
      if (mode === 'zip') return Promise.all(files.map(function(f){ return f.blob.arrayBuffer(); })).then(function(bufs){
        downloadBlobs([{ name: r.tag + '.zip', blob: zipBlob(files.map(function(f, i){ return { name: f.name, data: new Uint8Array(bufs[i]) }; })) }]); return r;
      });
    }
    downloadBlobs(files); return r;
  }).then(function(r){
    if (!r || !$('hrRes')) return;
    $('hrRes').innerHTML = 'รหัสรายได้: ' + esc(r.codes.join(', ')) +
      (r.pending && r.pending.length ? '<div class="text-warning"><i class="bi bi-hourglass-split"></i> รวมในไฟล์แต่ยังไม่อนุมัติ: ' + esc(r.pending.join(', ')) + ' · หากผู้อนุมัติส่งกลับแก้ไข ต้องดาวน์โหลดใหม่</div>' : '') +
      (r.notApproved.length ? '<div class="text-danger">ยังไม่ส่งตรวจ (ไม่รวมในไฟล์): ' + esc(r.notApproved.join(', ')) + '</div>' : '');
  }).catch(function(){});
}
