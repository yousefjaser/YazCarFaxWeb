// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuthStore } from '../utils/store';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../constants';
import { supabase } from '../config';
import { Button, Card, Title, Paragraph } from 'react-native-paper';
import { useNavigation, DrawerActions } from '@react-navigation/native';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalShops: 0,
    totalCars: 0,
    pendingShops: 0
  });
  const [loading, setLoading] = useState(true);
  
  // استخدام مكون التنقل للوصول إلى الدراور
  const navigation = useNavigation();
  
  // فتح الدراور
  const openDrawer = () => {
    if (Platform.OS === 'web') {
      // على الويب، استخدم مسار مباشر للقائمة
      router.push('/admin/menu');
    } else {
      // على الأجهزة المحمولة، استخدم الدراور
      navigation.dispatch(DrawerActions.openDrawer());
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // استرجاع بيانات لوحة التحكم
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // إحصائيات المستخدمين
      const { count: userCount, error: userError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (userError) throw userError;
      
      // إحصائيات المحلات
      const { count: shopCount, error: shopError } = await supabase
        .from('shops')
        .select('*', { count: 'exact', head: true });
        
      if (shopError) throw shopError;
      
      // إحصائيات المحلات المعلقة
      const { count: pendingShopCount, error: pendingError } = await supabase
        .from('shops')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
        
      if (pendingError) throw pendingError;
      
      // إحصائيات السيارات
      const { count: carCount, error: carError } = await supabase
        .from('cars')
        .select('*', { count: 'exact', head: true });
        
      if (carError) throw carError;
      
      setStats({
        totalUsers: userCount || 0,
        totalShops: shopCount || 0,
        totalCars: carCount || 0,
        pendingShops: pendingShopCount || 0
      });
      
    } catch (error) {
      console.error('خطأ في استرجاع البيانات:', error);
      Alert.alert('خطأ', 'فشل في استرجاع البيانات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* رأس الصفحة مع أيقونة الدراور */}
      <View style={styles.header}>
        <TouchableOpacity onPress={openDrawer}>
          <Icon name="menu" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>لوحة تحكم المدير</Text>
        <TouchableOpacity>
          <Icon name="bell-outline" size={26} color="#FFF" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {/* بطاقات الإحصائيات */}
        <View style={styles.statsContainer}>
          <Card style={styles.statsCard}>
            <Card.Content>
              <Title style={styles.statTitle}>{stats.totalUsers}</Title>
              <Paragraph style={styles.statLabel}>المستخدمين</Paragraph>
            </Card.Content>
            <View style={[styles.cardIcon, {backgroundColor: '#3498db20'}]}>
              <Icon name="account-group" size={24} color="#3498db" />
            </View>
          </Card>
          
          <Card style={styles.statsCard}>
            <Card.Content>
              <Title style={styles.statTitle}>{stats.totalShops}</Title>
              <Paragraph style={styles.statLabel}>المحلات</Paragraph>
            </Card.Content>
            <View style={[styles.cardIcon, {backgroundColor: '#2ecc7120'}]}>
              <Icon name="store" size={24} color="#2ecc71" />
            </View>
          </Card>
          
          <Card style={styles.statsCard}>
            <Card.Content>
              <Title style={styles.statTitle}>{stats.totalCars}</Title>
              <Paragraph style={styles.statLabel}>السيارات</Paragraph>
            </Card.Content>
            <View style={[styles.cardIcon, {backgroundColor: '#9b59b620'}]}>
              <Icon name="car" size={24} color="#9b59b6" />
            </View>
          </Card>
          
          <Card style={styles.statsCard}>
            <Card.Content>
              <Title style={styles.statTitle}>{stats.pendingShops}</Title>
              <Paragraph style={styles.statLabel}>محلات معلقة</Paragraph>
            </Card.Content>
            <View style={[styles.cardIcon, {backgroundColor: '#e67e2220'}]}>
              <Icon name="clock-outline" size={24} color="#e67e22" />
            </View>
          </Card>
        </View>
        
        {/* الإجراءات السريعة */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/admin/users')}
            >
              <View style={[styles.actionIcon, {backgroundColor: '#3498db20'}]}>
                <Icon name="account-group" size={24} color="#3498db" />
              </View>
              <Text style={styles.actionLabel}>إدارة المستخدمين</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/admin/shops')}
            >
              <View style={[styles.actionIcon, {backgroundColor: '#2ecc7120'}]}>
                <Icon name="store" size={24} color="#2ecc71" />
              </View>
              <Text style={styles.actionLabel}>إدارة المحلات</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/admin/cars')}
            >
              <View style={[styles.actionIcon, {backgroundColor: '#9b59b620'}]}>
                <Icon name="car" size={24} color="#9b59b6" />
              </View>
              <Text style={styles.actionLabel}>إدارة السيارات</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/admin/service-categories')}
            >
              <View style={[styles.actionIcon, {backgroundColor: '#e67e2220'}]}>
                <Icon name="tag" size={24} color="#e67e22" />
              </View>
              <Text style={styles.actionLabel}>فئات الخدمات</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* المحلات المعلقة الموافقة */}
        <View style={styles.pendingSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>المحلات المعلقة</Text>
            <TouchableOpacity onPress={() => router.push('/admin/pending-shops')}>
              <Text style={styles.viewAll}>عرض الكل</Text>
            </TouchableOpacity>
          </View>
          
          {stats.pendingShops === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Paragraph style={styles.emptyText}>
                  لا توجد محلات معلقة حالياً
                </Paragraph>
              </Card.Content>
            </Card>
          ) : (
            <Card style={styles.pendingCard}>
              <Card.Content>
                <View style={styles.pendingInfo}>
                  <Icon name="store-alert" size={30} color={COLORS.warning} />
                  <Text style={styles.pendingText}>
                    يوجد {stats.pendingShops} محلات بحاجة إلى موافقة
                  </Text>
                </View>
                <Button 
                  mode="contained" 
                  style={styles.reviewButton}
                  onPress={() => router.push('/admin/pending-shops')}
                >
                  مراجعة الطلبات
                </Button>
              </Card.Content>
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingTop: 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statsCard: {
    width: '48%',
    borderRadius: 10,
    elevation: 2,
    marginBottom: 15,
  },
  statTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  statLabel: {
    textAlign: 'right',
  },
  cardIcon: {
    position: 'absolute',
    top: 15,
    left: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  actionsContainer: {
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    alignItems: 'center',
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  pendingSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  viewAll: {
    color: COLORS.primary,
    fontSize: 14,
  },
  pendingCard: {
    borderRadius: 10,
    elevation: 2,
  },
  pendingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  pendingText: {
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
  },
  reviewButton: {
    backgroundColor: COLORS.warning,
  },
  emptyCard: {
    borderRadius: 10,
    elevation: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    paddingVertical: 20,
  },
}); 