/* ============================================================
   Ob-la-moon Snack Shop — App
   Hash-router SPA over Bootstrap 5. All state lives in DB.state
   (js/data.js) and persists to localStorage after every mutation.
   UI strings go through I18N.t() (js/i18n.js) — Thai by default.
   ============================================================ */

const S = DB.state;
let currentRole = 'Admin'; // Admin | Manager | Cashier | Kitchen | Viewer
let charts = {}; // keep chart instances so we can destroy/redraw
const t = I18N.t;

const money = (n) => S.settings.currency + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
const menuById = (id) => S.menu.find(m => m.id === id);
const canSeeMoney = () => ['Admin', 'Manager'].includes(currentRole);
const mName = (m) => I18N.getLang() === 'th' ? (m.nameTh || m.name) : m.name;

const AUTH_KEY = 'oblamoon_auth';
const DEMO_USER = '1';
const DEMO_PASS = '1';
function isLoggedIn() { return sessionStorage.getItem(AUTH_KEY) === 'yes'; }
function logout() { sessionStorage.removeItem(AUTH_KEY); boot(); }

function setLang(l) {
  I18N.setLang(l);
  boot();
}

/* ---- label mappers: data stays English internally, display is translated ---- */
const CAT_KEY = { All: 'catAll', Cake: 'catCake', Cookie: 'catCookie', Bread: 'catBread', Drink: 'catDrink', Other: 'catOther' };
const catLabel = (c) => t(CAT_KEY[c] || 'catOther');
const ORDER_STATUS_KEY = { New: 'ordNew', Confirmed: 'ordConfirmed', Preparing: 'ordPreparing', Ready: 'ordReady', Completed: 'ordCompleted', Cancelled: 'ordCancelled' };
const orderStatusLabel = (s) => t(ORDER_STATUS_KEY[s] || s);
const PAY_STATUS_KEY = { Paid: 'payPaid', Unpaid: 'payUnpaid', Refunded: 'payRefunded' };
const payStatusLabel = (s) => t(PAY_STATUS_KEY[s] || s);
const MENU_STATUS_KEY = { Active: 'stAActive', Inactive: 'stInactive', 'Sold Out': 'stSoldOut', Scheduled: 'stScheduled' };
const menuStatusLabel = (s) => t(MENU_STATUS_KEY[s] || s);
const STOCK_STATUS_KEY = { Available: 'stAvailable', Low: 'stLow', 'Sold Out': 'stSoldOut' };
const stockStatusLabel = (s) => t(STOCK_STATUS_KEY[s] || s);
const PAY_METHOD_KEY = { Cash: 'payCash', 'PromptPay / QR': 'payPromptpay', 'Bank Transfer': 'payBankTransfer', Other: 'payOther' };
const payMethodLabel = (m) => t(PAY_METHOD_KEY[m] || m);
const ROLE_KEY = { Admin: 'roleAdmin', Manager: 'roleManager', Cashier: 'roleCashier', Kitchen: 'roleKitchen', Viewer: 'roleViewer' };
const roleLabel = (r) => t(ROLE_KEY[r] || r);
const DAY_ORDER = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const DAY_TH = { Mon:'จ', Tue:'อ', Wed:'พ', Thu:'พฤ', Fri:'ศ', Sat:'ส', Sun:'อา' };
const dayChip = (d) => I18N.getLang() === 'th' ? DAY_TH[d] : d[0];

const NAV = [
  { id: 'dashboard', labelKey: 'nav_dashboard', icon: 'bi-house-door-fill' },
  { id: 'orders', labelKey: 'nav_orders', icon: 'bi-receipt' },
  { id: 'pos', labelKey: 'nav_pos', icon: 'bi-shop' },
  { id: 'reports', labelKey: 'nav_reports', icon: 'bi-bar-chart-fill' },
  { id: 'more', labelKey: 'more', icon: 'bi-grid-3x3-gap-fill' },
];
const SIDEBAR = [
  { id: 'dashboard', labelKey: 'sb_dashboard', icon: 'bi-house-door-fill' },
  { id: 'pos', labelKey: 'sb_pos', icon: 'bi-shop' },
  { id: 'orders', labelKey: 'sb_orders', icon: 'bi-receipt' },
  { id: 'stock', labelKey: 'sb_stock', icon: 'bi-box-seam' },
  { id: 'menu-admin', labelKey: 'sb_menuadmin', icon: 'bi-egg-fried' },
  { id: 'cost', labelKey: 'sb_cost', icon: 'bi-calculator', money: true },
  { id: 'income-expense', labelKey: 'sb_incomeexpense', icon: 'bi-cash-coin', money: true },
  { id: 'reports', labelKey: 'sb_reports', icon: 'bi-bar-chart-fill' },
  { id: 'customers', labelKey: 'sb_customers', icon: 'bi-people' },
  { id: 'promotions', labelKey: 'sb_promotions', icon: 'bi-tags' },
  { id: 'users', labelKey: 'sb_users', icon: 'bi-person-badge' },
  { id: 'settings', labelKey: 'sb_settings', icon: 'bi-gear' },
  { id: 'audit', labelKey: 'sb_audit', icon: 'bi-clock-history' },
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

function langToggleHTML() {
  const lang = I18N.getLang();
  return `
    <div class="lang-toggle">
      <button class="${lang==='th'?'active':''}" onclick="setLang('th')">TH</button>
      <button class="${lang==='en'?'active':''}" onclick="setLang('en')">EN</button>
    </div>`;
}

/* ================= LOGIN ================= */
function renderLogin() {
  document.getElementById('app').innerHTML = `
    <div class="login-shell">
      <div class="login-card">
        <div style="display:flex;justify-content:flex-end;">${langToggleHTML()}</div>
        <div class="mark"><i class="bi bi-cupcake"></i></div>
        <h1>${S.settings.shopName}</h1>
        <p>${S.settings.tagline} · ${t('shopManagement')}</p>
        <form id="loginForm" autocomplete="off">
          <label>${t('loginUsername')}</label>
          <input class="form-control mb-3" id="loginUser" placeholder="${t('loginUsername')}" autofocus>
          <label>${t('loginPassword')}</label>
          <input type="password" class="form-control mb-2" id="loginPass" placeholder="${t('loginPassword')}">
          <div id="loginError" class="text-danger small mb-2" style="min-height:18px;"></div>
          <button type="submit" class="btn btn-brand w-100 py-2">${t('loginBtn')}</button>
        </form>
        <p class="hint">${t('loginHint')} <b>1</b> &nbsp; ${t('loginHintAnd')} <b>1</b></p>
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
      document.getElementById('loginError').textContent = t('loginError');
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

/* ================= LAYOUT ================= */
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
        <label>${t('role')}</label>
        <select id="role-select" class="form-select form-select-sm mb-2">
          ${['Admin','Manager','Cashier','Kitchen','Viewer'].map(r => `<option value="${r}" ${r===currentRole?'selected':''}>${roleLabel(r)}</option>`).join('')}
        </select>
        <button class="btn btn-outline-brand btn-sm w-100" onclick="logout()"><i class="bi bi-box-arrow-right"></i> ${t('logOut')}</button>
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
        <div class="d-flex align-items-center gap-2">
          ${langToggleHTML()}
          <div class="role-pill d-none d-sm-flex"><i class="bi bi-person-circle"></i> ${roleLabel(currentRole)}</div>
        </div>
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
      <i class="bi ${i.icon}"></i> ${t(i.labelKey)}
    </button>`).join('');

  const bn = document.getElementById('bottom-nav');
  const activeBottom = MORE_ITEMS.some(m => m.id === active) ? 'more' : active;
  bn.innerHTML = NAV.map(i => `
    <button class="nav-item ${activeBottom === i.id ? 'active' : ''}" onclick="${i.id==='more' ? 'openMoreSheet()' : `go('${i.id}')`}">
      <i class="bi ${i.icon}"></i><span>${t(i.labelKey)}</span>
    </button>`).join('');
}

function openMoreSheet() {
  const items = MORE_ITEMS.filter(i => !i.money || canSeeMoney());
  const html = `
    <div class="modal fade" id="moreModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-bottom">
        <div class="modal-content" style="border-radius:20px 20px 0 0;">
          <div class="modal-header"><h5 class="modal-title">${t('more')}</h5>
            <button class="btn-close" data-bs-dismiss="modal"></button></div>
          <div class="modal-body">
            <div class="row row-cols-3 g-3 text-center">
              ${items.map(i => `
                <div class="col">
                  <button class="btn w-100 py-3" style="background:var(--cream-deep);border-radius:14px;border:none;" data-bs-dismiss="modal" onclick="go('${i.id}')">
                    <i class="bi ${i.icon}" style="font-size:1.3rem;"></i>
                    <div style="font-size:.72rem;font-weight:600;margin-top:6px;">${t(i.labelKey)}</div>
                  </button>
                </div>`).join('')}
              <div class="col">
                <button class="btn w-100 py-3" style="background:var(--cream-deep);border-radius:14px;border:none;" data-bs-dismiss="modal" onclick="logout()">
                  <i class="bi bi-box-arrow-right" style="font-size:1.3rem;"></i>
                  <div style="font-size:.72rem;font-weight:600;margin-top:6px;">${t('logOut')}</div>
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
        <div class="info">${count} ${t('c_items')}</div>
        <div class="amount">${money(total)}</div>
      </div>
      <button onclick="event.stopPropagation();go('cart')">${t('t_cart')}</button>
    </div>`;
}

/* ================= ROUTER ================= */
function renderAll() {
  renderShell();
  const view = route();
  const titles = {
    dashboard: ['t_dashboard', 's_dashboard'], pos: ['t_pos', 's_pos'], cart: ['t_cart', 's_cart'],
    checkout: ['t_checkout', 's_checkout'], orders: ['t_orders', 's_orders'],
    'menu-admin': ['t_menuadmin', 's_menuadmin'], stock: ['t_stock', 's_stock'], cost: ['t_cost', 's_cost'],
    'income-expense': ['t_incomeexpense', 's_incomeexpense'], reports: ['t_reports', 's_reports'],
    customers: ['t_customers', 's_customers'], promotions: ['t_promotions', 's_promotions'],
    users: ['t_users', 's_users'], settings: ['t_settings', 's_settings'], audit: ['t_audit', 's_audit'],
  };
  const [tk, sk] = titles[view] || titles.dashboard;
  document.getElementById('page-title').textContent = t(tk);
  document.getElementById('page-sub').textContent = t(sk);

  const moneyGated = ['cost', 'income-expense'];
  const el = document.getElementById('view');
  if (moneyGated.includes(view) && !canSeeMoney()) {
    el.innerHTML = `<div class="empty-state card-soft"><i class="bi bi-lock-fill"></i>
      <div class="fw-bold">${t('restricted')}</div>
      <div>${t('restrictedMsg')}</div></div>`;
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
  const today = S.orders;
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
    [t('kpi_todaySales'), money(todaySales), 'bi-graph-up-arrow', 'var(--sage)', canSeeMoney()],
    [t('kpi_todayOrders'), todayOrders, 'bi-receipt', 'var(--sky)', true],
    [t('kpi_itemsSold'), itemsSold, 'bi-basket3-fill', 'var(--apricot)', true],
    [t('kpi_estProfit'), money(profit), 'bi-piggy-bank-fill', 'var(--caramel)', canSeeMoney()],
    [t('kpi_avgOrder'), money(aov), 'bi-tag-fill', 'var(--sky)', canSeeMoney()],
    [t('kpi_pending'), pending, 'bi-hourglass-split', 'var(--status-new)', true],
    [t('kpi_preparing'), preparing, 'bi-fire', 'var(--status-preparing)', true],
    [t('kpi_ready'), ready, 'bi-check-circle-fill', 'var(--status-ready)', true],
    [t('kpi_soldOutMenus'), soldOut, 'bi-x-octagon-fill', 'var(--cherry)', true],
    [t('kpi_lowStock'), lowStock, 'bi-exclamation-triangle-fill', 'var(--apricot)', true],
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
        <div class="card-soft"><div class="section-title" style="margin-top:0;">${t('chart_trend')}</div><canvas id="chartTrend" height="160"></canvas></div>
      </div>
      <div class="col-12 col-lg-5">
        <div class="card-soft"><div class="section-title" style="margin-top:0;">${t('chart_status')}</div><canvas id="chartStatus" height="160"></canvas></div>
      </div>
      <div class="col-12 col-lg-6">
        <div class="card-soft"><div class="section-title" style="margin-top:0;">${t('chart_salesMenu')}</div><canvas id="chartSalesMenu" height="180"></canvas></div>
      </div>
      <div class="col-12 col-lg-6">
        <div class="card-soft"><div class="section-title" style="margin-top:0;">${t('chart_top5')}</div><canvas id="chartTop5" height="180"></canvas></div>
      </div>
      ${canSeeMoney() ? `
      <div class="col-12">
        <div class="card-soft"><div class="section-title" style="margin-top:0;">${t('chart_profit')}</div><canvas id="chartProfit" height="140"></canvas></div>
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
  Chart.defaults.font.family = 'Inter';
  Chart.defaults.color = '#6B5644';

  const todayTotal = S.orders.reduce((a,o)=>a+orderTotal(o),0) || 500;
  const days7 = Array.from({length:7}, (_,i) => {
    const d = new Date(); d.setDate(d.getDate() - (6-i));
    return d.toLocaleDateString(I18N.getLang()==='th'?'th-TH':'en-US',{weekday:'short'});
  });
  const trendData = [0.7,0.85,0.6,0.95,1.1,1.3,1].map(f => Math.round(todayTotal * f));
  charts.trend = new Chart(document.getElementById('chartTrend'), {
    type:'line',
    data:{ labels: days7, datasets:[{ data: trendData, borderColor: brand.caramel, backgroundColor:'rgba(182,123,77,0.15)', fill:true, tension:.35, pointRadius:3 }]},
    options:{ plugins:{legend:{display:false}}, scales:{ y:{ ticks:{ callback:v=>S.settings.currency+v } } } }
  });

  const statusList = ['New','Confirmed','Preparing','Ready','Completed','Cancelled'];
  const statusCounts = statusList.map(s => S.orders.filter(o=>o.orderStatus===s).length);
  charts.status = new Chart(document.getElementById('chartStatus'), {
    type:'doughnut',
    data:{ labels: statusList.map(orderStatusLabel),
      datasets:[{ data: statusCounts, backgroundColor:['#6F93A8','#B67B4D','#E8A15D','#7C9473','#3D2B1F','#C44A3A'] }]},
    options:{ plugins:{ legend:{ position:'bottom', labels:{ boxWidth:10, font:{size:10} } } }, cutout:'62%' }
  });

  const salesByMenu = S.menu.map(m => ({ name:mName(m), val: m.sold * m.price }));
  charts.salesMenu = new Chart(document.getElementById('chartSalesMenu'), {
    type:'bar',
    data:{ labels: salesByMenu.map(x=>x.name), datasets:[{ data: salesByMenu.map(x=>x.val), backgroundColor: brand.apricot, borderRadius:6 }]},
    options:{ indexAxis:'y', plugins:{legend:{display:false}}, scales:{ x:{ ticks:{ callback:v=>S.settings.currency+v } } } }
  });

  const top5 = [...S.menu].sort((a,b)=>b.sold-a.sold).slice(0,5);
  charts.top5 = new Chart(document.getElementById('chartTop5'), {
    type:'bar',
    data:{ labels: top5.map(x=>mName(x)), datasets:[{ data: top5.map(x=>x.sold), backgroundColor: brand.sage, borderRadius:6 }]},
    options:{ plugins:{legend:{display:false}} }
  });

  if (canSeeMoney()) {
    const profitByMenu = S.menu.map(m => ({ name:mName(m), val: (m.price - m.cost) * m.sold }));
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
      <input class="form-control" placeholder="${t('searchMenu')}" id="posSearch" value="${posSearch}">
    </div>
    <div class="filter-scroll mb-3">
      ${CATS.map(c => `<button class="pill-filter ${posFilter===c?'active':''}" onclick="setPosFilter('${c}')">${catLabel(c)}</button>`).join('')}
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
  if (!items.length) { grid.innerHTML = `<div class="empty-state"><i class="bi bi-search"></i>${t('noMenuFound')}</div>`; return; }
  grid.innerHTML = items.map(m => {
    const rem = remaining(m);
    const soldOut = rem <= 0 || m.status === 'Sold Out';
    const inCart = S.cart.find(c => c.menuId === m.id);
    const qty = inCart ? inCart.qty : 0;
    const pct = Math.max(0, Math.min(100, (rem / m.dailyLimit) * 100));
    return `
      <div class="menu-card ${soldOut ? 'soldout' : ''}">
        ${soldOut ? `<div class="soldout-ribbon">${t('soldOut')}</div>` : ''}
        <div class="img-wrap">${m.image}</div>
        <div class="body">
          <div class="name">${mName(m)}</div>
          <div class="cat">${catLabel(m.category)}</div>
          <div class="price">${money(m.price)}</div>
          <div class="meta">${t('metaLine', m.dailyLimit, m.sold, rem)}</div>
          <div class="remaining-bar"><div style="width:${pct}%; background:${pct<25?'var(--cherry)':'var(--sage)'}"></div></div>
          ${!soldOut ? `
          <div class="qty-row">
            <button class="qty-btn" onclick="changeCartQty('${m.id}', -1)">−</button>
            <span class="qty-val">${qty}</span>
            <button class="qty-btn" onclick="changeCartQty('${m.id}', 1)">+</button>
          </div>
          <button class="btn-add" onclick="addToCart('${m.id}')">${t('addToCart')}</button>` :
          `<button class="btn-add" disabled>${t('soldOutBtn')}</button>`}
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
    el.innerHTML = `<div class="empty-state card-soft"><i class="bi bi-cart-x"></i>${t('cartEmpty')}
      <div class="mt-3"><button class="btn btn-brand" onclick="go('pos')">${t('browseMenu')}</button></div></div>`;
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
            <div class="name">${mName(m)}</div>
            <div class="unit">${money(c.price)} ${t('each')}</div>
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
      <div class="d-flex justify-content-between mb-1"><span>${t('subtotal')}</span><span>${money(subtotal)}</span></div>
      <div class="d-flex justify-content-between mb-1"><span>${t('discount')}</span><span>-${money(discount)}</span></div>
      <div class="d-flex justify-content-between mb-2"><span>${t('deliveryFee')}</span><span>${money(deliveryFee)}</span></div>
      <div class="divider-soft"></div>
      <div class="d-flex justify-content-between fw-bold fs-5"><span>${t('total')}</span><span>${money(total)}</span></div>
      <button class="btn btn-brand w-100 mt-3 py-2" onclick="go('checkout')">${t('checkoutBtn')}</button>
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
      <div class="section-title" style="margin-top:0;">${t('orderItems')}</div>
      ${S.cart.map(c => { const m = menuById(c.menuId); return `
        <div class="d-flex justify-content-between py-1" style="font-size:.88rem;">
          <span>${mName(m)} × ${c.qty}</span><span>${money(c.qty*c.price)}</span>
        </div>`; }).join('')}
      <div class="divider-soft"></div>
      <div class="d-flex justify-content-between fw-bold"><span>${t('total')}</span><span id="coTotal">${money(subtotal)}</span></div>
    </div>
    <div class="card-soft mb-3">
      <label>${t('customerName')}</label>
      <input class="form-control mb-3" id="coCustomer" placeholder="${t('walkIn')}">
      <label>${t('discount')} (${S.settings.currency})</label>
      <input type="number" class="form-control mb-3" id="coDiscount" value="0" min="0">
      <label>${t('deliveryFee')} (${S.settings.currency})</label>
      <input type="number" class="form-control mb-3" id="coDelivery" value="0" min="0">
      <label>${t('paymentMethod')}</label>
      <select class="form-select mb-3" id="coPayMethod">
        ${['Cash','PromptPay / QR','Bank Transfer','Other'].map(m => `<option value="${m}">${payMethodLabel(m)}</option>`).join('')}
      </select>
      <label>${t('paymentStatus')}</label>
      <select class="form-select" id="coPayStatus">
        ${['Unpaid','Paid','Refunded'].map(s => `<option value="${s}">${payStatusLabel(s)}</option>`).join('')}
      </select>
    </div>
    <button class="btn btn-brand w-100 py-2" onclick="confirmOrder()">${t('confirmOrder')}</button>
  `;
  ['coDiscount', 'coDelivery'].forEach(id => document.getElementById(id).addEventListener('input', () => {
    const d = Number(document.getElementById('coDiscount').value) || 0;
    const f = Number(document.getElementById('coDelivery').value) || 0;
    document.getElementById('coTotal').textContent = money(subtotal - d + f);
  }));
}

function confirmOrder() {
  const customer = document.getElementById('coCustomer').value || t('walkIn');
  const discount = Number(document.getElementById('coDiscount').value) || 0;
  const deliveryFee = Number(document.getElementById('coDelivery').value) || 0;
  const paymentMethod = document.getElementById('coPayMethod').value;
  const paymentStatus = document.getElementById('coPayStatus').value;

  const seq = String(S.orders.filter(o => o.id.includes(DB.todayStr().replace(/-/g, ''))).length + 1).padStart(3, '0');
  const orderId = `ORD-${DB.todayStr().replace(/-/g, '')}-${seq}`;

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
  const FILTER_KEY = { All: 'ordAll', New: 'ordNew', Preparing: 'ordPreparing', Ready: 'ordReady', Completed: 'ordCompleted', Cancelled: 'ordCancelled' };
  el.innerHTML = `
    <div class="filter-scroll mb-3">
      ${filters.map(f => `<button class="pill-filter ${orderFilter===f?'active':''}" onclick="setOrderFilter('${f}')">${t(FILTER_KEY[f])}</button>`).join('')}
    </div>
    <div id="orderList"></div>
  `;
  renderOrderList();
}
function setOrderFilter(f) { orderFilter = f; renderOrders(document.getElementById('view')); }

function renderOrderList() {
  const list = document.getElementById('orderList');
  const orders = S.orders.filter(o => orderFilter === 'All' || o.orderStatus === orderFilter);
  if (!orders.length) { list.innerHTML = `<div class="empty-state"><i class="bi bi-inbox"></i>${t('noOrders')}</div>`; return; }
  list.innerHTML = orders.map(o => {
    const items = o.items.map(it => `${mName(menuById(it.menuId)) || '?'} ×${it.qty}`).join(', ');
    const total = orderTotal(o);
    const next = ORDER_FLOW[ORDER_FLOW.indexOf(o.orderStatus) + 1];
    return `
    <div class="order-card">
      <div class="top-row">
        <div>
          <div class="order-no">${o.id} ${o.source === 'customer' ? `<span class="badge-status" style="background:var(--sky);font-size:.6rem;">${t('selfOrder')}</span>` : ''}</div>
          <div class="order-time">${new Date(o.time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} · ${o.customer}${o.phone ? ' · ' + o.phone : ''}</div>
          ${o.pickupDate ? `<div class="order-time"><i class="bi bi-calendar-event"></i> ${t('pickup')}: ${o.pickupDate}${o.pickupTime ? ' ' + o.pickupTime : ''}</div>` : ''}
        </div>
        <div class="d-flex gap-1">
          <span class="badge-status ${statusClass(o.orderStatus)}">${orderStatusLabel(o.orderStatus)}</span>
        </div>
      </div>
      <div class="items-line">${items}${o.note ? `<br><span class="fst-italic">${t('note')}: ${o.note}</span>` : ''}</div>
      <div class="d-flex justify-content-between align-items-center">
        <span class="badge-status ${statusClass(o.paymentStatus)}">${payStatusLabel(o.paymentStatus)} · ${payMethodLabel(o.paymentMethod)}</span>
        <span class="total">${money(total)}</span>
      </div>
      <div class="actions">
        ${next && o.orderStatus !== 'Cancelled' ? `<button class="btn btn-brand" onclick="advanceOrder('${o.id}')">${nextLabel(next)}</button>` : ''}
        ${!['Completed','Cancelled'].includes(o.orderStatus) ? `<button class="btn btn-outline-brand" onclick="cancelOrder('${o.id}')">${t('act_cancel')}</button>` : ''}
        <button class="btn btn-outline-brand" onclick="togglePayment('${o.id}')">${t('act_togglePay')}</button>
      </div>
    </div>`;
  }).join('');
}
function nextLabel(next) {
  return { Confirmed: t('act_accept'), Preparing: t('act_prepare'), Ready: t('act_ready'), Completed: t('act_complete') }[next] || next;
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
      <button class="btn btn-brand" onclick="openMenuModal()"><i class="bi bi-plus-lg"></i> ${t('addMenu')}</button>
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
        <div class="name">${mName(m)}</div>
        <div class="cat">${catLabel(m.category)}</div>
        <div class="price">${money(m.price)}</div>
        <span class="badge-status ${statusClass(m.status)}">${menuStatusLabel(m.status)}</span>
        <div class="meta mt-1">${t('dailyLimit')} ${m.dailyLimit} · ${t('th_remaining')} ${rem}</div>
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
  logChange(mName(m), 'Toggled Sold Out', old, m.status);
  DB.save();
  renderAdminGrid();
}
function deleteMenu(id) {
  if (!confirm(t('deleteConfirm'))) return;
  S.menu = S.menu.filter(m => m.id !== id);
  DB.save(); renderAdminGrid();
}
function openMenuModal(id) {
  const m = id ? menuById(id) : null;
  const html = `
    <div class="modal fade" id="menuModal" tabindex="-1"><div class="modal-dialog modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header"><h5 class="modal-title">${m ? t('editMenu') : t('addMenu')}</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
        <div class="modal-body">
          <label>${t('productName')}</label><input class="form-control mb-2" id="fName" value="${m?.name||''}">
          <label>${t('category')}</label>
          <select class="form-select mb-2" id="fCat">${['Cake','Cookie','Bread','Drink','Other'].map(c=>`<option value="${c}" ${m?.category===c?'selected':''}>${catLabel(c)}</option>`).join('')}</select>
          <div class="row g-2">
            <div class="col-6"><label>${t('sellingPrice')}</label><input type="number" class="form-control mb-2" id="fPrice" value="${m?.price||0}"></div>
            <div class="col-6"><label>${t('cost')}</label><input type="number" class="form-control mb-2" id="fCost" value="${m?.cost||0}"></div>
          </div>
          <label>${t('dailyLimit')}</label><input type="number" class="form-control mb-2" id="fLimit" value="${m?.dailyLimit||20}">
          <label>${t('status')}</label>
          <select class="form-select mb-2" id="fStatus">${['Active','Inactive','Sold Out','Scheduled'].map(s=>`<option value="${s}" ${m?.status===s?'selected':''}>${menuStatusLabel(s)}</option>`).join('')}</select>
          <label>${t('availableDays')}</label>
          <div class="d-flex gap-1 mb-2 flex-wrap" id="fDays">
            ${DAY_ORDER.map(d => `<span class="chip-day ${(m?.days||DAY_ORDER).includes(d)?'on':''}" onclick="this.classList.toggle('on')" data-day="${d}">${dayChip(d)}</span>`).join('')}
          </div>
          <div class="row g-2">
            <div class="col-6"><label>${t('startTime')}</label><input type="time" class="form-control mb-2" id="fStart" value="${m?.startTime||'08:00'}"></div>
            <div class="col-6"><label>${t('endTime')}</label><input type="time" class="form-control mb-2" id="fEnd" value="${m?.endTime||'19:00'}"></div>
          </div>
        </div>
        <div class="modal-footer"><button class="btn btn-brand w-100" onclick="saveMenu('${id||''}')">${t('saveMenu')}</button></div>
      </div>
    </div></div>`;
  document.getElementById('modal-root').innerHTML = html;
  new bootstrap.Modal(document.getElementById('menuModal')).show();
}
function saveMenu(id) {
  const days = [...document.querySelectorAll('#fDays .chip-day.on')].map(x => x.dataset.day);
  const data = {
    name: document.getElementById('fName').value || 'Untitled',
    nameTh: document.getElementById('fName').value || 'ไม่มีชื่อ', category: document.getElementById('fCat').value,
    price: Number(document.getElementById('fPrice').value) || 0,
    cost: Number(document.getElementById('fCost').value) || 0,
    dailyLimit: Number(document.getElementById('fLimit').value) || 0,
    status: document.getElementById('fStatus').value,
    days, startTime: document.getElementById('fStart').value, endTime: document.getElementById('fEnd').value,
  };
  if (id) {
    const m = menuById(id);
    if (m.dailyLimit !== data.dailyLimit) logChange(mName(m), 'Changed Daily Limit', m.dailyLimit, data.dailyLimit);
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
        <thead><tr><th class="ps-3">${t('th_menu')}</th><th>${t('th_limit')}</th><th>${t('th_produced')}</th><th>${t('th_sold')}</th><th>${t('th_remaining')}</th><th class="pe-3">${t('th_status')}</th></tr></thead>
        <tbody>
          ${S.menu.map(m => {
            const rem = remaining(m);
            const status = rem <= 0 ? 'Sold Out' : rem <= m.dailyLimit*0.25 ? 'Low' : 'Available';
            return `<tr>
              <td class="ps-3">${m.image} ${mName(m)}</td>
              <td>${m.dailyLimit}</td>
              <td><input type="number" class="form-control form-control-sm" style="width:80px" value="${m.dailyLimit}" onchange="updateProduced('${m.id}', this.value)"></td>
              <td>${m.sold}</td>
              <td class="fw-bold">${rem}</td>
              <td class="pe-3"><span class="badge-status ${statusClass(status)}">${stockStatusLabel(status)}</span></td>
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
  logChange(mName(m), 'Changed Produced Quantity', old, m.dailyLimit);
  DB.save();
  renderStock(document.getElementById('view'));
}

/* ================= COST MANAGEMENT ================= */
function renderCost(el) {
  el.innerHTML = `
    <div class="card-soft p-0 overflow-hidden">
      <table class="table table-clean mb-0">
        <thead><tr><th class="ps-3">${t('th_menu')}</th><th>${t('th_price')}</th><th>${t('th_cost')}</th><th>${t('th_profit')}</th><th class="pe-3">${t('th_margin')}</th></tr></thead>
        <tbody>
          ${S.menu.map(m => {
            const profit = m.price - m.cost;
            const margin = m.price ? (profit / m.price * 100).toFixed(2) : '0.00';
            return `<tr>
              <td class="ps-3">${m.image} ${mName(m)}</td>
              <td>${money(m.price)}</td>
              <td><input type="number" class="form-control form-control-sm" style="width:80px" value="${m.cost}" onchange="updateCost('${m.id}', this.value)"></td>
              <td class="fw-bold" style="color:${profit>=0?'var(--sage)':'var(--cherry)'}">${money(profit)}</td>
              <td class="pe-3">${margin}%</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    <div class="section-title">${t('costBreakdownTitle')}</div>
    <div class="card-soft">
      <p class="text-muted small mb-2">${t('costBreakdownDesc')}</p>
      <select class="form-select mb-3" id="costMenuSelect" onchange="renderCostBreakdown(this.value)">
        ${S.menu.map(m => `<option value="${m.id}">${mName(m)}</option>`).join('')}
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
  logChange(mName(m), 'Changed Cost', old, m.cost);
  DB.save(); renderCost(document.getElementById('view'));
}
function renderCostBreakdown(id) {
  const box = document.getElementById('costBreakdown');
  if (!box || !id) return;
  const m = menuById(id);
  const parts = m.costParts || { ingredient: m.cost * 0.6, packaging: m.cost * 0.15, labor: m.cost * 0.15, delivery: 0, other: m.cost * 0.1 };
  const labels = { ingredient:t('ingredientCost'), packaging:t('packagingCost'), labor:t('laborCost'), delivery:t('deliveryCost'), other:t('otherCost') };
  box.innerHTML = `
    <div class="row g-2">
      ${Object.entries(labels).map(([k,label]) => `
        <div class="col-6 col-md-4"><label>${label}</label>
        <input type="number" class="form-control mb-2" value="${parts[k].toFixed(2)}" onchange="updateCostPart('${id}','${k}', this.value)"></div>
      `).join('')}
    </div>
    <div class="divider-soft"></div>
    <div class="d-flex justify-content-between"><span>${t('totalCost')}</span><b>${money(m.cost)}</b></div>
    <div class="d-flex justify-content-between"><span>${t('sellingPrice')}</span><b>${money(m.price)}</b></div>
    <div class="d-flex justify-content-between"><span>${t('profitPerItem')}</span><b style="color:var(--sage)">${money(m.price-m.cost)}</b></div>
    <div class="d-flex justify-content-between"><span>${t('profitMargin')}</span><b>${m.price ? ((m.price-m.cost)/m.price*100).toFixed(2) : '0.00'}%</b></div>
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
  const RANGE_KEY = { Today:'rangeToday', 'This Week':'rangeWeek', 'This Month':'rangeMonth', Custom:'rangeCustom' };
  el.innerHTML = `
    <div class="filter-scroll mb-3">
      ${['Today','This Week','This Month','Custom'].map(f => `<button class="pill-filter ${ieRange===f?'active':''}" onclick="setIeRange('${f}')">${t(RANGE_KEY[f])}</button>`).join('')}
    </div>
    <div class="row row-cols-3 g-2 mb-3">
      <div class="col"><div class="kpi-card"><div class="kpi-label">${t('totalRevenue')}</div><div class="kpi-value" style="font-size:1.2rem;color:var(--sage)">${money(totalRevenue)}</div></div></div>
      <div class="col"><div class="kpi-card"><div class="kpi-label">${t('totalExpense')}</div><div class="kpi-value" style="font-size:1.2rem;color:var(--cherry)">${money(totalExpense)}</div></div></div>
      <div class="col"><div class="kpi-card"><div class="kpi-label">${t('netProfit')}</div><div class="kpi-value" style="font-size:1.2rem;">${money(netProfit)}</div></div></div>
    </div>
    <div class="d-flex justify-content-between align-items-center mb-2">
      <div class="section-title" style="margin:0;">${t('expenses')}</div>
      <button class="btn btn-sm btn-brand" onclick="openExpenseModal()"><i class="bi bi-plus-lg"></i> ${t('addExpense')}</button>
    </div>
    <div class="card-soft p-0 overflow-hidden">
      <table class="table table-clean mb-0">
        <thead><tr><th class="ps-3">${t('th_date')}</th><th>${t('category')}</th><th>${t('th_note')}</th><th class="pe-3">${t('th_amount')}</th></tr></thead>
        <tbody>
          ${S.expenses.map(e => `<tr>
            <td class="ps-3">${e.date}</td><td>${expCatLabel(e.category)}</td><td>${e.note}</td>
            <td class="pe-3">${money(e.amount)}</td>
          </tr>`).join('') || `<tr><td colspan="4" class="text-center text-muted py-3">${t('noExpenses')}</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}
const EXP_CAT_KEY = { Ingredients:'expCatIngredients', Packaging:'expCatPackaging', Delivery:'expCatDelivery', Electricity:'expCatElectricity', Marketing:'expCatMarketing', Equipment:'expCatEquipment', Other:'expCatOther' };
const expCatLabel = (c) => t(EXP_CAT_KEY[c] || c);
function setIeRange(f) { ieRange = f; renderIncomeExpense(document.getElementById('view')); }
function openExpenseModal() {
  const cats = ['Ingredients','Packaging','Delivery','Electricity','Marketing','Equipment','Other'];
  const html = `
  <div class="modal fade" id="expModal" tabindex="-1"><div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header"><h5 class="modal-title">${t('addExpense')}</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
      <div class="modal-body">
        <label>${t('category')}</label>
        <select class="form-select mb-2" id="expCat">${cats.map(c=>`<option value="${c}">${expCatLabel(c)}</option>`).join('')}</select>
        <label>${t('th_note')}</label><input class="form-control mb-2" id="expNote">
        <label>${t('th_amount')}</label><input type="number" class="form-control" id="expAmount">
      </div>
      <div class="modal-footer"><button class="btn btn-brand w-100" onclick="saveExpense()">${t('saveSettings')}</button></div>
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
      ${[[t('r_totalSales'), canSeeMoney()?money(totalSales):'—'],[t('r_orders'), orderCount],[t('r_itemsSold'), itemsSold],
         [t('r_grossProfit'), canSeeMoney()?money(grossProfit):'—'],[t('r_avgOrder'), canSeeMoney()?money(aov):'—']]
        .map(([l,v]) => `<div class="col"><div class="kpi-card"><div class="kpi-label">${l}</div><div class="kpi-value" style="font-size:1.2rem;">${v}</div></div></div>`).join('')}
    </div>
    <div class="row g-3">
      <div class="col-12 col-lg-6"><div class="card-soft"><div class="section-title" style="margin-top:0;">${t('r_salesByDay')}</div><canvas id="repDay" height="180"></canvas></div></div>
      <div class="col-12 col-lg-6"><div class="card-soft"><div class="section-title" style="margin-top:0;">${t('r_salesByMenu')}</div><canvas id="repMenu" height="180"></canvas></div></div>
      <div class="col-12 col-lg-6"><div class="card-soft"><div class="section-title" style="margin-top:0;">${t('r_payMethodSummary')}</div><canvas id="repPay" height="180"></canvas></div></div>
      <div class="col-12 col-lg-6">
        <div class="card-soft">
          <div class="section-title" style="margin-top:0;">${t('highlights')}</div>
          <div class="d-flex justify-content-between py-2 border-bottom"><span>${t('topSelling')}</span><b>${topMenu ? mName(topMenu) : '-'}</b></div>
          <div class="d-flex justify-content-between py-2"><span>${t('lowSelling')}</span><b>${lowMenu ? mName(lowMenu) : '-'}</b></div>
        </div>
      </div>
    </div>
  `;
  const days7 = Array.from({length:7}, (_,i) => { const d=new Date(); d.setDate(d.getDate()-(6-i)); return d.toLocaleDateString(I18N.getLang()==='th'?'th-TH':'en-US',{weekday:'short'}); });
  const base = totalSales || 400;
  new Chart(document.getElementById('repDay'), { type:'bar',
    data:{ labels: days7, datasets:[{ data:[0.6,0.8,0.5,0.9,1.1,1.3,1].map(f=>Math.round(base*f)), backgroundColor:'#B67B4D', borderRadius:6 }]},
    options:{ plugins:{legend:{display:false}} } });
  new Chart(document.getElementById('repMenu'), { type:'pie',
    data:{ labels: S.menu.map(m=>mName(m)), datasets:[{ data: S.menu.map(m=>m.sold*m.price), backgroundColor:['#E8A15D','#B67B4D','#7C9473','#6F93A8','#C44A3A','#F6D9B3','#3D2B1F','#9BB08F'] }]},
    options:{ plugins:{legend:{position:'bottom',labels:{boxWidth:10,font:{size:9}}}} } });
  new Chart(document.getElementById('repPay'), { type:'doughnut',
    data:{ labels:Object.keys(payMethods).map(payMethodLabel), datasets:[{ data:Object.values(payMethods), backgroundColor:['#7C9473','#E8A15D','#6F93A8','#C44A3A'] }]},
    options:{ plugins:{legend:{position:'bottom'}}, cutout:'60%' } });
}

/* ================= CUSTOMERS ================= */
function renderCustomers(el) {
  el.innerHTML = `
    <div class="d-flex justify-content-end mb-3"><button class="btn btn-brand" onclick="openCustomerModal()"><i class="bi bi-plus-lg"></i> ${t('addCustomer')}</button></div>
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
            <div class="d-flex justify-content-between small mb-1"><span>${t('custOrders')}</span><b>${custOrders.length}</b></div>
            <div class="d-flex justify-content-between small mb-1"><span>${t('totalSpending')}</span><b>${money(spend)}</b></div>
            <div class="d-flex justify-content-between small"><span>${t('favoriteMenu')}</span><b>${fav ? mName(menuById(fav[0])) : '-'}</b></div>
          </div>
        </div>`;
      }).join('')}
    </div>
    <div class="locked-banner mt-3"><i class="bi bi-stars"></i> ${t('membershipBanner')}</div>
  `;
}
function openCustomerModal() {
  const html = `<div class="modal fade" id="cusModal" tabindex="-1"><div class="modal-dialog"><div class="modal-content">
    <div class="modal-header"><h5 class="modal-title">${t('addCustomer')}</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
    <div class="modal-body">
      <label>${t('custName')}</label><input class="form-control mb-2" id="cusName">
      <label>${t('custPhone')}</label><input class="form-control mb-2" id="cusPhone">
      <label>${t('custLine')}</label><input class="form-control" id="cusLine">
    </div>
    <div class="modal-footer"><button class="btn btn-brand w-100" onclick="saveCustomer()">${t('saveSettings')}</button></div>
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
    <div class="d-flex justify-content-end mb-3"><button class="btn btn-brand" onclick="openPromoModal()"><i class="bi bi-plus-lg"></i> ${t('addPromo')}</button></div>
    <div class="row g-3">
      ${S.promotions.map(p => `
        <div class="col-12 col-md-6">
          <div class="card-soft">
            <div class="d-flex justify-content-between">
              <div class="fw-bold">${p.name}</div>
              <span class="badge-status ${p.active?'b-active':'b-inactive'}">${p.active?t('promoActive'):t('promoInactive')}</span>
            </div>
            <div class="small text-muted mt-1">${promoTypeLabel(p.type)} · ${t('minOrder')} ${money(p.minOrder)}</div>
            <div class="small text-muted">${p.start} → ${p.end}</div>
            <div class="mt-2">
              <button class="btn btn-sm btn-outline-brand" onclick="togglePromo('${p.id}')">${p.active?t('deactivate'):t('activate')}</button>
            </div>
          </div>
        </div>`).join('')}
    </div>
  `;
}
const PROMO_TYPE_KEY = { 'Percentage Discount':'typePercent', 'Fixed Discount':'typeFixed', Coupon:'typeCoupon', 'Buy X Get Y':'typeBuyXY', 'Member Discount':'typeMember' };
const promoTypeLabel = (ty) => t(PROMO_TYPE_KEY[ty] || ty);
function togglePromo(id) {
  const p = S.promotions.find(x=>x.id===id); p.active = !p.active; DB.save(); renderPromotions(document.getElementById('view'));
}
function openPromoModal() {
  const types = ['Percentage Discount','Fixed Discount','Coupon','Buy X Get Y','Member Discount'];
  const html = `<div class="modal fade" id="promoModal" tabindex="-1"><div class="modal-dialog"><div class="modal-content">
    <div class="modal-header"><h5 class="modal-title">${t('addPromo')}</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
    <div class="modal-body">
      <label>${t('promoName')}</label><input class="form-control mb-2" id="prName">
      <label>${t('promoType')}</label><select class="form-select mb-2" id="prType">${types.map(ty=>`<option value="${ty}">${promoTypeLabel(ty)}</option>`).join('')}</select>
      <div class="row g-2">
        <div class="col-6"><label>${t('startDate')}</label><input type="date" class="form-control mb-2" id="prStart" value="${DB.todayStr()}"></div>
        <div class="col-6"><label>${t('promoEndDate')}</label><input type="date" class="form-control mb-2" id="prEnd"></div>
      </div>
      <label>${t('minimumOrder')}</label><input type="number" class="form-control" id="prMin" value="0">
    </div>
    <div class="modal-footer"><button class="btn btn-brand w-100" onclick="savePromo()">${t('saveSettings')}</button></div>
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
const PERM_MODULES = [
  { key:'POS', labelKey:'mod_pos' }, { key:'Orders', labelKey:'mod_orders' }, { key:'Menu Management', labelKey:'mod_menu' },
  { key:'Cost', labelKey:'mod_cost' }, { key:'Income / Expense', labelKey:'mod_incomeexpense' }, { key:'Reports', labelKey:'mod_reports' },
  { key:'User Management', labelKey:'mod_users' }, { key:'Settings', labelKey:'mod_settings' },
];
const ROLES = ['Admin','Manager','Cashier','Kitchen','Viewer'];
function renderUsers(el) {
  el.innerHTML = `
    <div class="d-flex justify-content-end mb-3"><button class="btn btn-brand" onclick="openUserModal()"><i class="bi bi-plus-lg"></i> ${t('addUser')}</button></div>
    <div class="card-soft p-0 overflow-hidden">
      <table class="table table-clean mb-0">
        <thead><tr><th class="ps-3">${t('u_name')}</th><th class="pe-3">${t('u_role')}</th></tr></thead>
        <tbody>${S.users.map(u => `<tr><td class="ps-3">${u.name}</td><td class="pe-3"><span class="badge-status b-active">${roleLabel(u.role)}</span></td></tr>`).join('')}</tbody>
      </table>
    </div>
    <div class="section-title">${t('rolePermissions')}</div>
    <div class="card-soft p-0 overflow-hidden">
      <table class="table table-clean mb-0">
        <thead><tr><th class="ps-3">${t('module')}</th>${ROLES.map(r=>`<th class="text-center">${roleLabel(r)}</th>`).join('')}</tr></thead>
        <tbody>
          ${PERM_MODULES.map(mod => `<tr><td class="ps-3">${t(mod.labelKey)}</td>
            ${ROLES.map(r => `<td class="text-center">${defaultPerm(mod.key,r) ? '<i class="bi bi-check-circle-fill" style="color:var(--sage)"></i>' : '<i class="bi bi-dash" style="color:#ccc"></i>'}</td>`).join('')}
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
    <div class="modal-header"><h5 class="modal-title">${t('addUser')}</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
    <div class="modal-body">
      <label>${t('u_name')}</label><input class="form-control mb-2" id="usrName">
      <label>${t('u_role')}</label><select class="form-select" id="usrRole">${ROLES.map(r=>`<option value="${r}">${roleLabel(r)}</option>`).join('')}</select>
    </div>
    <div class="modal-footer"><button class="btn btn-brand w-100" onclick="saveUser()">${t('saveSettings')}</button></div>
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
        <div class="col-12 col-md-6"><label>${t('shopName')}</label><input class="form-control" id="setName" value="${s.shopName}"></div>
        <div class="col-12 col-md-6"><label>${t('tagline')}</label><input class="form-control" id="setTagline" value="${s.tagline}"></div>
        <div class="col-12 col-md-6"><label>${t('phone')}</label><input class="form-control" id="setPhone" value="${s.phone}"></div>
        <div class="col-12 col-md-6"><label>${t('line')}</label><input class="form-control" id="setLine" value="${s.line}"></div>
        <div class="col-12"><label>${t('address')}</label><input class="form-control" id="setAddress" value="${s.address}"></div>
        <div class="col-12 col-md-6"><label>${t('promptpay')}</label><input class="form-control" id="setPromptpay" value="${s.promptpay}"></div>
        <div class="col-6 col-md-3"><label>${t('openingTime')}</label><input type="time" class="form-control" id="setOpen" value="${s.openTime}"></div>
        <div class="col-6 col-md-3"><label>${t('closingTime')}</label><input type="time" class="form-control" id="setClose" value="${s.closeTime}"></div>
        <div class="col-6 col-md-3"><label>${t('currency')}</label><input class="form-control" id="setCurrency" value="${s.currency}"></div>
        <div class="col-6 col-md-3"><label>${t('vat')}</label><input type="number" class="form-control" id="setVat" value="${s.vat}"></div>
      </div>
      <button class="btn btn-brand mt-3" onclick="saveSettings()">${t('saveSettings')}</button>
    </div>
    <div class="section-title">${t('custOrderPage')}</div>
    <div class="card-soft">
      <p class="small text-muted mb-2">${t('custOrderDesc')}</p>
      <div class="d-flex gap-2 flex-wrap">
        <a href="customer.html" target="_blank" class="btn btn-apricot"><i class="bi bi-box-arrow-up-right"></i> ${t('openCustPage')}</a>
        <button class="btn btn-outline-brand" onclick="copyCustomerLink()"><i class="bi bi-link-45deg"></i> ${t('copyLink')}</button>
      </div>
    </div>
    <div class="section-title">${t('dangerZone')}</div>
    <div class="card-soft">
      <p class="small text-muted">${t('resetDesc')}</p>
      <button class="btn btn-outline-brand text-danger border-danger" onclick="resetAll()">${t('resetData')}</button>
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
  navigator.clipboard?.writeText(url).then(() => alert(t('linkCopied') + '\n' + url)).catch(() => alert(url));
}
function resetAll() {
  if (!confirm(t('resetConfirm'))) return;
  DB.reset();
  location.reload();
}

/* ================= AUDIT LOG ================= */
function renderAudit(el) {
  if (!S.auditLog.length) { el.innerHTML = `<div class="empty-state card-soft"><i class="bi bi-clock-history"></i>${t('noChanges')}</div>`; return; }
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
