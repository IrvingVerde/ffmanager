import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, Account } from '../types';

// Usar AsyncStorage en lugar de SQLite para mejor compatibilidad cross-platform
export const initDatabase = async () => {
  try {
    console.log('Sistema de almacenamiento local inicializado (AsyncStorage)');
  } catch (error) {
    console.error('Error inicializando almacenamiento:', error);
  }
};

// ============ TRANSACCIONES LOCALES ============

export const guardarTransaccionLocal = async (transaction: Transaction) => {
  try {
    const stored = await AsyncStorage.getItem('transactions');
    const transactions: Transaction[] = stored ? JSON.parse(stored) : [];
    
    // Actualizar o agregar
    const index = transactions.findIndex(t => t.id === transaction.id);
    if (index >= 0) {
      transactions[index] = transaction;
    } else {
      transactions.unshift(transaction);
    }
    
    await AsyncStorage.setItem('transactions', JSON.stringify(transactions));
  } catch (error) {
    console.error('Error guardando transacción local:', error);
  }
};

export const obtenerTransaccionesLocales = async (): Promise<Transaction[]> => {
  try {
    const stored = await AsyncStorage.getItem('transactions');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error obteniendo transacciones locales:', error);
    return [];
  }
};

export const eliminarTransaccionLocal = async (id: string) => {
  try {
    const stored = await AsyncStorage.getItem('transactions');
    const transactions: Transaction[] = stored ? JSON.parse(stored) : [];
    const filtered = transactions.filter(t => t.id !== id);
    await AsyncStorage.setItem('transactions', JSON.stringify(filtered));
  } catch (error) {
    console.error('Error eliminando transacción local:', error);
  }
};

// ============ CUENTAS LOCALES ============

export const guardarCuentaLocal = async (account: Account) => {
  try {
    const stored = await AsyncStorage.getItem('accounts');
    const accounts: Account[] = stored ? JSON.parse(stored) : [];
    
    // Actualizar o agregar
    const index = accounts.findIndex(a => a.id === account.id);
    if (index >= 0) {
      accounts[index] = account;
    } else {
      accounts.unshift(account);
    }
    
    await AsyncStorage.setItem('accounts', JSON.stringify(accounts));
  } catch (error) {
    console.error('Error guardando cuenta local:', error);
  }
};

export const obtenerCuentasLocales = async (): Promise<Account[]> => {
  try {
    const stored = await AsyncStorage.getItem('accounts');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error obteniendo cuentas locales:', error);
    return [];
  }
};

export const eliminarCuentaLocal = async (id: string) => {
  try {
    const stored = await AsyncStorage.getItem('accounts');
    const accounts: Account[] = stored ? JSON.parse(stored) : [];
    const filtered = accounts.filter(a => a.id !== id);
    await AsyncStorage.setItem('accounts', JSON.stringify(filtered));
  } catch (error) {
    console.error('Error eliminando cuenta local:', error);
  }
};
