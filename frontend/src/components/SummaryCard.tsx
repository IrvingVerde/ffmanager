import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../utils/colors';
import { MonedaType } from '../types';
import { formatCurrency } from '../utils/format';

interface SummaryCardProps {
  title: string;
  amountPEN: number;
  amountUSD: number;
  color: string;
  icon?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, amountPEN, amountUSD, color }) => {
  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.amounts}>
        <View style={styles.amountRow}>
          <Text style={styles.currency}>PEN</Text>
          <Text style={[styles.amount, { color }]}>{formatCurrency(amountPEN, 'PEN')}</Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.currency}>USD</Text>
          <Text style={[styles.amount, { color }]}>{formatCurrency(amountUSD, 'USD')}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amounts: {
    gap: 8,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currency: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
