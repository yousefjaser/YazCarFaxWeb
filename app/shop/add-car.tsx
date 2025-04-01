import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity, SafeAreaView, Animated, Image } from 'react-native';
import { Text, TextInput, HelperText, Button, Appbar, Divider, IconButton } from 'react-native-paper';
import { COLORS, SPACING } from '../constants';
import { supabase } from '../config';
import { useAuthStore } from '../utils/store';
import Loading from '../components/Loading';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Input from '../components/Input';
import { Car } from '../types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';

console.log("=====> تم تحميل ملف add-car.tsx");

// أعد إنشاء مكون StyledInput مع الأنماط اللازمة
interface StyledInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  icon: string;
  error?: string;
  isQR?: boolean;
  onQRScan?: () => void;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  maxLength?: number;
  onBlur?: () => void;
  style?: any;
}

const StyledInput: React.FC<StyledInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder = "",
  icon,
  error,
  isQR = false,
  onQRScan,
  keyboardType = "default",
  maxLength,
  onBlur,
  style
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.inputContainer, style]}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
          error ? styles.inputWrapperError : null,
        ]}
      >
        <Icon name={icon} size={20} color={COLORS.primary} style={styles.inputIcon} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            if (onBlur) onBlur();
          }}
          style={styles.textInput}
          keyboardType={keyboardType}
          maxLength={maxLength}
        />
        {isQR && (
          <TouchableOpacity style={styles.qrButton} onPress={onQRScan}>
            <Icon name="qrcode-scan" size={20} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

// مكون معاينة بيانات السيارة
const CarInfoPreview = ({ 
  carInfo, 
  maintenanceInfo,
  onEdit 
}: { 
  carInfo: any, 
  maintenanceInfo: any,
  onEdit: () => void 
}) => {
  return (
    <View style={styles.previewContainer}>
      <View style={styles.previewHeader}>
        <Text style={styles.previewTitle}>معاينة بيانات السيارة</Text>
        <TouchableOpacity onPress={onEdit} style={styles.editButton}>
          <Icon name="pencil" size={20} color={COLORS.primary} />
          <Text style={styles.editButtonText}>تعديل</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.previewContent}>
        {/* معلومات المركبة */}
        <View style={styles.previewSection}>
          <View style={styles.sectionIconContainer}>
            <Icon name="car" size={20} color="#fff" />
          </View>
          <Text style={styles.previewSectionTitle}>معلومات المركبة</Text>
          <View style={styles.previewItem}>
            <Text style={styles.previewLabel}>النوع</Text>
            <Text style={styles.previewValue}>{carInfo.make}</Text>
          </View>
          <View style={styles.previewItem}>
            <Text style={styles.previewLabel}>الفئة</Text>
            <Text style={styles.previewValue}>{carInfo.model}</Text>
          </View>
          <View style={styles.previewItem}>
            <Text style={styles.previewLabel}>تاريخ الصنع</Text>
            <Text style={styles.previewValue}>{carInfo.year}</Text>
          </View>
          <View style={styles.previewItem}>
            <Text style={styles.previewLabel}>اللون</Text>
            <Text style={styles.previewValue}>{carInfo.color || 'غير محدد'}</Text>
          </View>
          <View style={styles.previewItem}>
            <Text style={styles.previewLabel}>رقم اللوحة</Text>
            <Text style={styles.previewValue}>{carInfo.plateNumber}</Text>
          </View>
          {carInfo.chassisNumber && (
            <View style={styles.previewItem}>
              <Text style={styles.previewLabel}>رقم الشاصي</Text>
              <Text style={styles.previewValue}>{carInfo.chassisNumber}</Text>
            </View>
          )}
          <View style={styles.previewItem}>
            <Text style={styles.previewLabel}>معرف QR</Text>
            <Text style={styles.previewValue}>{carInfo.qrId}</Text>
          </View>
        </View>
        
        {/* معلومات العميل */}
        <View style={styles.previewSection}>
          <View style={[styles.sectionIconContainer, {backgroundColor: '#3498db'}]}>
            <Icon name="account" size={20} color="#fff" />
          </View>
          <Text style={styles.previewSectionTitle}>معلومات العميل</Text>
          <View style={styles.previewItem}>
            <Text style={styles.previewLabel}>الاسم</Text>
            <Text style={styles.previewValue}>{carInfo.customerName}</Text>
          </View>
          <View style={styles.previewItem}>
            <Text style={styles.previewLabel}>رقم الهاتف</Text>
            <Text style={styles.previewValue}>{carInfo.customerPhone}</Text>
          </View>
        </View>
        
        {/* معلومات الصيانة */}
        {maintenanceInfo.currentMileage && (
          <View style={styles.previewSection}>
            <View style={[styles.sectionIconContainer, {backgroundColor: '#2ecc71'}]}>
              <Icon name="wrench" size={20} color="#fff" />
            </View>
            <Text style={styles.previewSectionTitle}>آخر عملية صيانة - فحص</Text>
            <View style={styles.previewItem}>
              <Text style={styles.previewLabel}>تاريخ الحركة</Text>
              <Text style={styles.previewValue}>{maintenanceInfo.date}</Text>
            </View>
            {maintenanceInfo.serviceWorker && (
              <View style={styles.previewItem}>
                <Text style={styles.previewLabel}>العامل</Text>
                <Text style={styles.previewValue}>{maintenanceInfo.serviceWorker}</Text>
              </View>
            )}
            <View style={styles.previewItem}>
              <Text style={styles.previewLabel}>العداد الحالي</Text>
              <Text style={styles.previewValue}>{maintenanceInfo.currentMileage}</Text>
            </View>
            {maintenanceInfo.notes && (
              <View style={styles.previewItem}>
                <Text style={styles.previewLabel}>ملاحظات</Text>
                <Text style={styles.previewValue}>{maintenanceInfo.notes}</Text>
              </View>
            )}
          </View>
        )}
        
        {/* تفاصيل الصيانة - الزيت */}
        {maintenanceInfo.oilType && (
          <>
            <View style={styles.previewSection}>
              <View style={[styles.sectionIconContainer, {backgroundColor: '#e74c3c'}]}>
                <Icon name="oil" size={20} color="#fff" />
              </View>
              <Text style={styles.previewSectionTitle}>تفاصيل الصيانة</Text>
              
              <View style={styles.maintenanceTypeContainer}>
                <Text style={styles.maintenanceTypeTitle}>غيار زيت ماتور</Text>
                <View style={styles.previewItem}>
                  <Text style={styles.previewLabel}>نوع المادة</Text>
                  <Text style={styles.previewValue}>{maintenanceInfo.oilType}</Text>
                </View>
                <View style={styles.previewItem}>
                  <Text style={styles.previewLabel}>صنف المادة</Text>
                  <Text style={styles.previewValue}>{maintenanceInfo.oilGrade}</Text>
                </View>
                <View style={styles.previewItem}>
                  <Text style={styles.previewLabel}>العداد القادم</Text>
                  <Text style={styles.previewValue}>{maintenanceInfo.nextServiceMileage}</Text>
                </View>
              </View>
              
              {maintenanceInfo.oilFilterChanged && (
                <View style={styles.maintenanceTypeContainer}>
                  <Text style={styles.maintenanceTypeTitle}>فلتر زيت</Text>
                  <View style={styles.previewItem}>
                    <Text style={styles.previewLabel}>العداد القادم</Text>
                    <Text style={styles.previewValue}>{maintenanceInfo.nextServiceMileage}</Text>
                  </View>
                </View>
              )}
              
              {maintenanceInfo.airFilterChanged && (
                <View style={styles.maintenanceTypeContainer}>
                  <Text style={styles.maintenanceTypeTitle}>فلتر هواء</Text>
                  <View style={styles.previewItem}>
                    <Text style={styles.previewLabel}>تم التغيير</Text>
                    <Text style={styles.previewValue}>نعم</Text>
                  </View>
                </View>
              )}
              
              {maintenanceInfo.cabinFilterChanged && (
                <View style={styles.maintenanceTypeContainer}>
                  <Text style={styles.maintenanceTypeTitle}>فلتر مكيف</Text>
                  <View style={styles.previewItem}>
                    <Text style={styles.previewLabel}>تم التغيير</Text>
                    <Text style={styles.previewValue}>نعم</Text>
                  </View>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

// تعريف الأنواع كاتحاد في مكان واحد للاستخدام في جميع أنحاء الملف
type SectionType = 'carInfo' | 'oilInfo' | 'additionalInfo';

export default function AddCarScreen() {
  console.log("=====> بدء تنفيذ AddCarScreen");
  
  const router = useRouter();
  const params = useLocalSearchParams();
  const qrFromScan = params?.qr_id as string;
  
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [qrId, setQrId] = useState(qrFromScan || '');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  
  // بيانات الزيت والصيانة
  const [oilType, setOilType] = useState('');
  const [oilGrade, setOilGrade] = useState('');
  const [currentMileage, setCurrentMileage] = useState('');
  const [nextServiceMileage, setNextServiceMileage] = useState('');
  const [oilFilterChanged, setOilFilterChanged] = useState(false);
  const [airFilterChanged, setAirFilterChanged] = useState(false);
  const [cabinFilterChanged, setCabinFilterChanged] = useState(false);
  const [maintenanceNotes, setMaintenanceNotes] = useState('');
  const [maintenanceDate, setMaintenanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [serviceWorker, setServiceWorker] = useState('');
  const [carColor, setCarColor] = useState('');
  const [chassisNumber, setChassisNumber] = useState('');
  
  // بيانات العرض
  const [activeSection, setActiveSection] = useState<SectionType>('carInfo');
  const [isFormComplete, setIsFormComplete] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shop, setShop] = useState<any>(null);
  const [checkingQR, setCheckingQR] = useState(false);

  // تعريف متغير التنقل للجوال
  const navigation = Platform.OS === 'web' ? null : require('@react-navigation/native').useNavigation();
  
  const animatedButtonScale = useRef(new Animated.Value(1)).current;
  const animatedProgressOpacity = useRef(new Animated.Value(1)).current;
  
  // إضافة دالة مساعدة لمقارنة نوع القسم
  const isSectionActive = (current: SectionType, target: SectionType): boolean => {
    return current === target;
  };
  
  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(animatedButtonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(animatedButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start();
  };
  
  const animateProgress = (newSection: SectionType) => {
    Animated.sequence([
      Animated.timing(animatedProgressOpacity, {
        toValue: 0.5,
        duration: 150,
        useNativeDriver: true
      }),
      Animated.timing(animatedProgressOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true
      })
    ]).start(() => {
      setActiveSection(newSection);
    });
  };
  
  const handleSectionChange = (section: SectionType) => {
    animateButtonPress();
    animateProgress(section);
  };

  // دالة للعودة إلى الصفحة السابقة
  const goBack = () => {
    console.log("العودة إلى الصفحة السابقة");
    if (Platform.OS === 'web') {
      router.back();
    } else {
      navigation.goBack();
    }
  };

  useEffect(() => {
    console.log("=====> تنفيذ useEffect في AddCarScreen");
    try {
    loadShopData();
      
      // التحقق من رمز QR المستلم عند تحميل الصفحة
      if (qrFromScan) {
        checkQrIdExists(qrFromScan);
      }
    } catch (error) {
      console.error("=====> خطأ في useEffect:", error);
      alert("حدث خطأ أثناء تحميل الصفحة: " + (error instanceof Error ? error.message : String(error)));
    }
  }, [qrFromScan]);

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

  const checkQrIdExists = async (id: string) => {
    if (!id) return false;
    
    try {
      setCheckingQR(true);
      const { data, error } = await supabase
        .from('cars')
        .select('qr_id, make, model, plate_number')
        .eq('qr_id', id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        Alert.alert(
          'QR موجود مسبقاً',
          `هذا الرمز مستخدم بالفعل للسيارة: ${data.make} ${data.model} (${data.plate_number})`,
          [
            {
              text: 'عرض تفاصيل السيارة',
              onPress: () => router.push(`/shop/car-details/${data.qr_id}`),
            },
            {
              text: 'استخدام رمز آخر',
              style: 'cancel',
            }
          ]
        );
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('فشل في التحقق من وجود QR:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء التحقق من وجود QR');
      return false;
    } finally {
      setCheckingQR(false);
    }
  };

  const verifyQrId = () => {
    if (qrId) {
      checkQrIdExists(qrId);
    }
  };

  const openQrScanner = () => {
    router.push({
      pathname: '/shop/scan',
      params: {
        for_add_car: 'true'
      }
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // التحقق من معلومات السيارة الأساسية
    if (!qrId.trim()) {
      newErrors.qrId = 'الرجاء إدخال أو مسح رمز QR للسيارة';
    }
    
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
    
    // التحقق من معلومات العميل
    if (!customerPhone.trim()) {
      newErrors.customerPhone = 'الرجاء إدخال رقم هاتف العميل';
    }
    
    if (!customerName.trim()) {
      newErrors.customerName = 'الرجاء إدخال اسم العميل';
    }
    
    // التحقق من معلومات الصيانة
    if (activeSection === 'oilInfo' || previewMode) {
      if (!currentMileage.trim()) {
        newErrors.currentMileage = 'الرجاء إدخال عداد المسافة الحالي';
      } else if (isNaN(Number(currentMileage))) {
        newErrors.currentMileage = 'الرجاء إدخال قيمة رقمية صحيحة';
      }
      
      if (!oilType.trim()) {
        newErrors.oilType = 'الرجاء إدخال نوع الزيت';
      }
      
      if (!oilGrade.trim()) {
        newErrors.oilGrade = 'الرجاء إدخال تصنيف الزيت';
      }
      
      if (!nextServiceMileage.trim()) {
        newErrors.nextServiceMileage = 'الرجاء إدخال عداد الخدمة القادمة';
      } else if (isNaN(Number(nextServiceMileage)) || Number(nextServiceMileage) <= Number(currentMileage)) {
        newErrors.nextServiceMileage = 'يجب أن يكون عداد الخدمة القادمة أكبر من العداد الحالي';
      }
    }
    
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    setIsFormComplete(isValid);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!shop) {
      Alert.alert('خطأ', 'يجب أن يكون لديك محل مسجل لإضافة سيارة');
      return;
    }
    
    try {
      // التحقق من وجود QR مسبقاً قبل الإضافة
      const qrExists = await checkQrIdExists(qrId);
      if (qrExists) return;
      
      setLoading(true);
      
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
        const { data: newCustomer, error: newCustomerError } = await supabase
          .from('users')
          .insert({
            name: customerName,
            phone: customerPhone,
            role: 'customer',
            email: `${customerPhone}@placeholder.com`,
          })
          .select()
          .single();
        
        if (newCustomerError) throw newCustomerError;
        customerId = newCustomer.id;
      }
      
      // إضافة السيارة مع المعلومات الجديدة
      const { data: carData, error: carError } = await supabase
        .from('cars_new') // استخدام الجدول الجديد cars_new
        .insert({
          make,
          model,
          year: Number(year),
          plate_number: plateNumber,
          customer_id: customerId,
          shop_id: shop.id,
          qr_id: qrId,
          color: carColor,
          chassis_number: chassisNumber,
          current_mileage: currentMileage ? Number(currentMileage) : null,
          last_service_date: maintenanceDate,
          last_service_shop_id: shop.id,
        })
        .select()
        .single();
      
      if (carError) throw carError;
      
      // إضافة معلومات الصيانة في جدول منفصل
      if (activeSection === 'oilInfo' || previewMode) {
        const { error: serviceError } = await supabase
          .from('service_visits')
          .insert({
            car_id: carData.qr_id, // استخدام qr_id كمعرف للسيارة
            service_date: maintenanceDate,
            mileage: Number(currentMileage),
            next_service_mileage: Number(nextServiceMileage),
            oil_type: oilType,
            oil_grade: oilGrade,
            oil_filter_changed: oilFilterChanged,
            air_filter_changed: airFilterChanged,
            cabin_filter_changed: cabinFilterChanged,
            notes: maintenanceNotes,
            shop_id: shop.id,
            service_worker: serviceWorker,
          });
        
        if (serviceError) throw serviceError;
      }
      
      Alert.alert(
        'تم بنجاح',
        'تمت إضافة السيارة والبيانات بنجاح',
        [
          {
            text: 'عرض التفاصيل',
            onPress: () => router.push(`/shop/car-details/${carData.qr_id}`),
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

  if (loading) {
    return <Loading fullScreen message="جاري تحميل البيانات..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Icon name="arrow-left" size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إضافة سيارة جديدة</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        {loading || checkingQR ? (
          <Loading />
        ) : previewMode ? (
          <CarInfoPreview
            carInfo={{
              make,
              model,
              year,
              color: carColor,
              plateNumber,
              chassisNumber,
              qrId,
              customerName,
              customerPhone,
            }}
            maintenanceInfo={{
              currentMileage,
              nextServiceMileage,
              oilType,
              oilGrade,
              date: maintenanceDate,
              serviceWorker,
              notes: maintenanceNotes,
              oilFilterChanged,
              airFilterChanged,
              cabinFilterChanged,
            }}
            onEdit={() => setPreviewMode(false)}
          />
        ) : (
        <ScrollView
            style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {activeSection === 'carInfo' && (
              <>
                <View style={styles.carImageContainer}>
                  <Image
                    source={require('../../assets/car-placeholder.jpg')}
                    style={styles.carImage}
                  />
                </View>
                
                <View style={styles.progressContainer}>
                  <View style={styles.progressStep}>
                    <Text style={[
                      styles.progressNumber,
                      isSectionActive(activeSection, 'carInfo') && styles.activeProgressNumber
                    ]}>1</Text>
                    <View style={[
                      styles.progressCircle, 
                      isSectionActive(activeSection, 'carInfo') && styles.activeCircle
                    ]}>
                      <Icon 
                        name="car" 
                        size={20} 
                        color={isSectionActive(activeSection, 'carInfo') ? "#FFF" : COLORS.primary} 
                      />
                    </View>
                    <Text style={[
                      styles.progressLabel, 
                      isSectionActive(activeSection, 'carInfo') && styles.activeLabel
                    ]}>معلومات السيارة</Text>
                  </View>
                  
                  <View style={styles.progressLine} />
                  
                  <View style={styles.progressStep}>
                    <Text style={[
                      styles.progressNumber,
                      isSectionActive(activeSection, 'oilInfo') && styles.activeProgressNumber
                    ]}>2</Text>
                    <View style={[
                      styles.progressCircle, 
                      isSectionActive(activeSection, 'oilInfo') && styles.activeCircle
                    ]}>
                      <Icon 
                        name="oil" 
                        size={20} 
                        color={isSectionActive(activeSection, 'oilInfo') ? "#FFF" : COLORS.primary} 
                      />
                    </View>
                    <Text style={[
                      styles.progressLabel, 
                      isSectionActive(activeSection, 'oilInfo') && styles.activeLabel
                    ]}>الزيت والصيانة</Text>
                  </View>
                  
                  <View style={styles.progressLine} />
                  
                  <View style={styles.progressStep}>
                    <Text style={[
                      styles.progressNumber,
                      isSectionActive(activeSection, 'additionalInfo') && styles.activeProgressNumber
                    ]}>3</Text>
                    <View style={[
                      styles.progressCircle, 
                      isSectionActive(activeSection, 'additionalInfo') && styles.activeCircle
                    ]}>
                      <Icon 
                        name="file-document-outline" 
                        size={20} 
                        color={isSectionActive(activeSection, 'additionalInfo') ? "#FFF" : COLORS.primary} 
                      />
                    </View>
                    <Text style={[
                      styles.progressLabel, 
                      isSectionActive(activeSection, 'additionalInfo') && styles.activeLabel
                    ]}>معلومات إضافية</Text>
                  </View>
                </View>

                <View style={styles.formSection}>
                  <StyledInput
                    label="رمز QR للسيارة"
                    value={qrId}
                    onChangeText={(text) => {
                      setQrId(text);
                      if (errors.qrId) {
                        setErrors({ ...errors, qrId: '' });
                      }
                    }}
                    onBlur={verifyQrId}
                    placeholder="أدخل رمز QR"
                    icon="qrcode"
                    isQR={true}
                    onQRScan={openQrScanner}
                    error={errors.qrId}
                  />
                  
                  <StyledInput
            label="الشركة المصنعة"
            value={make}
            onChangeText={(text) => {
              setMake(text);
              if (errors.make) {
                setErrors({ ...errors, make: '' });
              }
            }}
                    placeholder="أدخل الشركة المصنعة"
                    icon="car-side"
            error={errors.make}
          />
          
                  <StyledInput
            label="الطراز"
            value={model}
            onChangeText={(text) => {
              setModel(text);
              if (errors.model) {
                setErrors({ ...errors, model: '' });
              }
            }}
                    placeholder="أدخل طراز السيارة"
                    icon="car-info"
            error={errors.model}
          />
          
                  <StyledInput
            label="سنة الصنع"
            value={year}
            onChangeText={(text) => {
              setYear(text);
              if (errors.year) {
                setErrors({ ...errors, year: '' });
              }
            }}
                    placeholder="أدخل سنة الصنع"
                    icon="calendar"
            keyboardType="numeric"
            maxLength={4}
                    error={errors.year}
          />
          
                  <StyledInput
            label="رقم اللوحة"
            value={plateNumber}
            onChangeText={(text) => {
              setPlateNumber(text);
              if (errors.plateNumber) {
                setErrors({ ...errors, plateNumber: '' });
              }
            }}
                    placeholder="أدخل رقم اللوحة"
                    icon="card-text"
            error={errors.plateNumber}
          />
                </View>
          
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitleMain}>معلومات العميل</Text>
          
                  <StyledInput
            label="اسم العميل"
            value={customerName}
            onChangeText={(text) => {
              setCustomerName(text);
              if (errors.customerName) {
                setErrors({ ...errors, customerName: '' });
              }
            }}
                    placeholder="أدخل اسم العميل"
                    icon="account"
            error={errors.customerName}
          />
          
                  <StyledInput
            label="رقم الهاتف"
            value={customerPhone}
            onChangeText={(text) => {
              setCustomerPhone(text);
              if (errors.customerPhone) {
                setErrors({ ...errors, customerPhone: '' });
              }
            }}
                    placeholder="أدخل رقم الهاتف"
                    icon="phone"
                    keyboardType="phone-pad"
            error={errors.customerPhone}
                  />
                </View>
                
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => handleSectionChange('oilInfo')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addButtonText}>التالي</Text>
                </TouchableOpacity>
              </>
            )}
            
            {/* باقي أقسام النموذج */}
            {activeSection === 'oilInfo' && (
              // ... محتوى قسم معلومات الزيت
              <View style={styles.formSection}>
                {/* قسم معلومات الزيت والصيانة */}
              </View>
            )}
            
            {activeSection === 'additionalInfo' && (
              // ... محتوى قسم المعلومات الإضافية  
              <View style={styles.formSection}>
                {/* قسم المعلومات الإضافية */}
              </View>
            )}
        </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  keyboardAvoidContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  carImageContainer: {
    width: '100%',
    height: 200,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  carImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  progressStep: {
    alignItems: 'center',
    width: 80,
  },
  progressNumber: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  activeProgressNumber: {
    color: COLORS.primary,
  },
  progressCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  activeCircle: {
    backgroundColor: COLORS.primary,
  },
  progressLabel: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
  },
  activeLabel: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#ddd',
    marginHorizontal: 8,
  },
  formSection: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitleMain: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    marginHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // الأنماط المفقودة
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 6,
    textAlign: 'right',
  },
  inputWrapper: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 0,
    height: 56,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  inputWrapperFocused: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFFFFF',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2.65,
    elevation: 2,
  },
  inputWrapperError: {
    borderColor: '#FF5252',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    height: '100%',
    textAlignVertical: 'center',
  },
  inputIcon: {
    marginLeft: 10,
  },
  qrButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  errorText: {
    color: '#FF5252',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'right',
  },
  // أنماط مكون CarInfoPreview
  previewContainer: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 12,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'right',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    color: COLORS.primary,
    marginRight: 5,
    fontSize: 14,
    fontWeight: '600',
  },
  previewContent: {
    flex: 1,
  },
  previewSection: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 16,
    paddingTop: 30,
  },
  sectionIconContainer: {
    position: 'absolute',
    top: -15,
    right: 15,
    backgroundColor: COLORS.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 12,
    textAlign: 'right',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  previewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 4,
  },
  previewLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  previewValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    textAlign: 'right',
  },
  maintenanceTypeContainer: {
    marginTop: 12,
    borderRightWidth: 2,
    borderRightColor: COLORS.primary,
    paddingRight: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 8,
  },
  maintenanceTypeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 6,
    textAlign: 'right',
  },
}); 