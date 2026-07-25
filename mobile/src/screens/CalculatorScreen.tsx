import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useDiscreetMode } from '../context/DiscreetModeContext';

const ROWS: string[][] = [['7', '8', '9', '÷'], ['4', '5', '6', '×'], ['1', '2', '3', '−'], ['C', '0', '=', '+']];
const OPERATORS = ['+', '−', '×', '÷'];

function compute(a: number, b: number, op: string): number {
  switch (op) { case '+': return a + b; case '−': return a - b; case '×': return a * b; case '÷': return b === 0 ? 0 : a / b; default: return b; }
}

export default function CalculatorScreen() {
  const { unlock } = useDiscreetMode();
  const [display, setDisplay] = useState('0');
  const [digitsOnly, setDigitsOnly] = useState('');
  const [hasOperator, setHasOperator] = useState(false);
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [pendingOp, setPendingOp] = useState<string | null>(null);

  const resetEntry = () => { setDigitsOnly(''); setHasOperator(false); setPreviousValue(null); setPendingOp(null); };

  const pressDigit = (d: string) => { setDisplay(display === '0' ? d : display + d); if (!hasOperator) setDigitsOnly(digitsOnly + d); };

  const pressOperator = (op: string) => { setPreviousValue(parseFloat(display)); setPendingOp(op); setHasOperator(true); setDisplay('0'); };

  const pressEquals = async () => {
    if (!hasOperator) {
      const success = await unlock(digitsOnly);
      if (success) return; 
      resetEntry();
      return;
    }
    if (previousValue !== null && pendingOp) setDisplay(String(compute(previousValue, parseFloat(display), pendingOp)));
    resetEntry();
  };

  const pressClear = () => { setDisplay('0'); resetEntry(); };

  const press = (label: string) => {
    if (label === 'C') return pressClear();
    if (label === '=') return pressEquals();
    if (OPERATORS.includes(label)) return pressOperator(label);
    return pressDigit(label);
  };

  return (
    <View style={styles.container}>
      <View style={styles.displayBox}><Text style={styles.displayText} numberOfLines={1} adjustsFontSizeToFit>{display}</Text></View>
      {ROWS.map((row, i) => (
        <View key={i} style={styles.row}>
          {row.map((label) => (
            <TouchableOpacity key={label} style={styles.key} onPress={() => press(label)}><Text style={styles.keyText}>{label}</Text></TouchableOpacity>
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
  key: { flex: 1, backgroundColor: '#374151', margin: 4, borderRadius: 8, paddingVertical: 20, alignItems: 'center' },
  keyText: { color: '#fff', fontSize: 22 },
});