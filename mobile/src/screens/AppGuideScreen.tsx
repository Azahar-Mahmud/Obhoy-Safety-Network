import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { ScreenHeader, Card } from '../components';
import { colors, spacing, typography } from '../theme/theme';

const SECTIONS = [
  {
    title: 'Getting Around',
    body: "Home is where you'll spend most of your time — your SOS button and current journey live there. Map shows safety heatmaps nearby and lets you file reports. Directory holds emergency hotlines and this guide. Settings holds your contacts, fall detection, and preferences.",
  },
  {
    title: 'Sending an SOS',
    body: "Press and hold the red button on Home for 1 second. A short countdown gives you a moment to cancel if it was an accident. Obhoy tries multiple redundant layers (Internet, Direct SMS, Local Wi-Fi, and Bluetooth Mesh) so a weak signal won't block your alert. Your contacts receive your live GPS link, and you can call 999 directly.",
  },
  {
    title: 'Journey Mode',
    body: 'Start a journey before you head out and choose who should be notified. Obhoy checks in with you along the way — if you don\'t respond, your contacts are alerted automatically. Tap "I Arrived Safely" once you reach your destination.',
  },
  {
    title: 'Reporting',
    body: "Tap any category on the Report screen — it reports instantly without lengthy forms. A floating 6-second window lets you undo if you tapped by accident. Verified reports dynamically update the community safety heatmap.",
  },
  {
    title: 'Family Sharing',
    body: "Add trusted family members to view each other's live status. Sharing requires two-way mutual consent — no one sees your location without your agreement. You can manage or pause sharing at any time.",
  },
];

export default function AppGuideScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ScreenHeader title="How Obhoy Works" subtitle="A quick guide to staying safe" />
      {SECTIONS.map((s) => (
        <Card key={s.title} style={styles.card}>
          <Text style={styles.sectionTitle}>{s.title}</Text>
          <Text style={styles.sectionBody}>{s.body}</Text>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { 
    padding: spacing.lg, 
    paddingBottom: spacing.xxl, 
    backgroundColor: '#FAFAFA' 
  },
  card: { 
    marginBottom: spacing.md 
  },
  sectionTitle: { 
    ...typography.sectionHeading, 
    color: colors.primary, 
    marginBottom: spacing.xs,
    fontSize: 18
  },
  sectionBody: { 
    ...typography.body, 
    color: colors.textSecondary 
  },
});