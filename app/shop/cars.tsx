import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Appbar, Text, Card, Searchbar, FAB, ActivityIndicator } from 'react-native-paper';
import { COLORS, SPACING } from '../constants';
import { supabase } from '../config';
import { useAuthStore } from '../utils/store';
import Loading from '../components/Loading';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function CarsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cars, setCars] = useState<any[]>([]);
  const [filteredCars, setFilteredCars] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [shop, setShop] = useState<any>(null);
  
  useEffect(() => {
    loadShopData();
  }, []);
  
  useEffect(() => {
    if (shop) {
      loadCars();
    }
  }, [shop]);
  
  useEffect(() => {
    filterCars();
  }, [cars, searchQuery]);
  
  const loadShopData = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      setShop(data);
    } catch (error) {
      console.error('فشل في تحميل بيانات المحل:', error);
    }
  };
  
  const loadCars = async () => {
    if (!shop) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cars')
        .select(`
          *,
          customer:customer_id (
            id,
            name,
            phone
          ),
          service_visits:service_visits (
            id,
            date,
            service_category:service_categories (
              id,
              name
            )
          )
        `)
        .eq('last_service_shop_id', shop.id)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      // تصنيف وتجميع سجلات الخدمة
      const carsWithFormattedData = data?.map(car => {
        const visits = car.service_visits || [];
        const lastVisit = visits.length > 0 
          ? visits.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
          : null;
        
        return {
          ...car,
          lastServiceDate: lastVisit?.date || null,
          lastServiceType: lastVisit?.service_category?.name || null,
          visitsCount: visits.length
        };
      });
      
      setCars(carsWithFormattedData || []);
      setFilteredCars(carsWithFormattedData || []);
    } catch (error) {
      console.error('فشل في تحميل السيارات:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const filterCars = () => {
    if (searchQuery.trim() === '') {
      setFilteredCars(cars);
      return;
    }
    
    const lowercasedQuery = searchQuery.toLowerCase();
    const filtered = cars.filter(
      car =>
        car.make?.toLowerCase().includes(lowercasedQuery) ||
        car.model?.toLowerCase().includes(lowercasedQuery) ||
        car.year?.toString().includes(lowercasedQuery) ||
        car.plate_number?.toLowerCase().includes(lowercasedQuery) ||
        car.vin?.toLowerCase().includes(lowercasedQuery) ||
        car.customer?.name?.toLowerCase().includes(lowercasedQuery) ||
        car.customer?.phone?.includes(lowercasedQuery)
    );
    
    setFilteredCars(filtered);
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    loadCars();
  };
  
  const handleAddCar = () => {
    router.push('/shop/add-car');
  };
  
  const handleCarPress = (car: any) => {
    router.push(`/shop/car-details/${car.id}`);
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'لا يوجد';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => handleCarPress(item)}>
      <Card style={styles.carCard}>
        <Card.Content>
          <View style={styles.carHeader}>
            <View>
              <Text style={styles.carTitle}>
                {item.make} {item.model} ({item.year})
              </Text>
              <Text style={styles.plateNumber}>رقم اللوحة: {item.plate_number}</Text>
            </View>
            <TouchableOpacity
              style={styles.serviceButton}
              onPress={() => router.push(`/shop/add-service-visit?carId=${item.id}`)}
            >
              <Icon name="wrench" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.ownerInfo}>
            <Icon name="account" size={16} color={COLORS.gray} style={styles.icon} />
            <Text style={styles.ownerName}>{item.customer?.name}</Text>
            <Text style={styles.ownerPhone}>{item.customer?.phone}</Text>
          </View>
          
          <View style={styles.serviceInfo}>
            <View style={styles.serviceDetail}>
              <Text style={styles.serviceLabel}>آخر خدمة:</Text>
              <Text style={styles.serviceValue}>
                {item.lastServiceDate ? formatDate(item.lastServiceDate) : 'لا توجد خدمات'}
              </Text>
            </View>
            
            {item.lastServiceType && (
              <View style={styles.serviceDetail}>
                <Text style={styles.serviceLabel}>نوع الخدمة:</Text>
                <Text style={styles.serviceValue}>{item.lastServiceType}</Text>
              </View>
            )}
            
            <View style={styles.serviceDetail}>
              <Text style={styles.serviceLabel}>عدد الزيارات:</Text>
              <Text style={styles.serviceValue}>{item.visitsCount}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
  
  const EmptyList = () => (
    <View style={styles.emptyContainer}>
      <Icon name="car-outline" size={80} color={COLORS.gray} />
      <Text style={styles.emptyText}>لا توجد سيارات مسجلة</Text>
    </View>
  );
  
  if (loading && !refreshing) {
    return <Loading fullScreen message="جاري تحميل السيارات..." />;
  }
  
  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="إدارة السيارات" />
      </Appbar.Header>
      
      <Searchbar
        placeholder="بحث عن سيارة..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        iconColor={COLORS.primary}
      />
      
      <FlatList
        data={filteredCars}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={EmptyList}
      />
      
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={handleAddCar}
        color={COLORS.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchBar: {
    margin: SPACING.md,
    elevation: 2,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl * 2,
  },
  carCard: {
    marginBottom: SPACING.md,
    elevation: 2,
  },
  carHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  carTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  plateNumber: {
    fontSize: 14,
    color: COLORS.gray,
  },
  serviceButton: {
    padding: SPACING.xs,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  icon: {
    marginRight: SPACING.xs,
  },
  ownerName: {
    fontSize: 14,
    marginRight: SPACING.sm,
  },
  ownerPhone: {
    fontSize: 14,
    color: COLORS.dark,
  },
  serviceInfo: {
    marginTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: SPACING.sm,
  },
  serviceDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  serviceLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  serviceValue: {
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    marginTop: SPACING.md,
    fontSize: 16,
    textAlign: 'center',
    color: COLORS.gray,
  },
  fab: {
    position: 'absolute',
    margin: SPACING.md,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.primary,
  },
}); 