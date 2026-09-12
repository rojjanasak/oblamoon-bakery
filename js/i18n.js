/* ============================================================
   Ob-la-moon — i18n
   Thai is the default language. Language choice persists in
   localStorage ('oblamoon_lang') and is shared by the staff app
   and the customer ordering page (same origin/storage).
   ============================================================ */

const I18N = (() => {
  const LANG_KEY = 'oblamoon_lang';

  const en = {
    shopManagement: 'Shop Management',
    logOut: 'Log Out',
    more: 'More',
    role: 'Role (demo)',
    restricted: 'Restricted',
    restrictedMsg: 'Cost & profit information is only visible to Admin or Manager roles.',

    nav_dashboard: 'Home', nav_orders: 'Orders', nav_pos: 'POS', nav_reports: 'Report',
    sb_dashboard: 'Dashboard', sb_pos: 'POS', sb_orders: 'Orders', sb_stock: 'Daily Stock',
    sb_menuadmin: 'Menu', sb_cost: 'Cost', sb_incomeexpense: 'Income / Expense', sb_reports: 'Reports',
    sb_customers: 'Customers', sb_promotions: 'Promotion', sb_users: 'Users', sb_settings: 'Settings',
    sb_audit: 'Audit Log',

    t_dashboard: 'Dashboard', s_dashboard: "Today's snapshot at a glance",
    t_pos: 'POS / Menu', s_pos: 'Tap to add items to the order',
    t_cart: 'Cart', s_cart: 'Review before checkout',
    t_checkout: 'Checkout', s_checkout: 'Confirm payment & order',
    t_orders: 'Order Management', s_orders: 'Track every order live',
    t_menuadmin: 'Menu Management', s_menuadmin: 'Add, edit, and control availability',
    t_stock: 'Daily Stock', s_stock: "Today's production & remaining",
    t_cost: 'Cost Management', s_cost: 'Cost, profit & margin per item',
    t_incomeexpense: 'Income / Expense', s_incomeexpense: 'Revenue, costs & net profit',
    t_reports: 'Sales Report', s_reports: 'Performance over time',
    t_customers: 'Customers', s_customers: 'Order history & spending',
    t_promotions: 'Promotions', s_promotions: 'Discounts & coupons',
    t_users: 'Users & Permissions', s_users: 'Roles & access control',
    t_settings: 'Shop Settings', s_settings: 'Shop profile & preferences',
    t_audit: 'Audit Log', s_audit: 'System change history',

    loginUsername: 'Username', loginPassword: 'Password', loginBtn: 'Log In',
    loginError: 'Incorrect username or password.',
    loginHint: 'Demo credentials — username:', loginHintAnd: 'password:',

    kpi_todaySales: 'Today Sales', kpi_todayOrders: 'Today Orders', kpi_itemsSold: 'Items Sold',
    kpi_estProfit: 'Est. Profit', kpi_avgOrder: 'Avg Order Value', kpi_pending: 'Pending Orders',
    kpi_preparing: 'Preparing', kpi_ready: 'Ready', kpi_soldOutMenus: 'Sold Out Menus',
    kpi_lowStock: 'Low Stock Items',
    chart_trend: 'Daily Sales Trend', chart_status: 'Orders by Status', chart_salesMenu: 'Sales by Menu',
    chart_top5: 'Top 5 Best Selling', chart_profit: 'Profit by Menu',

    searchMenu: 'Search menu...', addToCart: 'Add to Cart', soldOut: 'SOLD OUT', soldOutBtn: 'Sold Out',
    noMenuFound: 'No menu items found.',
    metaLine: (limit, sold, rem) => `Limit ${limit} \u00b7 Sold ${sold} \u00b7 Remaining ${rem}`,
    onlyLeft: (n) => `Only ${n} left today`, availableToday: 'Available', soldOutToday: 'Sold out for today',

    cartEmpty: 'Your cart is empty.', browseMenu: 'Browse Menu', subtotal: 'Subtotal', discount: 'Discount',
    deliveryFee: 'Delivery Fee', total: 'Total', checkoutBtn: 'Checkout', each: 'each',
    orderItems: 'Order Items', customerName: 'Customer Name', walkIn: 'Walk-in',
    paymentMethod: 'Payment Method', paymentStatus: 'Payment Status', confirmOrder: 'Confirm Order',
    addMoreItems: 'Add More Items', continueBtn: 'Continue',

    ordAll: 'All', ordNew: 'New', ordConfirmed: 'Confirmed', ordPreparing: 'Preparing', ordReady: 'Ready',
    ordCompleted: 'Completed', ordCancelled: 'Cancelled', noOrders: 'No orders here.',
    act_accept: 'Accept Order', act_prepare: 'Start Preparing', act_ready: 'Mark Ready', act_complete: 'Complete',
    act_cancel: 'Cancel', act_togglePay: 'Toggle Payment', selfOrder: 'Self-order', pickup: 'Pickup',
    note: 'Note',
    payUnpaid: 'Unpaid', payPaid: 'Paid', payRefunded: 'Refunded',

    addMenu: 'Add Menu', editMenu: 'Edit Menu', productName: 'Product Name', category: 'Category',
    sellingPrice: 'Selling Price', cost: 'Cost', dailyLimit: 'Daily Limit', status: 'Status',
    availableDays: 'Available Days', startTime: 'Start Time', endTime: 'End Time', saveMenu: 'Save Menu',
    stAActive: 'Active', stInactive: 'Inactive', stSoldOut: 'Sold Out', stScheduled: 'Scheduled',
    catAll: 'All', catCake: 'Cake', catCookie: 'Cookie', catBread: 'Bread', catDrink: 'Drink', catOther: 'Other',
    deleteConfirm: 'Delete this menu item?',
    resetConfirm: 'This will erase all changes and reload seed data. Continue?',

    th_menu: 'Menu', th_limit: 'Limit', th_produced: 'Produced', th_sold: 'Sold', th_remaining: 'Remaining',
    th_status: 'Status', stLow: 'Low', stAvailable: 'Available',

    th_price: 'Price', th_cost: 'Cost', th_profit: 'Profit', th_margin: 'Margin',
    costBreakdownTitle: 'Cost Breakdown (example)',
    costBreakdownDesc: 'Select a menu to break down its cost components (ingredient, packaging, labor, delivery, other).',
    ingredientCost: 'Ingredient Cost', packagingCost: 'Packaging Cost', laborCost: 'Labor Cost',
    deliveryCost: 'Delivery Cost', otherCost: 'Other Cost', totalCost: 'Total Cost',
    profitPerItem: 'Profit per Item', profitMargin: 'Profit Margin',

    rangeToday: 'Today', rangeWeek: 'This Week', rangeMonth: 'This Month', rangeCustom: 'Custom',
    totalRevenue: 'Total Revenue', totalExpense: 'Total Expense', netProfit: 'Net Profit',
    expenses: 'Expenses', addExpense: 'Add Expense', th_date: 'Date', th_note: 'Note', th_amount: 'Amount',
    noExpenses: 'No expenses recorded', expCatIngredients: 'Ingredients', expCatPackaging: 'Packaging',
    expCatDelivery: 'Delivery', expCatElectricity: 'Electricity', expCatMarketing: 'Marketing',
    expCatEquipment: 'Equipment', expCatOther: 'Other',

    r_totalSales: 'Total Sales', r_orders: 'Orders', r_itemsSold: 'Items Sold', r_grossProfit: 'Gross Profit',
    r_avgOrder: 'Avg Order Value', r_salesByDay: 'Sales by Day', r_salesByMenu: 'Sales by Menu',
    r_payMethodSummary: 'Payment Method Summary', highlights: 'Highlights', topSelling: 'Top Selling Menu',
    lowSelling: 'Low Selling Menu',

    addCustomer: 'Add Customer', custOrders: 'Orders', totalSpending: 'Total Spending', favoriteMenu: 'Favorite Menu',
    membershipBanner: 'Membership, loyalty points, and coupons are ready to be enabled here in a future update.',
    custName: 'Name', custPhone: 'Phone', custLine: 'LINE / Contact',

    addPromo: 'Add Promotion', minOrder: 'Min order', promoActive: 'Active', promoInactive: 'Inactive',
    deactivate: 'Deactivate', activate: 'Activate', promoName: 'Name', promoType: 'Type',
    startDate: 'Start Date', promoEndDate: 'End Date', minimumOrder: 'Minimum Order',
    typePercent: 'Percentage Discount', typeFixed: 'Fixed Discount', typeCoupon: 'Coupon',
    typeBuyXY: 'Buy X Get Y', typeMember: 'Member Discount',

    addUser: 'Add User', u_name: 'Name', u_role: 'Role', rolePermissions: 'Role Permissions',
    module: 'Module', roleAdmin: 'Admin', roleManager: 'Manager', roleCashier: 'Cashier',
    roleKitchen: 'Kitchen', roleViewer: 'Viewer',
    mod_pos: 'POS', mod_orders: 'Orders', mod_menu: 'Menu Management', mod_cost: 'Cost',
    mod_incomeexpense: 'Income / Expense', mod_reports: 'Reports', mod_users: 'User Management',
    mod_settings: 'Settings',

    shopName: 'Shop Name', tagline: 'Tagline', phone: 'Phone', line: 'LINE', address: 'Address',
    promptpay: 'PromptPay Info', openingTime: 'Opening Time', closingTime: 'Closing Time',
    currency: 'Currency', vat: 'VAT %', saveSettings: 'Save Settings',
    custOrderPage: 'Customer Self-Order Page',
    custOrderDesc: "Share this page with customers (print as a QR code, or open on a counter tablet) so they can browse the menu, build their own cart, and submit an order with their name, phone, and pickup date \u2014 without seeing any shop-management screens.",
    openCustPage: 'Open Customer Page', copyLink: 'Copy Link', linkCopied: 'Link copied:',
    dangerZone: 'Danger Zone', resetDesc: 'Reset all demo data back to the original seed (menu, orders, expenses).',
    resetData: 'Reset Demo Data',

    noChanges: 'No changes recorded yet.',

    c_orderMenu: 'Order Menu', c_yourCart: 'Your Cart', c_yourDetails: 'Your Details', c_orderPlaced: 'Order Placed',
    c_heroSub: "Pick what you'd like, we'll get it ready for pickup",
    c_orderTotal: 'Order Total', c_items: 'item(s)', c_yourName: 'Your Name', c_phoneNumber: 'Phone Number',
    c_pickupDate: 'Pickup Date', c_pickupTime: 'Pickup Time', c_paymentPref: 'Payment Preference',
    c_noteOpt: 'Note (optional)', c_notePh: 'Any special request...',
    c_fillRequired: 'Please fill in your name, phone number, and pickup date.',
    c_thankYou: (name) => `Thank you, ${name}!`, c_receivedMsg: "We've received your order and will start preparing it.",
    c_orderNumber: 'ORDER NUMBER', c_pickupLabel: 'Pickup', c_paymentLabel: 'Payment',
    c_placeAnother: 'Place Another Order', c_namePh: 'e.g. Nid', c_phonePh: '08x-xxx-xxxx',
    payCash: 'Cash', payPromptpay: 'PromptPay / QR', payBankTransfer: 'Bank Transfer', payOther: 'Other',

    off_title: "You're offline",
    off_desc: "Ob-la-moon needs a connection to load new data.<br>Your last saved orders and menu are safe on this device.",
    off_retry: 'Try Again',
  };

  const th = {
    shopManagement: 'ระบบจัดการร้าน',
    logOut: 'ออกจากระบบ',
    more: 'เพิ่มเติม',
    role: 'บทบาท (ทดลอง)',
    restricted: 'จำกัดสิทธิ์',
    restrictedMsg: 'ข้อมูลต้นทุนและกำไรแสดงให้เฉพาะบทบาท Admin หรือ Manager เท่านั้น',

    nav_dashboard: 'หน้าหลัก', nav_orders: 'ออเดอร์', nav_pos: 'ขายหน้าร้าน', nav_reports: 'รายงาน',
    sb_dashboard: 'แดชบอร์ด', sb_pos: 'ขายหน้าร้าน', sb_orders: 'ออเดอร์', sb_stock: 'สต๊อกรายวัน',
    sb_menuadmin: 'เมนู', sb_cost: 'ต้นทุน', sb_incomeexpense: 'รายรับ-รายจ่าย', sb_reports: 'รายงาน',
    sb_customers: 'ลูกค้า', sb_promotions: 'โปรโมชั่น', sb_users: 'ผู้ใช้งาน', sb_settings: 'ตั้งค่า',
    sb_audit: 'ประวัติการแก้ไข',

    t_dashboard: 'แดชบอร์ด', s_dashboard: 'สรุปภาพรวมวันนี้ในที่เดียว',
    t_pos: 'ขายหน้าร้าน / เมนู', s_pos: 'แตะเพื่อเพิ่มสินค้าลงตะกร้า',
    t_cart: 'ตะกร้าสินค้า', s_cart: 'ตรวจสอบก่อนชำระเงิน',
    t_checkout: 'ชำระเงิน', s_checkout: 'ยืนยันการชำระเงินและออเดอร์',
    t_orders: 'จัดการออเดอร์', s_orders: 'ติดตามทุกออเดอร์แบบเรียลไทม์',
    t_menuadmin: 'จัดการเมนู', s_menuadmin: 'เพิ่ม แก้ไข และควบคุมสถานะเมนู',
    t_stock: 'สต๊อกรายวัน', s_stock: 'ยอดผลิตและคงเหลือของวันนี้',
    t_cost: 'จัดการต้นทุน', s_cost: 'ต้นทุน กำไร และมาร์จิ้นต่อเมนู',
    t_incomeexpense: 'รายรับ-รายจ่าย', s_incomeexpense: 'รายรับ ต้นทุน และกำไรสุทธิ',
    t_reports: 'รายงานยอดขาย', s_reports: 'ผลการดำเนินงานย้อนหลัง',
    t_customers: 'ลูกค้า', s_customers: 'ประวัติการสั่งซื้อและยอดใช้จ่าย',
    t_promotions: 'โปรโมชั่น', s_promotions: 'ส่วนลดและคูปอง',
    t_users: 'ผู้ใช้งานและสิทธิ์', s_users: 'บทบาทและการเข้าถึงระบบ',
    t_settings: 'ตั้งค่าร้าน', s_settings: 'ข้อมูลร้านและค่ากำหนดต่าง ๆ',
    t_audit: 'ประวัติการแก้ไข', s_audit: 'บันทึกการเปลี่ยนแปลงของระบบ',

    loginUsername: 'ชื่อผู้ใช้', loginPassword: 'รหัสผ่าน', loginBtn: 'เข้าสู่ระบบ',
    loginError: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
    loginHint: 'บัญชีทดลอง \u2014 ชื่อผู้ใช้:', loginHintAnd: 'รหัสผ่าน:',

    kpi_todaySales: 'ยอดขายวันนี้', kpi_todayOrders: 'ออเดอร์วันนี้', kpi_itemsSold: 'จำนวนที่ขายได้',
    kpi_estProfit: 'กำไรโดยประมาณ', kpi_avgOrder: 'ยอดเฉลี่ยต่อออเดอร์', kpi_pending: 'ออเดอร์รอดำเนินการ',
    kpi_preparing: 'กำลังเตรียม', kpi_ready: 'พร้อมส่ง', kpi_soldOutMenus: 'เมนูที่หมด',
    kpi_lowStock: 'สินค้าใกล้หมด',
    chart_trend: 'ยอดขายรายวัน', chart_status: 'ออเดอร์ตามสถานะ', chart_salesMenu: 'ยอดขายตามเมนู',
    chart_top5: '5 เมนูขายดีที่สุด', chart_profit: 'กำไรตามเมนู',

    searchMenu: 'ค้นหาเมนู...', addToCart: 'ใส่ตะกร้า', soldOut: 'หมดแล้ว', soldOutBtn: 'สินค้าหมด',
    noMenuFound: 'ไม่พบเมนูที่ค้นหา',
    metaLine: (limit, sold, rem) => `จำกัด ${limit} \u00b7 ขายแล้ว ${sold} \u00b7 เหลือ ${rem}`,
    onlyLeft: (n) => `เหลือวันนี้อีก ${n} ชิ้น`, availableToday: 'มีขายวันนี้', soldOutToday: 'หมดแล้วสำหรับวันนี้',

    cartEmpty: 'ตะกร้าของคุณว่างเปล่า', browseMenu: 'ดูเมนู', subtotal: 'ยอดรวมสินค้า', discount: 'ส่วนลด',
    deliveryFee: 'ค่าจัดส่ง', total: 'ยอดรวมทั้งหมด', checkoutBtn: 'ชำระเงิน', each: 'ต่อชิ้น',
    orderItems: 'รายการสินค้า', customerName: 'ชื่อลูกค้า', walkIn: 'ลูกค้าหน้าร้าน',
    paymentMethod: 'วิธีชำระเงิน', paymentStatus: 'สถานะการชำระเงิน', confirmOrder: 'ยืนยันออเดอร์',
    addMoreItems: 'เลือกสินค้าเพิ่ม', continueBtn: 'ดำเนินการต่อ',

    ordAll: 'ทั้งหมด', ordNew: 'ใหม่', ordConfirmed: 'ยืนยันแล้ว', ordPreparing: 'กำลังเตรียม', ordReady: 'พร้อมส่ง',
    ordCompleted: 'เสร็จสิ้น', ordCancelled: 'ยกเลิก', noOrders: 'ไม่มีออเดอร์ในหมวดนี้',
    act_accept: 'รับออเดอร์', act_prepare: 'เริ่มเตรียม', act_ready: 'พร้อมส่งแล้ว', act_complete: 'เสร็จสิ้น',
    act_cancel: 'ยกเลิก', act_togglePay: 'สลับสถานะชำระเงิน', selfOrder: 'ลูกค้าสั่งเอง', pickup: 'รับที่ร้าน',
    note: 'โน้ต',
    payUnpaid: 'ยังไม่ชำระ', payPaid: 'ชำระแล้ว', payRefunded: 'คืนเงินแล้ว',

    addMenu: 'เพิ่มเมนู', editMenu: 'แก้ไขเมนู', productName: 'ชื่อสินค้า', category: 'หมวดหมู่',
    sellingPrice: 'ราคาขาย', cost: 'ต้นทุน', dailyLimit: 'จำนวนจำกัดต่อวัน', status: 'สถานะ',
    availableDays: 'วันที่เปิดขาย', startTime: 'เวลาเริ่มขาย', endTime: 'เวลาเลิกขาย', saveMenu: 'บันทึกเมนู',
    stAActive: 'เปิดขาย', stInactive: 'ปิดใช้งาน', stSoldOut: 'สินค้าหมด', stScheduled: 'ตั้งเวลาไว้',
    catAll: 'ทั้งหมด', catCake: 'เค้ก', catCookie: 'คุกกี้', catBread: 'ขนมปัง', catDrink: 'เครื่องดื่ม', catOther: 'อื่น ๆ',
    deleteConfirm: 'ต้องการลบเมนูนี้ใช่หรือไม่?',
    resetConfirm: 'การดำเนินการนี้จะล้างข้อมูลทั้งหมดและโหลดข้อมูลตั้งต้นใหม่ ต้องการดำเนินการต่อหรือไม่?',

    th_menu: 'เมนู', th_limit: 'จำกัด', th_produced: 'ผลิต', th_sold: 'ขายแล้ว', th_remaining: 'คงเหลือ',
    th_status: 'สถานะ', stLow: 'ใกล้หมด', stAvailable: 'มีสินค้า',

    th_price: 'ราคา', th_cost: 'ต้นทุน', th_profit: 'กำไร', th_margin: 'มาร์จิ้น',
    costBreakdownTitle: 'รายละเอียดต้นทุน (ตัวอย่าง)',
    costBreakdownDesc: 'เลือกเมนูเพื่อดูรายละเอียดต้นทุน (วัตถุดิบ บรรจุภัณฑ์ แรงงาน จัดส่ง อื่น ๆ)',
    ingredientCost: 'ต้นทุนวัตถุดิบ', packagingCost: 'ต้นทุนบรรจุภัณฑ์', laborCost: 'ต้นทุนแรงงาน',
    deliveryCost: 'ต้นทุนจัดส่ง', otherCost: 'ต้นทุนอื่น ๆ', totalCost: 'ต้นทุนรวม',
    profitPerItem: 'กำไรต่อชิ้น', profitMargin: 'มาร์จิ้นกำไร',

    rangeToday: 'วันนี้', rangeWeek: 'สัปดาห์นี้', rangeMonth: 'เดือนนี้', rangeCustom: 'กำหนดเอง',
    totalRevenue: 'รายรับรวม', totalExpense: 'รายจ่ายรวม', netProfit: 'กำไรสุทธิ',
    expenses: 'รายจ่าย', addExpense: 'เพิ่มรายจ่าย', th_date: 'วันที่', th_note: 'โน้ต', th_amount: 'จำนวนเงิน',
    noExpenses: 'ยังไม่มีรายการรายจ่าย', expCatIngredients: 'วัตถุดิบ', expCatPackaging: 'บรรจุภัณฑ์',
    expCatDelivery: 'ค่าจัดส่ง', expCatElectricity: 'ค่าไฟฟ้า', expCatMarketing: 'การตลาด',
    expCatEquipment: 'อุปกรณ์', expCatOther: 'อื่น ๆ',

    r_totalSales: 'ยอดขายรวม', r_orders: 'จำนวนออเดอร์', r_itemsSold: 'จำนวนที่ขายได้', r_grossProfit: 'กำไรขั้นต้น',
    r_avgOrder: 'ยอดเฉลี่ยต่อออเดอร์', r_salesByDay: 'ยอดขายรายวัน', r_salesByMenu: 'ยอดขายตามเมนู',
    r_payMethodSummary: 'สรุปวิธีชำระเงิน', highlights: 'ไฮไลต์', topSelling: 'เมนูขายดีที่สุด',
    lowSelling: 'เมนูขายน้อยที่สุด',

    addCustomer: 'เพิ่มลูกค้า', custOrders: 'จำนวนออเดอร์', totalSpending: 'ยอดใช้จ่ายรวม', favoriteMenu: 'เมนูโปรด',
    membershipBanner: 'ระบบสมาชิก แต้มสะสม และคูปอง พร้อมเปิดใช้งานในอัปเดตครั้งถัดไป',
    custName: 'ชื่อ', custPhone: 'เบอร์โทร', custLine: 'LINE / ช่องทางติดต่อ',

    addPromo: 'เพิ่มโปรโมชั่น', minOrder: 'ยอดขั้นต่ำ', promoActive: 'เปิดใช้งาน', promoInactive: 'ปิดใช้งาน',
    deactivate: 'ปิดใช้งาน', activate: 'เปิดใช้งาน', promoName: 'ชื่อโปรโมชั่น', promoType: 'ประเภท',
    startDate: 'วันที่เริ่ม', promoEndDate: 'วันที่สิ้นสุด', minimumOrder: 'ยอดสั่งซื้อขั้นต่ำ',
    typePercent: 'ส่วนลดเปอร์เซ็นต์', typeFixed: 'ส่วนลดจำนวนเงิน', typeCoupon: 'คูปอง',
    typeBuyXY: 'ซื้อ X แถม Y', typeMember: 'ส่วนลดสมาชิก',

    addUser: 'เพิ่มผู้ใช้งาน', u_name: 'ชื่อ', u_role: 'บทบาท', rolePermissions: 'สิทธิ์การใช้งานตามบทบาท',
    module: 'โมดูล', roleAdmin: 'ผู้ดูแลระบบ', roleManager: 'ผู้จัดการ', roleCashier: 'แคชเชียร์',
    roleKitchen: 'ครัว', roleViewer: 'ผู้ดูข้อมูล',
    mod_pos: 'ขายหน้าร้าน', mod_orders: 'ออเดอร์', mod_menu: 'จัดการเมนู', mod_cost: 'ต้นทุน',
    mod_incomeexpense: 'รายรับ-รายจ่าย', mod_reports: 'รายงาน', mod_users: 'จัดการผู้ใช้งาน',
    mod_settings: 'ตั้งค่า',

    shopName: 'ชื่อร้าน', tagline: 'แท็กไลน์', phone: 'เบอร์โทร', line: 'LINE', address: 'ที่อยู่',
    promptpay: 'ข้อมูล PromptPay', openingTime: 'เวลาเปิดร้าน', closingTime: 'เวลาปิดร้าน',
    currency: 'สกุลเงิน', vat: 'VAT %', saveSettings: 'บันทึกการตั้งค่า',
    custOrderPage: 'หน้าสั่งซื้อสำหรับลูกค้า',
    custOrderDesc: 'แชร์หน้านี้ให้ลูกค้า (พิมพ์เป็น QR Code หรือเปิดค้างไว้บนแท็บเล็ตหน้าเคาน์เตอร์) เพื่อให้ลูกค้าเลือกเมนู ใส่ตะกร้าเอง และส่งออเดอร์พร้อมชื่อ เบอร์โทร และวันที่รับ โดยไม่เห็นหน้าจอจัดการร้านใด ๆ',
    openCustPage: 'เปิดหน้าลูกค้า', copyLink: 'คัดลอกลิงก์', linkCopied: 'คัดลอกลิงก์แล้ว:',
    dangerZone: 'โซนอันตราย', resetDesc: 'รีเซ็ตข้อมูลทดลองทั้งหมดกลับไปเป็นค่าตั้งต้น (เมนู ออเดอร์ รายจ่าย)',
    resetData: 'รีเซ็ตข้อมูลทดลอง',

    noChanges: 'ยังไม่มีการเปลี่ยนแปลงที่บันทึกไว้',

    c_orderMenu: 'สั่งเมนู', c_yourCart: 'ตะกร้าของคุณ', c_yourDetails: 'ข้อมูลของคุณ', c_orderPlaced: 'สั่งซื้อสำเร็จ',
    c_heroSub: 'เลือกขนมที่ต้องการ แล้วเราจะเตรียมให้พร้อมรับ',
    c_orderTotal: 'ยอดรวมออเดอร์', c_items: 'รายการ', c_yourName: 'ชื่อของคุณ', c_phoneNumber: 'เบอร์โทรศัพท์',
    c_pickupDate: 'วันที่รับ', c_pickupTime: 'เวลาที่รับ', c_paymentPref: 'วิธีชำระเงินที่สะดวก',
    c_noteOpt: 'โน้ตเพิ่มเติม (ไม่บังคับ)', c_notePh: 'มีคำขอพิเศษหรือไม่...',
    c_fillRequired: 'กรุณากรอกชื่อ เบอร์โทร และวันที่รับให้ครบถ้วน',
    c_thankYou: (name) => `ขอบคุณค่ะ คุณ${name}!`, c_receivedMsg: 'เราได้รับออเดอร์ของคุณแล้ว และจะเริ่มเตรียมให้ทันที',
    c_orderNumber: 'หมายเลขออเดอร์', c_pickupLabel: 'วันที่รับ', c_paymentLabel: 'การชำระเงิน',
    c_placeAnother: 'สั่งเพิ่มอีกออเดอร์', c_namePh: 'เช่น นิด', c_phonePh: '08x-xxx-xxxx',
    payCash: 'เงินสด', payPromptpay: 'พร้อมเพย์ / QR', payBankTransfer: 'โอนเงินผ่านธนาคาร', payOther: 'อื่น ๆ',

    off_title: 'คุณออฟไลน์อยู่',
    off_desc: 'Ob-la-moon ต้องการการเชื่อมต่ออินเทอร์เน็ตเพื่อโหลดข้อมูลใหม่<br>ออเดอร์และเมนูล่าสุดของคุณยังปลอดภัยอยู่ในเครื่องนี้',
    off_retry: 'ลองใหม่อีกครั้ง',
  };

  const dicts = { th, en };
  let lang = localStorage.getItem(LANG_KEY) || 'th';
  if (!dicts[lang]) lang = 'th';

  function t(key, ...args) {
    const entry = dicts[lang][key] ?? dicts.en[key] ?? key;
    return typeof entry === 'function' ? entry(...args) : entry;
  }
  function getLang() { return lang; }
  function setLang(l) {
    if (!dicts[l]) return;
    lang = l;
    localStorage.setItem(LANG_KEY, l);
  }

  return { t, getLang, setLang };
})();
