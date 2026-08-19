import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { colors, spacing, typography } from '../../theme/theme';
import { Button } from '../../components';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingChoice'>;

export default function OnboardingChoiceScreen({ navigation }: Props) {
  const skipToApp = async () => {
    await SecureStore.setItemAsync('obhoy_onboarding_completed', 'true');
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Feather name="shield" size={32} color={colors.primary} />
      </View>
      <Text style={styles.title}>Welcome to Obhoy</Text>
      <Text style={styles.body}>
        Would you like a quick tour of how to stay safe using Obhoy?
      </Text>

      <View style={styles.buttonStack}>
        <Button
          label="Show me how it works"
          variant="primary"
          onPress={() => navigation.navigate('OnboardingSlider', { mode: 'onboarding' })}
        />
        <Button
          label="Skip to App"
          variant="outline"
          onPress={skipToApp}
          style={{ marginTop: spacing.sm }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  title: { ...typography.screenTitle, marginBottom: spacing.sm, textAlign: 'center' },
  body: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xxl, lineHeight: 22 },
  buttonStack: { width: '100%' },
});