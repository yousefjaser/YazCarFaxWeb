import { Platform, Alert } from 'react-native';

/**
 * بدائل للمنصات المختلفة - يساعد على توحيد الاستخدام بين الويب والجوال
 */

/**
 * بديل لـ ToastAndroid يعمل على جميع المنصات
 */
export const Toast = {
  SHORT: 0,
  LONG: 1,
  show: (message: string, duration: number = 0) => {
    // استخدام ToastAndroid على نظام أندرويد فقط
    if (Platform.OS === 'android') {
      const { ToastAndroid } = require('react-native');
      ToastAndroid.show(message, duration);
    } 
    // استخدام alert على الويب
    else if (Platform.OS === 'web') {
      console.log('[Toast]', message);
      setTimeout(() => {
        // استخدام alert البسيط على الويب
        // يمكن تغييره بتنفيذ توست مخصص لاحقاً
        alert(message);
      }, 0);
    } 
    // استخدام Alert على iOS
    else if (Platform.OS === 'ios') {
      Alert.alert('', message);
    }
  }
};

/**
 * تنفيذ محلي بسيط للـ nanoid
 * يجب استخدامه في حالة عدم توفر nanoid الأصلي
 */
export function createSimpleId(size = 21): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  
  for (let i = 0; i < size; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return id;
}

/**
 * رابط لـ nanoid الأصلي أو بديل محلي
 */
export function getNanoId(size?: number): string {
  try {
    if (typeof window !== 'undefined') {
      // استخدام any لتجاوز التحقق من النوع
      const win = window as any;
      if (win.nanoid) {
        return win.nanoid(size);
      }
    }
    
    try {
      const { nanoid } = require('nanoid');
      return nanoid(size);
    } catch (err) {
      return createSimpleId(size);
    }
  } catch (error) {
    return createSimpleId(size);
  }
}

export const isWeb = Platform.OS === 'web';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

export default {
  Toast,
  getNanoId,
  createSimpleId,
  isWeb,
  isIOS,
  isAndroid
}; 