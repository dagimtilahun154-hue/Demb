import AsyncStorage from '@react-native-async-storage/async-storage';

let SQLite: any = null;
let dbSync: any = null;
let dbAsync: any = null;
let isSQLiteAvailable = false;

try {
  SQLite = require('expo-sqlite');
  if (SQLite) {
    // Attempt Expo SDK 50+ SQLite API
    if (SQLite.openDatabaseSync) {
      dbSync = SQLite.openDatabaseSync('demb_v3.db');
      isSQLiteAvailable = true;
      console.log('[DB] expo-sqlite loaded successfully (Synchronous API)');
    } else if (SQLite.openDatabase) {
      dbAsync = SQLite.openDatabase('demb_v3.db', '1.0', 'Demb DB', 200000);
      isSQLiteAvailable = true;
      console.log('[DB] expo-sqlite loaded successfully (Legacy API)');
    }
  }
} catch (e) {
  console.log('[DB] expo-sqlite not loaded, using AsyncStorage fallback', e);
}

// Fallback keys for AsyncStorage
const KEYS = {
  USER: '@demb_db_user',
  LOGS: '@demb_db_logs',
  MISSIONS: '@demb_db_missions',
  SYNC_QUEUE: '@demb_db_sync_queue',
  SOCIAL_LOGS: '@demb_db_social_logs',
};

// Initialize tables if using SQLite
export const initDb = async () => {
  if (!isSQLiteAvailable) {
    return;
  }

  try {
    if (dbSync) {
      // New Sync API
      dbSync.execSync(`
        CREATE TABLE IF NOT EXISTS user_settings (
          key TEXT PRIMARY KEY,
          value TEXT
        );
        CREATE TABLE IF NOT EXISTS energy_logs (
          id TEXT PRIMARY KEY,
          type TEXT,
          category TEXT,
          title TEXT,
          durationMinutes INTEGER,
          intensity TEXT,
          scoreValue INTEGER,
          notes TEXT,
          createdAt TEXT
        );
        CREATE TABLE IF NOT EXISTS completed_missions (
          id TEXT PRIMARY KEY,
          completedAt TEXT
        );
        CREATE TABLE IF NOT EXISTS sync_queue (
          id TEXT PRIMARY KEY,
          action TEXT,
          payload TEXT,
          timestamp INTEGER
        );
        CREATE TABLE IF NOT EXISTS social_usage_logs (
          id TEXT PRIMARY KEY,
          app TEXT,
          durationMinutes INTEGER,
          timestamp INTEGER
        );
      `);
      console.log('[DB] SQLite tables initialized (Sync API)');
    } else if (dbAsync) {
      // Old Async API
      await new Promise<void>((resolve, reject) => {
        dbAsync.transaction((tx: any) => {
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS user_settings (
              key TEXT PRIMARY KEY,
              value TEXT
            );
          `);
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS energy_logs (
              id TEXT PRIMARY KEY,
              type TEXT,
              category TEXT,
              title TEXT,
              durationMinutes INTEGER,
              intensity TEXT,
              scoreValue INTEGER,
              notes TEXT,
              createdAt TEXT
            );
          `);
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS completed_missions (
              id TEXT PRIMARY KEY,
              completedAt TEXT
            );
          `);
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS sync_queue (
              id TEXT PRIMARY KEY,
              action TEXT,
              payload TEXT,
              timestamp INTEGER
            );
          `);
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS social_usage_logs (
              id TEXT PRIMARY KEY,
              app TEXT,
              durationMinutes INTEGER,
              timestamp INTEGER
            );
          `, [], () => {
            console.log('[DB] SQLite tables initialized (Legacy API)');
            resolve();
          }, (_: any, error: any) => {
            reject(error);
          });
        });
      });
    }
  } catch (err) {
    console.error('[DB] Failed to initialize SQLite tables', err);
    // Graceful fallback to AsyncStorage is already active
  }
};

// USER SETTINGS
export const saveDbUser = async (user: any) => {
  if (isSQLiteAvailable) {
    try {
      const userStr = JSON.stringify(user);
      if (dbSync) {
        dbSync.runSync(
          'INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)',
          ['profile', userStr]
        );
      } else if (dbAsync) {
        dbAsync.transaction((tx: any) => {
          tx.executeSql('INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)', ['profile', userStr]);
        });
      }
      return;
    } catch (e) {
      console.warn('[DB] SQLite saveDbUser failed, writing to AsyncStorage', e);
    }
  }
  await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
};

export const getDbUser = async (): Promise<any | null> => {
  if (isSQLiteAvailable) {
    try {
      if (dbSync) {
        const result = dbSync.getFirstSync('SELECT value FROM user_settings WHERE key = ?', ['profile']);
        if (result && result.value) {
          return JSON.parse(result.value);
        }
      } else if (dbAsync) {
        const result = await new Promise<any>((resolve) => {
          dbAsync.transaction((tx: any) => {
            tx.executeSql('SELECT value FROM user_settings WHERE key = ?', ['profile'], (_: any, results: any) => {
              if (results.rows.length > 0) {
                resolve(results.rows.item(0));
              } else {
                resolve(null);
              }
            }, () => resolve(null));
          });
        });
        if (result && result.value) {
          return JSON.parse(result.value);
        }
      }
    } catch (e) {
      console.warn('[DB] SQLite getDbUser failed, reading from AsyncStorage', e);
    }
  }
  const saved = await AsyncStorage.getItem(KEYS.USER);
  return saved ? JSON.parse(saved) : null;
};

// ENERGY LOGS
export const addDbLog = async (log: any) => {
  if (isSQLiteAvailable) {
    try {
      if (dbSync) {
        dbSync.runSync(
          `INSERT OR REPLACE INTO energy_logs 
          (id, type, category, title, durationMinutes, intensity, scoreValue, notes, createdAt) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [log.id, log.type, log.category, log.title, log.durationMinutes, log.intensity, log.scoreValue, log.notes, log.createdAt]
        );
        return;
      } else if (dbAsync) {
        dbAsync.transaction((tx: any) => {
          tx.executeSql(
            `INSERT OR REPLACE INTO energy_logs 
            (id, type, category, title, durationMinutes, intensity, scoreValue, notes, createdAt) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [log.id, log.type, log.category, log.title, log.durationMinutes, log.intensity, log.scoreValue, log.notes, log.createdAt]
          );
        });
        return;
      }
    } catch (e) {
      console.warn('[DB] SQLite addDbLog failed', e);
    }
  }
  const logs = await getDbLogs();
  const updated = [log, ...logs.filter((l: any) => l.id !== log.id)];
  await AsyncStorage.setItem(KEYS.LOGS, JSON.stringify(updated));
};

export const deleteDbLog = async (id: string) => {
  if (isSQLiteAvailable) {
    try {
      if (dbSync) {
        dbSync.runSync('DELETE FROM energy_logs WHERE id = ?', [id]);
        return;
      } else if (dbAsync) {
        dbAsync.transaction((tx: any) => {
          tx.executeSql('DELETE FROM energy_logs WHERE id = ?', [id]);
        });
        return;
      }
    } catch (e) {
      console.warn('[DB] SQLite deleteDbLog failed', e);
    }
  }
  const logs = await getDbLogs();
  const updated = logs.filter((l: any) => l.id !== id);
  await AsyncStorage.setItem(KEYS.LOGS, JSON.stringify(updated));
};

export const getDbLogs = async (): Promise<any[]> => {
  if (isSQLiteAvailable) {
    try {
      if (dbSync) {
        const rows = dbSync.getAllSync('SELECT * FROM energy_logs ORDER BY createdAt DESC');
        return rows || [];
      } else if (dbAsync) {
        return await new Promise<any[]>((resolve) => {
          dbAsync.transaction((tx: any) => {
            tx.executeSql('SELECT * FROM energy_logs ORDER BY createdAt DESC', [], (_: any, results: any) => {
              const list = [];
              for (let i = 0; i < results.rows.length; i++) {
                list.push(results.rows.item(i));
              }
              resolve(list);
            }, () => resolve([]));
          });
        });
      }
    } catch (e) {
      console.warn('[DB] SQLite getDbLogs failed', e);
    }
  }
  const saved = await AsyncStorage.getItem(KEYS.LOGS);
  return saved ? JSON.parse(saved) : [];
};

// COMPLETED MISSIONS
export const addDbCompletedMission = async (id: string) => {
  if (isSQLiteAvailable) {
    try {
      const now = new Date().toISOString();
      if (dbSync) {
        dbSync.runSync('INSERT OR REPLACE INTO completed_missions (id, completedAt) VALUES (?, ?)', [id, now]);
        return;
      } else if (dbAsync) {
        dbAsync.transaction((tx: any) => {
          tx.executeSql('INSERT OR REPLACE INTO completed_missions (id, completedAt) VALUES (?, ?)', [id, now]);
        });
        return;
      }
    } catch (e) {
      console.warn('[DB] SQLite addDbCompletedMission failed', e);
    }
  }
  const list = await getDbCompletedMissions();
  if (!list.includes(id)) {
    const updated = [...list, id];
    await AsyncStorage.setItem(KEYS.MISSIONS, JSON.stringify(updated));
  }
};

export const getDbCompletedMissions = async (): Promise<string[]> => {
  if (isSQLiteAvailable) {
    try {
      if (dbSync) {
        const rows = dbSync.getAllSync('SELECT id FROM completed_missions');
        return (rows || []).map((r: any) => r.id);
      } else if (dbAsync) {
        return await new Promise<string[]>((resolve) => {
          dbAsync.transaction((tx: any) => {
            tx.executeSql('SELECT id FROM completed_missions', [], (_: any, results: any) => {
              const list = [];
              for (let i = 0; i < results.rows.length; i++) {
                list.push(results.rows.item(i).id);
              }
              resolve(list);
            }, () => resolve([]));
          });
        });
      }
    } catch (e) {
      console.warn('[DB] SQLite getDbCompletedMissions failed', e);
    }
  }
  const saved = await AsyncStorage.getItem(KEYS.MISSIONS);
  return saved ? JSON.parse(saved) : [];
};

// SYNC QUEUE
export const queueSyncItem = async (action: string, payload: any) => {
  const item = {
    id: Math.random().toString(36).substr(2, 9),
    action,
    payload: JSON.stringify(payload),
    timestamp: Date.now(),
  };

  if (isSQLiteAvailable) {
    try {
      if (dbSync) {
        dbSync.runSync(
          'INSERT INTO sync_queue (id, action, payload, timestamp) VALUES (?, ?, ?, ?)',
          [item.id, item.action, item.payload, item.timestamp]
        );
        return;
      } else if (dbAsync) {
        dbAsync.transaction((tx: any) => {
          tx.executeSql(
            'INSERT INTO sync_queue (id, action, payload, timestamp) VALUES (?, ?, ?, ?)',
            [item.id, item.action, item.payload, item.timestamp]
          );
        });
        return;
      }
    } catch (e) {
      console.warn('[DB] SQLite queueSyncItem failed', e);
    }
  }

  const queue = await getSyncQueue();
  const updated = [...queue, item];
  await AsyncStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify(updated));
};

export const getSyncQueue = async (): Promise<any[]> => {
  if (isSQLiteAvailable) {
    try {
      if (dbSync) {
        const rows = dbSync.getAllSync('SELECT * FROM sync_queue ORDER BY timestamp ASC');
        return rows || [];
      } else if (dbAsync) {
        return await new Promise<any[]>((resolve) => {
          dbAsync.transaction((tx: any) => {
            tx.executeSql('SELECT * FROM sync_queue ORDER BY timestamp ASC', [], (_: any, results: any) => {
              const list = [];
              for (let i = 0; i < results.rows.length; i++) {
                list.push(results.rows.item(i));
              }
              resolve(list);
            }, () => resolve([]));
          });
        });
      }
    } catch (e) {
      console.warn('[DB] SQLite getSyncQueue failed', e);
    }
  }
  const saved = await AsyncStorage.getItem(KEYS.SYNC_QUEUE);
  return saved ? JSON.parse(saved) : [];
};

export const removeSyncItems = async (ids: string[]) => {
  if (ids.length === 0) return;

  if (isSQLiteAvailable) {
    try {
      if (dbSync) {
        const placeholders = ids.map(() => '?').join(',');
        dbSync.runSync(`DELETE FROM sync_queue WHERE id IN (${placeholders})`, ids);
        return;
      } else if (dbAsync) {
        dbAsync.transaction((tx: any) => {
          const placeholders = ids.map(() => '?').join(',');
          tx.executeSql(`DELETE FROM sync_queue WHERE id IN (${placeholders})`, ids);
        });
        return;
      }
    } catch (e) {
      console.warn('[DB] SQLite removeSyncItems failed', e);
    }
  }

  const queue = await getSyncQueue();
  const updated = queue.filter(item => !ids.includes(item.id));
  await AsyncStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify(updated));
};

// SOCIAL MEDIA USAGE LOGS (Sliding 2-Hour window)
export const addSocialUsageLog = async (app: string, durationMinutes: number) => {
  const item = {
    id: Math.random().toString(36).substr(2, 9),
    app,
    durationMinutes,
    timestamp: Date.now(),
  };

  if (isSQLiteAvailable) {
    try {
      if (dbSync) {
        dbSync.runSync(
          'INSERT INTO social_usage_logs (id, app, durationMinutes, timestamp) VALUES (?, ?, ?, ?)',
          [item.id, item.app, item.durationMinutes, item.timestamp]
        );
        return;
      } else if (dbAsync) {
        dbAsync.transaction((tx: any) => {
          tx.executeSql(
            'INSERT INTO social_usage_logs (id, app, durationMinutes, timestamp) VALUES (?, ?, ?, ?)',
            [item.id, item.app, item.durationMinutes, item.timestamp]
          );
        });
        return;
      }
    } catch (e) {
      console.warn('[DB] SQLite addSocialUsageLog failed', e);
    }
  }

  const logs = await getSocialUsageLogs(0);
  const updated = [...logs, item];
  await AsyncStorage.setItem(KEYS.SOCIAL_LOGS, JSON.stringify(updated));
};

export const getSocialUsageLogs = async (sinceTimestamp: number): Promise<any[]> => {
  if (isSQLiteAvailable) {
    try {
      if (dbSync) {
        const rows = dbSync.getAllSync(
          'SELECT * FROM social_usage_logs WHERE timestamp >= ? ORDER BY timestamp ASC',
          [sinceTimestamp]
        );
        return rows || [];
      } else if (dbAsync) {
        return await new Promise<any[]>((resolve) => {
          dbAsync.transaction((tx: any) => {
            tx.executeSql(
              'SELECT * FROM social_usage_logs WHERE timestamp >= ? ORDER BY timestamp ASC',
              [sinceTimestamp],
              (_: any, results: any) => {
                const list = [];
                for (let i = 0; i < results.rows.length; i++) {
                  list.push(results.rows.item(i));
                }
                resolve(list);
              },
              () => resolve([])
            );
          });
        });
      }
    } catch (e) {
      console.warn('[DB] SQLite getSocialUsageLogs failed', e);
    }
  }

  const saved = await AsyncStorage.getItem(KEYS.SOCIAL_LOGS);
  const logs = saved ? JSON.parse(saved) : [];
  return logs.filter((l: any) => l.timestamp >= sinceTimestamp);
};

// Clean up old social usage logs (older than 24 hours) to keep storage small
export const pruneOldSocialLogs = async () => {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  if (isSQLiteAvailable) {
    try {
      if (dbSync) {
        dbSync.runSync('DELETE FROM social_usage_logs WHERE timestamp < ?', [oneDayAgo]);
        return;
      } else if (dbAsync) {
        dbAsync.transaction((tx: any) => {
          tx.executeSql('DELETE FROM social_usage_logs WHERE timestamp < ?', [oneDayAgo]);
        });
        return;
      }
    } catch (e) {
      console.warn('[DB] SQLite pruneOldSocialLogs failed', e);
    }
  }
  const logs = await getSocialUsageLogs(0);
  const updated = logs.filter((l: any) => l.timestamp >= oneDayAgo);
  await AsyncStorage.setItem(KEYS.SOCIAL_LOGS, JSON.stringify(updated));
};
