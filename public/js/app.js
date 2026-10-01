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

// Modals
const loginModal = document.getElementById('loginModal');
const multiTabLockoutModal = document.getElementById('multiTabLockoutModal');
const winningRevealModal = document.getElementById('winningRevealModal');
const marketListModal = document.getElementById('marketListModal');
const bulkListModal = document.getElementById('bulkListModal');
const tradeModal = document.getElementById('tradeModal');
const incomingTradeModal = document.getElementById('incomingTradeModal');
const rareDropBanner = document.getElementById('rareDropBanner');

// Global login handler function directly callable from HTML or JS
window.handleLoginSubmit = function() {
  const input = document.getElementById('loginUsernameInput');
  const username = input ? input.value.trim() : '';
  if (!username) {
    alert('Lütfen bir kullanıcı adı girin.');
    if (input) input.focus();
    return;
  }
  attemptLogin(username);
};

// Initialize App
function initApp() {
  // Render cases immediately on startup
  renderCases();

  // 1. Attach Event Listeners IMMEDIATELY
  setupEventListeners();

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

  // 4. Auto-Login if saved username exists in localStorage
  try {
    const savedUsername = localStorage.getItem('case_clash_username');
    const modal = document.getElementById('loginModal');
    if (savedUsername && savedUsername.trim()) {
      const input = document.getElementById('loginUsernameInput');
      if (input) input.value = savedUsername.trim();
      if (modal) modal.style.display = 'none';
      attemptLogin(savedUsername.trim());
    } else {
      if (modal) modal.style.display = 'flex';
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
      alert(`Yetersiz bakiye! Bu kasa için ${cost} bakiye gerekiyor.`);
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
      socket.emit('inventory:sell_instant', { instanceId: itemToSell.instanceId });
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

  // Bulk Instant Sell
  const btnBulkSell = document.getElementById('btnBulkSellInstant');
  if (btnBulkSell) {
    btnBulkSell.addEventListener('click', () => {
      if (!currentUser || !currentUser.inventory || currentUser.inventory.length === 0) return;
      
      const isSelectedOnly = selectedInventoryIds.size > 0;
      const targetItems = isSelectedOnly
        ? currentUser.inventory.filter(i => selectedInventoryIds.has(i.instanceId))
        : currentUser.inventory;

      if (targetItems.length === 0) return;

      const totalTL = targetItems.reduce((acc, cur) => acc + Math.max(1, Math.round(cur.basePrice * 0.75)), 0);
      const confirmMsg = isSelectedOnly
        ? `Seçili ${targetItems.length} adet eşyayı toplam ₺${totalTL.toLocaleString()} TL karşılığında hemen satmak istiyor musunuz?`
        : `Envanterinizdeki TÜM (${targetItems.length} adet) eşyayı toplam ₺${totalTL.toLocaleString()} TL karşılığında hemen satmak istiyor musunuz?`;

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
  if (loginInput) {
    loginInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = loginInput.value.trim();
        if (val) attemptLogin(val);
      }
    });
  }

  document.getElementById('btnLoginSubmit').addEventListener('click', () => {
    const usernameInput = document.getElementById('loginUsernameInput').value.trim();
    if (!usernameInput) {
      alert('Lütfen bir kullanıcı adı girin.');
      return;
    }
    attemptLogin(usernameInput);
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
        } catch(e) {}
        currentUser = null;
        userNameText.textContent = 'Giriş Yapılmadı';
        updateBalanceUI(0, 0);
        renderInventory();
        const modal = document.getElementById('loginModal');
        if (modal) {
          modal.style.display = 'flex';
          const input = document.getElementById('loginUsernameInput');
          if (input) {
            input.value = '';
            input.focus();
          }
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
      convertRequiredTL.textContent = count * 40;
    });
  }

  document.querySelectorAll('.quick-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cases = btn.getAttribute('data-cases');
      if (convertInput && convertRequiredTL) {
        convertInput.value = cases;
        convertRequiredTL.textContent = parseInt(cases, 10) * 40;
      }
    });
  });

  if (btnConvert && convertInput) {
    btnConvert.addEventListener('click', () => {
      const count = parseInt(convertInput.value, 10);
      if (!count || count <= 0) {
        showInAppToast('Lütfen geçerli bir bakiye miktarı girin.', false);
        return;
      }
      socket.emit('wallet:convert_tl', { caseCount: count });
    });
  }

  // Single-Click Convert All TL to Case Balance
  const btnConvertAll = document.getElementById('btnConvertAllTL');
  if (btnConvertAll) {
    btnConvertAll.addEventListener('click', () => {
      const userTL = currentUser && currentUser.tlBalance !== undefined ? currentUser.tlBalance : 0;
      const maxPossibleCases = Math.floor(userTL / 40);
      if (maxPossibleCases < 1) {
        showInAppToast(`Yetersiz TL! En az ₺40 TL gerekir. (Mevcut: ₺${userTL} TL)`, false);
        return;
      }
      if (convertInput && convertRequiredTL) {
        convertInput.value = maxPossibleCases;
        convertRequiredTL.textContent = maxPossibleCases * 40;
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

  if (viewName === 'inventory') renderInventory();
  if (viewName === 'market') renderMarket();
  if (viewName === 'trading') renderOnlinePlayers();
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

// Local Backup Storage Helpers (Protects balance & inventory across server reboots)
function saveUserBackup(user) {
  if (!user || !user.username) return;
  try {
    const data = {
      id: user.id,
      username: user.username,
      balance: user.balance,
      tlBalance: user.tlBalance !== undefined ? user.tlBalance : 0,
      inventory: Array.isArray(user.inventory) ? user.inventory : [],
      updatedAt: Date.now()
    };
    localStorage.setItem('case_clash_backup_' + user.username.toLowerCase(), JSON.stringify(data));
  } catch(e) {}
}

function getUserBackup(username) {
  if (!username) return null;
  try {
    const raw = localStorage.getItem('case_clash_backup_' + username.toLowerCase());
    return raw ? JSON.parse(raw) : null;
  } catch(e) {
    return null;
  }
}

// Attempt login via HWID
async function attemptLogin(username) {
  const cleanUser = String(username || '').trim();
  if (!cleanUser) {
    showInAppToast('Lütfen bir kullanıcı adı girin.', false);
    return;
  }

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
    localStorage.setItem('case_clash_username', cleanUser);
  } catch(e) {
    tabId = 'tab_' + Math.random().toString(36).substring(2);
  }

  if (userNameText) {
    userNameText.textContent = cleanUser;
  }

  // Retrieve client backup if available (resilient to server restarts)
  const backupData = getUserBackup(cleanUser);

  console.log('[CLIENT] Emitting auth:login with:', { cleanUser, currentHwid, tabId, backupData });
  socket.emit('auth:login', { username: cleanUser, hwid: currentHwid, tabId, backupData });

  // If socket is still connecting, also queue for the connect event
  if (!socket.connected) {
    socket.once('connect', () => {
      console.log('[CLIENT] Socket connected, re-emitting auth:login');
      socket.emit('auth:login', { username: cleanUser, hwid: currentHwid, tabId, backupData });
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
  updateBalanceUI(currentUser.balance, currentUser.tlBalance);
  userNameText.textContent = currentUser.username;
  marketListings = data.market || [];

  if (data.cases && Array.isArray(data.cases) && data.cases.length > 0) {
    allCases = data.cases;
  }
  renderCases();

  if (data.isNewHwid && data.bonusGiven) {
    showInAppToast('5 Kasa Bakiyesi hesabınıza tanımlandı.', true);
    try { window.soundEngine.playRareFanfare(true); } catch(e) {}
  }

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

  renderInventory();
  renderMarket();
  saveUserBackup(currentUser);
});

// 2.5. Automatic 2-Minute Credit Reward Handlers
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
    showInAppToast('+1 Kasa Bakiyesi eklendi. (2 dk çevrimiçi ödülü)', true);
    try { window.soundEngine.playWin(); } catch(e) {}
  }
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
  showInAppToast(data.message || 'Giriş hatası!', false);
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
  document.getElementById('rareDropHeader').textContent = isChampionsGold ? '★ GİZEMLİ LİMİTED SKİN! ★' : (isGold ? '★ EFSANEVİ BIÇAK DÜŞÜŞÜ! ★' : 'GİZLİ (KIRMIZI) DÜŞÜŞÜ!');
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
    btnText.textContent = `KASAYI AÇ (${cost} BAKİYE)`;
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
  showInAppToast('Eşyanız pazarda başarıyla listelendi.', true);
});

socket.on('market:warning_5min', (data) => {
  window.soundEngine.playNotification();
  alert(`PAZAR UYARISI:\n"${data.itemName}" eşyanızın satılması için son 5 dakika.\nSüre bitince sistem botu eşyanızı taban değeri (₺${data.officialBasePrice} TL) üzerinden %86 fiyatına (₺${data.botPrice} TL) otomatik olarak satın alacaktır.`);
});

socket.on('market:bot_bought', (data) => {
  window.soundEngine.playNotification();
  if (data.newTLBalance !== undefined) currentUser.tlBalance = data.newTLBalance;
  if (data.newBalance !== undefined) currentUser.balance = data.newBalance;
  updateBalanceUI(currentUser.balance, currentUser.tlBalance);
  saveUserBackup(currentUser);
  alert(`SİSTEM ALIMI:\n"${data.itemName}" eşyanız 30 dakika satılmadığı için bot tarafından taban değeri (₺${data.officialBasePrice} TL) üzerinden %86 fiyatına (₺${data.botPrice} TL) satın alındı ve TL bakiyenize eklendi.`);
});

socket.on('market:item_sold_to_player', (data) => {
  window.soundEngine.playNotification();
  if (data.newTLBalance !== undefined) currentUser.tlBalance = data.newTLBalance;
  if (data.newBalance !== undefined) currentUser.balance = data.newBalance;
  updateBalanceUI(currentUser.balance, currentUser.tlBalance);
  saveUserBackup(currentUser);
  alert(`EŞYANIZ SATILDI\n"${data.itemName}" eşyanızı ${data.buyerName} oyuncusu ₺${data.price} TL fiyata satın aldı.`);
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
  showInAppToast(`Eşya satıldı: +₺${data.sellPrice} TL`, true);
  try { window.soundEngine.playWin(); } catch(e) {}
});

socket.on('inventory:bulk_sold', (data) => {
  const btnBulkSell = document.getElementById('btnBulkSellInstant');
  if (btnBulkSell) {
    btnBulkSell.disabled = false;
    btnBulkSell.innerHTML = '<i class="fa-solid fa-money-bill-wave"></i> <span id="btnBulkSellText">Tümünü Hemen Sat</span>';
  }
  selectedInventoryIds.clear();
  if (data.newTLBalance !== undefined) currentUser.tlBalance = data.newTLBalance;
  if (data.newBalance !== undefined) currentUser.balance = data.newBalance;
  currentUser.inventory = data.inventory;
  updateBalanceUI(currentUser.balance, currentUser.tlBalance);
  renderInventory();
  saveUserBackup(currentUser);
  showInAppToast(`${data.soldCount} adet eşya satıldı: +₺${data.totalSellPrice.toLocaleString()} TL`, true);
  try { window.soundEngine.playWin(); } catch(e) {}
});

socket.on('market:bulk_listed_success', (data) => {
  selectedInventoryIds.clear();
  currentUser.inventory = data.inventory;
  updateBalanceUI(currentUser.balance, currentUser.tlBalance);
  renderInventory();
  saveUserBackup(currentUser);
  showInAppToast(`${data.count} adet eşya pazara başarıyla çıkarıldı!`, true);
  try { window.soundEngine.playWin(); } catch(e) {}
});

// 8. Wallet Events (TL -> Kasa Bakiye Çevirme)
socket.on('wallet:converted', (data) => {
  currentUser.balance = data.newBalance;
  currentUser.tlBalance = data.newTL;
  updateBalanceUI(currentUser.balance, currentUser.tlBalance);
  saveUserBackup(currentUser);
  showInAppToast(`₺${data.costTL} TL karşılığında ${data.convertedCases} Kasa Bakiyesi alındı.`, true);
  try { window.soundEngine.playWin(); } catch(e) {}
});

socket.on('wallet:error', (data) => {
  showInAppToast(data.message || 'Cüzdan işlem hatası!', false);
});

// 8. Online Players & Trading
socket.on('players:online', (players) => {
  onlinePlayers = players.filter(p => p.id !== (currentUser ? currentUser.id : ''));
  renderOnlinePlayers();
});

socket.on('trade:incoming_offer', (data) => {
  window.soundEngine.playNotification();
  const offer = data.tradeOffer;
  document.getElementById('incomingTradeSender').innerHTML = `<strong>${escapeHtml(offer.fromUsername)}</strong> size takas teklifinde bulundu!`;

  const container = document.getElementById('incomingTradeItems');
  container.innerHTML = `
    <div style="font-weight:700; margin-bottom:0.5rem; color:#60a5fa;">Teklif Edilen Eşyalar:</div>
    <div style="display:flex; gap:8px; flex-wrap:wrap;">
      ${offer.offeredItems.map(i => `
        <div style="background:#1e2638; border:1px solid #334155; padding:6px 10px; border-radius:8px; font-size:0.8rem;">
          ${escapeHtml(i.name)} (₺${i.basePrice})
        </div>
      `).join('')}
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
  alert(data.message);
});

socket.on('trade:declined', (data) => {
  alert(data.message);
});

socket.on('trade:error', (data) => {
  alert(data.message || 'Takas hatası.');
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
    card.innerHTML = `
      ${isBoosted ? '<div class="boost-tag"><i class="fa-solid fa-arrow-trend-up"></i> +%3 ŞANS</div>' : ''}
      <div class="case-image-wrapper">
        <img src="${c.image}" alt="${c.name}" class="case-image">
      </div>
      <h3 class="case-title">${c.name}</h3>
      <p class="case-subtitle">${c.subtitle}</p>
      <button class="btn-open-case" data-id="${c.id}">
        <i class="fa-solid fa-key"></i> KASAYI AÇ (${c.cost || 1} BAKİYE)
      </button>
    `;

    card.querySelector('.btn-open-case').addEventListener('click', () => {
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
  document.getElementById('openerCasePrice').innerHTML = `Maliyet: <strong>${cost} Bakiye</strong> | İçerik: ${caseObj.items.length} Eşya`;
  const btnText = document.getElementById('openCurrentCaseBtnText');
  if (btnText) {
    btnText.textContent = `KASAYI AÇ (${cost} BAKİYE)`;
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
  // Card width = 170px + border
  const cardWidth = 171;
  const viewportWidth = track.parentElement.offsetWidth;
  const centerTarget = viewportWidth / 2;
  
  // Random jitter inside target card
  const jitter = Math.floor(Math.random() * 80) - 40;
  const targetX = -((winningIndex * cardWidth) + (cardWidth / 2) - centerTarget + jitter);

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
      btnText.textContent = `KASAYI AÇ (${cost} BAKİYE)`;
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
  document.getElementById('winningRarityBadge').textContent = isChampionsGold ? 'GİZEMLİ LİMİTED' : item.rarity.toUpperCase();
  document.getElementById('winningRarityBadge').style.color = getRarityColor(item.rarity);
  document.getElementById('winningSkinName').textContent = item.name;
  document.getElementById('winningWeaponName').textContent = item.weapon;
  document.getElementById('winningSkinImg').src = item.image;
  document.getElementById('winningSkinPrice').textContent = `₺${item.basePrice}`;

  // Instant sell price = 75%
  const sellVal = Math.max(1, Math.round(item.basePrice * 0.75));
  document.getElementById('revealSellPrice').textContent = `₺${sellVal}`;

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
  let totalInstantAll = 0;
  let selectedBaseSum = 0;
  let selectedInstantSum = 0;

  currentUser.inventory.forEach(item => {
    totalValue += item.basePrice;
    const instantPrice = Math.max(1, Math.round(item.basePrice * 0.75));
    totalInstantAll += instantPrice;

    if (selectedInventoryIds.has(item.instanceId)) {
      selectedBaseSum += item.basePrice;
      selectedInstantSum += instantPrice;
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
      ? `Seçilenleri Hemen Sat (₺${selectedInstantSum.toLocaleString()} TL)`
      : `Tümünü Hemen Sat (₺${totalInstantAll.toLocaleString()} TL)`;
  }

  if (btnBulkMarketText) {
    btnBulkMarketText.textContent = selectedCount > 0
      ? `Seçilenleri Pazara Koy (${selectedCount} Eşya)`
      : `Tümünü Pazara Koy (${totalCount} Eşya)`;
  }

  // Render skin cards
  currentUser.inventory.forEach(item => {
    const instantSellPrice = Math.max(1, Math.round(item.basePrice * 0.75));
    const isSelected = selectedInventoryIds.has(item.instanceId);

    const card = document.createElement('div');
    card.className = `skin-item-card ${isSelected ? 'selected-for-bulk' : ''}`;
    card.innerHTML = `
      <input type="checkbox" class="skin-select-box" data-id="${item.instanceId}" ${isSelected ? 'checked' : ''} title="Seç">
      <img src="${item.image}" alt="${item.name}" class="skin-item-img">
      <div class="skin-item-name" title="${item.name}">${item.name}</div>
      <div class="skin-item-price">₺${item.basePrice}</div>
      <div class="skin-item-actions">
        <button class="btn-small btn-sell-fast" data-id="${item.instanceId}">
          Hemen Sat (₺${instantSellPrice})
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

    // Instant Sell (direct & responsive with visual feedback)
    const sellBtn = card.querySelector('.btn-sell-fast');
    sellBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (sellBtn.disabled) return;
      sellBtn.disabled = true;
      sellBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
      socket.emit('inventory:sell_instant', { instanceId: item.instanceId });
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
    showInAppToast(`🏷️ "${item.name}" pazara ₺${price} TL fiyatla ilana konuldu!`, true);
    try { window.soundEngine.playNotification(); } catch(e) {}
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
        if (!currentUser || currentUser.balance < listing.price) {
          alert('Yetersiz bakiye!');
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
  document.getElementById('tradeTargetInfo').textContent = `Hedef Oyuncu: ${targetPlayer.username}`;

  const myOfferList = document.getElementById('tradeMyOfferList');
  myOfferList.innerHTML = '';

  if (!currentUser || !currentUser.inventory || currentUser.inventory.length === 0) {
    myOfferList.innerHTML = '<div style="color:var(--text-muted); font-size:0.85rem;">Envanterinizde teklif edilecek eşya yok.</div>';
  } else {
    currentUser.inventory.forEach(item => {
      const row = document.createElement('label');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.gap = '8px';
      row.style.cursor = 'pointer';
      row.innerHTML = `
        <input type="checkbox" value="${item.instanceId}">
        <span>${escapeHtml(item.name)} (₺${item.basePrice})</span>
      `;
      myOfferList.appendChild(row);
    });
  }

  document.getElementById('btnCancelTrade').onclick = () => {
    modal.style.display = 'none';
  };

  document.getElementById('btnSendTradeOffer').onclick = () => {
    const selectedOffered = Array.from(myOfferList.querySelectorAll('input:checked')).map(i => i.value);
    if (selectedOffered.length === 0) {
      alert('Lütfen en az bir eşya seçin.');
      return;
    }

    socket.emit('trade:create_offer', {
      targetUserId: targetPlayer.id,
      offeredInstanceIds: selectedOffered,
      requestedInstanceIds: []
    });

    modal.style.display = 'none';
    alert('Takas teklifiniz oyuncuya iletildi!');
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
