import './polyfills';

import React, { useEffect, ReactNode } from 'react';
import { Stack } from 'expo-router';
import { useColorScheme, Platform, LogBox } from 'react-native';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { useAuthStore } from './utils/store';
import { checkAuthStatus } from './services/auth';
import * as Sentry from 'sentry-expo';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Text, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// دالة لإنشاء معرف فريد
function generateId(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// مكون لعرض الأخطاء
class ErrorBoundary extends React.Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("خطأ في التطبيق:", error, errorInfo);
    try {
      if (Sentry && Sentry.Native) {
        Sentry.Native.captureException(error);
      } else {
        console.error("Sentry غير متاح:", error);
      }
    } catch (sentryError) {
      console.error("خطأ عند محاولة استخدام Sentry:", sentryError);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>
            حدث خطأ في التطبيق
          </Text>
          <Text style={styles.errorMessage}>
            نأسف على هذا الخطأ. يرجى إعادة تحميل التطبيق.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

// كتم بعض التحذيرات غير المهمة
LogBox.ignoreLogs([
  'Overwriting fontFamily style attribute preprocessor',
  'ViewPropTypes will be removed',
  'Deprecation warning: value provided is not in a recognized RFC2822 or ISO format',
  'Constants.deviceId',
  'Each child in a list should',
  'VirtualizedLists should never be nested',
  'Possible Unhandled Promise Rejection'
]);

// تخصيص سمة React Native Paper
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#083c70',
    accent: '#083c70',
  },
};

function RootLayout() {
  const { user, setUser } = useAuthStore();
  const [loaded, setLoaded] = React.useState(false);

  // تحميل الخطوط
  const [fontsLoaded] = useFonts({
    'MaterialIcons': require('react-native-vector-icons/Fonts/MaterialIcons.ttf'),
    'MaterialCommunityIcons': require('react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf'),
    'Ionicons': require('react-native-vector-icons/Fonts/Ionicons.ttf'),
    'FontAwesome': require('react-native-vector-icons/Fonts/FontAwesome.ttf'),
  });

  async function loadAuthStatus() {
    try {
      // تحقق من حالة تسجيل الدخول
      const { isAuthenticated, user, error } = await checkAuthStatus();
      
      if (error) {
        console.error("فشل التحقق من حالة المصادقة:", error);
        // هنا يمكنك التعامل مع خطأ المصادقة
      } else if (user) {
        // تعيين بيانات المستخدم في التخزين
        setUser(user);
      }
    } catch (err) {
      console.error("خطأ أثناء التحقق من حالة المصادقة:", err);
    } finally {
      // تحديث حالة التحميل
      setLoaded(true);
    }
  }

  // تحقق من حالة المصادقة عند تحميل التطبيق
  useEffect(() => {
    loadAuthStatus();
  }, []);

  // استخدام تأثير لتثبيت nanoid عند بدء التطبيق
  useEffect(() => {
    // محاولة لإصلاح nanoid في expo-router
    if (typeof global !== 'undefined' && typeof global.window !== 'undefined') {
      // @ts-ignore
      if (!global.window.r) global.window.r = {};
      // @ts-ignore
      if (!global.window.r.nanoid) global.window.r.nanoid = function nanoid(size = 21) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let id = '';
        for (let i = 0; i < size; i++) {
          id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
      };
    }
  }, []);

  if (!loaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>جاري تحميل التطبيق...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <StatusBar style="dark" />
          <Stack 
            screenOptions={{ 
              headerShown: false,
              animation: 'slide_from_right'
            }} 
          />
        </PaperProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF'
  },
  loadingText: {
    fontSize: 18,
    color: '#083c70'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 10,
    textAlign: 'center'
  },
  errorMessage: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center'
  }
});

export default RootLayout; 