module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'expo-router/babel',
      ['module-resolver', {
        alias: {
          'app': './app',
        },
        extensions: ['.js', '.jsx', '.ts', '.tsx']
      }]
    ],
  };
}; 