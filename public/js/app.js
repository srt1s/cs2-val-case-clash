// Main Front-End Application Logic for CASE CLASH
const socket = io();

// State
let currentUser = null;
let currentHwid = null;
let activeGame = 'cs2'; // 'cs2' or 'val'
let allCases = (window.INITIAL_CASES && Array.isArray(window.INITIAL_CASES)) ? window.INITIAL_CASES : [];
let selectedCase = null;
let activeLuckEvent = null;
let marketListings = [];
let onlinePlayers = [];
let lastOpenedItem = null;
let currentModalItem = null;
let selectedInventoryIds = new Set();
let isSpinning = false;

// DOM Elements
const userBalanceText = document.getElementById('userBalanceText');
const userNameText = document.getElementById('userNameText');
const hwidPill = document.getElementById('hwidPill');
const invCountBadge = document.getElementById('invCountBadge');
const luckEventBanner = document.getElementById('luckEventBanner');
const luckEventTitle = document.getElementById('luckEventTitle');
const luckEventDesc = document.getElementById('luckEventDesc');
const luckEventCountdown = document.getElementById('luckEventCountdown');

// View Containers
const viewCases = document.getElementById('viewCases');
const viewOpener = document.getElementById('viewOpener');
const viewInventory = document.getElementById('viewInventory');
const viewMarket = document.getElementById('viewMarket');
const viewTrading = document.getElementById('viewTrading');
const viewUpgrader = document.getElementById('viewUpgrader');

// Modals
const loginModal = document.getElementById('loginModal');
const multiTabLockoutModal = document.getElementById('multiTabLockoutModal');
const winningRevealModal = document.getElementById('winningRevealModal');
const marketListModal = document.getElementById('marketListModal');
const bulkListModal = document.getElementById('bulkListModal');
const tradeModal = document.getElementById('tradeModal');
const incomingTradeModal = document.getElementById('incomingTradeModal');
const rareDropBanner = document.getElementById('rareDropBanner');

let currentKeyPriceTL = 70;

function updateKeyPriceDisplay() {
  const rateText = document.getElementById('exchangeRateText');
  if (rateText) rateText.textContent = `1 Anahtar = ${currentKeyPriceTL} TL`;
  const labelPrice = document.getElementById('keyPriceInLabel');
  if (labelPrice) labelPrice.textContent = currentKeyPriceTL;
  const convertInput = document.getElementById('convertCaseInput');
  const convertRequiredTL = document.getElementById('convertRequiredTL');
  const count = parseInt(convertInput ? convertInput.value : 1, 10) || 1;
  if (convertRequiredTL) convertRequiredTL.textContent = (count * currentKeyPriceTL).toLocaleString();
}

// Helper to display error inside login modal
function showLoginError(msg) {
  const errBox = document.getElementById('loginErrorMessage');
  if (errBox) {
    errBox.textContent = msg;
    errBox.style.display = 'block';
  }
  showInAppToast(msg, false);
}

// Global login handler function directly callable from HTML or JS
window.handleLoginSubmit = function() {
  const userInput = document.getElementById('loginUsernameInput');
  const passInput = document.getElementById('loginPasswordInput');
  const username = userInput ? userInput.value.trim() : '';
  const password = passInput ? passInput.value.trim() : '';

  if (!username) {
    showLoginError('Lütfen bir kullanıcı adı girin.');
    if (userInput) userInput.focus();
    return;
  }
  if (!password) {
    showLoginError('Lütfen hesap şifrenizi girin.');
    if (passInput) passInput.focus();
    return;
  }
  attemptLogin(username, password);
};

// Initialize App
function initApp() {
  // Render cases immediately on startup
  renderCases();

  // 1. Attach Event Listeners IMMEDIATELY
  setupEventListeners();
  initUpgraderEvents();

  // 2. Calculate HWID in background
  window.getHardwareFingerprint().then(hwid => {
    currentHwid = hwid;
    if (hwidPill) hwidPill.textContent = hwid.substring(0, 10) + '...';
  }).catch(() => {
    currentHwid = 'HWID_' + Math.random().toString(16).substring(2, 10).toUpperCase();
    if (hwidPill) hwidPill.textContent = currentHwid.substring(0, 10) + '...';
  });

  // 3. Fetch Cases in background
  fetch('/api/cases').then(res => res.json()).then(data => {
    allCases = data;
    renderCases();
  }).catch(err => {
    console.error('Failed to load cases:', err);
  });

  // 4. Auto-Login if saved username & password exist in localStorage
  try {
    const savedUsername = localStorage.getItem('case_clash_username');
    const savedPassword = localStorage.getItem('case_clash_password');
    const modal = document.getElementById('loginModal');
    const input = document.getElementById('loginUsernameInput');
    const passInput = document.getElementById('loginPasswordInput');

    if (savedUsername && savedUsername.trim()) {
      if (input) input.value = savedUsername.trim();
    }
    if (savedPassword && savedPassword.trim()) {
      if (passInput) passInput.value = savedPassword.trim();
    }

    if (savedUsername && savedUsername.trim() && savedPassword && savedPassword.trim()) {
      if (modal) modal.style.display = 'none';
      attemptLogin(savedUsername.trim(), savedPassword.trim());
    } else {
      if (modal) modal.style.display = 'flex';
      if (input && !savedUsername) {
        setTimeout(() => input.focus(), 150);
      } else if (passInput) {
        setTimeout(() => passInput.focus(), 150);
      }
    }
  } catch(e) {
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'flex';
  }

  // 5. Start live market countdowns
  setInterval(renderMarketTimers, 1000);
}

// Ensure initApp runs whether DOM is already loaded or loading
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Setup UI interactions
function setupEventListeners() {
  // Navigation Tabs
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      switchView(btn.getAttribute('data-view'));
    });
  });

  // Game Category Switcher
  const tabCS2 = document.getElementById('tabCS2');
  const tabVAL = document.getElementById('tabVAL');

  tabCS2.addEventListener('click', () => {
    activeGame = 'cs2';
    tabCS2.classList.add('active-cs2');
    tabVAL.classList.remove('active-val');
    renderCases();
  });

  tabVAL.addEventListener('click', () => {
    activeGame = 'val';
    tabVAL.classList.add('active-val');
    tabCS2.classList.remove('active-cs2');
    renderCases();
  });

  // Back to cases from opener
  document.getElementById('btnBackToCases').addEventListener('click', () => {
    if (isSpinning) return;
    switchView('cases');
  });

  // Back to home / cases from inventory
  const btnInvBackToHome = document.getElementById('btnInvBackToHome');
  if (btnInvBackToHome) {
    btnInvBackToHome.addEventListener('click', () => {
      switchView('cases');
    });
  }

  // Click on Brand Logo returns to home / cases
  const brandEl = document.querySelector('.brand');
  if (brandEl) {
    brandEl.style.cursor = 'pointer';
    brandEl.addEventListener('click', () => {
      if (isSpinning) return;
      switchView('cases');
    });
  }

  // Open Case Button
  document.getElementById('btnOpenCurrentCase').addEventListener('click', () => {
    if (!selectedCase || isSpinning) return;
    const cost = selectedCase.cost || 1;
    if (!currentUser || currentUser.balance < cost) {
      alert(`Yetersiz anahtar! Bu kasa için ${cost} anahtar gerekiyor.`);
      return;
    }
    isSpinning = true;
    document.getElementById('btnOpenCurrentCase').disabled = true;
    socket.emit('case:open', { caseId: selectedCase.id });
  });

  // Winning Modal Actions
  document.getElementById('btnRevealKeep').addEventListener('click', () => {
    winningRevealModal.style.display = 'none';
    currentModalItem = null;
  });

  document.getElementById('btnRevealInstantSell').addEventListener('click', (e) => {
    const itemToSell = currentModalItem || lastOpenedItem;
    if (itemToSell && itemToSell.instanceId) {
      const btn = e.currentTarget;
      btn.disabled = true;
      socket.emit('inventory:sell_instant', { instanceId: itemToSell.instanceId, isQuickSell: true });
      winningRevealModal.style.display = 'none';
      currentModalItem = null;
      setTimeout(() => { btn.disabled = false; }, 600);
    }
  });

  // Bulk Toolbar Actions
  const chkSelectAll = document.getElementById('chkSelectAllItems');
  if (chkSelectAll) {
    chkSelectAll.addEventListener('change', () => {
      if (!currentUser || !currentUser.inventory) return;
      if (chkSelectAll.checked) {
        currentUser.inventory.forEach(i => selectedInventoryIds.add(i.instanceId));
      } else {
        selectedInventoryIds.clear();
      }
      renderInventory();
    });
  }

  // Bulk Instant Sell (Sells from inventory at 100% full base price)
  const btnBulkSell = document.getElementById('btnBulkSellInstant');
  if (btnBulkSell) {
    btnBulkSell.addEventListener('click', () => {
      if (!currentUser || !currentUser.inventory || currentUser.inventory.length === 0) return;
      
      const isSelectedOnly = selectedInventoryIds.size > 0;
      const targetItems = isSelectedOnly
        ? currentUser.inventory.filter(i => selectedInventoryIds.has(i.instanceId))
        : currentUser.inventory;

      if (targetItems.length === 0) return;

      const totalTL = targetItems.reduce((acc, cur) => acc + Math.max(1, Math.round(Number(cur.basePrice || cur.price || 1))), 0);
      const confirmMsg = isSelectedOnly
        ? `Seçili ${targetItems.length} adet eşyayı taban fiyatından (toplam ₺${totalTL.toLocaleString()} TL) satmak istiyor musunuz?`
        : `Envanterinizdeki TÜM (${targetItems.length} adet) eşyayı taban fiyatından (toplam ₺${totalTL.toLocaleString()} TL) satmak istiyor musunuz?`;

      if (confirm(confirmMsg)) {
        btnBulkSell.disabled = true;
        btnBulkSell.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Satılıyor...';
        socket.emit('inventory:sell_bulk_instant', {
          instanceIds: targetItems.map(i => i.instanceId)
        });
      }
    });
  }

  // Bulk List on Market Modal triggers
  const btnBulkMarket = document.getElementById('btnBulkListMarket');
  const btnCancelBulkList = document.getElementById('btnCancelBulkList');
  const btnConfirmBulkList = document.getElementById('btnConfirmBulkList');

  if (btnBulkMarket && bulkListModal) {
    btnBulkMarket.addEventListener('click', () => {
      if (!currentUser || !currentUser.inventory || currentUser.inventory.length === 0) return;

      const isSelectedOnly = selectedInventoryIds.size > 0;
      const targetItems = isSelectedOnly
        ? currentUser.inventory.filter(i => selectedInventoryIds.has(i.instanceId))
        : currentUser.inventory;

      if (targetItems.length === 0) return;

      const totalBase = targetItems.reduce((acc, cur) => acc + cur.basePrice, 0);
      document.getElementById('bulkModalCount').textContent = `${targetItems.length} Adet`;
      document.getElementById('bulkModalTotalBase').textContent = `₺${totalBase.toLocaleString()}`;
      document.getElementById('bulkModalDesc').textContent = isSelectedOnly
        ? `Seçili ${targetItems.length} eşyayı oyuncu pazarına koymak üzeresiniz.`
        : `Tüm envanterinizdeki ${targetItems.length} eşyayı oyuncu pazarına koymak üzeresiniz.`;

      bulkListModal.style.display = 'flex';
    });
  }

  if (btnCancelBulkList && bulkListModal) {
    btnCancelBulkList.addEventListener('click', () => {
      bulkListModal.style.display = 'none';
    });
  }

  if (btnConfirmBulkList && bulkListModal) {
    btnConfirmBulkList.addEventListener('click', () => {
      if (!currentUser || !currentUser.inventory || currentUser.inventory.length === 0) return;

      const isSelectedOnly = selectedInventoryIds.size > 0;
      const targetItems = isSelectedOnly
        ? currentUser.inventory.filter(i => selectedInventoryIds.has(i.instanceId))
        : currentUser.inventory;

      if (targetItems.length === 0) return;

      const multiplier = parseFloat(document.getElementById('bulkPriceOption').value) || 1.0;
      const payload = targetItems.map(i => ({
        instanceId: i.instanceId,
        price: Math.max(1, Math.round(i.basePrice * multiplier))
      }));

      btnConfirmBulkList.disabled = true;
      btnConfirmBulkList.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Yayınlanıyor...';

      socket.emit('market:list_bulk', { items: payload });
      bulkListModal.style.display = 'none';
      btnConfirmBulkList.disabled = false;
      btnConfirmBulkList.innerHTML = '<i class="fa-solid fa-store"></i> Pazara Çıkar';
    });
  }

  // Login Input & Submit
  const loginInput = document.getElementById('loginUsernameInput');
  const passInput = document.getElementById('loginPasswordInput');

  if (loginInput) {
    loginInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (passInput && !passInput.value.trim()) {
          passInput.focus();
        } else {
          window.handleLoginSubmit();
        }
      }
    });
  }

  if (passInput) {
    passInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        window.handleLoginSubmit();
      }
    });
  }

  const btnTogglePass = document.getElementById('btnToggleLoginPass');
  if (btnTogglePass && passInput) {
    btnTogglePass.addEventListener('click', () => {
      const isPass = passInput.type === 'password';
      passInput.type = isPass ? 'text' : 'password';
      const icon = document.getElementById('togglePassIcon');
      if (icon) {
        icon.className = isPass ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
      }
    });
  }

  document.getElementById('btnLoginSubmit').addEventListener('click', () => {
    window.handleLoginSubmit();
  });

  // Sound Toggle
  document.getElementById('btnSoundToggle').addEventListener('click', () => {
    const isMuted = window.soundEngine.toggleMute();
    const icon = document.querySelector('#btnSoundToggle i');
    if (isMuted) {
      icon.className = 'fa-solid fa-volume-xmark';
      icon.style.color = '#ef4444';
    } else {
      icon.className = 'fa-solid fa-volume-high';
      icon.style.color = '';
    }
  });

  // Chat Drawer Toggle
  const chatDrawer = document.getElementById('chatDrawer');
  document.getElementById('btnChatToggle').addEventListener('click', () => {
    chatDrawer.classList.toggle('minimized');
  });
  document.getElementById('btnCloseChat').addEventListener('click', () => {
    chatDrawer.classList.add('minimized');
  });

  // Logout / Switch User
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      if (confirm('Mevcut hesaptan çıkış yapmak istiyor musunuz?')) {
        try {
          localStorage.removeItem('case_clash_username');
          localStorage.removeItem('case_clash_password');
        } catch(e) {}
        currentUser = null;
        userNameText.textContent = 'Giriş Yapılmadı';
        updateBalanceUI(0, 0);
        renderInventory();
        const modal = document.getElementById('loginModal');
        if (modal) {
          modal.style.display = 'flex';
          const input = document.getElementById('loginUsernameInput');
          const pass = document.getElementById('loginPasswordInput');
          if (input) input.value = '';
          if (pass) pass.value = '';
          const errBox = document.getElementById('loginErrorMessage');
          if (errBox) errBox.style.display = 'none';
          if (input) input.focus();
        }
      }
    });
  }

  // Click on user tag in header to open login modal if not logged in
  const userTagBox = document.getElementById('userTagBox');
  if (userTagBox) {
    userTagBox.addEventListener('click', () => {
      if (!currentUser) {
        const modal = document.getElementById('loginModal');
        if (modal) {
          modal.style.display = 'flex';
          const input = document.getElementById('loginUsernameInput');
          if (input) input.focus();
        }
      }
    });
  }

  // Chat Send
  document.getElementById('chatForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (text) {
      socket.emit('chat:send_message', { text });
      input.value = '';
    }
  });

  // Market Modal Actions
  document.getElementById('btnCancelMarketList').addEventListener('click', () => {
    marketListModal.style.display = 'none';
  });

  // Wallet Modal Actions
  const walletModal = document.getElementById('walletModal');
  const btnOpenWallet = document.getElementById('btnOpenWalletModal');
  const btnCloseWallet = document.getElementById('btnCloseWalletModal');
  const convertInput = document.getElementById('convertCaseInput');
  const convertRequiredTL = document.getElementById('convertRequiredTL');
  const btnConvert = document.getElementById('btnConvertTLToCase');

  if (btnOpenWallet && walletModal) {
    btnOpenWallet.addEventListener('click', () => {
      updateBalanceUI();
      walletModal.style.display = 'flex';
    });
  }

  if (btnCloseWallet && walletModal) {
    btnCloseWallet.addEventListener('click', () => {
      walletModal.style.display = 'none';
    });
  }

  if (convertInput && convertRequiredTL) {
    convertInput.addEventListener('input', () => {
      const count = parseInt(convertInput.value, 10) || 0;
      convertRequiredTL.textContent = (count * currentKeyPriceTL).toLocaleString();
    });
  }

  // Admin Panel Setup (Password: topraK)
  let isAdminAuthenticated = false;
  let adminPasswordCached = '';

  const adminModal = document.getElementById('adminModal');
  const btnAdminToggle = document.getElementById('btnAdminToggle');
  const btnCloseAdmin = document.getElementById('btnCloseAdminModal');
  const adminLoginForm = document.getElementById('adminLoginForm');
  const adminControlsArea = document.getElementById('adminControlsArea');
  const adminPasswordInput = document.getElementById('adminPasswordInput');
  const btnAdminLoginSubmit = document.getElementById('btnAdminLoginSubmit');
  const btnAdminLogout = document.getElementById('btnAdminLogout');
  const adminTargetUserInput = document.getElementById('adminTargetUserInput');
  const adminAddTLInput = document.getElementById('adminAddTLInput');
  const adminAddCaseInput = document.getElementById('adminAddCaseInput');
  const btnAdminGrantBalance = document.getElementById('btnAdminGrantBalance');

  function updateAdminView() {
    if (isAdminAuthenticated) {
      if (adminLoginForm) adminLoginForm.style.display = 'none';
      if (adminControlsArea) adminControlsArea.style.display = 'block';
    } else {
      if (adminLoginForm) adminLoginForm.style.display = 'block';
      if (adminControlsArea) adminControlsArea.style.display = 'none';
      if (adminPasswordInput) adminPasswordInput.value = '';
    }
  }

  if (btnAdminToggle && adminModal) {
    btnAdminToggle.addEventListener('click', () => {
      updateAdminView();
      adminModal.style.display = 'flex';
      if (!isAdminAuthenticated && adminPasswordInput) {
        setTimeout(() => adminPasswordInput.focus(), 100);
      }
    });
  }

  if (btnCloseAdmin && adminModal) {
    btnCloseAdmin.addEventListener('click', () => {
      adminModal.style.display = 'none';
    });
  }

  if (btnAdminLoginSubmit && adminPasswordInput) {
    btnAdminLoginSubmit.addEventListener('click', () => {
      const pass = adminPasswordInput.value.trim();
      if (pass === 'topraK') {
        isAdminAuthenticated = true;
        adminPasswordCached = 'topraK';
        updateAdminView();
        showInAppToast('Admin girişi başarılı!', true);
      } else {
        showInAppToast('Hatalı admin şifresi!', false);
        adminPasswordInput.value = '';
      }
    });

    adminPasswordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        btnAdminLoginSubmit.click();
      }
    });
  }

  if (btnAdminLogout) {
    btnAdminLogout.addEventListener('click', () => {
      isAdminAuthenticated = false;
      adminPasswordCached = '';
      updateAdminView();
      showInAppToast('Admin oturumu kapatıldı.', true);
    });
  }

  // Admin Quick Buttons
  document.querySelectorAll('.admin-quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tl = btn.getAttribute('data-tl');
      const cs = btn.getAttribute('data-case');
      if (adminAddTLInput && tl) adminAddTLInput.value = tl;
      if (adminAddCaseInput && cs) adminAddCaseInput.value = cs;
    });
  });

  // Admin Grant Balance
  if (btnAdminGrantBalance) {
    btnAdminGrantBalance.addEventListener('click', () => {
      if (!isAdminAuthenticated || adminPasswordCached !== 'topraK') {
        showInAppToast('Lütfen önce yetkili girişi yapın!', false);
        return;
      }

      const target = adminTargetUserInput ? adminTargetUserInput.value.trim() : '';
      const tl = adminAddTLInput ? Number(adminAddTLInput.value) : 0;
      const cases = adminAddCaseInput ? Number(adminAddCaseInput.value) : 0;

      if (tl <= 0 && cases <= 0) {
        showInAppToast('Lütfen eklenecek bir miktar girin.', false);
        return;
      }

      btnAdminGrantBalance.disabled = true;
      btnAdminGrantBalance.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Yükleniyor...';

      socket.emit('admin:give_balance', {
        password: adminPasswordCached,
        targetUsername: target,
        tlAmount: tl,
        caseAmount: cases
      });

      setTimeout(() => {
        btnAdminGrantBalance.disabled = false;
        btnAdminGrantBalance.innerHTML = '<i class="fa-solid fa-gift"></i> ANAHTARLARI YÜKLE';
      }, 600);
    });
  }

  if (btnConvert && convertInput) {
    btnConvert.addEventListener('click', () => {
      const currentBalance = currentUser && currentUser.balance !== undefined ? currentUser.balance : 0;
      const spaceLeft = Math.max(0, 1000 - currentBalance);
      if (spaceLeft <= 0) {
        showInAppToast('Zaten maksimum 1.000 anahtar sınırındasınız!', false);
        return;
      }

      const count = parseInt(convertInput.value, 10);
      if (!count || count <= 0) {
        showInAppToast('Lütfen geçerli bir anahtar miktarı girin.', false);
        return;
      }

      if (count > spaceLeft) {
        showInAppToast(`Maksimum 1.000 anahtar sınırını aşamazsınız! En fazla ${spaceLeft} anahtar daha alabilirsiniz.`, false);
        return;
      }

      socket.emit('wallet:convert_tl', { caseCount: count });
    });
  }

  // Single-Click Convert All TL to Case Balance (Up to 1000 Key limit)
  const btnConvertAll = document.getElementById('btnConvertAllTL');
  if (btnConvertAll) {
    btnConvertAll.addEventListener('click', () => {
      const currentBalance = currentUser && currentUser.balance !== undefined ? currentUser.balance : 0;
      const spaceLeft = Math.max(0, 1000 - currentBalance);
      if (spaceLeft <= 0) {
        showInAppToast('Zaten maksimum 1.000 anahtar sınırındasınız!', false);
        return;
      }

      const userTL = currentUser && currentUser.tlBalance !== undefined ? currentUser.tlBalance : 0;
      const maxAffordable = Math.floor(userTL / currentKeyPriceTL);
      if (maxAffordable < 1) {
        showInAppToast(`Yetersiz TL! 1 Anahtar için ₺${currentKeyPriceTL} gerekir. (Mevcut: ₺${userTL.toLocaleString()})`, false);
        return;
      }

      const maxPossibleCases = Math.min(maxAffordable, spaceLeft);
      if (convertInput && convertRequiredTL) {
        convertInput.value = maxPossibleCases;
        convertRequiredTL.textContent = (maxPossibleCases * currentKeyPriceTL).toLocaleString();
      }

      socket.emit('wallet:convert_tl', { caseCount: maxPossibleCases });
    });
  }
}

function switchView(viewName) {
  document.querySelectorAll('.nav-tab-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-view') === viewName);
  });

  viewCases.style.display = viewName === 'cases' ? 'block' : 'none';
  viewOpener.style.display = viewName === 'opener' ? 'block' : 'none';
  viewInventory.style.display = viewName === 'inventory' ? 'block' : 'none';
  viewMarket.style.display = viewName === 'market' ? 'block' : 'none';
  viewTrading.style.display = viewName === 'trading' ? 'block' : 'none';
  if (viewUpgrader) viewUpgrader.style.display = viewName === 'upgrader' ? 'block' : 'none';

  if (viewName === 'inventory') renderInventory();
  if (viewName === 'market') renderMarket();
  if (viewName === 'trading') renderOnlinePlayers();
  if (viewName === 'upgrader') renderUpgrader();
}

function showInAppToast(text, isSuccess = true) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: ${isSuccess ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #b91c1c)'};
    color: white;
    padding: 12px 24px;
    border-radius: 12px;
    font-weight: 700;
    font-size: 1rem;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    z-index: 999999;
    text-align: center;
  `;
  toast.innerHTML = text;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.4s ease';
    setTimeout(() => toast.remove(), 400);
  }, 4500);
}

// Local Signed Snapshot Helpers (Protects balance & inventory across server reboots via HMAC)
function saveUserBackup(user) {
  // Snapshot is signed and provided by server via socket 'backup:snapshot' event to prevent client tampering.
}

function getUserBackup(username) {
  if (!username) return null;
  try {
    const raw = localStorage.getItem('case_clash_snapshot_' + username.toLowerCase());
    return raw ? JSON.parse(raw) : null;
  } catch(e) {
    return null;
  }
}

// Listen for cryptographically signed user snapshot from server
socket.on('backup:snapshot', (snapshot) => {
  try {
    if (snapshot && currentUser && currentUser.username) {
      localStorage.setItem('case_clash_snapshot_' + currentUser.username.toLowerCase(), JSON.stringify(snapshot));
    }
  } catch(e) {}
});

// Attempt login via HWID & Password
async function attemptLogin(username, password) {
  const cleanUser = String(username || '').trim();
  const cleanPass = String(password || '').trim();

  if (!cleanUser) {
    showLoginError('Lütfen bir kullanıcı adı girin.');
    return;
  }

  if (!cleanPass) {
    showLoginError('Lütfen hesap şifrenizi girin.');
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'flex';
    const passInput = document.getElementById('loginPasswordInput');
    if (passInput) passInput.focus();
    return;
  }

  // Clear previous error
  const errBox = document.getElementById('loginErrorMessage');
  if (errBox) errBox.style.display = 'none';

  const submitBtn = document.getElementById('btnLoginSubmit');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> GİRİŞ YAPILIYOR...';
  }

  if (!currentHwid) {
    try {
      currentHwid = await Promise.race([
        window.getHardwareFingerprint(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 800))
      ]);
    } catch(e) {
      currentHwid = 'HWID_' + Math.random().toString(16).substring(2, 10).toUpperCase();
    }
  }

  if (hwidPill) {
    hwidPill.textContent = currentHwid.substring(0, 10) + '...';
  }

  // Session-unique tabId
  let tabId = null;
  try {
    tabId = sessionStorage.getItem('case_clash_tab_id');
    if (!tabId) {
      tabId = 'tab_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      sessionStorage.setItem('case_clash_tab_id', tabId);
    }
  } catch(e) {
    tabId = 'tab_' + Math.random().toString(36).substring(2);
  }

  if (userNameText) {
    userNameText.textContent = cleanUser;
  }

  // Retrieve client backup if available (resilient to server restarts)
  const backupData = getUserBackup(cleanUser);

  console.log('[CLIENT] Emitting auth:login with:', { cleanUser, currentHwid, tabId, backupData });
  socket.emit('auth:login', { username: cleanUser, password: cleanPass, hwid: currentHwid, tabId, backupData });

  // If socket is still connecting, also queue for the connect event
  if (!socket.connected) {
    socket.once('connect', () => {
      console.log('[CLIENT] Socket connected, re-emitting auth:login');
      socket.emit('auth:login', { username: cleanUser, password: cleanPass, hwid: currentHwid, tabId, backupData });
    });
  }

  // Safety fallback: if no server response in 5s, unlock button
  setTimeout(() => {
    if (!currentUser) {
      const modal = document.getElementById('loginModal');
      if (modal) modal.style.display = 'flex';
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i> GİRİŞ YAP';
      }
      if (userNameText && !currentUser) {
        userNameText.textContent = 'Giriş Yap';
      }
    }
  }, 5000);
}

// ==========================================
// SOCKET.IO EVENT HANDLERS
// ==========================================

// 1. Multi-Tab Lockout: Block if duplicate tab on same HWID!
socket.on('auth:blocked_multi_tab', (data) => {
  const modal = document.getElementById('loginModal');
  if (modal) modal.style.setProperty('display', 'none', 'important');
  multiTabLockoutModal.style.display = 'flex';
  document.getElementById('multiTabLockoutMessage').innerHTML = data.message.replace(/\n/g, '<br>');
});

// 2. Auth Success & 5 Balance initial grant
socket.on('auth:success', (data) => {
  console.log('[CLIENT] Auth success received:', data);
  const modal = document.getElementById('loginModal');
  if (modal) {
    modal.style.setProperty('display', 'none', 'important');
  }
  const submitBtn = document.getElementById('btnLoginSubmit');
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i> GİRİŞ YAP';
  }
  
  currentUser = data.user;
  if (currentUser.tlBalance === undefined) currentUser.tlBalance = 0;
  if (data.keyPriceTL) {
    currentKeyPriceTL = data.keyPriceTL;
    updateKeyPriceDisplay();
  }
  updateBalanceUI(currentUser.balance, currentUser.tlBalance);
  userNameText.textContent = currentUser.username;
  marketListings = data.market || [];

  // Persist credentials on successful login
  try {
    localStorage.setItem('case_clash_username', currentUser.username);
    const passInput = document.getElementById('loginPasswordInput');
    if (passInput && passInput.value.trim()) {
      localStorage.setItem('case_clash_password', passInput.value.trim());
    }
  } catch(e) {}

  if (data.cases && Array.isArray(data.cases) && data.cases.length > 0) {
    allCases = data.cases;
  }
  renderCases();


  if (data.luckEvent) {
    updateLuckEventUI(data.luckEvent);
  }

  // Load chat history
  const chatBox = document.getElementById('chatMessagesBox');
  if (chatBox) {
    chatBox.innerHTML = '';
    if (data.chat) {
      data.chat.forEach(addChatMessage);
    }
  }

  if (data.creditRemainingSeconds !== undefined) {
    const mins = Math.floor(data.creditRemainingSeconds / 60);
    const secs = data.creditRemainingSeconds % 60;
    const timerElem = document.getElementById('creditCountdownText');
    if (timerElem) {
      timerElem.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
  }

  if (data.raffleRemainingSeconds !== undefined) {
    const rMins = Math.floor(data.raffleRemainingSeconds / 60);
    const rSecs = data.raffleRemainingSeconds % 60;
    const rTimerElem = document.getElementById('raffleCountdownText');
    if (rTimerElem) {
      rTimerElem.textContent = `${String(rMins).padStart(2, '0')}:${String(rSecs).padStart(2, '0')}`;
    }
  }

  renderInventory();
  renderMarket();
  saveUserBackup(currentUser);
  startActivityTracking(); // Begin 10-min inactivity timer
});

// 2.5. Automatic 1-Minute Key (+1 Anahtar) Reward Handlers
socket.on('credit_timer:tick', (data) => {
  const rem = data.remainingSeconds !== undefined ? data.remainingSeconds : 0;
  const mins = Math.floor(rem / 60);
  const secs = rem % 60;
  const timerElem = document.getElementById('creditCountdownText');
  if (timerElem) {
    timerElem.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
});

socket.on('credit:reward', (data) => {
  if (currentUser) {
    currentUser.balance = data.newBalance;
    updateBalanceUI(currentUser.balance, currentUser.tlBalance);
    saveUserBackup(currentUser);
    showInAppToast('+1 Anahtar eklendi! (1 dk çevrimiçi ödülü)', true);
    try { window.soundEngine.playWin(); } catch(e) {}
  }
});

// 2.6. Automatic 10-Minute 50-Key Raffle Handlers
socket.on('raffle_timer:tick', (data) => {
  const rem = data.remainingSeconds !== undefined ? data.remainingSeconds : 0;
  const mins = Math.floor(rem / 60);
  const secs = rem % 60;
  const timerElem = document.getElementById('raffleCountdownText');
  if (timerElem) {
    timerElem.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
});

socket.on('raffle:winner', (data) => {
  if (currentUser && currentUser.id === data.winnerId) {
    showInAppToast(`🎉 TEBRİKLER! 50 Anahtar Çekilişini Kazandınız! (${data.playerCount} oyuncu arasından)`, true);
    try { window.soundEngine.playRareWin(); } catch(e) {}
    try { launchConfetti(); } catch(e) {}
  } else {
    showInAppToast(`🎁 [${data.winnerUsername}] 50 Anahtar çekilişini kazandı!`, false);
  }
});

socket.on('raffle:skipped', (data) => {
  console.log('[RAFFLE]', data.message);
});

// ==========================================
// INACTIVITY AUTO-LOGOUT SYSTEM
// ==========================================
// Sends activity:ping to server every 60s on user interaction
// Server kicks after 10 min of no pings
let _activityPingInterval = null;

function startActivityTracking() {
  if (_activityPingInterval) return;
  // Send ping immediately on start, then every 60 seconds
  socket.emit('activity:ping');
  _activityPingInterval = setInterval(() => {
    if (socket.connected) socket.emit('activity:ping');
  }, 60000);
}

function resetActivityPing() {
  // Reset the server-side inactivity timer on any user interaction
  if (socket.connected) socket.emit('activity:ping');
}

// Track mouse/touch/keyboard/scroll as activity
['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'].forEach(evt => {
  document.addEventListener(evt, resetActivityPing, { passive: true });
});

// Forced logout by server (10min inactivity)
socket.on('auth:forced_logout', (data) => {
  clearInterval(_activityPingInterval);
  _activityPingInterval = null;
  currentUser = null;
  showInAppToast(`⏳ ${data.message || '10 dakika hareketsiz kaldınız, oturum kapatıldı.'}`, false);
  setTimeout(() => {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) loginModal.style.display = 'flex';
    const userTagBox = document.getElementById('userTagBox');
    if (userTagBox) {
      document.getElementById('userNameText').textContent = 'Giriş Yap';
    }
  }, 2000);
});

// Cases list push from server
socket.on('cases:list', (casesList) => {
  if (casesList && Array.isArray(casesList) && casesList.length > 0) {
    allCases = casesList;
    renderCases();
  }
});

socket.on('auth:error', (data) => {
  console.error('[CLIENT] Auth error received:', data);
  const submitBtn = document.getElementById('btnLoginSubmit');
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i> GİRİŞ YAP';
  }
  const modal = document.getElementById('loginModal');
  if (modal) {
    modal.style.display = 'flex';
  }
  showLoginError(data.message || 'Giriş hatası!');

  const passInput = document.getElementById('loginPasswordInput');
  if (passInput) {
    passInput.focus();
    passInput.style.borderColor = '#ef4444';
    setTimeout(() => {
      passInput.style.borderColor = 'var(--border-subtle)';
    }, 3000);
  }
});

// 3. Timed Luck Event Update
socket.on('luck_event:update', (data) => {
  updateLuckEventUI(data);
});

function updateLuckEventUI(event) {
  activeLuckEvent = event;
  const mins = Math.floor(event.remainingSeconds / 60);
  const secs = event.remainingSeconds % 60;
  luckEventCountdown.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  if (event.active) {
    luckEventTitle.innerHTML = '<i class="fa-solid fa-bolt" style="color:var(--accent-gold); margin-right:6px;"></i> ŞANS ETKİNLİĞİ AKTİF:';
    luckEventDesc.innerHTML = `<strong style="color:#ffca28;">[${event.caseName}]</strong> Kasasında Kırmızı & Sarı çıkarma şansı <strong>+%3 ARTTI!</strong>`;
    luckEventBanner.style.background = 'linear-gradient(90deg, rgba(222, 155, 53, 0.25), rgba(255, 70, 85, 0.3), rgba(222, 155, 53, 0.25))';
  } else {
    luckEventTitle.innerHTML = '<i class="fa-regular fa-clock" style="margin-right:6px;"></i> MOLA:';
    luckEventDesc.textContent = `Bir sonraki rastgele kasa şans etkinliği başlıyor...`;
    luckEventBanner.style.background = 'rgba(20, 27, 40, 0.8)';
  }

  renderCases();
}

// 4. Rare Drop Global Broadcast (Covert & Knife only!)
socket.on('rare_drop:broadcast', (data) => {
  const isGold = data.isGold;
  window.soundEngine.playRareFanfare(isGold);

  // Confetti celebration!
  try {
    confetti({
      particleCount: isGold ? 150 : 80,
      spread: 90,
      origin: { y: 0.15 },
      colors: isGold ? ['#ffd700', '#ffae19', '#ffffff'] : ['#eb4b4b', '#ff1744', '#ffffff']
    });
  } catch (e) {}

  rareDropBanner.className = `rare-drop-banner ${isGold ? 'gold-drop' : ''}`;
  document.getElementById('rareDropIcon').innerHTML = isGold ? '<i class="fa-solid fa-crown" style="color:#ffd700;"></i>' : '<i class="fa-solid fa-fire" style="color:#ff4655;"></i>';
  const isChampionsGold = data.isChampionsGold || (data.caseId === 'val_champions_vault' && isGold);
  document.getElementById('rareDropHeader').textContent = isChampionsGold ? '★ GİZEMLİ CHAMPIONS SKIN! ★' : (isGold ? '★ EFSANEVİ BIÇAK DÜŞÜŞÜ! ★' : 'GİZLİ (KIRMIZI) DÜŞÜŞÜ!');
  document.getElementById('rareDropText').innerHTML = `
    <strong>${escapeHtml(data.username)}</strong>, "${escapeHtml(data.caseName)}" kasasından 
    <span style="color:${isGold ? '#ffd700' : '#ff4655'};">${escapeHtml(data.item.name)}</span> çıkardı! (₺${data.item.basePrice})
  `;
  rareDropBanner.style.display = 'flex';

  setTimeout(() => {
    rareDropBanner.style.display = 'none';
  }, 7000);
});

// 5. Case Opening Result Animation
socket.on('case:result', (data) => {
  lastOpenedItem = data.item;
  currentUser.balance = data.newBalance;
  if (data.newTLBalance !== undefined) currentUser.tlBalance = data.newTLBalance;
  currentUser.inventory.push(data.item);
  updateBalanceUI(currentUser.balance, currentUser.tlBalance);
  saveUserBackup(currentUser);

  // Animate horizontal spinner
  animateSpinner(data.strip, data.winningIndex, data.item);
});

socket.on('case:error', (data) => {
  isSpinning = false;
  document.getElementById('btnOpenCurrentCase').disabled = false;
  const cost = selectedCase ? (selectedCase.cost || 1) : 1;
  const btnText = document.getElementById('openCurrentCaseBtnText');
  if (btnText) {
    btnText.textContent = `KASAYI AÇ (${cost} ANAHTAR)`;
  }
  alert(data.message || 'Kasa açılamadı.');
});

// 6. Market Events
socket.on('market:updated', (updatedMarket) => {
  marketListings = updatedMarket;
  renderMarket();
});

socket.on('market:listed_success', (data) => {
  if (data.inventory) currentUser.inventory = data.inventory;
  renderInventory();
  saveUserBackup(currentUser);
});

socket.on('market:warning_5min', (data) => {
  // Silent update - removed intrusive alert notifications
});

socket.on('market:bot_bought', (data) => {
  if (data.newTLBalance !== undefined) currentUser.tlBalance = data.newTLBalance;
  if (data.newBalance !== undefined) currentUser.balance = data.newBalance;
  updateBalanceUI(currentUser.balance, currentUser.tlBalance);
  saveUserBackup(currentUser);
  // Silent update - removed intrusive alert popup
});

socket.on('market:item_sold_to_player', (data) => {
  if (data.newTLBalance !== undefined) currentUser.tlBalance = data.newTLBalance;
  if (data.newBalance !== undefined) currentUser.balance = data.newBalance;
  updateBalanceUI(currentUser.balance, currentUser.tlBalance);
  saveUserBackup(currentUser);
  // Silent update - removed intrusive alert popup
});

socket.on('market:buy_success', (data) => {
  if (data.newTLBalance !== undefined) currentUser.tlBalance = data.newTLBalance;
  if (data.newBalance !== undefined) currentUser.balance = data.newBalance;
  currentUser.inventory = data.inventory;
  updateBalanceUI(currentUser.balance, currentUser.tlBalance);
  renderInventory();
  saveUserBackup(currentUser);
  showInAppToast(`Eşya satın alındı: ${data.item.name}`, true);
});

socket.on('market:error', (data) => {
  showInAppToast(data.message || 'Market hatası.', false);
});

socket.on('inventory:error', (data) => {
  const btnBulkSell = document.getElementById('btnBulkSellInstant');
  if (btnBulkSell) btnBulkSell.disabled = false;
  showInAppToast(data.message || 'Envanter işlem hatası!', false);
  renderInventory();
});

// 7. Instant Sell
socket.on('inventory:sold', (data) => {
  if (data.instanceId) selectedInventoryIds.delete(data.instanceId);
  if (data.newTLBalance !== undefined) currentUser.tlBalance = data.newTLBalance;
  if (data.newBalance !== undefined) currentUser.balance = data.newBalance;
  currentUser.inventory = data.inventory;
  updateBalanceUI(currentUser.balance, currentUser.tlBalance);
  renderInventory();
  saveUserBackup(currentUser);
  if (data.isQuickSell) {
    showInAppToast(`Eşya hızlı satıldı (Quick Sell -%25): +₺${Number(data.sellPrice).toLocaleString()} TL`, true);
  } else {
    showInAppToast(`Eşya satıldı (Base Fiyat): +₺${Number(data.sellPrice).toLocaleString()} TL`, true);
  }
  try { window.soundEngine.playWin(); } catch(e) {}
});

socket.on('inventory:bulk_sold', (data) => {
  const btnBulkSell = document.getElementById('btnBulkSellInstant');
  if (btnBulkSell) {
    btnBulkSell.disabled = false;
    btnBulkSell.innerHTML = '<i class="fa-solid fa-money-bill-wave"></i> <span id="btnBulkSellText">Tümünü Sat</span>';
  }
  selectedInventoryIds.clear();
  if (data.newTLBalance !== undefined) currentUser.tlBalance = data.newTLBalance;
  if (data.newBalance !== undefined) currentUser.balance = data.newBalance;
  currentUser.inventory = data.inventory;
  updateBalanceUI(currentUser.balance, currentUser.tlBalance);
  renderInventory();
  saveUserBackup(currentUser);
  showInAppToast(`${data.soldCount} adet eşya taban fiyatından satıldı: +₺${Number(data.totalSellPrice).toLocaleString()} TL`, true);
  try { window.soundEngine.playWin(); } catch(e) {}
});

socket.on('market:bulk_listed_success', (data) => {
  selectedInventoryIds.clear();
  currentUser.inventory = data.inventory;
  updateBalanceUI(currentUser.balance, currentUser.tlBalance);
  renderInventory();
  saveUserBackup(currentUser);
});

// 8. Wallet Events (TL -> Kasa Bakiye Çevirme)
socket.on('wallet:converted', (data) => {
  currentUser.balance = data.newBalance;
  currentUser.tlBalance = data.newTL;
  updateBalanceUI(currentUser.balance, currentUser.tlBalance);
  saveUserBackup(currentUser);
  showInAppToast(`₺${data.costTL} TL karşılığında ${data.convertedCases} Anahtar alındı.`, true);
  try { window.soundEngine.playWin(); } catch(e) {}
});

socket.on('wallet:error', (data) => {
  showInAppToast(data.message || 'Cüzdan işlem hatası!', false);
});

// Admin Events
socket.on('admin:success', (data) => {
  showInAppToast(data.message, true);
  try { window.soundEngine.playWin(); } catch(e) {}
});

socket.on('admin:error', (data) => {
  showInAppToast(data.message || 'Admin işlem hatası!', false);
});

socket.on('balance:update', (data) => {
  if (currentUser) {
    if (data.balance !== undefined) currentUser.balance = data.balance;
    if (data.tlBalance !== undefined) currentUser.tlBalance = data.tlBalance;
    updateBalanceUI(currentUser.balance, currentUser.tlBalance);
    saveUserBackup(currentUser);
    showInAppToast('Bakiyeniz güncellendi!', true);
    try { window.soundEngine.playWin(); } catch(e) {}
  }
});

// 8. Online Players & Trading
socket.on('players:online', (players) => {
  onlinePlayers = players.filter(p => p.id !== (currentUser ? currentUser.id : ''));
  renderOnlinePlayers();
});

// Trading: Received target player's live inventory for trade modal
socket.on('trade:target_inventory', (data) => {
  const targetOfferList = document.getElementById('tradeTargetOfferList');
  const targetCounter = document.getElementById('targetOfferSelectedCount');
  if (!targetOfferList) return;

  targetOfferList.innerHTML = '';
  
  if (!data.inventory || data.inventory.length === 0) {
    targetOfferList.innerHTML = '<div style="color:var(--text-muted); font-size:0.85rem; padding: 20px 0; text-align: center;">Bu oyuncunun envanterinde takas edilecek eşya bulunmuyor.</div>';
    if (targetCounter) targetCounter.textContent = '0 seçildi';
    return;
  }

  data.inventory.forEach(item => {
    const row = document.createElement('label');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '8px';
    row.style.cursor = 'pointer';
    row.style.background = 'rgba(255,255,255,0.03)';
    row.style.padding = '6px 8px';
    row.style.borderRadius = '6px';
    row.style.border = '1px solid rgba(255,255,255,0.06)';
    row.innerHTML = `
      <input type="checkbox" class="target-trade-checkbox" value="${item.instanceId}">
      <img src="${item.image}" style="width:28px; height:20px; object-fit:contain;">
      <div style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:0.85rem;">
        <span style="font-weight:600;">${escapeHtml(item.name)}</span>
        <span style="color:#facc15; font-size:0.75rem; margin-left:4px;">(₺${item.basePrice})</span>
      </div>
    `;
    targetOfferList.appendChild(row);
  });

  targetOfferList.querySelectorAll('.target-trade-checkbox').forEach(cb => {
    cb.addEventListener('change', () => {
      const count = targetOfferList.querySelectorAll('.target-trade-checkbox:checked').length;
      if (targetCounter) targetCounter.textContent = `${count} seçildi`;
    });
  });
});

socket.on('trade:offer_sent', (data) => {
  showInAppToast(data.message || 'Takas teklifiniz oyuncuya iletildi!', true);
  try { window.soundEngine.playWin(); } catch(e) {}
});

socket.on('trade:incoming_offer', (data) => {
  window.soundEngine.playNotification();
  const offer = data.tradeOffer;
  document.getElementById('incomingTradeSender').innerHTML = `
    <strong>${escapeHtml(offer.fromUsername)}</strong> size bir takas teklifi gönderdi!
  `;

  const container = document.getElementById('incomingTradeItems');
  const offeredCount = offer.offeredItems ? offer.offeredItems.length : 0;
  const requestedCount = offer.requestedItems ? offer.requestedItems.length : 0;

  container.innerHTML = `
    <div style="background:rgba(96, 165, 250, 0.08); border:1px solid rgba(96, 165, 250, 0.25); border-radius:8px; padding:10px;">
      <div style="font-weight:700; font-size:0.85rem; color:#60a5fa; margin-bottom:6px; display:flex; justify-content:space-between;">
        <span><i class="fa-solid fa-gift"></i> Karşı Tarafın Size Teklif Ettiği (${offeredCount} Eşya):</span>
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap; max-height:100px; overflow-y:auto;">
        ${offeredCount === 0 ? '<span style="color:#94a3b8; font-size:0.8rem;">(Herhangi bir eşya teklif edilmedi)</span>' : offer.offeredItems.map(i => `
          <div style="background:#1e2638; border:1px solid #334155; padding:5px 8px; border-radius:6px; font-size:0.8rem; display:flex; align-items:center; gap:6px;">
            <img src="${i.image}" style="width:24px; height:18px; object-fit:contain;">
            <span>${escapeHtml(i.name)} <strong style="color:#38bdf8;">(₺${i.basePrice})</strong></span>
          </div>
        `).join('')}
      </div>
    </div>

    <div style="background:rgba(250, 204, 21, 0.08); border:1px solid rgba(250, 204, 21, 0.25); border-radius:8px; padding:10px;">
      <div style="font-weight:700; font-size:0.85rem; color:#facc15; margin-bottom:6px; display:flex; justify-content:space-between;">
        <span><i class="fa-solid fa-hand-holding-hand"></i> Karşı Tarafın Sizden İstediği (${requestedCount} Eşya):</span>
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap; max-height:100px; overflow-y:auto;">
        ${requestedCount === 0 ? '<span style="color:#94a3b8; font-size:0.8rem;">(Sizden herhangi bir eşya istenmedi / Hediye Teklifi)</span>' : offer.requestedItems.map(i => `
          <div style="background:#1e2638; border:1px solid #334155; padding:5px 8px; border-radius:6px; font-size:0.8rem; display:flex; align-items:center; gap:6px;">
            <img src="${i.image}" style="width:24px; height:18px; object-fit:contain;">
            <span>${escapeHtml(i.name)} <strong style="color:#facc15;">(₺${i.basePrice})</strong></span>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  document.getElementById('btnAcceptTrade').onclick = () => {
    socket.emit('trade:accept_offer', { tradeId: offer.id });
    incomingTradeModal.style.display = 'none';
  };

  document.getElementById('btnDeclineTrade').onclick = () => {
    socket.emit('trade:decline_offer', { tradeId: offer.id });
    incomingTradeModal.style.display = 'none';
  };

  incomingTradeModal.style.display = 'flex';
});

socket.on('trade:completed', (data) => {
  currentUser.inventory = data.inventory;
  renderInventory();
  saveUserBackup(currentUser);
  showInAppToast(data.message, true);
  try { window.soundEngine.playRareFanfare(true); } catch(e) {}
});

socket.on('trade:declined', (data) => {
  showInAppToast(data.message, false);
});

socket.on('trade:error', (data) => {
  showInAppToast(data.message || 'Takas hatası.', false);
});

// 9. Chat Messages
socket.on('chat:message', (msg) => {
  addChatMessage(msg);
});

function addChatMessage(msg) {
  const chatBox = document.getElementById('chatMessagesBox');
  const div = document.createElement('div');
  div.className = `chat-msg ${msg.isHighlight ? 'chat-msg-highlight' : ''}`;
  div.innerHTML = `
    <span class="chat-msg-user">${escapeHtml(msg.username)}:</span>
    <span>${escapeHtml(msg.text)}</span>
  `;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ==========================================
// RENDERERS & ANIMATIONS
// ==========================================

function updateBalanceUI(balance, tlBalance) {
  const caseBal = balance !== undefined ? balance : (currentUser ? currentUser.balance : 0);
  const tlBal = tlBalance !== undefined ? tlBalance : (currentUser && currentUser.tlBalance !== undefined ? currentUser.tlBalance : 0);

  if (userBalanceText) userBalanceText.textContent = caseBal;
  const userTlText = document.getElementById('userTlText');
  if (userTlText) userTlText.textContent = `${Number(tlBal).toLocaleString()}`;

  const modalTl = document.getElementById('modalTlBalance');
  if (modalTl) modalTl.textContent = `₺${Number(tlBal).toLocaleString()}`;
  const modalCase = document.getElementById('modalCaseBalance');
  if (modalCase) modalCase.textContent = caseBal;

  if (currentUser && currentUser.inventory) {
    invCountBadge.textContent = currentUser.inventory.length;
    invCountBadge.style.display = currentUser.inventory.length > 0 ? 'inline-block' : 'none';
  }
}

// Render Cases Grid
function renderCases() {
  const grid = document.getElementById('casesGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const list = (allCases && allCases.length > 0) ? allCases : (window.INITIAL_CASES || []);
  const filtered = list.filter(c => c.game === activeGame);

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="color:var(--text-muted); font-size:1.1rem; grid-column: 1/-1; text-align:center; padding:3rem 0;">
        <i class="fa-solid fa-box-open" style="margin-right: 8px;"></i> Kasalar yükleniyor veya bu kategoride kasa bulunamadı.
      </div>
    `;
    return;
  }

  filtered.forEach(c => {
    const isBoosted = activeLuckEvent && activeLuckEvent.active && activeLuckEvent.caseId === c.id;
    const card = document.createElement('div');
    card.className = `case-card ${isBoosted ? 'boosted-case' : ''}`;
    card.style.cursor = 'pointer';
    card.innerHTML = `
      ${isBoosted ? '<div class="boost-tag"><i class="fa-solid fa-arrow-trend-up"></i> +%3 ŞANS</div>' : ''}
      <div class="case-image-wrapper">
        <img src="${c.image}" alt="${c.name}" class="case-image">
      </div>
      <h3 class="case-title">${c.name}</h3>
      <p class="case-subtitle">${c.subtitle}</p>
      <button class="btn-open-case" data-id="${c.id}" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); display: flex; align-items: center; justify-content: center; gap: 8px;">
        <i class="fa-solid fa-magnifying-glass"></i> KASAYI İNCELE (${c.cost || 1} ANAHTAR)
      </button>
    `;

    card.addEventListener('click', () => {
      openOpenerView(c);
    });

    grid.appendChild(card);
  });
}

// Setup Opener View
function openOpenerView(caseObj) {
  selectedCase = caseObj;
  const cost = caseObj.cost || 1;
  document.getElementById('openerCaseTitle').textContent = caseObj.name;
  document.getElementById('openerCasePrice').innerHTML = `Maliyet: <strong>${cost} Anahtar</strong> | İçerik: ${caseObj.items.length} Eşya`;
  const btnText = document.getElementById('openCurrentCaseBtnText');
  if (btnText) {
    btnText.textContent = `KASAYI AÇ (${cost} ANAHTAR)`;
  }
  
  // Render contents preview
  const contentsGrid = document.getElementById('caseContentsGrid');
  contentsGrid.innerHTML = '';
  caseObj.items.forEach(entry => {
    const skin = entry.skin;
    const itemCard = document.createElement('div');
    itemCard.className = 'skin-item-card';
    const isMystery = skin.id === 'val_champions_mystery' || (caseObj.id === 'val_champions_vault' && skin.rarity === 'knife');
    const priceDisplay = isMystery ? 'Havuzdan Rastgele' : `₺${skin.basePrice}`;
    itemCard.innerHTML = `
      <img src="${skin.image}" alt="${skin.name}" class="skin-item-img">
      <div class="skin-item-name" title="${skin.name}">${skin.name}</div>
      <div class="skin-item-price">${priceDisplay}</div>
      <span class="spinner-card-bar rarity-${skin.rarity}"></span>
    `;
    contentsGrid.appendChild(itemCard);
  });

  // Pre-fill track
  buildInitialTrack(caseObj);
  switchView('opener');
}

function buildInitialTrack(caseObj) {
  const track = document.getElementById('spinnerTrack');
  track.style.transition = 'none';
  track.style.transform = 'translateX(0px)';
  track.innerHTML = '';

  for (let i = 0; i < 25; i++) {
    const skin = caseObj.items[i % caseObj.items.length].skin;
    const card = document.createElement('div');
    card.className = 'spinner-card';
    card.innerHTML = `
      <img src="${skin.image}" class="spinner-card-img" alt="${skin.name}">
      <div class="spinner-card-name">${skin.name}</div>
      <div class="spinner-card-weapon">${skin.weapon}</div>
      <div class="spinner-card-bar rarity-${skin.rarity}"></div>
    `;
    track.appendChild(card);
  }
}

// Spin Reel Animation
function animateSpinner(strip, winningIndex, winningItem) {
  const track = document.getElementById('spinnerTrack');
  track.style.transition = 'none';
  track.style.transform = 'translateX(0px)';
  track.innerHTML = '';

  // Render all strip items
  strip.forEach(skin => {
    const card = document.createElement('div');
    card.className = 'spinner-card';
    card.innerHTML = `
      <img src="${skin.image}" class="spinner-card-img" alt="${skin.name}">
      <div class="spinner-card-name">${skin.name}</div>
      <div class="spinner-card-weapon">${skin.weapon}</div>
      <div class="spinner-card-bar rarity-${skin.rarity}"></div>
    `;
    track.appendChild(card);
  });

  // Calculate destination offset
  // Measure exact rendered card width directly from DOM (strictly 170px)
  const firstCard = track.children[0];
  const cardWidth = (firstCard && firstCard.offsetWidth) ? firstCard.offsetWidth : 170;

  // Measure exact pixel center of the red indicator needle relative to the track viewport
  const needleEl = document.querySelector('.spinner-needle');
  const parentEl = track.parentElement;
  let needleCenter = parentEl.offsetWidth / 2;
  if (needleEl && parentEl) {
    const nRect = needleEl.getBoundingClientRect();
    const pRect = parentEl.getBoundingClientRect();
    needleCenter = (nRect.left + (nRect.width / 2)) - pRect.left;
  }

  // Calculate center of winning card relative to track
  const winningCardCenter = (winningIndex * cardWidth) + (cardWidth / 2);

  // Safe subtle jitter: Maximum ±10px so the needle NEVER touches or approaches the card border (85px half-width)
  const jitter = Math.floor(Math.random() * 21) - 10;
  const targetX = -(winningCardCenter - needleCenter + jitter);

  // Audio tick counter
  let lastCardIndex = 0;
  const startTime = performance.now();
  const duration = 5800; // 5.8s spin duration

  // Trigger CSS smooth transition
  setTimeout(() => {
    track.style.transition = `transform ${duration}ms cubic-bezier(0.12, 0.8, 0.28, 1)`;
    track.style.transform = `translateX(${targetX}px)`;

    // Audio tick ticker loop
    const tickInterval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      if (elapsed >= duration) {
        clearInterval(tickInterval);
        return;
      }

      // Compute estimated current translation
      const progress = elapsed / duration;
      // Approximate cubic-bezier easing
      const easeOut = 1 - Math.pow(1 - progress, 3.5);
      const currentPos = Math.abs(targetX * easeOut);
      const currentCard = Math.floor(currentPos / cardWidth);

      if (currentCard !== lastCardIndex) {
        lastCardIndex = currentCard;
        window.soundEngine.playTick();
      }
    }, 25);
  }, 50);

  // Reveal winning item at end
  setTimeout(() => {
    isSpinning = false;
    document.getElementById('btnOpenCurrentCase').disabled = false;
    const cost = selectedCase ? (selectedCase.cost || 1) : 1;
    const btnText = document.getElementById('openCurrentCaseBtnText');
    if (btnText) {
      btnText.textContent = `KASAYI AÇ (${cost} ANAHTAR)`;
    }

    // Highlight winning card on the track
    if (track.children[winningIndex]) {
      const winCardEl = track.children[winningIndex];
      winCardEl.style.boxShadow = '0 0 25px rgba(250, 204, 21, 0.8), inset 0 0 15px rgba(250, 204, 21, 0.4)';
      winCardEl.style.borderColor = '#facc15';
    }

    // Play victory sound
    const isRare = winningItem.rarity === 'knife' || winningItem.rarity === 'covert' || winningItem.rarity === 'exclusive';
    if (isRare) {
      window.soundEngine.playRareFanfare(winningItem.rarity === 'knife');
    } else {
      window.soundEngine.playWin();
    }

    // Show reveal modal
    showRevealModal(winningItem);
  }, duration + 300);
}

// Show Reveal Modal
function showRevealModal(item) {
  currentModalItem = item;
  const modal = winningRevealModal;
  const card = document.getElementById('winningCard');
  
  card.style.borderColor = getRarityColor(item.rarity);
  card.style.boxShadow = `0 0 50px ${getRarityColor(item.rarity)}66`;

  const isChampionsGold = (selectedCase && selectedCase.id === 'val_champions_vault' && item.rarity === 'knife') || item.id === 'val_champions_mystery';
  document.getElementById('winningRarityBadge').textContent = isChampionsGold ? 'GİZEMLİ CHAMPIONS' : item.rarity.toUpperCase();
  document.getElementById('winningRarityBadge').style.color = getRarityColor(item.rarity);
  document.getElementById('winningSkinName').textContent = item.name;
  document.getElementById('winningWeaponName').textContent = item.weapon;
  document.getElementById('winningSkinImg').src = item.image;
  document.getElementById('winningSkinPrice').textContent = `₺${item.basePrice}`;

  // Quick sell price = 75% (-%25 indirimli)
  const sellVal = Math.max(1, Math.round(item.basePrice * 0.75));
  document.getElementById('revealSellPrice').textContent = `₺${sellVal.toLocaleString()}`;

  modal.style.display = 'flex';
}

function getRarityColor(rarity) {
  switch (rarity) {
    case 'knife': return '#ffd700';
    case 'covert':
    case 'exclusive': return '#eb4b4b';
    case 'classified':
    case 'premium': return '#d32ce6';
    case 'restricted':
    case 'deluxe': return '#8847ff';
    default: return '#4b69ff';
  }
}

// Render Inventory
function renderInventory() {
  const grid = document.getElementById('myInventoryGrid');
  const bulkToolbar = document.getElementById('invBulkToolbar');
  grid.innerHTML = '';

  if (!currentUser || !currentUser.inventory || currentUser.inventory.length === 0) {
    if (bulkToolbar) bulkToolbar.style.display = 'none';
    selectedInventoryIds.clear();
    grid.innerHTML = `
      <div style="color:var(--text-muted); font-size:1.1rem; grid-column: 1/-1; text-align:center; padding:3rem 0; display:flex; flex-direction:column; align-items:center; gap:1.2rem;">
        <div>Envanterinizde henüz eşya yok. Kasa açarak hemen skin kazanabilirsiniz!</div>
        <button class="btn-primary" id="btnEmptyInvGoHome" style="padding:0.75rem 1.5rem; font-size:0.95rem; cursor:pointer;">
          <i class="fa-solid fa-box-open"></i> Kasalara Git (Anasayfa)
        </button>
      </div>
    `;
    const btnEmpty = document.getElementById('btnEmptyInvGoHome');
    if (btnEmpty) {
      btnEmpty.addEventListener('click', () => switchView('cases'));
    }
    document.getElementById('invTotalValue').textContent = 'Toplam Değer: ₺0';
    return;
  }

  if (bulkToolbar) bulkToolbar.style.display = 'flex';

  // Clean up selected ids that are no longer in inventory
  const currentInvIds = new Set(currentUser.inventory.map(i => i.instanceId));
  for (const id of selectedInventoryIds) {
    if (!currentInvIds.has(id)) selectedInventoryIds.delete(id);
  }

  let totalValue = 0;
  let selectedBaseSum = 0;

  currentUser.inventory.forEach(item => {
    const itemPrice = Math.max(1, Number(item.basePrice || item.price || 1));
    totalValue += itemPrice;

    if (selectedInventoryIds.has(item.instanceId)) {
      selectedBaseSum += itemPrice;
    }
  });

  // Update Toolbar Elements
  const chkSelectAll = document.getElementById('chkSelectAllItems');
  const countText = document.getElementById('selectedCountText');
  const btnBulkSellText = document.getElementById('btnBulkSellText');
  const btnBulkMarketText = document.getElementById('btnBulkMarketText');

  const selectedCount = selectedInventoryIds.size;
  const totalCount = currentUser.inventory.length;

  if (chkSelectAll) {
    chkSelectAll.checked = selectedCount > 0 && selectedCount === totalCount;
  }

  if (countText) {
    countText.textContent = selectedCount > 0 
      ? `(${selectedCount} seçildi - ₺${selectedBaseSum.toLocaleString()})`
      : `(0 seçildi)`;
  }

  if (btnBulkSellText) {
    btnBulkSellText.textContent = selectedCount > 0
      ? `Seçilenleri Sat (₺${selectedBaseSum.toLocaleString()} TL)`
      : `Tümünü Sat (₺${totalValue.toLocaleString()} TL)`;
  }

  if (btnBulkMarketText) {
    btnBulkMarketText.textContent = selectedCount > 0
      ? `Seçilenleri Pazara Koy (${selectedCount} Eşya)`
      : `Tümünü Pazara Koy (${totalCount} Eşya)`;
  }

  // Render skin cards (Envanterden satış: 100% base fiyatı)
  currentUser.inventory.forEach(item => {
    const basePrice = Math.max(1, Number(item.basePrice || item.price || 1));
    const isSelected = selectedInventoryIds.has(item.instanceId);

    const card = document.createElement('div');
    card.className = `skin-item-card ${isSelected ? 'selected-for-bulk' : ''}`;
    card.innerHTML = `
      <input type="checkbox" class="skin-select-box" data-id="${item.instanceId}" ${isSelected ? 'checked' : ''} title="Seç">
      <img src="${item.image}" alt="${item.name}" class="skin-item-img">
      <div class="skin-item-name" title="${item.name}">${item.name}</div>
      <div class="skin-item-price">₺${basePrice.toLocaleString()}</div>
      <div class="skin-item-actions">
        <button class="btn-small btn-sell-fast" data-id="${item.instanceId}">
          Sat (₺${basePrice.toLocaleString()})
        </button>
        <button class="btn-small btn-list-market" data-id="${item.instanceId}">
          Pazara Koy
        </button>
      </div>
      <span class="spinner-card-bar rarity-${item.rarity}"></span>
    `;

    // Checkbox toggle
    const chk = card.querySelector('.skin-select-box');
    chk.addEventListener('change', (e) => {
      e.stopPropagation();
      if (chk.checked) {
        selectedInventoryIds.add(item.instanceId);
      } else {
        selectedInventoryIds.delete(item.instanceId);
      }
      renderInventory();
    });

    // Sell item from inventory (Full base price)
    const sellBtn = card.querySelector('.btn-sell-fast');
    sellBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (sellBtn.disabled) return;
      sellBtn.disabled = true;
      sellBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
      socket.emit('inventory:sell_instant', { instanceId: item.instanceId, isQuickSell: false });
    });

    // List on Market
    const marketBtn = card.querySelector('.btn-list-market');
    marketBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openMarketListModal(item);
    });

    grid.appendChild(card);
  });

  document.getElementById('invTotalValue').textContent = `Toplam Değer: ₺${totalValue.toLocaleString()}`;
}

// Open Market List Modal
function openMarketListModal(item) {
  const modal = marketListModal;
  const realBasePrice = item.basePrice;
  const botBuyPrice = Math.max(1, Math.round(realBasePrice * 0.86));
  document.getElementById('marketModalImg').src = item.image;
  document.getElementById('marketModalName').textContent = item.name;
  if (document.getElementById('modalBasePrice')) {
    document.getElementById('modalBasePrice').textContent = `₺${realBasePrice} TL`;
  }
  document.getElementById('modalBotPrice').textContent = `₺${botBuyPrice} TL`;
  document.getElementById('marketPriceInput').value = item.basePrice;

  document.getElementById('btnConfirmMarketList').onclick = () => {
    const price = Number(document.getElementById('marketPriceInput').value);
    if (!price || price <= 0) {
      alert('Lütfen geçerli bir fiyat girin.');
      return;
    }
    socket.emit('market:list_item', { instanceId: item.instanceId, price });
    modal.style.display = 'none';
  };

  modal.style.display = 'flex';
}

// Render Marketplace
function renderMarket() {
  const grid = document.getElementById('marketGrid');
  grid.innerHTML = '';

  if (marketListings.length === 0) {
    grid.innerHTML = '<div style="color:var(--text-muted); font-size:1.1rem; grid-column: 1/-1; text-align:center; padding:3rem 0;">Pazarda şu anda listelenmiş eşya bulunmuyor.</div>';
    return;
  }

  const now = Date.now();

  marketListings.forEach(listing => {
    const item = listing.item;
    const timeLeft = Math.max(0, listing.expiresAt - now);
    const mins = Math.floor(timeLeft / 60000);
    const secs = Math.floor((timeLeft % 60000) / 1000);
    const is5Min = timeLeft <= 5 * 60 * 1000;

    const isMine = currentUser && currentUser.id === listing.sellerId;

    const card = document.createElement('div');
    card.className = 'skin-item-card';
    card.innerHTML = `
      <div class="market-timer-badge ${is5Min ? 'warning-5min' : ''}" data-expires="${listing.expiresAt}">
        ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}
      </div>
      <img src="${item.image}" alt="${item.name}" class="skin-item-img">
      <div class="skin-item-name" title="${item.name}">${item.name}</div>
      <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.25rem;">Satıcı: ${escapeHtml(listing.sellerName)}</div>
      <div class="skin-item-price">₺${listing.price}</div>
      <div style="width:100%;">
        ${isMine 
          ? '<button class="btn-small" style="background:#475569; width:100%;" disabled>Senin İlanın</button>'
          : `<button class="btn-small btn-list-market" data-id="${listing.id}" style="width:100%;">Satın Al (₺${listing.price})</button>`
        }
      </div>
      <span class="spinner-card-bar rarity-${item.rarity}"></span>
    `;

    if (!isMine) {
      card.querySelector('.btn-list-market').addEventListener('click', () => {
        if (!currentUser || (currentUser.tlBalance || 0) < listing.price) {
          alert('Yetersiz TL bakiyesi!');
          return;
        }
        if (confirm(`"${item.name}" eşyasını ₺${listing.price} karşılığında satın almak istiyor musunuz?`)) {
          socket.emit('market:buy_item', { listingId: listing.id });
        }
      });
    }

    grid.appendChild(card);
  });
}

function renderMarketTimers() {
  const badges = document.querySelectorAll('.market-timer-badge');
  const now = Date.now();
  badges.forEach(b => {
    const expiresAt = Number(b.getAttribute('data-expires'));
    if (!expiresAt) return;
    const timeLeft = Math.max(0, expiresAt - now);
    const mins = Math.floor(timeLeft / 60000);
    const secs = Math.floor((timeLeft % 60000) / 1000);
    const is5Min = timeLeft <= 5 * 60 * 1000;

    b.className = `market-timer-badge ${is5Min ? 'warning-5min' : ''}`;
    b.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  });
}

// Render Online Players for Trading
function renderOnlinePlayers() {
  const grid = document.getElementById('onlinePlayersGrid');
  grid.innerHTML = '';

  if (onlinePlayers.length === 0) {
    grid.innerHTML = '<div style="color:var(--text-muted); font-size:1.1rem; grid-column: 1/-1; text-align:center; padding:3rem 0;">Şu anda çevrimiçi başka oyuncu bulunmuyor.</div>';
    return;
  }

  onlinePlayers.forEach(p => {
    const card = document.createElement('div');
    card.className = 'case-card';
    card.style.alignItems = 'flex-start';
    card.style.textAlign = 'left';
    card.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:1rem;">
        <div style="width:40px; height:40px; border-radius:50%; background:#3b82f6; display:flex; align-items:center; justify-content:center; font-weight:800;">
          ${escapeHtml(p.username.substring(0, 2).toUpperCase())}
        </div>
        <div>
          <div style="font-weight:700; font-size:1.1rem;">${escapeHtml(p.username)}</div>
          <div style="font-size:0.8rem; color:#10b981;">● Çevrimiçi</div>
        </div>
      </div>
      <button class="btn-open-case" style="background:linear-gradient(135deg, #8847ff, #6366f1);" data-id="${p.id}" data-name="${p.username}">
        <i class="fa-solid fa-right-left"></i> Takas Teklifi Gönder
      </button>
    `;

    card.querySelector('button').addEventListener('click', () => {
      openTradeModal(p);
    });

    grid.appendChild(card);
  });
}

// Open Trade Modal
function openTradeModal(targetPlayer) {
  const modal = tradeModal;
  document.getElementById('tradeTargetInfo').innerHTML = `Hedef Oyuncu: <strong style="color:#60a5fa;">${escapeHtml(targetPlayer.username)}</strong>`;

  const myOfferList = document.getElementById('tradeMyOfferList');
  const targetOfferList = document.getElementById('tradeTargetOfferList');
  const myCounter = document.getElementById('myOfferSelectedCount');
  const targetCounter = document.getElementById('targetOfferSelectedCount');

  if (myCounter) myCounter.textContent = '0 seçildi';
  if (targetCounter) targetCounter.textContent = '0 seçildi';

  myOfferList.innerHTML = '';
  if (!currentUser || !currentUser.inventory || currentUser.inventory.length === 0) {
    myOfferList.innerHTML = '<div style="color:var(--text-muted); font-size:0.85rem; padding: 20px 0; text-align: center;">Envanterinizde teklif edilecek eşya yok.</div>';
  } else {
    currentUser.inventory.forEach(item => {
      const row = document.createElement('label');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.gap = '8px';
      row.style.cursor = 'pointer';
      row.style.background = 'rgba(255,255,255,0.03)';
      row.style.padding = '6px 8px';
      row.style.borderRadius = '6px';
      row.style.border = '1px solid rgba(255,255,255,0.06)';
      row.innerHTML = `
        <input type="checkbox" class="my-trade-checkbox" value="${item.instanceId}">
        <img src="${item.image}" style="width:28px; height:20px; object-fit:contain;">
        <div style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:0.85rem;">
          <span style="font-weight:600;">${escapeHtml(item.name)}</span>
          <span style="color:#38bdf8; font-size:0.75rem; margin-left:4px;">(₺${item.basePrice})</span>
        </div>
      `;
      myOfferList.appendChild(row);
    });

    myOfferList.querySelectorAll('.my-trade-checkbox').forEach(cb => {
      cb.addEventListener('change', () => {
        const count = myOfferList.querySelectorAll('.my-trade-checkbox:checked').length;
        if (myCounter) myCounter.textContent = `${count} seçildi`;
      });
    });
  }

  // Request target player's inventory live
  if (targetOfferList) {
    targetOfferList.innerHTML = '<div style="color:var(--text-muted); font-size:0.85rem; padding: 20px 0; text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Oyuncunun envanteri alınıyor...</div>';
    socket.emit('trade:get_inventory', { targetUserId: targetPlayer.id });
  }

  document.getElementById('btnCancelTrade').onclick = () => {
    modal.style.display = 'none';
  };

  document.getElementById('btnSendTradeOffer').onclick = () => {
    const selectedOffered = Array.from(myOfferList.querySelectorAll('.my-trade-checkbox:checked')).map(i => i.value);
    const selectedRequested = targetOfferList ? Array.from(targetOfferList.querySelectorAll('.target-trade-checkbox:checked')).map(i => i.value) : [];

    if (selectedOffered.length === 0 && selectedRequested.length === 0) {
      showInAppToast('Lütfen takasa eklemek veya istemek için en az bir eşya seçin.', false);
      return;
    }

    socket.emit('trade:create_offer', {
      targetUserId: targetPlayer.id,
      offeredInstanceIds: selectedOffered,
      requestedInstanceIds: selectedRequested
    });

    modal.style.display = 'none';
  };

  modal.style.display = 'flex';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==========================================
// 10. UPGRADER (SKIN YÜKSELTİCİ) CLIENT ENGINE
// ==========================================
let upgSelectedInputItem = null;
let upgSelectedTargetSkin = null;
let isUpgradingRolling = false;
let upgCurrentMultiplierFilter = 'all';
let upgCurrentNeedleRotation = 0;

function getAllAvailableTargetSkins() {
  const skinsMap = new Map();
  const casesToScan = (allCases && allCases.length > 0) ? allCases : (window.INITIAL_CASES || []);
  for (const c of casesToScan) {
    if (!c.items) continue;
    for (const it of c.items) {
      if (it.skin && it.skin.id && !skinsMap.has(it.skin.id)) {
        skinsMap.set(it.skin.id, it.skin);
      }
    }
  }
  return Array.from(skinsMap.values()).sort((a, b) => (Number(a.basePrice) || 0) - (Number(b.basePrice) || 0));
}

function renderUpgrader() {
  renderUpgraderInventory();
  renderUpgraderTargets();
  updateUpgraderWheel();
}

function renderUpgraderInventory() {
  const container = document.getElementById('upgInventoryList');
  if (!container) return;
  container.innerHTML = '';

  const inventory = (currentUser && Array.isArray(currentUser.inventory)) ? currentUser.inventory : [];
  if (inventory.length === 0) {
    container.innerHTML = '<div style="color:var(--text-muted); font-size:0.8rem; grid-column:1/-1; padding:20px 0; text-align:center;">Envanterinizde hiç eşya yok.</div>';
    return;
  }

  const sorted = [...inventory].sort((a, b) => (Number(b.officialBasePrice || b.basePrice) || 0) - (Number(a.officialBasePrice || a.basePrice) || 0));

  sorted.forEach(item => {
    const el = document.createElement('div');
    el.className = 'upg-mini-item' + (upgSelectedInputItem && upgSelectedInputItem.instanceId === item.instanceId ? ' selected' : '');
    const price = Number(item.officialBasePrice || item.basePrice || 0);
    el.innerHTML = `
      <img src="${item.image}" class="upg-mini-img" alt="${escapeHtml(item.name)}">
      <div class="upg-mini-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</div>
      <div class="upg-mini-price">₺${price.toLocaleString()}</div>
    `;
    el.addEventListener('click', () => {
      if (isUpgradingRolling) return;
      selectUpgraderInput(item);
    });
    container.appendChild(el);
  });
}

function selectUpgraderInput(item) {
  upgSelectedInputItem = item;
  const preview = document.getElementById('upgInputPreview');
  const priceBadge = document.getElementById('upgInputPriceBadge');
  const price = Number(item.officialBasePrice || item.basePrice || 0);

  if (priceBadge) priceBadge.textContent = `₺${price.toLocaleString()} TL`;

  if (preview) {
    preview.className = 'upg-selected-preview active';
    preview.innerHTML = `
      <div class="upg-preview-card">
        <img src="${item.image}" class="upg-preview-img" alt="${escapeHtml(item.name)}">
        <div class="upg-preview-meta">
          <div class="upg-preview-name">${escapeHtml(item.name)}</div>
          <div class="upg-preview-weapon">${escapeHtml(item.weapon || '')}</div>
          <div class="upg-preview-price">₺${price.toLocaleString()} TL</div>
        </div>
      </div>
    `;
  }

  renderUpgraderInventory();
  renderUpgraderTargets();
  updateUpgraderWheel();
}

function renderUpgraderTargets() {
  const container = document.getElementById('upgTargetList');
  if (!container) return;
  container.innerHTML = '';

  const searchInput = document.getElementById('upgSearchInput');
  const searchFilter = (searchInput ? searchInput.value.toLowerCase().trim() : '');

  const inputPrice = upgSelectedInputItem ? Math.max(1, Number(upgSelectedInputItem.officialBasePrice || upgSelectedInputItem.basePrice || 1)) : 0;
  const allSkins = getAllAvailableTargetSkins();

  const filtered = allSkins.filter(skin => {
    const skinPrice = Number(skin.basePrice || 0);
    if (inputPrice > 0 && skinPrice <= inputPrice) return false;

    if (searchFilter) {
      const matchName = (skin.name || '').toLowerCase().includes(searchFilter);
      const matchWeapon = (skin.weapon || '').toLowerCase().includes(searchFilter);
      if (!matchName && !matchWeapon) return false;
    }

    if (inputPrice > 0 && upgCurrentMultiplierFilter !== 'all') {
      const multThreshold = parseFloat(upgCurrentMultiplierFilter);
      const skinMult = skinPrice / inputPrice;
      if (skinMult < multThreshold) return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div style="color:var(--text-muted); font-size:0.8rem; grid-column:1/-1; padding:20px 0; text-align:center;">Uygun hedef skin bulunamadı.</div>';
    return;
  }

  filtered.forEach(skin => {
    const el = document.createElement('div');
    el.className = 'upg-mini-item' + (upgSelectedTargetSkin && upgSelectedTargetSkin.id === skin.id ? ' selected' : '');
    const price = Number(skin.basePrice || 0);
    const multStr = inputPrice > 0 ? (price / inputPrice).toFixed(1) + 'x' : '';
    el.innerHTML = `
      <img src="${skin.image}" class="upg-mini-img" alt="${escapeHtml(skin.name)}">
      <div class="upg-mini-name" title="${escapeHtml(skin.name)}">${escapeHtml(skin.name)}</div>
      <div class="upg-mini-price">₺${price.toLocaleString()}</div>
      ${multStr ? `<div style="font-size:0.65rem; color:#f59e0b; font-weight:800; margin-top:2px;">${multStr}</div>` : ''}
    `;
    el.addEventListener('click', () => {
      if (isUpgradingRolling) return;
      selectUpgraderTarget(skin);
    });
    container.appendChild(el);
  });
}

function selectUpgraderTarget(skin) {
  upgSelectedTargetSkin = skin;
  const preview = document.getElementById('upgTargetPreview');
  const priceBadge = document.getElementById('upgTargetPriceBadge');
  const price = Number(skin.basePrice || 0);

  if (priceBadge) priceBadge.textContent = `₺${price.toLocaleString()} TL`;

  if (preview) {
    preview.className = 'upg-selected-preview active';
    preview.innerHTML = `
      <div class="upg-preview-card">
        <img src="${skin.image}" class="upg-preview-img" alt="${escapeHtml(skin.name)}">
        <div class="upg-preview-meta">
          <div class="upg-preview-name">${escapeHtml(skin.name)}</div>
          <div class="upg-preview-weapon">${escapeHtml(skin.weapon || '')}</div>
          <div class="upg-preview-price">₺${price.toLocaleString()} TL</div>
        </div>
      </div>
    `;
  }

  renderUpgraderTargets();
  updateUpgraderWheel();
}

function updateUpgraderWheel() {
  const wheelWinSlice = document.getElementById('wheelWinSlice');
  const wheelChanceText = document.getElementById('wheelChanceText');
  const wheelMultiplierText = document.getElementById('wheelMultiplierText');
  const btnExecute = document.getElementById('btnExecuteUpgrade');
  const statusMsg = document.getElementById('upgStatusMsg');

  if (!upgSelectedInputItem || !upgSelectedTargetSkin) {
    if (wheelWinSlice) wheelWinSlice.style.strokeDasharray = '0 723';
    if (wheelChanceText) wheelChanceText.textContent = '0.00%';
    if (wheelMultiplierText) wheelMultiplierText.textContent = '0.00x';
    if (btnExecute) btnExecute.disabled = true;
    if (statusMsg && !isUpgradingRolling) {
      statusMsg.className = 'upg-status-text';
      if (!upgSelectedInputItem) statusMsg.textContent = 'Sol taraftan feda edilecek bir eşya seçin';
      else statusMsg.textContent = 'Sağ taraftan hedef bir skin seçin';
    }
    return;
  }

  const inputPrice = Math.max(1, Number(upgSelectedInputItem.officialBasePrice || upgSelectedInputItem.basePrice || 1));
  const targetPrice = Math.max(1, Number(upgSelectedTargetSkin.basePrice || 1));

  if (targetPrice <= inputPrice) {
    if (wheelWinSlice) wheelWinSlice.style.strokeDasharray = '0 723';
    if (wheelChanceText) wheelChanceText.textContent = '0.00%';
    if (wheelMultiplierText) wheelMultiplierText.textContent = '0.00x';
    if (btnExecute) btnExecute.disabled = true;
    if (statusMsg && !isUpgradingRolling) {
      statusMsg.className = 'upg-status-text lose';
      statusMsg.textContent = 'Hedef eşya, elinizdeki eşyadan daha pahalı olmalıdır!';
    }
    return;
  }

  const rawChance = (inputPrice / targetPrice) * 100;
  const winChance = Math.min(85, Math.max(0.5, Math.round(rawChance * 0.95 * 100) / 100));
  const multiplier = Math.round((targetPrice / inputPrice) * 100) / 100;

  const circ = 722.56;
  const winLen = (winChance / 100) * circ;

  if (wheelWinSlice) {
    wheelWinSlice.setAttribute('d', 'M 140,25 A 115,115 0 1,1 139.99,25');
    wheelWinSlice.style.strokeDasharray = `${winLen} ${circ - winLen}`;
  }

  if (wheelChanceText) wheelChanceText.textContent = winChance.toFixed(2) + '%';
  if (wheelMultiplierText) wheelMultiplierText.textContent = multiplier.toFixed(2) + 'x';

  if (statusMsg && !isUpgradingRolling) {
    statusMsg.className = 'upg-status-text';
    statusMsg.textContent = `Kazanma Şansı: %${winChance.toFixed(2)} (${multiplier.toFixed(2)}x)`;
  }

  if (btnExecute) {
    btnExecute.disabled = isUpgradingRolling;
  }
}

let upgEventsBound = false;
function initUpgraderEvents() {
  if (upgEventsBound) return;
  upgEventsBound = true;

  const btnExecute = document.getElementById('btnExecuteUpgrade');
  if (btnExecute) {
    btnExecute.addEventListener('click', () => {
      if (isUpgradingRolling) return;
      if (!upgSelectedInputItem || !upgSelectedTargetSkin) {
        showInAppToast('Lütfen önce eşyaları seçin.', false);
        return;
      }

      isUpgradingRolling = true;
      btnExecute.disabled = true;
      btnExecute.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> DÖNÜYOR...';

      const statusMsg = document.getElementById('upgStatusMsg');
      if (statusMsg) {
        statusMsg.className = 'upg-status-text';
        statusMsg.textContent = 'İbre dönüyor... Şans seninle olsun!';
      }

      const itemInstId = upgSelectedInputItem.instanceId || upgSelectedInputItem.id || ('tmp_item_' + Date.now());
      socket.emit('upgrade:roll', {
        inputInstanceId: itemInstId,
        targetSkinId: upgSelectedTargetSkin.id,
        inputItemBackup: upgSelectedInputItem
      });
    });
  }

  const searchInput = document.getElementById('upgSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderUpgraderTargets();
    });
  }

  document.querySelectorAll('.upg-mult-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.upg-mult-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      upgCurrentMultiplierFilter = btn.getAttribute('data-mult') || 'all';
      renderUpgraderTargets();
    });
  });
}

// Socket Listeners for Upgrader
socket.on('upgrade:result', (data) => {
  const needle = document.getElementById('wheelNeedle');
  const btnExecute = document.getElementById('btnExecuteUpgrade');
  const statusMsg = document.getElementById('upgStatusMsg');
  const wheelChanceText = document.getElementById('wheelChanceText');
  const wheelMultiplierText = document.getElementById('wheelMultiplierText');

  // Calculate final angle
  // Win slice is 0 to (winChance * 3.6) degrees
  const winDegrees = Math.max(0.5, Math.min(359.5, (data.winChance / 100) * 360));
  let stopAngle = 0;

  if (data.isWin) {
    // Lands strictly inside the win zone
    if (winDegrees > 6) {
      stopAngle = 2 + Math.random() * (winDegrees - 4);
    } else {
      stopAngle = winDegrees * (0.15 + Math.random() * 0.7);
    }
  } else {
    // Lands strictly inside the lose zone
    const loseSpan = 360 - winDegrees;
    if (loseSpan > 6) {
      stopAngle = winDegrees + 2 + Math.random() * (loseSpan - 4);
    } else {
      stopAngle = winDegrees + loseSpan * (0.15 + Math.random() * 0.7);
    }
  }

  // 8 full rotations (2880 deg) + angle for dramatic tension (Total ~6.5 seconds)
  const spins = 2880;
  upgCurrentNeedleRotation += spins + (360 - (upgCurrentNeedleRotation % 360)) + stopAngle;

  const spinDurationMs = 6500;
  if (needle) {
    needle.style.transition = `transform ${spinDurationMs / 1000}s cubic-bezier(0.08, 0.85, 0.15, 1)`;
    needle.style.transform = `rotate(${upgCurrentNeedleRotation}deg)`;
  }

  if (statusMsg) {
    statusMsg.className = 'upg-status-text';
    statusMsg.textContent = 'İbre dönüyor... Şans seninle olsun!';
  }

  // Dynamic sound tick generator that decelerates realistically with the wheel
  const startTime = Date.now();
  let nextTickDelay = 45; // Start fast
  function scheduleNextTick() {
    const elapsed = Date.now() - startTime;
    if (elapsed >= spinDurationMs - 150) return; // Stop near the end

    const progress = elapsed / spinDurationMs; // 0.0 to 1.0
    if (progress < 0.4) {
      nextTickDelay = 45 + progress * 50;
    } else if (progress < 0.7) {
      nextTickDelay = 70 + (progress - 0.4) * 250;
    } else if (progress < 0.9) {
      nextTickDelay = 150 + (progress - 0.7) * 900;
    } else {
      nextTickDelay = 330 + (progress - 0.9) * 2200;
    }

    try {
      const pitch = 580 - progress * 160;
      window.soundEngine.playSpinTick(pitch);
    } catch(e) {}

    setTimeout(scheduleNextTick, nextTickDelay);
  }
  scheduleNextTick();

  // Complete spin after 6.5 seconds
  setTimeout(() => {
    isUpgradingRolling = false;
    if (btnExecute) {
      btnExecute.innerHTML = '<i class="fa-solid fa-bolt-lightning"></i> YÜKSELT';
    }

    // Force synchronize inventory immediately
    if (currentUser) {
      currentUser.inventory = Array.isArray(data.newInventory) ? data.newInventory : (currentUser.inventory || []);
      saveUserBackup(currentUser);
      renderInventory(); // Real-time sync with inventory view
    }

    if (data.isWin) {
      try { window.soundEngine.playRareFanfare(true); } catch(e) {}
      try {
        if (typeof confetti === 'function') {
          confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 } });
        }
      } catch(e) {}

      // Reset target selection so it doesn't clash with newly won item
      upgSelectedTargetSkin = null;
      const targetPreview = document.getElementById('upgTargetPreview');
      if (targetPreview) {
        targetPreview.className = 'upg-selected-preview';
        targetPreview.innerHTML = `
          <div class="upg-placeholder-text">
            <i class="fa-solid fa-bullseye fa-2x" style="opacity:0.4; margin-bottom:8px;"></i>
            <div>Aşağıdan hedef skin seçin</div>
          </div>
        `;
      }
      const targetPriceBadge = document.getElementById('upgTargetPriceBadge');
      if (targetPriceBadge) targetPriceBadge.textContent = '₺0 TL';

      // Auto-select won item as new input item for chaining upgrades!
      if (data.wonItem) {
        upgSelectedInputItem = data.wonItem;
        selectUpgraderInput(data.wonItem);
      } else {
        renderUpgraderInventory();
      }

      if (statusMsg) {
        statusMsg.className = 'upg-status-text win';
        statusMsg.textContent = `🎉 TEBRİKLER! ${data.wonItem ? data.wonItem.name : 'Skin'} KAZANDINIZ!`;
      }

      if (wheelChanceText) {
        wheelChanceText.textContent = 'KAZANDIN!';
        wheelChanceText.style.color = '#10b981';
      }
      if (wheelMultiplierText) {
        const winPrice = data.wonItem ? Number(data.wonItem.basePrice).toLocaleString() : '0';
        wheelMultiplierText.textContent = `+₺${winPrice} TL (${data.multiplier || 1}x)`;
      }
    } else {
      try { window.soundEngine.playLose(); } catch(e) {}
      const lostName = (data.inputItem && data.inputItem.name) ? data.inputItem.name : 'Eşya';
      if (statusMsg) {
        statusMsg.className = 'upg-status-text lose';
        statusMsg.textContent = `💥 BAŞARISIZ! ${lostName} eşyası kaybedildi.`;
      }

      // Reset input item
      upgSelectedInputItem = null;
      const preview = document.getElementById('upgInputPreview');
      if (preview) {
        preview.className = 'upg-selected-preview';
        preview.innerHTML = `
          <div class="upg-placeholder-text">
            <i class="fa-solid fa-hand-pointer fa-2x" style="opacity:0.4; margin-bottom:8px;"></i>
            <div>Aşağıdan bir eşya seçin</div>
          </div>
        `;
      }
      const priceBadge = document.getElementById('upgInputPriceBadge');
      if (priceBadge) priceBadge.textContent = '₺0 TL';

      renderUpgraderInventory();
      renderUpgraderTargets();

      if (wheelChanceText) {
        wheelChanceText.textContent = 'KAYBETTİN!';
        wheelChanceText.style.color = '#ef4444';
      }
      if (wheelMultiplierText) {
        wheelMultiplierText.textContent = 'EŞYA YANDI';
      }
    }

    // Show big animated result modal so the outcome is unmistakable
    showUpgraderResultModal(data);

  }, spinDurationMs + 100);
});

// Show Win/Lose Result Modal
function showUpgraderResultModal(data) {
  const modal = document.getElementById('upgraderResultModal');
  const card = document.getElementById('upgraderResultCard');
  const badge = document.getElementById('upgResultStatusBadge');
  const title = document.getElementById('upgResultTitle');
  const sub = document.getElementById('upgResultSub');
  const img = document.getElementById('upgResultImg');
  const price = document.getElementById('upgResultPrice');
  const mult = document.getElementById('upgResultMultiplier');
  const btnClose = document.getElementById('btnCloseUpgraderResult');

  if (!modal || !card) return;

  const wonItem = data.wonItem || {};
  const inputItem = data.inputItem || {};
  const winChance = Number(data.winChance) || 0;
  const multiplier = Number(data.multiplier) || 1;

  if (data.isWin) {
    card.style.borderColor = '#10b981';
    card.style.boxShadow = '0 0 40px rgba(16, 185, 129, 0.55)';
    if (badge) {
      badge.textContent = '🎉 KAZANDINIZ!';
      badge.style.color = '#10b981';
    }
    if (title) title.textContent = wonItem.name || 'Yeni Eşya';
    if (sub) sub.textContent = `Yükseltme Başarılı! %${winChance.toFixed(2)} şans tutturuldu!`;
    if (img) {
      img.src = wonItem.image || '';
      img.style.filter = 'drop-shadow(0 0 16px rgba(16, 185, 129, 0.6))';
      img.style.opacity = '1';
    }
    if (price) {
      price.textContent = `₺${Number(wonItem.basePrice || 0).toLocaleString()} TL`;
      price.style.color = '#10b981';
    }
    if (mult) mult.textContent = `⚡ ${multiplier}x Değerine Katlandı!`;
  } else {
    card.style.borderColor = '#ef4444';
    card.style.boxShadow = '0 0 40px rgba(239, 68, 68, 0.55)';
    if (badge) {
      badge.textContent = '💥 KAYBETTİNİZ!';
      badge.style.color = '#ef4444';
    }
    if (title) title.textContent = 'Yükseltme Başarısız';
    const itemName = inputItem.name || 'Eşya';
    if (sub) sub.textContent = `Feda edilen "${itemName}" eşyası yandı.`;
    if (img) {
      img.src = inputItem.image || '';
      img.style.filter = 'grayscale(1) opacity(0.5)';
    }
    if (price) {
      price.textContent = '₺0 TL';
      price.style.color = '#ef4444';
    }
    if (mult) mult.textContent = `Kazanma Şansı %${winChance.toFixed(2)} idi (${multiplier}x)`;
  }

  if (btnClose) {
    btnClose.onclick = () => {
      modal.style.display = 'none';
    };
  }

  // Also close when clicking backdrop
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  };

  modal.style.zIndex = '99999';
  modal.style.display = 'flex';
}

socket.on('upgrade:error', (data) => {
  isUpgradingRolling = false;
  const btnExecute = document.getElementById('btnExecuteUpgrade');
  if (btnExecute) {
    btnExecute.disabled = false;
    btnExecute.innerHTML = '<i class="fa-solid fa-bolt-lightning"></i> YÜKSELT';
  }
  showInAppToast(data.message || 'Yükseltme hatası!', false);
  const statusMsg = document.getElementById('upgStatusMsg');
  if (statusMsg) {
    statusMsg.className = 'upg-status-text lose';
    statusMsg.textContent = data.message || 'İşlem başarısız oldu.';
  }
});

// Initialize upgrader events when page is loaded
document.addEventListener('DOMContentLoaded', () => {
  initUpgraderEvents();
});

