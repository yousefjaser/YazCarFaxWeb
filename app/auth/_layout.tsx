import React from 'react';
import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

// تكوين متوافق مع GitHub Pages
export const unstable_settings = {
  initialRouteName: "login",
};

// تكوين Router لاستخدام Hash Router
export const router = {
  type: "hash",
};

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
} 