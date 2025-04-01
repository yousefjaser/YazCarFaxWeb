const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  // إضافة مسار app لـ expo-router
  process.env.EXPO_ROUTER_APP_ROOT = path.resolve(__dirname, 'app');

  // إعداد المتغيرات البيئية
  const config = await createExpoWebpackConfigAsync({
    ...env,
    babel: {
      dangerouslyAddModulePathsToTranspile: ['expo-router']
    }
  }, argv);

  // إضافة مسارات للملفات
  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    'app': path.resolve(__dirname, 'app'),
    'assets': path.resolve(__dirname, 'assets'),
    '../../../../../app': path.resolve(__dirname, 'app'),
    '../../../../app': path.resolve(__dirname, 'app'),
    '../../../app': path.resolve(__dirname, 'app'),
    '../../app': path.resolve(__dirname, 'app'),
    '../app': path.resolve(__dirname, 'app'),
  };

  // تعريف متغير بيئي للإطار
  config.plugins.push(
    new (require('webpack').DefinePlugin)({
      'process.env.EXPO_ROUTER_APP_ROOT': JSON.stringify(path.resolve(__dirname, 'app'))
    })
  );

  // تحديد مسار الملفات الثابتة
  config.output.publicPath = '/';

  // السماح بالتحويلات على node_modules
  config.module.rules.forEach(rule => {
    if (rule.oneOf) {
      rule.oneOf.forEach(oneOfRule => {
        if (oneOfRule.loader && oneOfRule.loader.indexOf('babel-loader') >= 0) {
          if (oneOfRule.include) {
            delete oneOfRule.include;
          }
        }
      });
    }
  });

  return config;
}; 