import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Appbar, Text, Card, Divider, Searchbar, Chip, Button } from 'react-native-paper';
import { COLORS, SPACING } from '../constants';
import { supabase } from '../config';
import { useAuthStore } from '../utils/store';
import Loading from '../components/Loading';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScrollView } from 'react-native-gesture-handler';

export default function ServiceHistoryScreen() {
  const router = useRouter();
  const { carId } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [serviceVisits, setServiceVisits] = useState<any[]>([]);
  const [filteredVisits, setFilteredVisits] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [shop, setShop] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [car, setCar] = useState<any>(null);
  
  useEffect(() => {
    loadShopData();
    loadCategories();
    if (carId) {
      loadCarData();
    }
  }, [carId]);
  
  useEffect(() => {
    if (shop) {
      loadServiceVisits();
    }
  }, [shop, carId]);
  
  useEffect(() => {
    filterVisits();
  }, [serviceVisits, searchQuery, selectedCategoryId]);
  
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
  
  const loadCarData = async () => {
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
        .eq('id', carId)
        .single();
      
      if (error) throw error;
      setCar(data);
    } catch (error) {
      console.error('فشل في تحميل بيانات السيارة:', error);
    }
  };
  
  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('فشل في تحميل فئات الخدمة:', error);
    }
  };
  
  const loadServiceVisits = async () => {
    if (!shop) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('service_visits')
        .select(`
          *,
          car:car_id (
            id,
            make,
            model,
            year,
            plate_number,
            customer:customer_id (
              id,
              name,
              phone
            )
          ),
          service_category:service_categories (
            id,
            name
          )
        `)
        .eq('shop_id', shop.id);
      
      // إذا تم تحديد سيارة معينة
      if (carId) {
        query = query.eq('car_id', carId);
      }
      
      const { data, error } = await query.order('date', { ascending: false });
      
      if (error) throw error;
      setServiceVisits(data || []);
      setFilteredVisits(data || []);
    } catch (error) {
      console.error('فشل في تحميل سجل الخدمات:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const filterVisits = () => {
    let filtered = [...serviceVisits];
    
    // البحث
    if (searchQuery.trim() !== '') {
      const lowercasedQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        visit =>
          visit.car?.make?.toLowerCase().includes(lowercasedQuery) ||
          visit.car?.model?.toLowerCase().includes(lowercasedQuery) ||
          visit.car?.plate_number?.toLowerCase().includes(lowercasedQuery) ||
          visit.car?.customer?.name?.toLowerCase().includes(lowercasedQuery) ||
          visit.car?.customer?.phone?.includes(lowercasedQuery) ||
          visit.service_category?.name?.toLowerCase().includes(lowercasedQuery) ||
          visit.notes?.toLowerCase().includes(lowercasedQuery)
      );
    }
    
    // فلترة حسب الفئة
    if (selectedCategoryId) {
      filtered = filtered.filter(
        visit => visit.service_category_id === selectedCategoryId
      );
    }
    
    setFilteredVisits(filtered);
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    loadServiceVisits();
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      onPress={() => router.push(`/shop/service-details/${item.id}`)}
    >
      <Card style={styles.visitCard}>
        <Card.Content>
          {!carId && (
            <>
              <Text style={styles.carInfo}>
                {item.car?.make} {item.car?.model} ({item.car?.year})
              </Text>
              <Text style={styles.plateNumber}>رقم اللوحة: {item.car?.plate_number}</Text>
              <Divider style={styles.divider} />
            </>
          )}
          
          <View style={styles.visitHeader}>
            <View>
              <Text style={styles.visitTitle}>{item.service_category?.name}</Text>
              <Text style={styles.visitDate}>{formatDate(item.date)}</Text>
            </View>
            <Text style={styles.visitPrice}>{item.price} ريال</Text>
          </View>
          
          {item.mileage && (
            <View style={styles.mileageContainer}>
              <Icon name="speedometer" size={16} color={COLORS.gray} />
              <Text style={styles.mileageText}>{item.mileage} كم</Text>
            </View>
          )}
          
          {item.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>ملاحظات:</Text>
              <Text style={styles.notesText}>{item.notes}</Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
  
  const EmptyList = () => (
    <View style={styles.emptyContainer}>
      <Icon name="wrench-outline" size={80} color={COLORS.gray} />
      <Text style={styles.emptyText}>لا توجد خدمات مسجلة</Text>
      {carId && (
        <Button
          mode="contained"
          icon="plus"
          onPress={() => router.push(`/shop/add-service-visit?carId=${carId}`)}
          style={styles.addButton}
        >
          إضافة خدمة جديدة
        </Button>
      )}
    </View>
  );
  
  const renderCategoriesFilter = () => (
    <View style={styles.filterContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersScrollContent}
      >
        <Chip
          mode={selectedCategoryId === null ? 'flat' : 'outlined'}
          selected={selectedCategoryId === null}
          onPress={() => setSelectedCategoryId(null)}
          style={styles.filterChip}
        >
          الكل
        </Chip>
        {categories.map((category) => (
          <Chip
            key={category.id}
            mode={selectedCategoryId === category.id ? 'flat' : 'outlined'}
            selected={selectedCategoryId === category.id}
            onPress={() => setSelectedCategoryId(category.id)}
            style={styles.filterChip}
          >
            {category.name}
          </Chip>
        ))}
      </ScrollView>
    </View>
  );
  
  const title = car ? `سجل خدمات ${car.make} ${car.model}` : "سجل الخدمات";
  
  if (loading && !refreshing) {
    return <Loading fullScreen message="جاري تحميل سجل الخدمات..." />;
  }
  
  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={title} />
      </Appbar.Header>
      
      <Searchbar
        placeholder="بحث في سجل الخدمات..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        iconColor={COLORS.primary}
      />
      
      {renderCategoriesFilter()}
      
      <FlatList
        data={filteredVisits}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={EmptyList}
      />
      
      {carId && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => router.push(`/shop/add-service-visit?carId=${carId}`)}
        >
          <Icon name="plus" size={24} color={COLORS.white} />
        </TouchableOpacity>
      )}
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
  filterContainer: {
    marginBottom: SPACING.sm,
  },
  filtersScrollContent: {
    paddingHorizontal: SPACING.md,
  },
  filterChip: {
    marginRight: SPACING.xs,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl * 2,
  },
  visitCard: {
    marginBottom: SPACING.md,
    elevation: 2,
  },
  carInfo: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  plateNumber: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: SPACING.xs,
  },
  divider: {
    marginVertical: SPACING.xs,
  },
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  visitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  visitDate: {
    fontSize: 12,
    color: COLORS.gray,
  },
  visitPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  mileageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  mileageText: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: SPACING.xs,
  },
  notesContainer: {
    marginTop: SPACING.sm,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  notesText: {
    fontSize: 12,
    color: COLORS.dark,
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
    marginBottom: SPACING.lg,
    color: COLORS.gray,
  },
  addButton: {
    marginTop: SPACING.md,
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.lg,
    right: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
}); 