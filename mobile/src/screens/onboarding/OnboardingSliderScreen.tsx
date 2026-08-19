import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Dimensions,
  NativeSyntheticEvent, NativeScrollEvent, Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { colors, spacing, typography } from '../../theme/theme';
import { Button } from '../../components';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingSlider'>;
const { width } = Dimensions.get('window');

const SLIDES = [
  { icon: 'map-pin' as const, title: 'Getting Around', body: "Home is where you'll spend most of your time. The map shows safety reports nearby." },
  { icon: 'shield' as const, title: 'Sending an SOS', body: 'Press and hold the red button. Obhoy tries multiple redundant layers to alert your contacts.' },
  { icon: 'navigation' as const, title: 'Journey Mode', body: 'Start a journey before you head out. Obhoy checks in with you along the way.' },
  { icon: 'flag' as const, title: 'Reporting', body: 'Tap any category, confirm the location. Verified reports update the map for everyone nearby.' },
  { icon: 'camera' as const, title: 'Evidence Capture', body: 'Quietly save photo, video, or audio — encrypted and hidden inside the app.' },
];

export default function OnboardingSliderScreen({ navigation, route }: Props) {
  const isReplay = route.params?.mode === 'replay';
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    if (newIndex !== index) setIndex(newIndex);
  };

  const finish = async () => {
    if (isReplay) {
      navigation.goBack();
      return;
    }
    await SecureStore.setItemAsync('obhoy_onboarding_completed', 'true');
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  const goNext = () => {
    if (index === SLIDES.length - 1) {
      finish();
      return;
    }
    scrollRef.current?.scrollTo({ x: (index + 1) * width, animated: true });
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Feather name="chevron-left" size={26} color={colors.textPrimary} />
        </Pressable>
        <Pressable onPress={finish} hitSlop={12}>
          <Text style={styles.skipText}>{isReplay ? 'Close' : 'Skip'}</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={[styles.slide, { width }]}>
            <View style={styles.iconCircle}>
              <Feather name={slide.icon} size={48} color={colors.primary} />
            </View>
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideBody}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.bottomBar}>
        <Button
          label={index === SLIDES.length - 1 ? (isReplay ? 'Done' : 'Get Started') : 'Next'}
          variant="primary"
          onPress={goNext}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  skipText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  iconCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  slideTitle: { ...typography.screenTitle, fontSize: 22, marginBottom: spacing.sm, textAlign: 'center' },
  slideBody: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: spacing.lg },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 20 },
  bottomBar: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
});