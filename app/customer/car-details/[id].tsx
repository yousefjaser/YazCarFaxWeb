// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList, Image, RefreshControl, Alert } from 'react-native';
import { Text, Appbar, Card, Chip, Button, Divider, ActivityIndicator, Dialog, Portal } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SPACING } from '../../constants';
import { supabase } from '../../config';
import Loading from '../../components/Loading';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function CarDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [car, setCar] = useState(null);
  const [serviceHistory, setServiceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);

  useEffect(() => {
    loadCarDetails();
  }, [id]);

  const loadCarDetails = async () => {
    try {
      setLoading(true);
      
      // 1. تحميل معلومات السيارة
      const { data: carData, error: carError } = await supabase
        .from('cars')
        .select(`
          *,
          shop:shop_id(id, name),
          customer:customer_id(id, full_name)
        `)
        .eq('id', id)
        .single();
        
      if (carError) {
        console.error('فشل في تحميل بيانات السيارة:', carError);
        return;
      }
      
      setCar(carData);
      
      // 2. تحميل سجل الصيانة
      const { data: historyData, error: historyError } = await supabase
        .from('service_visits')
        .select(`
          *,
          service_category:service_category_id(id, name, price),
          shop:shop_id(id, name),
          car:car_id(id, make, model, year)
        `)
        .eq('car_id', id)
        .order('date', { ascending: false });
      
      if (historyError) {
        console.error('فشل في تحميل سجل الصيانة:', historyError);
        return;
      }
      
      setServiceHistory(historyData || []);
    } catch (error) {
      console.error('حدث خطأ أثناء تحميل بيانات السيارة:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadCarDetails();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'غير متوفر';
    try {
      return format(parseISO(dateString), 'dd MMMM yyyy', { locale: ar });
    } catch (error) {
      return dateString;
    }
  };

  const renderServiceHistoryItem = ({ item }) => (
    <Card style={styles.serviceCard} onPress={() => router.push(`/shop/service-details/${item.id}`)}>
      <Card.Content>
        <View style={styles.serviceHeader}>
          <View>
            <Text style={styles.serviceDate}>{formatDate(item.date)}</Text>
            <Text style={styles.serviceShop}>{item.shop?.name}</Text>
          </View>
          <Chip icon="wrench" mode="outlined">{item.service_category?.name}</Chip>
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>المسافة المقطوعة:</Text>
          <Text style={styles.detailValue}>{item.mileage} كم</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>الملاحظات:</Text>
          <Text style={styles.detailValue} numberOfLines={2}>
            {item.notes || 'لا توجد ملاحظات'}
          </Text>
        </View>
        
        {item.next_service_date && (
          <View style={styles.nextServiceContainer}>
            <Icon name="calendar-clock" size={16} color={COLORS.primary} />
            <Text style={styles.nextService}>
              الصيانة القادمة: {formatDate(item.next_service_date)}
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  if (loading && !refreshing) {
    return <Loading fullScreen message="جاري تحميل بيانات السيارة..." />;
  }

  if (!car) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="تفاصيل السيارة" />
        </Appbar.Header>
        <View style={styles.notFoundContainer}>
          <Icon name="car-off" size={64} color={COLORS.error} />
          <Text style={styles.notFoundText}>لم يتم العثور على السيارة</Text>
          <Button mode="contained" onPress={() => router.back()}>
            العودة للخلف
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={`${car.make} ${car.model}`} subtitle={car.year} />
      </Appbar.Header>
      
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <Card style={styles.carInfoCard}>
          <Card.Content>
            <View style={styles.carImageContainer}>
              <Icon 
                name="car" 
                size={80} 
                color={COLORS.primary} 
                style={styles.carIcon}
              />
            </View>
            
            <View style={styles.carInfo}>
              <Text style={styles.carTitle}>{car.make} {car.model} {car.year}</Text>
              <Chip icon="car" style={styles.plateNumber}>{car.plate_number}</Chip>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.infoSection}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>اللون:</Text>
                <Text style={styles.detailValue}>{car.color || 'غير محدد'}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>رقم الهيكل (VIN):</Text>
                <Text style={styles.detailValue}>{car.vin || 'غير متوفر'}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>تاريخ التسجيل:</Text>
                <Text style={styles.detailValue}>{formatDate(car.registration_date)}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>المسافة المقطوعة:</Text>
                <Text style={styles.detailValue}>{car.mileage || 0} كم</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>مسجل لدى:</Text>
                <Text style={styles.detailValue}>{car.shop?.name || 'غير معروف'}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
        
        <Card style={styles.serviceHistoryCard}>
          <Card.Title 
            title="سجل الصيانة" 
            subtitle={`${serviceHistory.length} صيانة`} 
            left={(props) => <Icon {...props} name="history" size={24} color={COLORS.primary} />}
          />
          <Card.Content>
            {serviceHistory.length > 0 ? (
              <FlatList
                data={serviceHistory}
                renderItem={renderServiceHistoryItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
              />
            ) : (
              <View style={styles.emptyServiceContainer}>
                <Icon name="clipboard-outline" size={64} color={COLORS.gray} />
                <Text style={styles.emptyServiceText}>لا توجد سجلات صيانة لهذه السيارة</Text>
              </View>
            )}
          </Card.Content>
        </Card>
        
        <View style={styles.spacing} />
      </ScrollView>
      
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Icon icon="alert" />
          <Dialog.Title>تأكيد الحذف</Dialog.Title>
          <Dialog.Content>
            <Text>هل أنت متأكد من رغبتك في حذف هذه السيارة؟ هذا الإجراء لا يمكن التراجع عنه.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>إلغاء</Button>
            <Button onPress={() => console.log('طلب حذف السيارة')}>حذف</Button>
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
  carInfoCard: {
    margin: SPACING.md,
    backgroundColor: COLORS.white,
  },
  serviceHistoryCard: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.white,
  },
  carImageContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.sm,
  },
  carIcon: {
    marginBottom: SPACING.md,
  },
  carInfo: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  carTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  plateNumber: {
    marginVertical: SPACING.xs,
  },
  infoSection: {
    marginTop: SPACING.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: {
    fontWeight: '500',
    color: COLORS.gray,
  },
  detailValue: {
    fontWeight: '400',
  },
  divider: {
    marginVertical: SPACING.sm,
  },
  serviceCard: {
    backgroundColor: COLORS.white,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  serviceDate: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  serviceShop: {
    fontSize: 12,
    color: COLORS.gray,
  },
  nextServiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    padding: SPACING.xs,
    borderRadius: 4,
    marginTop: SPACING.sm,
  },
  nextService: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
    marginLeft: 4,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  notFoundText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: SPACING.md,
    textAlign: 'center',
  },
  emptyServiceContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyServiceText: {
    marginTop: SPACING.md,
    textAlign: 'center',
    color: COLORS.gray,
  },
  spacing: {
    height: SPACING.xl,
  },
  deleteButton: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.error + '15',
  },
}); 