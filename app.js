// --- THEME MANAGEMENT ---
let currentTheme = localStorage.getItem('evento_theme') || 'light';

function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('evento_theme', currentTheme);
  applySettings();
}

function safeGetVal(id, fallback = '') {
  const el = document.getElementById(id);
  return el ? el.value : fallback;
}

function safeSetVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || '';
}

function safeSetText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text || '';
}

// --- CLOUD DATABASE ENGINE (Firebase Firestore) ---
let firestoreDb, doc, setDoc, getDoc;

async function initFirebase() {
  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js");
  const { getFirestore, doc: fDoc, setDoc: fSet, getDoc: fGet } = await import("https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js");
  const { getAnalytics } = await import("https://www.gstatic.com/firebasejs/12.11.0/firebase-analytics.js");

  const firebaseConfig = {
    apiKey: "AIzaSyAUVy-TXm86NcerhcJ1EIFpOpLpkKXAmmI",
    authDomain: "ssweddingeventbangalore.firebaseapp.com",
    projectId: "ssweddingeventbangalore",
    storageBucket: "ssweddingeventbangalore.firebasestorage.app",
    messagingSenderId: "225824971186",
    appId: "1:225824971186:web:41fff4d72ed84b39bbacab",
    measurementId: "G-MBSSBHJ6T2"
  };

  const app = initializeApp(firebaseConfig);
  getAnalytics(app);
  firestoreDb = getFirestore(app);
  doc = fDoc;
  setDoc = fSet;
  getDoc = fGet;
}

async function saveDb() {
  try {
    if (!firestoreDb) await initFirebase();
    const docRef = doc(firestoreDb, "appData", "main_record");
    await setDoc(docRef, db);
  } catch (e) {
    console.error("Firebase Save Failed", e);
    showToast("Cloud save failed. Check internet or security rules.");
  }
}

async function loadDb() {
  try {
    if (!firestoreDb) await initFirebase();
    const docRef = doc(firestoreDb, "appData", "main_record");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return docSnap.data();
    return null;
  } catch (e) {
    console.error("Firebase Load Failed", e);
    return null;
  }
}

// --- DATA & STATE ---
const defaultData = {
  settings: {
    appName: 'EVENTO', appLogo: '', themeColor: '#2563eb', navColor: '#ffffff',
    bgTheme: 'aurora',
    splashBg: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=1200',
    globalBg: '', cardAnim: 'card-float', pageAnim: 'page-fade', showFab: 'yes',
    heroBg: 'https://images.unsplash.com/photo-1519167758481-dc8997217398?auto=format&fit=crop&q=80&w=1200',
    heroVideo: ''
  },
  contact: {
    globalWa: '919876543210',
    waMatter: 'Hello! I am interested in your luxury event services.',
    waBookingIntro: 'Greetings, I wish to initiate a booking via EVENTO',
    address: '123 Elegance Avenue, Premium City, PC 12345',
    phone: '+1 (555) 123-4567', email: 'hello@evento.com',
    igUrl: 'https://instagram.com/eventoservices', fbUrl: 'https://facebook.com/eventoservices',
    mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3024.1234567890!2d-74.0060!3d40.7128!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDQyJzQ2LjAiTiA3NMK0MDAn',
    aboutText: 'Welcome to EVENTO, your premier luxury event services provider. With over a decade of experience, we specialize in creating unforgettable moments for our discerning clientele.'
  },
  categories: ['Weddings','Corporate Events','Celebrations','Conferences','Catering','Decoration','Photography & Videography','Makeup & Styling','Venue Booking','DJ & Music','Lighting & Sound','Event Planning / Management'],
  services: [], reviews: [
    { id: 1, name: 'Sarah Johnson', text: 'Absolutely stunning event! Every detail was perfect.', rating: 5 },
    { id: 2, name: 'Michael Chen', text: 'Professional team, beautiful execution. Highly recommended!', rating: 5 },
    { id: 3, name: 'Emma Williams', text: 'Exceeded all our expectations. Will definitely book again!', rating: 5 }
  ],
  bookings: [], messages: []
};

let db = JSON.parse(JSON.stringify(defaultData));
let isAdminActive = false;
let editingServiceId = null;
let editingReviewId = null;
let currentActiveCategory = 'All';
let currentSliderImages = [];
let currentSliderIndex = 0;
let currentViewedService = null;

// --- INITIALIZATION ---
window.addEventListener('load', async () => {
  const savedDb = await loadDb();
  if (savedDb) {
    db = savedDb;
    if (!db.categories) db.categories = [];
    if (!db.services) db.services = [];
    if (!db.reviews) db.reviews = [];
    if (!db.bookings) db.bookings = [];
    if (!db.messages) db.messages = [];
    if (!db.settings) db.settings = {};
    if (!db.contact) db.contact = {};
    const mergedCats = new Set([...db.categories, ...defaultData.categories]);
    db.categories = Array.from(mergedCats);
  }
  applySettings();
  renderHomePage();
  initLongPressAdmin();
  setupForms();
  setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    if (splash) { splash.style.opacity = '0'; splash.style.pointerEvents = 'none'; }
  }, 2500);
});

function initLongPressAdmin() {
  const homeLink = document.getElementById('nav-home-link');
  if (!homeLink) return;
  let pressTimer;
  const startPress = () => { pressTimer = setTimeout(() => { navigate('admin-login'); showToast('🔐 Hidden Admin Entry Activated'); }, 800); };
  const endPress = () => clearTimeout(pressTimer);
  homeLink.addEventListener('mousedown', startPress);
  homeLink.addEventListener('mouseup', endPress);
  homeLink.addEventListener('mouseleave', endPress);
  homeLink.addEventListener('touchstart', startPress, { passive: true });
  homeLink.addEventListener('touchend', endPress, { passive: true });
  homeLink.addEventListener('touchcancel', endPress, { passive: true });
}

// --- APPLY SETTINGS ---
function applySettings() {
  const isDark = currentTheme === 'dark';
  document.body.className = '';
  if (isDark) document.body.classList.add('dark-mode');
  document.body.classList.add(db.settings.cardAnim || 'card-float');
  document.body.classList.add(db.settings.pageAnim || 'page-fade');
  document.body.classList.add('theme-' + (db.settings.bgTheme || 'default'));

  const root = document.documentElement;
  const pc = db.settings.themeColor || '#2563eb';
  root.style.setProperty('--primary', pc);
  root.style.setProperty('--primary-light', adjustBrightness(pc, 20));
  root.style.setProperty('--primary-lighter', adjustBrightness(pc, 40));
  root.style.setProperty('--primary-lightest', adjustBrightness(pc, 80));
  root.style.setProperty('--primary-dark', adjustBrightness(pc, -30));

  const navColor = db.settings.navColor || '#ffffff';
  if (isDark && (!db.settings.navColor || db.settings.navColor.toLowerCase() === '#ffffff')) {
    document.body.style.setProperty('--nav-bg', 'rgba(15, 23, 42, 0.9)');
  } else {
    let r = parseInt(navColor.slice(1, 3), 16) || 255;
    let g = parseInt(navColor.slice(3, 5), 16) || 255;
    let b = parseInt(navColor.slice(5, 7), 16) || 255;
    document.body.style.setProperty('--nav-bg', `rgba(${r}, ${g}, ${b}, 0.9)`);
  }

  const dynamicBg = document.getElementById('dynamic-bg');
  if (db.settings.globalBg && db.settings.bgTheme === 'custom') {
    dynamicBg.style.backgroundImage = `url('${db.settings.globalBg}')`;
    dynamicBg.style.opacity = '1';
  } else { dynamicBg.style.backgroundImage = 'none'; dynamicBg.style.opacity = '0'; }

  const heroBanner = document.getElementById('hero-banner');
  if (db.settings.heroBg) heroBanner.style.backgroundImage = `url('${db.settings.heroBg}')`;

  const splashScreen = document.getElementById('splash-screen');
  if (db.settings.splashBg) splashScreen.style.backgroundImage = `url('${db.settings.splashBg}')`;

  const logo = document.getElementById('nav-top-left-logo');
  if (db.settings.appLogo) { logo.src = db.settings.appLogo; logo.classList.remove('hidden'); }
  else { logo.classList.add('hidden'); }

  document.querySelectorAll('.dynamic-app-name').forEach(el => el.textContent = db.settings.appName || 'EVENTO');
  document.getElementById('splash-title').textContent = db.settings.appName || 'EVENTO';

  const fabWa = document.getElementById('fab-wa');
  fabWa.classList.toggle('hidden', db.settings.showFab !== 'yes');

  const heroVideo = document.getElementById('hero-video-player');
  const heroVideoContainer = document.getElementById('hero-video-container');
  if (db.settings.heroVideo) { heroVideo.src = db.settings.heroVideo; heroVideoContainer.classList.remove('hidden'); }
  else { heroVideoContainer.classList.add('hidden'); }

  document.getElementById('theme-toggle-btn').textContent = isDark ? '☀️' : '🌙';
}

function adjustBrightness(hex, percent) {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt, G = (num >> 8 & 0x00FF) + amt, B = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

// --- NAVIGATION ---
function navigate(sectionId) {
  document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
  const section = document.getElementById(sectionId);
  if (section) {
    section.classList.remove('hidden');
    if (sectionId === 'home') renderHomePage();
    else if (sectionId === 'services') renderServicesPage('All');
    else if (sectionId === 'dashboard') renderDashboard();
    else if (sectionId === 'about') renderAboutPage();
    else if (sectionId === 'contact') renderContactPage();
    else if (sectionId === 'admin-panel') initAdminPanel();
  }
  window.scrollTo(0, 0);
}

// --- RENDERING ---
function createServiceCard(service, onclick) {
  const firstTierPrice = Object.values(service.tiers).find(t => t.price)?.price || 'Contact';
  const firstImage = Object.values(service.tiers).find(t => t.images?.length)?.images[0] || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22280%22%3E%3Crect fill=%22%23e2e8f0%22 width=%22300%22 height=%22280%22/%3E%3C/svg%3E';
  return `<div class="card" onclick="${onclick}"><img src="${firstImage}" alt="${service.name}" style="cursor:pointer;"><div class="card-body"><span class="card-category">${service.category}</span><h3 class="card-title">${service.name}</h3><p style="flex-grow:1;color:var(--text-muted);font-size:0.95rem;">${service.desc}</p><div class="card-price">From ${firstTierPrice}</div></div></div>`;
}

function renderCategories(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = ['All', ...db.categories].map(cat =>
    `<div class="category-pill ${cat === currentActiveCategory ? 'active' : ''}" onclick="renderServicesPage('${cat.replace(/'/g, "\\'")}')">${cat}</div>`
  ).join('');
}

function renderHomePage() {
  renderCategories('home-categories');
  const featured = document.getElementById('featured-services');
  if (featured) featured.innerHTML = db.services.slice(0, 6).map(s => createServiceCard(s, `openService(${s.id})`)).join('');
  renderReviews();
}

function renderReviews() {
  const container = document.getElementById('home-reviews');
  if (!container) return;
  container.innerHTML = db.reviews.map(r =>
    `<div class="review-card"><div class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div><p class="review-text">"${r.text}"</p><p class="review-author">— ${r.name}</p></div>`
  ).join('');
}

function renderAboutPage() {
  // FIX: use textContent for non-input elements
  safeSetText('about-text', db.contact.aboutText);
  safeSetText('about-address', db.contact.address);
  const phoneLink = document.getElementById('about-phone');
  if (phoneLink) { phoneLink.href = `tel:${db.contact.phone}`; phoneLink.textContent = db.contact.phone; }
  const emailLink = document.getElementById('about-email');
  if (emailLink) { emailLink.href = `mailto:${db.contact.email}`; emailLink.textContent = db.contact.email; }
  const igLink = document.getElementById('about-ig');
  if (igLink) igLink.href = db.contact.igUrl || '#';
  const fbLink = document.getElementById('about-fb');
  if (fbLink) fbLink.href = db.contact.fbUrl || '#';
  if (db.contact.mapUrl) {
    const mapContainer = document.getElementById('map-container');
    let mapUrl = db.contact.mapUrl;
    mapContainer.innerHTML = `<iframe src="${mapUrl}" style="border:0;width:100%;height:100%;" allowfullscreen="" loading="lazy"></iframe>`;
    mapContainer.classList.remove('hidden');
  }
}

function renderContactPage() {
  safeSetText('contact-address', db.contact.address);
  const phoneLink = document.getElementById('contact-phone');
  if (phoneLink) { phoneLink.href = `tel:${db.contact.phone}`; phoneLink.textContent = db.contact.phone; }
  const emailLink = document.getElementById('contact-email-link');
  if (emailLink) { emailLink.href = `mailto:${db.contact.email}`; emailLink.textContent = db.contact.email; }
}

function renderServicesPage(filterCat) {
  currentActiveCategory = filterCat;
  renderCategories('service-page-categories');
  const searchInput = document.getElementById('service-search-input');
  const searchTerm = (searchInput ? searchInput.value : '').toLowerCase();
  const list = document.getElementById('all-services-list');
  if (!list) return;
  let filtered = db.services;
  if (searchTerm) {
    filtered = filtered.filter(s => s.name.toLowerCase().includes(searchTerm) || s.desc.toLowerCase().includes(searchTerm) || s.category.toLowerCase().includes(searchTerm));
  } else if (filterCat !== 'All') {
    filtered = filtered.filter(s => s.category === filterCat);
  }
  list.innerHTML = filtered.length === 0
    ? '<p style="color:var(--text-muted);text-align:center;grid-column:1/-1;padding:40px;">No collections match your search.</p>'
    : filtered.map(s => createServiceCard(s, `openService(${s.id})`)).join('');
}

function openService(id) {
  currentViewedService = db.services.find(s => s.id === id);
  if (!currentViewedService) return;
  safeSetText('detail-category', currentViewedService.category);
  safeSetText('detail-title', currentViewedService.name);
  safeSetText('detail-desc', currentViewedService.desc);
  safeSetVal('book-service-id', currentViewedService.id);
  const tierContainer = document.getElementById('detail-tier-buttons');
  if (tierContainer) {
    tierContainer.innerHTML = '';
    const order = ['basic', 'standard', 'premium', 'luxury'];
    const displayNames = { basic: 'Classic', standard: 'Signature', premium: 'Premium', luxury: 'Bespoke' };
    let firstValidTier = null;
    order.forEach(tierName => {
      const tData = currentViewedService.tiers[tierName];
      if (tData && tData.price) {
        if (!firstValidTier) firstValidTier = tierName;
        const btn = document.createElement('div');
        btn.className = 'tier-btn'; btn.id = `btn-tier-${tierName}`; btn.textContent = displayNames[tierName];
        btn.onclick = () => selectTier(tierName);
        tierContainer.appendChild(btn);
      }
    });
    if (firstValidTier) selectTier(firstValidTier);
  }
  navigate('service-details');
}

function selectTier(tierName) {
  document.querySelectorAll('.tier-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`btn-tier-${tierName}`);
  if (activeBtn) activeBtn.classList.add('active');
  const tData = currentViewedService.tiers[tierName];
  safeSetText('detail-price', tData.price);
  const displayNames = { basic: 'Classic', standard: 'Signature', premium: 'Premium', luxury: 'Bespoke' };
  safeSetVal('book-selected-tier', displayNames[tierName]);
  currentSliderImages = tData.images || [];
  currentSliderIndex = 0;
  updateSliderDisplay();
}

function updateSliderDisplay() {
  const mainImg = document.getElementById('detail-img');
  const gallery = document.getElementById('detail-gallery');
  if (!mainImg || !gallery) return;
  if (!currentSliderImages || currentSliderImages.length === 0) { mainImg.src = ''; gallery.innerHTML = ''; return; }
  mainImg.src = currentSliderImages[currentSliderIndex];
  gallery.innerHTML = currentSliderImages.length > 1
    ? currentSliderImages.map((url, idx) => `<img src="${url}" class="gallery-thumb ${idx === currentSliderIndex ? 'active' : ''}" onclick="goToSlide(${idx})">`).join('')
    : '';
}

function changeSlide(direction) {
  if (!currentSliderImages || currentSliderImages.length <= 1) return;
  currentSliderIndex += direction;
  if (currentSliderIndex < 0) currentSliderIndex = currentSliderImages.length - 1;
  if (currentSliderIndex >= currentSliderImages.length) currentSliderIndex = 0;
  updateSliderDisplay();
}

function goToSlide(idx) { currentSliderIndex = idx; updateSliderDisplay(); }

function renderDashboard() {
  const tbody = document.querySelector('#user-bookings-table tbody');
  if (!tbody) return;
  if (db.bookings.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="color:var(--text-muted);padding:30px;">No reservations found.</td></tr>'; return;
  }
  tbody.innerHTML = db.bookings.map(b =>
    `<tr><td style="font-size:0.9rem;">${b.timestamp}</td><td style="font-weight:500;">${b.serviceName}</td><td style="color:var(--primary);font-weight:600;">${b.tier}</td><td>${b.eventDate}</td><td><span style="background:rgba(37,99,235,0.15);color:var(--primary);padding:6px 14px;border-radius:6px;font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;display:inline-block;border:1px solid rgba(37,99,235,0.3);">Pending</span></td></tr>`
  ).join('');
}

// --- FORM SUBMISSIONS ---
function setupForms() {
  // Frontend review form
  document.getElementById('frontend-review-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    db.reviews.unshift({ id: Date.now(), name: safeGetVal('fr-rev-name'), text: safeGetVal('fr-rev-text'), rating: parseInt(safeGetVal('fr-rev-rating', '5')) });
    await saveDb(); showToast('Thank you for sharing your experience!'); e.target.reset();
    document.getElementById('review-modal').classList.add('hidden');
    if (!document.getElementById('home')?.classList.contains('hidden')) renderReviews();
  });

  // Booking form
  document.getElementById('booking-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const srv = db.services.find(s => s.id === parseInt(safeGetVal('book-service-id')));
    if (!srv) return;
    const activeWaNumber = srv.wa || db.contact.globalWa;
    if (!activeWaNumber) { showToast("Error: Communications channel unconfigured."); return; }
    const booking = {
      id: Date.now(), serviceName: srv.name, tier: safeGetVal('book-selected-tier'), srvWa: activeWaNumber,
      name: safeGetVal('book-name'), phone: safeGetVal('book-phone'), eventDate: safeGetVal('book-date'),
      location: safeGetVal('book-location'), msg: safeGetVal('book-message'), timestamp: new Date().toLocaleDateString()
    };
    db.bookings.push(booking); await saveDb(); showToast('Reservation Request Logged!'); e.target.reset();
    const divider = '━━━━━━━━━━━━━━━━━━━━━━';
    const bookingRef = `EVT-${Date.now().toString().slice(-6)}`;
    let introText = db.contact.waBookingIntro || 'Greetings, I wish to initiate a booking via EVENTO';
    let rawMsg = `${introText}\n\n${divider}\n📋 *BOOKING REQUEST*\n${divider}\n\n🔖 *Ref:* #${bookingRef}\n📦 *Service:* ${booking.serviceName}\n🏆 *Portfolio:* ${booking.tier}\n\n${divider}\n👤 *CLIENT*\n${divider}\n\n🙋 *Name:* ${booking.name}\n📞 *Phone:* ${booking.phone}\n📅 *Date:* ${booking.eventDate}\n📍 *Venue:* ${booking.location}`;
    if (booking.msg) rawMsg += `\n💬 *Notes:*\n${booking.msg}`;
    rawMsg += `\n\n${divider}\n_Via ${db.settings.appName || 'EVENTO'}_\n${divider}`;
    window.open(`https://wa.me/${booking.srvWa}?text=${encodeURIComponent(rawMsg)}`, '_blank');
    navigate('dashboard');
  });

  // Contact form
  document.getElementById('contact-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    db.messages.push({ id: Date.now(), name: safeGetVal('contact-name'), email: safeGetVal('contact-email'), text: safeGetVal('contact-message'), date: new Date().toLocaleDateString() });
    await saveDb(); showToast('Message Sent Successfully!'); e.target.reset();
  });

  // Login form
  document.getElementById('login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (safeGetVal('admin-pin') === 'admin123') { isAdminActive = true; safeSetVal('admin-pin', ''); navigate('admin-panel'); showToast('Authentication Successful'); }
    else { showToast('Authentication Failed'); }
  });

  // Admin settings form - FIX: includes all missing fields
  document.getElementById('form-settings')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    db.settings.appName = safeGetVal('set-app-name');
    db.settings.themeColor = safeGetVal('set-theme-color');
    db.settings.navColor = safeGetVal('set-nav-color');
    db.settings.bgTheme = safeGetVal('set-bg-theme');
    db.settings.cardAnim = safeGetVal('set-card-anim');
    db.settings.pageAnim = safeGetVal('set-page-anim');
    db.settings.showFab = safeGetVal('set-show-fab');

    const processImgData = (fileId, textId, dbKey) => new Promise((resolve) => {
      const fileInput = document.getElementById(fileId);
      if (fileInput && fileInput.files.length > 0) {
        const reader = new FileReader();
        reader.onload = (ev) => { db.settings[dbKey] = ev.target.result; resolve(); };
        reader.readAsDataURL(fileInput.files[0]);
      } else { const tv = safeGetVal(textId); if (tv !== undefined) db.settings[dbKey] = tv; resolve(); }
    });

    await processImgData('set-logo-bg-file', 'set-logo-bg', 'appLogo');
    await processImgData('set-global-bg-file', 'set-global-bg', 'globalBg');
    await processImgData('set-splash-bg-file', 'set-splash-bg', 'splashBg');
    await processImgData('set-hero-bg-file', 'set-hero-bg', 'heroBg');
    await processImgData('set-hero-video-file', 'set-hero-video', 'heroVideo');
    await saveDb(); applySettings(); showToast('Settings Saved!');
  });

  // Contact settings form
  document.getElementById('form-contact-settings')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    db.contact.globalWa = safeGetVal('set-global-wa'); db.contact.waMatter = safeGetVal('set-wa-matter');
    db.contact.waBookingIntro = safeGetVal('set-wa-booking-intro'); db.contact.address = safeGetVal('set-address');
    db.contact.phone = safeGetVal('set-phone'); db.contact.email = safeGetVal('set-email');
    db.contact.igUrl = safeGetVal('set-ig-url'); db.contact.fbUrl = safeGetVal('set-fb-url');
    db.contact.mapUrl = safeGetVal('set-map-url'); db.contact.aboutText = safeGetVal('set-about-text');
    await saveDb(); showToast('Contact Info Saved!');
  });

  // Admin service form - FIX: handles both add and edit
  document.getElementById('form-add-service')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const catSelect = document.getElementById('add-srv-cat');
    if (!catSelect?.value) { showToast('Please select a category'); return; }
    const processImages = async (fileInputId, textareaId) => {
      const images = [];
      const fileInput = document.getElementById(fileInputId);
      if (fileInput?.files.length > 0) {
        for (let file of fileInput.files) {
          await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => { images.push(ev.target.result); resolve(); };
            reader.readAsDataURL(file);
          });
        }
      }
      const urls = document.getElementById(textareaId).value.split('\n').filter(u => u.trim());
      return [...images, ...urls];
    };
    const tiers = {
      basic: { price: safeGetVal('tier-basic-price'), images: await processImages('file-basic-img', 'txt-basic-img') },
      standard: { price: safeGetVal('tier-standard-price'), images: await processImages('file-standard-img', 'txt-standard-img') },
      premium: { price: safeGetVal('tier-premium-price'), images: await processImages('file-premium-img', 'txt-premium-img') },
      luxury: { price: safeGetVal('tier-luxury-price'), images: await processImages('file-luxury-img', 'txt-luxury-img') }
    };
    // FIX: merge old images when editing (file inputs empty = keep old images)
    if (editingServiceId) {
      const oldService = db.services.find(s => s.id === editingServiceId);
      if (oldService) {
        for (const tier of ['basic', 'standard', 'premium', 'luxury']) {
          if (tiers[tier].images.length === 0 && oldService.tiers[tier]?.images?.length > 0) {
            tiers[tier].images = oldService.tiers[tier].images;
          }
        }
      }
      const idx = db.services.findIndex(s => s.id === editingServiceId);
      if (idx !== -1) {
        db.services[idx] = { id: editingServiceId, name: safeGetVal('add-srv-name'), category: catSelect.value, desc: safeGetVal('add-srv-desc'), wa: safeGetVal('add-srv-wa'), tiers };
      }
      editingServiceId = null;
      showToast('Service Updated!');
    } else {
      db.services.push({ id: Date.now(), name: safeGetVal('add-srv-name'), category: catSelect.value, desc: safeGetVal('add-srv-desc'), wa: safeGetVal('add-srv-wa'), tiers });
      showToast('Service Added!');
    }
    await saveDb(); e.target.reset(); cancelEdit(); renderAdminServices();
  });

  // Admin review form - FIX: handles both add and edit
  document.getElementById('form-add-review')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rev = { id: editingReviewId || Date.now(), name: safeGetVal('add-rev-name'), text: safeGetVal('add-rev-text'), rating: parseInt(safeGetVal('add-rev-rating', '5')) };
    if (editingReviewId) {
      const idx = db.reviews.findIndex(r => r.id === editingReviewId);
      if (idx !== -1) db.reviews[idx] = rev;
      editingReviewId = null; showToast('Review Updated!');
    } else { db.reviews.push(rev); showToast('Review Added!'); }
    await saveDb(); e.target.reset(); cancelReviewEdit(); renderAdminReviews();
  });
}

// --- ADMIN FUNCTIONS ---
function logoutAdmin() { isAdminActive = false; cancelEdit(); document.getElementById('nav-admin-link')?.classList.add('hidden'); navigate('home'); showToast('Session Terminated'); }

function verifyAdminPin() {
  const pin = prompt("🔐 Enter Executive PIN:");
  if (pin === 'admin123') return true;
  if (pin !== null) alert("Incorrect PIN.");
  return false;
}

function exportDb() {
  if (!verifyAdminPin()) return;
  const blob = new Blob([JSON.stringify(db, null, 2)], { type: "application/json" });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = "evento_backup_" + new Date().toISOString().slice(0, 10) + ".json";
  a.click(); URL.revokeObjectURL(a.href);
}

function importDb(event) {
  if (!verifyAdminPin()) return;
  const file = event.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    try { db = JSON.parse(e.target.result); await saveDb(); showToast('Database Restored!'); applySettings(); navigate('home'); }
    catch (err) { showToast('Error: Invalid backup file.'); }
  };
  reader.readAsText(file);
}

function wipeDb() {
  if (!verifyAdminPin()) return;
  if (confirm('⚠️ This will permanently delete ALL data. Sure?')) {
    db = JSON.parse(JSON.stringify(defaultData)); saveDb(); showToast('Database Wiped!'); navigate('home');
  }
}

function editService(id) {
  const service = db.services.find(s => s.id === id);
  if (!service) return;
  editingServiceId = id;
  safeSetVal('add-srv-name', service.name);
  const catSelect = document.getElementById('add-srv-cat');
  if (catSelect) catSelect.value = service.category;
  safeSetVal('add-srv-desc', service.desc);
  safeSetVal('add-srv-wa', service.wa);
  safeSetVal('tier-basic-price', service.tiers.basic?.price || '');
  safeSetVal('tier-standard-price', service.tiers.standard?.price || '');
  safeSetVal('tier-premium-price', service.tiers.premium?.price || '');
  safeSetVal('tier-luxury-price', service.tiers.luxury?.price || '');
  document.getElementById('btn-cancel-edit')?.classList.remove('hidden');
  safeSetText('form-service-title', '📦 Edit Service');
  safeSetText('btn-submit-service', 'Update Service');
  document.getElementById('service-form-section')?.scrollIntoView({ behavior: 'smooth' });
}

function cancelEdit() {
  editingServiceId = null;
  document.getElementById('form-add-service')?.reset();
  document.getElementById('btn-cancel-edit')?.classList.add('hidden');
  safeSetText('form-service-title', '📦 Curate New Service');
  safeSetText('btn-submit-service', 'Add to Collection');
}

function deleteService(id) {
  if (confirm('Delete this service?')) { db.services = db.services.filter(s => s.id !== id); saveDb(); showToast('Service Deleted!'); renderAdminServices(); }
}

function editReview(id) {
  const review = db.reviews.find(r => r.id === id);
  if (!review) return;
  editingReviewId = id;
  safeSetVal('add-rev-name', review.name); safeSetVal('add-rev-text', review.text); safeSetVal('add-rev-rating', review.rating);
  document.getElementById('btn-cancel-review-edit')?.classList.remove('hidden');
  safeSetText('form-review-title', '⭐ Edit Review');
  safeSetText('btn-submit-review', 'Update Review');
}

function cancelReviewEdit() {
  editingReviewId = null;
  document.getElementById('form-add-review')?.reset();
  document.getElementById('btn-cancel-review-edit')?.classList.add('hidden');
  safeSetText('form-review-title', '⭐ Manage Reviews');
  safeSetText('btn-submit-review', 'Add Review');
}

function deleteReview(id) { db.reviews = db.reviews.filter(r => r.id !== id); saveDb(); showToast('Review Deleted!'); renderAdminReviews(); }

function renderAdminServices() {
  const tbody = document.querySelector('#admin-services-table tbody');
  if (!tbody) return;
  tbody.innerHTML = db.services.map(s => {
    const firstImg = Object.values(s.tiers).find(t => t.images?.length)?.images[0] || '';
    const firstPrice = Object.values(s.tiers).find(t => t.price)?.price || 'N/A';
    return `<tr><td style="padding-left:30px;"><img src="${firstImg}" style="width:50px;height:50px;border-radius:6px;object-fit:cover;"></td><td>${s.name}</td><td>${s.category}</td><td>${firstPrice}</td><td style="padding-right:30px;"><button class="outline" onclick="editService(${s.id})" style="padding:6px 12px;font-size:0.75rem;">Edit</button> <button class="danger" onclick="deleteService(${s.id})" style="padding:6px 12px;font-size:0.75rem;">Delete</button></td></tr>`;
  }).join('');
}

function renderAdminReviews() {
  const tbody = document.querySelector('#admin-reviews-table tbody');
  if (!tbody) return;
  tbody.innerHTML = db.reviews.map(r =>
    `<tr><td style="padding-left:20px;">${r.name}</td><td>${r.text.substring(0, 50)}...</td><td>${'★'.repeat(r.rating)}</td><td style="padding-right:20px;"><button class="outline" onclick="editReview(${r.id})" style="padding:6px 12px;font-size:0.75rem;">Edit</button> <button class="danger" onclick="deleteReview(${r.id})" style="padding:6px 12px;font-size:0.75rem;">Del</button></td></tr>`
  ).join('');
}

function renderAdminBookings() {
  const tbody = document.querySelector('#admin-bookings-table tbody');
  if (!tbody) return;
  tbody.innerHTML = db.bookings.map(b =>
    `<tr><td style="padding-left:30px;">${b.name}</td><td>${b.serviceName}</td><td>${b.eventDate}</td><td style="padding-right:30px;"><button class="outline" onclick="sendWhatsApp('${b.srvWa}')" style="padding:6px 12px;font-size:0.75rem;">Contact</button></td></tr>`
  ).join('');
}

function renderAdminMessages() {
  const tbody = document.querySelector('#admin-messages-table tbody');
  if (!tbody) return;
  tbody.innerHTML = db.messages.map(m =>
    `<tr><td style="padding-left:30px;">${m.name}</td><td style="padding-right:30px;">${m.text.substring(0, 50)}...</td></tr>`
  ).join('');
}

function sendWhatsApp(number) { window.open(`https://wa.me/${number}`, '_blank'); }

function initAdminPanel() {
  if (!isAdminActive) return;
  document.getElementById('nav-admin-link')?.classList.remove('hidden');
  const catSelect = document.getElementById('add-srv-cat');
  if (catSelect) catSelect.innerHTML = db.categories.map(c => `<option value="${c}">${c}</option>`).join('');
  // FIX: Render category list with delete buttons
  const catListEl = document.getElementById('category-list');
  if (catListEl) catListEl.innerHTML = db.categories.map(c => `<span style="display:inline-flex;align-items:center;gap:6px;background:var(--input-bg);padding:6px 14px;border-radius:6px;font-size:0.85rem;border:1px solid var(--border);">${c} <span onclick="deleteCategory('${c.replace(/'/g, "\\'")}')" style="cursor:pointer;color:#ef4444;font-weight:bold;">✕</span></span>`).join(' ');

  safeSetVal('set-app-name', db.settings.appName);
  safeSetVal('set-theme-color', db.settings.themeColor || '#2563eb');
  safeSetVal('set-nav-color', db.settings.navColor || '#ffffff');
  safeSetVal('set-bg-theme', db.settings.bgTheme || 'default');
  safeSetVal('set-card-anim', db.settings.cardAnim);
  safeSetVal('set-page-anim', db.settings.pageAnim);
  safeSetVal('set-show-fab', db.settings.showFab);
  safeSetVal('set-logo-bg', db.settings.appLogo);
  safeSetVal('set-global-bg', db.settings.globalBg);
  safeSetVal('set-splash-bg', db.settings.splashBg);
  safeSetVal('set-hero-bg', db.settings.heroBg);
  safeSetVal('set-hero-video', db.settings.heroVideo);
  safeSetVal('set-global-wa', db.contact.globalWa);
  safeSetVal('set-wa-matter', db.contact.waMatter);
  safeSetVal('set-wa-booking-intro', db.contact.waBookingIntro);
  safeSetVal('set-address', db.contact.address);
  safeSetVal('set-phone', db.contact.phone);
  safeSetVal('set-email', db.contact.email);
  safeSetVal('set-ig-url', db.contact.igUrl);
  safeSetVal('set-fb-url', db.contact.fbUrl);
  safeSetVal('set-map-url', db.contact.mapUrl);
  safeSetVal('set-about-text', db.contact.aboutText);
  renderAdminServices(); renderAdminReviews(); renderAdminBookings(); renderAdminMessages();
}

function addNewCategory() {
  const name = document.getElementById("new-cat-name")?.value.trim();
  if (!name) return;
  if (db.categories.includes(name)) { showToast("Category already exists"); return; }
  db.categories.push(name); saveDb(); initAdminPanel(); document.getElementById("new-cat-name").value = ""; showToast("Category Added!");
}

function deleteCategory(catName) {
  if (db.categories.length <= 1) { showToast("At least one category must remain"); return; }
  if (!confirm(`Delete category "${catName}"?`)) return;
  db.categories = db.categories.filter(c => c !== catName); saveDb(); initAdminPanel(); showToast("Category Deleted");
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message; toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function openWaDefault() {
  const msg = db.contact.waMatter || 'Hello! I am interested in your services.';
  window.open(`https://wa.me/${db.contact.globalWa}?text=${encodeURIComponent(msg)}`, '_blank');
}
