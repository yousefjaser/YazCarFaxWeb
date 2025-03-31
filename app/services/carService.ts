// @ts-nocheck
import { supabase } from '../config';

/**
 * البحث عن سيارة بواسطة المعرف
 * @param id معرف السيارة
 * @returns بيانات السيارة والعميل المرتبط بها
 */
export async function searchCar(id: string) {
  return await supabase
    .from('cars')
    .select(`
      *,
      customer:customer_id (
        id,
        name,
        phone
      )
    `)
    .eq('id', id)
    .maybeSingle();
}

// خدمات إضافية للسيارات يمكن إضافتها هنا

// تصدير افتراضي لدعم NOBRIDGE
export default { searchCar }; 