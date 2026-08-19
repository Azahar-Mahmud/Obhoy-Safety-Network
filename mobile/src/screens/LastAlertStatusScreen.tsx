import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getLastAlertStatus, LastAlertStatus } from '../utils/lastAlertStatus';
import { t, useLanguage } from '../i18n';
import { ScreenHeader, Card, ListRow, Pill, Button, EmptyState } from '../components';
import { colors, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'LastAlertStatus'>;

export default function LastAlertStatusScreen({ navigation }: Props) {
  useLanguage();
  const [status, setStatus] = useState<LastAlertStatus | null>(null);
  const [checked, setChecked] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getLastAlertStatus().then((s) => {
        setStatus(s);
        setChecked(true);
      });
    }, [])
  );

  const getChannelLabel = (channel: string) => {
    if (channel === 'backend') return t('sos.channel_backend') || 'Internet & SMS Gateway';
    if (channel === 'native') return t('sos.channel_native') || 'Direct Cellular SMS';
    if (channel === 'lan') return t('sos.channel_lan') || 'Local Wi-Fi (LAN)';
    if (channel === 'mesh') return t('sos.channel_mesh') || 'Bluetooth Mesh';
    return t('sos.channel_failed') || 'Alert Failed';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader
        title={t('sos.last_alert_title') || 'Last Silent SOS Status'}
        subtitle="Verification log of your most recent background emergency alert."
      />

      {!checked ? null : !status ? (
        <EmptyState
          title={t('sos.last_alert_none') || 'No alerts recorded yet'}
          subtitle="When a Silent SOS or hardware emergency trigger fires, delivery details will be logged here."
        />
      ) : (
        <Card style={styles.statusCard}>
          <View style={styles.badgeRow}>
            <Text style={styles.sectionLabel}>DELIVERY CHANNEL</Text>
            <Pill
              label={getChannelLabel(status.channel)}
              tone={status.channel === 'failed' ? 'caution' : 'safe'}
            />
          </View>

          <View style={styles.divider} />

          <ListRow
            title={t('home.contacts') || 'Contacts Notified'}
            subtitle={`${status.contactsNotifiedCount} contact${status.contactsNotifiedCount === 1 ? '' : 's'} successfully reached`}
            left={<Feather name="users" size={20} color={colors.primary} style={styles.rowIcon} />}
          />

          <View style={styles.divider} />

          <ListRow
            title="Timestamp"
            subtitle={status.sentAt ? new Date(status.sentAt).toLocaleString() : 'Unknown'}
            left={<Feather name="clock" size={20} color={colors.primary} style={styles.rowIcon} />}
          />

          {status.error ? (
            <>
              <View style={styles.divider} />
              <ListRow
                title="Error Note"
                subtitle={status.error}
                left={<Feather name="alert-circle" size={20} color={colors.caution} style={styles.rowIcon} />}
              />
            </>
          ) : null}
        </Card>
      )}

      <View style={styles.buttonWrap}>
        <Button
          label={t('common.back') || 'Go Back'}
          variant="primary"
          onPress={() => navigation.goBack()}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 },
  statusCard: { padding: spacing.lg, marginBottom: spacing.xl },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  rowIcon: { marginRight: spacing.sm },
  buttonWrap: { marginTop: 'auto', paddingTop: spacing.md },
});