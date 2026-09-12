/* ============================================================
   Ob-la-moon Snack Shop — Data layer
   Seed data + localStorage persistence
   Structured so a PHP/MySQL backend can replace this later:
   every entity has an id, and reads/writes go through DB.* only.
   ============================================================ */

const DB = (() => {
  const KEY = 'oblamoon_v1';

  const todayStr = () => new Date().toISOString().slice(0, 10);
  const uid = (p) => p + '_' + Math.random().toString(36).slice(2, 9);

  function seed() {
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const menu = [
      { id:'m1', name:'Banana Cake', nameTh:'เค้กกล้วยหอม', category:'Cake',
        price:10, cost:4, dailyLimit:60, sold:38, image:'🍌',
        status:'Active', days:[...days], startTime:'08:00', endTime:'19:00' },
      { id:'m2', name:'Coconut Lava Chiffon', nameTh:'ชิฟฟ่อนลาวา มะพร้าวอ่อน', category:'Cake',
        price:30, cost:12, dailyLimit:25, sold:25, image:'🥥',
        status:'Active', days:[...days], startTime:'08:00', endTime:'19:00' },
      { id:'m3', name:'Taro Coconut Lava Chiffon', nameTh:'ชิฟฟ่อนลาวา เผือกมะพร้าวอ่อน', category:'Cake',
        price:30, cost:13, dailyLimit:25, sold:9, image:'🍠',
        status:'Active', days:[...days], startTime:'08:00', endTime:'19:00' },
      { id:'m4', name:'Mini Cake - Strawberry', nameTh:'เค้กมินิ สตอเบอรี่', category:'Cake',
        price:35, cost:15, dailyLimit:20, sold:20, image:'🍓',
        status:'Active', days:[...days], startTime:'08:00', endTime:'19:00' },
      { id:'m5', name:'Mini Cake - Blueberry', nameTh:'เค้กมินิ บลูเบอรี่', category:'Cake',
        price:35, cost:15, dailyLimit:20, sold:14, image:'🫐',
        status:'Active', days:[...days], startTime:'08:00', endTime:'19:00' },
      { id:'m6', name:'Mini Cake - Mango', nameTh:'เค้กมินิ มะม่วง', category:'Cake',
        price:35, cost:15, dailyLimit:20, sold:6, image:'🥭',
        status:'Active', days:[...days], startTime:'08:00', endTime:'19:00' },
      { id:'m7', name:'Taiwanese Egg Cake', nameTh:'เค้กไข่ไต้หวัน', category:'Bread',
        price:25, cost:9, dailyLimit:30, sold:12, image:'🍞',
        status:'Active', days:[...days], startTime:'08:00', endTime:'19:00' },
      { id:'m8', name:'Egg Tart', nameTh:'ทาร์ตไข่', category:'Cookie',
        price:15, cost:6, dailyLimit:50, sold:31, image:'🥧',
        status:'Active', days:[...days], startTime:'08:00', endTime:'19:00' },
    ];

    const orders = [
      { id:'ORD-'+todayStr().replace(/-/g,'')+'-001', time: Date.now()-1000*60*40,
        customer:'Nid', items:[{menuId:'m1',qty:4,price:10},{menuId:'m8',qty:2,price:15}],
        discount:0, deliveryFee:0, paymentMethod:'Cash', paymentStatus:'Paid',
        orderStatus:'Completed' },
      { id:'ORD-'+todayStr().replace(/-/g,'')+'-002', time: Date.now()-1000*60*25,
        customer:'Ploy', items:[{menuId:'m2',qty:1,price:30},{menuId:'m4',qty:1,price:35}],
        discount:5, deliveryFee:0, paymentMethod:'PromptPay', paymentStatus:'Paid',
        orderStatus:'Ready' },
      { id:'ORD-'+todayStr().replace(/-/g,'')+'-003', time: Date.now()-1000*60*12,
        customer:'Tum', items:[{menuId:'m7',qty:2,price:25},{menuId:'m3',qty:1,price:30}],
        discount:0, deliveryFee:10, paymentMethod:'Bank Transfer', paymentStatus:'Unpaid',
        orderStatus:'Preparing' },
      { id:'ORD-'+todayStr().replace(/-/g,'')+'-004', time: Date.now()-1000*60*4,
        customer:'Walk-in', items:[{menuId:'m8',qty:3,price:15},{menuId:'m1',qty:2,price:10}],
        discount:0, deliveryFee:0, paymentMethod:'Cash', paymentStatus:'Unpaid',
        orderStatus:'New' },
    ];

    const expenses = [
      { id:uid('exp'), date:todayStr(), category:'Ingredients', note:'Flour, sugar, eggs', amount:850 },
      { id:uid('exp'), date:todayStr(), category:'Packaging', note:'Boxes & wrap', amount:180 },
      { id:uid('exp'), date:todayStr(), category:'Electricity', note:'Oven usage', amount:120 },
    ];

    const customers = [
      { id:uid('cus'), name:'Nid', phone:'081-234-5678', line:'@nid_bkk' },
      { id:uid('cus'), name:'Ploy', phone:'089-111-2222', line:'@ploy_p' },
      { id:uid('cus'), name:'Tum', phone:'062-555-9090', line:'-' },
    ];

    const promotions = [
      { id:uid('promo'), name:'Buy 4 Banana Cake 110฿', type:'Buy X Get Y', value:0,
        start:todayStr(), end:'2026-12-31', active:true, minOrder:0, menu:['m1'] },
      { id:uid('promo'), name:'Mini Cake 3 for 100฿', type:'Fixed Discount', value:5,
        start:todayStr(), end:'2026-12-31', active:true, minOrder:100, menu:['m4','m5','m6'] },
    ];

    const users = [
      { id:uid('usr'), name:'Admin01', role:'Admin' },
      { id:uid('usr'), name:'Nong (Cashier)', role:'Cashier' },
      { id:uid('usr'), name:'Kai (Kitchen)', role:'Kitchen' },
    ];

    const settings = {
      shopName:'Ob-la-moon', tagline:'Homemade Bakery',
      address:'', phone:'', line:'', promptpay:'',
      openTime:'08:00', closeTime:'19:00', currency:'฿', vat:0
    };

    const auditLog = [
      { id:uid('log'), user:'Admin01', time: Date.now()-1000*60*60*3,
        action:'Changed Daily Limit', item:'Banana Cake', oldValue:'40', newValue:'60' },
    ];

    return { menu, orders, expenses, customers, promotions, users, settings, auditLog, cart:[] };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    const fresh = seed();
    save(fresh);
    return fresh;
  }

  function save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  let state = load();

  return {
    state,
    save() { save(state); },
    reset() { state = seed(); save(state); return state; },
    uid, todayStr
  };
})();

