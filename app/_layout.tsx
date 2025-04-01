import React, { useEffect, ReactNode } from 'react';
import { Stack } from 'expo-router';
import { useColorScheme, Platform } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { useAuthStore } from './utils/store';
import { checkAuthStatus } from './services/auth';
import * as Sentry from 'sentry-expo';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Text, View, StyleSheet } from 'react-native';

// استيراد البدائل قبل كل شيء آخر
import './polyfills';

// دالة لإنشاء معرف فريد
function createSimpleId(size = 21): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  
  for (let i = 0; i < size; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return id;
}

// تضمين بديل يدوي لـ nanoid (تأكيداً إضافياً)
if (typeof global !== 'undefined') {
  (global as any).nanoid = (global as any).nanoid || createSimpleId;
}

if (typeof window !== 'undefined') {
  (window as any).nanoid = (window as any).nanoid || createSimpleId;
  
  // دعم r.nanoid
  if (!(window as any).r) {
    (window as any).r = {};
  }
  (window as any).r.nanoid = (window as any).r.nanoid || createSimpleId;
}

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
try {
  Sentry.init({
    dsn: "https://c89f5f6c4e3c4e08ad05ba4bd1ecdd6f@o4506767913181184.ingest.sentry.io/4506767915147264",
    enableInExpoDevelopment: false,
    debug: false,
  });
} catch (error) {
  console.error("فشل في تهيئة Sentry:", error);
}

// دالة آمنة لتسجيل الأخطاء في Sentry
const captureException = (error: any) => {
  try {
    if (Sentry && typeof Sentry.Native?.captureException === 'function') {
      Sentry.Native.captureException(error);
    } else if (Sentry && typeof (Sentry as any).captureException === 'function') {
      (Sentry as any).captureException(error);
    } else {
      console.error("Sentry غير متاح:", error);
    }
  } catch (e) {
    console.error("خطأ عند محاولة تسجيل استثناء في Sentry:", e);
    console.error("الخطأ الأصلي:", error);
  }
};

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
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

// مكون الخطأ العام
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // تسجيل الخطأ في Sentry بطريقة آمنة
    captureException(error);
    console.error("خطأ في التطبيق:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // واجهة مستخدم محسنة للخطأ
      return (
        <PaperProvider>
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>حدث خطأ في التطبيق</Text>
            <Text style={styles.errorMessage}>{this.state.error?.message || 'خطأ غير معروف'}</Text>
            {this.state.error?.stack && (
              <Text style={styles.errorStack}>{this.state.error.stack}</Text>
            )}
            <Text style={styles.errorHint}>
              حاول إعادة تحميل الصفحة أو العودة للصفحة الرئيسية
            </Text>
          </View>
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
          captureException('فشل في التحقق من حالة المصادقة');
          return;
        }
        
        setUser(user);
        setIsAuthenticated(isAuthenticated);
      } catch (error) {
        console.error('حدث خطأ أثناء التحقق من حالة المصادقة:', error);
        captureException(error);
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

// أنماط لصفحة الخطأ
const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#dc3545',
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#343a40',
  },
  errorStack: {
    fontSize: 12,
    color: '#6c757d',
    backgroundColor: '#e9ecef',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    marginBottom: 20,
    direction: 'ltr',
  },
  errorHint: {
    fontSize: 14,
    color: '#007bff',
    textAlign: 'center',
  }
});

export default RootLayout; 