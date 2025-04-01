module.exports = {
  // إعدادات أساسية لعملية التصدير
  web: {
    // تأكيد مسار خروج الملفات
    output: 'web-build',
    
    // تحديد مسارات الملفات
    router: {
      mode: 'hash',
    },
    
    // تحديد مسارات الوحدات النمطية
    moduleAliases: {
      'app': './app',
      'assets': './assets'
    },
    
    // تحديد webpack plugins
    plugins: [],
  },
} 