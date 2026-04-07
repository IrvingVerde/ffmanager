import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { colors } from '../utils/colors';
import { TransactionItem } from '../components/TransactionItem';
import { useStore } from '../store/useStore';
import { 
  obtenerTransacciones, 
  crearTransaccion,
  obtenerResumenFinanciero 
} from '../services/api';
import { guardarTransaccionLocal, obtenerTransaccionesLocales } from '../services/database';
import { Ionicons } from '@expo/vector-icons';
import { TipoTransaccion, MonedaType, TransactionCreate } from '../types';
import { format } from 'date-fns';

export default function TransactionsScreen() {
  const { transacciones, setTransacciones, agregarTransaccion, isOnline, setResumenFinanciero } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Form state
  const [tipo, setTipo] = useState<TipoTransaccion>('ingreso');
  const [monto, setMonto] = useState('');
  const [moneda, setMoneda] = useState<MonedaType>('PEN');
  const [notas, setNotas] = useState('');

  const cargarTransacciones = async () => {
    try {
      if (isOnline) {
        const trans = await obtenerTransacciones();
        setTransacciones(trans);
        // Guardar en local
        for (const t of trans) {
          await guardarTransaccionLocal(t);
        }
      } else {
        const trans = await obtenerTransaccionesLocales();
        setTransacciones(trans);
      }
    } catch (error) {
      console.error('Error cargando transacciones:', error);
      // Cargar desde local en caso de error
      const trans = await obtenerTransaccionesLocales();
      setTransacciones(trans);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    cargarTransacciones();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    cargarTransacciones();
  };

  const handleCrearTransaccion = async () => {
    if (!monto || parseFloat(monto) <= 0) {
      Alert.alert('Error', 'Ingresa un monto v\u00e1lido');
      return;
    }

    setLoading(true);
    try {
      const nuevaTransaccion: TransactionCreate = {
        tipo,
        monto: parseFloat(monto),
        moneda,
        fecha: selectedDate.toISOString(),
        notas: notas || undefined,
      };

      const transaccionCreada = await crearTransaccion(nuevaTransaccion);
      agregarTransaccion(transaccionCreada);
      await guardarTransaccionLocal(transaccionCreada);
      
      // Actualizar resumen
      const resumen = await obtenerResumenFinanciero();
      setResumenFinanciero(resumen);
      
      // Resetear form
      setMonto('');
      setNotas('');
      setModalVisible(false);
      
      Alert.alert('\u00c9xito', 'Transacci\u00f3n creada correctamente');
    } catch (error) {
      console.error('Error creando transacci\u00f3n:', error);
      Alert.alert('Error', 'No se pudo crear la transacci\u00f3n');
    } finally {
      setLoading(false);
    }
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const formatDateHeader = (date: Date) => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${date.getDate().toString().padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Filtrar transacciones por fecha seleccionada
  const filteredTransactions = transacciones.filter(trans => {
    const transDate = new Date(trans.fecha);
    return transDate.toDateString() === selectedDate.toDateString();
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Finanzas</Text>
      </View>

      {/* Selector de fecha */}
      <View style={styles.dateSelector}>
        <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={styles.dateText}>{formatDateHeader(selectedDate)}</Text>
        
        <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateButton}>
          <Ionicons name="chevron-forward" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Lista de transacciones */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.content}>
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((trans) => (
              <TransactionItem key={trans.id} transaction={trans} />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="wallet-outline" size={80} color={colors.textMuted} />
              <Text style={styles.emptyText}>No hay transacciones</Text>
              <Text style={styles.emptySubtext}>Agrega un gasto o ingreso</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Botones flotantes - Gasto (Rojo) e Ingreso (Verde) */}
      <TouchableOpacity 
        style={[styles.fabGasto]}
        onPress={() => {
          setTipo('gasto');
          setModalVisible(true);
        }}
      >
        <Ionicons name="remove" size={24} color="#FFFFFF" />
        <Text style={styles.fabText}>Gasto</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.fabIngreso]}
        onPress={() => {
          setTipo('ingreso');
          setModalVisible(true);
        }}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
        <Text style={styles.fabText}>Ingreso</Text>
      </TouchableOpacity>

      {/* Modal para crear transacci\u00f3n */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {tipo === 'ingreso' ? 'Nuevo Ingreso' : 'Nuevo Gasto'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Moneda */}
            <Text style={styles.label}>Moneda</Text>
            <View style={styles.monedaContainer}>
              <TouchableOpacity
                style={[styles.monedaButton, moneda === 'PEN' && styles.monedaButtonActive]}
                onPress={() => setMoneda('PEN')}
              >
                <Text style={[styles.monedaText, moneda === 'PEN' && styles.monedaTextActive]}>
                  PEN (S/)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.monedaButton, moneda === 'USD' && styles.monedaButtonActive]}
                onPress={() => setMoneda('USD')}
              >
                <Text style={[styles.monedaText, moneda === 'USD' && styles.monedaTextActive]}>
                  USD ($)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Monto */}
            <Text style={styles.label}>Monto</Text>
            <TextInput
              style={styles.input}
              value={monto}
              onChangeText={setMonto}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
            />

            {/* Notas */}
            <Text style={styles.label}>Notas (opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notas}
              onChangeText={setNotas}
              placeholder="Descripci\u00f3n de la transacci\u00f3n"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
            />

            {/* Bot\u00f3n guardar */}
            <TouchableOpacity
              style={[
                styles.saveButton, 
                { backgroundColor: tipo === 'ingreso' ? colors.ingreso : colors.gasto },
                loading && styles.saveButtonDisabled
              ]}
              onPress={handleCrearTransaccion}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Guardando...' : `Guardar ${tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}`}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    padding: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundCard,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dateButton: {
    padding: 8,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  fabGasto: {
    position: 'absolute',
    right: 20,
    bottom: 160,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gasto,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    gap: 8,
  },
  fabIngreso: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.ingreso,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    gap: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.backgroundCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
  },
  monedaContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  monedaButton: {
    flex: 1,
    backgroundColor: colors.chipInactive,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  monedaButtonActive: {
    backgroundColor: colors.primary,
  },
  monedaText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.chipTextInactive,
  },
  monedaTextActive: {
    color: colors.chipTextActive,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
