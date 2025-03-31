// @ts-nocheck
import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { Text, View, ActivityIndicator } from 'react-native';
import { useAuthStore } from './utils/store';
import * as Sentry from 'sentry-expo';

export default function Index() {
  const { isAuthenticated, user } = useAuthStore();

  // توجيه المستخدم فور تحميل الصفحة الرئيسية
  useEffect(() => {
    // ننتظر لحظة قبل إعادة التوجيه لتجنب الحلقات
    const timer = setTimeout(() => {
      if (isAuthenticated && user) {
        console.log("المستخدم مسجل، الدور:", user?.role);
        
        // التوجيه بناءً على دور المستخدم
        switch (user?.role) {
          case 'admin':
            router.replace('/admin/admin-dashboard');
            break;
          case 'shop':
            router.replace('/shop/shop-dashboard');
            break;
          case 'customer':
            router.replace('/customer/customer-dashboard');
            break;
          default:
            router.replace('/auth/login');
            break;
        }
      } else {
        // المستخدم غير مسجل دخوله، توجيه إلى صفحة تسجيل الدخول
        console.log("المستخدم غير مسجل، توجيه إلى صفحة تسجيل الدخول");
        router.replace('/auth/login');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user]);

  // عرض شاشة التحميل أثناء التوجيه
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#0000ff" />
      <Text style={{ marginTop: 10 }}>جاري تحميل التطبيق...</Text>
    </View>
  );
} 