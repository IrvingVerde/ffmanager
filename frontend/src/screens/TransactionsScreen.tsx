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

export default function TransactionsScreen() {
  const { transacciones, setTransacciones, agregarTransaccion, isOnline, setResumenFinanciero } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  
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
      Alert.alert('Error', 'Ingresa un monto válido');
      return;
    }

    setLoading(true);
    try {
      const nuevaTransaccion: TransactionCreate = {
        tipo,
        monto: parseFloat(monto),
        moneda,
        fecha: new Date().toISOString(),
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
      
      Alert.alert('Éxito', 'Transacción creada correctamente');
    } catch (error) {
      console.error('Error creando transacción:', error);
      Alert.alert('Error', 'No se pudo crear la transacción');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transacciones</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

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
          {transacciones.length > 0 ? (
            transacciones.map((trans) => (
              <TransactionItem key={trans.id} transaction={trans} />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color={colors.textMuted} />
              <Text style={styles.emptyText}>No hay transacciones</Text>
              <Text style={styles.emptySubtext}>Presiona el botón + para agregar una</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal para crear transacción */}
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
              <Text style={styles.modalTitle}>Nueva Transacción</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Tipo de transacción */}
            <Text style={styles.label}>Tipo</Text>
            <View style={styles.tipoContainer}>
              <TouchableOpacity
                style={[styles.tipoButton, tipo === 'ingreso' && styles.tipoButtonActive]}
                onPress={() => setTipo('ingreso')}
              >
                <Text style={[styles.tipoText, tipo === 'ingreso' && styles.tipoTextActive]}>
                  Ingreso
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tipoButton, tipo === 'gasto' && styles.tipoButtonActive]}
                onPress={() => setTipo('gasto')}
              >
                <Text style={[styles.tipoText, tipo === 'gasto' && styles.tipoTextActive]}>
                  Gasto
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tipoButton, tipo === 'inversion' && styles.tipoButtonActive]}
                onPress={() => setTipo('inversion')}
              >
                <Text style={[styles.tipoText, tipo === 'inversion' && styles.tipoTextActive]}>
                  Inversión
                </Text>
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
              placeholder="Descripción de la transacción"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
            />

            {/* Botón guardar */}
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleCrearTransaccion}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Guardando...' : 'Guardar Transacción'}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 0,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
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
  modalContainer: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.backgroundSecondary,
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
  tipoContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tipoButton: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  tipoButtonActive: {
    backgroundColor: colors.primary,
  },
  tipoText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tipoTextActive: {
    color: colors.text,
  },
  monedaContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  monedaButton: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
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
    color: colors.textSecondary,
  },
  monedaTextActive: {
    color: colors.text,
  },
  input: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: colors.primary,
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
    color: colors.text,
  },
});
