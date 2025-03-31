// @ts-nocheck
import React from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from './utils/store';

export default function Index() {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }
  
  // توجيه المستخدم بناءً على نوعه
  const userRole = String(user?.role).toLowerCase();
  
  if (userRole === 'admin') {
    return <Redirect href="/admin/admin-dashboard" />;
  } else if (userRole === 'shop_owner' || userRole === 'shop') {
    return <Redirect href="/shop/shop-dashboard" />;
  } else {
    // إذا لم يكن له دور محدد يدخل كعميل
    return <Redirect href="/customer/customer-dashboard" />;
  }
} 