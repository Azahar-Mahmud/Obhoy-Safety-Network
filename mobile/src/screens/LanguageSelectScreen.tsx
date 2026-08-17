import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { setLanguage } from '../i18n';
import { LanguageChosenContext } from '../context/LanguageChosenContext';

export default function LanguageSelectScreen() {
  const { markChosen } = useContext(LanguageChosenContext);

  const choose = async (lang: 'bn' | 'en') => {
    await setLanguage(lang);
    markChosen();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>অভয় · Obhoy</Text>

      <Text style={styles.title}>আপনার ভাষা নির্বাচন করুন</Text>
      <Text style={styles.title}>Choose your language</Text>

      <TouchableOpacity style={[styles.option, styles.optionPrimary]} onPress={() => choose('bn')}>
        <Text style={styles.optionTextPrimary}>বাংলা</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.option} onPress={() => choose('en')}>
        <Text style={styles.optionText}>English</Text>
      </TouchableOpacity>

      <Text style={styles.note}>পরে সেটিংস থেকে বদলাতে পারবেন · You can change this later</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#FFFFFF' },
  brand: { fontSize: 24, fontWeight: 'bold', color: '#6B21A8', textAlign: 'center', marginBottom: 32 },
  title: { fontSize: 18, color: '#111827', textAlign: 'center', marginBottom: 4 },
  option: {
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6B21A8',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  optionPrimary: { backgroundColor: '#6B21A8', borderColor: '#6B21A8' },
  optionText: { fontSize: 20, color: '#6B21A8', fontWeight: 'bold' },
  optionTextPrimary: { fontSize: 20, color: '#FFFFFF', fontWeight: 'bold' },
  note: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 32 },
});