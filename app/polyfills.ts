/**
 * ملف بدائل (polyfills) للمشروع
 * يساعد في توفير بعض الدوال المطلوبة للتشغيل على الويب
 * 
 * v1.0.1 - 2024 - بناء محسن للويب
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

// إصلاح مشكلة nanoid عالمياً
try {
  // بيئة node/global
  if (typeof global !== 'undefined') {
    const g = global as any;
    
    // تأكد من وجود nanoid في النطاق العالمي
    if (!g.nanoid) {
      g.nanoid = createSimpleId;
    }
    
    // دعم كائن r مع nanoid
    if (!g.r) {
      g.r = {};
    }
    if (!g.r.nanoid) {
      g.r.nanoid = createSimpleId;
    }
  }
  
  // بيئة المتصفح/window
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
    
    // إضافة لمودولات ES
    if (!w.module) {
      w.module = {};
    }
    
    if (!w.module.exports) {
      w.module.exports = {};
    }
    
    w.module.exports.nanoid = createSimpleId;
    
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
} catch (error) {
  console.error('فشل في تطبيق البدائل:', error);
}

// بديل لـ nanoid للتصدير
export const nanoid = createSimpleId;

// للفحص والتأكد من أن الكود يعمل
try {
  // تأكد من أن nanoid متاح ويمكن تنفيذه
  const testId = typeof nanoid === 'function' ? nanoid() : createSimpleId();
  
  // إضافة تعليق لإظهار أن الملف تم تحميله
  console.log('[polyfills] تم تحميل البدائل لدعم التشغيل على الويب | v1.0.1');
  console.log('[polyfills] اختبار nanoid:', testId);
  
  // اختبار r.nanoid إذا كان متاحاً
  if (typeof window !== 'undefined' && (window as any).r && typeof (window as any).r.nanoid === 'function') {
    console.log('[polyfills] اختبار r.nanoid:', (window as any).r.nanoid());
  }
} catch (error) {
  console.error('[polyfills] خطأ في الاختبار:', error);
}

// export للتوافق كـ module
export default {
  nanoid: createSimpleId,
  createSimpleId
}; 