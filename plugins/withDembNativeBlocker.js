const fs = require('fs');
const path = require('path');
const {
  AndroidConfig,
  createRunOncePlugin,
  withAndroidManifest,
  withDangerousMod,
  withMainApplication,
  withStringsXml,
} = require('@expo/config-plugins');

const MODULE_NAME = 'DembBlockerModule';
const PACKAGE_NAME = 'DembBlockerPackage';
const SERVICE_NAME = 'DembAccessibilityService';

const blockedPackages = [
  'com.instagram.android',
  'com.zhiliaoapp.musically',
  'com.facebook.katana',
  'com.snapchat.android',
  'com.twitter.android',
];

const kotlinModule = (appPackage) => `package ${appPackage}

import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.provider.Settings
import android.util.Log
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray

class ${MODULE_NAME}(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "${MODULE_NAME}"

    @ReactMethod
    fun isAccessibilityServiceEnabled(promise: Promise) {
        val context = reactApplicationContext
        val service = "\${context.packageName}/${SERVICE_NAME}"
        val enabled = Settings.Secure.getInt(
            context.contentResolver,
            Settings.Secure.ACCESSIBILITY_ENABLED,
            0
        )

        if (enabled == 1) {
            val settingValue = Settings.Secure.getString(
                context.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            )
            val isEnabled = settingValue
                ?.split(":")
                ?.any { it.equals(service, ignoreCase = true) }
                ?: false
            promise.resolve(isEnabled)
            return
        }

        promise.resolve(false)
    }

    @ReactMethod
    fun openAccessibilitySettings() {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        reactApplicationContext.startActivity(intent)
    }

    @ReactMethod
    fun setLockState(active: Boolean, restrictedAppName: String) {
        ${SERVICE_NAME}.isLockActive = active
        ${SERVICE_NAME}.restrictedAppName = restrictedAppName
        Log.d("DembBlocker", "Shield status updated: active=$active, label=$restrictedAppName")
    }

    @ReactMethod
    fun setBlockedPackages(packages: ReadableArray) {
        val nextPackages = mutableSetOf<String>()
        for (i in 0 until packages.size()) {
            packages.getString(i)?.let { nextPackages.add(it) }
        }
        ${SERVICE_NAME}.blockedPackages = nextPackages
        Log.d("DembBlocker", "Blocked list synced: $nextPackages")
    }

    @ReactMethod
    fun checkHealthPermissions(promise: Promise) {
        val permissions = healthPermissions()
        val granted = permissions.all {
            ContextCompat.checkSelfPermission(reactApplicationContext, it) == PackageManager.PERMISSION_GRANTED
        }
        promise.resolve(granted)
    }

    @ReactMethod
    fun requestHealthPermissions(promise: Promise) {
        val intent = Intent("android.health.connect.action.MANAGE_HEALTH_PERMISSIONS").apply {
            putExtra(Intent.EXTRA_PACKAGE_NAME, reactApplicationContext.packageName)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }

        try {
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            val fallbackIntent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = Uri.parse("package:\${reactApplicationContext.packageName}")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            try {
                reactApplicationContext.startActivity(fallbackIntent)
                promise.resolve(true)
            } catch (ex: Exception) {
                promise.resolve(false)
            }
        }
    }

    @ReactMethod
    fun getHealthConnectData(promise: Promise) {
        // Health Connect reads need the Health Connect SDK. Until that dependency is added,
        // return null and let JavaScript use pedometer + idle-time fallbacks.
        promise.resolve(null)
    }

    private fun healthPermissions(): Array<String> = arrayOf(
        "android.permission.health.READ_STEPS",
        "android.permission.health.READ_HEART_RATE",
        "android.permission.health.READ_HEART_RATE_VARIABILITY",
        "android.permission.health.READ_SLEEP"
    )
}
`;

const kotlinPackage = (appPackage) => `package ${appPackage}

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class ${PACKAGE_NAME} : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(${MODULE_NAME}(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
`;

const kotlinService = (appPackage) => `package ${appPackage}

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.net.Uri
import android.util.Log
import android.view.accessibility.AccessibilityEvent

class ${SERVICE_NAME} : AccessibilityService() {
    companion object {
        private const val TAG = "DembAccessibility"

        @JvmStatic
        var isLockActive: Boolean = false

        @JvmStatic
        var blockedPackages: Set<String> = hashSetOf(
            ${blockedPackages.map((pkg) => `"${pkg}"`).join(',\n            ')}
        )

        @JvmStatic
        var restrictedAppName: String = "Digital Overload"
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        Log.d(TAG, "Demb Accessibility Service connected.")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        if (event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return

        val packageName = event.packageName?.toString() ?: return
        if (packageName == applicationContext.packageName) return

        if (isLockActive && blockedPackages.contains(packageName)) {
            val uri = Uri.parse(
                "demb://focus-lock?blockedApp=\${Uri.encode(packageName)}&restrictedAppName=\${Uri.encode(restrictedAppName)}"
            )
            val launchIntent = Intent(Intent.ACTION_VIEW, uri).apply {
                setPackage(applicationContext.packageName)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            startActivity(launchIntent)
        }
    }

    override fun onInterrupt() {
        Log.d(TAG, "Service interrupted.")
    }
}
`;

const accessibilityConfig = `<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:accessibilityEventTypes="typeWindowStateChanged"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:accessibilityFlags="flagDefault"
    android:canRetrieveWindowContent="true"
    android:description="@string/accessibility_service_description" />
`;

function addPermission(manifest, permission) {
  if (!manifest.manifest['uses-permission']) {
    manifest.manifest['uses-permission'] = [];
  }
  const permissions = manifest.manifest['uses-permission'];
  const exists = permissions.some((item) => item.$?.['android:name'] === permission);
  if (!exists) {
    permissions.push({ $: { 'android:name': permission } });
  }
}

function addAccessibilityService(manifest) {
  const application = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
  if (!application.service) {
    application.service = [];
  }

  const exists = application.service.some((service) => service.$?.['android:name'] === `.${SERVICE_NAME}`);
  if (exists) {
    return;
  }

  application.service.push({
    $: {
      'android:name': `.${SERVICE_NAME}`,
      'android:permission': 'android.permission.BIND_ACCESSIBILITY_SERVICE',
      'android:label': '@string/accessibility_service_label',
      'android:exported': 'true',
    },
    'intent-filter': [
      {
        action: [{ $: { 'android:name': 'android.accessibilityservice.AccessibilityService' } }],
      },
    ],
    'meta-data': [
      {
        $: {
          'android:name': 'android.accessibilityservice',
          'android:resource': '@xml/accessibility_service_config',
        },
      },
    ],
  });
}

function withDembNativeBlocker(config) {
  const appPackage = config.android?.package;

  config = withAndroidManifest(config, (mod) => {
    [
      'android.permission.PACKAGE_USAGE_STATS',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.ACTIVITY_RECOGNITION',
      'android.permission.health.READ_STEPS',
      'android.permission.health.READ_HEART_RATE',
      'android.permission.health.READ_HEART_RATE_VARIABILITY',
      'android.permission.health.READ_SLEEP',
    ].forEach((permission) => addPermission(mod.modResults, permission));
    addAccessibilityService(mod.modResults);
    return mod;
  });

  config = withStringsXml(config, (mod) => {
    mod.modResults = AndroidConfig.Strings.setStringItem(
      [
        { $: { name: 'accessibility_service_label' }, _: 'Demb Screen Guard' },
        {
          $: { name: 'accessibility_service_description' },
          _: 'Protects against digital burnout by enforcing scheduled limits on high-dopamine apps.',
        },
      ],
      mod.modResults
    );
    return mod;
  });

  config = withMainApplication(config, (mod) => {
    if (!mod.modResults.contents.includes(`add(${PACKAGE_NAME}())`)) {
      mod.modResults.contents = mod.modResults.contents.replace(
        'PackageList(this).packages.apply {',
        `PackageList(this).packages.apply {\n              add(${PACKAGE_NAME}())`
      );
    }
    return mod;
  });

  config = withDangerousMod(config, [
    'android',
    async (mod) => {
      if (!appPackage) {
        throw new Error('Demb native blocker requires expo.android.package.');
      }

      const javaDir = path.join(
        mod.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'java',
        ...appPackage.split('.')
      );
      const xmlDir = path.join(mod.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'xml');
      fs.mkdirSync(javaDir, { recursive: true });
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(path.join(javaDir, `${MODULE_NAME}.kt`), kotlinModule(appPackage));
      fs.writeFileSync(path.join(javaDir, `${PACKAGE_NAME}.kt`), kotlinPackage(appPackage));
      fs.writeFileSync(path.join(javaDir, `${SERVICE_NAME}.kt`), kotlinService(appPackage));
      fs.writeFileSync(path.join(xmlDir, 'accessibility_service_config.xml'), accessibilityConfig);
      return mod;
    },
  ]);

  return config;
}

module.exports = createRunOncePlugin(withDembNativeBlocker, 'with-demb-native-blocker', '1.0.0');
