const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withAndroidSigning(config) {
  return withAppBuildGradle(config, (config) => {
    let gradle = config.modResults.contents;

    // Already patched
    if (gradle.includes('keystoreProperties')) return config;

    // 1. Insert keystoreProperties loader after projectRoot definition
    gradle = gradle.replace(
      'def projectRoot = rootDir.getAbsoluteFile().getParentFile().getAbsolutePath()',
      `def projectRoot = rootDir.getAbsoluteFile().getParentFile().getAbsolutePath()

def keystorePropertiesFile = new File(projectRoot, "keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}`
    );

    // 2. Add release signing config inside signingConfigs block (after debug block)
    gradle = gradle.replace(
      /signingConfigs \{(\s*debug \{[\s\S]*?\}\s*)\}/,
      `signingConfigs {$1    release {
            storeFile keystoreProperties['storeFile'] ? file(new File(projectRoot, keystoreProperties['storeFile'])) : null
            storePassword keystoreProperties['storePassword'] ?: ''
            keyAlias keystoreProperties['keyAlias'] ?: ''
            keyPassword keystoreProperties['keyPassword'] ?: ''
        }
    }`
    );

    // 3. Use release signing config in release build type
    gradle = gradle.replace(
      /release \{[^}]*signingConfig signingConfigs\.debug/,
      (match) => match.replace('signingConfig signingConfigs.debug', 'signingConfig signingConfigs.release')
    );

    config.modResults.contents = gradle;
    return config;
  });
};
