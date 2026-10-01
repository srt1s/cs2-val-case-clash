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

  // HWID-based login & 5 balance initial bonus
  loginOrRegister(username, hwid) {
    const cleanUsername = username.trim();
    const cleanHwid = hwid.trim();
    const lowerUser = cleanUsername.toLowerCase();

    // Check if HWID is brand new
    const isNewHwid = !dbData.hwids[cleanHwid];

    // Check if username exists
    let existingUserId = dbData.usernames[lowerUser];
    let user = null;

    if (existingUserId) {
      user = dbData.users[existingUserId];
      // Update HWID association
      user.hwid = cleanHwid;
    } else {
      // Create new user
      const newUserId = 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
      
      // If HWID is first time, give 5 balance. Otherwise, multi-account on same HWID starts with 0
      const initialBalance = isNewHwid ? 5 : 0;

      user = {
        id: newUserId,
        username: cleanUsername,
        hwid: cleanHwid,
        balance: initialBalance,
        inventory: [],
        createdAt: Date.now()
      };

      dbData.users[newUserId] = user;
      dbData.usernames[lowerUser] = newUserId;
    }

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
      user,
      isNewHwid,
      bonusGiven: isNewHwid
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

  // Remove item from inventory
  removeItemFromUser(userId, instanceId) {
    const user = dbData.users[userId];
    if (!user) return null;
    const index = user.inventory.findIndex(i => i.instanceId === instanceId);
    if (index === -1) return null;
    const [removed] = user.inventory.splice(index, 1);
    saveDb();
    return removed;
  },

  // Modify balance
  updateBalance(userId, delta) {
    const user = dbData.users[userId];
    if (!user) return null;
    user.balance = Math.max(0, Math.round((user.balance + delta) * 100) / 100);
    saveDb();
    return user.balance;
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
