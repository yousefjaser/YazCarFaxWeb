// @ts-nocheck
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '../utils/store';
import { useRouter } from 'expo-router';

// مكون التخطيط الخاص بالويب - لا نستخدم فيه الدراور
function WebLayout() {
  return (
    <Stack 
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}

// مكون التخطيط الخاص بالأجهزة المحمولة - نستخدم فيه الدراور
function MobileLayout() {
  // فقط قم باستيراد مكتبات الدراور للأجهزة المحمولة
  const { createDrawerNavigator } = require('@react-navigation/drawer');
  const { DrawerContent } = require('../components/AppDrawer');
  const Drawer = createDrawerNavigator();
  
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerPosition: 'right',
        drawerType: 'front',
        drawerStyle: {
          width: '75%',
        },
      }}
    >
      <Drawer.Screen name="index" options={{ headerShown: false }}>
        {() => (
          <Stack 
            screenOptions={{
              headerShown: false,
            }}
          />
        )}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
}

function AdminLayout() {
  const { user } = useAuthStore();
  const router = useRouter();

  // التأكد من أن المستخدم قد سجل الدخول
  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  // التأكد من أن المستخدم هو مدير
  const userRole = String(user.role).toLowerCase();
  if (userRole !== 'admin') {
    if (userRole === 'shop_owner' || userRole === 'shop') {
      return <Redirect href="/shop/shop-dashboard" />;
    } else {
      return <Redirect href="/customer/customer-dashboard" />;
    }
  }

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? <WebLayout /> : <MobileLayout />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});

export default AdminLayout; 