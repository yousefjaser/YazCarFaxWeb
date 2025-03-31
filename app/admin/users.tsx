// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Text, Appbar, Card, Button, Chip, TextInput, Divider, SegmentedButtons, Portal, Dialog } from 'react-native-paper';
import { COLORS, SPACING } from '../constants';
import { useAuthStore } from '../utils/store';
import { supabase } from '../config';
import Loading from '../components/Loading';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function UsersScreen() {
  const { user } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userType, setUserType] = useState('all');
  const [userToDisable, setUserToDisable] = useState(null);
  const [dialogVisible, setDialogVisible] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [userType]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // البدء بتحديد الجدول استنادًا إلى نوع المستخدم المطلوب
      let query = supabase.from('profiles').select('*');
      
      // تطبيق تصفية استنادًا إلى نوع المستخدم إذا كان مطلوبًا
      if (userType === 'customers') {
        query = query.eq('user_type', 'customer');
      } else if (userType === 'shop_owners') {
        query = query.eq('user_type', 'shop_owner');
      } else if (userType === 'admins') {
        query = query.eq('user_type', 'admin');
      }
      
      // استبعاد المستخدمين المعطلين
      query = query.not('status', 'eq', 'disabled');
      
      // ترتيب حسب تاريخ الإنشاء (الأحدث أولاً)
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) {
        console.error('فشل في تحميل المستخدمين:', error);
        return;
      }
      
      // تحميل معلومات إضافية للمستخدمين
      const enhancedUsers = await Promise.all(data.map(async (profile) => {
        let enhancedUser = { ...profile };
        
        if (profile.user_type === 'shop_owner') {
          // تحميل معلومات المحل للمالك
          const { data: shopData, error: shopError } = await supabase
            .from('shops')
            .select('*')
            .eq('owner_id', profile.id)
            .maybeSingle();
          
          if (!shopError && shopData) {
            enhancedUser.shop = shopData;
          }
        } else if (profile.user_type === 'customer') {
          // تحميل عدد السيارات للعميل
          const { data: carsData, error: carsError } = await supabase
            .from('cars')
            .select('id')
            .eq('customer_id', profile.id);
          
          if (!carsError) {
            enhancedUser.cars_count = carsData.length;
          }
        }
        
        return enhancedUser;
      }));
      
      setUsers(enhancedUsers || []);
    } catch (error) {
      console.error('حدث خطأ أثناء تحميل المستخدمين:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const handleDisableUser = (user) => {
    setUserToDisable(user);
    setDialogVisible(true);
  };

  const confirmDisableUser = async () => {
    if (!userToDisable) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'disabled', updated_at: new Date() })
        .eq('id', userToDisable.id);
      
      if (error) {
        Alert.alert('خطأ', 'فشل في تعطيل المستخدم');
        console.error('فشل في تعطيل المستخدم:', error);
        return;
      }
      
      // إذا كان مالك محل، قم بتعطيل المحل أيضًا
      if (userToDisable.user_type === 'shop_owner' && userToDisable.shop) {
        const { error: shopError } = await supabase
          .from('shops')
          .update({ status: 'disabled', updated_at: new Date() })
          .eq('owner_id', userToDisable.id);
        
        if (shopError) {
          console.error('فشل في تعطيل المحل:', shopError);
        }
      }
      
      Alert.alert('نجاح', 'تم تعطيل المستخدم بنجاح');
      loadUsers(); // إعادة تحميل القائمة
    } catch (error) {
      console.error('حدث خطأ أثناء تعطيل المستخدم:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تعطيل المستخدم');
    } finally {
      setDialogVisible(false);
      setUserToDisable(null);
    }
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone?.includes(searchQuery)
  );

  const renderUserItem = ({ item }) => {
    const getUserTypeLabel = (type) => {
      switch (type) {
        case 'admin': return 'مسؤول';
        case 'shop_owner': return 'مالك محل';
        case 'customer': return 'عميل';
        default: return 'غير معروف';
      }
    };
    
    const getUserTypeIcon = (type) => {
      switch (type) {
        case 'admin': return 'shield-account';
        case 'shop_owner': return 'store';
        case 'customer': return 'account';
        default: return 'account-question';
      }
    };
    
    return (
      <Card style={styles.userCard}>
        <Card.Content>
          <View style={styles.userHeader}>
            <View>
              <Text style={styles.userName}>{item.full_name || 'مستخدم بدون اسم'}</Text>
              <View style={styles.userTypeContainer}>
                <Icon name={getUserTypeIcon(item.user_type)} size={14} color={COLORS.primary} />
                <Text style={styles.userType}>{getUserTypeLabel(item.user_type)}</Text>
              </View>
            </View>
            <Chip icon="calendar" mode="flat" style={styles.dateChip}>
              {new Date(item.created_at).toLocaleDateString('ar-SA')}
            </Chip>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.contactInfo}>
            {item.email && (
              <View style={styles.infoItem}>
                <Icon name="email" size={16} color={COLORS.gray} />
                <Text style={styles.infoText}>{item.email}</Text>
              </View>
            )}
            
            {item.phone && (
              <View style={styles.infoItem}>
                <Icon name="phone" size={16} color={COLORS.gray} />
                <Text style={styles.infoText}>{item.phone}</Text>
              </View>
            )}
          </View>
          
          {item.user_type === 'shop_owner' && item.shop && (
            <View style={styles.shopInfo}>
              <Text style={styles.shopInfoLabel}>معلومات المحل:</Text>
              <View style={styles.shopDetails}>
                <Text style={styles.shopName}>{item.shop.name}</Text>
                <View style={styles.shopStatusContainer}>
                  <Icon 
                    name={item.shop.verified ? "check-circle" : "clock-outline"} 
                    size={14} 
                    color={item.shop.verified ? COLORS.success : COLORS.warning} 
                  />
                  <Text style={[
                    styles.shopStatus, 
                    {color: item.shop.verified ? COLORS.success : COLORS.warning}
                  ]}>
                    {item.shop.verified ? "موثق" : "قيد المراجعة"}
                  </Text>
                </View>
              </View>
            </View>
          )}
          
          {item.user_type === 'customer' && (
            <View style={styles.customerStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{item.cars_count || 0}</Text>
                <Text style={styles.statLabel}>سيارة</Text>
              </View>
            </View>
          )}
          
          <View style={styles.buttonContainer}>
            <Button 
              mode="outlined" 
              icon="eye" 
              style={styles.viewButton} 
              onPress={() => console.log('View details of user:', item.id)}
            >
              عرض
            </Button>
            
            <Button 
              mode="outlined" 
              icon="close-circle" 
              style={styles.disableButton} 
              textColor={COLORS.error}
              onPress={() => handleDisableUser(item)}
            >
              تعطيل
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="المستخدمين" />
      </Appbar.Header>
      
      <View style={styles.filtersContainer}>
        <TextInput
          placeholder="البحث عن مستخدم..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          mode="outlined"
          style={styles.searchInput}
          right={<TextInput.Icon icon="magnify" />}
          clearButtonMode="while-editing"
        />
        
        <SegmentedButtons
          value={userType}
          onValueChange={setUserType}
          buttons={[
            { value: 'all', label: 'الكل' },
            { value: 'customers', label: 'العملاء' },
            { value: 'shop_owners', label: 'أصحاب المحلات' },
            { value: 'admins', label: 'المدراء' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>
      
      {loading && !refreshing ? (
        <Loading fullScreen message="جاري تحميل المستخدمين..." />
      ) : (
        <>
          {filteredUsers.length > 0 ? (
            <FlatList
              data={filteredUsers}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
              }
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="account-off" size={80} color={COLORS.gray} />
              <Text style={styles.emptyText}>
                {searchQuery 
                  ? 'لا توجد نتائج مطابقة لبحثك' 
                  : 'لا يوجد مستخدمين في هذه الفئة'}
              </Text>
              {searchQuery && (
                <Button mode="outlined" onPress={() => setSearchQuery('')}>
                  مسح البحث
                </Button>
              )}
            </View>
          )}
        </>
      )}
      
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Icon icon="alert" />
          <Dialog.Title>تأكيد تعطيل المستخدم</Dialog.Title>
          <Dialog.Content>
            <Text>
              هل أنت متأكد من رغبتك في تعطيل حساب "{userToDisable?.full_name}"؟
              {userToDisable?.user_type === 'shop_owner' && 
                ' سيؤدي ذلك أيضًا إلى تعطيل المحل المرتبط بالحساب.'}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>إلغاء</Button>
            <Button onPress={confirmDisableUser} textColor={COLORS.error}>تعطيل</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filtersContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
  },
  searchInput: {
    backgroundColor: COLORS.white,
    marginBottom: SPACING.sm,
  },
  segmentedButtons: {
    marginTop: SPACING.xs,
  },
  listContent: {
    padding: SPACING.md,
  },
  userCard: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.white,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  userType: {
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 4,
  },
  dateChip: {
    backgroundColor: COLORS.background,
  },
  divider: {
    marginVertical: SPACING.sm,
  },
  contactInfo: {
    marginBottom: SPACING.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.gray,
  },
  shopInfo: {
    backgroundColor: COLORS.background,
    padding: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.sm,
  },
  shopInfoLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  shopDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shopName: {
    fontSize: 14,
    fontWeight: '500',
  },
  shopStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopStatus: {
    fontSize: 12,
    marginLeft: 4,
  },
  customerStats: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    padding: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.sm,
  },
  statItem: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  statValue: {
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 4,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  viewButton: {
    flex: 1,
    marginRight: SPACING.xs,
  },
  disableButton: {
    flex: 1,
    marginLeft: SPACING.xs,
    borderColor: COLORS.error,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: SPACING.md,
    textAlign: 'center',
  },
}); 