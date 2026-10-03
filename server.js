const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
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
  },
  maxHttpBufferSize: 1e5 // 100KB: büyük/şişirilmiş paketlerle bellek saldırısını engelle
});

const PORT = process.env.PORT || 3000;

// ==========================================
// 0. SECURITY CONFIG & HELPERS
// ==========================================
// 1 Anahtar'ın TL karşılığı. Tüm kasaların beklenen değeri (EV) bu fiyatın altında kalacak şekilde
// ayarlanmıştır; aksi halde "TL -> Anahtar -> Kasa -> Skin sat -> TL" döngüsü sınırsız para basar.
const KEY_PRICE_TL = Math.max(1, parseInt(process.env.KEY_PRICE_TL, 10) || 70);
db.KEY_PRICE_TL = KEY_PRICE_TL;

// Admin şifresi artık ortam değişkeninden okunur (ADMIN_PASSWORD). Tanımlı değilse eski şifre
// geçici olarak çalışır ancak sunucu başlangıcında uyarı verilir.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'topraK';
if (!process.env.ADMIN_PASSWORD) {
  console.warn('[SECURITY] ADMIN_PASSWORD ortam değişkeni tanımlı değil! Varsayılan (eski) şifre kullanılıyor. Lütfen Railway/Env üzerinden ADMIN_PASSWORD tanımlayın.');
}

// Sunucu yeniden başladığında veri kaybını önleyen İMZALI yedek için gizli anahtar.
// Railway gibi geçici disklerde kalıcı olması için BACKUP_SECRET ortam değişkeni tanımlayın.
function loadBackupSecret() {
  if (process.env.BACKUP_SECRET) return process.env.BACKUP_SECRET;
  const secretFile = path.join(__dirname, 'data', '.backup_secret');
  try {
    if (fs.existsSync(secretFile)) return fs.readFileSync(secretFile, 'utf-8').trim();
    const generated = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(secretFile, generated, { mode: 0o600 });
    return generated;
  } catch (e) {
    return crypto.randomBytes(32).toString('hex');
  }
}
const BACKUP_SECRET = loadBackupSecret();
if (!process.env.BACKUP_SECRET) {
  console.warn('[SECURITY] BACKUP_SECRET tanımlı değil. Sunucu diski sıfırlanırsa oyuncu yedekleri geçersiz olur. Kalıcı yedek için BACKUP_SECRET tanımlayın.');
}

// Kriptografik olarak güvenli [0,1) rastgele sayı (Math.random tahmin edilebilir)
function secureRandom() {
  return crypto.randomInt(0, 281474976710655) / 281474976710655;
}

// Süreci çökertebilecek beklenmeyen hataları logla (tek bir kötü paket sunucuyu düşürmesin)
process.on('uncaughtException', (err) => console.error('[UNCAUGHT EXCEPTION]', err));
process.on('unhandledRejection', (err) => console.error('[UNHANDLED REJECTION]', err));

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});
app.use(cors());
app.use(express.json({ limit: '10kb' }));
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

// Basit sabit pencere hız sınırlayıcı (brute-force / flood koruması)
function makeLimiter(max, windowMs) {
  const hits = new Map();
  return {
    // true -> izin verildi, false -> limit aşıldı
    take(key) {
      const now = Date.now();
      let entry = hits.get(key);
      if (!entry || now - entry.start > windowMs) {
        entry = { start: now, count: 0 };
        hits.set(key, entry);
      }
      entry.count++;
      return entry.count <= max;
    },
    isBlocked(key) {
      const entry = hits.get(key);
      return !!entry && Date.now() - entry.start <= windowMs && entry.count > max;
    },
    reset(key) { hits.delete(key); },
    sweep() {
      const now = Date.now();
      for (const [k, v] of hits) if (now - v.start > windowMs) hits.delete(k);
    }
  };
}

const loginFailLimiter = makeLimiter(6, 5 * 60 * 1000);   // 5 dk içinde en fazla 6 başarısız giriş (IP+kullanıcı)
const loginIpLimiter = makeLimiter(30, 5 * 60 * 1000);    // 5 dk içinde IP başına en fazla 30 giriş denemesi
const adminFailLimiter = makeLimiter(5, 10 * 60 * 1000);  // 10 dk içinde en fazla 5 yanlış admin şifresi
const chatLimiter = makeLimiter(6, 10 * 1000);            // 10 sn içinde en fazla 6 mesaj
setInterval(() => {
  loginFailLimiter.sweep();
  loginIpLimiter.sweep();
  adminFailLimiter.sweep();
  chatLimiter.sweep();
}, 60 * 1000).unref();

function getClientIp(socket) {
  const fwd = socket.handshake.headers['x-forwarded-for'];
  if (fwd) {
    const parts = String(fwd).split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return socket.handshake.address || 'unknown';
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

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
// 2.5. 1-MINUTE AUTOMATIC KEY (+1 ANAHTAR) REWARD CYCLE
// ==========================================
// Every 60 seconds (1 minute), awards +1 Anahtar to all online users
let creditRewardCountdown = 60;

setInterval(() => {
  if (creditRewardCountdown > 0) {
    creditRewardCountdown--;
  } else {
    creditRewardCountdown = 60; // Reset to 1 minute

    const rewardedUserIds = new Set();
    for (const [socketId, session] of activeSockets.entries()) {
      if (session.userId && !rewardedUserIds.has(session.userId)) {
        rewardedUserIds.add(session.userId);
        const newBalance = db.updateBalance(session.userId, 1);
        const targetSocket = io.sockets.sockets.get(socketId);
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
// 2.6. 5-MINUTE 50-KEY RAFFLE (ÇEKİLİŞ) CYCLE
// ==========================================
// Every 5 minutes (300s), holds a 50-Key raffle if more than 2 online players (min 3 players required)
let raffleCountdown = 300;

setInterval(() => {
  if (raffleCountdown > 0) {
    raffleCountdown--;
  } else {
    raffleCountdown = 300; // Reset to 5 minutes

    const onlineUsers = getOnlineUsers();
    // Rule: "2 oyuncu veya daha azsa çekiliş olmasın" -> requires onlineUsers.length > 2
    if (onlineUsers.length <= 2) {
      console.log(`[RAFFLE] Çekiliş yapılmadı: Çevrimiçi ${onlineUsers.length} oyuncu var (En az 3 oyuncu gerekli).`);
      io.emit('raffle:skipped', {
        message: `Çekiliş ertelendi: Yeterli oyuncu yok (${onlineUsers.length}/3 oyuncu çevrimiçi). Bir sonraki çekiliş 5 dakika sonra!`,
        playerCount: onlineUsers.length
      });
    } else {
      const winner = onlineUsers[Math.floor(Math.random() * onlineUsers.length)];
      const newBalance = db.updateBalance(winner.id, 50);

      console.log(`[RAFFLE] Kazanan: "${winner.username}" (${onlineUsers.length} oyuncu arasından 50 Anahtar kazandı!)`);

      // Broadcast winner to all players
      io.emit('raffle:winner', {
        winnerId: winner.id,
        winnerUsername: winner.username,
        prize: 50,
        playerCount: onlineUsers.length
      });

      // Announce in chat
      const raffleChatMsg = {
        id: 'sys_raffle_' + Date.now(),
        userId: 'system',
        username: 'BÜYÜK ÇEKİLİŞ',
        text: `🎉 TEBRİKLER! [${winner.username}], ${onlineUsers.length} çevrimiçi oyuncu arasından 50 ANAHTAR KAZANDI!`,
        timestamp: Date.now(),
        isHighlight: true
      };
      db.addChatMessage(raffleChatMsg);
      io.emit('chat:message', raffleChatMsg);

      // Real-time balance update for winner
      for (const [sId, info] of activeSockets.entries()) {
        if (info.userId === winner.id) {
          io.to(sId).emit('balance:update', { balance: newBalance });
        }
      }
    }
  }

  // Broadcast raffle tick to sync UI every second
  io.emit('raffle_timer:tick', { remainingSeconds: raffleCountdown });
}, 1000);

// ==========================================
// 3. MARKETPLACE 30-MINUTE BOT BUYOUT ENGINE
// ==========================================
// Map canonical skin base prices directly from CASES definitions
const SKIN_BASE_PRICES = new Map();
const ALL_SKINS_MAP = new Map();
for (const c of CASES) {
  for (const it of c.items) {
    if (it.skin) {
      // "İlk kayıt kazanır" kuralı iki haritada da aynı: fiyat/skin tutarsızlığı oluşmaz
      if (it.skin.id && !ALL_SKINS_MAP.has(it.skin.id)) {
        ALL_SKINS_MAP.set(it.skin.id, it.skin);
        SKIN_BASE_PRICES.set(it.skin.id, it.skin.basePrice);
      }
      if (it.skin.name) {
        const nameKey = it.skin.name.toLowerCase().trim();
        if (!SKIN_BASE_PRICES.has(nameKey)) SKIN_BASE_PRICES.set(nameKey, it.skin.basePrice);
      }
    }
  }
}

function getOfficialBasePrice(item) {
  if (!item) return 10;
  if (item.id && SKIN_BASE_PRICES.has(item.id)) {
    return SKIN_BASE_PRICES.get(item.id);
  }
  if (item.name && SKIN_BASE_PRICES.has(String(item.name).toLowerCase().trim())) {
    return SKIN_BASE_PRICES.get(String(item.name).toLowerCase().trim());
  }
  return Math.max(1, Number(item.basePrice) || 10);
}

// Envanterdeki eşyaların fiyat/isim/görsel bilgisini resmi katalogla senkronla
// (eski kaydedilmiş fiyatlar veya sahte alanlar ekonomi hesaplarını bozmasın)
function normalizeUserInventory(user) {
  if (!user || !Array.isArray(user.inventory)) return;
  let changed = false;
  for (const it of user.inventory) {
    const skin = it && it.id ? ALL_SKINS_MAP.get(it.id) : null;
    if (!skin) continue;
    if (it.basePrice !== skin.basePrice || it.officialBasePrice !== skin.basePrice) {
      it.basePrice = skin.basePrice;
      it.officialBasePrice = skin.basePrice;
      changed = true;
    }
    if (skin.image && it.image !== skin.image) { it.image = skin.image; changed = true; }
    if (skin.name && it.name !== skin.name) { it.name = skin.name; changed = true; }
    if (skin.rarity && it.rarity !== skin.rarity) { it.rarity = skin.rarity; changed = true; }
  }
  if (changed) db.save();
}

// Pazar fiyatı doğrulama: sonlu, tam sayı, 1 - 10.000.000 TL
const MAX_LISTING_PRICE = 10000000;
function sanitizeListingPrice(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n < 1 || n > MAX_LISTING_PRICE) return null;
  return n;
}

// ------------------------------------------------------------------
// İMZALI YEDEK (Snapshot): sunucu diski sıfırlansa bile oyuncu verisini güvenle geri yükler.
// İstemci kendi bakiyesini/envanterini ASLA belirleyemez; yalnızca sunucunun imzaladığı
// veri, yalnızca hesap sunucuda YOKSA (yeni kayıt) ve kullanıcı adı eşleşirse kabul edilir.
// ------------------------------------------------------------------
function signPayload(payload) {
  return crypto.createHmac('sha256', BACKUP_SECRET).update(payload).digest('hex');
}

function makeSignedSnapshot(user) {
  const payload = JSON.stringify({
    v: 1,
    id: user.id,
    u: String(user.username).toLowerCase().trim(),
    b: user.balance,
    t: user.tlBalance,
    inv: (user.inventory || []).map(i => ({ s: i.id, i: i.instanceId, a: i.acquiredAt })),
    ts: Date.now()
  });
  return { payload, sig: signPayload(payload) };
}

function verifySnapshot(raw, username) {
  try {
    if (!raw || typeof raw.payload !== 'string' || typeof raw.sig !== 'string') return null;
    if (raw.payload.length > 500000) return null;
    const expected = Buffer.from(signPayload(raw.payload), 'hex');
    const got = Buffer.from(raw.sig, 'hex');
    if (expected.length !== got.length || !crypto.timingSafeEqual(expected, got)) return null;

    const data = JSON.parse(raw.payload);
    if (data.v !== 1 || data.u !== String(username).toLowerCase().trim()) return null;

    const inventory = [];
    for (const entry of Array.isArray(data.inv) ? data.inv : []) {
      const skin = entry && ALL_SKINS_MAP.get(entry.s);
      if (!skin) continue;
      inventory.push({
        ...skin,
        officialBasePrice: skin.basePrice,
        instanceId: typeof entry.i === 'string' ? entry.i : undefined,
        acquiredAt: Number(entry.a) || Date.now()
      });
    }
    return {
      id: typeof data.id === 'string' ? data.id : undefined,
      balance: Number(data.b) || 0,
      tlBalance: Number(data.t) || 0,
      inventory
    };
  } catch (e) {
    return null;
  }
}

const snapshotTimers = new Map();
function pushSnapshot(userId) {
  const user = db.getUserById(userId);
  if (!user) return;
  const snap = makeSignedSnapshot(user);
  for (const [sId, info] of activeSockets.entries()) {
    if (info.userId === userId) io.to(sId).emit('backup:snapshot', snap);
  }
}

db.setChangeListener((userId) => {
  if (snapshotTimers.has(userId)) return;
  snapshotTimers.set(userId, setTimeout(() => {
    snapshotTimers.delete(userId);
    pushSnapshot(userId);
  }, 1500));
});

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
  // If boosted, the TOTAL probability of 'covert', 'exclusive' and 'knife' drops rises by +3 percentage points
  // (previously +3 weight was added to EVERY rare item, which inflated the rare chance by 3% x item count)
  let items = caseObj.items
    .filter(entry => entry && entry.skin && Number(entry.weight) > 0)
    .map(entry => ({ ...entry, weight: Number(entry.weight) }));

  if (isBoosted) {
    const isRare = (entry) => ['knife', 'covert', 'exclusive'].includes(entry.skin.rarity);
    const total = items.reduce((s, e) => s + e.weight, 0);
    const rareWeight = items.filter(isRare).reduce((s, e) => s + e.weight, 0);
    const commonWeight = total - rareWeight;
    if (rareWeight > 0 && commonWeight > 0) {
      const currentShare = rareWeight / total;
      const newShare = Math.min(0.95, currentShare + 0.03);
      // Scale rare weights so that rareShare == newShare while common weights stay unchanged
      const factor = (newShare / (1 - newShare)) * (commonWeight / rareWeight);
      items = items.map(entry => isRare(entry) ? { ...entry, weight: entry.weight * factor } : entry);
    }
  }

  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let randomVal = secureRandom() * totalWeight;

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
      wonSkin = champSkins[Math.floor(secureRandom() * champSkins.length)];
    }
  }

  return wonSkin;
}

// ==========================================
// 5. WEBSOCKET CONNECTION LIFECYCLE
// ==========================================
io.on('connection', (socket) => {
  // --- Crash-proofing: a malformed payload (e.g. null/undefined destructuring) must NEVER take the server down ---
  const originalOn = socket.on.bind(socket);
  socket.on = (event, handler) => originalOn(event, (...args) => {
    try {
      return handler(...args);
    } catch (err) {
      console.error(`[SOCKET ERROR] event="${event}":`, err && err.message);
    }
  });

  // --- Per-socket flood protection: max 40 events / second, hard disconnect at 150 ---
  let floodWindowStart = Date.now();
  let floodCount = 0;
  socket.use((packet, next) => {
    const now = Date.now();
    if (now - floodWindowStart > 1000) {
      floodWindowStart = now;
      floodCount = 0;
    }
    floodCount++;
    if (floodCount > 150) {
      socket.disconnect(true);
      return;
    }
    if (floodCount > 40) return; // drop silently
    next();
  });

  const clientIp = getClientIp(socket);

  // Send cases list immediately on connection
  socket.emit('cases:list', CASES);

  // Handle User Login & HWID Auth with Password
  socket.on('auth:login', (payload) => {
    try {
      const { username, password, hwid, tabId, backupData } = payload || {};
      const cleanUser = String(username || '').trim().replace(/\s+/g, ' ').slice(0, 40);
      const cleanPass = String(password || '').trim().slice(0, 100);
      const cleanHwid = String(hwid || '').trim().slice(0, 128);
      const cleanTab = String(tabId || socket.id).trim().slice(0, 64);

      if (!cleanUser) {
        return socket.emit('auth:error', { message: 'Lütfen bir kullanıcı adı girin.' });
      }

      if (!cleanPass) {
        return socket.emit('auth:error', { message: 'Lütfen hesap şifrenizi girin.' });
      }

      // Brute-force protection (IP + kullanıcı bazlı)
      const failKey = clientIp + '|' + cleanUser.toLowerCase();
      if (!loginIpLimiter.take(clientIp) || loginFailLimiter.isBlocked(failKey)) {
        return socket.emit('auth:error', { message: 'Çok fazla başarısız giriş denemesi! Lütfen birkaç dakika sonra tekrar deneyin.' });
      }

      const finalHwid = cleanHwid || ('HWID_FALLBACK_' + socket.id);
      console.log(`[AUTH] Login attempt from user: "${cleanUser}", Tab: "${cleanTab}"`);

      // İmzalı yedek yalnızca hesap sunucuda YOKSA (yeni kayıt/disk sıfırlanması) geri yüklenir
      let trustedBackup = null;
      if (!db.getUserByUsername(cleanUser)) {
        trustedBackup = verifySnapshot(backupData, cleanUser);
      }

      // Verify credentials & login or register via db
      const result = db.loginOrRegister(cleanUser, cleanPass, finalHwid, trustedBackup);
      if (!result.success) {
        loginFailLimiter.take(failKey);
        return socket.emit('auth:error', { message: result.message || 'Giriş başarısız!' });
      }
      loginFailLimiter.reset(failKey);

      const user = result.user;
      normalizeUserInventory(user);

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

      // Bu soket daha önce başka bir hesap/HWID ile giriş yaptıysa eski kaydı temizle (hayalet oturum kalmasın)
      const previousSession = activeSockets.get(socket.id);
      if (previousSession) {
        const prevActive = activeHwids.get(previousSession.hwid);
        if (prevActive && prevActive.socketId === socket.id) activeHwids.delete(previousSession.hwid);
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
        keyPriceTL: KEY_PRICE_TL,
        isNewHwid: result.isNewHwid,
        bonusGiven: result.bonusGiven,
        luckEvent,
        creditRemainingSeconds: creditRewardCountdown,
        raffleRemainingSeconds: raffleCountdown,
        market: db.db.market,
        chat: db.db.chat.slice(-50)
      });

      // Güncel imzalı yedeği istemciye ver
      socket.emit('backup:snapshot', makeSignedSnapshot(user));

      // Broadcast updated online players
      io.emit('players:online', getOnlineUsers());
    } catch (err) {
      console.error('[AUTH ERROR]:', err);
      socket.emit('auth:error', { message: 'Sunucu giriş hatası. Lütfen tekrar deneyin.' });
    }
  });

  // Open Case
  socket.on('case:open', (payload) => {
    const session = activeSockets.get(socket.id);
    if (!session) return socket.emit('case:error', { message: 'Oturum bulunamadı. Lütfen giriş yapın.' });

    const user = db.getUserById(session.userId);
    if (!user) return socket.emit('case:error', { message: 'Kullanıcı bulunamadı.' });

    const caseId = payload && typeof payload.caseId === 'string' ? payload.caseId : null;
    const caseObj = caseId ? CASES.find(c => c.id === caseId) : null;
    if (!caseObj) return socket.emit('case:error', { message: 'Geçersiz kasa.' });

    const caseCost = Number(caseObj.cost);
    if (!Number.isFinite(caseCost) || caseCost <= 0 || !Array.isArray(caseObj.items) || caseObj.items.length === 0) {
      return socket.emit('case:error', { message: 'Bu kasa şu anda açılamıyor.' });
    }

    // Validate balance
    if (!Number.isFinite(user.balance) || user.balance < caseCost) {
      return socket.emit('case:error', { message: `Yetersiz anahtar! Bu kasa için ${caseCost} anahtar gerekiyor.` });
    }

    // Deduct cost
    db.updateBalance(user.id, -caseCost);

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
        const dropLabel = isChampionsGold ? '★ GİZEMLİ CHAMPIONS SKIN' : (isGold ? '★ EFSANEVİ BIÇAK' : 'GİZLİ (KIRMIZI)');
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

  // Instant Sell Item:
  // - If isQuickSell: sold immediately from case opening modal -> 75% of base price (quick sell discount)
  // - If sold from inventory ("envantere atıp satış yapılırsa") -> 100% full base price
  socket.on('inventory:sell_instant', (payload) => {
    const session = activeSockets.get(socket.id);
    if (!session) return;

    const user = db.getUserById(session.userId);
    if (!user) return;

    const instanceId = payload && typeof payload.instanceId === 'string' ? payload.instanceId : null;
    if (!instanceId) return socket.emit('inventory:error', { message: 'Geçersiz eşya ID.' });

    const isQuickSell = !!(payload && payload.isQuickSell);
    const removedItem = db.removeItemFromUser(user.id, instanceId);
    if (!removedItem) {
      return socket.emit('inventory:error', { message: 'Eşya envanterde bulunamadı.' });
    }

    const itemBasePrice = getOfficialBasePrice(removedItem);
    const sellPrice = isQuickSell
      ? Math.max(1, Math.round(itemBasePrice * 0.75))
      : Math.max(1, Math.round(itemBasePrice));

    const newTL = db.updateTLBalance(user.id, sellPrice);

    socket.emit('inventory:sold', {
      instanceId,
      sellPrice,
      isQuickSell,
      newTLBalance: newTL,
      newBalance: user.balance,
      inventory: user.inventory
    });
  });

  // Bulk Sell Items (From inventory: 100% base price)
  socket.on('inventory:sell_bulk_instant', (payload) => {
    const session = activeSockets.get(socket.id);
    if (!session) return;

    const user = db.getUserById(session.userId);
    if (!user || !user.inventory || user.inventory.length === 0) {
      return socket.emit('inventory:error', { message: 'Envanterinizde satılacak eşya bulunmuyor.' });
    }

    const instanceIds = payload && payload.instanceIds;
    const idsToSell = Array.isArray(instanceIds) && instanceIds.length > 0 
      ? new Set(instanceIds.filter(id => typeof id === 'string')) 
      : null;

    let totalSellPrice = 0;
    const remainingInventory = [];
    let soldCount = 0;

    for (const item of user.inventory) {
      if (!idsToSell || idsToSell.has(item.instanceId)) {
        const itemBasePrice = getOfficialBasePrice(item);
        const itemPrice = Math.max(1, Math.round(itemBasePrice));
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
  socket.on('market:list_item', (payload) => {
    const session = activeSockets.get(socket.id);
    if (!session) return;

    const user = db.getUserById(session.userId);
    if (!user) return;

    const instanceId = payload && typeof payload.instanceId === 'string' ? payload.instanceId : null;
    const askingPrice = sanitizeListingPrice(payload && payload.price);
    if (!askingPrice) {
      return socket.emit('market:error', { message: 'Geçersiz satış fiyatı (1 TL - 10.000.000 TL arası olmalı).' });
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
  socket.on('market:list_bulk', (payload) => {
    const session = activeSockets.get(socket.id);
    if (!session) return;

    const user = db.getUserById(session.userId);
    if (!user || !user.inventory || user.inventory.length === 0) {
      return socket.emit('market:error', { message: 'Envanterinizde pazara koyulacak eşya bulunmuyor.' });
    }

    const items = payload && payload.items;
    if (!Array.isArray(items) || items.length === 0) {
      return socket.emit('market:error', { message: 'Pazara eklenecek eşya seçilmedi.' });
    }

    const itemMap = new Map();
    items.forEach(req => {
      if (req && typeof req.instanceId === 'string') {
        const sanitized = sanitizeListingPrice(req.price);
        itemMap.set(req.instanceId, sanitized);
      }
    });

    const remainingInventory = [];
    const createdListings = [];

    for (const item of user.inventory) {
      if (itemMap.has(item.instanceId)) {
        const askPrice = itemMap.get(item.instanceId) || getOfficialBasePrice(item);
        const listing = db.addMarketListing(user.id, user.username, item, askPrice);
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
  socket.on('market:buy_item', (payload) => {
    const session = activeSockets.get(socket.id);
    if (!session) return;

    const buyer = db.getUserById(session.userId);
    if (!buyer) return;

    const listingId = payload && typeof payload.listingId === 'string' ? payload.listingId : null;
    if (!listingId) return socket.emit('market:error', { message: 'Geçersiz ilan.' });

    const listing = db.db.market.find(m => m.id === listingId);
    if (!listing) {
      return socket.emit('market:error', { message: 'Eşya artık satışta değil veya satılmış.' });
    }

    if (listing.sellerId === buyer.id) {
      return socket.emit('market:error', { message: 'Kendi ilanınızı satın alamazsınız.' });
    }

    const buyerTL = buyer.tlBalance !== undefined ? buyer.tlBalance : 0;
    if (buyerTL < listing.price) {
      return socket.emit('market:error', { message: `Yetersiz TL bakiyesi! İlan fiyatı: ₺${listing.price.toLocaleString()} TL, Mevcut: ₺${buyerTL.toLocaleString()} TL.` });
    }

    // Atomic remove from market to prevent duplicate purchase race conditions
    const removedListing = db.removeMarketListing(listingId);
    if (!removedListing) {
      return socket.emit('market:error', { message: 'Eşya sizden önce başka bir oyuncu tarafından satın alındı.' });
    }

    // Process transaction in TL
    const newBuyerTL = db.updateTLBalance(buyer.id, -removedListing.price);
    const newSellerTL = db.updateTLBalance(removedListing.sellerId, removedListing.price);

    const receivedItem = db.addItemToUser(buyer.id, removedListing.item);
    const seller = db.getUserById(removedListing.sellerId);

    socket.emit('market:buy_success', {
      item: receivedItem,
      newTLBalance: newBuyerTL,
      newBalance: buyer.balance,
      inventory: buyer.inventory
    });

    // Notify seller
    for (const [sId, info] of activeSockets.entries()) {
      if (info.userId === removedListing.sellerId) {
        io.to(sId).emit('market:item_sold_to_player', {
          itemName: removedListing.item.name,
          price: removedListing.price,
          buyerName: buyer.username,
          newTLBalance: newSellerTL,
          newBalance: seller ? seller.balance : 0
        });
      }
    }

    io.emit('market:updated', db.db.market);
  });

  // Wallet: Convert TL to Kasa Balance
  socket.on('wallet:convert_tl', (payload) => {
    const session = activeSockets.get(socket.id);
    if (!session) return;

    const caseCount = payload && payload.caseCount;
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

  // Upgrader: Upgrade skin or lose it
  socket.on('upgrade:roll', (payload) => {
    const session = activeSockets.get(socket.id);
    if (!session) return socket.emit('upgrade:error', { message: 'Lütfen önce giriş yapın.' });

    const { inputInstanceId, targetSkinId } = payload || {};
    if (!inputInstanceId || !targetSkinId) {
      return socket.emit('upgrade:error', { message: 'Yükseltilecek veya hedef eşya seçilmedi.' });
    }

    const targetSkin = ALL_SKINS_MAP.get(targetSkinId) || (typeof targetSkinId === 'string' ? ALL_SKINS_MAP.get(targetSkinId.trim()) : null);
    if (!targetSkin) {
      return socket.emit('upgrade:error', { message: 'Hedef skin bulunamadı.' });
    }

    const result = db.upgradeItem(session.userId, inputInstanceId, targetSkin, getOfficialBasePrice, secureRandom);
    if (!result.success) {
      return socket.emit('upgrade:error', { message: result.message });
    }

    // Send result to the user
    socket.emit('upgrade:result', result);

    // Announce big wins in global chat (multiplier >= 4 or targetPrice >= 2000)
    if (result.isWin && (result.multiplier >= 4 || targetSkin.basePrice >= 2000)) {
      const inName = (result.inputItem && result.inputItem.name) || 'Skin';
      const outName = (result.wonItem && result.wonItem.name) || targetSkin.name || 'Skin';
      const upgradeChatMsg = {
        id: 'sys_upg_' + Date.now(),
        userId: 'system',
        username: 'UPGRADER',
        text: `⚡ TEBRİKLER! [${session.username}] ${inName} eşyasını %${result.winChance} şansla (${result.multiplier}x) ${outName} eşyasına başarıyla yükseltti!`,
        timestamp: Date.now(),
        isHighlight: true
      };
      db.addChatMessage(upgradeChatMsg);
      io.emit('chat:message', upgradeChatMsg);
    }
  });

  // Admin: Give Balance (Password: ADMIN_PASSWORD)
  socket.on('admin:give_balance', (payload) => {
    const { password, targetUsername, tlAmount, caseAmount } = payload || {};
    if (!safeEqual(password || '', ADMIN_PASSWORD)) {
      if (!adminFailLimiter.take(clientIp)) {
        return socket.emit('admin:error', { message: 'Çok fazla yanlış şifre denemesi! Lütfen bekleyin.' });
      }
      return socket.emit('admin:error', { message: 'Hatalı yönetici şifresi!' });
    }
    adminFailLimiter.reset(clientIp);

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

    const addTL = Math.min(100000000, Math.max(0, Math.floor(Number(tlAmount) || 0)));
    const addCase = Math.min(1000, Math.max(0, Math.floor(Number(caseAmount) || 0)));

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

  // Trading: Fetch live inventory of target player
  socket.on('trade:get_inventory', (payload) => {
    const targetUserId = payload && payload.targetUserId;
    const target = typeof targetUserId === 'string' ? db.getUserById(targetUserId) : null;
    if (!target) {
      return socket.emit('trade:error', { message: 'Hedef oyuncu bulunamadı.' });
    }
    socket.emit('trade:target_inventory', {
      targetUserId: target.id,
      targetUsername: target.username,
      inventory: target.inventory || []
    });
  });

  // Trading: Propose trade offer
  socket.on('trade:create_offer', (payload) => {
    const session = activeSockets.get(socket.id);
    if (!session) return;

    const { targetUserId, offeredInstanceIds, requestedInstanceIds } = payload || {};
    const sender = db.getUserById(session.userId);
    const receiver = typeof targetUserId === 'string' ? db.getUserById(targetUserId) : null;

    if (!sender || !receiver || sender.id === receiver.id) {
      return socket.emit('trade:error', { message: 'Geçersiz takas hedefi.' });
    }

    // Deduplicate IDs to prevent trade-duplication exploits
    const cleanOfferedIds = Array.isArray(offeredInstanceIds) ? [...new Set(offeredInstanceIds.filter(id => typeof id === 'string'))] : [];
    const cleanRequestedIds = Array.isArray(requestedInstanceIds) ? [...new Set(requestedInstanceIds.filter(id => typeof id === 'string'))] : [];

    // Validate offered items
    const offeredItems = sender.inventory.filter(i => cleanOfferedIds.includes(i.instanceId));
    const requestedItems = receiver.inventory.filter(i => cleanRequestedIds.includes(i.instanceId));

    if (offeredItems.length === 0 && requestedItems.length === 0) {
      return socket.emit('trade:error', { message: 'Lütfen takasa eklemek veya istemek için en az bir eşya seçin.' });
    }

    // Limit active trade offers count to prevent spam
    if (db.db.tradeOffers.length > 500) {
      db.db.tradeOffers.splice(0, 100);
    }

    const tradeOffer = {
      id: 'trd_' + Date.now().toString(36) + '_' + crypto.randomBytes(3).toString('hex'),
      fromUserId: sender.id,
      fromUsername: sender.username,
      toUserId: receiver.id,
      toUsername: receiver.username,
      offeredItems,
      requestedItems,
      createdAt: Date.now()
    };

    db.db.tradeOffers.push(tradeOffer);

    socket.emit('trade:offer_sent', { 
      tradeOffer,
      message: `"${receiver.username}" kullanıcısına takas teklifiniz başarıyla iletildi!` 
    });

    // Send real-time notification to target
    for (const [sId, info] of activeSockets.entries()) {
      if (info.userId === receiver.id) {
        io.to(sId).emit('trade:incoming_offer', { tradeOffer });
      }
    }
  });

  // Trading: Accept trade
  socket.on('trade:accept_offer', (payload) => {
    const session = activeSockets.get(socket.id);
    if (!session) return;

    const tradeId = payload && payload.tradeId;
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

    // Verify all items are still in respective inventories without duplicate counting
    const userAInstIds = new Set(userA.inventory.map(i => i.instanceId));
    const userBInstIds = new Set(userB.inventory.map(i => i.instanceId));

    const aHasAll = offer.offeredItems.every(offered => userAInstIds.has(offered.instanceId));
    const bHasAll = offer.requestedItems.every(req => userBInstIds.has(req.instanceId));

    if (!aHasAll || !bHasAll) {
      db.db.tradeOffers.splice(offerIndex, 1);
      return socket.emit('trade:error', { message: 'Takastaki eşyalar artık envanterde bulunmuyor (satılmış veya aktarılmış olabilir).' });
    }

    // Atomically transfer items: only add if removed successfully!
    for (const item of offer.offeredItems) {
      const removed = db.removeItemFromUser(userA.id, item.instanceId);
      if (removed) {
        db.addItemToUser(userB.id, removed);
      }
    }
    for (const item of offer.requestedItems) {
      const removed = db.removeItemFromUser(userB.id, item.instanceId);
      if (removed) {
        db.addItemToUser(userA.id, item);
      }
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
  socket.on('trade:decline_offer', (payload) => {
    const session = activeSockets.get(socket.id);
    if (!session) return;

    const tradeId = payload && payload.tradeId;
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
  socket.on('chat:send_message', (payload) => {
    const session = activeSockets.get(socket.id);
    if (!session) return;

    if (!chatLimiter.take(session.userId)) {
      return; // flood protection
    }

    const cleanText = String((payload && payload.text) || '').trim().replace(/[\x00-\x1F\x7F]/g, '');
    if (!cleanText || cleanText.length > 200) return;

    const msg = {
      id: 'chat_' + Date.now().toString(36) + crypto.randomBytes(2).toString('hex'),
      userId: session.userId,
      username: session.username,
      text: cleanText,
      timestamp: Date.now()
    };

    db.addChatMessage(msg);
    io.emit('chat:message', msg);
  });

  // Inactivity Ping — Client sends 'activity:ping' to reset idle timer
  let inactivityTimer = null;
  const INACTIVITY_LIMIT_MS = 10 * 60 * 1000; // 10 minutes

  function resetInactivityTimer() {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      const session = activeSockets.get(socket.id);
      if (session) {
        console.log(`[INACTIVITY] Auto-logout: "${session.username}" (10 dk hareketsiz)`);
        socket.emit('auth:forced_logout', { message: '10 dakika hareketsiz kaldığınız için oturumunuz kapatıldı.' });
        socket.disconnect(true);
      }
    }, INACTIVITY_LIMIT_MS);
  }

  socket.on('activity:ping', () => {
    const session = activeSockets.get(socket.id);
    if (session) resetInactivityTimer();
  });

  // Disconnect Handling
  socket.on('disconnect', () => {
    if (inactivityTimer) clearTimeout(inactivityTimer);
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
