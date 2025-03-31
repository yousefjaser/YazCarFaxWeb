import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ToastAndroid, Alert } from 'react-native';
import { Appbar, Text, Card, Divider, Button, Dialog, Portal } from 'react-native-paper';
import { COLORS, SPACING } from '../../constants';
import { supabase } from '../../config';
import { useAuthStore } from '../../utils/store';
import Loading from '../../components/Loading';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function ServiceDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const serviceId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [service, setService] = useState<any>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  
  useEffect(() => {
    loadServiceDetails();
  }, [serviceId]);
  
  const loadServiceDetails = async () => {
    if (!serviceId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_visits')
        .select(`
          *,
          car:car_id (
            id,
            make,
            model,
            year,
            plate_number,
            color,
            vin,
            customer:customer_id (
              id,
              name,
              phone,
              email
            )
          ),
          service_category:service_category_id (
            id,
            name
          ),
          shop:shop_id (
            id,
            name,
            phone,
            address
          )
        `)
        .eq('id', serviceId)
        .single();
      
      if (error) throw error;
      setService(data);
    } catch (error) {
      console.error('فشل في تحميل تفاصيل الخدمة:', error);
      ToastAndroid.show('فشل في تحميل تفاصيل الخدمة', ToastAndroid.SHORT);
    } finally {
      setLoading(false);
    }
  };
  
  const handleEdit = () => {
    router.push(`/shop/edit-service-visit/${serviceId}`);
  };
  
  const handleDelete = async () => {
    setDeleteDialogVisible(false);
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('service_visits')
        .delete()
        .eq('id', serviceId);
      
      if (error) throw error;
      
      ToastAndroid.show('تم حذف الخدمة بنجاح', ToastAndroid.SHORT);
      router.back();
    } catch (error) {
      console.error('فشل في حذف الخدمة:', error);
      ToastAndroid.show('فشل في حذف الخدمة', ToastAndroid.SHORT);
      setLoading(false);
    }
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
    return <Loading fullScreen message="جاري تحميل تفاصيل الخدمة..." />;
  }
  
  if (!service) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={64} color={COLORS.error} />
        <Text style={styles.errorText}>لم يتم العثور على تفاصيل الخدمة</Text>
        <Button mode="contained" onPress={() => router.back()}>العودة</Button>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="تفاصيل الخدمة" />
        <Appbar.Action icon="pencil" onPress={handleEdit} />
        <Appbar.Action icon="delete" onPress={showDeleteDialog} />
      </Appbar.Header>
      
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.serviceHeader}>
              <Text style={styles.serviceTitle}>{service.service_category?.name}</Text>
              <Text style={styles.serviceDate}>{formatDate(service.date)}</Text>
            </View>
            
            <View style={styles.priceMileageContainer}>
              <View style={styles.priceContainer}>
                <Text style={styles.label}>السعر:</Text>
                <Text style={styles.priceText}>{service.price} ريال</Text>
              </View>
              
              {service.mileage && (
                <View style={styles.mileageContainer}>
                  <Icon name="speedometer" size={18} color={COLORS.gray} />
                  <Text style={styles.mileageText}>{service.mileage} كم</Text>
                </View>
              )}
            </View>
            
            {service.notes && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>ملاحظات:</Text>
                <Text style={styles.notesText}>{service.notes}</Text>
              </View>
            )}
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>بيانات السيارة</Text>
            <Divider style={styles.divider} />
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>الماركة والموديل:</Text>
              <Text style={styles.value}>
                {service.car?.make} {service.car?.model} ({service.car?.year})
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>رقم اللوحة:</Text>
              <Text style={styles.value}>{service.car?.plate_number}</Text>
            </View>
            
            {service.car?.color && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>اللون:</Text>
                <Text style={styles.value}>{service.car?.color}</Text>
              </View>
            )}
            
            {service.car?.vin && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>رقم الهيكل (VIN):</Text>
                <Text style={styles.value}>{service.car?.vin}</Text>
              </View>
            )}
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>بيانات العميل</Text>
            <Divider style={styles.divider} />
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>الاسم:</Text>
              <Text style={styles.value}>{service.car?.customer?.name}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>رقم الهاتف:</Text>
              <View style={styles.phoneContainer}>
                <Text style={styles.value}>{service.car?.customer?.phone}</Text>
                <Button 
                  mode="text" 
                  icon="phone" 
                  onPress={() => {
                    // احتفظ بهذا المكان لتنفيذ الاتصال بالعميل
                  }}
                  style={styles.callButton}
                >
                  اتصال
                </Button>
              </View>
            </View>
            
            {service.car?.customer?.email && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>البريد الإلكتروني:</Text>
                <Text style={styles.value}>{service.car?.customer?.email}</Text>
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
      
      <Portal>
        {/* @ts-ignore */}
        <Dialog visible={deleteDialogVisible} onDismiss={hideDeleteDialog}>
          <Dialog.Title>تأكيد الحذف</Dialog.Title>
          <Dialog.Content>
            <Text>هل أنت متأكد من رغبتك في حذف سجل هذه الخدمة؟ لا يمكن التراجع عن هذا الإجراء.</Text>
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
  serviceHeader: {
    marginBottom: SPACING.sm,
  },
  serviceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  serviceDate: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  priceMileageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: SPACING.xs,
  },
  mileageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mileageText: {
    fontSize: 14,
    color: COLORS.dark,
    marginLeft: SPACING.xs,
  },
  section: {
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  notesText: {
    fontSize: 14,
    color: COLORS.dark,
  },
  divider: {
    marginVertical: SPACING.xs,
  },
  infoRow: {
    marginVertical: SPACING.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: SPACING.xs / 2,
  },
  value: {
    fontSize: 14,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  callButton: {
    marginLeft: SPACING.md,
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