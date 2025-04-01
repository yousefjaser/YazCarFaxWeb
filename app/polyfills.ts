/**
 * ملف بدائل (polyfills) للمشروع
 * يساعد في توفير بعض الدوال المطلوبة للتشغيل على الويب
 * 
 * v1.0.3 - 2024 - حل مباشر لمشكلة nanoid
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

// إصلاح مشكلة nanoid عالمياً - نهج مباشر
try {
  // الحصول على النطاق الكوني (window أو global)
  const globalScope = typeof window !== 'undefined' ? window : 
                     typeof global !== 'undefined' ? global : 
                     typeof self !== 'undefined' ? self : {};
  
  const g = globalScope as any;
  
  // 1. إضافة nanoid للنطاق العالمي
  g.nanoid = createSimpleId;
  
  // 2. إضافة r.nanoid للنطاق العالمي
  g.r = g.r || {};
  g.r.nanoid = createSimpleId;

  // 3. تسجيل وحدة nanoid في requireJS/CommonJS
  g.define = g.define || function(name: string, deps: any[], callback: any) {
    if (name === 'nanoid' || name === 'r') {
      g[name] = { nanoid: createSimpleId };
    }
  };
  
  // 4. إضافة nanoid لمختلف الأنماط المستخدمة في المشروع
  // المستخدم في webpack
  g.__webpack_require__ = g.__webpack_require__ || function(moduleId: string) {
    if (moduleId === 'nanoid' || moduleId === 'r') {
      return { nanoid: createSimpleId };
    }
    return { 
      d: function(exports: any, name: string, getter: any) {
        if (name === 'nanoid') {
          exports.nanoid = createSimpleId;
        }
      } 
    };
  };

  // 5. محاولة إضافة كائن r الخاص في الوحدات المختلفة
  try {
    Object.defineProperty(g, '0', {
      get: function() { return this; }
    });
    // إذا نجحت الإضافة، فإننا نستطيع تجاوز مشكلة (0, r.nanoid)
    Object.defineProperty(g, 'r', {
      get: function() { 
        return { nanoid: createSimpleId };
      }
    });
  } catch (e) {
    console.log('[polyfills] لم نتمكن من تعريف خاصية 0,r - استمرار بالطرق الأخرى');
  }

  // 6. تعريف مباشر لـ module.exports.nanoid لدعم CommonJS
  g.module = g.module || {};
  g.module.exports = g.module.exports || {};
  g.module.exports.nanoid = createSimpleId;

  // 7. إنشاء وحدات مختلفة محتملة تستخدم في expo-router
  const moduleNames = ['nrCq', 'useRegisterNavigator', 'expo-router', 'expo-router-dom'];
  moduleNames.forEach(name => {
    g[name] = g[name] || {};
    g[name].nanoid = createSimpleId;
  });

  // 8. إصلاح لـ ToastAndroid
  g.ToastAndroid = g.ToastAndroid || {
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
  
  // 9. إصلاح لمشكلة document.currentScript.src - يستخدم في expo-router
  if (typeof document !== 'undefined' && !document.currentScript) {
    Object.defineProperty(document, 'currentScript', {
      get: function() {
        return { src: '/index.js' };
      }
    });
  }

  // 10. تجاوز نهائي - monkey patching للكود المُنتَج
  // إضافة nanoid على أي كائن قد يتم استخدامه لاستدعاء الدالة
  const originalObjectAssign = Object.assign;
  Object.assign = function(target: any, ...sources: any[]) {
    const result = originalObjectAssign.apply(this, [target, ...sources]);
    
    // إضافة nanoid لأي كائن يتم إنشاؤه عن طريق Object.assign
    if (result && typeof result === 'object' && sources.some(s => s && (s.r || s.nanoid))) {
      if (!result.nanoid) result.nanoid = createSimpleId;
      if (!result.r) result.r = { nanoid: createSimpleId };
      else if (result.r && !result.r.nanoid) result.r.nanoid = createSimpleId;
    }
    
    return result;
  };

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
  console.log('[polyfills] تم تحميل البدائل لدعم التشغيل على الويب | v1.0.3');
  console.log('[polyfills] اختبار nanoid:', testId);
  
  // اختبار r.nanoid إذا كان متاحاً
  const g = (typeof window !== 'undefined' ? window : 
           typeof global !== 'undefined' ? global : 
           typeof self !== 'undefined' ? self : {}) as any;
           
  if (g.r && typeof g.r.nanoid === 'function') {
    console.log('[polyfills] اختبار r.nanoid:', g.r.nanoid());
  }

  // محاكاة (0, r.nanoid)() إذا أمكن
  try {
    const mockExpression = function() {
      const zero = 0;
      const mockR = { nanoid: createSimpleId };
      
      // محاولة محاكاة السياق بأمان
      const result = mockR.nanoid();
      console.log('[polyfills] محاكاة (0, r.nanoid):', result);
      return result;
    };
    mockExpression();
  } catch (e) {
    console.log('[polyfills] لم نتمكن من محاكاة (0, r.nanoid)');
  }
} catch (error) {
  console.error('[polyfills] خطأ في الاختبار:', error);
}

// export للتوافق كـ module
export default {
  nanoid: createSimpleId,
  createSimpleId
}; 