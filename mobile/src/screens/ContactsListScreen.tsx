import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import { apiRequest } from '../api/client';
import { t, useLanguage } from '../i18n';
import { ScreenHeader, Card, ListRow, Avatar, Button, EmptyState } from '../components';
import { colors, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ContactsList'>;
type Contact = { _id: string; name: string; phone: string; relationship?: string };

const MAX_CONTACTS = 5;

export default function ContactsListScreen({ navigation }: Props) {
  useLanguage();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);

  const loadContacts = useCallback(() => {
    setLoading(true);
    apiRequest('/contacts')
      .then(setContacts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { loadContacts(); }, [loadContacts]));

  const handleDelete = (contact: Contact) => {
    Alert.alert(
      t('common.delete') || 'Remove Contact',
      `Remove ${contact.name} from your trusted emergency network?`,
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('common.delete') || 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiRequest(`/contacts/${contact._id}`, { method: 'DELETE' });
              loadContacts();
            } catch (err: any) {
              Alert.alert(t('common.error') || 'Error', err.message || 'Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={contacts}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <ScreenHeader 
              title={t('contacts.title') || 'Trusted Contacts'} 
              subtitle={`You have ${contacts.length}/${MAX_CONTACTS} trusted contacts in your emergency network.`} 
            />
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState 
              title="No trusted contacts yet" 
              subtitle="Add up to 5 family members or friends who will receive alerts during an emergency." 
            />
          ) : null
        }
        renderItem={({ item }) => (
          <Card style={styles.contactCard}>
            <ListRow
              title={item.name}
              subtitle={`${item.phone}${item.relationship && item.relationship !== 'other' ? ' · ' + item.relationship : ''}`}
              left={<Avatar initial={item.name[0]?.toUpperCase() || '?'} size={44} />}
              right={
                <Pressable 
                  onPress={() => handleDelete(item)} 
                  hitSlop={12}
                  style={styles.deleteBtn}
                >
                  <Feather name="trash-2" size={18} color={colors.textSecondary} />
                </Pressable>
              }
            />
          </Card>
        )}
        ListFooterComponent={
          contacts.length < MAX_CONTACTS ? (
            <View style={styles.footerWrap}>
              <Button
                label="Add Trusted Contact"
                variant="primary"
                onPress={() => navigation.navigate('AddContact')}
              />
            </View>
          ) : (
            <Text style={styles.maxNotice}>
              Maximum limit reached ({MAX_CONTACTS}/{MAX_CONTACTS} contacts).
            </Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  headerWrap: { marginBottom: spacing.sm },
  contactCard: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  deleteBtn: { padding: 8 },
  footerWrap: { marginTop: spacing.md },
  maxNotice: { 
    textAlign: 'center', 
    color: colors.textSecondary, 
    fontSize: 13, 
    marginTop: spacing.md,
    fontWeight: '500'
  },
});