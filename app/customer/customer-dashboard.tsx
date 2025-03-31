// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar, Platform, Alert } from 'react-native';
import { Text, Card, Button, Avatar, Badge, IconButton } from 'react-native-paper';
import { COLORS, SPACING } from '../constants';
import { useAuthStore } from '../utils/store';
import { supabase } from '../config';
import Loading from '../components/Loading';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useNavigation, DrawerActions } from '@react-navigation/native';

export default function CustomerDashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    carsCount: 0,
    nextServiceDate: null,
    servicesCount: 0,
    notifications: 3,
  });
  
  // استخدام مكون التنقل للوصول إلى الدراور
  const navigation = useNavigation();
  
  // فتح الدراور
  const openDrawer = () => {
    if (Platform.OS === 'web') {
      // على الويب، استخدم مسار مباشر للقائمة
      router.push('/customer/menu');
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
      
      // 2. تحميل إحصائيات السيارات المسجلة
      const { data: carsData, error: carsError } = await supabase
        .from('cars')
        .select(`
          id,
          service_visits(
            id, 
            date,
            next_service_date
          )
        `)
        .eq('customer_id', user.id);
      
      if (!carsError && carsData) {
        // حساب عدد السيارات
        const carsCount = carsData.length;
        
        // حساب عدد زيارات الصيانة
        let servicesCount = 0;
        let nextServiceDates = [];
        
        // جمع تواريخ الصيانة القادمة وعدد زيارات الصيانة
        carsData.forEach(car => {
          if (car.service_visits && car.service_visits.length > 0) {
            servicesCount += car.service_visits.length;
            
            car.service_visits.forEach(visit => {
              if (visit.next_service_date) {
                nextServiceDates.push(new Date(visit.next_service_date));
              }
            });
          }
        });
        
        // تحديد أقرب تاريخ صيانة قادم
        let nextServiceDate = null;
        if (nextServiceDates.length > 0) {
          nextServiceDates.sort((a, b) => a - b);
          nextServiceDate = nextServiceDates[0];
        }
        
        setStats({
          ...stats,
          carsCount,
          servicesCount,
          nextServiceDate
        });
      }
    } catch (error) {
      console.error('حدث خطأ أثناء تحميل البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCars = () => {
    router.push('/customer/cars');
  };
  
  const handleServiceHistory = () => {
    router.push('/customer/service-history');
  };
  
  const formatDate = (date) => {
    if (!date) return 'غير متوفر';
    return new Date(date).toLocaleDateString('ar-SA');
  };

  if (loading) {
    return <Loading fullScreen message="جاري تحميل البيانات..." />;
  }

  return (
    <View style={styles.container}>
      <StatusBar 
        backgroundColor="transparent" 
        barStyle="dark-content" 
        translucent={Platform.OS === 'android'} 
      />
      
      {/* شريط العنوان مع الإشعارات */}
      <View style={styles.header}>
        <TouchableOpacity onPress={openDrawer}>
          <Icon name="menu" size={28} color="#FFF" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.notificationIcon}
          onPress={() => router.push('/customer/notifications')}
        >
          <Icon name="bell" size={24} color="#000" />
          {stats.notifications > 0 && (
            <Badge style={styles.badge}>{stats.notifications}</Badge>
          )}
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {/* العنوان والترحيب */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.welcomeText}>
              أهلاً بك <Text style={styles.waveEmoji}>👋</Text> في
            </Text>
            <Text style={styles.logoText}>Yaz Car</Text>
            <Text style={styles.subtitleText}>تابع صيانة سياراتك بسهولة</Text>
          </View>
          
          <View style={styles.userAvatarContainer}>
            <Icon name="account" size={80} color={COLORS.white} />
          </View>
        </View>
        
        {/* إحصائيات */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="car-multiple" size={30} color="#1877F2" style={styles.statIcon} />
              <Text style={styles.statValue}>{stats.carsCount}</Text>
              <Text style={styles.statLabel}>سياراتي</Text>
            </Card.Content>
          </Card>
          
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="wrench" size={30} color="#FF9500" style={styles.statIcon} />
              <Text style={styles.statValue}>{stats.servicesCount}</Text>
              <Text style={styles.statLabel}>عدد الصيانات</Text>
            </Card.Content>
          </Card>
          
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="calendar-clock" size={30} color="#2196F3" style={styles.statIcon} />
              <Text style={styles.statLabel}>الصيانة القادمة</Text>
              <Text style={styles.dateValue}>{stats.nextServiceDate ? formatDate(stats.nextServiceDate) : 'لا يوجد'}</Text>
            </Card.Content>
          </Card>
        </View>
        
        {/* الإجراءات السريعة */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>الإجراءات السريعة</Text>
          
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={handleViewCars}
          >
            <View style={styles.quickActionContent}>
              <View style={styles.quickActionIcon}>
                <Icon name="car" size={36} color="#fff" />
              </View>
              
              <View style={styles.quickActionTextContainer}>
                <Text style={styles.quickActionTitle}>سياراتي</Text>
                <Text style={styles.quickActionDescription}>عرض قائمة سياراتك وتفاصيلها</Text>
              </View>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.quickActionCard, styles.quickActionBlue]}
            onPress={handleServiceHistory}
          >
            <View style={styles.quickActionContent}>
              <View style={[styles.quickActionIcon, styles.quickActionIconBlue]}>
                <Icon name="history" size={36} color="#fff" />
              </View>
              
              <View style={styles.quickActionTextContainer}>
                <Text style={styles.quickActionTitle}>سجل الصيانة</Text>
                <Text style={styles.quickActionDescription}>عرض سجل الصيانة لجميع سياراتك</Text>
              </View>
            </View>
          </TouchableOpacity>
          
          {/* القائمة الرئيسية */}
          <View style={styles.mainMenuSection}>
            <Text style={styles.sectionTitle}>القائمة الرئيسية</Text>
            
            <View style={styles.menuGrid}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => router.push('/customer/cars')}
              >
                <View style={[styles.menuIconBg, { backgroundColor: '#27AE60' + '20' }]}>
                  <Icon name="car-multiple" size={30} color="#27AE60" />
                </View>
                <Text style={styles.menuText}>السيارات</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => router.push('/customer/service-history')}
              >
                <View style={[styles.menuIconBg, { backgroundColor: '#3498DB' + '20' }]}>
                  <Icon name="wrench" size={30} color="#3498DB" />
                </View>
                <Text style={styles.menuText}>الصيانة</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => router.push('/customer/reminders')}
              >
                <View style={[styles.menuIconBg, { backgroundColor: '#9B59B6' + '20' }]}>
                  <Icon name="bell-ring" size={30} color="#9B59B6" />
                </View>
                <Text style={styles.menuText}>التذكيرات</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => router.push('/customer/profile')}
              >
                <View style={[styles.menuIconBg, { backgroundColor: '#E74C3C' + '20' }]}>
                  <Icon name="account" size={30} color="#E74C3C" />
                </View>
                <Text style={styles.menuText}>حسابي</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
    paddingHorizontal: SPACING.md,
    paddingBottom: 10,
    backgroundColor: COLORS.white,
  },
  notificationIcon: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.error,
  },
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.white,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '400',
    color: COLORS.darkGray,
    textAlign: 'right',
  },
  waveEmoji: {
    fontSize: 20,
  },
  logoText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'right',
  },
  subtitleText: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 5,
    textAlign: 'right',
  },
  userAvatarContainer: {
    marginLeft: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: 40,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
  },
  statContent: {
    alignItems: 'center',
    padding: 8,
  },
  statIcon: {
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  dateValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
  },
  quickActionsSection: {
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
    textAlign: 'right',
  },
  quickActionCard: {
    backgroundColor: '#27AE60',
    borderRadius: 10,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    elevation: 3,
  },
  quickActionBlue: {
    backgroundColor: '#2196F3',
  },
  quickActionContent: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  quickActionIconBlue: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  quickActionTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  quickActionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  quickActionDescription: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.8,
  },
  mainMenuSection: {
    marginTop: SPACING.md,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
    elevation: 2,
  },
  menuIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  menuText: {
    fontSize: 14,
    color: COLORS.darkGray,
    fontWeight: '500',
  },
}); 