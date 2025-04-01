// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform, SafeAreaView, Alert } from 'react-native';
import { Text, Badge, Surface } from 'react-native-paper';
import { COLORS, SPACING } from '../constants';
import { useAuthStore } from '../utils/store';
import { supabase } from '../config';
import Loading from '../components/Loading';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRouter, Link } from 'expo-router';
import { useNavigation, DrawerActions } from '@react-navigation/native';

export default function ShopDashboardScreen() {
  console.log("تم تحميل مكون ShopDashboardScreen");
  
  // إضافة متغير للتحقق من أن المكون قد تم تحميله بالفعل (يمنع التحميل المتكرر)
  const [hasLoaded, setHasLoaded] = useState(false);
  
  const router = useRouter();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    rating: 4.8,
    weeklyServices: 23,
    registeredCars: 156,
    notifications: 3,
  });
  
  // استخدام مكون التنقل للوصول إلى الدراور
  const navigation = useNavigation();
  
  // فتح الدراور - بطريقة تعمل مع الويب والأجهزة المحمولة
  const openDrawer = () => {
    if (Platform.OS === 'web') {
      // على الويب، استخدم مسار مباشر للقائمة
      router.push('/shop/menu');
    } else {
      // على الأجهزة المحمولة، استخدم الدراور
      navigation.dispatch(DrawerActions.openDrawer());
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // 1. تحميل معلومات الملف الشخصي
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('فشل في تحميل معلومات الملف الشخصي:', profileError);
        return;
      }
      
      setProfile(profileData);
      
      // 2. تحميل إحصائيات المحل
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', user.id)
        .single();
      
      if (shopError) {
        console.error('فشل في تحميل معلومات المحل:', shopError);
        return;
      }
      
      // 3. تحميل عدد الخدمات هذا الأسبوع
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const { count: weeklyServicesCount, error: servicesError } = await supabase
        .from('service_visits')
        .select('id', { count: 'exact', head: true })
        .eq('shop_id', shopData.id)
        .gte('created_at', startOfWeek.toISOString());
      
      // 4. تحميل عدد السيارات المسجلة
      const { count: carsCount, error: carsError } = await supabase
        .from('cars')
        .select('id', { count: 'exact', head: true })
        .eq('last_service_shop_id', shopData.id);
      
      setStats({
        ...stats,
        rating: shopData.rating || 4.8,
        weeklyServices: weeklyServicesCount || 0,
        registeredCars: carsCount || 0
      });
    } catch (error) {
      console.error('حدث خطأ أثناء تحميل البيانات:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddCar = () => {
    router.push('/shop/register-car');
  };
  
  const handleScanQR = () => {
    console.log("تم الضغط على زر مسح QR - استخدام طريقة التنقل للجوال: /shop/scan");
    try {
      if (Platform.OS === 'web') {
        router.push('/shop/scan');
      } else {
        // على الأجهزة المحمولة، استخدم navigate بدلاً من push
        navigation.navigate('scan');
      }
    } catch (error) {
      console.error("خطأ في التنقل:", error);
      // محاولة بديلة
      router.push('/shop/scan');
    }
  };

  if (loading) {
    return <Loading fullScreen message="جاري تحميل البيانات..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar 
        backgroundColor="#FFF"
        barStyle="dark-content"
        translucent={false}
      />
      
      {/* شريط العنوان مع القائمة والإشعارات */}
      <View style={styles.header}>
        <TouchableOpacity onPress={openDrawer}>
          <Icon name="menu" size={28} color="#FFF" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.notificationIcon}
          onPress={() => router.push('/shop/notifications')}
        >
          <Icon name="bell-outline" size={28} color="#000" />
          {stats.notifications > 0 && (
            <Badge style={styles.badge}>{stats.notifications}</Badge>
          )}
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* العنوان والترحيب */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.welcomeText}>
              أهلاً بك <Text style={styles.waveEmoji}>👋</Text> في
            </Text>
            <Text style={styles.logoText}>Yaz Car</Text>
            <Text style={styles.subtitleText}>يوم جديد مليء بالإنجازات</Text>
          </View>
          
          <View style={styles.shopIconContainer}>
            <Icon name="store" size={40} color="#FFF" />
          </View>
        </View>
        
        {/* إحصائيات */}
        <View style={styles.statsContainer}>
          <Surface style={styles.statCard}>
            <View style={styles.statContent}>
              <View style={[styles.statIconBg, { backgroundColor: '#1877F2' + '15' }]}>
                <Icon name="star" size={30} color="#1877F2" />
              </View>
              <Text style={styles.statValue}>{stats.rating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>تقييم المحل</Text>
            </View>
          </Surface>
          
          <Surface style={styles.statCard}>
            <View style={styles.statContent}>
              <View style={[styles.statIconBg, { backgroundColor: '#FF9500' + '15' }]}>
                <Icon name="wrench" size={30} color="#FF9500" />
              </View>
              <Text style={styles.statValue}>{stats.weeklyServices}</Text>
              <Text style={styles.statLabel}>خدمة هذا الأسبوع</Text>
            </View>
          </Surface>
          
          <Surface style={styles.statCard}>
            <View style={styles.statContent}>
              <View style={[styles.statIconBg, { backgroundColor: '#2196F3' + '15' }]}>
                <Icon name="car" size={30} color="#2196F3" />
              </View>
              <Text style={styles.statValue}>{stats.registeredCars}</Text>
              <Text style={styles.statLabel}>سيارة مسجلة</Text>
            </View>
          </Surface>
        </View>
        
        {/* الإجراءات السريعة */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>الإجراءات السريعة</Text>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => {
              console.log("تم الضغط على زر سيارة جديدة - التوجيه إلى: /shop/add-car");
              try {
                if (Platform.OS === 'web') {
                  router.push('/shop/add-car');
                } else {
                  // على الأجهزة المحمولة، استخدم navigate بدلاً من push
                  navigation.navigate('add-car');
                }
                console.log("تم تنفيذ التنقل بنجاح");
              } catch (error) {
                console.error("خطأ عند محاولة التنقل:", error);
                alert("خطأ في التنقل: " + (error instanceof Error ? error.message : String(error)));
                // محاولة بديلة
                router.push('/shop/add-car');
              }
            }}
          >
            <View style={styles.actionCardContent}>
              <View style={styles.actionIconContainer}>
                <Icon name="help-circle" size={36} color="#FFF" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionCardTitle}>سيارة جديدة</Text>
                <Text style={styles.actionCardDesc}>تسجيل سيارة ومعلومات الزيت</Text>
              </View>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: '#3498db' }]}
            onPress={handleScanQR}
          >
            <View style={styles.actionCardContent}>
              <View style={styles.actionIconContainer}>
                <Icon name="qrcode" size={36} color="#FFF" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionCardTitle}>مسح QR</Text>
                <Text style={styles.actionCardDesc}>عرض معلومات الصيانة للسيارة</Text>
              </View>
            </View>
          </TouchableOpacity>
          
          <Text style={[styles.sectionTitle, { marginTop: 30 }]}>القائمة الرئيسية</Text>
          
          <View style={styles.menuGrid}>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/shop/cars')}>
              <View style={[styles.menuIconContainer, { backgroundColor: '#27AE60' + '15' }]}>
                <Icon name="car" size={24} color="#27AE60" />
              </View>
              <Text style={styles.menuItemText}>السيارات</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/shop/service-categories')}>
              <View style={[styles.menuIconContainer, { backgroundColor: '#3498DB' + '15' }]}>
                <Icon name="format-list-bulleted" size={24} color="#3498DB" />
              </View>
              <Text style={styles.menuItemText}>فئات الخدمة</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => {
              console.log("تم الضغط على زر إضافة سيارة (طريقة ثانية)");
              try {
                if (Platform.OS === 'web') {
                  router.push('/shop/add-car');
                } else {
                  // على الأجهزة المحمولة، استخدم navigate بدلاً من push
                  navigation.navigate('add-car');
                }
                console.log("تم تنفيذ التنقل إلى add-car بنجاح");
              } catch (error) {
                console.error("خطأ في التنقل:", error);
                // محاولة بديلة
                router.push('/shop/add-car');
              }
            }}>
              <View style={[styles.menuIconContainer, { backgroundColor: '#F39C12' + '15' }]}>
                <Icon name="car-connected" size={24} color="#F39C12" />
              </View>
              <Text style={styles.menuItemText}>إضافة سيارة (طريقة ثانية)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => {
              console.log("تم الضغط على زر الصفحة البسيطة");
              try {
                router.push('/shop/add-car-simple');
                console.log("تم تنفيذ router.push للصفحة البسيطة بنجاح");
              } catch (error) {
                console.error("خطأ في التنقل للصفحة البسيطة:", error);
                alert("خطأ: " + (error instanceof Error ? error.message : String(error)));
              }
            }}>
              <View style={[styles.menuIconContainer, { backgroundColor: '#E74C3C' + '15' }]}>
                <Icon name="car-estate" size={24} color="#E74C3C" />
              </View>
              <Text style={styles.menuItemText}>صفحة بسيطة للاختبار</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* شريط التنقل السفلي العائم */}
      <View style={styles.floatingNavBar}>
        <TouchableOpacity style={styles.navItem} onPress={() => {
          console.log("التنقل إلى السيارات");
          if (Platform.OS === 'web') {
            router.push('/shop/cars');
          } else {
            navigation.navigate('cars');
          }
        }}>
          <Icon name="car" size={22} color="#6c757d" />
          <Text style={styles.navItemText}>السيارات</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => {
          console.log("التنقل إلى الزيوت");
          if (Platform.OS === 'web') {
            router.push('/shop/service-history');
          } else {
            navigation.navigate('service-history');
          }
        }}>
          <Icon name="wrench" size={22} color="#6c757d" />
          <Text style={styles.navItemText}>الزيوت</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.homeNavItem} onPress={() => {
          console.log("التنقل إلى لوحة التحكم");
          if (Platform.OS === 'web') {
            router.push('/shop/shop-dashboard');
          } else {
            navigation.navigate('shop-dashboard');
          }
        }}>
          <Icon name="home" size={26} color="#FFF" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => {
          console.log("التنقل إلى التذكيرات");
          if (Platform.OS === 'web') {
            router.push('/shop/service-history');
          } else {
            navigation.navigate('service-history');
          }
        }}>
          <Icon name="bell" size={22} color="#6c757d" />
          <Text style={styles.navItemText}>التذكيرات</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => {
          console.log("التنقل إلى المزيد");
          if (Platform.OS === 'web') {
            router.push('/shop/profile');
          } else {
            navigation.navigate('profile');
          }
        }}>
          <Icon name="menu" size={22} color="#6c757d" />
          <Text style={styles.navItemText}>المزيد</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
  },
  notificationIcon: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
    backgroundColor: '#FFF',
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#555',
    textAlign: 'right',
  },
  waveEmoji: {
    fontSize: 18,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3498db',
    textAlign: 'right',
    marginTop: 0
  },
  subtitleText: {
    fontSize: 14,
    color: '#777',
    marginTop: 5,
    textAlign: 'right',
  },
  shopIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginTop: -15,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2.84,
    padding: 10,
  },
  statContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  statIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 13,
    color: '#777',
    textAlign: 'center',
    marginTop: 3,
  },
  quickActionsSection: {
    padding: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'right',
  },
  actionCard: {
    backgroundColor: '#27AE60',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4.65,
    elevation: 6,
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
  actionTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  actionCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  actionCardDesc: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
  },
  menuIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  menuItemText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  floatingNavBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 65,
    backgroundColor: '#FFF',
    borderRadius: 35,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 7,
    elevation: 8,
    paddingHorizontal: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  homeNavItem: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  navItemText: {
    fontSize: 10,
    color: '#6c757d',
    marginTop: 3,
  },
  emptySection: {
    height: 100,
  }
}); 