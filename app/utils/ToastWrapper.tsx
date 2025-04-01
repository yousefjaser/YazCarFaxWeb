import { Platform } from 'react-native';

/**
 * بديل متوافق مع المنصات المختلفة لـ ToastAndroid 
 * يعمل على الويب، iOS، Android
 */
const Toast = {
  SHORT: 0,
  LONG: 1,
  
  /**
   * عرض رسالة مؤقتة للمستخدم
   * @param message الرسالة المراد عرضها
   * @param duration مدة العرض
   */
  show: (message: string, duration: number = 0) => {
    // على أندرويد نستخدم ToastAndroid الأصلي
    if (Platform.OS === 'android') {
      const { ToastAndroid } = require('react-native');
      ToastAndroid.show(message, duration);
    } 
    // على الويب نستخدم alert أو نوفر بديل أفضل
    else if (Platform.OS === 'web') {
      // طباعة في وحدة التحكم للتصحيح
      console.log('[Toast]', message);
      
      try {
        // التحقق من وجود وظيفة window.ToastAndroid المعرفة سابقاً
        if (typeof window !== 'undefined' && (window as any).ToastAndroid && (window as any).ToastAndroid.show) {
          (window as any).ToastAndroid.show(message, duration);
        } else {
          // استخدام alert كحل بديل
          setTimeout(() => {
            alert(message);
          }, 0);
        }
      } catch (e) {
        // في حالة الفشل، نستخدم alert
        setTimeout(() => {
          alert(message);
        }, 0);
      }
    } 
    // على iOS نستخدم Alert
    else if (Platform.OS === 'ios') {
      const { Alert } = require('react-native');
      Alert.alert('', message);
    }
  }
};

export default Toast; 