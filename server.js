const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');

const { CASES } = require('./data/cases');
const db = require('./data/db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API route for healthcheck & info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    activeUsers: io.engine.clientsCount,
    time: new Date().toISOString()
  });
});

app.get('/api/cases', (req, res) => {
  res.json(CASES);
});

// ==========================================
// 1. ACTIVE CONNECTIONS & MULTI-TAB HWID LOCK
// ==========================================
// hwid -> { socketId, userId, username, tabId }
const activeHwids = new Map();
// socketId -> { hwid, userId, username, tabId }
const activeSockets = new Map();

// Helper to get online users list (deduplicated)
function getOnlineUsers() {
  const users = [];
  const seenIds = new Set();
  for (const info of activeSockets.values()) {
    if (info.userId && !seenIds.has(info.userId)) {
      seenIds.add(info.userId);
      users.push({
        id: info.userId,
        username: info.username
      });
    }
  }
  return users;
}

// ==========================================
// 2. TIMED LUCK BOOST EVENT (4 MIN CYCLE: 3 MIN ACTIVE, 1 MIN BREAK)
// ==========================================
// Every 4 minutes (240s total), picks a random case where rare drop chance (Red & Gold) increases by +3%
let luckEvent = {
  active: false,
  caseId: null,
  caseName: '',
  game: '',
  remainingSeconds: 0,
  boostPercent: 3, // +3%
  cyclePhase: 'active' // 'active' (180s) or 'break' (60s)
};

function initLuckCycle() {
  // Start with active event
  startNewLuckEvent();

  setInterval(() => {
    if (luckEvent.remainingSeconds > 0) {
      luckEvent.remainingSeconds--;
    } else {
      // Toggle between active and break
      if (luckEvent.cyclePhase === 'active') {
        // 3 minutes just ended, start 1 min cooldown
        luckEvent.cyclePhase = 'break';
        luckEvent.active = false;
        luckEvent.remainingSeconds = 60; // 1 minute break
        io.emit('luck_event:update', luckEvent);
      } else {
        // Break ended, start new 3-minute event on random case
        startNewLuckEvent();
      }
    }

    // Broadcast countdown every 5 seconds or when state changes
    if (luckEvent.remainingSeconds % 5 === 0 || luckEvent.remainingSeconds <= 10) {
      io.emit('luck_event:update', luckEvent);
    }
  }, 1000);
}

function startNewLuckEvent() {
  const randomCase = CASES[Math.floor(Math.random() * CASES.length)];
  luckEvent = {
    active: true,
    caseId: randomCase.id,
    caseName: randomCase.name,
    game: randomCase.game,
    remainingSeconds: 180, // 3 minutes
    boostPercent: 3,
    cyclePhase: 'active'
  };
  io.emit('luck_event:update', luckEvent);
  io.emit('chat:system_alert', {
    text: `ŞANS ETKİNLİĞİ: [${randomCase.name}] kasasında 3 dakika boyunca Kırmızı & Sarı çıkarma şansı +%3 arttırıldı.`
  });
}

initLuckCycle();

// ==========================================
// 2.5. 2-MINUTE AUTOMATIC CREDIT (+1 BAKİYE) REWARD CYCLE
// ==========================================
// Every 120 seconds (2 minutes), awards +1 Kasa Bakiyesi to all online users
let creditRewardCountdown = 120;

setInterval(() => {
  if (creditRewardCountdown > 0) {
    creditRewardCountdown--;
  } else {
    creditRewardCountdown = 120; // Reset to 2 minutes

    const rewardedUserIds = new Set();
    for (const session of activeSockets.values()) {
      if (session.userId && !rewardedUserIds.has(session.userId)) {
        rewardedUserIds.add(session.userId);
        const newBalance = db.updateBalance(session.userId, 1);
        const targetSocket = io.sockets.sockets.get(session.socketId);
        if (targetSocket) {
          targetSocket.emit('credit:reward', {
            added: 1,
            newBalance,
            message: 'Çevrimiçi ödülü: +1 Anahtar hesabınıza tanımlandı.'
          });
        }
      }
    }
  }

  // Broadcast timer tick to sync UI every second
  io.emit('credit_timer:tick', { remainingSeconds: creditRewardCountdown });
}, 1000);

// ==========================================
// 3. MARKETPLACE 30-MINUTE BOT BUYOUT ENGINE
// ==========================================
// Map canonical skin base prices directly from CASES definitions
const SKIN_BASE_PRICES = new Map();
for (const c of CASES) {
  for (const it of c.items) {
    if (it.skin) {
      if (it.skin.id) SKIN_BASE_PRICES.set(it.skin.id, it.skin.basePrice);
      if (it.skin.name) SKIN_BASE_PRICES.set(it.skin.name.toLowerCase().trim(), it.skin.basePrice);
    }
  }
}

function getOfficialBasePrice(item) {
  if (!item) return 10;
  if (item.id && SKIN_BASE_PRICES.has(item.id)) {
    return SKIN_BASE_PRICES.get(item.id);
  }
  if (item.name && SKIN_BASE_PRICES.has(item.name.toLowerCase().trim())) {
    return SKIN_BASE_PRICES.get(item.name.toLowerCase().trim());
  }
  return Number(item.basePrice) || 10;
}

// Bot buys items not sold after 30 minutes at 86% of skin's REAL base price (ignoring user's asking price)
// Warning sent at 5 minutes remaining
const notified5MinListings = new Set();

setInterval(() => {
  const now = Date.now();
  const marketListings = [...db.db.market];

  for (const listing of marketListings) {
    const timeLeft = listing.expiresAt - now;

    // 5-minute warning check (between 4m 50s and 5m 10s)
    if (timeLeft <= 5 * 60 * 1000 && timeLeft > 0 && !notified5MinListings.has(listing.id)) {
      notified5MinListings.add(listing.id);
      
      const realBasePrice = getOfficialBasePrice(listing.item);
      const estBotPrice = Math.max(1, Math.round(realBasePrice * 0.86));

      // Notify seller if online
      for (const [sId, info] of activeSockets.entries()) {
        if (info.userId === listing.sellerId) {
          io.to(sId).emit('market:warning_5min', {
            listingId: listing.id,
            itemName: listing.item.name,
            officialBasePrice: realBasePrice,
            botPrice: estBotPrice,
            timeLeft: Math.round(timeLeft / 1000)
          });
        }
      }
    }

    // 30-minute expiry -> BOT BUYOUT AT 86% OF REAL BASE PRICE
    if (timeLeft <= 0) {
      // Calculate 86% of skin's REAL base price (NOT user's asking price listing.price!)
      const realBasePrice = getOfficialBasePrice(listing.item);
      const botPrice = Math.max(1, Math.round(realBasePrice * 0.86));
      
      // Remove from market
      db.removeMarketListing(listing.id);
      notified5MinListings.delete(listing.id);

      // Credit seller with TL
      const newTLBal = db.updateTLBalance(listing.sellerId, botPrice);
      const seller = db.getUserById(listing.sellerId);

      // Notify seller
      for (const [sId, info] of activeSockets.entries()) {
        if (info.userId === listing.sellerId) {
          io.to(sId).emit('market:bot_bought', {
            itemName: listing.item.name,
            officialBasePrice: realBasePrice,
            botPrice,
            newTLBalance: newTLBal,
            newBalance: seller ? seller.balance : 0
          });
        }
      }

      // Broadcast market update
      io.emit('market:updated', db.db.market);
    }
  }
}, 3000);

// ==========================================
// 4. CASE OPENING WEIGHT LOGIC
// ==========================================
function pickWinningItem(caseObj, isBoosted) {
  // If boosted, we increase weight of 'covert', 'exclusive', and 'knife' by +3% total probability
  let items = caseObj.items.map(entry => ({ ...entry }));
  
  if (isBoosted) {
    // Boost rare items
    items = items.map(entry => {
      const r = entry.skin.rarity;
      if (r === 'knife' || r === 'covert' || r === 'exclusive') {
        return {
          ...entry,
          weight: entry.weight + 3.0 // increases probability by +3%
        };
      }
      return entry;
    });
  }

  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let randomVal = Math.random() * totalWeight;

  let wonSkin = items[items.length - 1].skin;
  for (const entry of items) {
    if (randomVal < entry.weight) {
      wonSkin = entry.skin;
      break;
    }
    randomVal -= entry.weight;
  }

  // If Champions Vault case drops Gold (knife / mystery), award one of the Champions skins (2021-2026) at random
  if (caseObj.id === 'val_champions_vault' && (wonSkin.rarity === 'knife' || wonSkin.id === 'val_champions_mystery')) {
    const { VAL_SKINS } = require('./data/cases');
    const champSkins = [
      VAL_SKINS.champions_2021_karambit,
      VAL_SKINS.champions_2021_vandal,
      VAL_SKINS.champions_2022_butterfly,
      VAL_SKINS.champions_2022_phantom,
      VAL_SKINS.champions_2023_kunai,
      VAL_SKINS.champions_2023_vandal,
      VAL_SKINS.champions_2024_blade,
      VAL_SKINS.champions_2024_phantom,
      VAL_SKINS.champions_2025_blade,
      VAL_SKINS.champions_2025_vandal,
      VAL_SKINS.champions_2026_katana,
      VAL_SKINS.champions_2026_phantom
    ].filter(Boolean);
    if (champSkins.length > 0) {
      wonSkin = champSkins[Math.floor(Math.random() * champSkins.length)];
    }
  }

  return wonSkin;
}

// ==========================================
// 5. WEBSOCKET CONNECTION LIFECYCLE
// ==========================================
io.on('connection', (socket) => {
  // Send cases list immediately on connection
  socket.emit('cases:list', CASES);

  // Handle User Login & HWID Auth with Password
  socket.on('auth:login', ({ username, password, hwid, tabId, backupData }) => {
    try {
      const cleanUser = String(username || '').trim();
      const cleanPass = String(password || '').trim();
      const cleanHwid = String(hwid || '').trim();
      const cleanTab = String(tabId || socket.id).trim();

      if (!cleanUser) {
        return socket.emit('auth:error', { message: 'Lütfen bir kullanıcı adı girin.' });
      }

      if (!cleanPass) {
        return socket.emit('auth:error', { message: 'Lütfen hesap şifrenizi girin.' });
      }

      const finalHwid = cleanHwid || ('HWID_FALLBACK_' + socket.id);
      console.log(`[AUTH] Login attempt from user: "${cleanUser}", HWID: "${finalHwid}", Tab: "${cleanTab}"`);

      // Verify credentials & login or register via db
      const result = db.loginOrRegister(cleanUser, cleanPass, finalHwid, backupData);
      if (!result.success) {
        return socket.emit('auth:error', { message: result.message || 'Giriş başarısız!' });
      }

      const user = result.user;

      // Check Multi-Tab constraint:
      if (activeHwids.has(finalHwid)) {
        const activeSession = activeHwids.get(finalHwid);
        const existingSocket = io.sockets.sockets.get(activeSession.socketId);
        if (existingSocket && existingSocket.id !== socket.id) {
          // If it's the SAME tab reloaded/reconnected, disconnect the stale socket
          if (activeSession.tabId === cleanTab) {
            existingSocket.disconnect(true);
            activeSockets.delete(activeSession.socketId);
          } else {
            console.log(`[AUTH] Multi-tab blocked for HWID: ${finalHwid}`);
            return socket.emit('auth:blocked_multi_tab', {
              message: 'BU CİHAZDAN ZATEN AKTİF BİR SEKMEDE GİRİŞ YAPILMIŞ!\nLütfen diğer sekmeyi kapatın.'
            });
          }
        }
      }

      // Track active connection
      activeHwids.set(finalHwid, {
        socketId: socket.id,
        userId: user.id,
        username: user.username,
        tabId: cleanTab
      });
      activeSockets.set(socket.id, {
        hwid: finalHwid,
        userId: user.id,
        username: user.username,
        tabId: cleanTab
      });

      console.log(`[AUTH] Login success for user: "${user.username}" (Balance: ${user.balance}, Bonus: ${result.bonusGiven})`);

      socket.emit('auth:success', {
        user: {
          id: user.id,
          username: user.username,
          balance: user.balance,
          tlBalance: user.tlBalance !== undefined ? user.tlBalance : 0,
          inventory: user.inventory
        },
        cases: CASES,
        isNewHwid: result.isNewHwid,
        bonusGiven: result.bonusGiven,
        luckEvent,
        creditRemainingSeconds: creditRewardCountdown,
        market: db.db.market,
        chat: db.db.chat.slice(-50)
      });

      // Broadcast updated online players
      io.emit('players:online', getOnlineUsers());
    } catch (err) {
      console.error('[AUTH ERROR]:', err);
      socket.emit('auth:error', { message: 'Sunucu giriş hatası: ' + err.message });
    }
  });

  // Open Case
  socket.on('case:open', ({ caseId }) => {
    const session = activeSockets.get(socket.id);
    if (!session) return socket.emit('case:error', { message: 'Oturum bulunamadı. Lütfen giriş yapın.' });

    const user = db.getUserById(session.userId);
    if (!user) return socket.emit('case:error', { message: 'Kullanıcı bulunamadı.' });

    const caseObj = CASES.find(c => c.id === caseId);
    if (!caseObj) return socket.emit('case:error', { message: 'Geçersiz kasa.' });

    // Validate balance
    if (user.balance < caseObj.cost) {
      return socket.emit('case:error', { message: `Yetersiz anahtar! Bu kasa için ${caseObj.cost} anahtar gerekiyor.` });
    }

    // Deduct cost
    db.updateBalance(user.id, -caseObj.cost);

    // Check if luck event is currently active on this case
    const isBoosted = luckEvent.active && luckEvent.caseId === caseId;

    // Roll winning skin
    const wonSkin = pickWinningItem(caseObj, isBoosted);
    const savedItem = db.addItemToUser(user.id, wonSkin);

    // Build rolling carousel strip (around 65 items, winning item lands at index 55)
    const winningIndex = 55;
    const strip = [];
    for (let i = 0; i < 70; i++) {
      if (i === winningIndex) {
        strip.push(savedItem);
      } else {
        const randomSkin = caseObj.items[Math.floor(Math.random() * caseObj.items.length)].skin;
        strip.push({ ...randomSkin, instanceId: 'tmp_' + i });
      }
    }

    // Respond to user
    socket.emit('case:result', {
      item: savedItem,
      winningIndex,
      strip,
      newBalance: user.balance,
      newTLBalance: user.tlBalance || 0,
      isBoosted
    });

    // Check if rare drop (Covert/Red or Knife/Gold) -> BROADCAST TO ALL PLAYERS AFTER SPIN FINISHES (6100ms)!
    // "daha spin animasyonu bitmeden bildirim geldi" -> fixed!
    const r = wonSkin.rarity;
    const isRed = r === 'covert' || r === 'exclusive';
    const isGold = r === 'knife';

    if (isRed || isGold) {
      setTimeout(() => {
        const isChampionsGold = caseObj.id === 'val_champions_vault' && isGold;
        io.emit('rare_drop:broadcast', {
          username: user.username,
          caseName: caseObj.name,
          caseId: caseObj.id,
          item: savedItem,
          rarity: r,
          isGold,
          isChampionsGold,
          timestamp: Date.now()
        });

        // Also post celebratory message in chat
        const dropLabel = isChampionsGold ? '★ GİZEMLİ LİMİTED SKİN' : (isGold ? '★ EFSANEVİ BIÇAK' : 'GİZLİ (KIRMIZI)');
        const alertMsg = {
          id: 'sys_' + Date.now(),
          userId: 'system',
          username: 'SERVER DROP',
          text: `[${user.username}], "${caseObj.name}" kasasından ${dropLabel} ${wonSkin.name} çıkardı! (₺${wonSkin.basePrice})`,
          timestamp: Date.now(),
          isHighlight: true
        };
        db.addChatMessage(alertMsg);
        io.emit('chat:message', alertMsg);
      }, 6100);
    }
  });

  // Instant Sell Item (Awards TL: 75% of base price)
  socket.on('inventory:sell_instant', ({ instanceId }) => {
    const session = activeSockets.get(socket.id);
    if (!session) return;

    const user = db.getUserById(session.userId);
    if (!user) return;

    const removedItem = db.removeItemFromUser(user.id, instanceId);
    if (!removedItem) {
      return socket.emit('inventory:error', { message: 'Eşya envanterde bulunamadı.' });
    }

    // Instant sell value = 75% of base price (in TL)
    const sellPrice = Math.max(1, Math.round(removedItem.basePrice * 0.75));
    const newTL = db.updateTLBalance(user.id, sellPrice);

    socket.emit('inventory:sold', {
      instanceId,
      sellPrice,
      newTLBalance: newTL,
      newBalance: user.balance,
      inventory: user.inventory
    });
  });

  // Bulk Instant Sell Items (Selected or All, Awards TL: 75%)
  socket.on('inventory:sell_bulk_instant', ({ instanceIds } = {}) => {
    const session = activeSockets.get(socket.id);
    if (!session) return;

    const user = db.getUserById(session.userId);
    if (!user || !user.inventory || user.inventory.length === 0) {
      return socket.emit('inventory:error', { message: 'Envanterinizde satılacak eşya bulunmuyor.' });
    }

    const idsToSell = Array.isArray(instanceIds) && instanceIds.length > 0 
      ? new Set(instanceIds) 
      : null;

    let totalSellPrice = 0;
    const remainingInventory = [];
    let soldCount = 0;

    for (const item of user.inventory) {
      if (!idsToSell || idsToSell.has(item.instanceId)) {
        const itemPrice = Math.max(1, Math.round(item.basePrice * 0.75));
        totalSellPrice += itemPrice;
        soldCount++;
      } else {
        remainingInventory.push(item);
      }
    }

    if (soldCount === 0) {
      return socket.emit('inventory:error', { message: 'Seçili eşyalar bulunamadı.' });
    }

    user.inventory = remainingInventory;
    const newTL = db.updateTLBalance(user.id, totalSellPrice);
    if (db.save) db.save();

    socket.emit('inventory:bulk_sold', {
      soldCount,
      totalSellPrice,
      newTLBalance: newTL,
      newBalance: user.balance,
      inventory: user.inventory
    });
  });

  // Market: Put skin up for sale
  socket.on('market:list_item', ({ instanceId, price }) => {
    const session = activeSockets.get(socket.id);
    if (!session) return;

    const user = db.getUserById(session.userId);
    if (!user) return;

    const askingPrice = Number(price);
    if (isNaN(askingPrice) || askingPrice <= 0) {
      return socket.emit('market:error', { message: 'Geçersiz satış fiyatı.' });
    }

    const item = db.removeItemFromUser(user.id, instanceId);
    if (!item) {
      return socket.emit('market:error', { message: 'Satılacak eşya bulunamadı.' });
    }

    const listing = db.addMarketListing(user.id, user.username, item, askingPrice);

    socket.emit('market:listed_success', {
      listing,
      inventory: user.inventory
    });

    io.emit('market:updated', db.db.market);
  });

  // Market: Bulk List Items
  socket.on('market:list_bulk', ({ items } = {}) => {
    const session = activeSockets.get(socket.id);
    if (!session) return;

    const user = db.getUserById(session.userId);
    if (!user || !user.inventory || user.inventory.length === 0) {
      return socket.emit('market:error', { message: 'Envanterinizde pazara koyulacak eşya bulunmuyor.' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return socket.emit('market:error', { message: 'Pazara eklenecek eşya seçilmedi.' });
    }

    const itemMap = new Map();
    items.forEach(req => {
      if (req && req.instanceId) {
        itemMap.set(req.instanceId, Number(req.price));
      }
    });

    const remainingInventory = [];
    const createdListings = [];

    for (const item of user.inventory) {
      if (itemMap.has(item.instanceId)) {
        const askPrice = itemMap.get(item.instanceId);
        const finalPrice = (!isNaN(askPrice) && askPrice > 0) ? askPrice : item.basePrice;
        const listing = db.addMarketListing(user.id, user.username, item, finalPrice);
        createdListings.push(listing);
      } else {
        remainingInventory.push(item);
      }
    }

    if (createdListings.length === 0) {
      return socket.emit('market:error', { message: 'Pazara koyulacak geçerli eşya bulunamadı.' });
    }

    user.inventory = remainingInventory;
    if (db.save) db.save();

    socket.emit('market:bulk_listed_success', {
      count: createdListings.length,
      inventory: user.inventory
    });

    io.emit('market:updated', db.db.market);
  });

  // Market: Buy skin from player (Transacts in TL)
  socket.on('market:buy_item', ({ listingId }) => {
    const session = activeSockets.get(socket.id);
    if (!session) return;

    const buyer = db.getUserById(session.userId);
    if (!buyer) return;

    const listing = db.db.market.find(m => m.id === listingId);
    if (!listing) {
      return socket.emit('market:error', { message: 'Eşya artık satışta değil veya satılmış.' });
    }

    if (listing.sellerId === buyer.id) {
      return socket.emit('market:error', { message: 'Kendi ilanınızı satın alamazsınız.' });
    }

    const buyerTL = buyer.tlBalance !== undefined ? buyer.tlBalance : 0;
    if (buyerTL < listing.price) {
      return socket.emit('market:error', { message: `Yetersiz TL bakiyesi! İlan fiyatı: ₺${listing.price} TL, Mevcut: ₺${buyerTL} TL.` });
    }

    // Process transaction in TL
    db.removeMarketListing(listingId);
    const newBuyerTL = db.updateTLBalance(buyer.id, -listing.price);
    const newSellerTL = db.updateTLBalance(listing.sellerId, listing.price);

    const receivedItem = db.addItemToUser(buyer.id, listing.item);
    const seller = db.getUserById(listing.sellerId);

    socket.emit('market:buy_success', {
      item: receivedItem,
      newTLBalance: newBuyerTL,
      newBalance: buyer.balance,
      inventory: buyer.inventory
    });

    // Notify seller
    for (const [sId, info] of activeSockets.entries()) {
      if (info.userId === listing.sellerId) {
        io.to(sId).emit('market:item_sold_to_player', {
          itemName: listing.item.name,
          price: listing.price,
          buyerName: buyer.username,
          newTLBalance: newSellerTL,
          newBalance: seller ? seller.balance : 0
        });
      }
    }

    io.emit('market:updated', db.db.market);
  });

  // Wallet: Convert TL to Kasa Balance (40 TL = 1 Bakiye)
  socket.on('wallet:convert_tl', ({ caseCount }) => {
    const session = activeSockets.get(socket.id);
    if (!session) return;

    const res = db.convertTLToCaseBalance(session.userId, caseCount);
    if (!res.success) {
      return socket.emit('wallet:error', { message: res.message });
    }

    socket.emit('wallet:converted', {
      convertedCases: res.convertedCases,
      costTL: res.costTL,
      newTL: res.newTL,
      newBalance: res.newBalance
    });
  });

  // Admin: Give Balance (Password: topraK)
  socket.on('admin:give_balance', ({ password, targetUsername, tlAmount, caseAmount }) => {
    if (password !== 'topraK') {
      return socket.emit('admin:error', { message: 'Hatalı yönetici şifresi!' });
    }

    const session = activeSockets.get(socket.id);
    if (!session) return;

    let targetUser = null;
    const cleanTarget = String(targetUsername || '').trim();
    if (cleanTarget) {
      targetUser = db.getUserByUsername(cleanTarget);
      if (!targetUser) {
        return socket.emit('admin:error', { message: `"${cleanTarget}" kullanıcısı bulunamadı.` });
      }
    } else {
      targetUser = db.getUserById(session.userId);
    }

    if (!targetUser) {
      return socket.emit('admin:error', { message: 'Hedef kullanıcı bulunamadı.' });
    }

    const addTL = Math.max(0, Number(tlAmount) || 0);
    const addCase = Math.max(0, Number(caseAmount) || 0);

    if (addTL > 0) {
      db.updateTLBalance(targetUser.id, addTL);
    }
    if (addCase > 0) {
      db.updateBalance(targetUser.id, addCase);
    }

    // Real-time broadcast balance update to target user
    for (const [sId, info] of activeSockets.entries()) {
      if (info.userId === targetUser.id) {
        io.to(sId).emit('balance:update', {
          balance: targetUser.balance,
          tlBalance: targetUser.tlBalance || 0
        });
      }
    }

    socket.emit('admin:success', {
      message: `"${targetUser.username}" kullanıcısına +₺${addTL.toLocaleString()} TL ve +${addCase} Anahtar tanımlandı!`,
      targetUsername: targetUser.username,
      newBalance: targetUser.balance,
      newTLBalance: targetUser.tlBalance
    });
  });

  // Trading: Propose trade offer
  socket.on('trade:create_offer', ({ targetUserId, offeredInstanceIds, requestedInstanceIds }) => {
    const session = activeSockets.get(socket.id);
    if (!session) return;

    const sender = db.getUserById(session.userId);
    const receiver = db.getUserById(targetUserId);

    if (!sender || !receiver || sender.id === receiver.id) {
      return socket.emit('trade:error', { message: 'Geçersiz takas hedefi.' });
    }

    // Validate offered items
    const offeredItems = sender.inventory.filter(i => offeredInstanceIds.includes(i.instanceId));
    const requestedItems = receiver.inventory.filter(i => requestedInstanceIds.includes(i.instanceId));

    if (offeredItems.length === 0 && requestedItems.length === 0) {
      return socket.emit('trade:error', { message: 'Lütfen en az bir eşya seçin.' });
    }

    const tradeOffer = {
      id: 'trd_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      fromUserId: sender.id,
      fromUsername: sender.username,
      toUserId: receiver.id,
      toUsername: receiver.username,
      offeredItems,
      requestedItems,
      createdAt: Date.now()
    };

    db.db.tradeOffers.push(tradeOffer);

    socket.emit('trade:offer_sent', { tradeOffer });

    // Send real-time notification to target
    for (const [sId, info] of activeSockets.entries()) {
      if (info.userId === receiver.id) {
        io.to(sId).emit('trade:incoming_offer', { tradeOffer });
      }
    }
  });

  // Trading: Accept trade
  socket.on('trade:accept_offer', ({ tradeId }) => {
    const session = activeSockets.get(socket.id);
    if (!session) return;

    const offerIndex = db.db.tradeOffers.findIndex(t => t.id === tradeId);
    if (offerIndex === -1) {
      return socket.emit('trade:error', { message: 'Takas teklifi bulunamadı veya süresi geçmiş.' });
    }

    const offer = db.db.tradeOffers[offerIndex];
    if (offer.toUserId !== session.userId) {
      return socket.emit('trade:error', { message: 'Bu teklifi sadece hedef kullanıcı kabul edebilir.' });
    }

    const userA = db.getUserById(offer.fromUserId);
    const userB = db.getUserById(offer.toUserId);

    if (!userA || !userB) {
      return socket.emit('trade:error', { message: 'Kullanıcı bulunamadı.' });
    }

    // Verify all items are still in respective inventories
    const aHasAll = offer.offeredItems.every(offered => userA.inventory.some(i => i.instanceId === offered.instanceId));
    const bHasAll = offer.requestedItems.every(req => userB.inventory.some(i => i.instanceId === req.instanceId));

    if (!aHasAll || !bHasAll) {
      db.db.tradeOffers.splice(offerIndex, 1);
      return socket.emit('trade:error', { message: 'Takastaki eşyalar artık envanterde bulunmuyor (satılmış veya aktarılmış olabilir).' });
    }

    // Atomically transfer items
    for (const item of offer.offeredItems) {
      db.removeItemFromUser(userA.id, item.instanceId);
      db.addItemToUser(userB.id, item);
    }
    for (const item of offer.requestedItems) {
      db.removeItemFromUser(userB.id, item.instanceId);
      db.addItemToUser(userA.id, item);
    }

    db.db.tradeOffers.splice(offerIndex, 1);
    db.save();

    // Notify both users with updated inventories
    for (const [sId, info] of activeSockets.entries()) {
      if (info.userId === userA.id) {
        io.to(sId).emit('trade:completed', {
          message: `${userB.username} takas teklifinizi kabul etti!`,
          inventory: userA.inventory
        });
      }
      if (info.userId === userB.id) {
        io.to(sId).emit('trade:completed', {
          message: `${userA.username} ile takas başarıyla tamamlandı!`,
          inventory: userB.inventory
        });
      }
    }
  });

  // Trading: Decline trade
  socket.on('trade:decline_offer', ({ tradeId }) => {
    const session = activeSockets.get(socket.id);
    if (!session) return;

    const offerIndex = db.db.tradeOffers.findIndex(t => t.id === tradeId);
    if (offerIndex !== -1) {
      const [offer] = db.db.tradeOffers.splice(offerIndex, 1);
      for (const [sId, info] of activeSockets.entries()) {
        if (info.userId === offer.fromUserId) {
          io.to(sId).emit('trade:declined', {
            message: `${session.username} takas teklifinizi reddetti.`
          });
        }
      }
    }
  });

  // Global Chat
  socket.on('chat:send_message', ({ text }) => {
    const session = activeSockets.get(socket.id);
    if (!session) return;

    const cleanText = String(text || '').trim();
    if (!cleanText || cleanText.length > 250) return;

    const msg = {
      id: 'chat_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      userId: session.userId,
      username: session.username,
      text: cleanText,
      timestamp: Date.now()
    };

    db.addChatMessage(msg);
    io.emit('chat:message', msg);
  });

  // Disconnect Handling
  socket.on('disconnect', () => {
    const session = activeSockets.get(socket.id);
    if (session) {
      const active = activeHwids.get(session.hwid);
      if (active && active.socketId === socket.id) {
        activeHwids.delete(session.hwid);
      }
      activeSockets.delete(socket.id);
      io.emit('players:online', getOnlineUsers());
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`===============================================`);
  console.log(`🚀 CASE-CLASH Server running on port ${PORT}`);
  console.log(`🎮 CS2 & VALORANT Case Opening Arena Online!`);
  console.log(`🌐 Ready for Railway hosting!`);
  console.log(`===============================================`);
});
