// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, Appbar, TextInput, Button, Card, Avatar, Divider } from 'react-native-paper';
import { COLORS, SPACING } from '../constants';
import { useAuthStore } from '../utils/store';
import { supabase } from '../config';
import Loading from '../components/Loading';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('فشل في تحميل الملف الشخصي:', error);
        return;
      }

      setProfile(data);
      setName(data.full_name || '');
      setPhone(data.phone || '');
      setEmail(data.email || '');
    } catch (error) {
      console.error('حدث خطأ أثناء تحميل الملف الشخصي:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setUploading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: name,
          phone: phone,
          email: email,
          updated_at: new Date()
        })
        .eq('id', user.id);

      if (error) {
        Alert.alert('خطأ', 'فشل في تحديث الملف الشخصي');
        console.error('فشل في تحديث الملف الشخصي:', error);
        return;
      }

      Alert.alert('نجاح', 'تم تحديث الملف الشخصي بنجاح');
      setEditing(false);
      loadProfile();
    } catch (error) {
      console.error('حدث خطأ أثناء تحديث الملف الشخصي:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحديث الملف الشخصي');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد أنك تريد تسجيل الخروج؟',
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'تأكيد',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  if (loading) {
    return <Loading fullScreen message="جاري تحميل الملف الشخصي..." />;
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="الملف الشخصي" />
        {!editing && (
          <Appbar.Action icon="pencil" onPress={() => setEditing(true)} />
        )}
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Avatar.Text 
              size={80} 
              label={name ? name.substring(0, 2).toUpperCase() : 'UN'} 
              backgroundColor={COLORS.primary}
            />
            <Text style={styles.userName}>{name || 'مستخدم'}</Text>
            <Text style={styles.userRole}>عميل</Text>
          </View>
        </Card>

        <Card style={styles.infoCard}>
          <Card.Title 
            title="المعلومات الشخصية" 
            left={(props) => <Icon {...props} name="account-details" size={24} color={COLORS.primary} />}
          />
          <Card.Content>
            {editing ? (
              <>
                <TextInput
                  label="الاسم الكامل"
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                  mode="outlined"
                />
                <TextInput
                  label="رقم الهاتف"
                  value={phone}
                  onChangeText={setPhone}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="phone-pad"
                />
                <TextInput
                  label="البريد الإلكتروني"
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="email-address"
                />
                <View style={styles.buttonContainer}>
                  <Button
                    mode="contained"
                    style={styles.saveButton}
                    onPress={handleSaveProfile}
                    loading={uploading}
                    disabled={uploading}
                  >
                    حفظ التغييرات
                  </Button>
                  <Button
                    mode="outlined"
                    style={styles.cancelButton}
                    onPress={() => {
                      setEditing(false);
                      loadProfile(); // إعادة تحميل البيانات الأصلية
                    }}
                    disabled={uploading}
                  >
                    إلغاء
                  </Button>
                </View>
              </>
            ) : (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>الاسم الكامل:</Text>
                  <Text style={styles.infoValue}>{profile?.full_name || 'غير محدد'}</Text>
                </View>
                <Divider style={styles.divider} />
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>رقم الهاتف:</Text>
                  <Text style={styles.infoValue}>{profile?.phone || 'غير محدد'}</Text>
                </View>
                <Divider style={styles.divider} />
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>البريد الإلكتروني:</Text>
                  <Text style={styles.infoValue}>{profile?.email || 'غير محدد'}</Text>
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.infoCard}>
          <Card.Title 
            title="الإحصائيات" 
            left={(props) => <Icon {...props} name="chart-bar" size={24} color={COLORS.primary} />}
          />
          <Card.Content>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile?.cars_count || 0}</Text>
                <Text style={styles.statLabel}>السيارات</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile?.service_visits_count || 0}</Text>
                <Text style={styles.statLabel}>زيارات الصيانة</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Button 
          mode="outlined" 
          style={styles.logoutButton}
          onPress={handleLogout}
          icon="logout"
          textColor={COLORS.error}
        >
          تسجيل الخروج
        </Button>
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
  },
  profileCard: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: SPACING.sm,
  },
  userRole: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 2,
  },
  infoCard: {
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  infoLabel: {
    fontWeight: '500',
    color: COLORS.gray,
  },
  infoValue: {
    fontWeight: '400',
  },
  divider: {
    marginVertical: SPACING.xxs,
  },
  input: {
    marginBottom: SPACING.sm,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  saveButton: {
    flex: 1,
    marginRight: SPACING.xs,
  },
  cancelButton: {
    flex: 1,
    marginLeft: SPACING.xs,
  },
  logoutButton: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
    borderColor: COLORS.error,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 2,
  },
}); 