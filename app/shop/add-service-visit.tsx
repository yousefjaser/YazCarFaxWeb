// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, Appbar, TextInput, Button, Divider, Menu, HelperText } from 'react-native-paper';
import { COLORS, SPACING } from '../constants';
import { supabase } from '../config';
import { useAuthStore } from '../utils/store';
import Loading from '../components/Loading';
import Input from '../components/Input';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { TouchableOpacity } from 'react-native-gesture-handler';

export default function AddServiceVisitScreen() {
  const router = useRouter();
  const { carId } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [car, setCar] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  
  // بيانات الخدمة
  const [date, setDate] = useState<Date>(new Date());
  const [mileage, setMileage] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // قائمة فئات الخدمات
  const [categories, setCategories] = useState<any[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  
  // حالة الأخطاء
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    if (carId) {
      loadCarData();
      loadServiceCategories();
      loadShopData();
    }
  }, [carId]);
  
  // تحميل بيانات السيارة
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
      Alert.alert('خطأ', 'فشل في تحميل بيانات السيارة');
      router.back();
    } finally {
      setInitialLoading(false);
    }
  };
  
  // تحميل فئات الخدمات
  const loadServiceCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
      
      // تعيين الفئة الافتراضية
      if (data && data.length > 0) {
        setSelectedCategoryId(data[0].id);
      }
    } catch (error) {
      console.error('فشل في تحميل فئات الخدمة:', error);
    }
  };
  
  // تحميل بيانات المحل
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
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!selectedCategoryId) {
      newErrors.category = 'الرجاء اختيار نوع الخدمة';
    }
    
    if (!price.trim()) {
      newErrors.price = 'الرجاء إدخال سعر الخدمة';
    } else if (isNaN(Number(price)) || Number(price) <= 0) {
      newErrors.price = 'الرجاء إدخال سعر صحيح';
    }
    
    if (mileage.trim() && (isNaN(Number(mileage)) || Number(mileage) < 0)) {
      newErrors.mileage = 'الرجاء إدخال قراءة عداد صحيحة';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (!validateForm() || !car || !shop) return;
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('service_visits')
        .insert({
          car_id: carId,
          shop_id: shop.id,
          service_category_id: selectedCategoryId,
          date: date.toISOString(),
          mileage: mileage ? Number(mileage) : null,
          notes: notes.trim() || null,
          price: Number(price),
        })
        .select()
        .single();
      
      if (error) throw error;
      
      Alert.alert(
        'تم بنجاح',
        'تمت إضافة الخدمة بنجاح',
        [
          {
            text: 'موافق',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('فشل في إضافة الخدمة:', error);
      Alert.alert('خطأ', error.message || 'حدث خطأ أثناء إضافة الخدمة');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const getSelectedCategoryName = () => {
    const category = categories.find(cat => cat.id === selectedCategoryId);
    return category ? category.name : 'اختر نوع الخدمة';
  };
  
  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);
  const selectCategory = (category: any) => {
    setSelectedCategoryId(category.id);
    setMenuVisible(false);
    if (errors.category) {
      setErrors({ ...errors, category: '' });
    }
  };
  
  if (initialLoading) {
    return <Loading fullScreen message="جاري تحميل البيانات..." />;
  }
  
  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="إضافة خدمة جديدة" />
      </Appbar.Header>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {car && (
            <View style={styles.carInfoContainer}>
              <Text style={styles.carTitle}>{car.make} {car.model} - {car.year}</Text>
              <Text style={styles.carDetail}>رقم اللوحة: {car.plate_number}</Text>
              <Text style={styles.carDetail}>
                العميل: {car.customer?.name || 'غير معروف'} - {car.customer?.phone || 'غير متوفر'}
              </Text>
            </View>
          )}
          
          <Divider style={styles.divider} />
          
          <Text style={styles.sectionTitle}>تفاصيل الخدمة</Text>
          
          {/* اختيار نوع الخدمة */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>نوع الخدمة:</Text>
            <Menu
              visible={menuVisible}
              onDismiss={closeMenu}
              anchor={
                <Button 
                  mode="outlined" 
                  onPress={openMenu} 
                  icon="menu-down"
                  style={styles.dropdownButton}
                >
                  {getSelectedCategoryName()}
                </Button>
              }
            >
              {categories.map((category) => (
                <Menu.Item
                  key={category.id}
                  title={category.name}
                  onPress={() => selectCategory(category)}
                />
              ))}
            </Menu>
            {errors.category && (
              <HelperText type="error" visible={!!errors.category}>
                {errors.category}
              </HelperText>
            )}
          </View>
          
          {/* اختيار التاريخ */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>تاريخ الخدمة</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Icon name="calendar" size={20} color={COLORS.primary} style={styles.dateIcon} />
              <Text style={styles.dateText}>{formatDate(date)}</Text>
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>
          
          {/* قراءة العداد */}
          <Input
            label="قراءة العداد (اختياري)"
            value={mileage}
            onChangeText={(text) => {
              setMileage(text);
              if (errors.mileage) {
                setErrors({ ...errors, mileage: '' });
              }
            }}
            error={errors.mileage}
            keyboardType="numeric"
            icon="speedometer"
          />
          
          {/* السعر */}
          <TextInput
            label="السعر (ريال)"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            style={styles.input}
            error={!!errors.price}
            right={<TextInput.Affix text="ريال" />}
          />
          {errors.price && (
            <HelperText type="error" visible={!!errors.price}>
              {errors.price}
            </HelperText>
          )}
          
          {/* ملاحظات */}
          <View style={styles.notesContainer}>
            <Text style={styles.label}>ملاحظات (اختياري)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.notesInput}
            />
          </View>
          
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.submitButton}
          >
            إضافة الخدمة
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {loading && <Loading fullScreen message="جاري إضافة الخدمة..." />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoidContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  carInfoContainer: {
    backgroundColor: COLORS.primary + '15', // شفافية منخفضة
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  carTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  carDetail: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: SPACING.xs / 2,
  },
  divider: {
    marginVertical: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
    color: COLORS.primary,
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: SPACING.xs,
    color: COLORS.black,
    fontWeight: '500',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: SPACING.sm,
    backgroundColor: COLORS.white,
    height: 48,
  },
  label: {
    fontSize: 14,
    marginBottom: SPACING.xs,
    color: COLORS.black,
    fontWeight: '500',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: SPACING.sm,
    backgroundColor: COLORS.white,
    height: 48,
  },
  dateIcon: {
    marginRight: SPACING.sm,
  },
  dateText: {
    fontSize: 16,
  },
  notesContainer: {
    marginBottom: SPACING.md,
  },
  notesInput: {
    backgroundColor: COLORS.white,
  },
  submitButton: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  input: {
    backgroundColor: COLORS.white,
  },
}); 