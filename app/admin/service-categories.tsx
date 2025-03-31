// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Text, Appbar, FAB, Card, Button, TextInput, Portal, Dialog, IconButton, HelperText } from 'react-native-paper';
import { COLORS, SPACING } from '../constants';
import { useAuthStore } from '../utils/store';
import { supabase } from '../config';
import Loading from '../components/Loading';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function ServiceCategoriesScreen() {
  const { user } = useAuthStore();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // إضافة فئة جديدة
  const [addDialogVisible, setAddDialogVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newCategoryPrice, setNewCategoryPrice] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  // تعديل فئة
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryDescription, setEditCategoryDescription] = useState('');
  const [editCategoryPrice, setEditCategoryPrice] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  // حذف فئة
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        console.error('فشل في تحميل فئات الخدمات:', error);
        return;
      }
      
      setCategories(data || []);
    } catch (error) {
      console.error('حدث خطأ أثناء تحميل فئات الخدمات:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadCategories();
  };

  const validateCategory = (name, price) => {
    if (!name.trim()) return false;
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) return false;
    return true;
  };

  const handleAddCategory = async () => {
    if (!validateCategory(newCategoryName, newCategoryPrice)) {
      Alert.alert('خطأ', 'يجب إدخال اسم الفئة وسعر صحيح');
      return;
    }
    
    try {
      setIsAdding(true);
      
      const { data, error } = await supabase
        .from('service_categories')
        .insert([
          { 
            name: newCategoryName.trim(),
            description: newCategoryDescription.trim() || null,
            price: parseFloat(newCategoryPrice),
            created_at: new Date()
          }
        ])
        .select();
      
      if (error) {
        Alert.alert('خطأ', 'فشل في إضافة فئة الخدمة');
        console.error('فشل في إضافة فئة الخدمة:', error);
        return;
      }
      
      Alert.alert('نجاح', 'تمت إضافة فئة الخدمة بنجاح');
      clearAddForm();
      setAddDialogVisible(false);
      loadCategories(); // إعادة تحميل القائمة
    } catch (error) {
      console.error('حدث خطأ أثناء إضافة فئة الخدمة:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إضافة فئة الخدمة');
    } finally {
      setIsAdding(false);
    }
  };

  const clearAddForm = () => {
    setNewCategoryName('');
    setNewCategoryDescription('');
    setNewCategoryPrice('');
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setEditCategoryName(category.name);
    setEditCategoryDescription(category.description || '');
    setEditCategoryPrice(category.price.toString());
    setEditDialogVisible(true);
  };

  const confirmEditCategory = async () => {
    if (!validateCategory(editCategoryName, editCategoryPrice)) {
      Alert.alert('خطأ', 'يجب إدخال اسم الفئة وسعر صحيح');
      return;
    }
    
    try {
      setIsEditing(true);
      
      const { error } = await supabase
        .from('service_categories')
        .update({ 
          name: editCategoryName.trim(),
          description: editCategoryDescription.trim() || null,
          price: parseFloat(editCategoryPrice),
          updated_at: new Date()
        })
        .eq('id', selectedCategory.id);
      
      if (error) {
        Alert.alert('خطأ', 'فشل في تحديث فئة الخدمة');
        console.error('فشل في تحديث فئة الخدمة:', error);
        return;
      }
      
      Alert.alert('نجاح', 'تم تحديث فئة الخدمة بنجاح');
      setEditDialogVisible(false);
      setSelectedCategory(null);
      loadCategories(); // إعادة تحميل القائمة
    } catch (error) {
      console.error('حدث خطأ أثناء تحديث فئة الخدمة:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحديث فئة الخدمة');
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteCategory = (category) => {
    setCategoryToDelete(category);
    setDeleteDialogVisible(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    try {
      setIsDeleting(true);
      
      // التحقق من وجود زيارات صيانة مرتبطة بالفئة
      const { data: usageData, error: usageError } = await supabase
        .from('service_visits')
        .select('id')
        .eq('service_category_id', categoryToDelete.id)
        .limit(1);
      
      if (usageError) {
        console.error('فشل في التحقق من استخدام الفئة:', usageError);
      }
      
      if (usageData && usageData.length > 0) {
        Alert.alert(
          'غير مسموح',
          'لا يمكن حذف هذه الفئة لأنها مستخدمة في سجلات صيانة. يمكنك تعديلها بدلاً من ذلك.',
          [{ text: 'فهمت', style: 'cancel' }]
        );
        return;
      }
      
      const { error } = await supabase
        .from('service_categories')
        .delete()
        .eq('id', categoryToDelete.id);
      
      if (error) {
        Alert.alert('خطأ', 'فشل في حذف فئة الخدمة');
        console.error('فشل في حذف فئة الخدمة:', error);
        return;
      }
      
      Alert.alert('نجاح', 'تم حذف فئة الخدمة بنجاح');
      loadCategories(); // إعادة تحميل القائمة
    } catch (error) {
      console.error('حدث خطأ أثناء حذف فئة الخدمة:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء حذف فئة الخدمة');
    } finally {
      setDeleteDialogVisible(false);
      setCategoryToDelete(null);
      setIsDeleting(false);
    }
  };

  const renderCategoryItem = ({ item }) => (
    <Card style={styles.categoryCard}>
      <Card.Content>
        <View style={styles.categoryHeader}>
          <View>
            <Text style={styles.categoryName}>{item.name}</Text>
            {item.description && (
              <Text style={styles.description}>{item.description}</Text>
            )}
          </View>
          <Text style={styles.price}>{item.price.toFixed(2)} ريال</Text>
        </View>
      </Card.Content>
      <Card.Actions>
        <Button onPress={() => handleEditCategory(item)}>تعديل</Button>
        <Button textColor={COLORS.error} onPress={() => handleDeleteCategory(item)}>حذف</Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="فئات الخدمة" />
      </Appbar.Header>
      
      {loading && !refreshing ? (
        <Loading fullScreen message="جاري تحميل فئات الخدمات..." />
      ) : (
        <>
          {categories.length > 0 ? (
            <FlatList
              data={categories}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
              }
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="tag-off" size={80} color={COLORS.gray} />
              <Text style={styles.emptyText}>لا توجد فئات خدمة مسجلة</Text>
              <Text style={styles.emptyHint}>اضغط على زر الإضافة لإنشاء فئات جديدة</Text>
            </View>
          )}
        </>
      )}
      
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setAddDialogVisible(true)}
      />
      
      {/* إضافة فئة جديدة */}
      <Portal>
        <Dialog visible={addDialogVisible} onDismiss={() => !isAdding && setAddDialogVisible(false)}>
          <Dialog.Title>إضافة فئة خدمة جديدة</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="اسم الفئة"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              style={styles.input}
              mode="outlined"
            />
            <HelperText type="info">مثال: تغيير زيت، فلتر هواء، إلخ.</HelperText>
            
            <TextInput
              label="الوصف (اختياري)"
              value={newCategoryDescription}
              onChangeText={setNewCategoryDescription}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={2}
            />
            
            <TextInput
              label="السعر (ريال)"
              value={newCategoryPrice}
              onChangeText={setNewCategoryPrice}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => {
                clearAddForm();
                setAddDialogVisible(false);
              }}
              disabled={isAdding}
            >
              إلغاء
            </Button>
            <Button 
              onPress={handleAddCategory} 
              loading={isAdding}
              disabled={isAdding || !validateCategory(newCategoryName, newCategoryPrice)}
            >
              إضافة
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      {/* تعديل فئة */}
      <Portal>
        <Dialog visible={editDialogVisible} onDismiss={() => !isEditing && setEditDialogVisible(false)}>
          <Dialog.Title>تعديل فئة الخدمة</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="اسم الفئة"
              value={editCategoryName}
              onChangeText={setEditCategoryName}
              style={styles.input}
              mode="outlined"
            />
            
            <TextInput
              label="الوصف (اختياري)"
              value={editCategoryDescription}
              onChangeText={setEditCategoryDescription}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={2}
            />
            
            <TextInput
              label="السعر (ريال)"
              value={editCategoryPrice}
              onChangeText={setEditCategoryPrice}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => {
                setEditDialogVisible(false);
                setSelectedCategory(null);
              }}
              disabled={isEditing}
            >
              إلغاء
            </Button>
            <Button 
              onPress={confirmEditCategory} 
              loading={isEditing}
              disabled={isEditing || !validateCategory(editCategoryName, editCategoryPrice)}
            >
              حفظ
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      {/* حذف فئة */}
      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => !isDeleting && setDeleteDialogVisible(false)}>
          <Dialog.Icon icon="alert" />
          <Dialog.Title>تأكيد الحذف</Dialog.Title>
          <Dialog.Content>
            <Text>
              هل أنت متأكد من رغبتك في حذف فئة "{categoryToDelete?.name}"؟
              {'\n\n'}
              ملاحظة: لا يمكن حذف الفئات المستخدمة في سجلات الصيانة.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => setDeleteDialogVisible(false)}
              disabled={isDeleting}
            >
              إلغاء
            </Button>
            <Button 
              onPress={confirmDeleteCategory} 
              loading={isDeleting}
              disabled={isDeleting}
              textColor={COLORS.error}
            >
              حذف
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
    paddingBottom: 80, // لإتاحة مساحة للـ FAB
  },
  categoryCard: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.white,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.primary,
  },
  input: {
    marginBottom: SPACING.sm,
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