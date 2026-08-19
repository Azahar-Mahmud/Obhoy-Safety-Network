import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useDiscreetMode } from '../context/DiscreetModeContext';
import { colors, radii } from '../theme/theme';

const ROWS: string[][] = [
  ['AC', '±', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '='] // 0 spans two columns
];

const OPERATORS = ['+', '−', '×', '÷', '%', '±'];

type CalcState = {
  display: string;
  previousValue: number | null;
  pendingOperator: string | null;
  shouldResetDisplay: boolean;
};

const INITIAL_STATE: CalcState = {
  display: '0',
  previousValue: null,
  pendingOperator: null,
  shouldResetDisplay: false,
};

function compute(a: number, b: number, operator: string): number {
  switch (operator) {
    case '+': return a + b;
    case '−': return a - b;
    case '×': return a * b;
    case '÷': return b !== 0 ? a / b : 0;
    default: return b;
  }
}

export default function CalculatorScreen() {
  const { unlock } = useDiscreetMode();
  const [calc, setCalc] = useState<CalcState>(INITIAL_STATE);
  
  const digitTrace = useRef<string>('');

  const pressDigit = (digit: string) => {
    if (digit !== '.') digitTrace.current = (digitTrace.current + digit).slice(-20);

    setCalc((state) => {
      if (state.shouldResetDisplay) return { ...state, display: digit, shouldResetDisplay: false };
      if (state.display === '0' && digit !== '.') return { ...state, display: digit };
      return { ...state, display: state.display + digit };
    });
  };

  const pressOperator = (operator: string) => {
    setCalc((state) => {
      const current = parseFloat(state.display);
      if (state.previousValue !== null && state.pendingOperator) {
        const result = compute(state.previousValue, current, state.pendingOperator);
        return { display: String(result), previousValue: result, pendingOperator: operator, shouldResetDisplay: true };
      }
      return { ...state, previousValue: current, pendingOperator: operator, shouldResetDisplay: true };
    });
  };

  const pressEquals = async () => {
    const trace = digitTrace.current;
    
    // Check possible PIN
    for (const len of [4, 5, 6]) {
      if (trace.length >= len) {
        const candidatePin = trace.slice(-len);
        const unlocked = await unlock(candidatePin);
        if (unlocked) {
          digitTrace.current = ''; setCalc(INITIAL_STATE); return;
        }
      }
    }

    setCalc((state) => {
      if (state.previousValue === null || !state.pendingOperator) return state;
      const current = parseFloat(state.display);
      const result = compute(state.previousValue, current, state.pendingOperator);
      return { display: String(Math.round(result * 10000) / 10000), previousValue: null, pendingOperator: null, shouldResetDisplay: true };
    });
  };

  const pressClear = () => { digitTrace.current = ''; setCalc(INITIAL_STATE); };

  const press = (label: string) => {
    if (label === 'AC') return pressClear();
    if (label === '=') return pressEquals();
    if (OPERATORS.includes(label)) return pressOperator(label);
    return pressDigit(label);
  };

  return (
    <View style={styles.container}>
      <View style={styles.displayBox}>
        <Text style={styles.displayText} numberOfLines={1} adjustsFontSizeToFit>{calc.display}</Text>
      </View>
      <View style={styles.calcGrid}>
        {ROWS.map((row, i) => (
          <View key={i} style={styles.row}>
            {row.map((label) => (
              <TouchableOpacity 
                key={label} 
                style={[
                  styles.key, 
                  OPERATORS.includes(label) && styles.operatorKey, 
                  label === '=' && styles.equalsKey,
                  label === '0' && { flex: 2.1 }
                ]} 
                onPress={() => press(label)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.keyText,
                  OPERATORS.includes(label) && styles.operatorKeyText,
                  label === '=' && { color: '#fff' }
                ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, justifyContent: 'flex-end' },
  displayBox: { paddingHorizontal: 22, paddingVertical: 34, alignItems: 'flex-end', minHeight: 150, justifyContent: 'flex-end' },
  displayText: { color: colors.text, fontSize: 56, fontWeight: '300', fontFamily: 'monospace' },
  calcGrid: { paddingHorizontal: 16, paddingBottom: 32 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  key: { flex: 1, backgroundColor: colors.inputBg, borderRadius: radii.lg, paddingVertical: 22, alignItems: 'center', justifyContent: 'center' },
  operatorKey: { backgroundColor: colors.primaryLight },
  equalsKey: { backgroundColor: colors.primary },
  keyText: { color: colors.text, fontSize: 24, fontWeight: '600' },
  operatorKeyText: { color: colors.primary, fontWeight: '800' },
});