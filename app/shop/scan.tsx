// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, SafeAreaView, Dimensions, TextInput, ActivityIndicator, Keyboard, PanResponder, Platform } from 'react-native';
import { CameraView, BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import { Link, useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Button, Surface } from 'react-native-paper';
import { COLORS } from '../constants';
import { supabase } from '../config';
import Loading from '../components/Loading';
import * as Sentry from 'sentry-expo';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

// مكون الكاميرا المخصص للويب
const WebCamera = ({ onBarCodeScanned, style, onError }) => {
  const videoRef = useRef(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    let stream = null;
    
    const startCamera = async () => {
      try {
        // التحقق من وجود واجهة الكاميرا في المتصفح
        if (!navigator || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          const errorMsg = 'متصفحك لا يدعم استخدام الكاميرا. يرجى استخدام البحث اليدوي أو تجربة متصفح آخر.';
          setError(errorMsg);
          onError && onError(errorMsg);
          return;
        }
        
        // محاولة الحصول على الكاميرا
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setIsVideoReady(true);
        }
      } catch (err) {
        console.error('خطأ في تشغيل الكاميرا على الويب:', err);
        
        // رسائل خطأ أكثر تحديدًا حسب نوع الخطأ
        let errorMsg = '';
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMsg = 'تم رفض إذن الكاميرا. يرجى السماح بالوصول من إعدادات المتصفح.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          errorMsg = 'لم يتم العثور على كاميرا متصلة بجهازك.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          errorMsg = 'الكاميرا مستخدمة حاليًا من قبل تطبيق آخر.';
        } else if (err.name === 'OverconstrainedError') {
          errorMsg = 'لا يمكن العثور على كاميرا تلبي المتطلبات المطلوبة.';
        } else {
          errorMsg = err.message || 'فشل في تشغيل الكاميرا لسبب غير معروف.';
        }
        
        setError(errorMsg);
        onError && onError(errorMsg);
      }
    };
    
    startCamera();
    
    // تنظيف الكاميرا عند مغادرة الصفحة
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onError]);
  
  return (
    <View style={[styles.webCameraContainer, style]}>
      {error ? (
        <View style={styles.webCameraError}>
          <Icon name="camera-off" size={40} color={COLORS.error} />
          <Text style={styles.webCameraErrorText}>
            {error}
          </Text>
        </View>
      ) : (
        <>
          <video
            ref={videoRef}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            playsInline
            autoPlay
            muted
          />
          {!isVideoReady && (
            <View style={styles.webCameraLoading}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.webCameraLoadingText}>
                جاري تشغيل الكاميرا...
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};

export default function ScanScreen() {
  console.log("تم تحميل صفحة المسح الكاملة");
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanMode, setScanMode] = useState(true); // بدء الصفحة بوضع الكاميرا مباشرة
  const [carId, setCarId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showManualSearch, setShowManualSearch] = useState(false);
  const [lastScannedData, setLastScannedData] = useState(null); // تخزين آخر رمز تم مسحه
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [bottomSheetHeight, setBottomSheetHeight] = useState(220); // ارتفاع البوتوم شيت الافتراضي
  const [webCameraActive, setWebCameraActive] = useState(false); // حالة الكاميرا على الويب
  const router = useRouter();
  const navigation = useNavigation();
  const [cameraError, setCameraError] = useState(null);
  
  // إعداد مستمع للكيبورد
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardVisible(true);
        // زيادة ارتفاع البوتوم شيت ليناسب الكيبورد
        setBottomSheetHeight(e.endCoordinates.height + 220);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setBottomSheetHeight(220);
      }
    );
    
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  
  // إعداد pan responder للتعامل مع السحب
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gestureState) => {
        // إذا سحب للأسفل أكثر من 50 نقطة، أغلق البوتوم شيت
        if (gestureState.dy > 50) {
          console.log('تم سحب البوتوم شيت لأسفل، إغلاق...');
          Keyboard.dismiss();
          setShowManualSearch(false);
        }
      },
      onPanResponderRelease: (event, gestureState) => {
        // إذا كان السحب بشكل كبير، أغلق البوتوم شيت
        if (gestureState.dy > 100) {
          console.log('تم تحرير السحب، إغلاق البوتوم شيت...');
          Keyboard.dismiss();
          setShowManualSearch(false);
        }
      },
    })
  ).current;
  
  // تشغيل كاميرا الويب
  const startWebCamera = async () => {
    try {
      if (Platform.OS === 'web') {
        setWebCameraActive(true);
      }
    } catch (error) {
      console.error('فشل في تشغيل كاميرا الويب:', error);
      Alert.alert('خطأ', 'لم نتمكن من تشغيل الكاميرا. يرجى استخدام البحث اليدوي.');
    }
  };
  
  // العودة إلى لوحة التحكم
  const goBack = () => {
    console.log("العودة إلى لوحة التحكم");
    if (Platform.OS === 'web') {
      router.push('/shop/shop-dashboard');
    } else {
      navigation.navigate('shop-dashboard');
    }
  };
  
  // طلب إذن الكاميرا على الأجهزة المحمولة فقط
  useEffect(() => {
    if (Platform.OS !== 'web') {
      requestPermission();
    }
  }, []);
  
  // تبديل وضع المسح
  const toggleScanMode = async () => {
    // التحقق من الإذن بطريقة متوافقة مع الويب
    const permissionGranted = Platform.OS === 'web' 
      ? await startWebCamera()
      : permission?.granted;
      
    if (!permissionGranted) {
      startWebCamera();
      return;
    }
    
    setScanMode(!scanMode);
    setScanned(false);
  };
  
  // معالجة الباركود الممسوح
  const handleBarCodeScanned = (scanningResult) => {
    if (scanned) return;
    
    // التحقق مما إذا كان نفس الرمز الذي تم مسحه مؤخراً
    if (lastScannedData === scanningResult.data) {
      return; // تجاهل المسح المتكرر للرمز نفسه
    }
    
    setScanned(true);
    setLastScannedData(scanningResult.data);
    console.log(`تم مسح الباركود: ${scanningResult.data} (${scanningResult.type})`);
    
    // البحث عن السيارة باستخدام البيانات الممسوحة
    handleSearch(scanningResult.data);
  };
  
  // البحث عن سيارة باستخدام المعرف
  const handleSearch = async (id) => {
    if (!id && !carId) {
      Alert.alert("خطأ", "الرجاء إدخال رقم السيارة");
      return;
    }
    
    const searchId = id || carId;
    
    try {
      setLoading(true);
      
      // البحث في قاعدة البيانات
      const { data: car, error } = await supabase
        .from('cars')
        .select(`
          *,
          customer:customer_id (
            id,
            name,
            phone
          )
        `)
        .eq('id', searchId)
        .maybeSingle();
      
      if (error) {
        Alert.alert('خطأ', 'حدث خطأ أثناء البحث عن السيارة');
        console.error(error);
        Sentry.Native.captureException(error);
        return;
      }
      
      if (!car) {
        Alert.alert('لم يتم العثور', 'لم يتم العثور على سيارة بهذا الرقم');
        return;
      }
      
      // عرض معلومات السيارة في تنبيه
      Alert.alert(
        'تم العثور على السيارة',
        `رقم: ${car.id}
نوع: ${car.make || ''} ${car.model || ''}
لوحة: ${car.plate_number || ''}
العميل: ${car.customer?.name || 'غير معروف'}`,
        [
          { 
            text: "مسح آخر", 
            style: "default",
            onPress: () => {
              // إعادة تفعيل المسح
              setScanned(false);
              setShowManualSearch(false);
            }
          }
        ]
      );
      
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ غير متوقع');
      console.error(error);
      Sentry.Native.captureException(error);
    } finally {
      setLoading(false);
    }
  };
  
  // معالجة خطأ الكاميرا
  const handleCameraError = (errorMsg) => {
    setCameraError(errorMsg);
    // يمكن التعليق على هذا السطر إذا كان سبب المشكلة
    // setShowManualSearch(true);
  };
  
  if (loading) {
    return <Loading fullScreen message="جاري البحث..." />;
  }
  
  // القائمة السفلية للبحث اليدوي
  const renderBottomSheet = () => {
    // خروج مبكر إذا كانت showManualSearch بقيمة false
    if (!showManualSearch) return null;
    
    return (
      <Surface 
        style={[styles.bottomSheet, { height: bottomSheetHeight }]}
        {...panResponder.panHandlers}
      >
        <View style={styles.bottomSheetHandle}></View>
        <Text style={styles.searchInstructions}>اسحب لأسفل للإغلاق</Text>
        
        <TouchableOpacity 
          style={styles.closeBottomSheet}
          onPress={() => {
            // تنظيف الكيبورد قبل إغلاق البوتوم شيت
            Keyboard.dismiss();
            setShowManualSearch(false);
            console.log('تم الضغط على زر إغلاق البوتوم شيت');
          }}
        >
          <Icon name="close" size={24} color="#FFF" />
        </TouchableOpacity>
        
        <Text style={styles.searchTitle}>البحث اليدوي</Text>
        
        <TextInput
          style={styles.searchInput}
          placeholder="أدخل رقم السيارة"
          placeholderTextColor="#999"
          keyboardType="default"
          value={carId}
          onChangeText={setCarId}
          autoFocus={true}
        />
        
        <Button
          mode="contained"
          style={styles.searchButton}
          onPress={() => {
            handleSearch();
            // إغلاق البوتوم شيت بعد عملية البحث
            setShowManualSearch(false);
          }}
          icon="magnify"
        >
          بحث
        </Button>
      </Surface>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack}>
          <Icon name="arrow-left" size={28} color="#FFF" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>مسح رمز QR</Text>
        
        <TouchableOpacity 
          onPress={() => {
            console.log('تم الضغط على زر التبديل، الحالة الحالية:', showManualSearch);
            Keyboard.dismiss(); // إغلاق الكيبورد أولاً
            // استخدام الدالة المحدثة للتبديل مع قيمة مؤقتة
            const newValue = !showManualSearch;
            console.log('تعيين الحالة الجديدة إلى:', newValue);
            setShowManualSearch(newValue);
          }}
        >
          <Icon 
            name={showManualSearch ? "chevron-down" : "text-search"} 
            size={28} 
            color="#FFF" 
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.cameraContainer}>
        {Platform.OS === 'web' ? (
          // استخدام مكون الكاميرا المخصص للويب
          webCameraActive ? (
            <View style={{flex: 1}}>
              <WebCamera
                style={styles.camera}
                onBarCodeScanned={handleBarCodeScanned}
                onError={handleCameraError}
              />
              {cameraError && (
                <View style={styles.cameraErrorFooter}>
                  <Text style={styles.cameraErrorText}>
                    {cameraError}
                  </Text>
                  <Button 
                    mode="contained" 
                    onPress={() => setShowManualSearch(true)}
                    style={styles.manualSearchFooterButton}
                    icon="text-search"
                  >
                    البحث اليدوي
                  </Button>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.permissionContainer}>
              <Icon name="camera-off" size={50} color={COLORS.primary} />
              <Text style={styles.permissionText}>
                للمسح، يجب السماح بتشغيل الكاميرا
              </Text>
              <Button 
                mode="contained" 
                onPress={startWebCamera}
                style={styles.permissionButton}
                icon="camera"
              >
                تشغيل الكاميرا
              </Button>
              
              <Text style={styles.orText}>- أو -</Text>
              
              <Button 
                mode="outlined" 
                onPress={() => setShowManualSearch(true)}
                style={styles.manualSearchButton}
                icon="text-search"
              >
                البحث اليدوي
              </Button>
            </View>
          )
        ) : (
          // استخدام expo-camera على الأجهزة المحمولة
          !permission?.granted ? (
            <View style={styles.permissionContainer}>
              <Icon name="camera-off" size={50} color={COLORS.primary} />
              <Text style={styles.permissionText}>
                لم يتم منح إذن للوصول إلى الكاميرا
              </Text>
              <Button 
                mode="contained" 
                onPress={requestPermission}
                style={styles.permissionButton}
              >
                طلب الإذن
              </Button>
            </View>
          ) : (
            <CameraView
              style={styles.camera}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr', 'pdf417', 'code128', 'code39', 'ean13'],
              }}
            >
              <View style={styles.overlay}>
                <View style={styles.unfilled} />
                <View style={styles.scanRow}>
                  <View style={styles.unfilled} />
                  <View style={styles.scanFrame} />
                  <View style={styles.unfilled} />
                </View>
                <View style={styles.unfilled} />
              </View>
              
              <View style={styles.scanOverlayTextContainer}>
                <Text style={styles.scanText}>قم بتوجيه الكاميرا نحو رمز QR</Text>
              </View>
              
              {scanned && (
                <View style={styles.rescanButtonContainer}>
                  <Button 
                    mode="contained" 
                    onPress={() => setScanned(false)}
                    style={styles.rescanButton}
                  >
                    مسح مرة أخرى
                  </Button>
                </View>
              )}
            </CameraView>
          )
        )}
      </View>
      
      {renderBottomSheet()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#000',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  messageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginVertical: 10,
    textAlign: 'center',
  },
  messageText: {
    fontSize: 16,
    color: '#DDD',
    textAlign: 'center',
    lineHeight: 22,
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 15,
    textAlign: 'center',
  },
  searchInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: '#FFF',
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    textAlign: 'right',
  },
  searchButton: {
    backgroundColor: COLORS.primary,
  },
  cameraContainer: {
    flex: 1,
    width: '100%',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  unfilled: {
    flex: 1,
  },
  scanRow: {
    flexDirection: 'row',
    flex: 2,
  },
  scanFrame: {
    aspectRatio: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 10,
    borderStyle: 'dashed',
  },
  guideContainer: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  guideText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 20,
  },
  scanButton: {
    marginTop: 10,
    paddingHorizontal: 20,
    backgroundColor: COLORS.primary,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  permissionText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  permissionButton: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(30,30,30,0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  bottomSheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 5,
  },
  searchInstructions: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 15,
  },
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  actionButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 5,
  },
  permissionErrorContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    maxWidth: 320,
  },
  permissionHelp: {
    color: '#FFF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  permissionSteps: {
    color: '#FFF',
    fontSize: 13,
    textAlign: 'right',
    marginTop: 10,
    lineHeight: 20,
  },
  permissionRefresh: {
    color: COLORS.primary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 15,
    fontWeight: 'bold',
  },
  webCameraContainer: {
    overflow: 'hidden',
    borderRadius: 10,
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  webCameraError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  webCameraErrorText: {
    color: '#FFF',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  webCameraLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  webCameraLoadingText: {
    color: '#FFF',
    marginTop: 10,
  },
  orText: {
    color: '#FFF',
    marginVertical: 15,
  },
  manualSearchButton: {
    borderColor: '#FFF',
    borderWidth: 1,
  },
  scanOverlayTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
    borderRadius: 20,
  },
  rescanButtonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  rescanButton: {
    backgroundColor: COLORS.primary,
  },
  cameraErrorFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 15,
    alignItems: 'center',
  },
  cameraErrorText: {
    color: '#FFF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  manualSearchFooterButton: {
    marginTop: 10,
    backgroundColor: COLORS.primary,
  },
  closeBottomSheet: {
    position: 'absolute',
    top: 15,
    left: 15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
}); 