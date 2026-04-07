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
  ActivityIndicator,
} from 'react-native';
import { colors } from '../utils/colors';
import { useStore } from '../store/useStore';
import { 
  obtenerCuentas, 
  crearCuenta,
} from '../services/api';
import { guardarCuentaLocal, obtenerCuentasLocales } from '../services/database';
import { Ionicons } from '@expo/vector-icons';
import { PlataformaType, EstadoCuenta, AccountCreate } from '../types';
import * as Clipboard from 'expo-clipboard';

type FilterType = 'todas' | 'disponible' | 'en_proceso' | 'correo_confirmado';

export default function AccountsScreen() {
  const { cuentas, setCuentas, agregarCuenta, isOnline } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [savingAccount, setSavingAccount] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('todas');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [titulo, setTitulo] = useState('');
  const [plataforma, setPlataforma] = useState<PlataformaType>('Facebook');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [region, setRegion] = useState('South America');
  const [notas, setNotas] = useState('');
  const [codigosRespaldo, setCodigosRespaldo] = useState('');
  const [estados, setEstados] = useState<EstadoCuenta[]>(['Disponible']);

  const cargarCuentas = async () => {
    try {
      if (isOnline) {
        const ctas = await obtenerCuentas();
        setCuentas(ctas);
        for (const c of ctas) {
          await guardarCuentaLocal(c);
        }
      } else {
        const ctas = await obtenerCuentasLocales();
        setCuentas(ctas);
      }
    } catch (error) {
      console.error('Error cargando cuentas:', error);
      const ctas = await obtenerCuentasLocales();
      setCuentas(ctas);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCuentas();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    cargarCuentas();
  };

  const handleCrearCuenta = async () => {
    if (!titulo || !email || !password) {
      Alert.alert('Error', 'Completa los campos obligatorios (T\u00edtulo, Email, Contrase\u00f1a)');
      return;
    }

    setSavingAccount(true);
    try {
      const nuevaCuenta: AccountCreate = {
        titulo,
        plataforma,
        email,
        password,
        region,
        notas: notas || undefined,
        codigos_respaldo: codigosRespaldo || undefined,
        estado: estados,
      };

      const cuentaCreada = await crearCuenta(nuevaCuenta);
      agregarCuenta(cuentaCreada);
      await guardarCuentaLocal(cuentaCreada);
      
      // Resetear form
      setTitulo('');
      setEmail('');
      setPassword('');
      setNotas('');
      setCodigosRespaldo('');
      setEstados(['Disponible']);
      setModalVisible(false);
      
      Alert.alert('\u00c9xito', 'Cuenta creada correctamente');
    } catch (error) {
      console.error('Error creando cuenta:', error);
      Alert.alert('Error', 'No se pudo crear la cuenta');
    } finally {
      setSavingAccount(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copiado', `${label} copiado al portapapeles`);
  };

  const toggleEstado = (estado: EstadoCuenta) => {
    if (estados.includes(estado)) {
      setEstados(estados.filter(e => e !== estado));
    } else {
      setEstados([...estados, estado]);
    }
  };

  const plataformas: PlataformaType[] = ['Facebook', 'Google', 'VK', 'Twitter', 'Otro'];
  const estadosDisponibles: EstadoCuenta[] = [
    'Disponible',
    'Reservada',
    'Vendida',
    'En Proceso',
    'Email Confirmado',
    'Email Perdido',
  ];

  // Filtrar cuentas
  const filteredCuentas = cuentas.filter(cuenta => {
    // Filtro por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        cuenta.titulo.toLowerCase().includes(query) ||
        cuenta.email.toLowerCase().includes(query) ||
        (cuenta.notas && cuenta.notas.toLowerCase().includes(query));
      
      if (!matchesSearch) return false;
    }

    // Filtro por categoría
    if (activeFilter === 'todas') return true;
    if (activeFilter === 'disponible') return cuenta.estado.includes('Disponible');
    if (activeFilter === 'en_proceso') return cuenta.estado.includes('En Proceso');
    if (activeFilter === 'correo_confirmado') return cuenta.estado.includes('Email Confirmado');
    
    return true;
  });

  const getStatusColor = (estados: EstadoCuenta[]) => {
    if (estados.includes('Vendida')) return colors.error;
    if (estados.includes('Disponible')) return colors.success;
    if (estados.includes('Reservada')) return colors.warning;
    return colors.info;
  };

  const getPlatformIcon = (plataforma: PlataformaType) => {
    switch (plataforma) {
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Inventario</Text>
      </View>

      {/* Búsqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filtros */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
        <View style={styles.filtersContainer}>
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'todas' && styles.filterChipActive]}
            onPress={() => setActiveFilter('todas')}
          >
            <Text style={[styles.filterText, activeFilter === 'todas' && styles.filterTextActive]}>
              Todas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'disponible' && styles.filterChipActive]}
            onPress={() => setActiveFilter('disponible')}
          >
            <Text style={[styles.filterText, activeFilter === 'disponible' && styles.filterTextActive]}>
              Disponible
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'en_proceso' && styles.filterChipActive]}
            onPress={() => setActiveFilter('en_proceso')}
          >
            <Text style={[styles.filterText, activeFilter === 'en_proceso' && styles.filterTextActive]}>
              En proceso
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'correo_confirmado' && styles.filterChipActive]}
            onPress={() => setActiveFilter('correo_confirmado')}
          >
            <Text style={[styles.filterText, activeFilter === 'correo_confirmado' && styles.filterTextActive]}>
              Correo confirmado
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Lista de cuentas */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {filteredCuentas.length > 0 ? (
          filteredCuentas.map((cuenta) => (
            <TouchableOpacity 
              key={cuenta.id}
              style={styles.accountCard}
              onPress={() => {
                setSelectedAccount(cuenta);
                setDetailModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.accountHeader}>
                <View style={[styles.platformIcon, { backgroundColor: getStatusColor(cuenta.estado) + '20' }]}>
                  <Ionicons 
                    name={getPlatformIcon(cuenta.plataforma as PlataformaType) as any} 
                    size={20} 
                    color={getStatusColor(cuenta.estado)} 
                  />
                </View>
                <View style={styles.accountHeaderText}>
                  <Text style={styles.accountTitle}>{cuenta.titulo}</Text>
                  <Text style={styles.accountPlatform}>{cuenta.plataforma}</Text>
                </View>
              </View>

              {/* Credenciales visibles */}
              <View style={styles.credentialsSection}>
                <View style={styles.credentialRow}>
                  <Ionicons name="mail" size={14} color={colors.textMuted} />
                  <Text style={styles.credentialText}>{cuenta.email}</Text>
                </View>
                <View style={styles.credentialRow}>
                  <Ionicons name="key" size={14} color={colors.textMuted} />
                  <Text style={styles.credentialText}>{cuenta.password}</Text>
                </View>
              </View>

              {/* Estados */}
              {cuenta.estado.length > 0 && (
                <View style={styles.statusContainer}>
                  {cuenta.estado.slice(0, 2).map((estado, index) => (
                    <View 
                      key={index} 
                      style={[styles.statusBadge, { backgroundColor: getStatusColor(cuenta.estado) + '20' }]}
                    >
                      <Text style={[styles.statusText, { color: getStatusColor(cuenta.estado) }]}>
                        {estado}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="game-controller-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyText}>No hay cuentas</Text>
            <Text style={styles.emptySubtext}>Presiona el bot\u00f3n + para agregar una</Text>
          </View>
        )}
      </ScrollView>

      {/* Bot\u00f3n flotante */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Modal para crear cuenta - Parte 1*/}
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
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nueva Cuenta</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={28} color={colors.text} />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>T\u00edtulo *</Text>
              <TextInput
                style={styles.input}
                value={titulo}
                onChangeText={setTitulo}
                placeholder="Ej: Cuenta Free Fire #1"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.label}>Plataforma</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                <View style={styles.plataformaContainer}>
                  {plataformas.map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.plataformaButton, plataforma === p && styles.plataformaButtonActive]}
                      onPress={() => setPlataforma(p)}
                    >
                      <Text style={[styles.plataformaText, plataforma === p && styles.plataformaTextActive]}>
                        {p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="correo@ejemplo.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Contrase\u00f1a *</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.label}>C\u00f3digos de Respaldo</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={codigosRespaldo}
                onChangeText={setCodigosRespaldo}
                placeholder="C\u00f3digos de recuperaci\u00f3n..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={2}
              />

              <Text style={styles.label}>Regi\u00f3n</Text>
              <View style={styles.regionContainer}>
                <TouchableOpacity
                  style={[styles.regionButton, region === 'USA' && styles.regionButtonActive]}
                  onPress={() => setRegion('USA')}
                >
                  <Text style={[styles.regionText, region === 'USA' && styles.regionTextActive]}>
                    USA
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.regionButton, region === 'South America' && styles.regionButtonActive]}
                  onPress={() => setRegion('South America')}
                >
                  <Text style={[styles.regionText, region === 'South America' && styles.regionTextActive]}>
                    Sudam\u00e9rica
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Estados</Text>
              <View style={styles.estadosContainer}>
                {estadosDisponibles.map((estado) => (
                  <TouchableOpacity
                    key={estado}
                    style={[
                      styles.estadoChip,
                      estados.includes(estado) && styles.estadoChipActive
                    ]}
                    onPress={() => toggleEstado(estado)}
                  >
                    <Text style={[
                      styles.estadoChipText,
                      estados.includes(estado) && styles.estadoChipTextActive
                    ]}>
                      {estado}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Notas</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notas}
                onChangeText={setNotas}
                placeholder="Informaci\u00f3n adicional..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={[styles.saveButton, savingAccount && styles.saveButtonDisabled]}
                onPress={handleCrearCuenta}
                disabled={savingAccount}
              >
                <Text style={styles.saveButtonText}>
                  {savingAccount ? 'Guardando...' : 'Guardar Cuenta'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal de detalle de cuenta */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalle de Cuenta</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedAccount && (
              <ScrollView>
                <Text style={styles.detailTitle}>{selectedAccount.titulo}</Text>
                
                {/* Credenciales - DESTACADAS */}
                <View style={styles.credentialsCard}>
                  <Text style={styles.credentialsTitle}>CREDENCIALES</Text>
                  
                  <View style={styles.credentialDetailRow}>
                    <View style={styles.credentialInfo}>
                      <Text style={styles.credentialLabel}>Email</Text>
                      <Text style={styles.credentialValue}>{selectedAccount.email}</Text>
                    </View>
                    <TouchableOpacity 
                      onPress={() => copyToClipboard(selectedAccount.email, 'Email')}
                      style={styles.copyButton}
                    >
                      <Ionicons name="copy-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.credentialDetailRow}>
                    <View style={styles.credentialInfo}>
                      <Text style={styles.credentialLabel}>Contrase\u00f1a</Text>
                      <Text style={styles.credentialValue}>{selectedAccount.password}</Text>
                    </View>
                    <TouchableOpacity 
                      onPress={() => copyToClipboard(selectedAccount.password, 'Contrase\u00f1a')}
                      style={styles.copyButton}
                    >
                      <Ionicons name="copy-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>

                  {selectedAccount.codigos_respaldo && (
                    <View style={styles.credentialDetailRow}>
                      <View style={styles.credentialInfo}>
                        <Text style={styles.credentialLabel}>C\u00f3digos de Respaldo</Text>
                        <Text style={styles.credentialValue}>{selectedAccount.codigos_respaldo}</Text>
                      </View>
                      <TouchableOpacity 
                        onPress={() => copyToClipboard(selectedAccount.codigos_respaldo, 'C\u00f3digos')}
                        style={styles.copyButton}
                      >
                        <Ionicons name="copy-outline" size={20} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Informaci\u00f3n adicional */}
                <View style={styles.infoSection}>
                  <Text style={styles.infoLabel}>Plataforma</Text>
                  <Text style={styles.infoValue}>{selectedAccount.plataforma}</Text>
                </View>

                <View style={styles.infoSection}>
                  <Text style={styles.infoLabel}>Regi\u00f3n</Text>
                  <Text style={styles.infoValue}>{selectedAccount.region}</Text>
                </View>

                {selectedAccount.estado.length > 0 && (
                  <View style={styles.infoSection}>
                    <Text style={styles.infoLabel}>Estados</Text>
                    <View style={styles.estadosRow}>
                      {selectedAccount.estado.map((estado: string, index: number) => (
                        <View key={index} style={styles.estadoBadgeDetail}>
                          <Text style={styles.estadoBadgeText}>{estado}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {selectedAccount.notas && (
                  <View style={styles.infoSection}>
                    <Text style={styles.infoLabel}>Notas</Text>
                    <Text style={styles.infoValue}>{selectedAccount.notas}</Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  searchContainer: {
    padding: 16,
    backgroundColor: colors.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  filtersScroll: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 8,
  },
  filterChip: {
    backgroundColor: colors.chipInactive,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  filterChipActive: {
    backgroundColor: colors.chipActive,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.chipTextInactive,
  },
  filterTextActive: {
    color: colors.chipTextActive,
  },
  scrollView: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  accountCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  platformIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accountHeaderText: {
    flex: 1,
  },
  accountTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  accountPlatform: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  credentialsSection: {
    gap: 8,
    marginBottom: 12,
  },
  credentialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  credentialText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalScrollView: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: colors.backgroundCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    minHeight: '90%',
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
  horizontalScroll: {
    marginBottom: 8,
  },
  plataformaContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  plataformaButton: {
    backgroundColor: colors.chipInactive,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  plataformaButtonActive: {
    backgroundColor: colors.primary,
  },
  plataformaText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.chipTextInactive,
  },
  plataformaTextActive: {
    color: colors.chipTextActive,
  },
  regionContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  regionButton: {
    flex: 1,
    backgroundColor: colors.chipInactive,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  regionButtonActive: {
    backgroundColor: colors.primary,
  },
  regionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.chipTextInactive,
  },
  regionTextActive: {
    color: colors.chipTextActive,
  },
  estadosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  estadoChip: {
    backgroundColor: colors.chipInactive,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  estadoChipActive: {
    backgroundColor: colors.primary,
  },
  estadoChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.chipTextInactive,
  },
  estadoChipTextActive: {
    color: colors.chipTextActive,
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
    color: '#FFFFFF',
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
  },
  credentialsCard: {
    backgroundColor: colors.primary + '15',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  credentialsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 16,
    letterSpacing: 1,
  },
  credentialDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  credentialInfo: {
    flex: 1,
  },
  credentialLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  credentialValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  copyButton: {
    backgroundColor: colors.backgroundCard,
    padding: 10,
    borderRadius: 8,
  },
  infoSection: {
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 16,
    color: colors.text,
  },
  estadosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  estadoBadgeDetail: {
    backgroundColor: colors.chipInactive,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  estadoBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
});
