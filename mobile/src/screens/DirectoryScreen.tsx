import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, FlatList } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';

import { Card, ListRow } from '../components';
import { colors, spacing, typography } from '../theme/theme';
import { t, useLanguage } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'Directory'>;

export default function DirectoryScreen({ navigation }: Props) {
  useLanguage();

  const numbers = [
    { key: 'dir.police', label: t('dir.police'), number: '999' },
    { key: 'dir.women_child', label: t('dir.women_child'), number: '109' },
    { key: 'dir.child', label: t('dir.child'), number: '1098' },
    { key: 'dir.disaster', label: t('dir.disaster'), number: '1090' },
  ];

  const call = (number: string) => Linking.openURL(`tel:${number}`);

  return (
    <View style={styles.container}>
      <FlatList
        data={numbers}
        keyExtractor={(item) => item.number}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => call(item.number)}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.number}>{item.number}</Text>
          </TouchableOpacity>
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            <Text style={styles.sectionHeader}>Help & Guides</Text>
            <Card>
              <ListRow
                title="Practice Mode"
                subtitle="Try SOS & check-ins safely without alerting anyone"
                left={<Feather name="play-circle" size={22} color={colors.primary} style={styles.rowIcon} />}
                right={<Feather name="chevron-right" size={18} color={colors.textSecondary} />}
                onPress={() => navigation.navigate('PracticeMode')}
              />
              <View style={styles.divider} />
              <ListRow
                title="How Obhoy Works"
                subtitle="A quick guide to staying safe"
                left={<Feather name="book-open" size={22} color={colors.primary} style={styles.rowIcon} />}
                right={<Feather name="chevron-right" size={18} color={colors.textSecondary} />}
                onPress={() => navigation.navigate('AppGuide')}
              />
            </Card>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  listContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: '#EDE9FE',
    borderRadius: 8,
    padding: 20,
    marginBottom: 12,
    minHeight: 64,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
  },
  label: { fontSize: 16, color: '#111827', flex: 1, marginRight: 12, fontWeight: '600' },
  number: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  footer: { marginTop: spacing.md },
  sectionHeader: { ...typography.sectionHeading, color: colors.textSecondary, fontSize: 16, marginBottom: spacing.sm },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  rowIcon: { marginRight: spacing.sm },
});