---

## ✅ برومبت احترافي لبناء تطبيق يشبه Seneca CarFax باستخدام React Native + Supabase

> أريدك أن تتصرف كمطور محترف لبناء نظام متكامل لصيانة السيارات يشبه Seneca CarFax باستخدام React Native للتطبيق و Supabase كخلفية.  
> النظام يخدم محلات الصيانة، أصحاب السيارات، ومشرفين إداريين (Admin) من خلال لوحة تحكم متكاملة.

### 👨‍🔧 أصحاب المحلات:
- يسجلون حساب جديد عبر نموذج يشمل:
  - اسم المحل
  - اسم المالك
  - رقم الجوال
  - العنوان والموقع الجغرافي
- يتم إرسال طلب الموافقة إلى الـ Owner (Admin).
- بعد القبول، يمكنهم:
  - عمل Scan لـ QR Code للسيارة.
  - إدخال بيانات السيارة (إذا جديدة) أو الدخول لسجلها.
  - تسجيل زيارات الصيانة: تاريخ، نوع خدمة، العداد، الملاحظات، السعر.
  - ربط السيارة بالعميل (اسم، رقم جوال، رقم السيارة).

### 🚗 إدارة المركبات:
- كل مركبة لها:
  - QR Code فريد يمثل `car_id`
  - نوع المركبة + طرازها (Model, Make)
  - سجل صيانة مفصل.
- جدول خاص بأنواع المركبات والطرازات لتسهيل الاختيار.
  
### 👥 العملاء (مالكي السيارات):
- يمكنهم:
  - مسح QR Code الخاص بسيارتهم.
  - عرض تفاصيل مركبتهم وسجل الصيانة.
  - رؤية معلومات المحل الذي خدمهم (اسم، موقع، رقم).
  - تفعيل إشعارات التذكير لتغيير الزيت القادم.

### 🧾 لوحة تحكم CarFax (Dashboard Admin):
- رؤية كل المحلات المسجلة وإدارتها.
- قبول/رفض طلبات تسجيل المحلات.
- عرض كل المركبات المسجلة وربطها بالمستخدمين والمحلات.
- إدارة فئات الصيانة (مثلاً: تغيير زيت، فحص فرامل، تبديل بطارية).
- تحليل العمليات (عدد زيارات، أعلى المحلات نشاطًا، أكثر الخدمات استخدامًا).
- إمكانية التعديل/الحذف لأي سجل.

### 🗃️ قاعدة البيانات المقترحة:
- `users` (roles: admin, shop_owner, customer)
- `shops` (shop_name, location, owner_id, status)
- `cars` (qr_id, make, model, year, shop_id, customer_id)
- `service_categories` (name, description)
- `oil_changes` / `service_visits` (car_id, service_id, date, mileage, notes, shop_id)
- `shop_requests` (pending requests to be approved)
- `vehicle_types` و `models` (لعرض الأنواع والطرازات بشكل منظم)
- `notifications` (لتذكير العملاء بموعد الخدمة القادمة)

### 🔧 المطلوب منك كمطور:
- تصميم هيكل قاعدة البيانات بناءً على هذا النموذج.
- تحديد تدفق الشاشات لكل نوع مستخدم (صاحب محل، عميل، Admin).
- تحديد المكتبات المناسبة:
  - react-native-vision-camera: `vision-camera-code-scanner`
  - State Management: `zustand` أو `redux`
  - UI: `React Native Paper` أو `Native Base`
- بناء نظام تسجيل دخول يعتمد على Roles (user type).
- توفير Web Admin Panel (يمكن يكون بـ Next.js) لإدارة النظام.

---

هل ترغب أبدأ الآن بإعداد **schema بصيغة JSON أو SQL** لقاعدة البيانات؟ أو تفضل أجهز لك **UX Flow لتدفق الشاشات** أولًا؟
## الخطوة 2: تكوين Supabase

قم بإنشاء ملف `app/config/index.ts` للاتصال بـ Supabase:

```typescript
// app/config/index.ts
import { createClient } from '@supabase/supabase-js';

const ENV = {
  dev: {
    SUPABASE_URL: 'https://egnvrxqoamgpjtmhnhri.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnbnZyeHFvYW1ncGp0bWhuaHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5Mzk4MjYsImV4cCI6MjA1MTUxNTgyNn0.aVuGbcFp8vXTMKMLWq-JcWs7cXM8Iuw3f0N1iTO7qOo',
    API_URL: 'https://egnvrxqoamgpjtmhnhri.supabase.co',
  },
  prod: {
    SUPABASE_URL: 'https://egnvrxqoamgpjtmhnhri.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnbnZyeHFvYW1ncGp0bWhuaHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5Mzk4MjYsImV4cCI6MjA1MTUxNTgyNn0.aVuGbcFp8vXTMKMLWq-JcWs7cXM8Iuw3f0N1iTO7qOo',
    API_URL: 'https://egnvrxqoamgpjtmhnhri.supabase.co',
  }
};

// تحديد البيئة الحالية
const environment = 'dev';
const currentEnv = ENV[environment as keyof typeof ENV];

// تصدير المتغيرات
export const SUPABASE_URL = currentEnv.SUPABASE_URL;
export const SUPABASE_KEY = currentEnv.SUPABASE_KEY;
export const API_URL = currentEnv.API_URL;

// إنشاء عميل Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// تكوين التطبيق العام
export const APP_CONFIG = {
  APP_NAME: 'YazCar',
  VERSION: '1.0.0',
};
```

## الخطوة 3: إنشاء الأنواع (Types)

قم بإنشاء ملف `app/types/index.ts` لتعريف الأنواع:

```typescript
// app/types/index.ts
export enum UserRole {
  ADMIN = 'admin',
  SHOP_OWNER = 'shop_owner',
  CUSTOMER = 'customer',
}

export type User = {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  created_at: string;
};

export type Shop = {
  id: string;
  name: string;
  owner_id: string;
  phone: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

export type Car = {
  id: string;
  qr_id: string;
  make: string;
  model: string;
  year: number;
  customer_id: string;
  plate_number: string;
  created_at: string;
};

export type ServiceCategory = {
  id: string;
  name: string;
  description: string;
};

export type ServiceVisit = {
  id: string;
  car_id: string;
  shop_id: string;
  service_category_id: string;
  date: string;
  mileage?: number;
  notes?: string;
  price: number;
  next_service_reminder?: string;
};

export type VehicleType = {
  id: string;
  name: string;
};

export type VehicleModel = {
  id: string;
  type_id: string;
  name: string;
  year_start: number;
  year_end?: number;
};
```

## الخطوة 4: إعداد مخزن الحالة (State Store)

قم بإنشاء ملف `app/utils/store.ts` باستخدام Zustand:

```typescript
// app/utils/store.ts
import { create } from 'zustand';
import { User, UserRole } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => set({ token }),
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  logout: () => set({ user: null, token: null, isAuthenticated: false }),
}));
```

## الخطوة 5: إنشاء خدمات المصادقة

قم بإنشاء ملف `app/services/auth.ts`:

```typescript
// app/services/auth.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config';
import { UserRole } from '../types';

const TOKEN_KEY = 'yazcar_auth_token';
const USER_KEY = 'yazcar_user_data';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'shop_owner' | 'customer' | 'admin';
  shop_id?: string;
  created_at: string;
}

/**
 * تسجيل الدخول
 */
export const signIn = async (email: string, password: string, rememberMe: boolean = true) => {
  try {
    console.log('محاولة تسجيل الدخول:', { email, rememberMe });
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log('خطأ في مصادقة Supabase:', error);
      throw error;
    }

    console.log('نجاح المصادقة مع Supabase');
    const { user, session } = data;
    
    if (user && session) {
      console.log('معرف المستخدم من المصادقة:', user.id);
      
      // الحصول على بيانات المستخدم الإضافية من جدول المستخدمين
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      console.log('نتيجة البحث عن المستخدم في جدول users:', { userData, userError });
      
      if (userError) {
        console.log('خطأ في البحث عن المستخدم:', userError);
        throw userError;
      }
      
      if (!userData) {
        console.log('لم يتم العثور على المستخدم في جدول users');
        throw new Error('لم يتم العثور على بيانات المستخدم');
      }

      console.log('تم العثور على المستخدم وجاري حفظ البيانات');
      // حفظ بيانات المستخدم ورمز المصادقة في التخزين المحلي إذا كان "تذكرني" مفعلاً
      if (rememberMe) {
        await AsyncStorage.setItem(TOKEN_KEY, session.access_token);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
        console.log('تم حفظ بيانات المستخدم والجلسة محلياً');
      }

      return {
        data: {
          user: userData,
          session,
        },
        error: null,
      };
    }

    return { data, error: null };
  } catch (error) {
    console.log('خطأ غير متوقع في تسجيل الدخول:', error);
    return { data: null, error };
  }
};

/**
 * تسجيل الخروج
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);

    return { error: null };
  } catch (error) {
    return { error };
  }
};

/**
 * الحصول على بيانات المستخدم المسجل دخوله
 */
export const getCurrentUser = async (): Promise<{ user: AuthUser | null; error: any }> => {
  try {
    const userJson = await AsyncStorage.getItem(USER_KEY);
    
    if (!userJson) {
      return { user: null, error: null };
    }
    
    const user = JSON.parse(userJson) as AuthUser;
    return { user, error: null };
  } catch (error: any) {
    return {
      user: null,
      error: {
        message: error.message || 'فشل في الحصول على بيانات المستخدم',
      },
    };
  }
};

/**
 * التحقق من حالة المصادقة للمستخدم
 */
export const checkAuthStatus = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    
    if (data?.session) {
      const { user } = data.session;
      
      // الحصول على بيانات المستخدم الإضافية من التخزين المحلي
      const { user: storedUser, error: userError } = await getCurrentUser();
      
      if (userError) throw userError;
      
      if (storedUser) {
        return {
          isAuthenticated: true,
          user: storedUser,
          error: null,
        };
      }
      
      // إذا لم يتم العثور على بيانات المستخدم في التخزين المحلي، نقوم بجلبها من قاعدة البيانات
      const { data: userData, error: userError2 } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
        
      if (userError2) throw userError2;
      
      if (userData) {
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
        
        return {
          isAuthenticated: true,
          user: userData,
          error: null,
        };
      }
    }
    
    return {
      isAuthenticated: false,
      user: null,
      error: null,
    };
  } catch (error) {
    return {
      isAuthenticated: false,
      user: null,
      error,
    };
  }
};
```

## الخطوة 6: إنشاء صفحة تسجيل الدخول

قم بإنشاء صفحة تسجيل الدخول بمسار Expo Router الصحيح:

```typescript
// app/auth/login.tsx
import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, Checkbox } from 'react-native-paper';
import { COLORS, SPACING } from '../constants';
import Input from '../components/Input';
import Button from '../components/Button';
import ErrorMessage from '../components/ErrorMessage';
import Loading from '../components/Loading';
import { signIn } from '../services/auth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../utils/store';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const { setUser, setIsAuthenticated } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    if (loading) return;
    
    setLoading(true);
    setError('');

    try {
      const { data, error: loginError } = await signIn(email, password, rememberMe);
      
      if (loginError) {
        setError(typeof loginError === 'object' && loginError !== null && 'message' in loginError 
          ? String(loginError.message) 
          : 'فشل تسجيل الدخول');
        return;
      }

      // نجاح تسجيل الدخول - تعيين حالة المستخدم وتفعيل المصادقة
      if (data?.user) {
        setUser(data.user);
        setIsAuthenticated(true);
      }
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Icon name="car-wrench" size={100} color={COLORS.primary} />
          <Text style={styles.logoText}>يَزْ كار</Text>
        </View>
        
        <View style={styles.formContainer}>
          {error ? (
            <ErrorMessage
              message={error}
              onDismiss={() => setError('')}
            />
          ) : null}

          <Input
            label="البريد الإلكتروني"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            icon="email"
          />

          <Input
            label="كلمة المرور"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            icon="lock"
          />

          <View style={styles.rememberMeContainer}>
            <Checkbox
              status={rememberMe ? 'checked' : 'unchecked'}
              onPress={() => setRememberMe(!rememberMe)}
              color={COLORS.primary}
            />
            <TouchableOpacity onPress={() => setRememberMe(!rememberMe)}>
              <Text style={styles.rememberMeText}>تذكرني</Text>
            </TouchableOpacity>
          </View>

          <Button
            title="تسجيل الدخول"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.loginButton}
          />

          <TouchableOpacity 
            onPress={() => router.push("/auth/forgot-password")}
            style={styles.forgotPasswordLink}
          >
            <Text style={styles.forgotPasswordText}>نسيت كلمة المرور؟</Text>
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>ليس لديك حساب؟</Text>
            <TouchableOpacity onPress={() => router.push("/auth/register")}>
              <Text style={styles.registerLink}>إنشاء حساب جديد</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {loading && <Loading fullScreen message="جاري تسجيل الدخول..." />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: SPACING.md,
  },
  formContainer: {
    marginVertical: SPACING.xl,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  rememberMeText: {
    color: COLORS.gray,
    marginRight: 8,
  },
  loginButton: {
    marginTop: SPACING.lg,
  },
  forgotPasswordLink: {
    marginTop: SPACING.md,
    alignSelf: 'center',
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xl,
  },
  registerText: {
    color: COLORS.gray,
    marginRight: 5,
  },
  registerLink: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: SPACING.md,
  },
});
```

## الخطوة 7: إنشاء ملفات التخطيط (Layouts)

### ملف التخطيط الرئيسي
```typescript
// app/_layout.tsx
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { useAuthStore } from './utils/store';
import { checkAuthStatus } from './services/auth';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { setUser, setIsAuthenticated } = useAuthStore();

  useEffect(() => {
    async function loadAuthStatus() {
      try {
        const { isAuthenticated, user, error } = await checkAuthStatus();
        if (error) {
          console.error('فشل في التحقق من حالة المصادقة:', error);
          return;
        }
        
        setUser(user);
        setIsAuthenticated(isAuthenticated);
      } catch (error) {
        console.error('حدث خطأ أثناء التحقق من حالة المصادقة:', error);
      }
    }

    loadAuthStatus();
  }, []);

  return (
    <PaperProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </PaperProvider>
  );
}
```

### ملف تخطيط مسار المصادقة

```typescript
// app/auth/_layout.tsx
import { Stack } from 'expo-router';

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
```

## الخطوة 8: إنشاء صفحة لوحة تحكم المحل (Shop Dashboard)

```typescript
// app/shop/shop-dashboard.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, IconButton } from 'react-native-paper';
import { COLORS, SPACING } from '../constants';
import { useAuthStore } from '../utils/store';
import { getShopByOwnerId } from '../services/shop';
import { useRouter } from 'expo-router';
import { Shop } from '../types';

export default function ShopDashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadShopData = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await getShopByOwnerId(user.id);
      if (error) {
        console.error('فشل في تحميل بيانات المحل:', error);
        return;
      }
      
      setShop(data);
    } catch (error) {
      console.error('حدث خطأ أثناء تحميل بيانات المحل:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadShopData();
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadShopData();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>لوحة تحكم المحل</Text>
        <IconButton icon="refresh" onPress={handleRefresh} />
      </View>
      
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {!loading && !shop && (
          <Card style={styles.warningCard}>
            <Card.Content>
              <Text style={styles.warningText}>
                لم يتم العثور على محل لهذا الحساب. يرجى التواصل مع الإدارة.
              </Text>
            </Card.Content>
          </Card>
        )}
        
        {shop && (
          <>
            <Card style={styles.shopInfoCard}>
              <Card.Title title="معلومات المحل" />
              <Card.Content>
                <Text style={styles.shopName}>{shop.name}</Text>
                <Text style={styles.shopDetail}>العنوان: {shop.address}</Text>
                <Text style={styles.shopDetail}>رقم الهاتف: {shop.phone}</Text>
                <Text style={styles.shopStatus}>
                  الحالة: {shop.status === 'approved' ? 'مفعل' : shop.status === 'pending' ? 'قيد المراجعة' : 'مرفوض'}
                </Text>
              </Card.Content>
            </Card>
            
            <View style={styles.actions}>
              <Button
                mode="contained"
                icon="car-info"
                onPress={() => router.push('/shop/add-car')}
                style={styles.actionButton}
              >
                إضافة سيارة
              </Button>
              
              <Button
                mode="contained"
                icon="format-list-bulleted"
                onPress={() => router.push('/shop/cars-list')}
                style={styles.actionButton}
              >
                قائمة السيارات
              </Button>
              
              <Button
                mode="contained"
                icon="history"
                onPress={() => router.push('/shop/service-history')}
                style={styles.actionButton}
              >
                سجل الخدمات
              </Button>
              
              <Button
                mode="contained"
                icon="qrcode-scan"
                onPress={() => router.push('/shop/scan-car')}
                style={styles.actionButton}
              >
                مسح رمز QR
              </Button>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  content: {
    padding: SPACING.md,
    flexGrow: 1,
  },
  warningCard: {
    marginVertical: SPACING.md,
    backgroundColor: COLORS.warning + '20', // بإضافة شفافية
  },
  warningText: {
    color: COLORS.dark,
    textAlign: 'center',
  },
  shopInfoCard: {
    marginVertical: SPACING.md,
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  shopDetail: {
    fontSize: 14,
    marginBottom: SPACING.xs,
  },
  shopStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: SPACING.sm,
    color: COLORS.primary,
  },
  actions: {
    marginTop: SPACING.lg,
  },
  actionButton: {
    marginBottom: SPACING.md,
  },
});
```

## الخطوة 9: إعداد التنقل والتوجيه حسب نوع المستخدم

```typescript
// app/index.tsx
import { Redirect } from 'expo-router';
import { useAuthStore } from './utils/store';

export default function Index() {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }
  
  // توجيه المستخدم بناءً على نوعه
  if (user?.role === 'admin') {
    return <Redirect href="/admin/admin-dashboard" />;
  } else if (user?.role === 'shop_owner') {
    return <Redirect href="/shop/shop-dashboard" />;
  } else {
    return <Redirect href="/customer/customer-dashboard" />;
  }
}
```

## الخطوة 10: إنشاء ملفات الثوابت والألوان

```typescript
// app/constants/index.ts
export const COLORS = {
  primary: '#2563EB', // Blue
  secondary: '#4ADE80', // Green
  accent: '#F97316', // Orange
  background: '#F8FAFC', // Light gray
  white: '#FFFFFF',
  black: '#1E293B',
  error: '#EF4444', // Red
  success: '#10B981', // Green
  warning: '#F59E0B', // Amber
  info: '#3B82F6', // Light Blue
  dark: '#0F172A', // Dark Blue Grey
  gray: '#64748B',
  lightGray: '#E2E8F0',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};
```

## الخطوة 11: تخصيص بنية قاعدة البيانات في Supabase

لإنشاء التطبيق، ستحتاج إلى إنشاء الجداول التالية في Supabase:

1. **users** - لتخزين بيانات المستخدمين
2. **shops** - لتخزين بيانات المحلات
3. **cars** - لتخزين بيانات السيارات
4. **service_categories** - لتخزين فئات الخدمات
5. **service_visits** - لتخزين زيارات الخدمة
6. **vehicle_types** - لتخزين أنواع المركبات

استخدم URL و API Key كما موضح في ملف التكوين لإنشاء قاعدة البيانات في Supabase.

## ملاحظات إضافية

1. لاحظ أن Expo Router يحافظ على بنية مجلد `app` لإنشاء المسارات تلقائيًا.
2. تأكد من إعداد ملفات التخطيط المناسبة (`_layout.tsx`) لكل مسار.
3. يمكنك استخدام Navigator المدمج مع Expo Router مثل Stack و Tabs و Drawer.
4. استخدم `useLocalSearchParams()` بدلاً من `route.params`.
5. استخدم `useRouter()` بدلاً من `navigation.navigate()`.

باتباع هذا الدليل، يمكنك إنشاء نسخة من تطبيق YazCar باستخدام Expo Router بدلاً من React Navigation التقليدي.
