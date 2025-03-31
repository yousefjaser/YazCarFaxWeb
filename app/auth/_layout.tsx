import React from 'react';
import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

// تكوين متوافق مع GitHub Pages
export const unstable_settings = {
  initialRouteName: "login",
};

// تم إزالة تكوين router.type لتجنب التعارض مع الإعدادات في app.json

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
} 