import React, { useEffect, ReactNode } from 'react';
import { Stack } from 'expo-router';
import { useColorScheme, Platform } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { useAuthStore } from './utils/store';
import { checkAuthStatus } from './services/auth';
import * as Sentry from 'sentry-expo';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Text } from 'react-native';
import './polyfills';

// استيراد reanimated بشكل مشروط بالمنصة
// فقط على المنصات المحمولة وليس الويب
if (Platform.OS !== 'web') {
  try {
    require('react-native-reanimated');
  } catch (e) {
    console.warn('Failed to load reanimated:', e);
  }
}

// تكوين Sentry لتتبع الأخطاء
Sentry.init({
  dsn: "https://c89f5f6c4e3c4e08ad05ba4bd1ecdd6f@o4506767913181184.ingest.sentry.io/4506767915147264",
});

// إضافة تكوين للمسارات بشكل مبسط
export const unstable_settings = {
  initialRouteName: "index",
};

// تعريف interface لمكون ErrorBoundary
interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// مكون الخطأ العام
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // تسجيل الخطأ في Sentry
    Sentry.Native.captureException(error);
    console.error("خطأ في التطبيق:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // يمكنك هنا عرض واجهة مستخدم للخطأ
      return (
        <PaperProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen
              name="error"
              options={{
                title: "حدث خطأ",
                headerShown: true,
              }}
            />
          </Stack>
        </PaperProvider>
      );
    }
    return this.props.children;
  }
}

function RootLayout() {
  const colorScheme = useColorScheme();
  const { setUser, setIsAuthenticated } = useAuthStore();
  const [loaded] = useFonts({
    // يمكن تحميل الخطوط هنا إذا لزم الأمر
  });

  useEffect(() => {
    async function loadAuthStatus() {
      try {
        const { isAuthenticated, user, error } = await checkAuthStatus();
        if (error) {
          console.error('فشل في التحقق من حالة المصادقة:', error);
          Sentry.Native.captureMessage('فشل في التحقق من حالة المصادقة');
          return;
        }
        
        setUser(user);
        setIsAuthenticated(isAuthenticated);
      } catch (error) {
        console.error('حدث خطأ أثناء التحقق من حالة المصادقة:', error);
        Sentry.Native.captureException(error);
      }
    }

    loadAuthStatus();
  }, []);

  if (!loaded) {
    return <Text>جاري تحميل التطبيق...</Text>;
  }

  return (
    <ErrorBoundary>
      <PaperProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }} />
      </PaperProvider>
    </ErrorBoundary>
  );
}

export default RootLayout; 