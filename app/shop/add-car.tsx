import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, TextInput, HelperText, Button, Appbar, Divider } from 'react-native-paper';
import { COLORS, SPACING } from '../constants';
import { supabase } from '../config';
import { useAuthStore } from '../utils/store';
import Loading from '../components/Loading';
import { useRouter } from 'expo-router';
import Input from '../components/Input';
import { Car } from '../types';

export default function AddCarScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shop, setShop] = useState<any>(null);

  useEffect(() => {
    loadShopData();
  }, []);

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
    
    if (!make.trim()) {
      newErrors.make = 'الرجاء إدخال اسم الشركة المصنعة';
    }
    
    if (!model.trim()) {
      newErrors.model = 'الرجاء إدخال طراز السيارة';
    }
    
    if (!year.trim()) {
      newErrors.year = 'الرجاء إدخال سنة الصنع';
    } else if (isNaN(Number(year)) || Number(year) < 1900 || Number(year) > new Date().getFullYear() + 1) {
      newErrors.year = 'الرجاء إدخال سنة صنع صحيحة';
    }
    
    if (!plateNumber.trim()) {
      newErrors.plateNumber = 'الرجاء إدخال رقم اللوحة';
    }
    
    if (!customerPhone.trim()) {
      newErrors.customerPhone = 'الرجاء إدخال رقم هاتف العميل';
    }
    
    if (!customerName.trim()) {
      newErrors.customerName = 'الرجاء إدخال اسم العميل';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!shop) {
      Alert.alert('خطأ', 'يجب أن يكون لديك محل مسجل لإضافة سيارة');
      return;
    }
    
    setLoading(true);
    
    try {
      // البحث عن العميل أو إنشاء عميل جديد
      let customerId;
      const { data: existingCustomer, error: customerError } = await supabase
        .from('users')
        .select('id')
        .eq('phone', customerPhone)
        .eq('role', 'customer')
        .maybeSingle();
      
      if (customerError) throw customerError;
      
      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        // إنشاء عميل جديد
        const { data: newCustomer, error: newCustomerError } = await supabase
          .from('users')
          .insert({
            name: customerName,
            phone: customerPhone,
            role: 'customer',
            email: `${customerPhone}@placeholder.com`, // مؤقت، يمكن تغييره لاحقاً
          })
          .select()
          .single();
        
        if (newCustomerError) throw newCustomerError;
        customerId = newCustomer.id;
      }
      
      // إنشاء QR ID فريد للسيارة
      const qrId = `CAR_${Date.now()}`;
      
      // إضافة السيارة إلى قاعدة البيانات
      const { data, error } = await supabase
        .from('cars')
        .insert({
          make,
          model,
          year: Number(year),
          plate_number: plateNumber,
          customer_id: customerId,
          shop_id: shop.id,
          qr_id: qrId,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      Alert.alert(
        'تم بنجاح',
        'تمت إضافة السيارة بنجاح',
        [
          {
            text: 'عرض التفاصيل',
            onPress: () => router.push(`/shop/car-details/${data.id}`),
          },
          {
            text: 'موافق',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('فشل في إضافة السيارة:', error);
      Alert.alert('خطأ', error.message || 'حدث خطأ أثناء إضافة السيارة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="إضافة سيارة جديدة" />
      </Appbar.Header>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionTitle}>معلومات السيارة</Text>
          
          <Input
            label="الشركة المصنعة"
            value={make}
            onChangeText={(text) => {
              setMake(text);
              if (errors.make) {
                setErrors({ ...errors, make: '' });
              }
            }}
            error={errors.make}
            icon="car-side"
          />
          
          <Input
            label="الطراز"
            value={model}
            onChangeText={(text) => {
              setModel(text);
              if (errors.model) {
                setErrors({ ...errors, model: '' });
              }
            }}
            error={errors.model}
            icon="car-info"
          />
          
          <Input
            label="سنة الصنع"
            value={year}
            onChangeText={(text) => {
              setYear(text);
              if (errors.year) {
                setErrors({ ...errors, year: '' });
              }
            }}
            error={errors.year}
            keyboardType="numeric"
            maxLength={4}
            icon="calendar"
          />
          
          <Input
            label="رقم اللوحة"
            value={plateNumber}
            onChangeText={(text) => {
              setPlateNumber(text);
              if (errors.plateNumber) {
                setErrors({ ...errors, plateNumber: '' });
              }
            }}
            error={errors.plateNumber}
            icon="card-text"
          />
          
          <Divider style={styles.divider} />
          
          <Text style={styles.sectionTitle}>معلومات العميل</Text>
          
          <Input
            label="اسم العميل"
            value={customerName}
            onChangeText={(text) => {
              setCustomerName(text);
              if (errors.customerName) {
                setErrors({ ...errors, customerName: '' });
              }
            }}
            error={errors.customerName}
            icon="account"
          />
          
          <Input
            label="رقم الهاتف"
            value={customerPhone}
            onChangeText={(text) => {
              setCustomerPhone(text);
              if (errors.customerPhone) {
                setErrors({ ...errors, customerPhone: '' });
              }
            }}
            error={errors.customerPhone}
            keyboardType="phone-pad"
            icon="phone"
          />
          
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.submitButton}
          >
            إضافة السيارة
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {loading && <Loading fullScreen message="جاري إضافة السيارة..." />}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: SPACING.md,
    color: COLORS.primary,
  },
  divider: {
    marginVertical: SPACING.md,
  },
  submitButton: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
}); 