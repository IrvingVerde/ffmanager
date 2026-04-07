import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { colors } from '../utils/colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function SummaryScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const today = new Date();
  const dateString = today.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    day: 'numeric',
    month: 'long'
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Resumen</Text>
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
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.summaryTitle}>Resumen General</Text>
              <Text style={styles.dateText}>{dateString.charAt(0).toUpperCase() + dateString.slice(1)}</Text>
            </View>
            <TouchableOpacity onPress={onRefresh}>
              <Ionicons name="refresh" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Accesos rápidos */}
          <View style={styles.quickAccessContainer}>
            <TouchableOpacity 
              style={styles.quickAccessItem}
              onPress={() => router.push('/(tabs)/inventario')}
            >
              <Ionicons name="grid" size={24} color={colors.primary} />
              <Text style={styles.quickAccessText}>Inventario de Cuentas</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAccessItem}
              onPress={() => router.push('/(tabs)/finanzas')}
            >
              <Ionicons name="wallet" size={24} color={colors.primary} />
              <Text style={styles.quickAccessText}>Finanzas de Hoy</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAccessItem}
              onPress={() => router.push('/(tabs)/notas')}
            >
              <Ionicons name="document-text" size={24} color={colors.primary} />
              <Text style={styles.quickAccessText}>Notas y Tareas</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Métricas */}
          <View style={styles.metricsContainer}>
            <View style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="checkmark-circle" size={24} color={colors.error} />
              </View>
              <Text style={styles.metricValue}>0</Text>
              <Text style={styles.metricLabel}>Pendientes</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="document-text" size={24} color={colors.info} />
              </View>
              <Text style={styles.metricValue}>0</Text>
              <Text style={styles.metricLabel}>Total Notas</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="alarm" size={24} color={colors.warning} />
              </View>
              <Text style={styles.metricValue}>0</Text>
              <Text style={styles.metricLabel}>Recordatorios</Text>
            </View>
          </View>

          {/* Indicadores */}
          <Text style={styles.sectionTitle}>Indicadores Clave</Text>
          
          <View style={styles.indicatorCard}>
            <Ionicons name="sparkles" size={24} color={colors.info} />
            <Text style={styles.indicatorText}>
              ¡Excelente! No tienes tareas pendientes
            </Text>
          </View>
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  dateText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  quickAccessContainer: {
    marginBottom: 24,
  },
  quickAccessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  quickAccessText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  indicatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  indicatorText: {
    flex: 1,
    fontSize: 14,
    color: colors.info,
    fontWeight: '500',
  },
});