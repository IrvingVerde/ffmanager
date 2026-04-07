import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../utils/colors';
import { Transaction } from '../types';
import { formatCurrency, formatDate } from '../utils/format';
import { Ionicons } from '@expo/vector-icons';

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, onPress }) => {
  const getIcon = () => {
    switch (transaction.tipo) {
      case 'ingreso':
        return 'arrow-down-circle';
      case 'gasto':
        return 'arrow-up-circle';
      case 'inversion':
        return 'trending-up';
    }
  };

  const getColor = () => {
    switch (transaction.tipo) {
      case 'ingreso':
        return colors.ingreso;
      case 'gasto':
        return colors.gasto;
      case 'inversion':
        return colors.inversion;
    }
  };

  const getTipoLabel = () => {
    switch (transaction.tipo) {
      case 'ingreso':
        return 'Ingreso';
      case 'gasto':
        return 'Gasto';
      case 'inversion':
        return 'Inversión';
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: getColor() + '20' }]}>
        <Ionicons name={getIcon() as any} size={24} color={getColor()} />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.tipo}>{getTipoLabel()}</Text>
        <Text style={styles.fecha}>{formatDate(transaction.fecha)}</Text>
        {transaction.notas && (
          <Text style={styles.notas} numberOfLines={1}>{transaction.notas}</Text>
        )}
      </View>
      
      <View style={styles.amountContainer}>
        <Text style={[styles.amount, { color: getColor() }]}>
          {formatCurrency(transaction.monto, transaction.moneda)}
        </Text>
        <Text style={styles.moneda}>{transaction.moneda}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  tipo: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  fecha: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  notas: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  moneda: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
});
