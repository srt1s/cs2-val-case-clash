const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_FILE = path.join(__dirname, 'database.json');

const MAX_KEYS = 1000;           // Max Anahtar sınırı
const MAX_TL = 1e12;             // TL üst sınırı (taşma/Infinity koruması)
const MAX_UPGRADE_RATIO = 1000;  // Upgrader'da hedef/girdi fiyat oranı üst sınırı
const UPGRADE_HOUSE_EDGE = 0.82; // %18 kasa avantajı (kullanıcı talebiyle daha da düşürüldü)
const UPGRADE_MAX_CHANCE = 65;   // Maksimum kazanma şansı (%)

function makeDefaultData() {
  return {
    users: {},         // userId -> User
    usernames: {},     // lowercase username -> userId
    hwids: {},         // hwid -> { userId, firstSeenAt, bonusClaimed: true }
    market: [],        // array of listings
    tradeOffers: [],   // active/pending trades
    chat: []           // message log
  };
}

let dbData = makeDefaultData();

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

// ------------------------------------------------------------------
// Persistence: debounced + atomic writes, corrupt-file protection
// ------------------------------------------------------------------
let saveTimer = null;
let dirty = false;

function writeNow() {
  if (!dirty) return;
  dirty = false;
  try {
    const tmp = DB_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(dbData), 'utf-8');
    fs.renameSync(tmp, DB_FILE); // atomic replace -> yarım yazılmış dosya riski yok
  } catch (err) {
    dirty = true;
    console.error('Error saving database:', err);
  }
}

function saveDb() {
  dirty = true;
  if (!saveTimer) {
    saveTimer = setTimeout(() => {
      saveTimer = null;
      writeNow();
    }, 300);
  }
}

function flushDb() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  writeNow();
}

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (parseErr) {
        // Bozuk dosyayı ezmeden önce yedekle (veri kaybını önler)
        const backupName = DB_FILE.replace(/\.json$/, '') + '.corrupt.' + Date.now() + '.json';
        try { fs.copyFileSync(DB_FILE, backupName); } catch (e) {}
        console.error('Database file is corrupt, backed up to:', backupName);
        parsed = null;
      }
      const base = makeDefaultData();
      if (parsed && typeof parsed === 'object') {
        for (const key of Object.keys(base)) {
          if (parsed[key] !== undefined && typeof parsed[key] === typeof base[key] && Array.isArray(parsed[key]) === Array.isArray(base[key])) {
            base[key] = parsed[key];
          }
        }
      }
      dbData = base;
    } else {
      dbData = makeDefaultData();
      saveDb();
    }
  } catch (err) {
    console.error('Error loading database:', err);
    dbData = makeDefaultData();
  }
}

loadDb();

process.on('exit', flushDb);
['SIGINT', 'SIGTERM'].forEach(sig => {
  process.on(sig, () => {
    flushDb();
    process.exit(0);
  });
});

// ------------------------------------------------------------------
// Change listener (server pushes signed snapshots to clients)
// ------------------------------------------------------------------
let changeListener = null;
function notifyChange(userId) {
  if (changeListener) {
    try { changeListener(userId); } catch (e) { /* ignore */ }
  }
}

// ------------------------------------------------------------------
// Password hashing (scrypt) with transparent legacy upgrade
// ------------------------------------------------------------------
function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pw, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(pw, stored) {
  if (typeof stored !== 'string' || !stored) return false;
  if (stored.startsWith('scrypt$')) {
    const parts = stored.split('$');
    if (parts.length !== 3) return false;
    const expected = Buffer.from(parts[2], 'hex');
    const calc = crypto.scryptSync(pw, parts[1], 64);
    return expected.length === calc.length && crypto.timingSafeEqual(expected, calc);
  }
  // Legacy (düz metin) kayıt: sabit zamanlı karşılaştır, başarılı girişte hash'e yükseltilir
  const a = Buffer.from(stored);
  const b = Buffer.from(pw);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function randomId(prefix) {
  return prefix + Date.now().toString(36) + '_' + crypto.randomBytes(4).toString('hex');
}

function isValidUsername(name) {
  return typeof name === 'string' && name.length >= 2 && name.length <= 20 && /^[\p{L}\p{N}_ .\-]+$/u.test(name);
}

function clampFinite(n, min, max, fallback = 0) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, v));
}

module.exports = {
  MAX_KEYS,
  MAX_UPGRADE_RATIO,
  isValidUsername,

  // Get all data reference
  get db() {
    return dbData;
  },
  save: saveDb,
  flush: flushDb,
  setChangeListener(fn) {
    changeListener = fn;
  },

  // User methods
  getUserById(id) {
    if (typeof id !== 'string' || !hasOwn(dbData.users, id)) return null;
    return dbData.users[id] || null;
  },

  getUserByUsername(username) {
    const key = String(username || '').toLowerCase().trim();
    if (!key || !hasOwn(dbData.usernames, key)) return null;
    const userId = dbData.usernames[key];
    return this.getUserById(userId);
  },

  // Login or register. `trustedBackup` MUST already be verified by the server (signed snapshot);
  // client-supplied raw data is never accepted here.
  loginOrRegister(username, password, hwid, trustedBackup) {
    const cleanUsername = String(username || '').trim().replace(/\s+/g, ' ');
    const cleanPassword = String(password || '').trim();
    const cleanHwid = String(hwid || ('HWID_' + Date.now().toString(36))).trim().slice(0, 128);
    const lowerUser = cleanUsername.toLowerCase();

    if (!cleanUsername) {
      return { success: false, message: 'Lütfen bir kullanıcı adı girin.' };
    }
    if (!cleanPassword) {
      return { success: false, message: 'Lütfen hesap şifrenizi girin.' };
    }
    if (cleanPassword.length > 64) {
      return { success: false, message: 'Şifre en fazla 64 karakter olabilir.' };
    }

    const isNewHwid = !hasOwn(dbData.hwids, cleanHwid);
    const existingUserId = hasOwn(dbData.usernames, lowerUser) ? dbData.usernames[lowerUser] : null;
    let user = existingUserId && hasOwn(dbData.users, existingUserId) ? dbData.users[existingUserId] : null;

    if (user) {
      // Password verification
      if (user.password) {
        if (!verifyPassword(cleanPassword, user.password)) {
          return {
            success: false,
            message: 'Bu kullanıcı adı zaten kayıtlı! Girdiğiniz şifre hatalı.'
          };
        }
        // Legacy plaintext -> scrypt upgrade
        if (!user.password.startsWith('scrypt$')) {
          user.password = hashPassword(cleanPassword);
        }
      } else {
        // Şifresi olmayan eski hesap: ilk girişte belirle
        user.password = hashPassword(cleanPassword);
      }
      user.hwid = cleanHwid;

      // RESTORE GUARD: Eğer mevcut kullanıcı hesabı sıfırlanmış/boş ise fakat güvenilir yedekte eşyaları/parası varsa kurtar
      if (trustedBackup) {
        const userEmpty = (!Array.isArray(user.inventory) || user.inventory.length === 0) &&
                          (!user.balance || user.balance === 0) &&
                          (!user.tlBalance || user.tlBalance === 0);
        const backupHasContent = (Array.isArray(trustedBackup.inventory) && trustedBackup.inventory.length > 0) ||
                                 (Number(trustedBackup.balance) > 0) ||
                                 (Number(trustedBackup.tlBalance) > 0);
        if (userEmpty && backupHasContent) {
          user.inventory = Array.isArray(trustedBackup.inventory) ? trustedBackup.inventory : [];
          user.balance = clampFinite(trustedBackup.balance, 0, MAX_KEYS);
          user.tlBalance = clampFinite(trustedBackup.tlBalance, 0, MAX_TL);
          saveDb();
          console.log(`[RESTORE] Successfully restored empty user "${cleanUsername}" from backup! Items: ${user.inventory.length}, TL: ${user.tlBalance}`);
        }
      }
    } else {
      // --- New registration ---
      if (!isValidUsername(cleanUsername)) {
        return {
          success: false,
          message: 'Kullanıcı adı 2-20 karakter olmalı; sadece harf, rakam, boşluk, "_", "." ve "-" içerebilir.'
        };
      }
      if (cleanPassword.length < 4) {
        return { success: false, message: 'Şifre en az 4 karakter olmalıdır.' };
      }

      const newUserId = (trustedBackup && typeof trustedBackup.id === 'string' && !hasOwn(dbData.users, trustedBackup.id))
        ? trustedBackup.id
        : randomId('usr_');

      user = {
        id: newUserId,
        username: cleanUsername,
        password: hashPassword(cleanPassword),
        hwid: cleanHwid,
        balance: trustedBackup ? clampFinite(trustedBackup.balance, 0, MAX_KEYS) : 0,
        tlBalance: trustedBackup ? clampFinite(trustedBackup.tlBalance, 0, MAX_TL) : 0,
        inventory: trustedBackup && Array.isArray(trustedBackup.inventory) ? trustedBackup.inventory : [],
        createdAt: Date.now()
      };

      dbData.users[newUserId] = user;
      dbData.usernames[lowerUser] = newUserId;
    }

    if (!Number.isFinite(user.tlBalance)) user.tlBalance = 0;
    if (!Number.isFinite(user.balance)) user.balance = 0;
    if (!Array.isArray(user.inventory)) user.inventory = [];

    // KEY TO TL MIGRATION: 1 Key = 34 TL
    if (user.balance > 0) {
      user.tlBalance = Math.min(MAX_TL, Math.max(0, Math.round(((user.tlBalance || 0) + user.balance * 34) * 100) / 100));
      user.balance = 0;
    }

    const bonusGiven = isNewHwid && (!trustedBackup || !trustedBackup.inventory || trustedBackup.inventory.length === 0);
    if (bonusGiven && (!user.tlBalance || user.tlBalance === 0)) {
      user.tlBalance = 170; // 5 x 34 TL starter bonus
    }

    // Ensure every inventory item has a valid, unique instanceId
    const seen = new Set();
    user.inventory = user.inventory.filter(item => item && typeof item === 'object');
    user.inventory.forEach(item => {
      if (!item.instanceId || seen.has(item.instanceId)) {
        item.instanceId = randomId('inv_');
      }
      seen.add(item.instanceId);
    });

    if (isNewHwid) {
      dbData.hwids[cleanHwid] = {
        userId: user.id,
        firstSeenAt: Date.now(),
        bonusClaimed: true
      };
    }

    saveDb();
    return {
      success: true,
      user,
      isNewHwid,
      bonusGiven
    };
  },

  // Add item to inventory
  addItemToUser(userId, item) {
    const user = this.getUserById(userId);
    if (!user || !item) return false;
    if (!Array.isArray(user.inventory)) user.inventory = [];

    const inventoryItem = {
      ...item,
      instanceId: randomId('inv_'),
      acquiredAt: Date.now()
    };
    user.inventory.push(inventoryItem);
    saveDb();
    notifyChange(userId);
    return inventoryItem;
  },

  // Remove item from inventory (strict instanceId match only)
  removeItemFromUser(userId, instanceId) {
    const user = this.getUserById(userId);
    if (!user || !Array.isArray(user.inventory) || typeof instanceId !== 'string') return null;
    const index = user.inventory.findIndex(i => i && i.instanceId === instanceId);
    if (index === -1) return null;
    const [removed] = user.inventory.splice(index, 1);
    saveDb();
    notifyChange(userId);
    return removed;
  },

  // Upgrader Engine: server-authoritative (price from catalog, strict ownership, no client-supplied items)
  // getPrice(item) -> official catalog price; randFloat() -> secure random in [0,1)
  upgradeItem(userId, inputInstanceId, targetSkin, getPrice, randFloat) {
    const user = this.getUserById(userId);
    if (!user) {
      return { success: false, message: 'Kullanıcı oturumu bulunamadı. Lütfen sayfayı yenileyin.' };
    }
    if (!Array.isArray(user.inventory)) user.inventory = [];
    if (typeof inputInstanceId !== 'string') {
      return { success: false, message: 'Geçersiz eşya.' };
    }

    const priceFn = (typeof getPrice === 'function') ? getPrice : (item => Number(item && (item.basePrice || item.price)) || 1);
    const randFn = (typeof randFloat === 'function') ? randFloat : Math.random;

    let index = user.inventory.findIndex(i => i && (i.instanceId === inputInstanceId || i.id === inputInstanceId));
    if (index === -1) {
      return { success: false, message: 'Yükseltilecek eşya envanterinizde bulunamadı.' };
    }

    const inputItem = user.inventory[index];

    // Champions Serisi Skinler Yükseltici Yasağı (Özel koleksiyon eşyaları yükseltilemez veya kazanılamaz)
    const isChampSkin = (it) => {
      if (!it) return false;
      const n = String(it.name || '').toLowerCase();
      const id = String(it.id || '').toLowerCase();
      return n.includes('champions') || id.includes('champs') || id.includes('champions');
    };

    if (isChampSkin(inputItem)) {
      return { success: false, message: 'Champions serisi skinler yükselticide feda edilemez veya kullanılamaz!' };
    }
    if (isChampSkin(targetSkin)) {
      return { success: false, message: 'Champions serisi skinler yükselticiden elde edilemez! (Upgrader yasağı)' };
    }

    const inputPrice = Math.max(1, Number(priceFn(inputItem)) || 1);
    const targetPrice = Math.max(1, Number(priceFn(targetSkin)) || 1);

    if (targetPrice <= inputPrice) {
      return { success: false, message: 'Hedef eşyanın fiyatı elinizdeki eşyadan daha yüksek olmalıdır.' };
    }
    if (targetPrice / inputPrice > MAX_UPGRADE_RATIO) {
      return { success: false, message: `Hedef eşya en fazla ${MAX_UPGRADE_RATIO}x değerinde olabilir.` };
    }

    // Fair chance calculation
    const rawChance = (inputPrice / targetPrice) * 100;
    const winChance = Math.min(UPGRADE_MAX_CHANCE, Math.max(0.5, Math.round(rawChance * UPGRADE_HOUSE_EDGE * 100) / 100));
    const multiplier = Math.round((targetPrice / inputPrice) * 100) / 100;

    // Roll 0.00 - 99.99 ; win only if strictly below chance
    const roll = Math.floor(randFn() * 10000) / 100;
    const isWin = roll < winChance;

    // Remove input item from inventory regardless of result
    user.inventory.splice(index, 1);

    let wonItem = null;
    if (isWin) {
      wonItem = {
        ...targetSkin,
        instanceId: randomId('upg_'),
        officialBasePrice: targetPrice,
        basePrice: targetPrice,
        acquiredAt: Date.now()
      };
      user.inventory.push(wonItem);
    }

    saveDb();
    notifyChange(userId);

    return {
      success: true,
      isWin,
      roll,
      winChance,
      multiplier,
      inputItem,
      wonItem,
      newInventory: user.inventory
    };
  },

  // Modify Kasa Opening Balance — Redirected to TL (1 Key = 34 TL)
  updateBalance(userId, delta) {
    const user = this.getUserById(userId);
    if (!user) return 0;
    const d = Number(delta);
    if (Number.isFinite(d) && d !== 0) {
      this.updateTLBalance(userId, d * 34);
    }
    user.balance = 0;
    saveDb();
    notifyChange(userId);
    return 0;
  },

  // Modify Turkish Liras Balance (₺ TL)
  updateTLBalance(userId, delta) {
    const user = this.getUserById(userId);
    if (!user) return null;
    const d = Number(delta);
    const current = Number.isFinite(user.tlBalance) ? user.tlBalance : 0;
    if (!Number.isFinite(d)) return current;
    user.tlBalance = Math.min(MAX_TL, Math.max(0, Math.round((current + d) * 100) / 100));
    saveDb();
    notifyChange(userId);
    return user.tlBalance;
  },

  // Convert TL to Key/Case Balance — Disabled since cases open with TL
  convertTLToCaseBalance(userId, count) {
    return {
      success: false,
      message: 'Kasalar artık doğrudan TL bakiyenizle açılmaktadır, anahtara gerek yoktur!'
    };
  },

  // Market methods
  addMarketListing(sellerId, sellerName, item, price) {
    const listing = {
      id: randomId('mkt_'),
      sellerId,
      sellerName,
      item,
      price: Number(price),
      listedAt: Date.now(),
      expiresAt: Date.now() + 30 * 60 * 1000 // 30 minutes
    };
    dbData.market.push(listing);
    saveDb();
    return listing;
  },

  removeMarketListing(listingId) {
    const index = dbData.market.findIndex(m => m.id === listingId);
    if (index === -1) return null;
    const [removed] = dbData.market.splice(index, 1);
    saveDb();
    return removed;
  },

  // Chat methods
  addChatMessage(msg) {
    dbData.chat.push(msg);
    while (dbData.chat.length > 100) {
      dbData.chat.shift();
    }
    saveDb();
    return msg;
  }
};
