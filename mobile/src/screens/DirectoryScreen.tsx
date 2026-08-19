import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, FlatList, StatusBar, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';

import { Card, ListRow, ScreenHeader } from '../components';
import { useTheme } from '../context/ThemeContext';
import { colors, spacing, typography, radii } from '../theme/theme';
import { t, useLanguage } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'Directory'>;

export default function DirectoryScreen({ navigation }: Props) {
  useLanguage();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const topPadding = Platform.OS === 'android' 
    ? Math.max(insets.top, (StatusBar.currentHeight || 28)) + 6
    : Math.max(insets.top, 20);

  const helplines = [
    { key: 'dir.women_child', label: 'Women & Child Helpline', sub: 'National 24/7 toll-free assistance', number: '109', icon: 'shield', color: colors.caution, tint: colors.cautionTint },
    { key: 'dir.child', label: 'Child Helpline', sub: 'Child protection & rescue service', number: '1098', icon: 'heart', color: colors.primary, tint: colors.primaryLight },
    { key: 'dir.disaster', label: 'Disaster Helpline', sub: 'Emergency flood, cyclone & crisis info', number: '1090', icon: 'alert-triangle', color: colors.safe, tint: colors.safeTint },
  ];

  const call = (number: string) => Linking.openURL(`tel:${number}`);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: topPadding }]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.bg} 
        translucent 
      />

      <FlatList
        data={helplines}
        keyExtractor={(item) => item.number}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <ScreenHeader
              title={t('dir.title') || 'Help & Emergency'}
              subtitle="Direct emergency hotlines, practice simulations & guides."
            />

            {/* Hero 999 National Emergency Card */}
            <TouchableOpacity 
              style={styles.hero999Card} 
              onPress={() => call('999')}
              activeOpacity={0.9}
            >
              <View style={styles.hero999Content}>
                <View style={styles.hero999IconCircle}>
                  <Feather name="phone-call" size={26} color="#DC2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.hero999Badge}>NATIONAL EMERGENCY</Text>
                  <Text style={styles.hero999Title}>Police • Fire • Ambulance</Text>
                  <Text style={styles.hero999Sub}>Tap to call immediately</Text>
                </View>
                <View style={styles.hero999NumBox}>
                  <Text style={styles.hero999Number}>999</Text>
                </View>
              </View>
            </TouchableOpacity>

            <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
              NATIONAL HELPLINES
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.helplineCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]} 
            onPress={() => call(item.number)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBadge, { backgroundColor: item.tint }]}>
              <Feather name={item.icon as any} size={20} color={item.color} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.helplineLabel, { color: colors.textPrimary }]}>{item.label}</Text>
              <Text style={[styles.helplineSub, { color: colors.textSecondary }]}>{item.sub}</Text>
            </View>
            <View style={styles.callPill}>
              <Text style={[styles.helplineNumber, { color: colors.primary }]}>{item.number}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
              TRAINING & GUIDES
            </Text>
            <Card style={styles.guideCard}>
              <ListRow
                title="Practice Mode"
                subtitle="Safely simulate SOS and check-ins without alerting anyone"
                left={<Feather name="play-circle" size={22} color={colors.primary} style={styles.rowIcon} />}
                right={<Feather name="chevron-right" size={18} color={colors.textSecondary} />}
                onPress={() => navigation.navigate('PracticeMode')}
              />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <ListRow
                title="How Obhoy Works"
                subtitle="Comprehensive 8-pillar guides & video walkthroughs"
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
  container: { flex: 1 },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: 110, paddingTop: spacing.xs },
  headerWrap: { marginBottom: spacing.xs },
  
  // Hero 999 Card
  hero999Card: {
    backgroundColor: '#FEE2E2',
    borderRadius: radii.card,
    padding: spacing.lg,
    marginVertical: spacing.md,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    elevation: 2,
    shadowColor: '#DC2626',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  hero999Content: { flexDirection: 'row', alignItems: 'center' },
  hero999IconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    elevation: 2,
  },
  hero999Badge: { fontSize: 11, fontWeight: '900', color: '#B91C1C', letterSpacing: 0.8 },
  hero999Title: { fontSize: 15, fontWeight: '800', color: '#111827', marginTop: 1 },
  hero999Sub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  hero999NumBox: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#DC2626', borderRadius: radii.pill },
  hero999Number: { fontSize: 20, fontWeight: '900', color: '#FFFFFF' },

  // Helpline Cards
  sectionHeading: { ...typography.sectionHeading, fontSize: 12.5, marginBottom: spacing.xs, marginTop: spacing.md, letterSpacing: 0.8 },
  helplineCard: {
    borderRadius: radii.card,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    elevation: 1,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helplineLabel: { fontSize: 15, fontWeight: '800' },
  helplineSub: { fontSize: 12, marginTop: 2 },
  callPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primaryLight,
    borderRadius: radii.pill,
  },
  helplineNumber: { fontSize: 16, fontWeight: '900' },

  // Guide Section
  footer: { marginTop: spacing.xs },
  guideCard: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radii.card },
  divider: { height: 1, marginVertical: spacing.xs },
  rowIcon: { marginRight: spacing.sm },
});