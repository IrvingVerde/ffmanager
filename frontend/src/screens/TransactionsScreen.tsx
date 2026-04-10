import React, { useEffect, useState, useMemo } from 'react';
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
import { TipoTransaccion, TransactionCreate, Transaction } from '../types';

// Helper: get date string YYYY-MM-DD from a date
const getDateKey = (fecha: string) => {
  const d = new Date(fecha);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getTodayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

export default function TransactionsScreen() {
  const { transacciones, setTransacciones, agregarTransaccion, eliminarTransaccionStore, isOnline } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<'transacciones' | 'calendario'>('transacciones');
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  
  // Simple form
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

  // ====== COMPUTED DATA ======

  // All-time totals
  const totalIngresos = transacciones
    .filter(t => t.tipo === 'ingreso')
    .reduce((sum, t) => sum + t.monto, 0);
  const totalGastos = transacciones
    .filter(t => t.tipo === 'gasto')
    .reduce((sum, t) => sum + t.monto, 0);
  const balance = totalIngresos - totalGastos;

  // Today's totals
  const todayKey = getTodayKey();
  const transaccionesHoy = useMemo(() => 
    transacciones.filter(t => getDateKey(t.fecha) === todayKey),
    [transacciones, todayKey]
  );
  const hoyIngresos = transaccionesHoy.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.monto, 0);
  const hoyGastos = transaccionesHoy.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.monto, 0);
  const hoyNeto = hoyIngresos - hoyGastos;

  // Daily totals map for calendar
  const dailyTotals = useMemo(() => {
    const map: Record<string, { ingresos: number; gastos: number; neto: number }> = {};
    transacciones.forEach(t => {
      const key = getDateKey(t.fecha);
      if (!map[key]) map[key] = { ingresos: 0, gastos: 0, neto: 0 };
      if (t.tipo === 'ingreso') {
        map[key].ingresos += t.monto;
        map[key].neto += t.monto;
      } else {
        map[key].gastos += t.monto;
        map[key].neto -= t.monto;
      }
    });
    return map;
  }, [transacciones]);

  // Transactions for selected day in calendar
  const transaccionesDiaSeleccionado = useMemo(() => {
    if (!selectedDay) return [];
    return transacciones.filter(t => getDateKey(t.fecha) === selectedDay);
  }, [transacciones, selectedDay]);

  // ====== CALENDAR LOGIC ======
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Monday=0, Sunday=6
  };

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(calYear, calMonth);
    const firstDay = getFirstDayOfMonth(calYear, calMonth);
    const days: (number | null)[] = [];
    
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) days.push(null);
    // Day cells
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    
    return days;
  }, [calYear, calMonth]);

  const prevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(calYear - 1);
    } else {
      setCalMonth(calMonth - 1);
    }
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(calYear + 1);
    } else {
      setCalMonth(calMonth + 1);
    }
    setSelectedDay(null);
  };

  const formatMonto = (n: number) => `S/ ${n.toFixed(2)}`;
  const formatMontoShort = (n: number) => {
    if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}k`;
    if (Math.abs(n) >= 100) return Math.round(n).toString();
    return n.toFixed(0);
  };

  // ====== RENDER ======

  const renderTransactionCard = (trans: Transaction) => {
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
  };

  const renderCalendar = () => (
    <View style={styles.calendarContainer}>
      {/* Month navigation */}
      <View style={styles.calMonthNav}>
        <TouchableOpacity onPress={prevMonth} style={styles.calNavBtn}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.calMonthTitle}>{MESES[calMonth]} {calYear}</Text>
        <TouchableOpacity onPress={nextMonth} style={styles.calNavBtn}>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Day headers */}
      <View style={styles.calWeekRow}>
        {DIAS_SEMANA.map(d => (
          <View key={d} style={styles.calWeekCell}>
            <Text style={styles.calWeekText}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.calGrid}>
        {calendarDays.map((day, idx) => {
          if (day === null) {
            return <View key={`empty-${idx}`} style={styles.calDayCell} />;
          }
          
          const dayKey = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const totals = dailyTotals[dayKey];
          const isToday = dayKey === todayKey;
          const isSelected = dayKey === selectedDay;
          const hasData = !!totals;
          
          return (
            <TouchableOpacity
              key={dayKey}
              style={[
                styles.calDayCell,
                isToday && styles.calDayCellToday,
                isSelected && styles.calDayCellSelected,
              ]}
              onPress={() => setSelectedDay(isSelected ? null : dayKey)}
              activeOpacity={0.6}
            >
              <Text style={[
                styles.calDayNum,
                isToday && styles.calDayNumToday,
                isSelected && styles.calDayNumSelected,
              ]}>
                {day}
              </Text>
              {hasData && (
                <Text style={[
                  styles.calDayAmount,
                  { color: totals.neto >= 0 ? colors.ingreso : colors.gasto }
                ]}>
                  {totals.neto >= 0 ? '+' : ''}{formatMontoShort(totals.neto)}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected day detail */}
      {selectedDay && (
        <View style={styles.calDayDetail}>
          <View style={styles.calDayDetailHeader}>
            <Text style={styles.calDayDetailTitle}>
              {new Date(selectedDay + 'T12:00:00').toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
          
          {dailyTotals[selectedDay] ? (
            <>
              <View style={styles.calDayDetailSummary}>
                <View style={styles.calDayDetailItem}>
                  <Ionicons name="arrow-up-circle" size={16} color={colors.ingreso} />
                  <Text style={[styles.calDayDetailValue, { color: colors.ingreso }]}>
                    +S/ {dailyTotals[selectedDay].ingresos.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.calDayDetailItem}>
                  <Ionicons name="arrow-down-circle" size={16} color={colors.gasto} />
                  <Text style={[styles.calDayDetailValue, { color: colors.gasto }]}>
                    -S/ {dailyTotals[selectedDay].gastos.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.calDayDetailItem}>
                  <Ionicons name="wallet" size={16} color={colors.primary} />
                  <Text style={[styles.calDayDetailValue, { color: dailyTotals[selectedDay].neto >= 0 ? colors.ingreso : colors.gasto }]}>
                    S/ {dailyTotals[selectedDay].neto.toFixed(2)}
                  </Text>
                </View>
              </View>
              
              {transaccionesDiaSeleccionado.map(renderTransactionCard)}
            </>
          ) : (
            <Text style={styles.calDayDetailEmpty}>Sin movimientos este día</Text>
          )}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
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

      {/* Today card */}
      <View style={styles.todayCard}>
        <View style={styles.todayHeader}>
          <Ionicons name="today" size={16} color={colors.primary} />
          <Text style={styles.todayTitle}>Hoy</Text>
        </View>
        <View style={styles.todayRow}>
          <View style={styles.todayItem}>
            <Text style={styles.todayLabel}>Ingresé</Text>
            <Text style={[styles.todayValue, { color: colors.ingreso }]}>+S/ {hoyIngresos.toFixed(2)}</Text>
          </View>
          <View style={styles.todayItemDivider} />
          <View style={styles.todayItem}>
            <Text style={styles.todayLabel}>Gasté</Text>
            <Text style={[styles.todayValue, { color: colors.gasto }]}>-S/ {hoyGastos.toFixed(2)}</Text>
          </View>
          <View style={styles.todayItemDivider} />
          <View style={styles.todayItem}>
            <Text style={styles.todayLabel}>Neto</Text>
            <Text style={[styles.todayValue, { color: hoyNeto >= 0 ? colors.ingreso : colors.gasto }]}>
              S/ {hoyNeto.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* View tabs */}
      <View style={styles.viewTabs}>
        <TouchableOpacity
          style={[styles.viewTab, activeView === 'transacciones' && styles.viewTabActive]}
          onPress={() => setActiveView('transacciones')}
        >
          <Ionicons name="list" size={16} color={activeView === 'transacciones' ? colors.primary : colors.textMuted} />
          <Text style={[styles.viewTabText, activeView === 'transacciones' && styles.viewTabTextActive]}>
            Movimientos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewTab, activeView === 'calendario' && styles.viewTabActive]}
          onPress={() => { setActiveView('calendario'); setSelectedDay(null); }}
        >
          <Ionicons name="calendar" size={16} color={activeView === 'calendario' ? colors.primary : colors.textMuted} />
          <Text style={[styles.viewTabText, activeView === 'calendario' && styles.viewTabTextActive]}>
            Calendario
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {activeView === 'transacciones' ? (
          transacciones.length > 0 ? (
            transacciones.map(renderTransactionCard)
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="wallet-outline" size={60} color={colors.textMuted} />
              <Text style={styles.emptyText}>Sin transacciones</Text>
              <Text style={styles.emptySubtext}>Usa los botones para agregar</Text>
            </View>
          )
        ) : (
          renderCalendar()
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

      {/* Modal */}
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
  
  // Header
  header: {
    backgroundColor: colors.backgroundSecondary,
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerWave1: { position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(199, 151, 39, 0.08)' },
  headerWave2: { position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(199, 151, 39, 0.06)' },
  headerWave3: { position: 'absolute', top: 20, left: 60, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(199, 151, 39, 0.04)' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: colors.primary, letterSpacing: 1 },
  headerSubtitle: { fontSize: 10, color: colors.textMuted, marginTop: 2, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundCard, borderRadius: 14, padding: 12 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, height: 28, backgroundColor: colors.border },
  summaryLabel: { fontSize: 9, color: colors.textMuted, marginBottom: 3, textTransform: 'uppercase', fontWeight: '600', letterSpacing: 0.5 },
  summaryValue: { fontSize: 13, fontWeight: '800' },

  // Today card
  todayCard: {
    marginHorizontal: 14,
    marginTop: 10,
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  todayHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  todayTitle: { fontSize: 13, fontWeight: '800', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  todayRow: { flexDirection: 'row', alignItems: 'center' },
  todayItem: { flex: 1, alignItems: 'center' },
  todayItemDivider: { width: 1, height: 24, backgroundColor: colors.border },
  todayLabel: { fontSize: 9, color: colors.textMuted, marginBottom: 2, fontWeight: '600' },
  todayValue: { fontSize: 13, fontWeight: '800' },

  // View tabs
  viewTabs: {
    flexDirection: 'row',
    marginHorizontal: 14,
    marginTop: 10,
    backgroundColor: colors.backgroundCard,
    borderRadius: 10,
    padding: 3,
  },
  viewTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  viewTabActive: { backgroundColor: colors.backgroundSecondary },
  viewTabText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  viewTabTextActive: { color: colors.primary },

  // List
  scrollView: { flex: 1 },
  listContent: { padding: 14, paddingBottom: 120 },
  
  // Transaction card
  transCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundCard, borderRadius: 12, padding: 12, marginBottom: 8 },
  transIndicator: { width: 4, height: 36, borderRadius: 2, marginRight: 12 },
  transInfo: { flex: 1 },
  transMonto: { fontSize: 16, fontWeight: '800' },
  transDesc: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  transDescEmpty: { fontSize: 11, color: colors.textMuted, marginTop: 2, fontStyle: 'italic' },
  transDate: { fontSize: 9, color: colors.textMuted, marginTop: 3 },
  transDeleteBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(239, 68, 68, 0.1)', alignItems: 'center', justifyContent: 'center' },

  // Empty
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 40 },
  emptyText: { fontSize: 18, fontWeight: '600', color: colors.text, marginTop: 16 },
  emptySubtext: { fontSize: 13, color: colors.textSecondary, marginTop: 6 },

  // Calendar
  calendarContainer: { },
  calMonthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 4 },
  calNavBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.backgroundCard, alignItems: 'center', justifyContent: 'center' },
  calMonthTitle: { fontSize: 16, fontWeight: '800', color: colors.text, textTransform: 'capitalize' },
  calWeekRow: { flexDirection: 'row', marginBottom: 6 },
  calWeekCell: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  calWeekText: { fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
    borderRadius: 8,
  },
  calDayCellToday: {
    backgroundColor: 'rgba(199, 151, 39, 0.15)',
    borderRadius: 8,
  },
  calDayCellSelected: {
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  calDayNum: { fontSize: 12, fontWeight: '600', color: colors.text },
  calDayNumToday: { color: colors.primary, fontWeight: '900' },
  calDayNumSelected: { color: '#FFF', fontWeight: '900' },
  calDayAmount: { fontSize: 7, fontWeight: '700', marginTop: 1 },

  // Calendar day detail
  calDayDetail: {
    marginTop: 14,
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: 14,
  },
  calDayDetailHeader: { marginBottom: 10 },
  calDayDetailTitle: { fontSize: 14, fontWeight: '700', color: colors.text, textTransform: 'capitalize' },
  calDayDetailSummary: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, backgroundColor: colors.background, borderRadius: 10, padding: 10 },
  calDayDetailItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  calDayDetailValue: { fontSize: 12, fontWeight: '800' },
  calDayDetailEmpty: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: 16, fontStyle: 'italic' },

  // FABs
  fabGasto: { position: 'absolute', right: 20, bottom: 140, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.gasto, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 24, elevation: 8, gap: 6 },
  fabIngreso: { position: 'absolute', right: 20, bottom: 80, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.ingreso, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 24, elevation: 8, gap: 6 },
  fabText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  // Modal
  modalContainer: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.backgroundCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '900' },
  label: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  montoInput: { backgroundColor: colors.background, borderRadius: 12, padding: 16, fontSize: 28, fontWeight: '800', color: colors.text, borderWidth: 1, borderColor: colors.border, textAlign: 'center', marginBottom: 16 },
  descInput: { backgroundColor: colors.background, borderRadius: 12, padding: 14, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border, minHeight: 60, textAlignVertical: 'top', marginBottom: 8 },
  saveButton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
});
