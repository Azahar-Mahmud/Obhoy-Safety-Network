import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { Audio } from 'expo-av';
import { Feather } from '@expo/vector-icons';

import { ScreenHeader, Card } from '../components';
import { colors, spacing, typography } from '../theme/theme';
import { useLanguage } from '../i18n';

interface GuideSection {
  title: string;
  body: string;
  audioAsset?: any;
  videoUrl?: string;
}

const SECTIONS: GuideSection[] = [
  {
    title: 'Getting Around',
    body: "Home is where you'll spend most of your time — your SOS button and current journey live there. Map shows safety heatmaps nearby and lets you file reports. Directory holds emergency hotlines and this guide. Settings holds your contacts, fall detection, and preferences.",
  },
  {
    title: 'Sending an SOS',
    body: "Press and hold the red button on Home for 1 second. A short countdown gives you a moment to cancel if it was an accident. Obhoy tries multiple redundant layers (Internet, Direct SMS, Local Wi-Fi, and Bluetooth Mesh) so a weak signal won't block your alert. Your contacts receive your live GPS link, and you can call 999 directly.",
    // Sample Video & Audio links (Replace with your actual URLs/Assets when recorded)
    videoUrl: 'https://youtu.be/sample_sos_demo',
  },
  {
    title: 'Journey Mode',
    body: 'Start a journey before you head out and choose who should be notified. Obhoy checks in with you along the way — if you don\'t respond, your contacts are alerted automatically. Tap "I Arrived Safely" once you reach your destination.',
    videoUrl: 'https://youtu.be/sample_journey_demo',
  },
  {
    title: 'Reporting',
    body: "Tap any category on the Report screen — it reports instantly without lengthy forms. A floating 6-second window lets you undo if you tapped by accident. Verified reports dynamically update the community safety heatmap.",
  },
  {
    title: 'Family Sharing',
    body: "Add trusted family members to view each other's live status. Sharing requires two-way mutual consent — no one sees your location without your agreement. You can manage or pause sharing at any time.",
  },
  {
    title: 'Evidence Capture',
    body: "Tap the camera icon on Home to snap a photo or record up to 3 minutes of video evidence. You can also capture evidence directly during an active alert. Everything you capture is protected with AES encryption and kept in your private Evidence Vault — it is never saved to your phone's regular public photo gallery.",
  },
  {
    title: 'Practice Mode',
    body: "New to Obhoy? Practice Mode lets you test sending an emergency SOS and experience what a journey check-in prompt looks like without alarming your contacts. Zero real network calls or SMS messages are fired. Find it in Directory anytime.",
  },
  {
    title: 'Hardware SOS Trigger',
    body: 'Obhoy can send an alert without opening the app. Swipe down twice from the top of your screen to open Android Quick Settings, tap the pencil/edit icon, and drag "Device Care" into your active tiles. Once added, tapping it sends the same emergency alert as the SOS button — even from a locked screen.',
    videoUrl: 'https://youtu.be/sample_hardware_demo',
  },
];

export default function AppGuideScreen() {
  useLanguage();
  const [playingSection, setPlayingSection] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      // Clean up audio playback on screen unmount
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const handlePlayAudio = async (section: GuideSection) => {
    if (!section.audioAsset) return;

    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      if (playingSection === section.title) {
        setPlayingSection(null);
        return;
      }

      const { sound } = await Audio.Sound.createAsync(section.audioAsset);
      soundRef.current = sound;
      setPlayingSection(section.title);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingSection(null);
        }
      });

      await sound.playAsync();
    } catch (err) {
      console.warn('[AUDIO GUIDE] Error playing narration:', err);
      setPlayingSection(null);
    }
  };

  const handleOpenVideo = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader 
        title="How Obhoy Works" 
        subtitle="Comprehensive guide, audio narrations, and video walkthroughs" 
      />

      {SECTIONS.map((s) => (
        <Card key={s.title} style={styles.card}>
          <Text style={styles.sectionTitle}>{s.title}</Text>
          <Text style={styles.sectionBody}>{s.body}</Text>

          {/* Multimedia Buttons (Audio / Video Tiers) */}
          {(s.audioAsset || s.videoUrl) && (
            <View style={styles.mediaRow}>
              {s.audioAsset && (
                <Pressable style={styles.mediaBtn} onPress={() => handlePlayAudio(s)}>
                  <Feather 
                    name={playingSection === s.title ? 'square' : 'volume-2'} 
                    size={16} 
                    color={colors.primary} 
                  />
                  <Text style={styles.mediaLabel}>
                    {playingSection === s.title ? 'Stop Audio' : 'Listen'}
                  </Text>
                </Pressable>
              )}

              {s.videoUrl && (
                <Pressable style={styles.mediaBtn} onPress={() => handleOpenVideo(s.videoUrl!)}>
                  <Feather name="play-circle" size={16} color={colors.primary} />
                  <Text style={styles.mediaLabel}>Watch Video</Text>
                </Pressable>
              )}
            </View>
          )}
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { 
    padding: spacing.lg, 
    paddingBottom: spacing.xxl 
  },
  card: { 
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  sectionTitle: { 
    ...typography.sectionHeading, 
    color: colors.primary, 
    marginBottom: spacing.xs,
    fontSize: 18
  },
  sectionBody: { 
    ...typography.body, 
    color: colors.textSecondary,
    lineHeight: 22,
  },
  mediaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  mediaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: colors.primaryLight,
  },
  mediaLabel: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
});