import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { t, useLanguage, getLanguage, setLanguage } from '../i18n';
import { syncLanguageToBackend } from '../utils/languageSync';
import { colors, radii } from '../theme/theme';

export default function LanguageToggle() {
  useLanguage(); // Triggers re-render when language changes
  const current = getLanguage();

  const choose = async (selected: 'bn' | 'en') => {
    if (selected === current) return;
    await setLanguage(selected);
    syncLanguageToBackend();
  };

  return (
    <View style={styles.segCtrl}>
      <Pressable 
        style={[styles.segBtn, current === 'en' && styles.segBtnActive]} 
        onPress={() => choose('en')}
      >
        <Text style={[styles.segBtnText, current === 'en' && { color: colors.primary }]}>English</Text>
      </Pressable>
      <Pressable 
        style={[styles.segBtn, current === 'bn' && styles.segBtnActive]} 
        onPress={() => choose('bn')}
      >
        <Text style={[styles.segBtnText, current === 'bn' && { color: colors.primary }]}>বাংলা</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  segCtrl: { 
    flexDirection: 'row', backgroundColor: colors.inputBg, borderRadius: radii.md, 
    padding: 3, borderWidth: 1, borderColor: colors.border, marginBottom: 20 
  },
  segBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radii.sm },
  segBtnActive: { backgroundColor: colors.cardBg, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  segBtnText: { fontSize: 13.5, fontWeight: '700', color: colors.text2 },
});