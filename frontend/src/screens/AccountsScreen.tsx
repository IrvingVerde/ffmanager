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
import { AccountItem } from '../components/AccountItem';
import { useStore } from '../store/useStore';
import { 
  obtenerCuentas, 
  crearCuenta,
} from '../services/api';
import { guardarCuentaLocal, obtenerCuentasLocales } from '../services/database';
import { Ionicons } from '@expo/vector-icons';
import { PlataformaType, EstadoCuenta, AccountCreate } from '../types';
import * as Clipboard from 'expo-clipboard';

export default function AccountsScreen() {
  const { cuentas, setCuentas, agregarCuenta, isOnline } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [titulo, setTitulo] = useState('');
  const [plataforma, setPlataforma] = useState<PlataformaType>('Facebook');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [region, setRegion] = useState('South America');
  const [notas, setNotas] = useState('');
  const [estados, setEstados] = useState<EstadoCuenta[]>(['Disponible']);

  const cargarCuentas = async () => {
    try {
      if (isOnline) {
        const ctas = await obtenerCuentas();
        setCuentas(ctas);
        // Guardar en local
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
      Alert.alert('Error', 'Completa los campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      const nuevaCuenta: AccountCreate = {
        titulo,
        plataforma,
        email,
        password,
        region,
        notas: notas || undefined,
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
      setEstados(['Disponible']);
      setModalVisible(false);
      
      Alert.alert('Éxito', 'Cuenta creada correctamente');
    } catch (error) {
      console.error('Error creando cuenta:', error);
      Alert.alert('Error', 'No se pudo crear la cuenta');
    } finally {
      setLoading(false);
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Cuentas</Text>
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
          {cuentas.length > 0 ? (
            cuentas.map((cuenta) => (
              <AccountItem 
                key={cuenta.id} 
                account={cuenta}
                onPress={() => {
                  setSelectedAccount(cuenta);
                  setDetailModalVisible(true);
                }}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="game-controller-outline" size={64} color={colors.textMuted} />
              <Text style={styles.emptyText}>No hay cuentas</Text>
              <Text style={styles.emptySubtext}>Presiona el botón + para agregar una</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal para crear cuenta */}
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

              <Text style={styles.label}>Título *</Text>
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

              <Text style={styles.label}>Contraseña *</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
              />

              <Text style={styles.label}>Región</Text>
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
                    Sudamérica
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
                placeholder="Información adicional..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={handleCrearCuenta}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Guardando...' : 'Guardar Cuenta'}
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
                  
                  <View style={styles.credentialRow}>
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

                  <View style={styles.credentialRow}>
                    <View style={styles.credentialInfo}>
                      <Text style={styles.credentialLabel}>Contraseña</Text>
                      <Text style={styles.credentialValue}>{selectedAccount.password}</Text>
                    </View>
                    <TouchableOpacity 
                      onPress={() => copyToClipboard(selectedAccount.password, 'Contraseña')}
                      style={styles.copyButton}
                    >
                      <Ionicons name="copy-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Información adicional */}
                <View style={styles.infoSection}>
                  <Text style={styles.infoLabel}>Plataforma</Text>
                  <Text style={styles.infoValue}>{selectedAccount.plataforma}</Text>
                </View>

                <View style={styles.infoSection}>
                  <Text style={styles.infoLabel}>Región</Text>
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
  modalScrollView: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: colors.backgroundSecondary,
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
  horizontalScroll: {
    marginBottom: 8,
  },
  plataformaContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  plataformaButton: {
    backgroundColor: colors.backgroundCard,
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
    color: colors.textSecondary,
  },
  plataformaTextActive: {
    color: colors.text,
  },
  regionContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  regionButton: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
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
    color: colors.textSecondary,
  },
  regionTextActive: {
    color: colors.text,
  },
  estadosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  estadoChip: {
    backgroundColor: colors.backgroundCard,
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
    color: colors.textSecondary,
  },
  estadoChipTextActive: {
    color: colors.text,
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
  credentialRow: {
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
    backgroundColor: colors.backgroundCard,
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
