import React from 'react';
import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

// تكوين متوافق مع GitHub Pages
export const unstable_settings = {
  initialRouteName: "login",
};

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
} 