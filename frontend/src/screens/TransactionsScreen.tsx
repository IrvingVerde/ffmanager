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
  actualizarTransaccion,
  eliminarTransaccion,
  obtenerResumenFinanciero 
} from '../services/api';
import { guardarTransaccionLocal, obtenerTransaccionesLocales, eliminarTransaccionLocal } from '../services/database';
import { Ionicons } from '@expo/vector-icons';
import { TipoTransaccion, MonedaType, TransactionCreate } from '../types';

export default function TransactionsScreen() {
  const { transacciones, setTransacciones, agregarTransaccion, eliminarTransaccionStore, isOnline, setResumenFinanciero } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Form state
  const [tipo, setTipo] = useState<TipoTransaccion>('ingreso');
  const [monto, setMonto] = useState('');
  const [moneda, setMoneda] = useState<MonedaType>('PEN');
  const [notas, setNotas] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const cargarTransacciones = async () => {
    try {
      if (isOnline) {
        const trans = await obtenerTransacciones();
        setTransacciones(trans);
        for (const t of trans) {
          await guardarTransaccionLocal(t);
        }
      } else {
        const trans = await obtenerTransaccionesLocales();
        setTransacciones(trans);
      }
    } catch (error) {
      console.error('Error cargando transacciones:', error);
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
        fecha: selectedDate.toISOString(),
        notas: notas || undefined,
      };

      const transaccionCreada = await crearTransaccion(nuevaTransaccion);
      agregarTransaccion(transaccionCreada);
      await guardarTransaccionLocal(transaccionCreada);
      
      const resumen = await obtenerResumenFinanciero();
      setResumenFinanciero(resumen);
      
      resetForm();
      setModalVisible(false);
      
      Alert.alert('Éxito', 'Transacción creada correctamente');
    } catch (error) {
      console.error('Error creando transacción:', error);
      Alert.alert('Error', 'No se pudo crear la transacción');
    } finally {
      setLoading(false);
    }
  };

  const handleActualizarTransaccion = async () => {
    if (!editingId || !monto || parseFloat(monto) <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido');
      return;
    }

    setLoading(true);
    try {
      const transaccionActualizada: TransactionCreate = {
        tipo,
        monto: parseFloat(monto),
        moneda,
        fecha: selectedDate.toISOString(),
        notas: notas || undefined,
      };

      await actualizarTransaccion(editingId, transaccionActualizada);
      await cargarTransacciones();
      
      const resumen = await obtenerResumenFinanciero();
      setResumenFinanciero(resumen);
      
      resetForm();
      setEditModalVisible(false);
      
      Alert.alert('Éxito', 'Transacción actualizada');
    } catch (error) {
      console.error('Error actualizando transacción:', error);
      Alert.alert('Error', 'No se pudo actualizar');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarTransaccion = async () => {
    if (!editingId) return;

    Alert.alert(
      'Confirmar',
      '¿Eliminar esta transacción?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarTransaccion(editingId);
              eliminarTransaccionStore(editingId);
              await eliminarTransaccionLocal(editingId);
              
              const resumen = await obtenerResumenFinanciero();
              setResumenFinanciero(resumen);
              
              resetForm();
              setEditModalVisible(false);
              
              Alert.alert('Éxito', 'Transacción eliminada');
            } catch (error) {
              console.error('Error eliminando:', error);
              Alert.alert('Error', 'No se pudo eliminar');
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setMonto('');
    setNotas('');
    setEditingId(null);
  };

  const abrirEdicion = (trans: any) => {
    setEditingId(trans.id);
    setTipo(trans.tipo);
    setMonto(trans.monto.toString());
    setMoneda(trans.moneda);
    setNotas(trans.notas || '');
    setSelectedDate(new Date(trans.fecha));
    setEditModalVisible(true);
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

  const filteredTransactions = transacciones.filter(trans => {
    const transDate = new Date(trans.fecha);
    return transDate.toDateString() === selectedDate.toDateString();
  });

  const renderFormulario = (esEdicion: boolean) => (
    <View style={styles.modalContent}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>
          {esEdicion ? 'Editar Transacción' : tipo === 'ingreso' ? 'Nuevo Ingreso' : 'Nuevo Gasto'}
        </Text>
        <TouchableOpacity onPress={() => {
          esEdicion ? setEditModalVisible(false) : setModalVisible(false);
          resetForm();
        }}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
      </View>

      {!esEdicion && (
        <>
          <Text style={styles.label}>Tipo</Text>
          <View style={styles.tipoContainer}>
            <TouchableOpacity
              style={[styles.tipoButton, tipo === 'ingreso' && styles.tipoButtonIngreso]}
              onPress={() => setTipo('ingreso')}
            >
              <Text style={[styles.tipoText, tipo === 'ingreso' && styles.tipoTextActive]}>Ingreso</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tipoButton, tipo === 'gasto' && styles.tipoButtonGasto]}
              onPress={() => setTipo('gasto')}
            >
              <Text style={[styles.tipoText, tipo === 'gasto' && styles.tipoTextActive]}>Gasto</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <Text style={styles.label}>Moneda</Text>
      <View style={styles.monedaContainer}>
        <TouchableOpacity
          style={[styles.monedaButton, moneda === 'PEN' && styles.monedaButtonActive]}
          onPress={() => setMoneda('PEN')}
        >
          <Text style={[styles.monedaText, moneda === 'PEN' && styles.monedaTextActive]}>PEN (S/)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.monedaButton, moneda === 'USD' && styles.monedaButtonActive]}
          onPress={() => setMoneda('USD')}
        >
          <Text style={[styles.monedaText, moneda === 'USD' && styles.monedaTextActive]}>USD ($)</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Monto</Text>
      <TextInput
        style={styles.input}
        value={monto}
        onChangeText={setMonto}
        placeholder="0.00"
        placeholderTextColor={colors.textMuted}
        keyboardType="decimal-pad"
      />

      <Text style={styles.label}>Notas (opcional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={notas}
        onChangeText={setNotas}
        placeholder="Descripción..."
        placeholderTextColor={colors.textMuted}
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity
        style={[
          styles.saveButton, 
          { backgroundColor: tipo === 'ingreso' ? colors.ingreso : colors.gasto },
          loading && styles.saveButtonDisabled
        ]}
        onPress={esEdicion ? handleActualizarTransaccion : handleCrearTransaccion}
        disabled={loading}
      >
        <Text style={styles.saveButtonText}>
          {loading ? 'Guardando...' : esEdicion ? 'Actualizar' : `Guardar ${tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}`}
        </Text>
      </TouchableOpacity>

      {esEdicion && (
        <TouchableOpacity style={styles.deleteButton} onPress={handleEliminarTransaccion}>
          <Ionicons name="trash" size={20} color="#FFFFFF" />
          <Text style={styles.deleteButtonText}>Eliminar</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Finanzas</Text>
      </View>

      <View style={styles.dateSelector}>
        <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={styles.dateText}>{formatDateHeader(selectedDate)}</Text>
        
        <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateButton}>
          <Ionicons name="chevron-forward" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.content}>
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((trans) => (
              <TouchableOpacity key={trans.id} onPress={() => abrirEdicion(trans)}>
                <TransactionItem transaction={trans} />
              </TouchableOpacity>
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

      <TouchableOpacity 
        style={styles.fabGasto}
        onPress={() => {
          setTipo('gasto');
          setModalVisible(true);
        }}
      >
        <Ionicons name="remove" size={24} color="#FFFFFF" />
        <Text style={styles.fabText}>Gasto</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.fabIngreso}
        onPress={() => {
          setTipo('ingreso');
          setModalVisible(true);
        }}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
        <Text style={styles.fabText}>Ingreso</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          {renderFormulario(false)}
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={editModalVisible} animationType="slide" transparent={true} onRequestClose={() => setEditModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          {renderFormulario(true)}
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, padding: 20, paddingTop: 60, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
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
  dateButton: { padding: 8 },
  dateText: { fontSize: 18, fontWeight: '600', color: colors.text },
  scrollView: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 80 },
  emptyText: { fontSize: 18, fontWeight: '600', color: colors.text, marginTop: 16 },
  emptySubtext: { fontSize: 14, color: colors.textSecondary, marginTop: 8, textAlign: 'center' },
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
    gap: 8,
  },
  fabText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  modalContainer: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.backgroundCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text },
  label: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 8, marginTop: 16 },
  tipoContainer: { flexDirection: 'row', gap: 8 },
  tipoButton: { flex: 1, backgroundColor: colors.chipInactive, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  tipoButtonIngreso: { backgroundColor: colors.ingreso },
  tipoButtonGasto: { backgroundColor: colors.gasto },
  tipoText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  tipoTextActive: { color: '#FFFFFF' },
  monedaContainer: { flexDirection: 'row', gap: 8 },
  monedaButton: { flex: 1, backgroundColor: colors.chipInactive, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  monedaButtonActive: { backgroundColor: colors.primary },
  monedaText: { fontSize: 14, fontWeight: '600', color: colors.chipTextInactive },
  monedaTextActive: { color: colors.chipTextActive },
  input: { backgroundColor: colors.background, borderRadius: 12, padding: 16, fontSize: 16, color: colors.text, borderWidth: 1, borderColor: colors.border },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  saveButton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  deleteButton: {
    flexDirection: 'row',
    backgroundColor: colors.error,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  deleteButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
});
