// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Appbar, Card, Button, ActivityIndicator } from 'react-native-paper';
import { COLORS, SPACING } from '../constants';
import { useAuthStore } from '../utils/store';
import { supabase } from '../config';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Loading from '../components/Loading';

export default function CustomerCarsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCars = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('cars')
        .select(`
          *,
          service_visits:service_visits(
            id,
            date,
            mileage,
            service_category:service_category_id(name),
            created_at
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('فشل في تحميل بيانات السيارات:', error);
        return;
      }
      
      // إضافة معلومات آخر صيانة
      const carsWithLastService = data.map(car => {
        const serviceVisits = car.service_visits || [];
        
        // ترتيب الزيارات حسب التاريخ (من الأحدث للأقدم)
        serviceVisits.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const lastServiceVisit = serviceVisits.length > 0 ? serviceVisits[0] : null;
        
        return {
          ...car,
          last_service_date: lastServiceVisit ? new Date(lastServiceVisit.date).toLocaleDateString('ar-SA') : null,
          last_service_type: lastServiceVisit?.service_category?.name || null,
          service_visits_count: serviceVisits.length
        };
      });
      
      setCars(carsWithLastService || []);
    } catch (error) {
      console.error('حدث خطأ أثناء تحميل بيانات السيارات:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCars();
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadCars();
  };

  const handleCarPress = (car) => {
    router.push(`/customer/car-details/${car.id}`);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'غير متوفر';
    
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-SA');
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleCarPress(item)}>
      <Card style={styles.carCard}>
        <Card.Content>
          <View style={styles.carHeader}>
            <Text style={styles.carTitle}>{item.make} {item.model}</Text>
            <Text style={styles.carYear}>{item.year}</Text>
          </View>
          
          <Text style={styles.plateNumber}>رقم اللوحة: {item.plate_number}</Text>
          
          <View style={styles.serviceInfo}>
            <View style={styles.serviceRow}>
              <Text style={styles.serviceLabel}>آخر صيانة:</Text>
              <Text style={styles.serviceValue}>{item.last_service_date || 'لا توجد صيانة سابقة'}</Text>
            </View>
            
            {item.last_service_type && (
              <View style={styles.serviceRow}>
                <Text style={styles.serviceLabel}>نوع الصيانة:</Text>
                <Text style={styles.serviceValue}>{item.last_service_type}</Text>
              </View>
            )}
            
            <View style={styles.serviceRow}>
              <Text style={styles.serviceLabel}>عدد سجلات الصيانة:</Text>
              <Text style={styles.serviceValue}>{item.service_visits_count}</Text>
            </View>
          </View>
          
          <Button 
            mode="outlined" 
            style={styles.viewDetailsButton}
            onPress={() => handleCarPress(item)}
          >
            عرض التفاصيل
          </Button>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="سياراتي" />
      </Appbar.Header>
      
      {loading && !refreshing ? (
        <Loading fullScreen message="جاري تحميل السيارات..." />
      ) : (
        <>
          {cars.length > 0 ? (
            <FlatList
              data={cars}
              renderItem={renderItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
              }
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="car-outline" size={80} color={COLORS.gray} />
              <Text style={styles.emptyText}>ليس لديك سيارات مسجلة حتى الآن</Text>
              <Text style={styles.emptyHint}>يجب التوجه إلى محل صيانة لتسجيل سيارتك</Text>
            </View>
          )}
        </>
      )}
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
  carCard: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.white,
  },
  carHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  carTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  carYear: {
    fontSize: 14,
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  plateNumber: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 2,
    marginBottom: SPACING.sm,
  },
  serviceInfo: {
    backgroundColor: COLORS.background,
    padding: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.sm,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  serviceLabel: {
    color: COLORS.gray,
    fontSize: 14,
  },
  serviceValue: {
    fontWeight: '500',
    fontSize: 14,
  },
  viewDetailsButton: {
    marginTop: SPACING.xs,
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
    textAlign: 'center',
  },
}); 