const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function(env, argv) {
  const config = await createExpoWebpackConfigAsync({
    ...env,
    babel: {
      dangerouslyAddModulePathsToTranspile: ['nativewind']
    }
  }, argv);

  // تعديل مسار الملفات الثابتة
  config.output.publicPath = '/YazCarFaxWeb/';

  return config;
}; 