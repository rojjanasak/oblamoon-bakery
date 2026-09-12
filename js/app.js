/* ============================================================
   Ob-la-moon Snack Shop — App
   Hash-router SPA over Bootstrap 5. All state lives in DB.state
   (js/data.js) and persists to localStorage after every mutation.
   ============================================================ */

const S = DB.state;
let currentRole = 'Admin'; // Admin | Manager | Cashier | Kitchen | Viewer
let charts = {}; // keep chart instances so we can destroy/redraw

const AUTH_KEY = 'oblamoon_auth';
const DEMO_USER = '1';
const DEMO_PASS = '1';
function isLoggedIn() { return sessionStorage.getItem(AUTH_KEY) === 'yes'; }
function logout() { sessionStorage.removeItem(AUTH_KEY); boot(); }

const money = (n) => S.settings.currency + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
const menuById = (id) => S.menu.find(m => m.id === id);
const canSeeMoney = () => ['Admin', 'Manager'].includes(currentRole);

const NAV = [
  { id: 'dashboard', label: 'Home', icon: 'bi-house-door-fill', sidebarLabel: 'Dashboard' },
  { id: 'orders', label: 'Orders', icon: 'bi-receipt' },
  { id: 'pos', label: 'POS', icon: 'bi-shop' },
  { id: 'reports', label: 'Report', icon: 'bi-bar-chart-fill' },
  { id: 'more', label: 'More', icon: 'bi-grid-3x3-gap-fill' },
];
const SIDEBAR = [
  { id: 'dashboard', label: 'Dashboard', icon: 'bi-house-door-fill' },
  { id: 'pos', label: 'POS', icon: 'bi-shop' },
  { id: 'orders', label: 'Orders', icon: 'bi-receipt' },
  { id: 'stock', label: 'Daily Stock', icon: 'bi-box-seam' },
  { id: 'menu-admin', label: 'Menu', icon: 'bi-egg-fried' },
  { id: 'cost', label: 'Cost', icon: 'bi-calculator', money: true },
  { id: 'income-expense', label: 'Income / Expense', icon: 'bi-cash-coin', money: true },
  { id: 'reports', label: 'Reports', icon: 'bi-bar-chart-fill' },
  { id: 'customers', label: 'Customers', icon: 'bi-people' },
  { id: 'promotions', label: 'Promotion', icon: 'bi-tags' },
  { id: 'users', label: 'Users', icon: 'bi-person-badge' },
  { id: 'settings', label: 'Settings', icon: 'bi-gear' },
  { id: 'audit', label: 'Audit Log', icon: 'bi-clock-history' },
];
const MORE_ITEMS = SIDEBAR.filter(i => !['dashboard','pos','orders','reports'].includes(i.id));

function route() {
  const hash = (location.hash || '#dashboard').replace('#', '');
  return hash;
}

function go(id) { location.hash = id; }

function statusClass(s) { return 'b-' + s.toLowerCase().replace(/\s+/g, ''); }

function logChange(item, action, oldValue, newValue) {
  S.auditLog.unshift({ id: DB.uid('log'), user: currentRole + '01', time: Date.now(), action, item, oldValue, newValue });
  DB.save();
}

/* ================= LOGIN ================= */
function renderLogin() {
  document.getElementById('app').innerHTML = `
    <div class="login-shell">
      <div class="login-card">
        <div class="mark"><i class="bi bi-cupcake"></i></div>
        <h1>${S.settings.shopName}</h1>
        <p>${S.settings.tagline} · Shop Management</p>
        <form id="loginForm" autocomplete="off">
          <label>Username</label>
          <input class="form-control mb-3" id="loginUser" placeholder="Username" autofocus>
          <label>Password</label>
          <input type="password" class="form-control mb-2" id="loginPass" placeholder="Password">
          <div id="loginError" class="text-danger small mb-2" style="min-height:18px;"></div>
          <button type="submit" class="btn btn-brand w-100 py-2">Log In</button>
        </form>
        <p class="hint">Demo credentials — username: <b>1</b> &nbsp; password: <b>1</b></p>
      </div>
    </div>
  `;
  document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const u = document.getElementById('loginUser').value.trim();
    const p = document.getElementById('loginPass').value.trim();
    if (u === DEMO_USER && p === DEMO_PASS) {
      sessionStorage.setItem(AUTH_KEY, 'yes');
      boot();
    } else {
      document.getElementById('loginError').textContent = 'Incorrect username or password.';
    }
  });
}

function boot() {
  if (isLoggedIn()) {
    renderAll();
  } else {
    renderLogin();
  }
}


function renderShell() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <aside class="sidebar">
      <div class="logo">
        <div class="mark"><i class="bi bi-cupcake"></i></div>
        <div>
          <h1 style="font-size:1.05rem;margin:0;">${S.settings.shopName}</h1>
          <div class="sub" style="font-size:.68rem;color:var(--coffee-soft);">${S.settings.tagline}</div>
        </div>
      </div>
      <nav id="sidebar-nav"></nav>
      <div class="divider-soft"></div>
      <div class="px-2">
        <label>Role (demo)</label>
        <select id="role-select" class="form-select form-select-sm mb-2">
          ${['Admin','Manager','Cashier','Kitchen','Viewer'].map(r => `<option ${r===currentRole?'selected':''}>${r}</option>`).join('')}
        </select>
        <button class="btn btn-outline-brand btn-sm w-100" onclick="logout()"><i class="bi bi-box-arrow-right"></i> Log Out</button>
      </div>
    </aside>
    <div class="main-scroll">
      <div class="topbar">
        <div class="logo">
          <div class="mark d-lg-none"><i class="bi bi-cupcake"></i></div>
          <div>
            <h1 id="page-title">Dashboard</h1>
            <div class="sub" id="page-sub"></div>
          </div>
        </div>
        <div class="role-pill"><i class="bi bi-person-circle"></i> ${currentRole}</div>
      </div>
      <div id="view" class="view-fade"></div>
    </div>
    <nav class="bottom-nav" id="bottom-nav"></nav>
    <div id="cart-bar-slot"></div>
  `;
  document.getElementById('role-select').addEventListener('change', e => {
    currentRole = e.target.value;
    renderAll();
  });
  renderNav();
}

function renderNav() {
  const active = route();
  const sb = document.getElementById('sidebar-nav');
  sb.innerHTML = SIDEBAR.filter(i => !i.money || canSeeMoney()).map(i => `
    <button class="nav-item ${active === i.id ? 'active' : ''}" onclick="go('${i.id}')">
      <i class="bi ${i.icon}"></i> ${i.label}
    </button>`).join('');

  const bn = document.getElementById('bottom-nav');
  const activeBottom = MORE_ITEMS.some(m => m.id === active) ? 'more' : active;
  bn.innerHTML = NAV.map(i => `
    <button class="nav-item ${activeBottom === i.id ? 'active' : ''}" onclick="${i.id==='more' ? 'openMoreSheet()' : `go('${i.id}')`}">
      <i class="bi ${i.icon}"></i><span>${i.label}</span>
    </button>`).join('');
}

function openMoreSheet() {
  const items = MORE_ITEMS.filter(i => !i.money || canSeeMoney());
  const html = `
    <div class="modal fade" id="moreModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-bottom">
        <div class="modal-content" style="border-radius:20px 20px 0 0;">
          <div class="modal-header"><h5 class="modal-title">More</h5>
            <button class="btn-close" data-bs-dismiss="modal"></button></div>
          <div class="modal-body">
            <div class="row row-cols-3 g-3 text-center">
              ${items.map(i => `
                <div class="col">
                  <button class="btn w-100 py-3" style="background:var(--cream-deep);border-radius:14px;border:none;" data-bs-dismiss="modal" onclick="go('${i.id}')">
                    <i class="bi ${i.icon}" style="font-size:1.3rem;"></i>
                    <div style="font-size:.72rem;font-weight:600;margin-top:6px;">${i.label}</div>
                  </button>
                </div>`).join('')}
              <div class="col">
                <button class="btn w-100 py-3" style="background:var(--cream-deep);border-radius:14px;border:none;" data-bs-dismiss="modal" onclick="logout()">
                  <i class="bi bi-box-arrow-right" style="font-size:1.3rem;"></i>
                  <div style="font-size:.72rem;font-weight:600;margin-top:6px;">Log Out</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  document.getElementById('modal-root').innerHTML = html;
  new bootstrap.Modal(document.getElementById('moreModal')).show();
}

function renderCartBar() {
  const slot = document.getElementById('cart-bar-slot');
  const active = route();
  const count = S.cart.reduce((a, c) => a + c.qty, 0);
  if (count === 0 || ['cart', 'checkout'].includes(active)) { slot.innerHTML = ''; return; }
  const total = S.cart.reduce((a, c) => a + c.qty * c.price, 0);
  slot.innerHTML = `
    <div class="cart-bar" onclick="go('cart')">
      <div>
        <div class="info">${count} item${count>1?'s':''} in cart</div>
        <div class="amount">${money(total)}</div>
      </div>
      <button onclick="event.stopPropagation();go('cart')">View Cart</button>
    </div>`;
}

/* ================= ROUTER ================= */
function renderAll() {
  renderShell();
  const view = route();
  const titles = {
    dashboard: ['Dashboard', "Today's snapshot at a glance"],
    pos: ['POS / Menu', 'Tap to add items to the order'],
    cart: ['Cart', 'Review before checkout'],
    checkout: ['Checkout', 'Confirm payment & order'],
    orders: ['Order Management', 'Track every order live'],
    'menu-admin': ['Menu Management', 'Add, edit, and control availability'],
    stock: ['Daily Stock', "Today's production & remaining"],
    cost: ['Cost Management', 'Cost, profit & margin per item'],
    'income-expense': ['Income / Expense', 'Revenue, costs & net profit'],
    reports: ['Sales Report', 'Performance over time'],
    customers: ['Customers', 'Order history & spending'],
    promotions: ['Promotions', 'Discounts & coupons'],
    users: ['Users & Permissions', 'Roles & access control'],
    settings: ['Shop Settings', 'Shop profile & preferences'],
    audit: ['Audit Log', 'System change history'],
  };
  const [t, sub] = titles[view] || titles.dashboard;
  document.getElementById('page-title').textContent = t;
  document.getElementById('page-sub').textContent = sub;

  const moneyGated = ['cost', 'income-expense'];
  const el = document.getElementById('view');
  if (moneyGated.includes(view) && !canSeeMoney()) {
    el.innerHTML = `<div class="empty-state card-soft"><i class="bi bi-lock-fill"></i>
      <div class="fw-bold">Restricted</div>
      <div>Cost & profit information is only visible to Admin or Manager roles.</div></div>`;
  } else {
    const renderers = {
      dashboard: renderDashboard, pos: renderPOS, cart: renderCart, checkout: renderCheckout,
      orders: renderOrders, 'menu-admin': renderMenuAdmin, stock: renderStock, cost: renderCost,
      'income-expense': renderIncomeExpense, reports: renderReports, customers: renderCustomers,
      promotions: renderPromotions, users: renderUsers, settings: renderSettings, audit: renderAudit,
    };
    (renderers[view] || renderDashboard)(el);
  }
  renderCartBar();
}

window.addEventListener('hashchange', () => { if (isLoggedIn()) renderAll(); });

/* ================= DASHBOARD ================= */
function renderDashboard(el) {
  const today = S.orders; // demo: all seed orders are "today"
  const todaySales = today.reduce((a, o) => a + orderTotal(o), 0);
  const todayOrders = today.length;
  const itemsSold = today.reduce((a, o) => a + o.items.reduce((s, it) => s + it.qty, 0), 0);
  const profit = today.reduce((a, o) => a + o.items.reduce((s, it) => {
    const m = menuById(it.menuId); return s + (it.price - (m ? m.cost : 0)) * it.qty;
  }, 0), 0);
  const aov = todayOrders ? todaySales / todayOrders : 0;
  const pending = today.filter(o => o.orderStatus === 'New').length;
  const preparing = today.filter(o => o.orderStatus === 'Preparing').length;
  const ready = today.filter(o => o.orderStatus === 'Ready').length;
  const soldOut = S.menu.filter(m => remaining(m) <= 0).length;
  const lowStock = S.menu.filter(m => remaining(m) > 0 && remaining(m) <= m.dailyLimit * 0.25).length;

  const kpis = [
    ['Today Sales', money(todaySales), 'bi-graph-up-arrow', 'var(--sage)', canSeeMoney()],
    ['Today Orders', todayOrders, 'bi-receipt', 'var(--sky)', true],
    ['Items Sold', itemsSold, 'bi-basket3-fill', 'var(--apricot)', true],
    ['Est. Profit', money(profit), 'bi-piggy-bank-fill', 'var(--caramel)', canSeeMoney()],
    ['Avg Order Value', money(aov), 'bi-tag-fill', 'var(--sky)', canSeeMoney()],
    ['Pending Orders', pending, 'bi-hourglass-split', 'var(--status-new)', true],
    ['Preparing', preparing, 'bi-fire', 'var(--status-preparing)', true],
    ['Ready', ready, 'bi-check-circle-fill', 'var(--status-ready)', true],
    ['Sold Out Menus', soldOut, 'bi-x-octagon-fill', 'var(--cherry)', true],
    ['Low Stock Items', lowStock, 'bi-exclamation-triangle-fill', 'var(--apricot)', true],
  ].filter(k => k[4]);

  el.innerHTML = `
    <div class="row row-cols-2 row-cols-lg-5 g-2 g-lg-3">
      ${kpis.map(([label, val, icon, color]) => `
        <div class="col">
          <div class="kpi-card">
            <div class="kpi-icon" style="background:${color}22;color:${color}"><i class="bi ${icon}"></i></div>
            <div class="kpi-label">${label}</div>
            <div class="kpi-value">${val}</div>
          </div>
        </div>`).join('')}
    </div>

    <div class="row g-3 mt-1">
      <div class="col-12 col-lg-7">
        <div class="card-soft"><div class="section-title" style="margin-top:0;">Daily Sales Trend</div><canvas id="chartTrend" height="160"></canvas></div>
      </div>
      <div class="col-12 col-lg-5">
        <div class="card-soft"><div class="section-title" style="margin-top:0;">Orders by Status</div><canvas id="chartStatus" height="160"></canvas></div>
      </div>
      <div class="col-12 col-lg-6">
        <div class="card-soft"><div class="section-title" style="margin-top:0;">Sales by Menu</div><canvas id="chartSalesMenu" height="180"></canvas></div>
      </div>
      <div class="col-12 col-lg-6">
        <div class="card-soft"><div class="section-title" style="margin-top:0;">Top 5 Best Selling</div><canvas id="chartTop5" height="180"></canvas></div>
      </div>
      ${canSeeMoney() ? `
      <div class="col-12">
        <div class="card-soft"><div class="section-title" style="margin-top:0;">Profit by Menu</div><canvas id="chartProfit" height="140"></canvas></div>
      </div>` : ''}
    </div>
  `;
  drawDashboardCharts();
}

function orderTotal(o) {
  const sub = o.items.reduce((a, it) => a + it.qty * it.price, 0);
  return Math.max(0, sub - (o.discount || 0) + (o.deliveryFee || 0));
}
function remaining(m) { return Math.max(0, m.dailyLimit - m.sold); }

function drawDashboardCharts() {
  Object.values(charts).forEach(c => c && c.destroy());
  charts = {};
  const brand = { apricot:'#E8A15D', caramel:'#B67B4D', coffee:'#3D2B1F', sage:'#7C9473', sky:'#6F93A8', cherry:'#C44A3A' };
  const font = { family: 'Inter' };
  Chart.defaults.font.family = 'Inter';
  Chart.defaults.color = '#6B5644';

  // Trend: last 7 days, simulate around actual today total
  const todayTotal = S.orders.reduce((a,o)=>a+orderTotal(o),0) || 500;
  const days7 = Array.from({length:7}, (_,i) => {
    const d = new Date(); d.setDate(d.getDate() - (6-i));
    return d.toLocaleDateString('en-US',{weekday:'short'});
  });
  const trendData = [0.7,0.85,0.6,0.95,1.1,1.3,1].map(f => Math.round(todayTotal * f));
  charts.trend = new Chart(document.getElementById('chartTrend'), {
    type:'line',
    data:{ labels: days7, datasets:[{ data: trendData, borderColor: brand.caramel, backgroundColor:'rgba(182,123,77,0.15)', fill:true, tension:.35, pointRadius:3 }]},
    options:{ plugins:{legend:{display:false}}, scales:{ y:{ ticks:{ callback:v=>S.settings.currency+v } } } }
  });

  const statusCounts = ['New','Confirmed','Preparing','Ready','Completed','Cancelled'].map(s => S.orders.filter(o=>o.orderStatus===s).length);
  charts.status = new Chart(document.getElementById('chartStatus'), {
    type:'doughnut',
    data:{ labels:['New','Confirmed','Preparing','Ready','Completed','Cancelled'],
      datasets:[{ data: statusCounts, backgroundColor:['#6F93A8','#B67B4D','#E8A15D','#7C9473','#3D2B1F','#C44A3A'] }]},
    options:{ plugins:{ legend:{ position:'bottom', labels:{ boxWidth:10, font:{size:10} } } }, cutout:'62%' }
  });

  const salesByMenu = S.menu.map(m => ({ name:m.name, val: m.sold * m.price }));
  charts.salesMenu = new Chart(document.getElementById('chartSalesMenu'), {
    type:'bar',
    data:{ labels: salesByMenu.map(x=>x.name), datasets:[{ data: salesByMenu.map(x=>x.val), backgroundColor: brand.apricot, borderRadius:6 }]},
    options:{ indexAxis:'y', plugins:{legend:{display:false}}, scales:{ x:{ ticks:{ callback:v=>S.settings.currency+v } } } }
  });

  const top5 = [...S.menu].sort((a,b)=>b.sold-a.sold).slice(0,5);
  charts.top5 = new Chart(document.getElementById('chartTop5'), {
    type:'bar',
    data:{ labels: top5.map(x=>x.name), datasets:[{ data: top5.map(x=>x.sold), backgroundColor: brand.sage, borderRadius:6 }]},
    options:{ plugins:{legend:{display:false}} }
  });

  if (canSeeMoney()) {
    const profitByMenu = S.menu.map(m => ({ name:m.name, val: (m.price - m.cost) * m.sold }));
    charts.profit = new Chart(document.getElementById('chartProfit'), {
      type:'bar',
      data:{ labels: profitByMenu.map(x=>x.name), datasets:[{ data: profitByMenu.map(x=>x.val), backgroundColor: brand.caramel, borderRadius:6 }]},
      options:{ plugins:{legend:{display:false}}, scales:{ y:{ ticks:{ callback:v=>S.settings.currency+v } } } }
    });
  }
}

/* ================= POS ================= */
let posFilter = 'All';
let posSearch = '';
const CATS = ['All','Cake','Cookie','Bread','Drink','Other'];

function renderPOS(el) {
  el.innerHTML = `
    <div class="mb-2">
      <input class="form-control" placeholder="Search menu..." id="posSearch" value="${posSearch}">
    </div>
    <div class="filter-scroll mb-3">
      ${CATS.map(c => `<button class="pill-filter ${posFilter===c?'active':''}" onclick="setPosFilter('${c}')">${c}</button>`).join('')}
    </div>
    <div class="menu-grid" id="menuGrid"></div>
  `;
  document.getElementById('posSearch').addEventListener('input', e => { posSearch = e.target.value; renderMenuGrid(); });
  renderMenuGrid();
}
function setPosFilter(c) { posFilter = c; renderPOS(document.getElementById('view')); }

function renderMenuGrid() {
  const grid = document.getElementById('menuGrid');
  if (!grid) return;
  const items = S.menu.filter(m =>
    m.status !== 'Inactive' &&
    (posFilter === 'All' || m.category === posFilter) &&
    (m.name.toLowerCase().includes(posSearch.toLowerCase()) || m.nameTh.includes(posSearch))
  );
  if (!items.length) { grid.innerHTML = `<div class="empty-state"><i class="bi bi-search"></i>No menu items found.</div>`; return; }
  grid.innerHTML = items.map(m => {
    const rem = remaining(m);
    const soldOut = rem <= 0 || m.status === 'Sold Out';
    const inCart = S.cart.find(c => c.menuId === m.id);
    const qty = inCart ? inCart.qty : 0;
    const pct = Math.max(0, Math.min(100, (rem / m.dailyLimit) * 100));
    return `
      <div class="menu-card ${soldOut ? 'soldout' : ''}">
        ${soldOut ? '<div class="soldout-ribbon">SOLD OUT</div>' : ''}
        <div class="img-wrap">${m.image}</div>
        <div class="body">
          <div class="name">${m.name}</div>
          <div class="cat">${m.category}</div>
          <div class="price">${money(m.price)}</div>
          <div class="meta">Limit ${m.dailyLimit} · Sold ${m.sold} · Remaining ${rem}</div>
          <div class="remaining-bar"><div style="width:${pct}%; background:${pct<25?'var(--cherry)':'var(--sage)'}"></div></div>
          ${!soldOut ? `
          <div class="qty-row">
            <button class="qty-btn" onclick="changeCartQty('${m.id}', -1)">−</button>
            <span class="qty-val">${qty}</span>
            <button class="qty-btn" onclick="changeCartQty('${m.id}', 1)">+</button>
          </div>
          <button class="btn-add" onclick="addToCart('${m.id}')">Add to Cart</button>` :
          `<button class="btn-add" disabled>Sold Out</button>`}
        </div>
      </div>`;
  }).join('');
}

function changeCartQty(menuId, delta) {
  let item = S.cart.find(c => c.menuId === menuId);
  const m = menuById(menuId);
  const max = remaining(m);
  if (!item) {
    if (delta > 0) S.cart.push({ menuId, qty: 1, price: m.price });
  } else {
    item.qty = Math.max(0, Math.min(max, item.qty + delta));
    if (item.qty === 0) S.cart = S.cart.filter(c => c.menuId !== menuId);
  }
  DB.save();
  renderMenuGrid();
  renderCartBar();
}
function addToCart(menuId) {
  let item = S.cart.find(c => c.menuId === menuId);
  if (!item) {
    const m = menuById(menuId);
    S.cart.push({ menuId, qty: 1, price: m.price });
    DB.save(); renderMenuGrid(); renderCartBar();
  }
}

/* ================= CART ================= */
function renderCart(el) {
  if (!S.cart.length) {
    el.innerHTML = `<div class="empty-state card-soft"><i class="bi bi-cart-x"></i>Your cart is empty.
      <div class="mt-3"><button class="btn btn-brand" onclick="go('pos')">Browse Menu</button></div></div>`;
    return;
  }
  const subtotal = S.cart.reduce((a, c) => a + c.qty * c.price, 0);
  const discount = 0, deliveryFee = 0;
  const total = subtotal - discount + deliveryFee;
  el.innerHTML = `
    <div class="card-soft mb-3">
      ${S.cart.map(c => {
        const m = menuById(c.menuId);
        return `
        <div class="cart-item">
          <div class="thumb">${m.image}</div>
          <div class="flex-grow-1">
            <div class="name">${m.name}</div>
            <div class="unit">${money(c.price)} each</div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <button class="qty-btn" onclick="changeCartQty('${m.id}',-1);renderCart(document.getElementById('view'))">−</button>
            <span class="qty-val">${c.qty}</span>
            <button class="qty-btn" onclick="changeCartQty('${m.id}',1);renderCart(document.getElementById('view'))">+</button>
          </div>
          <div class="sub">${money(c.qty * c.price)}</div>
          <button class="btn btn-sm btn-link text-danger" onclick="removeFromCart('${m.id}')"><i class="bi bi-trash"></i></button>
        </div>`;
      }).join('')}
    </div>
    <div class="card-soft">
      <div class="d-flex justify-content-between mb-1"><span>Subtotal</span><span>${money(subtotal)}</span></div>
      <div class="d-flex justify-content-between mb-1"><span>Discount</span><span>-${money(discount)}</span></div>
      <div class="d-flex justify-content-between mb-2"><span>Delivery Fee</span><span>${money(deliveryFee)}</span></div>
      <div class="divider-soft"></div>
      <div class="d-flex justify-content-between fw-bold fs-5"><span>Total</span><span>${money(total)}</span></div>
      <button class="btn btn-brand w-100 mt-3 py-2" onclick="go('checkout')">Checkout</button>
    </div>
  `;
}
function removeFromCart(menuId) {
  S.cart = S.cart.filter(c => c.menuId !== menuId);
  DB.save();
  renderCart(document.getElementById('view'));
  renderCartBar();
}

/* ================= CHECKOUT ================= */
function renderCheckout(el) {
  if (!S.cart.length) { go('pos'); return; }
  const subtotal = S.cart.reduce((a, c) => a + c.qty * c.price, 0);
  el.innerHTML = `
    <div class="card-soft mb-3">
      <div class="section-title" style="margin-top:0;">Order Items</div>
      ${S.cart.map(c => { const m = menuById(c.menuId); return `
        <div class="d-flex justify-content-between py-1" style="font-size:.88rem;">
          <span>${m.name} × ${c.qty}</span><span>${money(c.qty*c.price)}</span>
        </div>`; }).join('')}
      <div class="divider-soft"></div>
      <div class="d-flex justify-content-between fw-bold"><span>Total</span><span id="coTotal">${money(subtotal)}</span></div>
    </div>
    <div class="card-soft mb-3">
      <label>Customer Name</label>
      <input class="form-control mb-3" id="coCustomer" placeholder="Walk-in">
      <label>Discount (${S.settings.currency})</label>
      <input type="number" class="form-control mb-3" id="coDiscount" value="0" min="0">
      <label>Delivery Fee (${S.settings.currency})</label>
      <input type="number" class="form-control mb-3" id="coDelivery" value="0" min="0">
      <label>Payment Method</label>
      <select class="form-select mb-3" id="coPayMethod">
        <option>Cash</option><option>PromptPay / QR</option><option>Bank Transfer</option><option>Other</option>
      </select>
      <label>Payment Status</label>
      <select class="form-select" id="coPayStatus">
        <option>Unpaid</option><option>Paid</option><option>Refunded</option>
      </select>
    </div>
    <button class="btn btn-brand w-100 py-2" onclick="confirmOrder()">Confirm Order</button>
  `;
  ['coDiscount', 'coDelivery'].forEach(id => document.getElementById(id).addEventListener('input', () => {
    const d = Number(document.getElementById('coDiscount').value) || 0;
    const f = Number(document.getElementById('coDelivery').value) || 0;
    document.getElementById('coTotal').textContent = money(subtotal - d + f);
  }));
}

function confirmOrder() {
  const customer = document.getElementById('coCustomer').value || 'Walk-in';
  const discount = Number(document.getElementById('coDiscount').value) || 0;
  const deliveryFee = Number(document.getElementById('coDelivery').value) || 0;
  const paymentMethod = document.getElementById('coPayMethod').value;
  const paymentStatus = document.getElementById('coPayStatus').value;

  const seq = String(S.orders.filter(o => o.id.includes(DB.todayStr().replace(/-/g, ''))).length + 1).padStart(3, '0');
  const orderId = `ORD-${DB.todayStr().replace(/-/g, '')}-${seq}`;

  // deduct stock
  S.cart.forEach(c => { const m = menuById(c.menuId); m.sold += c.qty; });

  S.orders.unshift({
    id: orderId, time: Date.now(), customer,
    items: S.cart.map(c => ({ menuId: c.menuId, qty: c.qty, price: c.price })),
    discount, deliveryFee, paymentMethod, paymentStatus, orderStatus: 'New'
  });
  S.cart = [];
  DB.save();
  go('orders');
}

/* ================= ORDERS ================= */
let orderFilter = 'All';
const ORDER_FLOW = ['New', 'Confirmed', 'Preparing', 'Ready', 'Completed'];

function renderOrders(el) {
  const filters = ['All', 'New', 'Preparing', 'Ready', 'Completed', 'Cancelled'];
  el.innerHTML = `
    <div class="filter-scroll mb-3">
      ${filters.map(f => `<button class="pill-filter ${orderFilter===f?'active':''}" onclick="setOrderFilter('${f}')">${f}</button>`).join('')}
    </div>
    <div id="orderList"></div>
  `;
  renderOrderList();
}
function setOrderFilter(f) { orderFilter = f; renderOrders(document.getElementById('view')); }

function renderOrderList() {
  const list = document.getElementById('orderList');
  const orders = S.orders.filter(o => orderFilter === 'All' || o.orderStatus === orderFilter);
  if (!orders.length) { list.innerHTML = `<div class="empty-state"><i class="bi bi-inbox"></i>No orders here.</div>`; return; }
  list.innerHTML = orders.map(o => {
    const items = o.items.map(it => `${menuById(it.menuId)?.name || '?'} ×${it.qty}`).join(', ');
    const total = orderTotal(o);
    const next = ORDER_FLOW[ORDER_FLOW.indexOf(o.orderStatus) + 1];
    return `
    <div class="order-card">
      <div class="top-row">
        <div>
          <div class="order-no">${o.id} ${o.source === 'customer' ? '<span class="badge-status b-sky" style="background:var(--sky);font-size:.6rem;">Self-order</span>' : ''}</div>
          <div class="order-time">${new Date(o.time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} · ${o.customer}${o.phone ? ' · ' + o.phone : ''}</div>
          ${o.pickupDate ? `<div class="order-time"><i class="bi bi-calendar-event"></i> Pickup: ${o.pickupDate}${o.pickupTime ? ' ' + o.pickupTime : ''}</div>` : ''}
        </div>
        <div class="d-flex gap-1">
          <span class="badge-status ${statusClass(o.orderStatus)}">${o.orderStatus}</span>
        </div>
      </div>
      <div class="items-line">${items}${o.note ? `<br><span class="fst-italic">Note: ${o.note}</span>` : ''}</div>
      <div class="d-flex justify-content-between align-items-center">
        <span class="badge-status ${statusClass(o.paymentStatus)}">${o.paymentStatus} · ${o.paymentMethod}</span>
        <span class="total">${money(total)}</span>
      </div>
      <div class="actions">
        ${next && o.orderStatus !== 'Cancelled' ? `<button class="btn btn-brand" onclick="advanceOrder('${o.id}')">${nextLabel(next)}</button>` : ''}
        ${!['Completed','Cancelled'].includes(o.orderStatus) ? `<button class="btn btn-outline-brand" onclick="cancelOrder('${o.id}')">Cancel</button>` : ''}
        <button class="btn btn-outline-brand" onclick="togglePayment('${o.id}')">Toggle Payment</button>
      </div>
    </div>`;
  }).join('');
}
function nextLabel(next) {
  return { Confirmed: 'Accept Order', Preparing: 'Start Preparing', Ready: 'Mark Ready', Completed: 'Complete' }[next] || next;
}
function advanceOrder(id) {
  const o = S.orders.find(x => x.id === id);
  const idx = ORDER_FLOW.indexOf(o.orderStatus);
  o.orderStatus = ORDER_FLOW[idx + 1];
  DB.save(); renderOrderList();
}
function cancelOrder(id) {
  const o = S.orders.find(x => x.id === id);
  o.orderStatus = 'Cancelled';
  DB.save(); renderOrderList();
}
function togglePayment(id) {
  const o = S.orders.find(x => x.id === id);
  o.paymentStatus = o.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid';
  DB.save(); renderOrderList();
}

/* ================= MENU ADMIN ================= */
function renderMenuAdmin(el) {
  el.innerHTML = `
    <div class="d-flex justify-content-end mb-3">
      <button class="btn btn-brand" onclick="openMenuModal()"><i class="bi bi-plus-lg"></i> Add Menu</button>
    </div>
    <div class="menu-grid" id="adminGrid"></div>
  `;
  renderAdminGrid();
}
function renderAdminGrid() {
  const grid = document.getElementById('adminGrid');
  grid.innerHTML = S.menu.map(m => {
    const rem = remaining(m);
    return `
    <div class="menu-card">
      <div class="img-wrap">${m.image}</div>
      <div class="body">
        <div class="name">${m.name}</div>
        <div class="cat">${m.category}</div>
        <div class="price">${money(m.price)}</div>
        <span class="badge-status ${statusClass(m.status)}">${m.status}</span>
        <div class="meta mt-1">Limit ${m.dailyLimit} · Remaining ${rem}</div>
        <div class="d-flex gap-2 mt-2">
          <button class="btn btn-sm btn-outline-brand flex-fill" onclick="openMenuModal('${m.id}')"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-brand flex-fill" onclick="toggleSoldOut('${m.id}')"><i class="bi bi-slash-circle"></i></button>
          <button class="btn btn-sm btn-outline-brand flex-fill text-danger" onclick="deleteMenu('${m.id}')"><i class="bi bi-trash"></i></button>
        </div>
      </div>
    </div>`;
  }).join('');
}
function toggleSoldOut(id) {
  const m = menuById(id);
  const old = m.status;
  m.status = m.status === 'Sold Out' ? 'Active' : 'Sold Out';
  logChange(m.name, 'Toggled Sold Out', old, m.status);
  renderAdminGrid();
}
function deleteMenu(id) {
  if (!confirm('Delete this menu item?')) return;
  S.menu = S.menu.filter(m => m.id !== id);
  DB.save(); renderAdminGrid();
}
function openMenuModal(id) {
  const m = id ? menuById(id) : null;
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const html = `
    <div class="modal fade" id="menuModal" tabindex="-1"><div class="modal-dialog modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header"><h5 class="modal-title">${m ? 'Edit Menu' : 'Add Menu'}</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
        <div class="modal-body">
          <label>Product Name</label><input class="form-control mb-2" id="fName" value="${m?.name||''}">
          <label>Category</label>
          <select class="form-select mb-2" id="fCat">${['Cake','Cookie','Bread','Drink','Other'].map(c=>`<option ${m?.category===c?'selected':''}>${c}</option>`).join('')}</select>
          <div class="row g-2">
            <div class="col-6"><label>Selling Price</label><input type="number" class="form-control mb-2" id="fPrice" value="${m?.price||0}"></div>
            <div class="col-6"><label>Cost</label><input type="number" class="form-control mb-2" id="fCost" value="${m?.cost||0}"></div>
          </div>
          <label>Daily Limit</label><input type="number" class="form-control mb-2" id="fLimit" value="${m?.dailyLimit||20}">
          <label>Status</label>
          <select class="form-select mb-2" id="fStatus">${['Active','Inactive','Sold Out','Scheduled'].map(s=>`<option ${m?.status===s?'selected':''}>${s}</option>`).join('')}</select>
          <label>Available Days</label>
          <div class="d-flex gap-1 mb-2 flex-wrap" id="fDays">
            ${days.map(d => `<span class="chip-day ${(m?.days||days).includes(d)?'on':''}" onclick="this.classList.toggle('on')" data-day="${d}">${d[0]}</span>`).join('')}
          </div>
          <div class="row g-2">
            <div class="col-6"><label>Start Time</label><input type="time" class="form-control mb-2" id="fStart" value="${m?.startTime||'08:00'}"></div>
            <div class="col-6"><label>End Time</label><input type="time" class="form-control mb-2" id="fEnd" value="${m?.endTime||'19:00'}"></div>
          </div>
        </div>
        <div class="modal-footer"><button class="btn btn-brand w-100" onclick="saveMenu('${id||''}')">Save Menu</button></div>
      </div>
    </div></div>`;
  document.getElementById('modal-root').innerHTML = html;
  new bootstrap.Modal(document.getElementById('menuModal')).show();
}
function saveMenu(id) {
  const days = [...document.querySelectorAll('#fDays .chip-day.on')].map(x => x.dataset.day);
  const data = {
    name: document.getElementById('fName').value || 'Untitled',
    nameTh: '', category: document.getElementById('fCat').value,
    price: Number(document.getElementById('fPrice').value) || 0,
    cost: Number(document.getElementById('fCost').value) || 0,
    dailyLimit: Number(document.getElementById('fLimit').value) || 0,
    status: document.getElementById('fStatus').value,
    days, startTime: document.getElementById('fStart').value, endTime: document.getElementById('fEnd').value,
  };
  if (id) {
    const m = menuById(id);
    if (m.dailyLimit !== data.dailyLimit) logChange(m.name, 'Changed Daily Limit', m.dailyLimit, data.dailyLimit);
    Object.assign(m, data);
  } else {
    S.menu.push({ id: DB.uid('m'), image: '🧁', sold: 0, ...data });
  }
  DB.save();
  bootstrap.Modal.getInstance(document.getElementById('menuModal')).hide();
  if (route() === 'menu-admin') renderAdminGrid();
}

/* ================= DAILY STOCK ================= */
function renderStock(el) {
  el.innerHTML = `
    <div class="card-soft p-0 overflow-hidden">
      <table class="table table-clean mb-0">
        <thead><tr><th class="ps-3">Menu</th><th>Limit</th><th>Produced</th><th>Sold</th><th>Remaining</th><th class="pe-3">Status</th></tr></thead>
        <tbody>
          ${S.menu.map(m => {
            const rem = remaining(m);
            const status = rem <= 0 ? 'Sold Out' : rem <= m.dailyLimit*0.25 ? 'Low' : 'Available';
            return `<tr>
              <td class="ps-3">${m.image} ${m.name}</td>
              <td>${m.dailyLimit}</td>
              <td><input type="number" class="form-control form-control-sm" style="width:80px" value="${m.dailyLimit}" onchange="updateProduced('${m.id}', this.value)"></td>
              <td>${m.sold}</td>
              <td class="fw-bold">${rem}</td>
              <td class="pe-3"><span class="badge-status ${statusClass(status)}">${status}</span></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}
function updateProduced(id, val) {
  const m = menuById(id);
  const old = m.dailyLimit;
  m.dailyLimit = Number(val) || 0;
  logChange(m.name, 'Changed Produced Quantity', old, m.dailyLimit);
  renderStock(document.getElementById('view'));
}

/* ================= COST MANAGEMENT ================= */
function renderCost(el) {
  el.innerHTML = `
    <div class="card-soft p-0 overflow-hidden">
      <table class="table table-clean mb-0">
        <thead><tr><th class="ps-3">Menu</th><th>Price</th><th>Cost</th><th>Profit</th><th class="pe-3">Margin</th></tr></thead>
        <tbody>
          ${S.menu.map(m => {
            const profit = m.price - m.cost;
            const margin = m.price ? (profit / m.price * 100).toFixed(2) : '0.00';
            return `<tr>
              <td class="ps-3">${m.image} ${m.name}</td>
              <td>${money(m.price)}</td>
              <td><input type="number" class="form-control form-control-sm" style="width:80px" value="${m.cost}" onchange="updateCost('${m.id}', this.value)"></td>
              <td class="fw-bold" style="color:${profit>=0?'var(--sage)':'var(--cherry)'}">${money(profit)}</td>
              <td class="pe-3">${margin}%</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    <div class="section-title">Cost Breakdown (example)</div>
    <div class="card-soft">
      <p class="text-muted small mb-2">Select a menu to break down its cost components (ingredient, packaging, labor, delivery, other).</p>
      <select class="form-select mb-3" id="costMenuSelect" onchange="renderCostBreakdown(this.value)">
        ${S.menu.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
      </select>
      <div id="costBreakdown"></div>
    </div>
  `;
  renderCostBreakdown(S.menu[0]?.id);
}
function updateCost(id, val) {
  const m = menuById(id);
  const old = m.cost;
  m.cost = Number(val) || 0;
  logChange(m.name, 'Changed Cost', old, m.cost);
  DB.save(); renderCost(document.getElementById('view'));
}
function renderCostBreakdown(id) {
  const box = document.getElementById('costBreakdown');
  if (!box || !id) return;
  const m = menuById(id);
  const parts = m.costParts || { ingredient: m.cost * 0.6, packaging: m.cost * 0.15, labor: m.cost * 0.15, delivery: 0, other: m.cost * 0.1 };
  box.innerHTML = `
    <div class="row g-2">
      ${Object.entries({ingredient:'Ingredient Cost',packaging:'Packaging Cost',labor:'Labor Cost',delivery:'Delivery Cost',other:'Other Cost'}).map(([k,label]) => `
        <div class="col-6 col-md-4"><label>${label}</label>
        <input type="number" class="form-control mb-2" value="${parts[k].toFixed(2)}" onchange="updateCostPart('${id}','${k}', this.value)"></div>
      `).join('')}
    </div>
    <div class="divider-soft"></div>
    <div class="d-flex justify-content-between"><span>Total Cost</span><b>${money(m.cost)}</b></div>
    <div class="d-flex justify-content-between"><span>Selling Price</span><b>${money(m.price)}</b></div>
    <div class="d-flex justify-content-between"><span>Profit per Item</span><b style="color:var(--sage)">${money(m.price-m.cost)}</b></div>
    <div class="d-flex justify-content-between"><span>Profit Margin</span><b>${m.price ? ((m.price-m.cost)/m.price*100).toFixed(2) : '0.00'}%</b></div>
  `;
}
function updateCostPart(id, key, val) {
  const m = menuById(id);
  m.costParts = m.costParts || { ingredient: m.cost*0.6, packaging: m.cost*0.15, labor: m.cost*0.15, delivery:0, other: m.cost*0.1 };
  m.costParts[key] = Number(val) || 0;
  m.cost = Object.values(m.costParts).reduce((a,b)=>a+b,0);
  DB.save();
  renderCost(document.getElementById('view'));
}

/* ================= INCOME / EXPENSE ================= */
let ieRange = 'Today';
function renderIncomeExpense(el) {
  const totalRevenue = S.orders.filter(o=>o.paymentStatus==='Paid').reduce((a,o)=>a+orderTotal(o),0);
  const totalExpense = S.expenses.reduce((a,e)=>a+e.amount,0);
  const netProfit = totalRevenue - totalExpense;
  el.innerHTML = `
    <div class="filter-scroll mb-3">
      ${['Today','This Week','This Month','Custom'].map(f => `<button class="pill-filter ${ieRange===f?'active':''}" onclick="setIeRange('${f}')">${f}</button>`).join('')}
    </div>
    <div class="row row-cols-3 g-2 mb-3">
      <div class="col"><div class="kpi-card"><div class="kpi-label">Total Revenue</div><div class="kpi-value" style="font-size:1.2rem;color:var(--sage)">${money(totalRevenue)}</div></div></div>
      <div class="col"><div class="kpi-card"><div class="kpi-label">Total Expense</div><div class="kpi-value" style="font-size:1.2rem;color:var(--cherry)">${money(totalExpense)}</div></div></div>
      <div class="col"><div class="kpi-card"><div class="kpi-label">Net Profit</div><div class="kpi-value" style="font-size:1.2rem;">${money(netProfit)}</div></div></div>
    </div>
    <div class="d-flex justify-content-between align-items-center mb-2">
      <div class="section-title" style="margin:0;">Expenses</div>
      <button class="btn btn-sm btn-brand" onclick="openExpenseModal()"><i class="bi bi-plus-lg"></i> Add Expense</button>
    </div>
    <div class="card-soft p-0 overflow-hidden">
      <table class="table table-clean mb-0">
        <thead><tr><th class="ps-3">Date</th><th>Category</th><th>Note</th><th class="pe-3">Amount</th></tr></thead>
        <tbody>
          ${S.expenses.map(e => `<tr>
            <td class="ps-3">${e.date}</td><td>${e.category}</td><td>${e.note}</td>
            <td class="pe-3">${money(e.amount)}</td>
          </tr>`).join('') || `<tr><td colspan="4" class="text-center text-muted py-3">No expenses recorded</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}
function setIeRange(f) { ieRange = f; renderIncomeExpense(document.getElementById('view')); }
function openExpenseModal() {
  const html = `
  <div class="modal fade" id="expModal" tabindex="-1"><div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header"><h5 class="modal-title">Add Expense</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
      <div class="modal-body">
        <label>Category</label>
        <select class="form-select mb-2" id="expCat">${['Ingredients','Packaging','Delivery','Electricity','Marketing','Equipment','Other'].map(c=>`<option>${c}</option>`).join('')}</select>
        <label>Note</label><input class="form-control mb-2" id="expNote">
        <label>Amount</label><input type="number" class="form-control" id="expAmount">
      </div>
      <div class="modal-footer"><button class="btn btn-brand w-100" onclick="saveExpense()">Save</button></div>
    </div>
  </div></div>`;
  document.getElementById('modal-root').innerHTML = html;
  new bootstrap.Modal(document.getElementById('expModal')).show();
}
function saveExpense() {
  S.expenses.unshift({ id: DB.uid('exp'), date: DB.todayStr(), category: document.getElementById('expCat').value,
    note: document.getElementById('expNote').value, amount: Number(document.getElementById('expAmount').value) || 0 });
  DB.save();
  bootstrap.Modal.getInstance(document.getElementById('expModal')).hide();
  renderIncomeExpense(document.getElementById('view'));
}

/* ================= REPORTS ================= */
function renderReports(el) {
  const totalSales = S.orders.reduce((a,o)=>a+orderTotal(o),0);
  const orderCount = S.orders.length;
  const itemsSold = S.orders.reduce((a,o)=>a+o.items.reduce((s,it)=>s+it.qty,0),0);
  const grossProfit = S.orders.reduce((a,o)=>a+o.items.reduce((s,it)=>{const m=menuById(it.menuId);return s+(it.price-(m?m.cost:0))*it.qty;},0),0);
  const aov = orderCount ? totalSales/orderCount : 0;
  const topMenu = [...S.menu].sort((a,b)=>b.sold-a.sold)[0];
  const lowMenu = [...S.menu].sort((a,b)=>a.sold-b.sold)[0];
  const payMethods = {};
  S.orders.forEach(o => payMethods[o.paymentMethod] = (payMethods[o.paymentMethod]||0)+1);

  el.innerHTML = `
    <div class="row row-cols-2 row-cols-lg-5 g-2 mb-3">
      ${[['Total Sales', canSeeMoney()?money(totalSales):'—'],['Orders', orderCount],['Items Sold', itemsSold],
         ['Gross Profit', canSeeMoney()?money(grossProfit):'—'],['Avg Order Value', canSeeMoney()?money(aov):'—']]
        .map(([l,v]) => `<div class="col"><div class="kpi-card"><div class="kpi-label">${l}</div><div class="kpi-value" style="font-size:1.2rem;">${v}</div></div></div>`).join('')}
    </div>
    <div class="row g-3">
      <div class="col-12 col-lg-6"><div class="card-soft"><div class="section-title" style="margin-top:0;">Sales by Day</div><canvas id="repDay" height="180"></canvas></div></div>
      <div class="col-12 col-lg-6"><div class="card-soft"><div class="section-title" style="margin-top:0;">Sales by Menu</div><canvas id="repMenu" height="180"></canvas></div></div>
      <div class="col-12 col-lg-6"><div class="card-soft"><div class="section-title" style="margin-top:0;">Payment Method Summary</div><canvas id="repPay" height="180"></canvas></div></div>
      <div class="col-12 col-lg-6">
        <div class="card-soft">
          <div class="section-title" style="margin-top:0;">Highlights</div>
          <div class="d-flex justify-content-between py-2 border-bottom"><span>Top Selling Menu</span><b>${topMenu?.name || '-'}</b></div>
          <div class="d-flex justify-content-between py-2"><span>Low Selling Menu</span><b>${lowMenu?.name || '-'}</b></div>
        </div>
      </div>
    </div>
  `;
  const days7 = Array.from({length:7}, (_,i) => { const d=new Date(); d.setDate(d.getDate()-(6-i)); return d.toLocaleDateString('en-US',{weekday:'short'}); });
  const base = totalSales || 400;
  new Chart(document.getElementById('repDay'), { type:'bar',
    data:{ labels: days7, datasets:[{ data:[0.6,0.8,0.5,0.9,1.1,1.3,1].map(f=>Math.round(base*f)), backgroundColor:'#B67B4D', borderRadius:6 }]},
    options:{ plugins:{legend:{display:false}} } });
  new Chart(document.getElementById('repMenu'), { type:'pie',
    data:{ labels: S.menu.map(m=>m.name), datasets:[{ data: S.menu.map(m=>m.sold*m.price), backgroundColor:['#E8A15D','#B67B4D','#7C9473','#6F93A8','#C44A3A','#F6D9B3','#3D2B1F','#9BB08F'] }]},
    options:{ plugins:{legend:{position:'bottom',labels:{boxWidth:10,font:{size:9}}}} } });
  new Chart(document.getElementById('repPay'), { type:'doughnut',
    data:{ labels:Object.keys(payMethods), datasets:[{ data:Object.values(payMethods), backgroundColor:['#7C9473','#E8A15D','#6F93A8','#C44A3A'] }]},
    options:{ plugins:{legend:{position:'bottom'}}, cutout:'60%' } });
}

/* ================= CUSTOMERS ================= */
function renderCustomers(el) {
  el.innerHTML = `
    <div class="d-flex justify-content-end mb-3"><button class="btn btn-brand" onclick="openCustomerModal()"><i class="bi bi-plus-lg"></i> Add Customer</button></div>
    <div class="row g-3">
      ${S.customers.map(c => {
        const custOrders = S.orders.filter(o => o.customer === c.name);
        const spend = custOrders.reduce((a,o)=>a+orderTotal(o),0);
        const favCounts = {};
        custOrders.forEach(o => o.items.forEach(it => favCounts[it.menuId] = (favCounts[it.menuId]||0)+it.qty));
        const fav = Object.entries(favCounts).sort((a,b)=>b[1]-a[1])[0];
        return `
        <div class="col-12 col-md-6 col-lg-4">
          <div class="card-soft">
            <div class="d-flex justify-content-between">
              <div>
                <div class="fw-bold">${c.name}</div>
                <div class="small text-muted">${c.phone} · ${c.line}</div>
              </div>
            </div>
            <div class="divider-soft"></div>
            <div class="d-flex justify-content-between small mb-1"><span>Orders</span><b>${custOrders.length}</b></div>
            <div class="d-flex justify-content-between small mb-1"><span>Total Spending</span><b>${money(spend)}</b></div>
            <div class="d-flex justify-content-between small"><span>Favorite Menu</span><b>${fav ? menuById(fav[0])?.name : '-'}</b></div>
          </div>
        </div>`;
      }).join('')}
    </div>
    <div class="locked-banner mt-3"><i class="bi bi-stars"></i> Membership, loyalty points, and coupons are ready to be enabled here in a future update.</div>
  `;
}
function openCustomerModal() {
  const html = `<div class="modal fade" id="cusModal" tabindex="-1"><div class="modal-dialog"><div class="modal-content">
    <div class="modal-header"><h5 class="modal-title">Add Customer</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
    <div class="modal-body">
      <label>Name</label><input class="form-control mb-2" id="cusName">
      <label>Phone</label><input class="form-control mb-2" id="cusPhone">
      <label>LINE / Contact</label><input class="form-control" id="cusLine">
    </div>
    <div class="modal-footer"><button class="btn btn-brand w-100" onclick="saveCustomer()">Save</button></div>
  </div></div></div>`;
  document.getElementById('modal-root').innerHTML = html;
  new bootstrap.Modal(document.getElementById('cusModal')).show();
}
function saveCustomer() {
  S.customers.push({ id: DB.uid('cus'), name: document.getElementById('cusName').value || 'Unnamed',
    phone: document.getElementById('cusPhone').value, line: document.getElementById('cusLine').value });
  DB.save();
  bootstrap.Modal.getInstance(document.getElementById('cusModal')).hide();
  renderCustomers(document.getElementById('view'));
}

/* ================= PROMOTIONS ================= */
function renderPromotions(el) {
  el.innerHTML = `
    <div class="d-flex justify-content-end mb-3"><button class="btn btn-brand" onclick="openPromoModal()"><i class="bi bi-plus-lg"></i> Add Promotion</button></div>
    <div class="row g-3">
      ${S.promotions.map(p => `
        <div class="col-12 col-md-6">
          <div class="card-soft">
            <div class="d-flex justify-content-between">
              <div class="fw-bold">${p.name}</div>
              <span class="badge-status ${p.active?'b-active':'b-inactive'}">${p.active?'Active':'Inactive'}</span>
            </div>
            <div class="small text-muted mt-1">${p.type} · Min order ${money(p.minOrder)}</div>
            <div class="small text-muted">${p.start} → ${p.end}</div>
            <div class="mt-2">
              <button class="btn btn-sm btn-outline-brand" onclick="togglePromo('${p.id}')">${p.active?'Deactivate':'Activate'}</button>
            </div>
          </div>
        </div>`).join('')}
    </div>
  `;
}
function togglePromo(id) {
  const p = S.promotions.find(x=>x.id===id); p.active = !p.active; DB.save(); renderPromotions(document.getElementById('view'));
}
function openPromoModal() {
  const html = `<div class="modal fade" id="promoModal" tabindex="-1"><div class="modal-dialog"><div class="modal-content">
    <div class="modal-header"><h5 class="modal-title">Add Promotion</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
    <div class="modal-body">
      <label>Name</label><input class="form-control mb-2" id="prName">
      <label>Type</label><select class="form-select mb-2" id="prType">${['Percentage Discount','Fixed Discount','Coupon','Buy X Get Y','Member Discount'].map(t=>`<option>${t}</option>`).join('')}</select>
      <div class="row g-2">
        <div class="col-6"><label>Start Date</label><input type="date" class="form-control mb-2" id="prStart" value="${DB.todayStr()}"></div>
        <div class="col-6"><label>End Date</label><input type="date" class="form-control mb-2" id="prEnd"></div>
      </div>
      <label>Minimum Order</label><input type="number" class="form-control" id="prMin" value="0">
    </div>
    <div class="modal-footer"><button class="btn btn-brand w-100" onclick="savePromo()">Save</button></div>
  </div></div></div>`;
  document.getElementById('modal-root').innerHTML = html;
  new bootstrap.Modal(document.getElementById('promoModal')).show();
}
function savePromo() {
  S.promotions.push({ id: DB.uid('promo'), name: document.getElementById('prName').value || 'Untitled Promo',
    type: document.getElementById('prType').value, value: 0, start: document.getElementById('prStart').value,
    end: document.getElementById('prEnd').value || '2026-12-31', active: true,
    minOrder: Number(document.getElementById('prMin').value) || 0, menu: [] });
  DB.save();
  bootstrap.Modal.getInstance(document.getElementById('promoModal')).hide();
  renderPromotions(document.getElementById('view'));
}

/* ================= USERS ================= */
const PERM_MODULES = ['POS','Orders','Menu Management','Cost','Income / Expense','Reports','User Management','Settings'];
function renderUsers(el) {
  el.innerHTML = `
    <div class="d-flex justify-content-end mb-3"><button class="btn btn-brand" onclick="openUserModal()"><i class="bi bi-plus-lg"></i> Add User</button></div>
    <div class="card-soft p-0 overflow-hidden">
      <table class="table table-clean mb-0">
        <thead><tr><th class="ps-3">Name</th><th class="pe-3">Role</th></tr></thead>
        <tbody>${S.users.map(u => `<tr><td class="ps-3">${u.name}</td><td class="pe-3"><span class="badge-status b-active">${u.role}</span></td></tr>`).join('')}</tbody>
      </table>
    </div>
    <div class="section-title">Role Permissions</div>
    <div class="card-soft p-0 overflow-hidden">
      <table class="table table-clean mb-0">
        <thead><tr><th class="ps-3">Module</th>${['Admin','Manager','Cashier','Kitchen','Viewer'].map(r=>`<th class="text-center">${r}</th>`).join('')}</tr></thead>
        <tbody>
          ${PERM_MODULES.map(mod => `<tr><td class="ps-3">${mod}</td>
            ${['Admin','Manager','Cashier','Kitchen','Viewer'].map(r => `<td class="text-center">${defaultPerm(mod,r) ? '<i class="bi bi-check-circle-fill" style="color:var(--sage)"></i>' : '<i class="bi bi-dash" style="color:#ccc"></i>'}</td>`).join('')}
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}
function defaultPerm(mod, role) {
  if (role === 'Admin') return true;
  if (['Cost','Income / Expense','User Management'].includes(mod)) return role === 'Manager';
  if (role === 'Viewer') return mod === 'Reports';
  if (role === 'Kitchen') return mod === 'Orders';
  if (role === 'Cashier') return ['POS','Orders'].includes(mod);
  return role === 'Manager';
}
function openUserModal() {
  const html = `<div class="modal fade" id="userModal" tabindex="-1"><div class="modal-dialog"><div class="modal-content">
    <div class="modal-header"><h5 class="modal-title">Add User</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
    <div class="modal-body">
      <label>Name</label><input class="form-control mb-2" id="usrName">
      <label>Role</label><select class="form-select" id="usrRole">${['Admin','Manager','Cashier','Kitchen','Viewer'].map(r=>`<option>${r}</option>`).join('')}</select>
    </div>
    <div class="modal-footer"><button class="btn btn-brand w-100" onclick="saveUser()">Save</button></div>
  </div></div></div>`;
  document.getElementById('modal-root').innerHTML = html;
  new bootstrap.Modal(document.getElementById('userModal')).show();
}
function saveUser() {
  S.users.push({ id: DB.uid('usr'), name: document.getElementById('usrName').value || 'Unnamed', role: document.getElementById('usrRole').value });
  DB.save();
  bootstrap.Modal.getInstance(document.getElementById('userModal')).hide();
  renderUsers(document.getElementById('view'));
}

/* ================= SETTINGS ================= */
function renderSettings(el) {
  const s = S.settings;
  el.innerHTML = `
    <div class="card-soft">
      <div class="row g-3">
        <div class="col-12 col-md-6"><label>Shop Name</label><input class="form-control" id="setName" value="${s.shopName}"></div>
        <div class="col-12 col-md-6"><label>Tagline</label><input class="form-control" id="setTagline" value="${s.tagline}"></div>
        <div class="col-12 col-md-6"><label>Phone</label><input class="form-control" id="setPhone" value="${s.phone}"></div>
        <div class="col-12 col-md-6"><label>LINE</label><input class="form-control" id="setLine" value="${s.line}"></div>
        <div class="col-12"><label>Address</label><input class="form-control" id="setAddress" value="${s.address}"></div>
        <div class="col-12 col-md-6"><label>PromptPay Info</label><input class="form-control" id="setPromptpay" value="${s.promptpay}"></div>
        <div class="col-6 col-md-3"><label>Opening Time</label><input type="time" class="form-control" id="setOpen" value="${s.openTime}"></div>
        <div class="col-6 col-md-3"><label>Closing Time</label><input type="time" class="form-control" id="setClose" value="${s.closeTime}"></div>
        <div class="col-6 col-md-3"><label>Currency</label><input class="form-control" id="setCurrency" value="${s.currency}"></div>
        <div class="col-6 col-md-3"><label>VAT %</label><input type="number" class="form-control" id="setVat" value="${s.vat}"></div>
      </div>
      <button class="btn btn-brand mt-3" onclick="saveSettings()">Save Settings</button>
    </div>
    <div class="section-title">Customer Self-Order Page</div>
    <div class="card-soft">
      <p class="small text-muted mb-2">Share this page with customers (print as a QR code, or open on a counter tablet) so they can browse the menu, build their own cart, and submit an order with their name, phone, and pickup date — without seeing any shop-management screens.</p>
      <div class="d-flex gap-2 flex-wrap">
        <a href="customer.html" target="_blank" class="btn btn-apricot"><i class="bi bi-box-arrow-up-right"></i> Open Customer Page</a>
        <button class="btn btn-outline-brand" onclick="copyCustomerLink()"><i class="bi bi-link-45deg"></i> Copy Link</button>
      </div>
    </div>
    <div class="section-title">Danger Zone</div>
    <div class="card-soft">
      <p class="small text-muted">Reset all demo data back to the original seed (menu, orders, expenses).</p>
      <button class="btn btn-outline-brand text-danger border-danger" onclick="resetAll()">Reset Demo Data</button>
    </div>
  `;
}
function saveSettings() {
  Object.assign(S.settings, {
    shopName: document.getElementById('setName').value, tagline: document.getElementById('setTagline').value,
    phone: document.getElementById('setPhone').value, line: document.getElementById('setLine').value,
    address: document.getElementById('setAddress').value, promptpay: document.getElementById('setPromptpay').value,
    openTime: document.getElementById('setOpen').value, closeTime: document.getElementById('setClose').value,
    currency: document.getElementById('setCurrency').value, vat: Number(document.getElementById('setVat').value) || 0,
  });
  DB.save();
  renderAll();
}
function copyCustomerLink() {
  const url = new URL('customer.html', location.href).toString();
  navigator.clipboard?.writeText(url).then(() => alert('Link copied:\n' + url)).catch(() => alert(url));
}
function resetAll() {
  if (!confirm('This will erase all changes and reload seed data. Continue?')) return;
  DB.reset();
  location.reload();
}

/* ================= AUDIT LOG ================= */
function renderAudit(el) {
  if (!S.auditLog.length) { el.innerHTML = `<div class="empty-state card-soft"><i class="bi bi-clock-history"></i>No changes recorded yet.</div>`; return; }
  el.innerHTML = `<div class="card-soft">
    ${S.auditLog.map(l => `
      <div class="log-entry">
        <div class="log-time">${new Date(l.time).toLocaleString([], {day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
        <div class="log-user">${l.user}</div>
        <div class="log-change">${l.action} — ${l.item}: <b>${l.oldValue}</b> → <b>${l.newValue}</b></div>
      </div>`).join('')}
  </div>`;
}

/* ================= BOOT ================= */
document.addEventListener('DOMContentLoaded', () => {
  boot();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  }
});
