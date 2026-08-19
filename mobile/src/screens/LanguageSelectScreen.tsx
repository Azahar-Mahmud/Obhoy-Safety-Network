import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { setLanguage } from '../i18n';
import { LanguageChosenContext } from '../context/LanguageChosenContext';
import { colors, spacing, typography, radii } from '../theme/theme';
import { Card, Button } from '../components';

export default function LanguageSelectScreen() {
  const { markChosen } = useContext(LanguageChosenContext);
  const [selectedLang, setSelectedLang] = useState<'bn' | 'en'>('bn');
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await setLanguage(selectedLang);
      markChosen();
    } catch (e) {
      console.warn('[I18N] Save language error:', e);
      markChosen();
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>অ</Text>
        </View>
        <Text style={styles.brandTitle}>অভয় · Obhoy</Text>
        <Text style={styles.subtitleBn}>আপনার পছন্দের ভাষা নির্বাচন করুন</Text>
        <Text style={styles.subtitleEn}>Select your preferred language</Text>
      </View>

      {/* Language Selection Tiles */}
      <View style={styles.optionsContainer}>
        {/* Bengali Option */}
        <Pressable onPress={() => setSelectedLang('bn')}>
          <Card style={[styles.langCard, selectedLang === 'bn' && styles.langCardActive]}>
            <View style={styles.langRow}>
              <View style={styles.langTextCol}>
                <Text style={[styles.langName, selectedLang === 'bn' && styles.langNameActive]}>
                  বাংলা
                </Text>
                <Text style={styles.langSub}>Bengali</Text>
              </View>
              <View style={[styles.radioCircle, selectedLang === 'bn' && styles.radioCircleActive]}>
                {selectedLang === 'bn' && <Feather name="check" size={16} color="#FFFFFF" />}
              </View>
            </View>
          </Card>
        </Pressable>

        {/* English Option */}
        <Pressable onPress={() => setSelectedLang('en')}>
          <Card style={[styles.langCard, selectedLang === 'en' && styles.langCardActive]}>
            <View style={styles.langRow}>
              <View style={styles.langTextCol}>
                <Text style={[styles.langName, selectedLang === 'en' && styles.langNameActive]}>
                  English
                </Text>
                <Text style={styles.langSub}>ইংরেজি</Text>
              </View>
              <View style={[styles.radioCircle, selectedLang === 'en' && styles.radioCircleActive]}>
                {selectedLang === 'en' && <Feather name="check" size={16} color="#FFFFFF" />}
              </View>
            </View>
          </Card>
        </Pressable>
      </View>

      <Text style={styles.helperNote}>
        পরে সেটিংস থেকে পরিবর্তন করতে পারবেন • Can be changed later in Settings
      </Text>

      <Button
        label={saving ? 'Saving...' : selectedLang === 'bn' ? 'এগিয়ে যান' : 'Continue'}
        onPress={handleConfirm}
        disabled={saving}
        style={styles.continueBtn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA', padding: spacing.xl, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    elevation: 2,
  },
  logoText: { fontSize: 32, fontWeight: '800', color: colors.primary },
  brandTitle: { ...typography.screenTitle, color: colors.primary, fontSize: 26, marginBottom: 8 },
  subtitleBn: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  subtitleEn: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 2 },
  optionsContainer: { marginVertical: spacing.md },
  langCard: {
    padding: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  langCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  langRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  langTextCol: { flex: 1 },
  langName: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  langNameActive: { color: colors.primary },
  langSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  radioCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioCircleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  helperNote: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: spacing.lg,
    lineHeight: 16,
  },
  continueBtn: { marginTop: spacing.sm },
});