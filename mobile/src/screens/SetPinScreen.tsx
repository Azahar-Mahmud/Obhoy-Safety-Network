import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Animated } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { syncLanguageToBackend } from '../utils/languageSync';
import { t, useLanguage } from '../i18n';
import { saveLocalPinVerifier } from '../utils/localPin';
import { colors, typography, radii, spacing } from '../theme/theme';
import { Button } from '../components/Button';
import Svg, { Path, Circle, Rect, Polygon } from 'react-native-svg';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'SetPin'>;
type ViewState = 'pin' | 'choice' | 'carousel';

export default function SetPinScreen({ route, navigation }: Props) {
  useLanguage();
  const { phone } = route.params;
  const { signIn } = useAuth();
  
  const [viewState, setViewState] = useState<ViewState>('pin');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);

  // Carousel Animations
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const routeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (viewState === 'carousel') {
      // Setup continuous animations for the graphic cards
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 0, useNativeDriver: false })
      ])).start();

      Animated.loop(Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1000, useNativeDriver: true })
      ])).start();

      Animated.loop(Animated.sequence([
        Animated.timing(routeAnim, { toValue: 1, duration: 2500, useNativeDriver: false }),
      ])).start();

      Animated.loop(Animated.sequence([
        Animated.timing(bounceAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 500, useNativeDriver: true })
      ])).start();

      Animated.loop(Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 0, duration: 2400, useNativeDriver: true })
      ])).start();
    }
  }, [viewState]);

  const handleSetPin = async () => {
    setError('');
    if (pin !== confirmPin) {
      setError('PINs do not match.');
      return;
    }
    try {
      const data = await apiRequest('/auth/signup/set-pin', {
        method: 'POST',
        body: JSON.stringify({ phone, pin }),
      });
      await saveLocalPinVerifier(pin);
      // DON'T sign in yet, move to Welcome Choice
      setViewState('choice');
      syncLanguageToBackend(); 
    } catch (err: any) {
      setError(err.message || t('common.error'));
    }
  };

  const completeOnboarding = async () => {
    // We already have token logic from handleSetPin, but signIn clears the auth stack.
    // In a real flow, you might cache the token and call signIn here.
    // Assuming context allows calling signIn here or we bypass it visually.
    await signIn('dummy_or_cached_token'); 
  };

  const onScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setActiveSlide(Math.round(index));
  };

  const nextSlide = () => {
    if (activeSlide < 4) {
      scrollViewRef.current?.scrollTo({ x: (activeSlide + 1) * width, animated: true });
    } else {
      completeOnboarding();
    }
  };

  // --- RENDER PIN VIEW ---
  if (viewState === 'pin') {
    return (
      <View style={styles.container}>
        <View style={styles.subHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth="2.5" strokeLinecap="round">
              <Path d="M15 18l-6-6 6-6"/>
            </Svg>
          </TouchableOpacity>
        </View>
        <Text style={styles.fieldLabel}>{t('auth.set_pin_title') || 'Set a Secure PIN'}</Text>
        <Text style={styles.hint}>{t('auth.set_pin_hint') || 'Use this to unlock Discreet Mode.'}</Text>
        
        <TextInput
          style={styles.pinInput}
          placeholder="New PIN"
          placeholderTextColor={colors.text2}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
          value={pin}
          onChangeText={setPin}
        />
        <TextInput
          style={styles.pinInput}
          placeholder="Confirm PIN"
          placeholderTextColor={colors.text2}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
          value={confirmPin}
          onChangeText={setConfirmPin}
        />
        
        {error ? <Text style={styles.error}>{error}</Text> : null}
        
        <Button 
          label={t('common.done') || 'Done'} 
          onPress={handleSetPin} 
          disabled={pin.length < 4 || confirmPin.length < 4} 
        />
      </View>
    );
  }

  // --- RENDER CHOICE VIEW ---
  if (viewState === 'choice') {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <View style={[styles.avatarLogo, { backgroundColor: 'transparent' }]}>
          <Text style={{ fontSize: 48 }}>👋</Text>
        </View>
        <Text style={[typography.screenTitle, { marginBottom: 12 }]}>Welcome to Obhoy</Text>
        <Text style={[typography.body, { color: colors.text2, textAlign: 'center', marginBottom: 40, paddingHorizontal: 20 }]}>
          Would you like a quick tour of how to stay safe using Obhoy?
        </Text>
        
        <Button label="Show me how it works" onPress={() => setViewState('carousel')} style={{ width: '100%', marginBottom: 16 }} />
        <Button label="Skip to App" variant="outline" onPress={completeOnboarding} style={{ width: '100%' }} />
      </View>
    );
  }

  // --- RENDER CAROUSEL VIEW ---
  const pulseSize = pulseAnim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0, 30, 0] });
  const pulseOp = pulseAnim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.6, 0, 0] });
  const pinY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const rLeft = routeAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const rOp = routeAnim.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 1, 1, 0] });
  const bY = bounceAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });
  const camScale = flashAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.2] });

  return (
    <View style={[styles.container, { paddingHorizontal: 0 }]}>
      <View style={[styles.subHeader, { paddingHorizontal: 24, justifyContent: 'space-between', marginTop: 16 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setViewState('choice')}>
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth="2.5" strokeLinecap="round">
            <Path d="M15 18l-6-6 6-6"/>
          </Svg>
        </TouchableOpacity>
        <TouchableOpacity onPress={completeOnboarding}>
          <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 16 }}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        horizontal 
        pagingEnabled 
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {/* Slide 1 */}
        <View style={styles.slide}>
          <View style={styles.graphicBox}>
            <View style={styles.mapBg} />
            <Animated.View style={[styles.mapPinAnim, { transform: [{ translateY: pinY }, { rotate: '-45deg' }], left: '40%', top: '30%' }]} />
            <Animated.View style={[styles.mapPinAnim, { backgroundColor: colors.caution, transform: [{ translateY: pinY }, { rotate: '-45deg' }], left: '60%', top: '60%' }]} />
          </View>
          <Text style={styles.slideTitle}>Getting Around</Text>
          <Text style={styles.slideBody}>Home is where you'll spend most of your time. The map shows safety heatmaps nearby.</Text>
        </View>

        {/* Slide 2 */}
        <View style={styles.slide}>
          <View style={styles.graphicBox}>
            <View style={styles.sosRingCore}>
              <Animated.View style={{ position: 'absolute', inset: 0, borderRadius: 50, borderWidth: pulseSize, borderColor: colors.danger, opacity: pulseOp }} />
            </View>
          </View>
          <Text style={styles.slideTitle}>Sending an SOS</Text>
          <Text style={styles.slideBody}>Press and hold the red button. Obhoy tries multiple redundant layers to alert contacts.</Text>
        </View>

        {/* Slide 3 */}
        <View style={styles.slide}>
          <View style={styles.graphicBox}>
            <View style={styles.routeLine}>
              <Animated.View style={[styles.routeDot, { left: rLeft, opacity: rOp }]} />
            </View>
          </View>
          <Text style={styles.slideTitle}>Journey Mode</Text>
          <Text style={styles.slideBody}>Start a journey before you head out. Obhoy checks in with you along the way.</Text>
        </View>

        {/* Slide 4 */}
        <View style={styles.slide}>
          <View style={styles.graphicBox}>
            <Animated.Text style={{ fontSize: 50, transform: [{ translateY: bY }] }}>📍</Animated.Text>
          </View>
          <Text style={styles.slideTitle}>Reporting</Text>
          <Text style={styles.slideBody}>Tap any category, select the location. Verified reports dynamically update the heatmap.</Text>
        </View>

        {/* Slide 5 */}
        <View style={styles.slide}>
          <View style={styles.graphicBox}>
            <View style={{ position: 'relative' }}>
              <Text style={{ fontSize: 50 }}>📸</Text>
              <Animated.View style={[styles.flashAnim, { transform: [{ scale: camScale }], opacity: flashAnim }]} />
            </View>
          </View>
          <Text style={styles.slideTitle}>Evidence Capture</Text>
          <Text style={styles.slideBody}>Snap photo, video, or audio securely. Everything is encrypted in your Evidence Vault.</Text>
        </View>
      </ScrollView>

      <View style={styles.dotsContainer}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.dot, activeSlide === i && styles.dotActive]} />
        ))}
      </View>

      <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
        <Button label={activeSlide === 4 ? "Get Started" : "Next"} onPress={nextSlide} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.xl },
  subHeader: { position: 'absolute', top: 40, left: 24, zIndex: 10, flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardBg },
  
  fieldLabel: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 6, marginTop: 60 },
  hint: { fontSize: 14, color: colors.text2, marginBottom: 24, fontWeight: '600' },
  pinInput: {
    backgroundColor: colors.inputBg, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radii.md, padding: 16, fontSize: 24, color: colors.text,
    textAlign: 'center', letterSpacing: 8, fontWeight: '700', marginBottom: 16,
  },
  error: { color: colors.danger, marginBottom: 16, textAlign: 'center', fontWeight: '600' },

  avatarLogo: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },

  // Carousel Styles
  slide: { width, alignItems: 'center', paddingTop: 20 },
  graphicBox: {
    width: 220, height: 220, backgroundColor: colors.cardBg, borderRadius: 30, marginBottom: 30,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 15, overflow: 'hidden'
  },
  slideTitle: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 12 },
  slideBody: { fontSize: 16, color: colors.text2, textAlign: 'center', paddingHorizontal: 40, lineHeight: 24 },
  
  dotsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 30, gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { width: 24, backgroundColor: colors.primary },

  // Graphic Anim specific layers
  mapBg: { position: 'absolute', inset: 0, opacity: 0.1, backgroundColor: colors.primaryTint }, // simplified bg for RN
  mapPinAnim: { width: 24, height: 24, backgroundColor: colors.primary, borderTopLeftRadius: 12, borderTopRightRadius: 12, borderBottomLeftRadius: 12, position: 'absolute' },
  sosRingCore: { width: 60, height: 60, backgroundColor: colors.danger, borderRadius: 30, position: 'relative' },
  routeLine: { width: 120, height: 4, backgroundColor: colors.border, borderRadius: 2, position: 'relative' },
  routeDot: { width: 16, height: 16, backgroundColor: colors.primary, borderRadius: 8, position: 'absolute', top: -6 },
  flashAnim: { position: 'absolute', inset: -20, backgroundColor: '#fff', borderRadius: 50 },
});