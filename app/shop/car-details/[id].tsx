// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ToastAndroid, Alert } from 'react-native';
import { Appbar, Text, Card, Divider, Button, List, Avatar, Dialog, Portal } from 'react-native-paper';
import { COLORS, SPACING } from '../../constants';
import { supabase } from '../../config';
import { useAuthStore } from '../../utils/store';
import Loading from '../../components/Loading';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function CarDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const carId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [car, setCar] = useState<any>(null);
  const [serviceVisits, setServiceVisits] = useState<any[]>([]);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  
  useEffect(() => {
    loadCarDetails();
  }, [carId]);
  
  const loadCarDetails = async () => {
    if (!carId) return;
    
    setLoading(true);
    try {
      // تحميل بيانات السيارة
      const { data: carData, error: carError } = await supabase
        .from('cars')
        .select(`
          *,
          customer:customer_id (
            id,
            name,
            phone,
            email
          )
        `)
        .eq('id', carId)
        .single();
      
      if (carError) throw carError;
      setCar(carData);
      
      // تحميل سجل الخدمات
      const { data: visitsData, error: visitsError } = await supabase
        .from('service_visits')
        .select(`
          *,
          service_category:service_category_id (
            id,
            name
          )
        `)
        .eq('car_id', carId)
        .order('date', { ascending: false });
      
      if (visitsError) throw visitsError;
      setServiceVisits(visitsData || []);
      
    } catch (error) {
      console.error('فشل في تحميل تفاصيل السيارة:', error);
      ToastAndroid.show('فشل في تحميل تفاصيل السيارة', ToastAndroid.SHORT);
    } finally {
      setLoading(false);
    }
  };
  
  const handleEdit = () => {
    router.push(`/shop/edit-car/${carId}`);
  };
  
  const handleDelete = async () => {
    setDeleteDialogVisible(false);
    setLoading(true);
    
    try {
      // حذف سجلات الخدمة أولاً
      const { error: servicesError } = await supabase
        .from('service_visits')
        .delete()
        .eq('car_id', carId);
      
      if (servicesError) throw servicesError;
      
      // ثم حذف السيارة
      const { error: carError } = await supabase
        .from('cars')
        .delete()
        .eq('id', carId);
      
      if (carError) throw carError;
      
      ToastAndroid.show('تم حذف السيارة بنجاح', ToastAndroid.SHORT);
      router.back();
    } catch (error) {
      console.error('فشل في حذف السيارة:', error);
      ToastAndroid.show('فشل في حذف السيارة', ToastAndroid.SHORT);
      setLoading(false);
    }
  };
  
  const addServiceVisit = () => {
    router.push(`/shop/add-service-visit?carId=${carId}`);
  };
  
  const viewServiceHistory = () => {
    router.push(`/shop/service-history?carId=${carId}`);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const showDeleteDialog = () => {
    setDeleteDialogVisible(true);
  };
  
  const hideDeleteDialog = () => {
    setDeleteDialogVisible(false);
  };
  
  if (loading) {
    return <Loading fullScreen message="جاري تحميل بيانات السيارة..." />;
  }
  
  if (!car) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={64} color={COLORS.error} />
        <Text style={styles.errorText}>لم يتم العثور على بيانات السيارة</Text>
        <Button mode="contained" onPress={() => router.back()}>العودة</Button>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="تفاصيل السيارة" />
        <Appbar.Action icon="pencil" onPress={handleEdit} />
        <Appbar.Action icon="delete" onPress={showDeleteDialog} />
      </Appbar.Header>
      
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.carHeader}>
              <View style={styles.carIconContainer}>
                <Icon name="car" size={64} color={COLORS.primary} />
              </View>
              <Text style={styles.carTitle}>
                {car.make} {car.model} ({car.year})
              </Text>
              <Text style={styles.plateNumber}>رقم اللوحة: {car.plate_number}</Text>
            </View>
            
            <View style={styles.carDetails}>
              {car.color && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>اللون:</Text>
                  <Text style={styles.detailValue}>{car.color}</Text>
                </View>
              )}
              
              {car.vin && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>رقم الهيكل (VIN):</Text>
                  <Text style={styles.detailValue}>{car.vin}</Text>
                </View>
              )}
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>تاريخ التسجيل:</Text>
                <Text style={styles.detailValue}>{formatDate(car.created_at)}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>بيانات المالك</Text>
            <Divider style={styles.divider} />
            
            <View style={styles.ownerInfo}>
              <Avatar.Icon size={50} icon="account" style={styles.ownerAvatar} />
              <View style={styles.ownerDetails}>
                <Text style={styles.ownerName}>{car.customer?.name}</Text>
                <View style={styles.contactRow}>
                  <Icon name="phone" size={16} color={COLORS.gray} style={styles.contactIcon} />
                  <Text style={styles.contactText}>{car.customer?.phone}</Text>
                </View>
                {car.customer?.email && (
                  <View style={styles.contactRow}>
                    <Icon name="email" size={16} color={COLORS.gray} style={styles.contactIcon} />
                    <Text style={styles.contactText}>{car.customer?.email}</Text>
                  </View>
                )}
              </View>
            </View>
          </Card.Content>
        </Card>
        
        <View style={styles.actionsCard}>
          <Button
            mode="contained"
            icon="wrench"
            onPress={addServiceVisit}
            style={styles.actionButton}
          >
            إضافة خدمة جديدة
          </Button>
          
          <Button
            mode="outlined"
            icon="history"
            onPress={viewServiceHistory}
            style={styles.actionButton}
          >
            عرض سجل الخدمات
          </Button>
        </View>
        
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.historyHeader}>
              <Text style={styles.sectionTitle}>آخر الخدمات</Text>
              <Button
                mode="text"
                onPress={viewServiceHistory}
                style={{ marginTop: -5 }}
                labelStyle={{ fontSize: 12 }}
              >
                عرض الكل
              </Button>
            </View>
            <Divider style={styles.divider} />
            
            {serviceVisits.length === 0 ? (
              <Text style={styles.emptyText}>لا توجد خدمات مسجلة لهذه السيارة</Text>
            ) : (
              serviceVisits.slice(0, 3).map((visit) => (
                <TouchableOpacity
                  key={visit.id}
                  onPress={() => router.push(`/shop/service-details/${visit.id}`)}
                  style={styles.visitItem}
                >
                  <View style={styles.visitHeader}>
                    <Text style={styles.visitTitle}>{visit.service_category?.name}</Text>
                    <Text style={styles.visitDate}>{formatDate(visit.date)}</Text>
                  </View>
                  <View style={styles.visitDetails}>
                    <Text style={styles.visitPrice}>{visit.price} ريال</Text>
                    {visit.mileage && (
                      <View style={styles.mileageContainer}>
                        <Icon name="speedometer" size={14} color={COLORS.gray} />
                        <Text style={styles.mileageText}>{visit.mileage} كم</Text>
                      </View>
                    )}
                  </View>
                  {visit.notes && (
                    <Text style={styles.visitNotes} numberOfLines={1}>
                      {visit.notes}
                    </Text>
                  )}
                </TouchableOpacity>
              ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>
      
      <Portal>
        {/* @ts-ignore */}
        <Dialog visible={deleteDialogVisible} onDismiss={hideDeleteDialog}>
          <Dialog.Title>تأكيد الحذف</Dialog.Title>
          <Dialog.Content>
            <Text>
              هل أنت متأكد من رغبتك في حذف هذه السيارة؟ سيتم حذف جميع سجلات الخدمة المرتبطة بها أيضًا. لا يمكن التراجع عن هذا الإجراء.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDeleteDialog}>إلغاء</Button>
            <Button mode="contained" onPress={handleDelete} style={{ backgroundColor: COLORS.error }}>
              حذف
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
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  card: {
    marginBottom: SPACING.md,
    elevation: 2,
  },
  carHeader: {
    marginBottom: SPACING.sm,
  },
  carIconContainer: {
    marginRight: SPACING.md,
  },
  carTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  plateNumber: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  carDetails: {
    marginTop: SPACING.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  divider: {
    marginBottom: SPACING.sm,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerAvatar: {
    backgroundColor: COLORS.primary,
  },
  ownerDetails: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  contactIcon: {
    marginRight: SPACING.xs,
  },
  contactText: {
    fontSize: 14,
  },
  actionsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.gray,
    marginTop: SPACING.md,
  },
  visitItem: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  visitTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  visitDate: {
    fontSize: 12,
    color: COLORS.gray,
  },
  visitDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  visitPrice: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  mileageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mileageText: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: SPACING.xs,
  },
  visitNotes: {
    fontSize: 12,
    color: COLORS.dark,
    marginTop: SPACING.xs,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: SPACING.lg,
    color: COLORS.error,
  },
}); 