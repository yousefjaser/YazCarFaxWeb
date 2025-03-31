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

// دوال المصادقة
export const signUp = async (email, password) => {
  return await supabase.auth.signUp({ email, password });
};

export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
};

// تصدير افتراضي لدعم NOBRIDGE
export default {
  signUp,
  signIn,
  signOut,
  getSession
}; 