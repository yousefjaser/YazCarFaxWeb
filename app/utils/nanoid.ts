import { nanoid as originalNanoid } from 'nanoid';

// توفير دالة nanoid للمشروع
export const nanoid = () => {
  try {
    return originalNanoid();
  } catch (error) {
    // في حالة حدوث خطأ، استخدم طريقة بديلة لإنشاء معرّف فريد
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
};

export default nanoid; 