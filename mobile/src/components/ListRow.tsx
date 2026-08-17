import React, { ReactNode } from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/theme';
import { useSimpleMode } from '../context/SimpleModeContext';
import { getScaledTokens } from '../theme/simpleModeScale';

interface ListRowProps {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  delayLongPress?: number;
}

export function ListRow({
  title,
  subtitle,
  left,
  right,
  onPress,
  onLongPress,
  delayLongPress,
}: ListRowProps) {
  const { simpleMode } = useSimpleMode();
  const { spacing, touchTarget } = getScaledTokens(simpleMode);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={delayLongPress}
      style={[
        styles.row, 
        { paddingVertical: spacing.md, minHeight: touchTarget.minimum }
      ]}
      disabled={!onPress && !onLongPress}
    >
      {left}
      <View style={{ flex: 1, marginLeft: left ? spacing.md : 0 }}>
        <Text style={[styles.title, simpleMode && styles.titleSimple]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, simpleMode && styles.subtitleSimple]}>{subtitle}</Text> : null}
      </View>
      {right}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  title: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: colors.textPrimary 
  },
  titleSimple: { 
    fontSize: 19 
  },
  subtitle: { 
    fontSize: 13, 
    color: colors.textSecondary, 
    marginTop: 2 
  },
  subtitleSimple: { 
    fontSize: 15 
  },
});