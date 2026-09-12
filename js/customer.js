/* ============================================================
   Ob-la-moon — Customer Self-Order Page
   Standalone flow for customers: Menu -> Cart -> Details -> Confirm.
   Writes real orders into the same DB.state.orders the staff app
   reads, tagged source:'customer' with a pickup date/time and phone.
   No shop-management UI is reachable from here. Thai by default,
   language toggle shared with the staff app via localStorage.
   ============================================================ */

const S2 = DB.state;
let step = 'menu';           // menu | cart | details | done
let ccart = [];              // customer's own working cart (kept in memory for this visit)
let catFilter = 'All';
let search = '';
let lastOrderId = null;
const t2 = I18N.t;

const money2 = (n) => S2.settings.currency + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
const menuById2 = (id) => S2.menu.find(m => m.id === id);
const remaining2 = (m) => Math.max(0, m.dailyLimit - m.sold);
const mName2 = (m) => I18N.getLang() === 'th' ? (m.nameTh || m.name) : m.name;

const CAT_KEY2 = { All: 'catAll', Cake: 'catCake', Cookie: 'catCookie', Bread: 'catBread', Drink: 'catDrink', Other: 'catOther' };
const catLabel2 = (c) => t2(CAT_KEY2[c] || 'catOther');
const CATS2 = ['All','Cake','Cookie','Bread','Drink','Other'];

function setLang2(l) { I18N.setLang(l); renderCustApp(); }

function langToggleHTML2() {
  const lang = I18N.getLang();
  return `
    <div class="lang-toggle">
      <button class="${lang==='th'?'active':''}" onclick="setLang2('th')">TH</button>
      <button class="${lang==='en'?'active':''}" onclick="setLang2('en')">EN</button>
    </div>`;
}

function renderCustApp() {
  const root = document.getElementById('cust-app');
  const steps = ['menu', 'cart', 'details', 'done'];
  const idx = steps.indexOf(step);
  const stepTitle = { menu: t2('c_orderMenu'), cart: t2('c_yourCart'), details: t2('c_yourDetails'), done: t2('c_orderPlaced') }[step];
  root.innerHTML = `
    <div class="cust-shell">
      <div class="cust-topbar">
        ${step !== 'menu' && step !== 'done' ? `<button onclick="goStep('${steps[idx-1]}')"><i class="bi bi-arrow-left"></i></button>` : `<div style="width:36px"></div>`}
        <div class="title flex-grow-1 text-center">${stepTitle}</div>
        ${langToggleHTML2()}
      </div>
      ${step !== 'done' ? `
      <div class="cust-steps">
        ${['menu','cart','details'].map((s,i) => `<div class="dot ${i < idx ? 'done' : i === idx ? 'active' : ''}"></div>`).join('')}
      </div>` : ''}
      <div id="cust-view"></div>
    </div>
  `;
  const view = document.getElementById('cust-view');
  if (step === 'menu') renderCustMenu(view);
  if (step === 'cart') renderCustCart(view);
  if (step === 'details') renderCustDetails(view);
  if (step === 'done') renderCustDone(view);
  renderCustCartBar();
}

function goStep(s) { step = s; renderCustApp(); }

/* ---------------- Menu ---------------- */
function renderCustMenu(view) {
  view.innerHTML = `
    <div class="cust-hero" style="padding-top:6px;">
      <div class="mark"><i class="bi bi-cupcake"></i></div>
      <h1>${S2.settings.shopName}</h1>
      <p>${S2.settings.tagline} · ${t2('c_heroSub')}</p>
    </div>
    <input class="form-control mb-2" placeholder="${t2('searchMenu')}" id="custSearch" value="${search}">
    <div class="filter-scroll mb-3">
      ${CATS2.map(c => `<button class="pill-filter ${catFilter===c?'active':''}" onclick="setCustFilter('${c}')">${catLabel2(c)}</button>`).join('')}
    </div>
    <div class="menu-grid" id="custGrid"></div>
  `;
  document.getElementById('custSearch').addEventListener('input', e => { search = e.target.value; renderCustGrid(); });
  renderCustGrid();
}
function setCustFilter(c) { catFilter = c; renderCustMenu(document.getElementById('cust-view')); }

function renderCustGrid() {
  const grid = document.getElementById('custGrid');
  if (!grid) return;
  const items = S2.menu.filter(m =>
    m.status !== 'Inactive' &&
    (catFilter === 'All' || m.category === catFilter) &&
    (m.name.toLowerCase().includes(search.toLowerCase()) || m.nameTh.includes(search))
  );
  if (!items.length) { grid.innerHTML = `<div class="empty-state"><i class="bi bi-search"></i>${t2('noMenuFound')}</div>`; return; }
  grid.innerHTML = items.map(m => {
    const rem = remaining2(m);
    const soldOut = rem <= 0 || m.status === 'Sold Out';
    const inCart = ccart.find(c => c.menuId === m.id);
    const qty = inCart ? inCart.qty : 0;
    const pct = Math.max(0, Math.min(100, (rem / m.dailyLimit) * 100));
    return `
      <div class="menu-card ${soldOut ? 'soldout' : ''}">
        ${soldOut ? `<div class="soldout-ribbon">${t2('soldOut')}</div>` : ''}
        <div class="img-wrap">${m.image}</div>
        <div class="body">
          <div class="name">${mName2(m)}</div>
          <div class="cat">${catLabel2(m.category)}</div>
          <div class="price">${money2(m.price)}</div>
          <div class="meta">${soldOut ? t2('soldOutToday') : rem <= m.dailyLimit*0.25 ? t2('onlyLeft', rem) : t2('availableToday')}</div>
          ${!soldOut ? `
          <div class="qty-row">
            <button class="qty-btn" onclick="changeCustQty('${m.id}', -1)">−</button>
            <span class="qty-val">${qty}</span>
            <button class="qty-btn" onclick="changeCustQty('${m.id}', 1)">+</button>
          </div>
          <button class="btn-add" onclick="addCustCart('${m.id}')">${t2('addToCart')}</button>` :
          `<button class="btn-add" disabled>${t2('soldOutBtn')}</button>`}
        </div>
      </div>`;
  }).join('');
}

function changeCustQty(menuId, delta) {
  const m = menuById2(menuId);
  const max = remaining2(m);
  let item = ccart.find(c => c.menuId === menuId);
  if (!item) {
    if (delta > 0) ccart.push({ menuId, qty: 1, price: m.price });
  } else {
    item.qty = Math.max(0, Math.min(max, item.qty + delta));
    if (item.qty === 0) ccart = ccart.filter(c => c.menuId !== menuId);
  }
  renderCustGrid();
  renderCustCartBar();
}
function addCustCart(menuId) {
  if (!ccart.find(c => c.menuId === menuId)) {
    const m = menuById2(menuId);
    ccart.push({ menuId, qty: 1, price: m.price });
    renderCustGrid();
    renderCustCartBar();
  }
}

function renderCustCartBar() {
  const count = ccart.reduce((a, c) => a + c.qty, 0);
  const existing = document.getElementById('custCartBar');
  if (existing) existing.remove();
  if (!count || step === 'cart' || step === 'details' || step === 'done') return;
  const total = ccart.reduce((a, c) => a + c.qty * c.price, 0);
  const bar = document.createElement('div');
  bar.className = 'cust-cartbar';
  bar.id = 'custCartBar';
  bar.innerHTML = `
    <div>
      <div style="font-size:.75rem;opacity:.85;">${count} ${t2('c_items')}</div>
      <div style="font-family:var(--font-display);font-weight:700;font-size:1.05rem;">${money2(total)}</div>
    </div>
    <button onclick="goStep('cart')">${t2('c_yourCart')}</button>`;
  document.body.appendChild(bar);
}

/* ---------------- Cart ---------------- */
function renderCustCart(view) {
  if (!ccart.length) {
    view.innerHTML = `<div class="empty-state card-soft mt-3"><i class="bi bi-cart-x"></i>${t2('cartEmpty')}
      <div class="mt-3"><button class="btn btn-brand" onclick="goStep('menu')">${t2('browseMenu')}</button></div></div>`;
    return;
  }
  const subtotal = ccart.reduce((a, c) => a + c.qty * c.price, 0);
  view.innerHTML = `
    <div class="card-soft mb-3 mt-2">
      ${ccart.map(c => { const m = menuById2(c.menuId); return `
        <div class="cart-item">
          <div class="thumb">${m.image}</div>
          <div class="flex-grow-1">
            <div class="name">${mName2(m)}</div>
            <div class="unit">${money2(c.price)} ${t2('each')}</div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <button class="qty-btn" onclick="changeCustQty('${m.id}',-1);renderCustCart(document.getElementById('cust-view'))">−</button>
            <span class="qty-val">${c.qty}</span>
            <button class="qty-btn" onclick="changeCustQty('${m.id}',1);renderCustCart(document.getElementById('cust-view'))">+</button>
          </div>
          <div class="sub">${money2(c.qty * c.price)}</div>
        </div>`; }).join('')}
    </div>
    <div class="card-soft">
      <div class="d-flex justify-content-between fw-bold fs-5"><span>${t2('total')}</span><span>${money2(subtotal)}</span></div>
      <button class="btn btn-brand w-100 mt-3 py-2" onclick="goStep('details')">${t2('continueBtn')}</button>
      <button class="btn btn-outline-brand w-100 mt-2 py-2" onclick="goStep('menu')">${t2('addMoreItems')}</button>
    </div>
  `;
}

/* ---------------- Details ---------------- */
function renderCustDetails(view) {
  if (!ccart.length) { goStep('menu'); return; }
  const subtotal = ccart.reduce((a, c) => a + c.qty * c.price, 0);
  const today = DB.todayStr();
  view.innerHTML = `
    <div class="card-soft mb-3 mt-2">
      <div class="d-flex justify-content-between fw-bold"><span>${t2('c_orderTotal')}</span><span>${money2(subtotal)}</span></div>
      <div class="small text-muted mt-1">${ccart.reduce((a,c)=>a+c.qty,0)} ${t2('c_items')}</div>
    </div>
    <div class="card-soft mb-3">
      <label>${t2('c_yourName')} <span class="text-danger">*</span></label>
      <input class="form-control mb-3" id="custName" placeholder="${t2('c_namePh')}">
      <label>${t2('c_phoneNumber')} <span class="text-danger">*</span></label>
      <input class="form-control mb-3" id="custPhone" placeholder="${t2('c_phonePh')}" inputmode="tel">
      <div class="row g-2">
        <div class="col-7">
          <label>${t2('c_pickupDate')} <span class="text-danger">*</span></label>
          <input type="date" class="form-control mb-3" id="custDate" value="${today}" min="${today}">
        </div>
        <div class="col-5">
          <label>${t2('c_pickupTime')}</label>
          <input type="time" class="form-control mb-3" id="custTime" value="${S2.settings.openTime || '10:00'}">
        </div>
      </div>
      <label>${t2('c_paymentPref')}</label>
      <select class="form-select mb-3" id="custPayMethod">
        ${['Cash','PromptPay / QR','Bank Transfer','Other'].map(m => `<option value="${m}">${t2(({Cash:'payCash','PromptPay / QR':'payPromptpay','Bank Transfer':'payBankTransfer',Other:'payOther'})[m])}</option>`).join('')}
      </select>
      <label>${t2('c_noteOpt')}</label>
      <textarea class="form-control" id="custNote" rows="2" placeholder="${t2('c_notePh')}"></textarea>
    </div>
    <div id="custError" class="text-danger small mb-2"></div>
    <button class="btn btn-brand w-100 py-2" onclick="submitCustOrder()">${t2('confirmOrder')}</button>
  `;
}

function submitCustOrder() {
  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const date = document.getElementById('custDate').value;
  const time = document.getElementById('custTime').value;
  const payMethod = document.getElementById('custPayMethod').value;
  const note = document.getElementById('custNote').value.trim();
  const err = document.getElementById('custError');

  if (!name || !phone || !date) {
    err.textContent = t2('c_fillRequired');
    return;
  }
  err.textContent = '';

  ccart.forEach(c => { const m = menuById2(c.menuId); m.sold += c.qty; });

  const seq = String(S2.orders.filter(o => o.id.includes(DB.todayStr().replace(/-/g, ''))).length + 1).padStart(3, '0');
  const orderId = `ORD-${DB.todayStr().replace(/-/g, '')}-${seq}`;

  S2.orders.unshift({
    id: orderId, time: Date.now(), customer: name, phone,
    items: ccart.map(c => ({ menuId: c.menuId, qty: c.qty, price: c.price })),
    discount: 0, deliveryFee: 0, paymentMethod: payMethod, paymentStatus: 'Unpaid',
    orderStatus: 'New', pickupDate: date, pickupTime: time, note, source: 'customer'
  });
  DB.save();
  lastOrderId = orderId;
  ccart = [];
  step = 'done';
  renderCustApp();
}

/* ---------------- Confirmation ---------------- */
function renderCustDone(view) {
  const o = S2.orders.find(x => x.id === lastOrderId);
  if (!o) { goStep('menu'); return; }
  const total = o.items.reduce((a,it)=>a+it.qty*it.price,0);
  const PM_KEY = { Cash:'payCash', 'PromptPay / QR':'payPromptpay', 'Bank Transfer':'payBankTransfer', Other:'payOther' };
  view.innerHTML = `
    <div class="text-center mt-4">
      <div class="confirm-badge"><i class="bi bi-check-lg"></i></div>
      <h2 class="brand-font" style="font-size:1.3rem;">${t2('c_thankYou', o.customer)}</h2>
      <p class="text-muted small">${t2('c_receivedMsg')}</p>
    </div>
    <div class="order-num-box">
      <div style="font-size:.72rem;opacity:.8;">${t2('c_orderNumber')}</div>
      <div class="num">${o.id}</div>
    </div>
    <div class="card-soft mb-3">
      ${o.items.map(it => { const m = menuById2(it.menuId); return `
        <div class="d-flex justify-content-between py-1" style="font-size:.88rem;">
          <span>${mName2(m)} × ${it.qty}</span><span>${money2(it.qty*it.price)}</span>
        </div>`; }).join('')}
      <div class="divider-soft"></div>
      <div class="d-flex justify-content-between fw-bold"><span>${t2('total')}</span><span>${money2(total)}</span></div>
      <div class="divider-soft"></div>
      <div class="d-flex justify-content-between small"><span>${t2('c_pickupLabel')}</span><b>${o.pickupDate} ${o.pickupTime||''}</b></div>
      <div class="d-flex justify-content-between small"><span>${t2('c_paymentLabel')}</span><b>${t2(PM_KEY[o.paymentMethod]||o.paymentMethod)} (${t2('payUnpaid')})</b></div>
    </div>
    <button class="btn btn-brand w-100 py-2" onclick="goStep('menu')">${t2('c_placeAnother')}</button>
  `;
}

document.addEventListener('DOMContentLoaded', renderCustApp);
