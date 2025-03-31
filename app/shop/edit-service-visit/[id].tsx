// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ToastAndroid, TextInput as RNTextInput } from 'react-native';
import { Appbar, Text, TextInput, Button, HelperText, Menu } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SPACING } from '../../constants';
import { supabase } from '../../config';
import { useAuthStore } from '../../utils/store';
import Loading from '../../components/Loading';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function EditServiceVisitScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const serviceId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [service, setService] = useState<any>(null);
  const [car, setCar] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  
  // نموذج البيانات
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [mileage, setMileage] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState('');
  
  // قوائم الاختيار
  const [categories, setCategories] = useState<any[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  
  // الأخطاء
  const [errors, setErrors] = useState<{
    price?: string;
    mileage?: string;
    category?: string;
  }>({});
  
  useEffect(() => {
    loadServiceDetails();
    loadCategories();
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
            plate_number
          ),
          service_category:service_category_id (
            id,
            name
          ),
          shop:shop_id (
            id,
            name
          )
        `)
        .eq('id', serviceId)
        .single();
      
      if (error) throw error;
      
      setService(data);
      setCar(data.car);
      setShop(data.shop);
      
      // تعبئة النموذج بالبيانات الحالية
      setDate(new Date(data.date));
      setMileage(data.mileage ? data.mileage.toString() : '');
      setPrice(data.price.toString());
      setNotes(data.notes || '');
      setCategoryId(data.service_category_id);
      setCategoryName(data.service_category?.name || '');
      
    } catch (error) {
      console.error('فشل في تحميل تفاصيل الخدمة:', error);
      ToastAndroid.show('فشل في تحميل تفاصيل الخدمة', ToastAndroid.SHORT);
    } finally {
      setLoading(false);
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
  
  const validateForm = () => {
    const newErrors: {
      price?: string;
      mileage?: string;
      category?: string;
    } = {};
    
    if (!price.trim()) {
      newErrors.price = 'يجب إدخال سعر الخدمة';
    } else if (isNaN(Number(price)) || Number(price) <= 0) {
      newErrors.price = 'يجب إدخال سعر صحيح أكبر من صفر';
    }
    
    if (mileage.trim() && (isNaN(Number(mileage)) || Number(mileage) < 0)) {
      newErrors.mileage = 'يجب إدخال عداد كيلومترات صحيح';
    }
    
    if (!categoryId) {
      newErrors.category = 'يجب اختيار نوع الخدمة';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('service_visits')
        .update({
          date: date.toISOString().split('T')[0],
          mileage: mileage ? parseInt(mileage) : null,
          price: parseFloat(price),
          notes: notes.trim() || null,
          service_category_id: categoryId,
          updated_at: new Date().toISOString()
        })
        .eq('id', serviceId);
      
      if (error) throw error;
      
      ToastAndroid.show('تم تحديث الخدمة بنجاح', ToastAndroid.SHORT);
      router.back();
    } catch (error) {
      console.error('فشل في تحديث الخدمة:', error);
      ToastAndroid.show('فشل في تحديث الخدمة', ToastAndroid.SHORT);
      setSubmitting(false);
    }
  };
  
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };
  
  const showDatepicker = () => {
    setShowDatePicker(true);
  };
  
  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);
  
  const selectCategory = (category: any) => {
    setCategoryId(category.id);
    setCategoryName(category.name);
    closeMenu();
    // عند اختيار فئة، أزل رسالة الخطأ
    setErrors({...errors, category: undefined});
  };
  
  const getSelectedCategoryName = () => {
    return categoryName || 'اختر نوع الخدمة';
  };
  
  if (loading) {
    return <Loading fullScreen message="جاري تحميل بيانات الخدمة..." />;
  }
  
  if (!service || !car) {
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
        <Appbar.Content title="تعديل الخدمة" />
      </Appbar.Header>
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.carInfoContainer}>
          <Text style={styles.carInfoTitle}>
            {car.make} {car.model} ({car.year})
          </Text>
          <Text style={styles.carInfoPlate}>رقم اللوحة: {car.plate_number}</Text>
        </View>
        
        <View style={styles.formContainer}>
          <View style={styles.datePickerContainer}>
            <Text style={styles.inputLabel}>تاريخ الخدمة:</Text>
            <Button 
              mode="outlined" 
              icon="calendar" 
              onPress={showDatepicker}
              style={styles.dateButton}
            >
              {date.toLocaleDateString('ar-SA')}
            </Button>
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
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>نوع الخدمة:</Text>
            {/* @ts-ignore */}
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
                  {categoryName || 'اختر نوع الخدمة'}
                </Button>
              }
            >
              {categories.map((category) => (
                // @ts-ignore
                <Menu.Item
                  key={category.id}
                  title={category.name}
                  onPress={() => selectCategory(category)}
                />
              ))}
            </Menu>
            {errors.category && (
              // @ts-ignore
              <HelperText type="error" visible={!!errors.category}>
                {errors.category}
              </HelperText>
            )}
          </View>
          
          {/* @ts-ignore */}
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
            // @ts-ignore
            <HelperText type="error" visible={!!errors.price}>
              {errors.price}
            </HelperText>
          )}
          
          {/* @ts-ignore */}
          <TextInput
            label="قراءة العداد (كم)"
            value={mileage}
            onChangeText={setMileage}
            keyboardType="numeric"
            style={styles.input}
            error={!!errors.mileage}
            right={<TextInput.Affix text="كم" />}
          />
          {errors.mileage && (
            // @ts-ignore
            <HelperText type="error" visible={!!errors.mileage}>
              {errors.mileage}
            </HelperText>
          )}
          
          {/* @ts-ignore */}
          <TextInput
            label="ملاحظات"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            style={styles.textArea}
          />
          
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting}
            style={styles.submitButton}
          >
            تحديث الخدمة
          </Button>
        </View>
      </ScrollView>
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
  carInfoContainer: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.light,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  carInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  carInfoPlate: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  formContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    elevation: 2,
  },
  datePickerContainer: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  dateButton: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  dropdownButton: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
  },
  input: {
    marginBottom: SPACING.xs,
    backgroundColor: COLORS.white,
  },
  textArea: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.white,
  },
  submitButton: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.xs,
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