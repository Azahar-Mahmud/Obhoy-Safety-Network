import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { t, getLanguage, setLanguage, useLanguage } from '../i18n';
import { syncLanguageToBackend } from '../utils/languageSync';

export default function LanguageToggle() {
  useLanguage();
  const current = getLanguage();

  const choose = async (lang: 'bn' | 'en') => {
    if (lang === current) return;
    await setLanguage(lang);
    syncLanguageToBackend();
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{t('lang.setting_label')}</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.chip, current === 'bn' && styles.chipActive]}
          onPress={() => choose('bn')}
        >
          <Text style={[styles.chipText, current === 'bn' && styles.chipTextActive]}>বাংলা</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, current === 'en' && styles.chipActive]}
          onPress={() => choose('en')}
        >
          <Text style={[styles.chipText, current === 'en' && styles.chipTextActive]}>English</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.note}>{t('lang.setting_note')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 12 },
  label: { fontSize: 16, color: '#111827', marginBottom: 8 },
  row: { flexDirection: 'row' },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6B21A8',
    marginRight: 12,
  },
  chipActive: { backgroundColor: '#6B21A8' },
  chipText: { color: '#6B21A8', fontWeight: 'bold' },
  chipTextActive: { color: '#FFFFFF' },
  note: { fontSize: 13, color: '#6B7280', marginTop: 8 },
});