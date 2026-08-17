import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useDiscreetMode } from '../context/DiscreetModeContext';

const ROWS: string[][] = [
  ['7', '8', '9', '÷'],
  ['4', '5', '6', '×'],
  ['1', '2', '3', '−'],
  ['C', '0', '=', '+'],
];

const OPERATORS = ['+', '−', '×', '÷'];

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
  
  // Decoupled background digit trace (capped at last 20 digits pressed)
  const digitTrace = useRef<string>('');

  const pressDigit = (digit: string) => {
    digitTrace.current = (digitTrace.current + digit).slice(-20);

    setCalc((state) => {
      if (state.shouldResetDisplay) {
        return { ...state, display: digit, shouldResetDisplay: false };
      }
      if (state.display === '0') {
        return { ...state, display: digit };
      }
      return { ...state, display: state.display + digit };
    });
  };

  const pressOperator = (operator: string) => {
    setCalc((state) => {
      const current = parseFloat(state.display);
      if (state.previousValue !== null && state.pendingOperator) {
        const result = compute(state.previousValue, current, state.pendingOperator);
        return {
          display: String(result),
          previousValue: result,
          pendingOperator: operator,
          shouldResetDisplay: true,
        };
      }
      return {
        ...state,
        previousValue: current,
        pendingOperator: operator,
        shouldResetDisplay: true,
      };
    });
  };

  const pressEquals = async () => {
    const trace = digitTrace.current;
    
    // Check possible 4, 5, or 6 digit PIN suffixes from the hidden trace
    for (const len of [4, 5, 6]) {
      if (trace.length >= len) {
        const candidatePin = trace.slice(-len);
        const unlocked = await unlock(candidatePin);
        if (unlocked) {
          digitTrace.current = '';
          setCalc(INITIAL_STATE);
          return;
        }
      }
    }

    // If not unlocked, execute genuine math calculation
    setCalc((state) => {
      if (state.previousValue === null || !state.pendingOperator) return state;
      const current = parseFloat(state.display);
      const result = compute(state.previousValue, current, state.pendingOperator);
      return {
        display: String(result),
        previousValue: null,
        pendingOperator: null,
        shouldResetDisplay: true,
      };
    });
  };

  const pressClear = () => {
    digitTrace.current = '';
    setCalc(INITIAL_STATE);
  };

  const press = (label: string) => {
    if (label === 'C') return pressClear();
    if (label === '=') return pressEquals();
    if (OPERATORS.includes(label)) return pressOperator(label);
    return pressDigit(label);
  };

  return (
    <View style={styles.container}>
      <View style={styles.displayBox}>
        <Text style={styles.displayText} numberOfLines={1} adjustsFontSizeToFit>
          {calc.display}
        </Text>
      </View>
      {ROWS.map((row, i) => (
        <View key={i} style={styles.row}>
          {row.map((label) => (
            <TouchableOpacity 
              key={label} 
              style={[styles.key, OPERATORS.includes(label) && styles.operatorKey, label === '=' && styles.equalsKey]} 
              onPress={() => press(label)}
              activeOpacity={0.7}
            >
              <Text style={styles.keyText}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827', justifyContent: 'flex-end', padding: 12 },
  displayBox: { paddingHorizontal: 20, paddingVertical: 32, alignItems: 'flex-end' },
  displayText: { color: '#fff', fontSize: 48, fontWeight: '300' },
  row: { flexDirection: 'row', marginBottom: 8 },
  key: { flex: 1, backgroundColor: '#374151', margin: 4, borderRadius: 8, paddingVertical: 20, alignItems: 'center', justifyContent: 'center' },
  operatorKey: { backgroundColor: '#4B5563' },
  equalsKey: { backgroundColor: '#2563EB' },
  keyText: { color: '#fff', fontSize: 24, fontWeight: '500' },
});