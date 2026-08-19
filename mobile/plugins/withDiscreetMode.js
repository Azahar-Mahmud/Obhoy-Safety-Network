const { withAndroidManifest, withDangerousMod, AndroidConfig } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const DEFAULT_ALIAS = '.MainActivityDefault';
const DISGUISE_ALIAS = '.CalculatorDisguiseActivity';
const ICON_RESOURCE_NAME = 'ic_calculator_disguise';

function withDiscreetModeIcon(config) {
  return withDangerousMod(config, [
    'android',
    (config) => {
      const src = path.join(config.modRequest.projectRoot, 'assets', 'calculator-icon.png');
      const destDir = path.join(config.modRequest.platformProjectRoot, 'app/src/main/res/drawable');
      fs.mkdirSync(destDir, { recursive: true });
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(destDir, `${ICON_RESOURCE_NAME}.png`));
      }
      return config;
    },
  ]);
}

function withDiscreetModeManifest(config) {
  return withAndroidManifest(config, (config) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);

    // 1. Remove LAUNCHER category from MainActivity to prevent collision
    const mainActivity = mainApplication.activity?.find(a => a.$['android:name'] === '.MainActivity');
    if (mainActivity && mainActivity['intent-filter']) {
      mainActivity['intent-filter'] = mainActivity['intent-filter'].map(filter => {
        if (filter.category) {
          filter.category = filter.category.filter(c => c.$['android:name'] !== 'android.intent.category.LAUNCHER');
        }
        return filter;
      });
    }

    if (!mainApplication['activity-alias']) mainApplication['activity-alias'] = [];

    // 2. Add Default Obhoy Alias (Enabled by default)
    if (!mainApplication['activity-alias'].some(a => a.$['android:name'] === DEFAULT_ALIAS)) {
      mainApplication['activity-alias'].push({
        $: {
          'android:name': DEFAULT_ALIAS,
          'android:enabled': 'true',
          'android:exported': 'true',
          'android:icon': '@mipmap/ic_launcher',
          'android:roundIcon': '@mipmap/ic_launcher_round',
          'android:label': '@string/app_name',
          'android:targetActivity': '.MainActivity',
        },
        'intent-filter': [
          {
            action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
            category: [{ $: { 'android:name': 'android.intent.category.LAUNCHER' } }],
          },
        ],
      });
    }

    // 3. Add Calculator Disguise Alias (Disabled by default)
    if (!mainApplication['activity-alias'].some(a => a.$['android:name'] === DISGUISE_ALIAS)) {
      mainApplication['activity-alias'].push({
        $: {
          'android:name': DISGUISE_ALIAS,
          'android:enabled': 'false',
          'android:exported': 'true',
          'android:icon': `@drawable/${ICON_RESOURCE_NAME}`,
          'android:roundIcon': `@drawable/${ICON_RESOURCE_NAME}`,
          'android:label': 'Calculator',
          'android:targetActivity': '.MainActivity',
        },
        'intent-filter': [
          {
            action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
            category: [{ $: { 'android:name': 'android.intent.category.LAUNCHER' } }],
          },
        ],
      });
    }

    return config;
  });
}

module.exports = function withDiscreetMode(config) {
  config = withDiscreetModeIcon(config);
  config = withDiscreetModeManifest(config);
  return config;
};