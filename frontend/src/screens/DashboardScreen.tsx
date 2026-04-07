import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../utils/colors';
import { SummaryCard } from '../components/SummaryCard';
import { useStore } from '../store/useStore';
import { obtenerResumenFinanciero } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const { resumenFinanciero, setResumenFinanciero, isOnline } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const cargarResumen = async () => {
    try {
      if (isOnline) {
        const resumen = await obtenerResumenFinanciero();
        setResumenFinanciero(resumen);
      }
    } catch (error) {
      console.error('Error cargando resumen:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    cargarResumen();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    cargarResumen();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard Financiero</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? colors.success : colors.error }]} />
            <Text style={styles.statusText}>{isOnline ? 'En línea' : 'Sin conexión'}</Text>
          </View>
        </View>

        {resumenFinanciero ? (
          <View style={styles.content}>
            <SummaryCard
              title="Ganancias Totales"
              amountPEN={resumenFinanciero.total_ingresos_pen}
              amountUSD={resumenFinanciero.total_ingresos_usd}
              color={colors.ingreso}
            />

            <SummaryCard
              title="Gastos Totales"
              amountPEN={resumenFinanciero.total_gastos_pen}
              amountUSD={resumenFinanciero.total_gastos_usd}
              color={colors.gasto}
            />

            <SummaryCard
              title="Ganancia Neta"
              amountPEN={resumenFinanciero.ganancia_neta_pen}
              amountUSD={resumenFinanciero.ganancia_neta_usd}
              color={colors.primary}
            />

            <SummaryCard
              title="Inversiones"
              amountPEN={resumenFinanciero.total_inversiones_pen}
              amountUSD={resumenFinanciero.total_inversiones_usd}
              color={colors.inversion}
            />

            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={24} color={colors.info} />
              <Text style={styles.infoText}>
                Usa la pestaña "Transacciones" para agregar ingresos, gastos e inversiones.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyText}>No hay datos financieros aún</Text>
            <Text style={styles.emptySubtext}>Agrega tu primera transacción para comenzar</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  content: {
    padding: 20,
    paddingTop: 0,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
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
});
