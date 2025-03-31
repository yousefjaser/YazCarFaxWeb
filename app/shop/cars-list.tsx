import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Appbar, Text, Card, Badge, Searchbar, Divider, FAB } from 'react-native-paper';
import { COLORS, SPACING } from '../constants';
import { supabase } from '../config';
import { useAuthStore } from '../utils/store';
import Loading from '../components/Loading';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function CarsListScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cars, setCars] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCars, setFilteredCars] = useState<any[]>([]);
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
    if (searchQuery.trim() === '') {
      setFilteredCars(cars);
    } else {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filtered = cars.filter(car => 
        car.make.toLowerCase().includes(lowercasedQuery) ||
        car.model.toLowerCase().includes(lowercasedQuery) ||
        car.plate_number.toLowerCase().includes(lowercasedQuery) ||
        car.customer?.name?.toLowerCase().includes(lowercasedQuery) ||
        car.customer?.phone?.includes(lowercasedQuery)
      );
      setFilteredCars(filtered);
    }
  }, [searchQuery, cars]);

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
          )
        `)
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setCars(data || []);
      setFilteredCars(data || []);
    } catch (error) {
      console.error('فشل في تحميل قائمة السيارات:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadCars();
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => router.push(`/shop/car-details/${item.id}`)}
    >
      <Card style={styles.carCard}>
        <Card.Content>
          <View style={styles.carHeader}>
            <View>
              <Text style={styles.carTitle}>{item.make} {item.model}</Text>
              <Text style={styles.carSubtitle}>سنة الصنع: {item.year}</Text>
            </View>
            <View style={styles.badgeContainer}>
              <Badge style={styles.badge}>{item.plate_number}</Badge>
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.ownerInfo}>
            <Icon name="account" size={20} color={COLORS.gray} style={styles.infoIcon} />
            <Text style={styles.ownerName}>{item.customer?.name || 'غير معروف'}</Text>
            <Icon name="phone" size={20} color={COLORS.gray} style={[styles.infoIcon, styles.phoneIcon]} />
            <Text style={styles.ownerPhone}>{item.customer?.phone || 'غير متوفر'}</Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const EmptyList = () => (
    <View style={styles.emptyContainer}>
      <Icon name="car-off" size={80} color={COLORS.gray} />
      <Text style={styles.emptyText}>لا توجد سيارات مسجلة</Text>
      <Text style={styles.emptySubText}>قم بإضافة سيارة جديدة من زر الإضافة أدناه</Text>
    </View>
  );

  if (loading && !refreshing) {
    return <Loading fullScreen message="جاري تحميل قائمة السيارات..." />;
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="قائمة السيارات" />
      </Appbar.Header>

      <Searchbar
        placeholder="البحث عن سيارة..."
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
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/shop/add-car')}
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
    paddingBottom: SPACING.xxl * 2, // للفاب
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
  carSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
  },
  badgeContainer: {
    alignItems: 'flex-end',
  },
  badge: {
    backgroundColor: COLORS.primary,
    color: COLORS.white,
  },
  divider: {
    marginVertical: SPACING.sm,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  infoIcon: {
    marginRight: SPACING.xs,
  },
  phoneIcon: {
    marginLeft: SPACING.md,
  },
  ownerName: {
    fontSize: 14,
  },
  ownerPhone: {
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: SPACING.md,
    color: COLORS.gray,
  },
  emptySubText: {
    textAlign: 'center',
    marginTop: SPACING.sm,
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