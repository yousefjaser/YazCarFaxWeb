// @ts-nocheck
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '../utils/store';
import { useRouter } from 'expo-router';

// مكون التخطيط الخاص بالويب - لا نستخدم فيه الدراور
function WebLayout() {
  console.log("تم تنفيذ WebLayout في ملف _layout.tsx");
  return (
    <Stack 
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="shop-dashboard"
    />
  );
}

// مكون التخطيط الخاص بالأجهزة المحمولة - نستخدم فيه الدراور
function MobileLayout() {
  console.log("تم تنفيذ MobileLayout في ملف _layout.tsx");
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
      initialRouteName="shop-dashboard"
    >
      <Drawer.Screen name="shop-dashboard" options={{ headerShown: false }}>
        {() => (
          <Stack 
            screenOptions={{
              headerShown: false,
            }}
            initialRouteName="shop-dashboard"
          />
        )}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
}

function ShopLayout() {
  console.log("تم تنفيذ ShopLayout في ملف _layout.tsx");
  const { user } = useAuthStore();
  const router = useRouter();

  // التأكد من أن المستخدم قد سجل الدخول
  if (!user) {
    console.log("لم يتم تسجيل الدخول، توجيه إلى صفحة تسجيل الدخول");
    return <Redirect href="/auth/login" />;
  }

  // التأكد من أن المستخدم هو صاحب محل
  const userRole = String(user.role).toLowerCase();
  if (userRole !== 'shop_owner' && userRole !== 'shop' && userRole !== 'admin') {
    console.log("المستخدم ليس صاحب محل، توجيه إلى لوحة تحكم العميل");
    return <Redirect href="/customer/customer-dashboard" />;
  }

  console.log("المستخدم مصرح له، عرض واجهة المحل");
  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? <WebLayout /> : <WebLayout />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});

export default ShopLayout; 