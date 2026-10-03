const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'database.json');

// Default initial state
const defaultData = {
  users: {},         // userId -> User
  usernames: {},     // lowercase username -> userId
  hwids: {},         // hwid -> { userId, firstSeenAt, bonusClaimed: true }
  market: [],        // array of listings
  tradeOffers: [],   // active/pending trades
  chat: []           // message log
};

let dbData = { ...defaultData };

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      dbData = { ...defaultData, ...JSON.parse(raw) };
    } else {
      saveDb();
    }
  } catch (err) {
    console.error('Error loading database:', err);
    dbData = { ...defaultData };
  }
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database:', err);
  }
}

// Initialize db on startup
loadDb();

module.exports = {
  // Get all data reference
  get db() {
    return dbData;
  },
  save: saveDb,

  // User methods
  getUserById(id) {
    return dbData.users[id] || null;
  },

  getUserByUsername(username) {
    const userId = dbData.usernames[username.toLowerCase().trim()];
    if (!userId) return null;
    return dbData.users[userId] || null;
  },

  // HWID-based login with password protection & 5 balance initial bonus
  loginOrRegister(username, password, hwid, backupData) {
    const cleanUsername = String(username || 'Oyuncu').trim() || 'Oyuncu_' + Math.floor(Math.random() * 1000);
    const cleanPassword = String(password || '').trim();
    const cleanHwid = String(hwid || ('HWID_' + Date.now().toString(36))).trim();
    const lowerUser = cleanUsername.toLowerCase();

    if (!cleanPassword) {
      return {
        success: false,
        message: 'Lütfen hesap şifrenizi girin.'
      };
    }

    // Check if HWID is brand new
    const isNewHwid = !dbData.hwids[cleanHwid];

    // Check if username exists
    let existingUserId = dbData.usernames[lowerUser];
    let user = null;

    if (existingUserId) {
      user = dbData.users[existingUserId];

      // Password verification
      if (user.password && user.password !== cleanPassword) {
        return {
          success: false,
          message: 'Bu kullanıcı adı zaten kayıtlı! Girdiğiniz şifre hatalı.'
        };
      }

      // If existing user had no password set yet, set it now
      if (!user.password) {
        user.password = cleanPassword;
      }

      // Update HWID association
      user.hwid = cleanHwid;
      
      // If server was restarted and had empty/stale data but client has backup, merge/restore:
      if (backupData && typeof backupData === 'object') {
        if (Array.isArray(backupData.inventory) && backupData.inventory.length > (user.inventory ? user.inventory.length : 0)) {
          user.inventory = backupData.inventory;
        }
        if (typeof backupData.balance === 'number' && backupData.balance > user.balance) {
          user.balance = backupData.balance;
        }
        if (typeof backupData.tlBalance === 'number' && backupData.tlBalance > (user.tlBalance || 0)) {
          user.tlBalance = backupData.tlBalance;
        }
      }
    } else {
      // Create new user (restore from backup if available)
      const hasBackup = backupData && typeof backupData === 'object' && (Array.isArray(backupData.inventory) || typeof backupData.balance === 'number');
      const newUserId = (hasBackup && backupData.id) ? backupData.id : ('usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6));
      
      const initialBalance = hasBackup && typeof backupData.balance === 'number' ? backupData.balance : 0;
      const initialTL = hasBackup && typeof backupData.tlBalance === 'number' ? backupData.tlBalance : 0;
      const initialInv = hasBackup && Array.isArray(backupData.inventory) ? backupData.inventory : [];

      user = {
        id: newUserId,
        username: cleanUsername,
        password: cleanPassword,
        hwid: cleanHwid,
        balance: initialBalance,
        tlBalance: initialTL,
        inventory: initialInv,
        createdAt: Date.now()
      };

      dbData.users[newUserId] = user;
      dbData.usernames[lowerUser] = newUserId;
    }

    if (user.tlBalance === undefined) user.tlBalance = 0;
    if (user.balance === undefined) user.balance = 0;
    if (!Array.isArray(user.inventory)) user.inventory = [];

    // Ensure every inventory item has a valid, unique instanceId
    user.inventory.forEach(item => {
      if (!item.instanceId) {
        item.instanceId = 'inv_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
      }
    });

    // Mark HWID as registered
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
      bonusGiven: isNewHwid && (!backupData || !backupData.inventory || backupData.inventory.length === 0)
    };
  },

  // Add item to inventory
  addItemToUser(userId, item) {
    const user = dbData.users[userId];
    if (!user) return false;
    
    const instanceId = 'inv_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
    const inventoryItem = {
      ...item,
      instanceId,
      acquiredAt: Date.now()
    };
    user.inventory.push(inventoryItem);
    saveDb();
    return inventoryItem;
  },

  // Remove item from inventory (with fallback match by id)
  removeItemFromUser(userId, instanceId) {
    const user = dbData.users[userId];
    if (!user || !user.inventory) return null;
    let index = user.inventory.findIndex(i => i.instanceId === instanceId);
    if (index === -1 && typeof instanceId === 'string') {
      index = user.inventory.findIndex(i => i.id === instanceId || i._id === instanceId);
    }
    if (index === -1) return null;
    const [removed] = user.inventory.splice(index, 1);
    saveDb();
    return removed;
  },

  // Upgrader Engine: Upgrade skin or lose it (Guaranteed robust inventory matching)
  upgradeItem(userId, inputInstanceId, targetSkin, inputItemBackup = null) {
    let user = dbData.users[userId];
    if (!user) {
      return { success: false, message: 'Kullanıcı oturumu bulunamadı. Lütfen sayfayı yenileyin.' };
    }
    if (!Array.isArray(user.inventory)) user.inventory = [];

    let index = user.inventory.findIndex(i => i && (i.instanceId === inputInstanceId || i.id === inputInstanceId || i._id === inputInstanceId));
    
    // Fallback: match by name or ID if instanceId differed due to backup restore
    if (index === -1 && inputItemBackup) {
      index = user.inventory.findIndex(i => i && (i.name === inputItemBackup.name || i.id === inputItemBackup.id));
    }

    // Fallback 2: If item is in client backup but server was restarted empty, add it temporarily so it can be consumed
    let inputItem = null;
    if (index !== -1) {
      inputItem = user.inventory[index];
      user.inventory.splice(index, 1);
    } else if (inputItemBackup && typeof inputItemBackup === 'object' && inputItemBackup.name) {
      inputItem = inputItemBackup;
    } else {
      return { success: false, message: 'Yükseltilecek eşya envanterinizde bulunamadı.' };
    }

    const inputPrice = Math.max(1, Number(inputItem.officialBasePrice || inputItem.basePrice || 1));
    const targetPrice = Math.max(1, Number(targetSkin.basePrice || targetSkin.price || 1));

    if (targetPrice <= inputPrice) {
      return { success: false, message: 'Hedef eşyanın fiyatı elinizdeki eşyadan daha yüksek olmalıdır.' };
    }

    // Calculate chance: House edge 5% -> rawChance * 0.95, clamp 0.5% - 85%
    const rawChance = (inputPrice / targetPrice) * 100;
    const winChance = Math.min(85, Math.max(0.5, Math.round(rawChance * 0.95 * 100) / 100));
    const multiplier = Math.round((targetPrice / inputPrice) * 100) / 100;

    // Roll number 0.00 - 100.00
    const roll = Math.round(Math.random() * 10000) / 100;
    const isWin = roll <= winChance;

    let wonItem = null;
    if (isWin) {
      const newInstId = 'upg_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
      wonItem = {
        ...targetSkin,
        instanceId: newInstId,
        officialBasePrice: targetPrice,
        basePrice: targetPrice,
        acquiredAt: Date.now()
      };
      user.inventory.push(wonItem);
    }

    saveDb();

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

  // Modify Kasa Opening Balance (1 Kasa = 1 Bakiye) — Max 1000 Anahtar
  updateBalance(userId, delta) {
    const user = dbData.users[userId];
    if (!user) return null;
    const MAX_KEYS = 1000;
    user.balance = Math.min(MAX_KEYS, Math.max(0, Math.round((user.balance + delta) * 100) / 100));
    saveDb();
    return user.balance;
  },

  // Modify Turkish Liras Balance (₺ TL)
  updateTLBalance(userId, delta) {
    const user = dbData.users[userId];
    if (!user) return null;
    if (user.tlBalance === undefined) user.tlBalance = 0;
    user.tlBalance = Math.max(0, Math.round((user.tlBalance + delta) * 100) / 100);
    saveDb();
    return user.tlBalance;
  },

  // Convert TL to Key/Case Balance (20 TL = 1 Anahtar) — Max 1000 Anahtar Sınırı
  convertTLToCaseBalance(userId, count) {
    const user = dbData.users[userId];
    if (!user) return { success: false, message: 'Kullanıcı bulunamadı.' };
    
    const MAX_KEYS = 1000;
    const currentBalance = user.balance || 0;
    const spaceLeft = Math.max(0, MAX_KEYS - currentBalance);
    if (spaceLeft <= 0) {
      return { 
        success: false, 
        message: 'Zaten maksimum 1.000 anahtar sınırındasınız! Daha fazla anahtar alamazsınız.' 
      };
    }

    const caseCount = parseInt(count, 10);
    if (isNaN(caseCount) || caseCount <= 0) {
      return { success: false, message: 'Geçersiz anahtar miktarı.' };
    }

    if (caseCount > spaceLeft) {
      return { 
        success: false, 
        message: `Maksimum 1.000 anahtar sınırını aşamazsınız! En fazla ${spaceLeft} anahtar daha alabilirsiniz.` 
      };
    }

    const requiredTL = caseCount * 20;
    if (user.tlBalance === undefined) user.tlBalance = 0;
    if (user.tlBalance < requiredTL) {
      return { 
        success: false, 
        message: `Yetersiz TL bakiyesi! ${caseCount} anahtar almak için ₺${requiredTL} gerekiyor. Mevcut TL: ₺${user.tlBalance}` 
      };
    }

    user.tlBalance = Math.round((user.tlBalance - requiredTL) * 100) / 100;
    user.balance = Math.min(MAX_KEYS, (user.balance || 0) + caseCount);
    saveDb();

    return {
      success: true,
      convertedCases: caseCount,
      costTL: requiredTL,
      newTL: user.tlBalance,
      newBalance: user.balance
    };
  },

  // Deposit Demo TL
  depositDemoTL(userId, amount) {
    const user = dbData.users[userId];
    if (!user) return null;
    if (user.tlBalance === undefined) user.tlBalance = 0;
    user.tlBalance = Math.round((user.tlBalance + Number(amount)) * 100) / 100;
    saveDb();
    return user.tlBalance;
  },

  // Market methods
  addMarketListing(sellerId, sellerName, item, price) {
    const listingId = 'mkt_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
    const listing = {
      id: listingId,
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
    if (dbData.chat.length > 100) {
      dbData.chat.shift();
    }
    saveDb();
    return msg;
  }
};
