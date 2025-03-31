// @ts-nocheck
import { useRouter as useExpoRouter, useLocalSearchParams } from 'expo-router';

/**
 * Hook آمن للتوجيه يعمل مع وضع NOBRIDGE
 * يوفر بدائل آمنة في حالة عدم توفر الموجه
 */
export function useRouter() {
  // إنشاء كائن router آمن مع وظائف وهمية بشكل افتراضي
  const fallbackRouter = {
    back: () => {
      console.warn('router.back(): استخدام دالة fallback');
      return null;
    },
    push: (path, params) => {
      console.warn(`router.push(): استخدام دالة fallback للانتقال إلى ${path}`);
      return null;
    },
    replace: (path, params) => {
      console.warn(`router.replace(): استخدام دالة fallback للاستبدال بـ ${path}`);
      return null;
    },
    canGoBack: () => {
      console.warn('router.canGoBack(): استخدام دالة fallback');
      return false;
    },
    setParams: (params) => {
      console.warn('router.setParams(): استخدام دالة fallback');
      return null;
    }
  };

  try {
    // محاولة الوصول لـ useExpoRouter إذا كان متاحًا
    let router;
    
    try {
      router = useExpoRouter();
    } catch (routerError) {
      console.warn('فشل في استخدام useExpoRouter()، استخدام router بديل');
      return fallbackRouter;
    }
    
    // التأكد من أن router موجود ويحتوي على الوظائف المطلوبة
    if (!router || typeof router !== 'object') {
      console.warn('router غير معرف أو ليس كائن، استخدام router بديل');
      return fallbackRouter;
    }
    
    // إنشاء نسخة آمنة من router مع التحقق من كل وظيفة
    return {
      back: () => {
        if (typeof router.back === 'function') {
          try {
            router.back();
          } catch (error) {
            console.warn('خطأ عند استدعاء router.back()', error);
          }
        } else {
          console.warn('router.back ليست دالة');
        }
      },
      push: (path, params) => {
        if (typeof router.push === 'function') {
          try {
            return router.push(path, params);
          } catch (error) {
            console.warn(`خطأ عند استدعاء router.push(${path})`, error);
          }
        } else {
          console.warn('router.push ليست دالة');
        }
        return null;
      },
      replace: (path, params) => {
        if (typeof router.replace === 'function') {
          try {
            return router.replace(path, params);
          } catch (error) {
            console.warn(`خطأ عند استدعاء router.replace(${path})`, error);
          }
        } else {
          console.warn('router.replace ليست دالة');
        }
        return null;
      },
      canGoBack: () => {
        if (typeof router.canGoBack === 'function') {
          try {
            return router.canGoBack();
          } catch (error) {
            console.warn('خطأ عند استدعاء router.canGoBack()', error);
          }
        } else {
          console.warn('router.canGoBack ليست دالة');
        }
        return false;
      },
      setParams: (params) => {
        if (typeof router.setParams === 'function') {
          try {
            return router.setParams(params);
          } catch (error) {
            console.warn('خطأ عند استدعاء router.setParams()', error);
          }
        } else {
          console.warn('router.setParams ليست دالة');
        }
        return null;
      }
    };
  } catch (error) {
    // إرجاع router بديل في حالة حدوث أي خطأ
    console.warn('خطأ في useRouter()', error);
    return fallbackRouter;
  }
}

/**
 * استخدام useLocalSearchParams بشكل آمن
 */
export function useParams() {
  try {
    return useLocalSearchParams();
  } catch (error) {
    console.warn('خطأ في استخدام useLocalSearchParams', error);
    return {};
  }
}

// تصدير افتراضي للتوافق مع NOBRIDGE
export default { useRouter, useParams }; 