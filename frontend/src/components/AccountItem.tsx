import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../utils/colors';
import { Account } from '../types';
import { Ionicons } from '@expo/vector-icons';

interface AccountItemProps {
  account: Account;
  onPress?: () => void;
}

export const AccountItem: React.FC<AccountItemProps> = ({ account, onPress }) => {
  const getPlatformIcon = () => {
    switch (account.plataforma) {
      case 'Facebook':
        return 'logo-facebook';
      case 'Google':
        return 'logo-google';
      case 'Twitter':
        return 'logo-twitter';
      default:
        return 'game-controller';
    }
  };

  const getStatusColor = () => {
    if (account.estado.includes('Vendida')) return colors.error;
    if (account.estado.includes('Disponible')) return colors.success;
    if (account.estado.includes('Reservada')) return colors.warning;
    return colors.info;
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: getStatusColor() + '20' }]}>
        <Ionicons name={getPlatformIcon() as any} size={24} color={getStatusColor()} />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.titulo}>{account.titulo}</Text>
        <Text style={styles.email} numberOfLines={1}>{account.email}</Text>
        {account.estado.length > 0 && (
          <View style={styles.estadosContainer}>
            {account.estado.slice(0, 2).map((estado, index) => (
              <View key={index} style={[styles.estadoBadge, { backgroundColor: getStatusColor() + '20' }]}>
                <Text style={[styles.estadoText, { color: getStatusColor() }]}>{estado}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
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
  titulo: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  estadosContainer: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  estadoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  estadoText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
