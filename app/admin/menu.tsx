// @ts-nocheck
import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Text, Divider, Avatar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../constants';
import { useAuthStore } from '../utils/store';
import { signOut } from '../services/auth';

export default function AdminMenu() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  
  const handleLogout = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        console.error('خطأ في تسجيل الخروج:', error);
        return;
      }
      
      logout();
      router.replace('/auth/login');
    } catch (error) {
      console.error('خطأ غير متوقع:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-left" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>القائمة</Text>
        <View style={{ width: 28 }} />
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.userInfoSection}>
          <Avatar.Icon 
            size={80} 
            icon="account" 
            style={{backgroundColor: COLORS.primary}} 
          />
          <Text style={styles.userName}>{user?.name || 'مستخدم'}</Text>
          <Text style={styles.userRole}>مدير النظام</Text>
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.menuSection}>
          <MenuItem 
            icon="view-dashboard" 
            label="لوحة التحكم" 
            onPress={() => router.push('/admin/admin-dashboard')} 
          />
          <MenuItem 
            icon="account-group" 
            label="المستخدمين" 
            onPress={() => router.push('/admin/users')} 
          />
          <MenuItem 
            icon="store" 
            label="المحلات" 
            onPress={() => router.push('/admin/shops')} 
          />
          <MenuItem 
            icon="car" 
            label="السيارات" 
            onPress={() => router.push('/admin/cars')} 
          />
          <MenuItem 
            icon="tag" 
            label="فئات الخدمات" 
            onPress={() => router.push('/admin/service-categories')} 
          />
          <MenuItem 
            icon="account" 
            label="الملف الشخصي" 
            onPress={() => router.push('/admin/profile')} 
          />
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.logoutSection}>
          <MenuItem 
            icon="logout" 
            label="تسجيل الخروج" 
            color={COLORS.error}
            onPress={handleLogout} 
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({ icon, label, onPress, color = COLORS.primary }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Icon name={icon} size={24} color={color} />
      <Text style={[styles.menuLabel, color !== COLORS.primary && { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  userInfoSection: {
    padding: 20,
    alignItems: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  userRole: {
    fontSize: 14,
    color: 'gray',
    marginTop: 5,
  },
  divider: {
    marginVertical: 10,
    height: 1,
  },
  menuSection: {
    padding: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
  },
  menuLabel: {
    fontSize: 16,
    marginRight: 15,
    color: '#333',
  },
  logoutSection: {
    padding: 10,
  },
}); 