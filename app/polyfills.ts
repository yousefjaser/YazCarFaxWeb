/**
 * ملف بدائل (polyfills) للمشروع
 * يساعد في توفير بعض الدوال المطلوبة للتشغيل على الويب
 */

// استيراد polyfill لـ URL
import 'react-native-url-polyfill/auto';

// خلق nanoid شامل للعمل على جميع المنصات
if (typeof global !== 'undefined') {
  function createSimpleId(size = 21): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    
    for (let i = 0; i < size; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return id;
  }

  // إضافة للنطاق العالمي
  const g = global as any;
  
  // تعريف بديل nanoid إذا لم يكن موجودًا
  if (!g.nanoid) {
    g.nanoid = createSimpleId;
  }
}

// بدائل إضافية يمكن إضافتها حسب الحاجة

export {}; 