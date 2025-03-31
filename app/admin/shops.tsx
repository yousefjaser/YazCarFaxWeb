// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Text, Appbar, Card, Button, Chip, ActivityIndicator, Dialog, Portal, TextInput } from 'react-native-paper';
import { COLORS, SPACING } from '../constants';
import { useAuthStore } from '../utils/store';
import { supabase } from '../config';
import Loading from '../components/Loading';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function ShopsScreen() {
  const { user } = useAuthStore();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [shopToDisable, setShopToDisable] = useState(null);

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('shops')
        .select(`
          *,
          owner:owner_id(id, full_name, email),
          cars:cars(id),
          service_visits:service_visits(id)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('فشل في تحميل المحلات:', error);
        return;
      }
      
      // إضافة معلومات إضافية
      const shopsWithExtra = data.map(shop => ({
        ...shop,
        cars_count: shop.cars ? shop.cars.length : 0,
        service_visits_count: shop.service_visits ? shop.service_visits.length : 0
      }));
      
      setShops(shopsWithExtra || []);
    } catch (error) {
      console.error('حدث خطأ أثناء تحميل المحلات:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadShops();
  };

  const handleDisableShop = (shop) => {
    setShopToDisable(shop);
    setDialogVisible(true);
  };

  const confirmDisableShop = async () => {
    if (!shopToDisable) return;
    
    try {
      const { error } = await supabase
        .from('shops')
        .update({ status: 'disabled', updated_at: new Date() })
        .eq('id', shopToDisable.id);
      
      if (error) {
        Alert.alert('خطأ', 'فشل في تعطيل المحل');
        console.error('فشل في تعطيل المحل:', error);
        return;
      }
      
      Alert.alert('نجاح', 'تم تعطيل المحل بنجاح');
      loadShops(); // إعادة تحميل القائمة
    } catch (error) {
      console.error('حدث خطأ أثناء تعطيل المحل:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تعطيل المحل');
    } finally {
      setDialogVisible(false);
      setShopToDisable(null);
    }
  };

  const filteredShops = shops.filter(shop => 
    shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shop.owner?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shop.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderShopItem = ({ item }) => (
    <Card style={styles.shopCard}>
      <Card.Content>
        <View style={styles.shopHeader}>
          <View>
            <Text style={styles.shopName}>{item.name}</Text>
            <Text style={styles.ownerName}>
              {item.owner?.full_name || 'غير معروف'}
            </Text>
          </View>
          <Chip icon="check-circle" mode="flat" style={item.verified ? styles.verifiedChip : styles.unverifiedChip}>
            {item.verified ? 'موثق' : 'غير موثق'}
          </Chip>
        </View>
        
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Icon name="map-marker" size={16} color={COLORS.gray} />
            <Text style={styles.infoText}>{item.address || 'لا يوجد عنوان'}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Icon name="phone" size={16} color={COLORS.gray} />
            <Text style={styles.infoText}>{item.phone || 'لا يوجد رقم'}</Text>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.cars_count}</Text>
            <Text style={styles.statLabel}>سيارة</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.service_visits_count}</Text>
            <Text style={styles.statLabel}>صيانة</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{new Date(item.created_at).toLocaleDateString('ar-SA')}</Text>
            <Text style={styles.statLabel}>تاريخ التسجيل</Text>
          </View>
        </View>
        
        <View style={styles.buttonContainer}>
          <Button 
            mode="outlined" 
            icon="eye" 
            style={styles.viewButton} 
            onPress={() => console.log('View details of shop:', item.id)}
          >
            عرض
          </Button>
          
          {item.verified ? (
            <Button 
              mode="outlined" 
              icon="close-circle" 
              style={styles.disableButton} 
              textColor={COLORS.error}
              onPress={() => handleDisableShop(item)}
            >
              تعطيل
            </Button>
          ) : (
            <Button 
              mode="outlined" 
              icon="check-circle" 
              style={styles.verifyButton} 
              textColor={COLORS.success}
              onPress={() => console.log('Verify shop:', item.id)}
            >
              توثيق
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="محلات الصيانة" />
      </Appbar.Header>
      
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="البحث عن محل..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          mode="outlined"
          style={styles.searchInput}
          right={<TextInput.Icon icon="magnify" />}
          clearButtonMode="while-editing"
        />
      </View>
      
      {loading && !refreshing ? (
        <Loading fullScreen message="جاري تحميل المحلات..." />
      ) : (
        <>
          {filteredShops.length > 0 ? (
            <FlatList
              data={filteredShops}
              renderItem={renderShopItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
              }
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="store-off" size={80} color={COLORS.gray} />
              <Text style={styles.emptyText}>
                {searchQuery 
                  ? 'لا توجد نتائج مطابقة لبحثك' 
                  : 'لا توجد محلات صيانة مسجلة حتى الآن'}
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
          <Dialog.Title>تأكيد تعطيل المحل</Dialog.Title>
          <Dialog.Content>
            <Text>
              هل أنت متأكد من رغبتك في تعطيل محل "{shopToDisable?.name}"؟
              سيؤدي ذلك إلى منع المحل وصاحبه من الوصول إلى النظام.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>إلغاء</Button>
            <Button onPress={confirmDisableShop} textColor={COLORS.error}>تعطيل</Button>
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
  searchContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
  },
  searchInput: {
    backgroundColor: COLORS.white,
  },
  listContent: {
    padding: SPACING.md,
  },
  shopCard: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.white,
  },
  shopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  ownerName: {
    fontSize: 14,
    color: COLORS.gray,
  },
  verifiedChip: {
    backgroundColor: COLORS.success + '20',
  },
  unverifiedChip: {
    backgroundColor: COLORS.warning + '20',
  },
  infoRow: {
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    padding: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.sm,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  statLabel: {
    fontSize: 12,
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
  verifyButton: {
    flex: 1,
    marginLeft: SPACING.xs,
    borderColor: COLORS.success,
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