/**
 * ملف بدائل (polyfills) للمشروع
 * يساعد في توفير بعض الدوال المطلوبة للتشغيل على الويب
 * 
 * v1.0.2 - 2024 - بناء محسن للويب مع إصلاحات إضافية
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

// إصلاح مشكلة nanoid عالمياً - تحسين الإصلاح
try {
  // محاولة استيراد nanoid إذا كان موجوداً
  let originalNanoid;
  try {
    originalNanoid = require('nanoid');
  } catch(e) {
    console.log('[polyfills] لم يتم العثور على مكتبة nanoid، سيتم استخدام البديل المحلي');
  }

  // بيئة node/global
  if (typeof global !== 'undefined') {
    const g = global as any;
    
    // تأكد من وجود nanoid في النطاق العالمي
    if (!g.nanoid) {
      g.nanoid = originalNanoid?.nanoid || createSimpleId;
    }
    
    // دعم كائن r مع nanoid
    if (!g.r) {
      g.r = {};
    }
    if (!g.r.nanoid) {
      g.r.nanoid = originalNanoid?.nanoid || createSimpleId;
    }

    // إصلاح useRegisterNavigator
    if (!g.nrCq) {
      g.nrCq = {};
    }
    g.nrCq.nanoid = originalNanoid?.nanoid || createSimpleId;

    // إصلاح لمسار الاستيراد (0, r.nanoid)
    if (!g.useRegisterNavigator) {
      g.useRegisterNavigator = {
        nanoid: originalNanoid?.nanoid || createSimpleId
      };
    }
  }
  
  // بيئة المتصفح/window
  if (typeof window !== 'undefined') {
    const w = window as any;
    
    // إضافة nanoid للويب
    if (!w.nanoid) {
      w.nanoid = originalNanoid?.nanoid || createSimpleId;
    }
    
    // إضافة كائن r.nanoid - هذا تحديداً يصلح الخطأ من useRegisterNavigator.tsx
    if (!w.r) {
      w.r = {};
    }
    
    if (!w.r.nanoid) {
      w.r.nanoid = originalNanoid?.nanoid || createSimpleId;
    }

    // إصلاح لمسار الاستيراد (0, r.nanoid)
    if (!w.useRegisterNavigator) {
      w.useRegisterNavigator = {
        nanoid: originalNanoid?.nanoid || createSimpleId
      };
    }

    // إصلاح للأسماء المُصغرة المستخدمة في الكود المُضغوط
    if (!w.nrCq) {
      w.nrCq = {};
    }
    w.nrCq.nanoid = originalNanoid?.nanoid || createSimpleId;
    
    // إضافة لمودولات ES
    if (!w.module) {
      w.module = {};
    }
    
    if (!w.module.exports) {
      w.module.exports = {};
    }
    
    w.module.exports.nanoid = originalNanoid?.nanoid || createSimpleId;
    
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

  // إصلاحات إضافية لـ r.nanoid في بيئة مختلفة
  try {
    // محاولة وصول لوحدة r المستوردة
    const r = require('r') || {};
    if (typeof r.nanoid !== 'function') {
      r.nanoid = originalNanoid?.nanoid || createSimpleId;
    }
  } catch (error) {
    console.log('[polyfills] لم يتم العثور على مودل r، تخطي الإصلاح');
  }
  
  // إصلاح لمشكلة document.currentScript.src - يستخدم في expo-router
  if (typeof document !== 'undefined' && !document.currentScript) {
    Object.defineProperty(document, 'currentScript', {
      get: function() {
        return { src: '/index.js' };
      }
    });
  }

  // تسجيل تجاوز لـ (0, r.nanoid) function
  if (typeof Object.prototype !== 'undefined') {
    // إضافة مُعالج لمحاولات استدعاء (0, r.nanoid)
    const originalCall = Function.prototype.call;
    Function.prototype.call = function(thisArg: any, ...args: any[]) {
      if (args[0] === 0 && args[1]?.r?.nanoid === undefined &&
          (this.name === 'nanoid' || this.caller?.name === 'nanoid')) {
        return createSimpleId();
      }
      return originalCall.apply(this, [thisArg, ...args]);
    };
  }
} catch (error) {
  console.error('[polyfills] فشل في تطبيق البدائل:', error);
}

// بديل لـ nanoid للتصدير
export const nanoid = createSimpleId;

// للفحص والتأكد من أن الكود يعمل
try {
  // تأكد من أن nanoid متاح ويمكن تنفيذه
  const testId = typeof nanoid === 'function' ? nanoid() : createSimpleId();
  
  // إضافة تعليق لإظهار أن الملف تم تحميله
  console.log('[polyfills] تم تحميل البدائل لدعم التشغيل على الويب | v1.0.2');
  console.log('[polyfills] اختبار nanoid:', testId);
  
  // اختبار r.nanoid إذا كان متاحاً
  if (typeof window !== 'undefined' && (window as any).r && typeof (window as any).r.nanoid === 'function') {
    console.log('[polyfills] اختبار r.nanoid:', (window as any).r.nanoid());
  }

  // اختبار تجاوز الدالة
  try {
    const mockFn = function() { return createSimpleId(); };
    const mockObj = { r: { } };
    const result = (mockFn as any).call(null, 0, mockObj);
    console.log('[polyfills] اختبار تجاوز الدالة:', result);
  } catch (e) {
    console.error('[polyfills] فشل اختبار تجاوز الدالة:', e);
  }
} catch (error) {
  console.error('[polyfills] خطأ في الاختبار:', error);
}

// export للتوافق كـ module
export default {
  nanoid: createSimpleId,
  createSimpleId
}; 