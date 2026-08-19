import { useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { apiRequest } from '../api/client';
import { t, useLanguage } from '../i18n';
import { ScreenHeader, Card } from '../components';
import { colors, spacing, typography, radii } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ContactsList'>;
type Contact = { _id: string; name: string; phone: string; relationship: string };

export default function ContactsListScreen({ navigation }: Props) {
  useLanguage();
  const [contacts, setContacts] = useState<Contact[]>([]);

  const loadContacts = useCallback(() => {
    apiRequest('/contacts').then(setContacts).catch(() => {});
  }, []);

  useFocusEffect(useCallback(() => { loadContacts(); }, [loadContacts]));

  const handleDelete = (contact: Contact) => {
    Alert.alert(t('common.delete'), `Remove ${contact.name} from your trusted network?`, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await apiRequest(`/contacts/${contact._id}`, { method: 'DELETE' });
            loadContacts();
          } catch (err: any) {
            Alert.alert(t('common.error'), err.message || 'Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.lg }}>
        <ScreenHeader title={t('contacts.title')} subtitle="Manage your trusted network." />
      </View>

      <Card style={{ marginHorizontal: spacing.xl, paddingVertical: 6, paddingHorizontal: 16 }}>
        <FlatList
          data={contacts}
          keyExtractor={(item) => item._id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.contactRow}>
              <View style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={{fontWeight:'700', color:colors.primary}}>{item.name[0]?.toUpperCase() || '?'}</Text>
                </View>
                <View>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.hint}>{item.phone} · {item.relationship}</Text>
                </View>
              </View>
              <Pressable onPress={() => handleDelete(item)} hitSlop={10}>
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>{t('contacts.empty')}</Text>}
        />

        {contacts.length < 5 && (
          <Pressable 
            style={[styles.contactRow, { borderBottomWidth: 0 }]} 
            android_ripple={{ color: colors.ripple }} 
            onPress={() => navigation.navigate('AddContact')}
          >
            <View style={[styles.avatar, { backgroundColor: colors.inputBg }]}>
              <Text style={{fontWeight:'700', color:colors.text2}}>+</Text>
            </View>
            <Text style={{ fontWeight: '700', fontSize: 14.5, color: colors.primary }}>Add trusted contact</Text>
          </Pressable>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  contactRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontWeight: '700', fontSize: 14.5, color: colors.text },
  hint: { fontSize: 13, color: colors.text2, marginTop: 2 },
  removeText: { color: colors.danger, fontWeight: '700', fontSize: 13 },
  empty: { textAlign: 'center', color: colors.text2, marginVertical: 20 },
});