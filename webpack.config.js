const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function(env, argv) {
  // تعيين المتغيرات البيئية الافتراضية
  env.mode = env.mode || 'development';
  env.platform = env.platform || 'web';
  
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: ['expo-router'],
      }
    },
    argv
  );

  // تعديل مسار المجلد app صراحةً
  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    '../../../../app': path.resolve(__dirname, 'app'),
    '../../../app': path.resolve(__dirname, 'app'),
    '../../app': path.resolve(__dirname, 'app'),
    '../app': path.resolve(__dirname, 'app'),
    app: path.resolve(__dirname, 'app'),
  };

  // تعديل مسار الملفات الثابتة - استخدام المسار المناسب لـ Vercel
  config.output.publicPath = '/';

  return config;
}; 