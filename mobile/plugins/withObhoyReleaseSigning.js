const { withAppBuildGradle } = require('@expo/config-plugins');

const OLD_SIGNING_CONFIGS = `    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }`;

const NEW_SIGNING_CONFIGS = `    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (project.hasProperty('OBHOY_UPLOAD_STORE_PASSWORD')) {
                storeFile file('../../keystores/obhoy-release.jks')
                storePassword OBHOY_UPLOAD_STORE_PASSWORD
                keyAlias OBHOY_UPLOAD_KEY_ALIAS
                keyPassword OBHOY_UPLOAD_KEY_PASSWORD
            }
        }
    }`;

const OLD_RELEASE_BUILD_TYPE = `        release {
            // Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.debug`;

const NEW_RELEASE_BUILD_TYPE = `        release {
            // Signed with the real Obhoy upload key when OBHOY_UPLOAD_STORE_PASSWORD is set
            // in ~/.gradle/gradle.properties (Obhoy_32). Falls back to the debug key
            // otherwise, so a fresh clone without that file still builds.
            signingConfig project.hasProperty('OBHOY_UPLOAD_STORE_PASSWORD') ? signingConfigs.release : signingConfigs.debug`;

// This block explicitly names your output file Obhoy.apk:
const APK_RENAME_BLOCK = `
android.applicationVariants.all { variant ->
    variant.outputs.all {
        outputFileName = "Obhoy.apk"
    }
}
`;

function assertFound(contents, needle, label) {
  if (!contents.includes(needle)) {
    throw new Error(
      `[withObhoyReleaseSigning] Expected ${label} not found in android/app/build.gradle — ` +
      `the Expo-generated template changed. Update mobile/plugins/withObhoyReleaseSigning.js to match.`
    );
  }
}

function withObhoyReleaseSigning(config) {
  return withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    assertFound(contents, OLD_SIGNING_CONFIGS, 'signingConfigs block');
    contents = contents.replace(OLD_SIGNING_CONFIGS, NEW_SIGNING_CONFIGS);

    assertFound(contents, OLD_RELEASE_BUILD_TYPE, 'release buildType signingConfig line');
    contents = contents.replace(OLD_RELEASE_BUILD_TYPE, NEW_RELEASE_BUILD_TYPE);

    if (!contents.includes('Obhoy.apk')) {
      contents = contents + APK_RENAME_BLOCK;
    }

    config.modResults.contents = contents;
    return config;
  });
}

module.exports = withObhoyReleaseSigning;