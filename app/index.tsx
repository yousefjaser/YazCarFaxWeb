// @ts-nocheck
import React, { useEffect } from 'react';
import { Redirect, useRootNavigationState } from 'expo-router';
import { Text, View } from 'react-native';
import { useAuthStore } from './utils/store';

export default function Index() {
  const { isAuthenticated, user } = useAuthStore();
  const rootNavigationState = useRootNavigationState();
  
  if (!rootNavigationState?.key) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>جاري تحميل التطبيق...</Text>
      </View>
    );
  }
  
  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }
  
  switch (user?.role) {
    case 'admin':
      return <Redirect href="/admin/admin-dashboard" />;
    case 'shop':
      return <Redirect href="/shop/shop-dashboard" />;
    case 'customer':
      return <Redirect href="/customer/customer-dashboard" />;
    default:
      return <Redirect href="/auth/login" />;
  }
} 