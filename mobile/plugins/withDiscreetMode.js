const { withAndroidManifest, withDangerousMod, AndroidConfig } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const ALIAS_NAME = '.CalculatorDisguiseActivity';
const ICON_RESOURCE_NAME = 'ic_calculator_disguise';

function withDiscreetModeIcon(config) {
  return withDangerousMod(config, [
    'android',
    (config) => {
      const src = path.join(config.modRequest.projectRoot, 'assets', 'calculator-icon.png');
      const destDir = path.join(config.modRequest.platformProjectRoot, 'app/src/main/res/drawable');
      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(src, path.join(destDir, `${ICON_RESOURCE_NAME}.png`));
      return config;
    },
  ]);
}

function withDiscreetModeManifest(config) {
  return withAndroidManifest(config, (config) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);

    if (!mainApplication['activity-alias']) mainApplication['activity-alias'] = [];

    mainApplication['activity-alias'].push({
      $: {
        'android:name': ALIAS_NAME,
        'android:enabled': 'false',
        'android:exported': 'true',
        'android:icon': `@drawable/${ICON_RESOURCE_NAME}`,
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

    return config;
  });
}

module.exports = function withDiscreetMode(config) {
  config = withDiscreetModeIcon(config);
  config = withDiscreetModeManifest(config);
  return config;
};