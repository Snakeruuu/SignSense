const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add tflite and task to asset extensions so they get bundled into the APK/IPA
config.resolver.assetExts.push('tflite', 'task');

module.exports = config;
