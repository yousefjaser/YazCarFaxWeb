const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function(env, argv) {
  const config = await createExpoWebpackConfigAsync({
    ...env,
    babel: {
      dangerouslyAddModulePathsToTranspile: ['expo-router'],
    }
  }, argv);

  // تعديل مسار المجلد app صراحةً
  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    'app': path.resolve(__dirname, 'app'),
    'assets': path.resolve(__dirname, 'assets'),
  };

  // تعديل مسار الملفات الثابتة
  config.output.publicPath = '/';

  return config;
}; 