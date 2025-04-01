import React from 'react';
import ShopDashboardScreen from './shop-dashboard';

// بدلاً من إعادة التوجيه، نقوم بعرض مكون لوحة تحكم المحل مباشرة
export default function ShopIndex() {
  console.log("تم تنفيذ ملف index.tsx في مجلد shop - عرض مكون ShopDashboardScreen مباشرة");
  return <ShopDashboardScreen />;
} 