// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Text, Appbar, Card, Button, Chip, Divider, ActivityIndicator, Dialog, Portal } from 'react-native-paper';
import { COLORS, SPACING } from '../constants';
import { useAuthStore } from '../utils/store';
import { supabase } from '../config';
import Loading from '../components/Loading';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function PendingShopsScreen() {
  const { user } = useAuthStore();
  const [pendingShops, setPendingShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    loadPendingShops();
  }, []);

  const loadPendingShops = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('shops')
        .select(`
          *,
          owner:owner_id(id, full_name, email, phone)
        `)
        .eq('verified', false)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('فشل في تحميل المحلات المعلقة:', error);
        return;
      }
      
      setPendingShops(data || []);
    } catch (error) {
      console.error('حدث خطأ أثناء تحميل المحلات المعلقة:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPendingShops();
  };

  const handleApproveShop = (shop) => {
    setSelectedShop(shop);
    setDialogVisible(true);
  };

  const confirmApproveShop = async () => {
    if (!selectedShop) return;
    
    try {
      setApproving(true);
      
      const { error } = await supabase
        .from('shops')
        .update({ 
          verified: true, 
          status: 'active',
          updated_at: new Date()
        })
        .eq('id', selectedShop.id);
      
      if (error) {
        Alert.alert('خطأ', 'فشل في الموافقة على المحل');
        console.error('فشل في الموافقة على المحل:', error);
        return;
      }
      
      Alert.alert('نجاح', 'تمت الموافقة على المحل بنجاح');
      loadPendingShops(); // إعادة تحميل القائمة
    } catch (error) {
      console.error('حدث خطأ أثناء الموافقة على المحل:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء الموافقة على المحل');
    } finally {
      setDialogVisible(false);
      setSelectedShop(null);
      setApproving(false);
    }
  };

  const handleRejectShop = async (shop) => {
    setSelectedShop(shop);
    
    Alert.alert(
      'رفض المحل',
      `هل أنت متأكد من رغبتك في رفض محل "${shop.name}"؟`,
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'رفض',
          style: 'destructive',
          onPress: async () => {
            try {
              setRejecting(true);
              
              const { error } = await supabase
                .from('shops')
                .update({ 
                  status: 'rejected',
                  updated_at: new Date()
                })
                .eq('id', shop.id);
              
              if (error) {
                Alert.alert('خطأ', 'فشل في رفض المحل');
                console.error('فشل في رفض المحل:', error);
                return;
              }
              
              Alert.alert('نجاح', 'تم رفض المحل بنجاح');
              loadPendingShops(); // إعادة تحميل القائمة
            } catch (error) {
              console.error('حدث خطأ أثناء رفض المحل:', error);
              Alert.alert('خطأ', 'حدث خطأ أثناء رفض المحل');
            } finally {
              setSelectedShop(null);
              setRejecting(false);
            }
          },
        },
      ]
    );
  };

  const renderShopItem = ({ item }) => (
    <Card style={styles.shopCard}>
      <Card.Content>
        <View style={styles.shopHeader}>
          <Text style={styles.shopName}>{item.name}</Text>
          <Chip icon="clock-outline" mode="flat" style={styles.pendingChip}>
            معلق
          </Chip>
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.ownerInfo}>
          <Text style={styles.sectionTitle}>معلومات المالك:</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>الاسم:</Text>
            <Text style={styles.infoValue}>{item.owner?.full_name || 'غير معروف'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>البريد الإلكتروني:</Text>
            <Text style={styles.infoValue}>{item.owner?.email || 'غير متوفر'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>رقم الهاتف:</Text>
            <Text style={styles.infoValue}>{item.owner?.phone || 'غير متوفر'}</Text>
          </View>
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.shopDetails}>
          <Text style={styles.sectionTitle}>معلومات المحل:</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>العنوان:</Text>
            <Text style={styles.infoValue}>{item.address || 'غير متوفر'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>رقم الهاتف:</Text>
            <Text style={styles.infoValue}>{item.phone || 'غير متوفر'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>تاريخ التسجيل:</Text>
            <Text style={styles.infoValue}>{new Date(item.created_at).toLocaleDateString('ar-SA')}</Text>
          </View>
          
          {item.description && (
            <View style={styles.description}>
              <Text style={styles.infoLabel}>الوصف:</Text>
              <Text style={styles.descriptionText}>{item.description}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.buttonContainer}>
          <Button 
            mode="contained" 
            icon="check-circle" 
            style={styles.approveButton} 
            buttonColor={COLORS.success}
            onPress={() => handleApproveShop(item)}
          >
            موافقة
          </Button>
          
          <Button 
            mode="outlined" 
            icon="close-circle" 
            style={styles.rejectButton} 
            textColor={COLORS.error}
            onPress={() => handleRejectShop(item)}
          >
            رفض
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="المحلات المعلقة" />
      </Appbar.Header>
      
      {loading && !refreshing ? (
        <Loading fullScreen message="جاري تحميل المحلات المعلقة..." />
      ) : (
        <>
          {pendingShops.length > 0 ? (
            <FlatList
              data={pendingShops}
              renderItem={renderShopItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
              }
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="check-all" size={80} color={COLORS.success} />
              <Text style={styles.emptyText}>لا توجد طلبات معلقة</Text>
              <Text style={styles.emptyHint}>سيظهر هنا طلبات التسجيل الجديدة للمحلات</Text>
              <Button 
                mode="outlined" 
                icon="refresh" 
                onPress={handleRefresh}
                style={styles.refreshButton}
              >
                تحديث
              </Button>
            </View>
          )}
        </>
      )}
      
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => !approving && setDialogVisible(false)}>
          <Dialog.Icon icon="check-circle" />
          <Dialog.Title>تأكيد الموافقة</Dialog.Title>
          <Dialog.Content>
            <Text>
              هل أنت متأكد من رغبتك في الموافقة على محل "{selectedShop?.name}"؟
              بعد الموافقة، سيتمكن المحل من الوصول الكامل للنظام وإدارة خدمات الصيانة.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => setDialogVisible(false)}
              disabled={approving}
            >
              إلغاء
            </Button>
            <Button 
              onPress={confirmApproveShop} 
              loading={approving}
              disabled={approving}
              textColor={COLORS.success}
            >
              موافقة
            </Button>
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
    marginBottom: SPACING.xs,
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  pendingChip: {
    backgroundColor: COLORS.warning + '20',
  },
  divider: {
    marginVertical: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
    color: COLORS.primary,
  },
  ownerInfo: {
    marginBottom: SPACING.sm,
  },
  shopDetails: {
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoLabel: {
    fontWeight: '500',
    width: '30%',
    color: COLORS.gray,
  },
  infoValue: {
    flex: 1,
  },
  description: {
    marginTop: SPACING.xs,
  },
  descriptionText: {
    marginTop: 2,
    color: COLORS.darkGray,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  approveButton: {
    flex: 1,
    marginRight: SPACING.xs,
  },
  rejectButton: {
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
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  refreshButton: {
    marginTop: SPACING.sm,
  },
}); 