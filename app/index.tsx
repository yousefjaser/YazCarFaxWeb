// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Redirect, useRootNavigationState, router } from 'expo-router';
import { Text, View, ActivityIndicator } from 'react-native';
import { useAuthStore } from './utils/store';
import * as Sentry from 'sentry-expo';

export default function Index() {
  const { isAuthenticated, user } = useAuthStore();
  const rootNavigationState = useRootNavigationState();
  const [isReady, setIsReady] = useState(false);

  // منع التوجيه المتكرر والانتظار حتى جاهزية حالة التنقل
  useEffect(() => {
    if (rootNavigationState?.key) {
      // ننتظر لحظة قبل تنفيذ التوجيه لتجنب حلقة إعادة توجيه
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [rootNavigationState?.key]);

  // إذا لم تكن حالة التنقل جاهزة، نعرض شاشة تحميل
  if (!rootNavigationState?.key || !isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: 10 }}>جاري تحميل التطبيق...</Text>
      </View>
    );
  }

  try {
    if (!isAuthenticated) {
      console.log("المستخدم غير مسجل، توجيه إلى صفحة تسجيل الدخول");
      // استخدام router.replace بدلاً من Redirect لتجنب تكرار
      router.replace("/auth/login");
      return null;
    }

    console.log("المستخدم مسجل، الدور:", user?.role);
    switch (user?.role) {
      case 'admin':
        router.replace("/admin/admin-dashboard");
        return null;
      case 'shop':
        router.replace("/shop/shop-dashboard");
        return null;
      case 'customer':
        router.replace("/customer/customer-dashboard");
        return null;
      default:
        router.replace("/auth/login");
        return null;
    }
  } catch (error) {
    Sentry.Native.captureException(error);
    console.error("خطأ في التوجيه:", error);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>حدث خطأ أثناء توجيهك. يرجى المحاولة مرة أخرى.</Text>
      </View>
    );
  }
} 