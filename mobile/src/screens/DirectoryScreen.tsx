import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';

import { colors, spacing, typography, radii } from '../theme/theme';
import { t, useLanguage } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'Directory'>;

export default function DirectoryScreen({ navigation }: Props) {
  useLanguage();
  const call = (number: string) => Linking.openURL(`tel:${number}`);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={typography.screenTitle}>Help & Guides</Text>

      {/* Practice Mode Link */}
      <TouchableOpacity 
        style={styles.practiceCard} 
        onPress={() => navigation.navigate('PracticeMode')}
      >
        <View style={styles.row}>
          <Feather name="play-circle" size={24} color={colors.primary} style={{ marginRight: 14 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '800', fontSize: 15, color: colors.primaryDark }}>Practice Mode & Tutorials</Text>
            <Text style={{ fontSize: 13, color: colors.primary, marginTop: 2 }}>Learn how to use SOS safely</Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.primary} />
        </View>
      </TouchableOpacity>

      {/* Medical Card Link */}
      <TouchableOpacity 
        style={styles.medicalCard} 
        onPress={() => navigation.navigate('MedicalCardEdit')}
      >
        <View style={styles.row}>
          <Feather name="heart" size={26} color={colors.danger} style={{ marginRight: 14 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Medical Card</Text>
            <Text style={styles.hint}>O+ · No known allergies</Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.text2} />
        </View>
      </TouchableOpacity>

      <Text style={typography.sectionHeading}>Emergency Numbers</Text>

      <TouchableOpacity style={styles.callCardHero} onPress={() => call('999')}>
        <View style={styles.ciconHero}><Feather name="phone-call" size={22} color="#fff" /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.callTitleHero}>National Emergency</Text>
          <Text style={styles.callHintHero}>Police · Fire · Ambulance</Text>
        </View>
        <Text style={styles.emNum}>999</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.callCard} onPress={() => call('109')}>
        <View style={[styles.cicon, { backgroundColor: colors.cautionTint }]}><Feather name="users" size={20} color={colors.caution} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.callTitle}>Women & Child Helpline</Text>
          <Text style={styles.hint}>109 · National, free</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.callCard} onPress={() => call('1098')}>
        <View style={[styles.cicon, { backgroundColor: colors.primaryLight }]}><Feather name="smile" size={20} color={colors.primary} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.callTitle}>Child Helpline</Text>
          <Text style={styles.hint}>1098 · National, free</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.callCard} onPress={() => call('1090')}>
        <View style={[styles.cicon, { backgroundColor: colors.dangerTint }]}><Feather name="cloud-rain" size={20} color={colors.danger} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.callTitle}>Disaster Helpline</Text>
          <Text style={styles.hint}>1090 · National, free</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: 100 },
  row: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontWeight: '800', fontSize: 14.5, color: colors.text },
  hint: { fontSize: 13, color: colors.text2, marginTop: 2 },

  practiceCard: { backgroundColor: colors.primaryTint, borderWidth: 1.5, borderColor: colors.primary, borderRadius: radii.card, padding: 16, marginTop: 8, marginBottom: 12 },
  medicalCard: { backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.border, borderRadius: radii.card, padding: 16, marginBottom: 20 },

  callCardHero: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, padding: 16, borderRadius: radii.card, marginBottom: 12 },
  ciconHero: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  callTitleHero: { fontWeight: '800', fontSize: 14.5, color: '#fff' },
  callHintHero: { fontSize: 12.5, color: '#fff', opacity: 0.85, marginTop: 2 },
  emNum: { fontFamily: 'monospace', fontSize: 26, fontWeight: '800', color: '#fff' },

  callCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBg, borderWidth: 1.5, borderColor: colors.border, padding: 16, borderRadius: radii.card, marginBottom: 12 },
  cicon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  callTitle: { fontWeight: '700', fontSize: 14, color: colors.text },
});