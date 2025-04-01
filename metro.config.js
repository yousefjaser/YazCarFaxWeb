// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 1. تكوين حل المشاكل المتعلقة بـ expo-router
config.resolver.extraNodeModules = {
  app: path.resolve(__dirname, 'app'),
  assets: path.resolve(__dirname, 'assets')
};

// 2. حل مشكلة مسارات expo-router المطلقة
config.watchFolders = [
  path.resolve(__dirname, 'app'),
  path.resolve(__dirname, 'assets')
];

// 3. تسجيل موقع جذر التطبيق
process.env.EXPO_ROUTER_APP_ROOT = path.resolve(__dirname, 'app');

module.exports = config; 