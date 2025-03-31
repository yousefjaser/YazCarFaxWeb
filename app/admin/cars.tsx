// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Text, Appbar, Card, Button, Chip, TextInput, SegmentedButtons } from 'react-native-paper';
import { COLORS, SPACING } from '../constants';
import { useAuthStore } from '../utils/store';
import { supabase } from '../config';
import Loading from '../components/Loading';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function CarsScreen() {
  const { user } = useAuthStore();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState('all'); // all, recent, old

  useEffect(() => {
    loadCars();
  }, [filterBy]);

  const loadCars = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('cars')
        .select(`
          *,
          customer:customer_id(id, full_name, phone),
          shop:shop_id(id, name),
          service_visits:service_visits(id)
        `);
      
      // تطبيق الفلتر حسب اختيار المستخدم
      if (filterBy === 'recent') {
        query = query.order('created_at', { ascending: false }).limit(50);
      } else if (filterBy === 'old') {
        query = query.order('created_at', { ascending: true }).limit(50);
      } else {
        // في حالة 'all'، نقوم بتحميل أحدث 100 سيارة فقط لتحسين الأداء
        query = query.order('created_at', { ascending: false }).limit(100);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('فشل في تحميل السيارات:', error);
        return;
      }
      
      // إضافة معلومات عدد الصيانات
      const carsWithServiceCount = data.map(car => ({
        ...car,
        service_visits_count: car.service_visits ? car.service_visits.length : 0
      }));
      
      setCars(carsWithServiceCount || []);
    } catch (error) {
      console.error('حدث خطأ أثناء تحميل السيارات:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadCars();
  };

  const filteredCars = cars.filter(car => 
    car.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    car.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    car.plate_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    car.customer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    car.shop?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCarItem = ({ item }) => (
    <Card style={styles.carCard}>
      <Card.Content>
        <View style={styles.carHeader}>
          <View>
            <Text style={styles.carName}>{item.make} {item.model}</Text>
            <Text style={styles.carYear}>{item.year}</Text>
          </View>
          <Chip icon="car" mode="flat" style={styles.plateChip}>
            {item.plate_number}
          </Chip>
        </View>
        
        <View style={styles.infoContainer}>
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>المالك:</Text>
            <Text style={styles.infoValue}>{item.customer?.full_name || 'غير معروف'}</Text>
          </View>
          
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>المحل:</Text>
            <Text style={styles.infoValue}>{item.shop?.name || 'غير معروف'}</Text>
          </View>
          
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>عدد الصيانات:</Text>
            <Text style={styles.infoValue}>{item.service_visits_count}</Text>
          </View>
          
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>المسافة المقطوعة:</Text>
            <Text style={styles.infoValue}>{item.mileage || 0} كم</Text>
          </View>
          
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>تاريخ التسجيل:</Text>
            <Text style={styles.infoValue}>{new Date(item.created_at).toLocaleDateString('ar-SA')}</Text>
          </View>
          
          {item.vin && (
            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>رقم الهيكل (VIN):</Text>
              <Text style={styles.infoValue}>{item.vin}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.buttonContainer}>
          <Button 
            mode="outlined" 
            icon="information" 
            style={styles.detailsButton} 
            onPress={() => console.log('عرض تفاصيل السيارة:', item.id)}
          >
            التفاصيل
          </Button>
          
          <Button 
            mode="outlined" 
            icon="history" 
            style={styles.historyButton} 
            onPress={() => console.log('عرض سجل الصيانة:', item.id)}
          >
            سجل الصيانة
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="السيارات" />
      </Appbar.Header>
      
      <View style={styles.filtersContainer}>
        <TextInput
          placeholder="البحث عن سيارة..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          mode="outlined"
          style={styles.searchInput}
          right={<TextInput.Icon icon="magnify" />}
          clearButtonMode="while-editing"
        />
        
        <SegmentedButtons
          value={filterBy}
          onValueChange={setFilterBy}
          buttons={[
            { value: 'all', label: 'الكل' },
            { value: 'recent', label: 'الأحدث' },
            { value: 'old', label: 'الأقدم' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>
      
      {loading && !refreshing ? (
        <Loading fullScreen message="جاري تحميل السيارات..." />
      ) : (
        <>
          {filteredCars.length > 0 ? (
            <FlatList
              data={filteredCars}
              renderItem={renderCarItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
              }
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="car-off" size={80} color={COLORS.gray} />
              <Text style={styles.emptyText}>
                {searchQuery 
                  ? 'لا توجد نتائج مطابقة لبحثك' 
                  : 'لا توجد سيارات مسجلة'}
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
  carCard: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.white,
  },
  carHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  carName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  carYear: {
    fontSize: 14,
    color: COLORS.primary,
    marginTop: 2,
  },
  plateChip: {
    backgroundColor: COLORS.background,
  },
  infoContainer: {
    backgroundColor: COLORS.background,
    padding: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.sm,
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoLabel: {
    fontWeight: '500',
    color: COLORS.gray,
  },
  infoValue: {
    fontWeight: '400',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailsButton: {
    flex: 1,
    marginRight: SPACING.xs,
  },
  historyButton: {
    flex: 1,
    marginLeft: SPACING.xs,
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