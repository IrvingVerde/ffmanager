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
import { useStore } from '../store/useStore';
import { 
  obtenerTransacciones, 
  crearTransaccion,
  eliminarTransaccion,
} from '../services/api';
import { guardarTransaccionLocal, obtenerTransaccionesLocales, eliminarTransaccionLocal } from '../services/database';
import { Ionicons } from '@expo/vector-icons';
import { TipoTransaccion, TransactionCreate } from '../types';

export default function TransactionsScreen() {
  const { transacciones, setTransacciones, agregarTransaccion, eliminarTransaccionStore, isOnline } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Simple form - only monto and descripcion
  const [tipo, setTipo] = useState<TipoTransaccion>('ingreso');
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');

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

  const handleGuardar = async () => {
    if (!monto || parseFloat(monto) <= 0) {
      if (Platform.OS === 'web') {
        window.alert('Ingresa un monto válido');
      } else {
        Alert.alert('Error', 'Ingresa un monto válido');
      }
      return;
    }

    setLoading(true);
    try {
      const nueva: TransactionCreate = {
        tipo,
        monto: parseFloat(monto),
        moneda: 'PEN',
        fecha: new Date().toISOString(),
        notas: descripcion || undefined,
      };

      const creada = await crearTransaccion(nueva);
      agregarTransaccion(creada);
      await guardarTransaccionLocal(creada);
      
      setMonto('');
      setDescripcion('');
      setModalVisible(false);
    } catch (error) {
      console.error('Error creando transacción:', error);
      if (Platform.OS === 'web') {
        window.alert('No se pudo guardar');
      } else {
        Alert.alert('Error', 'No se pudo guardar');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id: string) => {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('¿Eliminar esta transacción?')
      : await new Promise<boolean>((resolve) => {
          Alert.alert('Eliminar', '¿Eliminar esta transacción?', [
            { text: 'No', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Sí', style: 'destructive', onPress: () => resolve(true) },
          ]);
        });

    if (!confirmed) return;

    try {
      if (isOnline) await eliminarTransaccion(id);
      eliminarTransaccionStore(id);
      await eliminarTransaccionLocal(id);
    } catch (error) {
      eliminarTransaccionStore(id);
      await eliminarTransaccionLocal(id);
    }
  };

  // Calculate totals
  const totalIngresos = transacciones
    .filter(t => t.tipo === 'ingreso')
    .reduce((sum, t) => sum + t.monto, 0);
  const totalGastos = transacciones
    .filter(t => t.tipo === 'gasto')
    .reduce((sum, t) => sum + t.monto, 0);
  const balance = totalIngresos - totalGastos;

  const formatMonto = (n: number) => `S/ ${n.toFixed(2)}`;

  return (
    <View style={styles.container}>
      {/* Header con resumen */}
      <View style={styles.header}>
        <View style={styles.headerWave1} />
        <View style={styles.headerWave2} />
        <View style={styles.headerWave3} />

        <Text style={styles.headerTitle}>Finanzas</Text>
        <Text style={styles.headerSubtitle}>Resumen General</Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Ingresos</Text>
            <Text style={[styles.summaryValue, { color: colors.ingreso }]}>{formatMonto(totalIngresos)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Gastos</Text>
            <Text style={[styles.summaryValue, { color: colors.gasto }]}>{formatMonto(totalGastos)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Balance</Text>
            <Text style={[styles.summaryValue, { color: balance >= 0 ? colors.ingreso : colors.gasto }]}>
              {formatMonto(balance)}
            </Text>
          </View>
        </View>
      </View>

      {/* Transaction list */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {transacciones.length > 0 ? (
          transacciones.map((trans) => {
            const isIngreso = trans.tipo === 'ingreso';
            return (
              <View key={trans.id} style={styles.transCard}>
                <View style={[styles.transIndicator, { backgroundColor: isIngreso ? colors.ingreso : colors.gasto }]} />
                <View style={styles.transInfo}>
                  <Text style={[styles.transMonto, { color: isIngreso ? colors.ingreso : colors.gasto }]}>
                    {isIngreso ? '+' : '-'} S/ {trans.monto.toFixed(2)}
                  </Text>
                  {trans.notas ? (
                    <Text style={styles.transDesc} numberOfLines={2}>{trans.notas}</Text>
                  ) : (
                    <Text style={styles.transDescEmpty}>{isIngreso ? 'Ingreso' : 'Gasto'}</Text>
                  )}
                  <Text style={styles.transDate}>
                    {new Date(trans.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.transDeleteBtn}
                  onPress={() => handleEliminar(trans.id)}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.gasto} />
                </TouchableOpacity>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={60} color={colors.textMuted} />
            <Text style={styles.emptyText}>Sin transacciones</Text>
            <Text style={styles.emptySubtext}>Usa los botones para agregar</Text>
          </View>
        )}
      </ScrollView>

      {/* FAB Buttons */}
      <TouchableOpacity
        style={styles.fabGasto}
        onPress={() => { setTipo('gasto'); setModalVisible(true); }}
      >
        <Ionicons name="remove" size={22} color="#FFF" />
        <Text style={styles.fabText}>Gasto</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.fabIngreso}
        onPress={() => { setTipo('ingreso'); setModalVisible(true); }}
      >
        <Ionicons name="add" size={22} color="#FFF" />
        <Text style={styles.fabText}>Ingreso</Text>
      </TouchableOpacity>

      {/* Modal simple */}
      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: tipo === 'ingreso' ? colors.ingreso : colors.gasto }]}>
                {tipo === 'ingreso' ? 'Nuevo Ingreso' : 'Nuevo Gasto'}
              </Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); setMonto(''); setDescripcion(''); }}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Monto (S/)</Text>
            <TextInput
              style={styles.montoInput}
              value={monto}
              onChangeText={setMonto}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              autoFocus
            />

            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={styles.descInput}
              value={descripcion}
              onChangeText={setDescripcion}
              placeholder="Motivo..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={2}
            />

            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: tipo === 'ingreso' ? colors.ingreso : colors.gasto },
                loading && styles.saveButtonDisabled,
              ]}
              onPress={handleGuardar}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Guardando...' : 'Guardar'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  
  // Header premium
  header: {
    backgroundColor: colors.backgroundSecondary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerWave1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(199, 151, 39, 0.08)',
  },
  headerWave2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(199, 151, 39, 0.06)',
  },
  headerWave3: {
    position: 'absolute',
    top: 20,
    left: 60,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(199, 151, 39, 0.04)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderRadius: 14,
    padding: 14,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, height: 30, backgroundColor: colors.border },
  summaryLabel: { fontSize: 10, color: colors.textMuted, marginBottom: 4, textTransform: 'uppercase', fontWeight: '600', letterSpacing: 0.5 },
  summaryValue: { fontSize: 14, fontWeight: '800' },

  // List
  scrollView: { flex: 1 },
  listContent: { padding: 14, paddingBottom: 120 },
  
  // Transaction card
  transCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  transIndicator: {
    width: 4,
    height: 36,
    borderRadius: 2,
    marginRight: 12,
  },
  transInfo: { flex: 1 },
  transMonto: {
    fontSize: 16,
    fontWeight: '800',
  },
  transDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  transDescEmpty: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    fontStyle: 'italic',
  },
  transDate: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 3,
  },
  transDeleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: colors.text, marginTop: 16 },
  emptySubtext: { fontSize: 13, color: colors.textSecondary, marginTop: 6 },

  // FABs
  fabGasto: {
    position: 'absolute',
    right: 20,
    bottom: 140,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gasto,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 8,
    gap: 6,
  },
  fabIngreso: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.ingreso,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 8,
    gap: 6,
  },
  fabText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  // Modal
  modalContainer: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.backgroundCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '900' },
  label: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  montoInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
    marginBottom: 16,
  },
  descInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
});
