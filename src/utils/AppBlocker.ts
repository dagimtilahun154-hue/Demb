import { NativeModules, Platform, Alert, Linking } from 'react-native';

const { AppBlockerModule } = NativeModules;

export interface BlockSession {
  blockedApps: string[];
  durationMs: number;
  startTime: number;
}

// Map of friendly app names → package names
export const APP_PACKAGE_MAP: Record<string, string> = {
  TikTok: 'com.zhiliaoapp.musically',
  Instagram: 'com.instagram.android',
  YouTube: 'com.google.android.youtube',
  Snapchat: 'com.snapchat.android',
  Facebook: 'com.facebook.katana',
  Twitter: 'com.twitter.android',
  WhatsApp: 'com.whatsapp',
  Telegram: 'org.telegram.messenger',
};

export const AppBlocker = {
  isAvailable(): boolean {
    return Platform.OS === 'android' && !!AppBlockerModule;
  },

  async hasUsageStatsPermission(): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      return await AppBlockerModule.hasUsageStatsPermission();
    } catch {
      return false;
    }
  },

  async hasOverlayPermission(): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      return await AppBlockerModule.hasOverlayPermission();
    } catch {
      return false;
    }
  },

  openUsageStatsSettings() {
    if (!this.isAvailable()) return;
    AppBlockerModule.openUsageStatsSettings();
  },

  openOverlaySettings() {
    if (!this.isAvailable()) return;
    AppBlockerModule.openOverlaySettings();
  },

  async requestAllPermissions(): Promise<{ usageStats: boolean; overlay: boolean }> {
    const usageStats = await this.hasUsageStatsPermission();
    const overlay = await this.hasOverlayPermission();

    if (!usageStats) {
      Alert.alert(
        'Usage Access Required',
        'DEMB needs "Usage Access" permission to monitor which apps are running.\n\nTap OK to open Settings → find DEMB → toggle ON.',
        [
          { text: 'Open Settings', onPress: () => this.openUsageStatsSettings() },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } else if (!overlay) {
      Alert.alert(
        '"Appear on Top" Required',
        'DEMB needs permission to appear over other apps to block social media.\n\nTap OK to open Settings → find DEMB → toggle ON.',
        [
          { text: 'Open Settings', onPress: () => this.openOverlaySettings() },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }

    return { usageStats, overlay };
  },

  async startBlocking(appNames: string[], durationMinutes: number): Promise<boolean> {
    if (!this.isAvailable()) {
      Alert.alert('Android Only', 'App blocking is only available on Android devices.');
      return false;
    }

    const { usageStats, overlay } = await this.requestAllPermissions();
    if (!usageStats || !overlay) return false;

    const packages = appNames
      .map(name => APP_PACKAGE_MAP[name])
      .filter(Boolean);

    if (packages.length === 0) return false;

    try {
      await AppBlockerModule.startBlocking(packages, durationMinutes * 60 * 1000);
      return true;
    } catch (e) {
      console.error('Failed to start blocking:', e);
      return false;
    }
  },

  stopBlocking() {
    if (!this.isAvailable()) return;
    try {
      AppBlockerModule.stopBlocking();
    } catch (e) {
      console.error('Failed to stop blocking:', e);
    }
  },

  async isBlockingActive(): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      return await AppBlockerModule.isBlockingActive();
    } catch {
      return false;
    }
  },

  async getTimeRemaining(): Promise<number> {
    if (!this.isAvailable()) return 0;
    try {
      return await AppBlockerModule.getTimeRemaining();
    } catch {
      return 0;
    }
  },
};
