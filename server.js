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
    text: `🔥 ŞANS ETKİNLİĞİ BAŞLADI: [${randomCase.name}] kasasında 3 dakika boyunca Kırmızı & Sarı çıkarma şansı +%3 arttırıldı!`
  });
}

initLuckCycle();

// ==========================================
// 3. MARKETPLACE 30-MINUTE BOT BUYOUT ENGINE
// ==========================================
// Bot buys items not sold after 30 minutes at 86% of base price
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
      
      // Notify seller if online
      for (const [sId, info] of activeSockets.entries()) {
        if (info.userId === listing.sellerId) {
          io.to(sId).emit('market:warning_5min', {
            listingId: listing.id,
            itemName: listing.item.name,
            timeLeft: Math.round(timeLeft / 1000)
          });
        }
      }
    }

    // 30-minute expiry -> BOT BUYOUT AT 86%
    if (timeLeft <= 0) {
      // Calculate 86% of item's base price
      const botPrice = Math.max(1, Math.round(listing.item.basePrice * 0.86));
      
      // Remove from market
      db.removeMarketListing(listing.id);
      notified5MinListings.delete(listing.id);

      // Credit seller
      const newBal = db.updateBalance(listing.sellerId, botPrice);

      // Notify seller
      for (const [sId, info] of activeSockets.entries()) {
        if (info.userId === listing.sellerId) {
          io.to(sId).emit('market:bot_bought', {
            itemName: listing.item.name,
            botPrice,
            newBalance: newBal
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

  for (const entry of items) {
    if (randomVal < entry.weight) {
      return entry.skin;
    }
    randomVal -= entry.weight;
  }

  return items[items.length - 1].skin;
}

// ==========================================
// 5. WEBSOCKET CONNECTION LIFECYCLE
// ==========================================
io.on('connection', (socket) => {
  // Send cases list immediately on connection
  socket.emit('cases:list', CASES);

  // Handle User Login & HWID Auth
  socket.on('auth:login', ({ username, hwid, tabId }) => {
    try {
      const cleanUser = String(username || '').trim();
      const cleanHwid = String(hwid || '').trim();
      const cleanTab = String(tabId || socket.id).trim();

      if (!cleanUser) {
        return socket.emit('auth:error', { message: 'Lütfen bir kullanıcı adı girin.' });
      }

      const finalHwid = cleanHwid || ('HWID_FALLBACK_' + socket.id);
      console.log(`[AUTH] Login attempt from user: "${cleanUser}", HWID: "${finalHwid}", Tab: "${cleanTab}"`);

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
              message: '⚠️ BU CİHAZDAN ZATEN AKTİF BİR SEKMEDE GİRİŞ YAPILMIŞ!\nAynı anda birden fazla sekme açamazsınız. Lütfen diğer sekmeyi kapatın.'
            });
          }
        }
      }

      // Login or register via HWID & 5 balance initial grant
      const result = db.loginOrRegister(cleanUser, finalHwid);
      const user = result.user;

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
          inventory: user.inventory
        },
        cases: CASES,
        isNewHwid: result.isNewHwid,
        bonusGiven: result.bonusGiven,
        luckEvent,
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

    // Validate balance (1 balance per case)
    if (user.balance < caseObj.cost) {
      return socket.emit('case:error', { message: 'Yetersiz bakiye! Bu kasa için 1 bakiye gerekiyor.' });
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
      isBoosted
    });

    // Check if rare drop (Covert/Red or Knife/Gold) -> BROADCAST TO ALL PLAYERS!
    // "diğer oyunculara kasadan sadece kırmızı ve sarı çıkarırsa bildirim gitsin"
    const r = wonSkin.rarity;
    const isRed = r === 'covert' || r === 'exclusive';
    const isGold = r === 'knife';

    if (isRed || isGold) {
      io.emit('rare_drop:broadcast', {
        username: user.username,
        caseName: caseObj.name,
        item: savedItem,
        rarity: r,
        isGold,
        timestamp: Date.now()
      });

      // Also post celebratory message in chat
      const alertMsg = {
        id: 'sys_' + Date.now(),
        userId: 'system',
        username: '🏆 SERVER DROP',
        text: `🔥 [${user.username}] az önce "${caseObj.name}" kasasından ${isGold ? '★ EFSANEVİ BIÇAK' : 'GİZLİ (KIRMIZI)'} ${wonSkin.name} çıkardı! (Değer: ₺${wonSkin.basePrice})`,
        timestamp: Date.now(),
        isHighlight: true
      };
      db.addChatMessage(alertMsg);
      io.emit('chat:message', alertMsg);
    }
  });

  // Instant Sell Item
  socket.on('inventory:sell_instant', ({ instanceId }) => {
    const session = activeSockets.get(socket.id);
    if (!session) return;

    const user = db.getUserById(session.userId);
    if (!user) return;

    const removedItem = db.removeItemFromUser(user.id, instanceId);
    if (!removedItem) {
      return socket.emit('inventory:error', { message: 'Eşya envanterde bulunamadı.' });
    }

    // Instant sell value = 75% of base price
    const sellPrice = Math.max(1, Math.round(removedItem.basePrice * 0.75));
    const newBal = db.updateBalance(user.id, sellPrice);

    socket.emit('inventory:sold', {
      instanceId,
      sellPrice,
      newBalance: newBal,
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

  // Market: Buy skin from player
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

    if (buyer.balance < listing.price) {
      return socket.emit('market:error', { message: 'Yetersiz bakiye!' });
    }

    // Process transaction
    db.removeMarketListing(listingId);
    const newBuyerBal = db.updateBalance(buyer.id, -listing.price);
    const newSellerBal = db.updateBalance(listing.sellerId, listing.price);

    const receivedItem = db.addItemToUser(buyer.id, listing.item);

    socket.emit('market:buy_success', {
      item: receivedItem,
      newBalance: newBuyerBal,
      inventory: buyer.inventory
    });

    // Notify seller
    for (const [sId, info] of activeSockets.entries()) {
      if (info.userId === listing.sellerId) {
        io.to(sId).emit('market:item_sold_to_player', {
          itemName: listing.item.name,
          price: listing.price,
          buyerName: buyer.username,
          newBalance: newSellerBal
        });
      }
    }

    io.emit('market:updated', db.db.market);
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
