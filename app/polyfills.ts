/**
 * ملف بدائل (polyfills) للمشروع
 * يساعد في توفير بعض الدوال المطلوبة للتشغيل على الويب
 * 
 * v1.0.1 - بناء محسن للويب
 */

// استيراد polyfill لـ URL
import 'react-native-url-polyfill/auto';

/**
 * تنفيذ محلي بسيط للـ nanoid
 */
function createSimpleId(size = 21): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  
  for (let i = 0; i < size; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return id;
}

// إصلاح مشكلة nanoid
if (typeof global !== 'undefined') {
  const g = global as any;
  
  // تأكد من وجود nanoid في النطاق العالمي
  if (!g.nanoid) {
    g.nanoid = createSimpleId;
  }
}

// بديل لـ nanoid للتصدير
export const nanoid = createSimpleId;

// إصلاح للويب
if (typeof window !== 'undefined') {
  const w = window as any;
  
  // إضافة nanoid للويب
  if (!w.nanoid) {
    w.nanoid = createSimpleId;
  }
  
  // إضافة كائن r.nanoid - هذا تحديداً يصلح الخطأ من useRegisterNavigator.tsx
  if (!w.r) {
    w.r = {};
  }
  
  if (!w.r.nanoid) {
    w.r.nanoid = createSimpleId;
  }
  
  // إصلاح لـ ToastAndroid
  if (!w.ToastAndroid) {
    w.ToastAndroid = {
      show: function(message: string, duration: number) {
        console.log('[Toast]', message);
        setTimeout(() => {
          if (typeof alert === 'function') {
            alert(message);
          }
        }, 0);
      },
      SHORT: 0,
      LONG: 1
    };
  }
}

// إصلاح لمشكلة document.currentScript.src - يستخدم في expo-router
if (typeof document !== 'undefined' && !document.currentScript) {
  Object.defineProperty(document, 'currentScript', {
    get: function() {
      return { src: '/index.js' };
    }
  });
}

// إضافة تعليق لإظهار أن الملف تم تحميله
console.log('[polyfills] تم تحميل البدائل لدعم التشغيل على الويب | v1.0.1');

// export للتوافق كـ module
export default {
  nanoid: createSimpleId,
  createSimpleId
}; 