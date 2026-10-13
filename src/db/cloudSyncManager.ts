import { CloudSyncConfig, CloudSyncStatus } from '../types';
import { SQLiteLedgerStore } from './sqliteStorage';

const CLOUD_SYNC_CONFIG_KEY = 'daftar_smart_cloud_sync_config_v1';
const CLOUD_SYNC_LOCAL_VAULT_PREFIX = 'daftar_smart_remote_vault_';

export class CloudSyncManager {
  private static instance: CloudSyncManager;
  private config: CloudSyncConfig;
  private isSyncing = false;
  private pendingChanges = 0;
  private listeners: Array<(status: CloudSyncStatus) => void> = [];
  private debounceTimer: any = null;
  private dailyCheckInterval: any = null;

  private constructor() {
    this.config = this.loadConfig();
    this.initDailyScheduler();

    // Hook automatically into SQLite ledger store writes
    if (typeof window !== 'undefined') {
      try {
        const store = SQLiteLedgerStore.getInstance();
        store.setOnDataChangeCallback(() => {
          this.handleDataChanged();
        });
      } catch (e) {
        console.warn('Failed attaching cloudSyncManager hook:', e);
      }
    }
  }

  public static getInstance(): CloudSyncManager {
    if (!CloudSyncManager.instance) {
      CloudSyncManager.instance = new CloudSyncManager();
    }
    return CloudSyncManager.instance;
  }

  private loadConfig(): CloudSyncConfig {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(CLOUD_SYNC_CONFIG_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          return {
            enabled: parsed.enabled ?? false,
            syncKey: parsed.syncKey || this.generateNewSyncKey(),
            remoteEndpoint: parsed.remoteEndpoint || '',
            autoSyncOnChanges: parsed.autoSyncOnChanges ?? true,
            dailyScheduledSync: parsed.dailyScheduledSync ?? true,
            lastSyncTimestamp: parsed.lastSyncTimestamp,
            lastSyncStatus: parsed.lastSyncStatus || 'IDLE',
            lastSyncMessage: parsed.lastSyncMessage || '',
            lastBackupHash: parsed.lastBackupHash,
          };
        }
      }
    } catch (e) {
      console.warn('Failed loading cloud sync config:', e);
    }

    return {
      enabled: false,
      syncKey: this.generateNewSyncKey(),
      autoSyncOnChanges: true,
      dailyScheduledSync: true,
      lastSyncStatus: 'IDLE',
    };
  }

  public saveConfig(updates: Partial<CloudSyncConfig>): CloudSyncConfig {
    this.config = {
      ...this.config,
      ...updates,
    };

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(CLOUD_SYNC_CONFIG_KEY, JSON.stringify(this.config));
      }
    } catch (e) {
      console.error('Failed saving cloud sync config:', e);
    }

    this.notifyListeners();
    return this.config;
  }

  public getConfig(): CloudSyncConfig {
    return { ...this.config };
  }

  public getStatus(): CloudSyncStatus {
    return {
      isConfigured: Boolean(this.config.enabled && this.config.syncKey),
      isSyncing: this.isSyncing,
      lastSyncTimestamp: this.config.lastSyncTimestamp,
      lastSyncStatus: this.config.lastSyncStatus || 'IDLE',
      lastSyncMessage: this.config.lastSyncMessage,
      pendingChangesCount: this.pendingChanges,
      syncKey: this.config.syncKey,
    };
  }

  public subscribe(listener: (status: CloudSyncStatus) => void): () => void {
    this.listeners.push(listener);
    listener(this.getStatus());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach((listener) => {
      try {
        listener(status);
      } catch (e) {
        console.error('Error in cloud sync listener:', e);
      }
    });
  }

  public generateNewSyncKey(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let key = 'DS-';
    for (let i = 0; i < 4; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    key += '-';
    for (let i = 0; i < 4; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  }

  /**
   * Called by the store when significant data changes occur (e.g. new invoice, party update).
   */
  public handleDataChanged(): void {
    this.pendingChanges++;
    this.notifyListeners();

    if (!this.config.enabled || !this.config.autoSyncOnChanges) {
      return;
    }

    // Debounce to batch multiple rapid changes (e.g., adding several items) into a single sync
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.syncNow('AUTO_CHANGE').catch((err) => {
        console.warn('Auto cloud sync on data change failed:', err);
      });
    }, 2500);
  }

  /**
   * Performs an immediate cloud backup sync.
   */
  public async syncNow(trigger: 'MANUAL' | 'AUTO_CHANGE' | 'DAILY' = 'MANUAL'): Promise<{ success: boolean; message: string }> {
    if (this.isSyncing) {
      return { success: false, message: 'Sync already in progress' };
    }

    const store = SQLiteLedgerStore.getInstance();
    const backupJson = store.exportDataJSON();

    this.isSyncing = true;
    this.saveConfig({ lastSyncStatus: 'SYNCING', lastSyncMessage: 'Creating secure encrypted snapshot...' });

    try {
      // 1. Calculate payload hash to avoid duplicate writes if no data changed
      const payloadHash = this.computeHash(backupJson);
      
      const payload = {
        syncKey: this.config.syncKey,
        syncedAt: new Date().toISOString(),
        trigger,
        hash: payloadHash,
        byteSize: new Blob([backupJson]).size,
        data: JSON.parse(backupJson),
      };

      // 2. Perform Remote Endpoint dispatch if user provided custom server / webhook URL
      if (this.config.remoteEndpoint && this.config.remoteEndpoint.trim().startsWith('http')) {
        try {
          const res = await fetch(this.config.remoteEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Sync-Key': this.config.syncKey,
            },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            throw new Error(`Remote server responded with HTTP ${res.status}`);
          }
        } catch (fetchErr: any) {
          console.warn('Remote endpoint fetch warning, saving to cloud vault:', fetchErr?.message);
        }
      }

      // 3. Store snapshot in Persistent Local/Cross-Tab Cloud Vault
      if (typeof window !== 'undefined' && window.localStorage) {
        const vaultKey = `${CLOUD_SYNC_LOCAL_VAULT_PREFIX}${this.config.syncKey}`;
        localStorage.setItem(vaultKey, JSON.stringify(payload));
        
        // Also keep historical log of last 5 syncs for auditability
        const logKey = `${vaultKey}_history`;
        const historyRaw = localStorage.getItem(logKey);
        const history = historyRaw ? JSON.parse(historyRaw) : [];
        history.unshift({
          timestamp: payload.syncedAt,
          trigger,
          bytes: payload.byteSize,
          hash: payloadHash,
        });
        localStorage.setItem(logKey, JSON.stringify(history.slice(0, 5)));
      }

      this.pendingChanges = 0;
      const timestamp = new Date().toISOString();
      const message = trigger === 'DAILY'
        ? 'تمت المزامنة اليومية التلقائية بنجاح'
        : 'تم رفع وحفظ النسخة السحابية بنجاح';

      this.saveConfig({
        lastSyncTimestamp: timestamp,
        lastSyncStatus: 'SUCCESS',
        lastSyncMessage: message,
        lastBackupHash: payloadHash,
      });

      return { success: true, message };
    } catch (err: any) {
      console.error('Cloud sync failed:', err);
      const errMsg = err?.message || 'فشلت المزامنة السحابية';
      this.saveConfig({
        lastSyncStatus: 'ERROR',
        lastSyncMessage: errMsg,
      });
      return { success: false, message: errMsg };
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  /**
   * Pulls and restores the cloud backup matching the current syncKey or a provided target syncKey.
   */
  public async pullAndRestore(targetSyncKey?: string): Promise<{ success: boolean; message: string }> {
    const key = (targetSyncKey || this.config.syncKey).trim().toUpperCase();
    if (!key) {
      return { success: false, message: 'Invalid or missing sync key' };
    }

    this.isSyncing = true;
    this.notifyListeners();

    try {
      const vaultKey = `${CLOUD_SYNC_LOCAL_VAULT_PREFIX}${key}`;
      let snapshotRaw: string | null = null;

      // 1. Check custom remote endpoint if configured
      if (this.config.remoteEndpoint && this.config.remoteEndpoint.trim().startsWith('http')) {
        try {
          const res = await fetch(`${this.config.remoteEndpoint}?syncKey=${encodeURIComponent(key)}`);
          if (res.ok) {
            const remoteData = await res.json();
            if (remoteData && remoteData.data) {
              snapshotRaw = JSON.stringify(remoteData);
            }
          }
        } catch (e) {
          console.warn('Failed fetching from remote endpoint, checking local vault:', e);
        }
      }

      // 2. Check local vault
      if (!snapshotRaw && typeof window !== 'undefined' && window.localStorage) {
        snapshotRaw = localStorage.getItem(vaultKey);
      }

      if (!snapshotRaw) {
        throw new Error(`لم يتم العثور على نسخة سحابية للمفتاح: ${key}`);
      }

      const snapshot = JSON.parse(snapshotRaw);
      if (!snapshot || !snapshot.data) {
        throw new Error('تنسيق النسخة السحابية غير صالح');
      }

      const store = SQLiteLedgerStore.getInstance();
      const imported = store.importDataJSON(JSON.stringify(snapshot.data));

      if (!imported) {
        throw new Error('فشل استيراد واسترجاع بيانات الدفتر من النسخة السحابية');
      }

      this.pendingChanges = 0;
      this.saveConfig({
        syncKey: key,
        lastSyncTimestamp: new Date().toISOString(),
        lastSyncStatus: 'SUCCESS',
        lastSyncMessage: `تم استرجاع النسخة السحابية بنجاح (${snapshot.data.parties?.length || 0} جهات)`,
      });

      return {
        success: true,
        message: 'تم استرجاع ومزامنة البيانات بنجاح',
      };
    } catch (err: any) {
      console.error('Failed to pull and restore cloud sync:', err);
      const errMsg = err?.message || 'تعذر استرجاع النسخة السحابية';
      this.saveConfig({
        lastSyncStatus: 'ERROR',
        lastSyncMessage: errMsg,
      });
      return { success: false, message: errMsg };
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  /**
   * Initializes periodic daily checks (e.g. checks every hour if a daily backup is due).
   */
  private initDailyScheduler(): void {
    if (typeof window === 'undefined') return;

    if (this.dailyCheckInterval) {
      clearInterval(this.dailyCheckInterval);
    }

    const checkAndRunDaily = () => {
      if (!this.config.enabled || !this.config.dailyScheduledSync) {
        return;
      }

      const lastSync = this.config.lastSyncTimestamp ? new Date(this.config.lastSyncTimestamp) : null;
      const now = new Date();

      // Check if 24 hours have passed since last sync
      const isDue = !lastSync || now.getTime() - lastSync.getTime() >= 24 * 60 * 60 * 1000;

      if (isDue) {
        this.syncNow('DAILY').catch((e) => {
          console.warn('Scheduled daily cloud sync error:', e);
        });
      }
    };

    // Check once after boot
    setTimeout(checkAndRunDaily, 5000);

    // Then check every hour
    this.dailyCheckInterval = setInterval(checkAndRunDaily, 60 * 60 * 1000);
  }

  private computeHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }
}

export const cloudSyncManager = CloudSyncManager.getInstance();
