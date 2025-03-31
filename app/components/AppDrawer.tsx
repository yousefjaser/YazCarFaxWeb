import React from 'react';
import { View, StyleSheet, Image, Alert } from 'react-native';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { Drawer, Text, Avatar, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../constants';
import { useAuthStore } from '../utils/store';
import { signOut } from '../services/auth';

// تعديل الألوان
const DRAWER_COLORS = {
  ...COLORS,
  danger: COLORS.error  // استخدام اللون الموجود بالفعل
};

// مكون لعرض المحتوى الداخلي للدراور
export function DrawerContent(props) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  
  // هذه دالة لمعالجة تسجيل الخروج
  const handleLogout = async () => {
    try {
      Alert.alert(
        "تسجيل الخروج",
        "هل أنت متأكد من رغبتك في تسجيل الخروج؟",
        [
          {
            text: "إلغاء",
            style: "cancel"
          },
          {
            text: "نعم", 
            onPress: async () => {
              const { error } = await signOut();
              if (error) {
                console.error('خطأ في تسجيل الخروج:', error);
                Alert.alert('خطأ', 'حدث خطأ أثناء تسجيل الخروج');
                return;
              }
              
              // تحديث حالة التخزين
              logout();
              // التوجيه إلى صفحة تسجيل الدخول
              router.replace('/auth/login');
            }
          }
        ]
      );
    } catch (error) {
      console.error('خطأ غير متوقع:', error);
      Alert.alert('خطأ', 'حدث خطأ غير متوقع');
    }
  };
  
  // تحديد القائمة حسب دور المستخدم
  const renderMenuItems = () => {
    if (!user) return null;
    
    // قائمة مشتركة للجميع
    const commonItems = (
      <>
        <DrawerItem
          icon={({color, size}) => (
            <Icon name="account" color={COLORS.primary} size={size} />
          )}
          label="الملف الشخصي"
          labelStyle={styles.drawerLabel}
          onPress={() => {
            props.navigation.closeDrawer();
            // استخدام مقارنة النص العادية بدلاً من القيم الثابتة
            const userRole = String(user.role).toLowerCase();
            if (userRole === 'customer' || userRole === 'customer') {
              router.push('/customer/profile');
            } else if (userRole === 'shop_owner' || userRole === 'shop') {
              router.push('/shop/profile');
            } else if (userRole === 'admin') {
              router.push('/admin/profile');
            }
          }}
        />
      </>
    );
    
    // استخدام مقارنة النص العادية
    const userRole = String(user.role).toLowerCase();
    
    // عناصر خاصة بصاحب المحل
    if (userRole === 'shop_owner' || userRole === 'shop') {
      return (
        <>
          <DrawerItem
            icon={({color, size}) => (
              <Icon name="view-dashboard" color={COLORS.primary} size={size} />
            )}
            label="لوحة التحكم"
            labelStyle={styles.drawerLabel}
            onPress={() => {
              props.navigation.closeDrawer();
              router.push('/shop/shop-dashboard');
            }}
          />
          
          <DrawerItem
            icon={({color, size}) => (
              <Icon name="car" color={COLORS.primary} size={size} />
            )}
            label="السيارات"
            labelStyle={styles.drawerLabel}
            onPress={() => {
              props.navigation.closeDrawer();
              router.push('/shop/cars');
            }}
          />
          
          <DrawerItem
            icon={({color, size}) => (
              <Icon name="history" color={COLORS.primary} size={size} />
            )}
            label="سجل الخدمات"
            labelStyle={styles.drawerLabel}
            onPress={() => {
              props.navigation.closeDrawer();
              router.push('/shop/service-history');
            }}
          />
          
          <DrawerItem
            icon={({color, size}) => (
              <Icon name="qrcode-scan" color={COLORS.primary} size={size} />
            )}
            label="مسح QR"
            labelStyle={styles.drawerLabel}
            onPress={() => {
              props.navigation.closeDrawer();
              router.push('/shop/scan');
            }}
          />
          
          {commonItems}
        </>
      );
    }
    
    // عناصر خاصة بالعميل
    else if (userRole === 'customer') {
      return (
        <>
          <DrawerItem
            icon={({color, size}) => (
              <Icon name="view-dashboard" color={COLORS.primary} size={size} />
            )}
            label="لوحة التحكم"
            labelStyle={styles.drawerLabel}
            onPress={() => {
              props.navigation.closeDrawer();
              router.push('/customer/customer-dashboard');
            }}
          />
          
          <DrawerItem
            icon={({color, size}) => (
              <Icon name="car" color={COLORS.primary} size={size} />
            )}
            label="سياراتي"
            labelStyle={styles.drawerLabel}
            onPress={() => {
              props.navigation.closeDrawer();
              router.push('/customer/cars');
            }}
          />
          
          {commonItems}
        </>
      );
    }
    
    // عناصر خاصة بالمدير
    else if (userRole === 'admin') {
      return (
        <>
          <DrawerItem
            icon={({color, size}) => (
              <Icon name="view-dashboard" color={COLORS.primary} size={size} />
            )}
            label="لوحة التحكم"
            labelStyle={styles.drawerLabel}
            onPress={() => {
              props.navigation.closeDrawer();
              router.push('/admin/admin-dashboard');
            }}
          />
          
          <DrawerItem
            icon={({color, size}) => (
              <Icon name="account-group" color={COLORS.primary} size={size} />
            )}
            label="المستخدمين"
            labelStyle={styles.drawerLabel}
            onPress={() => {
              props.navigation.closeDrawer();
              router.push('/admin/users');
            }}
          />
          
          <DrawerItem
            icon={({color, size}) => (
              <Icon name="store" color={COLORS.primary} size={size} />
            )}
            label="المحلات"
            labelStyle={styles.drawerLabel}
            onPress={() => {
              props.navigation.closeDrawer();
              router.push('/admin/shops');
            }}
          />
          
          <DrawerItem
            icon={({color, size}) => (
              <Icon name="car" color={COLORS.primary} size={size} />
            )}
            label="السيارات"
            labelStyle={styles.drawerLabel}
            onPress={() => {
              props.navigation.closeDrawer();
              router.push('/admin/cars');
            }}
          />
          
          {commonItems}
        </>
      );
    }
    
    return commonItems;
  };
  
  return (
    <View style={styles.container}>
      <DrawerContentScrollView {...props}>
        <View style={styles.drawerContent}>
          {/* معلومات المستخدم */}
          <View style={styles.userInfoSection}>
            <View style={styles.userInfo}>
              <Avatar.Icon 
                size={60} 
                icon="account" 
                style={{backgroundColor: COLORS.primary}} 
              />
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{user?.name || 'مستخدم'}</Text>
                <Text style={styles.userRole}>
                  {String(user?.role).toLowerCase() === 'shop_owner' || String(user?.role).toLowerCase() === 'shop'
                    ? 'صاحب محل' 
                    : String(user?.role).toLowerCase() === 'customer' 
                      ? 'عميل' 
                      : String(user?.role).toLowerCase() === 'admin' 
                        ? 'مدير' 
                        : 'مستخدم'}
                </Text>
              </View>
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          {/* عناصر القائمة */}
          <Drawer.Section style={styles.drawerSection}>
            {renderMenuItems()}
          </Drawer.Section>
          
          <Divider style={styles.divider} />
          
          {/* قسم تسجيل الخروج */}
          <Drawer.Section style={styles.logoutSection}>
            <DrawerItem
              icon={({color, size}) => (
                <Icon name="logout" color={DRAWER_COLORS.danger} size={size} />
              )}
              label="تسجيل الخروج"
              labelStyle={[styles.drawerLabel, styles.logoutLabel]}
              onPress={handleLogout}
            />
          </Drawer.Section>
        </View>
      </DrawerContentScrollView>
      
      {/* شعار التطبيق في أسفل الدراور */}
      <View style={styles.footerContainer}>
        <Text style={styles.appName}>YazCar</Text>
        <Text style={styles.version}>الإصدار 1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  drawerContent: {
    flex: 1,
  },
  userInfoSection: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#f5f5f5',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 15,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 3,
  },
  userRole: {
    fontSize: 14,
    color: 'gray',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  drawerSection: {
    marginTop: 10,
  },
  drawerLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: -20, // تعديل للغة العربية
    textAlign: 'right',
  },
  logoutSection: {
    marginTop: 10,
    borderTopColor: '#f4f4f4',
    borderTopWidth: 1,
  },
  logoutLabel: {
    color: DRAWER_COLORS.danger,
  },
  footerContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f4f4f4',
    alignItems: 'center',
  },
  appName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  version: {
    fontSize: 12,
    color: 'gray',
  },
});

export default DrawerContent; 