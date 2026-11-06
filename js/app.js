// ================= StockFlow interactive prototype =================
// All data lives here. Every add/edit/receive/pick action updates
// this state and re-renders every affected screen automatically.

var S = {
  inventory: [
    { sku: 'SKU-1048', name: 'Nitrile Gloves - L', cat: 'Safety', qty: 18, loc: 'A-04-12', reorder: 25, supplier: 'MedSupply Industrial Co.' },
    { sku: 'SKU-1622', name: 'Cordless Scanner X2', cat: 'Equipment', qty: 84, loc: 'C-01-03', reorder: 20, supplier: 'Apex Retailers Ltd.' },
    { sku: 'SKU-2210', name: 'Packing Tape 48mm', cat: 'Packaging', qty: 0, loc: 'B-02-08', reorder: 30, supplier: 'Harbor Safety Group' },
    { sku: 'SKU-3914', name: 'Safety Goggles', cat: 'Safety', qty: 11, loc: 'C-08-03', reorder: 15, supplier: 'MedSupply Industrial Co.' },
    { sku: 'SKU-4480', name: 'Euro Pallet 1200\u00d7800', cat: 'Pallets', qty: 126, loc: 'Yard-02', reorder: 40, supplier: 'Apex Retailers Ltd.' },
    { sku: 'SKU-5532', name: 'Shipping Labels 4\u00d76', cat: 'Packaging', qty: 0, loc: 'D-01-02', reorder: 50, supplier: 'Harbor Safety Group' }
  ],
  users: [
    { id: 'US-1048', name: 'Jheizeil Allende', role: 'System Admin', status: 'Active', last: '2 min ago', access: 'Full Access' },
    { id: 'US-1622', name: 'John Matthew', role: 'Warehouse Manager', status: 'Active', last: '18 min ago', access: 'Ops Only' },
    { id: 'US-2210', name: 'Lovely Dumaslag', role: 'Inventory Analyst', status: 'Active', last: '1 hr ago', access: 'Read Only' },
    { id: 'US-3914', name: 'Kisha Mae Lumbres', role: 'Receiving Clerk', status: 'Pending', last: 'Never', access: 'Limited' },
    { id: 'US-4480', name: 'Noleen Rejuso', role: 'Customer Support', status: 'Active', last: '3 hr ago', access: 'Support' }
  ],
  orders: [
    { id: 'SO-1289', customer: 'Apex Field Services', items: 4, priority: 'High', assignee: 'Diego Ruiz', status: 'Picking', due: 'Today 12:30' },
    { id: 'SO-1301', customer: 'MetroBuild Supply', items: 8, priority: 'Normal', assignee: 'Unassigned', status: 'Pending', due: 'Tomorrow' },
    { id: 'SO-1294', customer: 'Harbor Safety Group', items: 3, priority: 'Urgent', assignee: 'Diego Ruiz', status: 'Ready', due: 'Today 12:30' }
  ],
  movements: [
    { when: '22 Sep \u00b7 10:42', sku: 'SKU-1048 \u00b7 Nitrile Gloves', type: 'Received', delta: +240, prev: 18, post: 258, user: 'ABADIA' },
    { when: '22 Sep \u00b7 09:18', sku: 'SKU-3914 \u00b7 Safety Goggles', type: 'Released', delta: -6, prev: 17, post: 11, user: 'ALLENDE' },
    { when: '21 Sep \u00b7 16:55', sku: 'SKU-4480 \u00b7 Euro Pallet', type: 'Transferred', delta: -24, prev: 150, post: 126, user: 'DUMASLAG' },
    { when: '21 Sep \u00b7 14:07', sku: 'SKU-5532 \u00b7 Shipping Labels', type: 'Adjusted', delta: -4, prev: 4, post: 0, user: 'LUMBRES' },
    { when: '21 Sep \u00b7 11:32', sku: 'SKU-1622 \u00b7 Scanner X2', type: 'Received', delta: +20, prev: 64, post: 84, user: 'REJUSO' }
  ],
  notifs: [
    { level: 'Critical', icon: 'bad', when: '2 min ago', text: 'Packing Tape 48mm is out of stock' },
    { level: 'High', icon: 'orange', when: '18 min ago', text: 'Order SO-1294 is due in 45 minutes' },
    { level: 'Medium', icon: 'blue', when: '1 hour ago', text: 'Delivery PO-7842 arrived at Dock 03' },
    { level: 'Low', icon: 'green', when: '3 hours ago', text: 'Cycle count for Zone C is complete' }
  ],
  baseProducts: 2480, baseStock: 18608, baseOrders: 38, baseDeliveries: 12,
  skuCounter: 6000, userCounter: 5000, orderCounter: 1310
};
var currentUser = 'ABADIA';

// ================= helpers =================
function $(id) { return document.getElementById(id); }
function fmt(n) { return n.toLocaleString('en-US'); }
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function statusFor(q, r) { r = r || 25; return q <= 0 ? 'Out of Stock' : (q <= r ? 'Low Stock' : 'In Stock'); }
function pill(st) {
  if (st === 'In Stock') return '<span class="pill ok">In Stock</span>';
  if (st === 'Low Stock') return '<span class="pill warn">Low Stock</span>';
  if (st === 'Out of Stock') return '<span class="pill bad">Out of Stock</span>';
  if (st === 'Active') return '<span class="pill ok">Active</span>';
  if (st === 'Pending') return '<span class="pill warn">Pending</span>';
  if (st === 'High') return '<span class="pill bad">High</span>';
  if (st === 'Urgent') return '<span class="pill orange">Urgent</span>';
  return '<span class="pill gray">' + esc(st) + '</span>';
}
function typePill(t) {
  var m = { Received: 'green', Released: 'red', Transferred: 'blue', Adjusted: 'orange' };
  return '<span class="pill ' + m[t] + '">' + t + '</span>';
}
function nowStamp() {
  return '22 Sep \u00b7 ' + new Date().toTimeString().slice(0, 5);
}

// ================= navigation =================
function nav(page) {
  document.querySelectorAll('.page').forEach(function (p) { p.classList.add('hidden'); });
  $('page-' + page).classList.remove('hidden');
  document.querySelectorAll('.nav-item[data-page]').forEach(function (a) {
    a.classList.toggle('active', a.dataset.page === page);
  });
  window.scrollTo(0, 0);
}
document.querySelectorAll('.nav-item[data-page]').forEach(function (a) {
  a.addEventListener('click', function () { nav(a.dataset.page); });
});

// ================= login / logout =================
function doLogin() {
  var u = $('login-user').value.trim(), p = $('login-pass').value.trim();
  if (u && p) {
    $('login-error').classList.add('hidden');
    $('login-view').classList.add('hidden');
    $('app-view').classList.remove('hidden');
    nav('dashboard'); renderAll();
    toast('Welcome back', 'Signed in as ' + (u === 'admin' ? 'System Admin' : u));
  } else { $('login-error').classList.remove('hidden'); }
}
function logout() {
  $('app-view').classList.add('hidden');
  $('login-view').classList.remove('hidden');
  $('login-pass').value = '';
}

// ================= popovers =================
function toggleProfile(e) { e.stopPropagation(); $('profile-pop').classList.toggle('hidden'); }
function toggleBell() { toast('Notifications', S.notifs.length + ' alerts: ' + S.notifs.map(function (n) { return n.level; }).join(', ')); }
function toggleMenu(e, id) { e.stopPropagation(); $(id).classList.toggle('hidden'); }
document.addEventListener('click', function () {
  $('profile-pop').classList.add('hidden');
  document.querySelectorAll('.menu').forEach(function (m) { m.classList.add('hidden'); });
});

// ================= master render =================
function renderAll() { renderStats(); renderInventory(); renderLowStock(); renderFeed(); renderUsers(); renderOrders(); renderMovements(); renderNotifs(); renderAnalytics(); }

function renderStats() {
  var totalQty = 0, low = 0, out = 0;
  S.inventory.forEach(function (i) { totalQty += i.qty; var st = statusFor(i.qty, i.reorder); if (st === 'Low Stock') low++; if (st === 'Out of Stock') out++; });
  var pending = S.orders.filter(function (o) { return o.status === 'Pending' || o.status === 'Picking' || o.status === 'Ready'; }).length;
  $('stat-products').textContent = fmt(S.baseProducts + S.inventory.length);
  $('stat-stock').textContent = fmt(S.baseStock + totalQty);
  $('stat-low').textContent = low + out;
  $('stat-orders').textContent = fmt(S.baseOrders - 3 + pending);
  $('stat-deliveries').textContent = fmt(S.baseDeliveries);
  $('low-chip').textContent = (low + out) + ' items';
}
function renderLowStock() {
  var tb = $('low-body'); tb.innerHTML = '';
  var rows = S.inventory.filter(function (i) { return i.qty <= i.reorder; });
  if (!rows.length) { tb.innerHTML = '<tr><td colspan="5" style="color:var(--green)">All stock levels are healthy \u2014 no low stock items.</td></tr>'; return; }
  rows.forEach(function (i) {
    tb.insertAdjacentHTML('beforeend', '<tr><td class="mono">' + i.sku + '</td><td>' + esc(i.name) + '</td><td>' + i.qty + '</td><td>' + i.loc + '</td><td>' + pill(statusFor(i.qty, i.reorder)) + '</td></tr>');
  });
}
function renderFeed() {
  var ul = $('feed-list'); ul.innerHTML = '';
  var colors = { Received: 'green', Released: 'red', Transferred: 'blue', Adjusted: 'orange', Order: 'blue', User: 'gray' };
  S.movements.slice(0, 4).forEach(function (m) {
    var c = colors[m.type] || 'gray';
    var label = m.type === 'Released' ? ' released from stock' : m.type === 'Transferred' ? ' stock transferred' : m.type === 'Adjusted' ? ' stock adjusted' : ' stock received';
    ul.insertAdjacentHTML('beforeend', '<li><span class="fdot ' + c + '"></span><div><b>' + m.sku.split(' \u00b7 ')[0] + label + '</b><span>' + m.user + ' \u00b7 ' + m.when + '</span></div></li>');
  });
}

// ================= inventory =================
function renderInventory() {
  var tb = $('inv-body'); tb.innerHTML = '';
  S.inventory.forEach(function (i) {
    tb.insertAdjacentHTML('beforeend',
      '<tr data-status="' + statusFor(i.qty, i.reorder) + '"><td class="mono">' + i.sku + '</td><td>' + esc(i.name) + '</td><td>' + esc(i.cat) + '</td><td>' + i.qty + '</td><td>' + i.loc + '</td><td>' + pill(statusFor(i.qty, i.reorder)) + '</td>' +
      '<td class="acts"><a onclick="openEdit(\'' + i.sku + '\')">Edit</a> \u00b7 <a class="del" onclick="openEdit(\'' + i.sku + '\',true)">Delete</a></td></tr>');
  });
}
function filterInventory() {
  var q = $('inv-search').value.toLowerCase();
  document.querySelectorAll('#inv-body tr').forEach(function (tr) {
    tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}
function setCat(val, el) {
  $('cat-label').textContent = val;
  document.querySelectorAll('#inv-body tr').forEach(function (tr) {
    tr.style.display = (val === 'All' || tr.dataset.status === val) ? '' : 'none';
  });
  el.parentElement.classList.add('hidden');
}
function openModal(id) { $(id).classList.remove('hidden'); }
function closeModal(id) { $(id).classList.add('hidden'); }

function addProduct() {
  var name = $('np-name').value.trim(), cat = $('np-cat').value,
    qty = parseInt($('np-qty').value) || 0, loc = $('np-loc').value,
    reorder = parseInt($('np-reorder').value) || 25, supplier = $('np-supplier').value;
  if (!name || !cat || !loc) { toast('Missing fields', 'Please fill in name, category and location'); return; }
  var sku = $('np-sku').value.trim().toUpperCase() || ('SKU-' + (S.skuCounter++));
  if (S.inventory.some(function (i) { return i.sku === sku; })) { toast('Duplicate SKU', sku + ' already exists in inventory'); return; }
  S.inventory.push({ sku: sku, name: name, cat: cat, qty: qty, loc: loc, reorder: reorder, supplier: supplier });
  if (qty > 0) logMovement(sku + ' \u00b7 ' + name, 'Received', qty, 0, qty);
  renderAll(); closeModal('modal-add');
  toast('Product added', name + ' (' + sku + ') \u00b7 ' + qty + ' units \u00b7 status: ' + statusFor(qty, reorder));
  ['np-name', 'np-sku', 'np-reorder'].forEach(function (x) { $(x).value = ''; });
  $('np-qty').value = 0; $('np-cat').value = ''; $('np-loc').value = ''; $('np-supplier').value = '';
}
var currentEdit = null, editingDelete = false;
function openEdit(sku, del) {
  var i = S.inventory.find(function (x) { return x.sku === sku; }); if (!i) return;
  currentEdit = sku; editingDelete = !!del;
  $('ep-sku').value = i.sku; $('ep-name').value = i.name; $('ep-cat').value = i.cat;
  $('ep-qty').value = i.qty; $('ep-loc').value = i.loc; $('ep-reorder').value = i.reorder; $('ep-supplier').value = i.supplier;
  $('ep-delete').textContent = del ? 'Confirm Delete' : 'Delete Product';
  openModal('modal-edit');
}
function saveProduct() {
  var i = S.inventory.find(function (x) { return x.sku === currentEdit; }); if (!i) return;
  var oldQty = i.qty;
  i.name = $('ep-name').value; i.cat = $('ep-cat').value;
  i.qty = parseInt($('ep-qty').value) || 0; i.loc = $('ep-loc').value;
  i.reorder = parseInt($('ep-reorder').value) || i.reorder; i.supplier = $('ep-supplier').value;
  if (i.qty !== oldQty) logMovement(i.sku + ' \u00b7 ' + i.name, 'Adjusted', i.qty - oldQty, oldQty, i.qty);
  renderAll(); closeModal('modal-edit');
  toast('Saved', currentEdit + ' updated \u00b7 status: ' + statusFor(i.qty, i.reorder));
}
function deleteProduct() {
  if (!editingDelete) { editingDelete = true; $('ep-delete').textContent = 'Confirm Delete'; return; }
  var i = S.inventory.find(function (x) { return x.sku === currentEdit; });
  S.inventory = S.inventory.filter(function (x) { return x.sku !== currentEdit; });
  renderAll(); closeModal('modal-edit');
  toast('Deleted', currentEdit + ' (' + (i ? i.name : '') + ') removed from catalog');
}

// ================= users =================
function renderUsers() {
  var tb = $('usr-body'); tb.innerHTML = '';
  S.users.forEach(function (u) {
    tb.insertAdjacentHTML('beforeend',
      '<tr><td class="mono">' + u.id + '</td><td>' + esc(u.name) + '</td><td>' + esc(u.role) + '</td><td>' + pill(u.status) + '</td><td>' + u.last + '</td><td>' + esc(u.access) + '</td>' +
      '<td class="acts"><a onclick="editUser(\'' + u.id + '\')">Edit</a> \u00b7 <a onclick="activateUser(\'' + u.id + '\')">Reset</a> \u00b7 <a class="del" onclick="removeUser(\'' + u.id + '\')">Remove</a></td></tr>');
  });
}
function filterUsers() {
  var q = $('usr-search').value.toLowerCase();
  document.querySelectorAll('#usr-body tr').forEach(function (tr) {
    tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}
function addUser() {
  var name = $('nu-name').value.trim(), role = $('nu-role').value,
    access = $('nu-access').value, status = $('nu-status').value,
    email = $('nu-email').value.trim();
  if (!name || !role || !access) { toast('Missing fields', 'Name, role and access level are required'); return; }
  var id = 'US-' + (S.userCounter++);
  S.users.push({ id: id, name: name, role: role, status: status, last: 'Never', access: access });
  renderAll(); closeModal('modal-user');
  toast('User added', name + ' (' + id + ') \u00b7 ' + role + ' \u00b7 invite ' + (email ? 'sent to ' + email : 'created'));
  $('nu-name').value = ''; $('nu-role').value = ''; $('nu-access').value = ''; $('nu-email').value = '';
}
function editUser(id) {
  var u = S.users.find(function (x) { return x.id === id; });
  $('nu-name').value = u.name; $('nu-role').value = u.role; $('nu-access').value = u.access; $('nu-status').value = u.status;
  S.users = S.users.filter(function (x) { return x.id !== id; });
  renderUsers(); openModal('modal-user');
  toast('Editing user', id + ' loaded into form');
}
function activateUser(id) {
  var u = S.users.find(function (x) { return x.id === id; });
  u.status = 'Active'; u.last = 'Just now'; renderUsers();
  toast('Reset link sent', u.name + ' can now set a new password');
}
function removeUser(id) {
  var u = S.users.find(function (x) { return x.id === id; });
  S.users = S.users.filter(function (x) { return x.id !== id; });
  renderUsers(); toast('User removed', u.name + ' (' + id + ') deleted');
}

// ================= receiving =================
$('rc-qty').addEventListener('input', function () {
  var q = parseInt(this.value) || 0;
  $('rc-note').innerHTML = '\u2713 Confirming will add <b>' + q + '</b> units to available stock and create an audit entry.';
  $('sum-expected').textContent = q + ' units';
  $('sum-variance').textContent = q;
});
function confirmReceiving() {
  var sku = $('rc-sku').value.trim().toUpperCase(), name = $('rc-product').value.trim();
  var q = parseInt($('rc-qty').value) || 0;
  if (!sku || !name || q <= 0) { toast('Incomplete form', 'SKU, product name and quantity are required'); return; }
  var item = S.inventory.find(function (x) { return x.sku === sku; });
  var prev, post;
  if (item) { prev = item.qty; item.qty += q; post = item.qty; }
  else { prev = 0; post = q; S.inventory.push({ sku: sku, name: name, cat: 'Other', qty: q, loc: 'A-04-12', reorder: 25, supplier: $('rc-supplier').value }); }
  logMovement(sku + ' \u00b7 ' + name, 'Received', q, prev, post);
  $('rc-status-chip').textContent = 'Received \u2713';
  $('sum-received').textContent = q + ' units';
  $('sum-variance').textContent = '0';
  renderAll();
  toast('Receiving confirmed', q + ' units of ' + name + ' added \u00b7 new stock: ' + post);
}
function resetReceiving() {
  $('rc-status-chip').textContent = 'Draft';
  $('sum-received').textContent = '0 units';
  $('sum-variance').textContent = $('rc-qty').value;
  toast('Draft reset', 'Receiving form cleared (data unchanged)');
}

// ================= movements =================
function logMovement(sku, type, delta, prev, post) {
  S.movements.unshift({ when: nowStamp(), sku: sku, type: type, delta: delta, prev: prev, post: post, user: currentUser });
  addNotif(levelFor(type), sku + ' ' + type.toLowerCase() + ' \u00b7 ' + (delta > 0 ? '+' : '') + delta + ' units');
}
function levelFor(type) {
  if (type === 'Released') return 'High';
  if (type === 'Received') return 'Medium';
  return 'Low';
}
function renderMovements() {
  var tb = $('mov-body'); tb.innerHTML = '';
  S.movements.forEach(function (m) {
    tb.insertAdjacentHTML('beforeend',
      '<tr><td>' + m.when + '</td><td class="mono">' + m.sku + '</td><td>' + typePill(m.type) + '</td>' +
      '<td class="mono ' + (m.delta >= 0 ? 'up-t' : 'down-t') + '">' + (m.delta >= 0 ? '+' : '\u2212') + Math.abs(m.delta) + '</td><td>' + m.prev + '</td><td>' + m.post + '</td><td>' + m.user + '</td></tr>');
  });
  $('mov-foot').innerHTML = 'Showing ' + S.movements.length + ' movements \u00b7 All timestamps use warehouse local time (UTC+08:00)';
}
function filterMovements() {
  var q = $('mov-search').value.toLowerCase(), t = $('mov-type').value;
  document.querySelectorAll('#mov-body tr').forEach(function (tr) {
    var ok = (t === 'All' || tr.children[2].textContent.includes(t)) && tr.textContent.toLowerCase().includes(q);
    tr.style.display = ok ? '' : 'none';
  });
}
function exportMovements() {
  var csv = 'Date/Time,SKU / Product,Movement Type,Qty Delta,Previous Stock,Updated Stock,User\n';
  S.movements.forEach(function (m) {
    csv += [m.when, '"' + m.sku + '"', m.type, m.delta, m.prev, m.post, m.user].join(',') + '\n';
  });
  var a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'stockflow-audit-log.csv'; a.click();
  toast('Export complete', 'stockflow-audit-log.csv downloaded');
}

// ================= orders =================
function renderOrders() {
  var tb = $('orders-body'); tb.innerHTML = '';
  S.orders.forEach(function (o, i) {
    var act = o.status === 'Pending' ? '<a onclick="startPicking(' + i + ')">Start picking</a>' :
      o.status === 'Picking' ? '<a onclick="startPicking(' + i + ')">Open checklist</a>' :
        '<a onclick="toast(\'Dispatch booked\',\'' + o.id + ' handed to logistics\')">Dispatch</a>';
    tb.insertAdjacentHTML('beforeend',
      '<tr><td class="mono">' + o.id + '</td><td>' + esc(o.customer) + '</td><td>' + o.items + '</td><td>' + pill(o.priority) + '</td><td>' + esc(o.assignee) + '</td><td>' + pill(o.status) + '</td><td>' + o.due + '</td><td class="acts">' + act + '</td></tr>');
  });
  var c = { Pending: 0, Picking: 0, Ready: 0, Completed: 0 };
  S.orders.forEach(function (o) { c[o.status]++; });
  c.Completed += 142 - 1;
  $('tc-pending').textContent = c.Pending; $('tc-picking').textContent = c.Picking;
  $('tc-ready').textContent = c.Ready; $('tc-done').textContent = c.Completed;
  ['modal-order', 'modal-picking'].forEach(function (x) { if (!$(x).classList.contains('hidden')) closeModal(x); });
}
var pickingIndex = null;
function startPicking(i) {
  pickingIndex = i;
  var o = S.orders[i];
  if (o.status === 'Pending') o.status = 'Picking';
  $('pick-title').textContent = 'Picking Checklist - ' + o.id;
  $('pick-sub').innerHTML = o.customer + ' \u00b7 ' + o.items + ' items <span class="pill blue">' + o.status + '</span>';
  var pl = $('pick-list'); pl.innerHTML = '';
  for (var k = 0; k < o.items; k++) {
    pl.insertAdjacentHTML('beforeend',
      '<label class="pick"><input type="checkbox" onchange="pickProgress()"><div><b>Item ' + (k + 1) + ' \u00b7 ' + esc(o.customer) + '</b><span>Location: Zone ' + String.fromCharCode(65 + (k % 4)) + '-0' + ((k % 8) + 1) + '</span></div><span class="pq">Required ' + (1 + ((k * 3) % 5)) + '</span></label>');
  }
  renderOrders(); pickProgress(); openModal('modal-picking');
}
function pickProgress() {
  if (pickingIndex === null) return;
  var boxes = document.querySelectorAll('#pick-list input[type=checkbox]');
  var done = 0; boxes.forEach(function (b) { if (b.checked) done++; });
  $('pick-sub').innerHTML = S.orders[pickingIndex].customer + ' \u00b7 items <b>' + done + '</b> of <b>' + boxes.length + '</b> <span class="pill blue">Picking</span>';
  var btn = $('btn-complete');
  if (done === boxes.length && boxes.length > 0) {
    btn.disabled = false;
    $('pick-note').textContent = 'All items picked. Complete Order is now available.';
  } else {
    btn.disabled = true;
    $('pick-note').textContent = (boxes.length - done) + ' items incomplete \u00b7 Complete Order becomes available when all items are picked.';
  }
}
function completeOrder() {
  var o = S.orders[pickingIndex];
  o.status = 'Completed';
  // deduct picked stock: release one unit per item line
  for (var k = 0; k < o.items; k++) {
    var item = S.inventory[k % S.inventory.length];
    if (item && item.qty > 0) {
      var prev = item.qty; item.qty--; logMovement(item.sku + ' \u00b7 ' + item.name, 'Released', -1, prev, item.qty);
    }
  }
  renderAll(); closeModal('modal-picking');
  toast('Order completed', o.id + ' for ' + o.customer + ' \u00b7 stock released and audit trail updated');
  pickingIndex = null;
}
function cancelPicking() {
  var o = S.orders[pickingIndex];
  o.status = 'Pending'; pickingIndex = null;
  renderOrders(); closeModal('modal-picking');
  toast('Picking cancelled', o.id + ' returned to queue');
}
function createOrder() {
  var c = $('no-customer').value.trim(), n = parseInt($('no-items').value) || 1;
  if (!c) { toast('Missing field', 'Customer name is required'); return; }
  var id = 'SO-' + (S.orderCounter++);
  S.orders.unshift({ id: id, customer: c, items: n, priority: $('no-priority').value, assignee: $('no-assignee').value, status: 'Pending', due: 'Today 17:00' });
  renderAll(); closeModal('modal-order');
  toast('Order created', id + ' for ' + c + ' \u00b7 ' + n + ' items \u00b7 Pending');
  $('no-customer').value = '';
}

// ================= notifications =================
function addNotif(level, text) {
  S.notifs.unshift({ level: level, icon: level === 'Critical' ? 'bad' : level === 'High' ? 'orange' : level === 'Medium' ? 'blue' : 'green', when: 'Just now', text: text });
  if (S.notifs.length > 8) S.notifs.pop();
}
function renderNotifs() {
  var d = $('notif-list'); d.innerHTML = '';
  S.notifs.forEach(function (n) {
    d.insertAdjacentHTML('beforeend',
      '<div class="notif ' + n.level.toLowerCase() + '"><div class="notif-top"><span class="pill ' + n.icon + '">' + n.level + '</span><span class="when">' + n.when + '</span></div><b>' + esc(n.text) + '</b></div>');
  });
  $('notif-count').textContent = S.notifs.length;
  $('unread-chip').textContent = S.notifs.length + ' unread';
  $('bell-dot').style.display = S.notifs.length ? 'block' : 'none';
}

// ================= analytics =================
function renderAnalytics() {
  var cats = {};
  S.inventory.forEach(function (i) { cats[i.cat] = (cats[i.cat] || 0) + i.qty; });
  var bars = $('cat-bars'); bars.innerHTML = '';
  var entries = Object.entries(cats); var max = Math.max.apply(null, [1].concat(entries.map(function (e) { return e[1]; })));
  entries.forEach(function (e) {
    bars.insertAdjacentHTML('beforeend', '<div class="bar-col"><div class="bar' + (e[1] === max ? ' tall' : '') + '" style="height:' + Math.max(6, Math.round(e[1] / max * 95)) + '%"></div><span>' + esc(e[0]) + '</span></div>');
  });
  var h = { 'In Stock': 0, 'Low Stock': 0, 'Out of Stock': 0 };
  S.inventory.forEach(function (i) { h[statusFor(i.qty, i.reorder)]++; });
  $('health-list').innerHTML =
    '<div class="sum-row"><span><span class="pill ok">In Stock</span></span><b>' + h['In Stock'] + '</b></div>' +
    '<div class="sum-row"><span><span class="pill warn">Low Stock</span></span><b>' + h['Low Stock'] + '</b></div>' +
    '<div class="sum-row"><span><span class="pill bad">Out of Stock</span></span><b>' + h['Out of Stock'] + '</b></div>';
}

// ================= toast =================
function toast(title, msg) {
  var t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = '<b>' + esc(title) + '</b>' + esc(msg);
  $('toasts').appendChild(t);
  setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(function () { t.remove(); }, 300); }, 2800);
}

nav('dashboard'); renderAll();

// ================= tabs =================
function setOrderTab(el, status) {
  document.querySelectorAll('#page-orders .tab').forEach(function (t) { t.classList.remove('active'); });
  el.classList.add('active');
  document.querySelectorAll('#orders-body tr').forEach(function (tr) {
    tr.style.display = (status === 'all' || tr.children[5].textContent.trim() === status) ? '' : 'none';
  });
}
function setReportTab(el, tab) {
  document.querySelectorAll('#page-reports .tab').forEach(function (t) { t.classList.remove('active'); });
  el.classList.add('active');
  $('tab-notif').classList.toggle('hidden', tab !== 'notif');
  $('tab-reports').classList.toggle('hidden', tab !== 'reports');
}
