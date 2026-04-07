import React, { useEffect, useState, useCallback } from 'react';
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
  Image,
} from 'react-native';
import { colors } from '../utils/colors';
import { useStore } from '../store/useStore';
import { 
  obtenerCuentas, 
  crearCuenta,
  actualizarCuenta,
  eliminarCuenta,
} from '../services/api';
import { guardarCuentaLocal, obtenerCuentasLocales, eliminarCuentaLocal } from '../services/database';
import { Ionicons } from '@expo/vector-icons';
import { PlataformaType, EstadoPrincipal, EstadoSecundario, AccountCreate, Account } from '../types';
import * as ImagePicker from 'expo-image-picker';

export default function AccountsScreen() {
  const { cuentas, setCuentas, agregarCuenta, actualizarCuentaStore, eliminarCuentaStore, isOnline } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  
  // Form state
  const [titulo, setTitulo] = useState('');
  const [plataforma, setPlataforma] = useState<PlataformaType>('Facebook');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [region, setRegion] = useState('SUR');
  const [notas, setNotas] = useState('');
  const [codigosRespaldo, setCodigosRespaldo] = useState('');
  const [fotoBase64, setFotoBase64] = useState<string | undefined>(undefined);
  const [precioCompra, setPrecioCompra] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [estadoPrincipal, setEstadoPrincipal] = useState<EstadoPrincipal>('Disponible');
  const [estadosSecundarios, setEstadosSecundarios] = useState<EstadoSecundario[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [vendedor, setVendedor] = useState('');
  const [comprador, setComprador] = useState('');

  const cargarCuentas = useCallback(async () => {
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
  }, [isOnline]);

  useEffect(() => {
    cargarCuentas();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    cargarCuentas();
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permiso denegado', 'Necesitas dar permiso para acceder a las fotos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setFotoBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const handleCrearCuenta = async () => {
    if (!titulo || !email || !password) {
      Alert.alert('Error', 'Completa los campos obligatorios (Título, Email, Contraseña)');
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
        foto_base64: fotoBase64,
        precio_compra: parseFloat(precioCompra) || 0,
        precio_venta: parseFloat(precioVenta) || 0,
        estado_principal: estadoPrincipal,
        estados_secundarios: estadosSecundarios,
        vendedor: vendedor || undefined,
        comprador: comprador || undefined,
      };

      const cuentaCreada = await crearCuenta(nuevaCuenta);
      agregarCuenta(cuentaCreada);
      await guardarCuentaLocal(cuentaCreada);
      
      resetForm();
      setModalVisible(false);
      
      Alert.alert('Éxito', 'Cuenta creada correctamente');
    } catch (error) {
      console.error('Error creando cuenta:', error);
      Alert.alert('Error', 'No se pudo crear la cuenta');
    } finally {
      setSavingAccount(false);
    }
  };

  const handleActualizarCuenta = async () => {
    if (!editingId || !titulo || !email || !password) {
      Alert.alert('Error', 'Completa los campos obligatorios');
      return;
    }

    setSavingAccount(true);
    try {
      const cuentaActualizada: AccountCreate = {
        titulo,
        plataforma,
        email,
        password,
        region,
        notas: notas || undefined,
        codigos_respaldo: codigosRespaldo || undefined,
        foto_base64: fotoBase64,
        precio_compra: parseFloat(precioCompra) || 0,
        precio_venta: parseFloat(precioVenta) || 0,
        estado_principal: estadoPrincipal,
        estados_secundarios: estadosSecundarios,
        vendedor: vendedor || undefined,
        comprador: comprador || undefined,
      };

      const resultado = await actualizarCuenta(editingId, cuentaActualizada);
      actualizarCuentaStore(editingId, resultado);
      await guardarCuentaLocal(resultado);
      
      resetForm();
      setEditModalVisible(false);
      
      Alert.alert('Éxito', 'Cuenta actualizada correctamente');
    } catch (error) {
      console.error('Error actualizando cuenta:', error);
      Alert.alert('Error', 'No se pudo actualizar la cuenta');
    } finally {
      setSavingAccount(false);
    }
  };

  // Delete single account directly from card
  const handleDeleteSingle = (id: string, titulo: string) => {
    Alert.alert(
      'Eliminar cuenta',
      `¿Seguro que quieres eliminar "${titulo}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingIds(prev => new Set(prev).add(id));
              if (isOnline) {
                await eliminarCuenta(id);
              }
              eliminarCuentaStore(id);
              await eliminarCuentaLocal(id);
            } catch (error) {
              console.error('Error eliminando cuenta:', error);
              // Even if backend fails, remove locally
              eliminarCuentaStore(id);
              await eliminarCuentaLocal(id);
            } finally {
              setDeletingIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
              });
            }
          }
        }
      ]
    );
  };

  // Batch delete selected accounts
  const handleDeleteSelected = () => {
    if (selectedForDelete.size === 0) {
      Alert.alert('Selecciona cuentas', 'Selecciona al menos una cuenta para eliminar');
      return;
    }

    Alert.alert(
      'Eliminar cuentas',
      `¿Eliminar ${selectedForDelete.size} cuenta(s) seleccionada(s)?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const idsToDelete = Array.from(selectedForDelete);
            setDeletingIds(new Set(idsToDelete));
            
            for (const id of idsToDelete) {
              try {
                if (isOnline) {
                  await eliminarCuenta(id);
                }
                eliminarCuentaStore(id);
                await eliminarCuentaLocal(id);
              } catch (error) {
                console.error('Error eliminando cuenta:', id, error);
                eliminarCuentaStore(id);
                await eliminarCuentaLocal(id);
              }
            }
            
            setDeletingIds(new Set());
            setSelectedForDelete(new Set());
            setDeleteMode(false);
          }
        }
      ]
    );
  };

  const toggleSelectForDelete = (id: string) => {
    setSelectedForDelete(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const resetForm = () => {
    setTitulo('');
    setEmail('');
    setPassword('');
    setNotas('');
    setCodigosRespaldo('');
    setFotoBase64(undefined);
    setPrecioCompra('');
    setPrecioVenta('');
    setRegion('SUR');
    setEstadoPrincipal('Disponible');
    setEstadosSecundarios([]);
    setEditingId(null);
    setVendedor('');
    setComprador('');
  };

  const abrirEdicion = (cuenta: Account) => {
    if (deleteMode) {
      toggleSelectForDelete(cuenta.id);
      return;
    }
    setEditingId(cuenta.id);
    setTitulo(cuenta.titulo);
    setPlataforma(cuenta.plataforma);
    setEmail(cuenta.email);
    setPassword(cuenta.password);
    setRegion(cuenta.region);
    setNotas(cuenta.notas || '');
    setCodigosRespaldo(cuenta.codigos_respaldo || '');
    setFotoBase64(cuenta.foto_base64);
    setPrecioCompra(cuenta.precio_compra?.toString() || '0');
    setPrecioVenta(cuenta.precio_venta?.toString() || '0');
    setEstadoPrincipal(cuenta.estado_principal || 'Disponible');
    setEstadosSecundarios(cuenta.estados_secundarios || []);
    setVendedor(cuenta.vendedor || '');
    setComprador(cuenta.comprador || '');
    setEditModalVisible(true);
  };

  const toggleEstadoSecundario = (estado: EstadoSecundario) => {
    if (estadosSecundarios.includes(estado)) {
      setEstadosSecundarios(estadosSecundarios.filter(e => e !== estado));
    } else {
      setEstadosSecundarios([...estadosSecundarios, estado]);
    }
  };

  const plataformas: PlataformaType[] = ['Facebook', 'Google', 'VK', 'Twitter', 'Otro'];
  const regiones = ['SUR', 'EEUU', 'NORTE', 'BRASIL', 'EUROPA', 'OTROS'];
  const estadosPrincipales: EstadoPrincipal[] = ['Disponible', 'Vendida', 'Reservada'];
  const estadosSecundariosOpciones: EstadoSecundario[] = ['En Proceso', 'Correo Confirmado', 'Correo Perdido', 'Pura'];

  const getCardBackgroundColor = (estado: string) => {
    switch (estado) {
      case 'Vendida':
        return '#FFE5E5';
      case 'Disponible':
        return '#E5F8E5';
      case 'Reservada':
        return '#FFE8D5';
      default:
        return colors.backgroundCard;
    }
  };

  const calcularGanancia = (compra: number, venta: number) => {
    return venta - compra;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const renderFormulario = (esEdicion: boolean) => (
    <ScrollView style={styles.modalScrollView}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{esEdicion ? 'Editar Cuenta' : 'Nueva Cuenta'}</Text>
          <TouchableOpacity onPress={() => {
            esEdicion ? setEditModalVisible(false) : setModalVisible(false);
            resetForm();
          }}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.photoSelector} onPress={pickImage}>
          {fotoBase64 ? (
            <Image source={{ uri: fotoBase64 }} style={styles.photoPreview} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera" size={32} color={colors.textMuted} />
              <Text style={styles.photoPlaceholderText}>Seleccionar foto</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Título *</Text>
        <TextInput
          style={styles.input}
          value={titulo}
          onChangeText={setTitulo}
          placeholder="Ej: Cuenta FF #1"
          placeholderTextColor={colors.textMuted}
        />

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
        />

        <Text style={styles.label}>Precio de Compra (S/)</Text>
        <TextInput
          style={styles.input}
          value={precioCompra}
          onChangeText={setPrecioCompra}
          placeholder="0.00"
          placeholderTextColor={colors.textMuted}
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Precio de Venta (S/)</Text>
        <TextInput
          style={styles.input}
          value={precioVenta}
          onChangeText={setPrecioVenta}
          placeholder="0.00"
          placeholderTextColor={colors.textMuted}
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Quién me vendió</Text>
        <TextInput
          style={styles.input}
          value={vendedor}
          onChangeText={setVendedor}
          placeholder="Nombre del vendedor..."
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Quién me la compró</Text>
        <TextInput
          style={styles.input}
          value={comprador}
          onChangeText={setComprador}
          placeholder="Nombre del comprador..."
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Códigos de Respaldo</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={codigosRespaldo}
          onChangeText={setCodigosRespaldo}
          placeholder="Códigos..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={2}
        />

        <Text style={styles.label}>Plataforma</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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

        <Text style={styles.label}>Región</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.regionContainer}>
            {regiones.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.regionButton, region === r && styles.regionButtonActive]}
                onPress={() => setRegion(r)}
              >
                <Text style={[styles.regionText, region === r && styles.regionTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Text style={styles.label}>Estado de Cuenta</Text>
        <View style={styles.estadoPrincipalContainer}>
          {estadosPrincipales.map((estado) => (
            <TouchableOpacity
              key={estado}
              style={[styles.estadoPrincipalButton, estadoPrincipal === estado && styles.estadoPrincipalActive]}
              onPress={() => setEstadoPrincipal(estado)}
            >
              <Text style={[styles.estadoPrincipalText, estadoPrincipal === estado && styles.estadoPrincipalTextActive]}>
                {estado}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Estados Adicionales</Text>
        <View style={styles.estadosContainer}>
          {estadosSecundariosOpciones.map((estado) => (
            <TouchableOpacity
              key={estado}
              style={[styles.estadoChip, estadosSecundarios.includes(estado) && styles.estadoChipActive]}
              onPress={() => toggleEstadoSecundario(estado)}
            >
              <Text style={[styles.estadoChipText, estadosSecundarios.includes(estado) && styles.estadoChipTextActive]}>
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
          style={[styles.saveButton, savingAccount && styles.saveButtonDisabled]}
          onPress={esEdicion ? handleActualizarCuenta : handleCrearCuenta}
          disabled={savingAccount}
        >
          <Text style={styles.saveButtonText}>
            {savingAccount ? 'Guardando...' : esEdicion ? 'Actualizar' : 'Guardar'}
          </Text>
        </TouchableOpacity>

        {esEdicion && (
          <TouchableOpacity
            style={styles.deleteButtonModal}
            onPress={() => {
              if (!editingId) return;
              const t = titulo;
              const id = editingId;
              setEditModalVisible(false);
              resetForm();
              setTimeout(() => handleDeleteSingle(id, t), 300);
            }}
          >
            <Ionicons name="trash" size={20} color="#FFFFFF" />
            <Text style={styles.deleteButtonText}>Eliminar Cuenta</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header compacto */}
      <View style={styles.header}>
        <View style={styles.abstractShape1} />
        <View style={styles.abstractShape2} />
        
        <View style={styles.headerContent}>
          <Text style={styles.title}>FREE FIRE APP MANAGER</Text>
          <Text style={styles.subtitle}>By: Irving</Text>
        </View>
      </View>

      {/* Delete mode toolbar */}
      {deleteMode && (
        <View style={styles.deleteToolbar}>
          <TouchableOpacity 
            style={styles.deleteToolbarCancel} 
            onPress={() => {
              setDeleteMode(false);
              setSelectedForDelete(new Set());
            }}
          >
            <Ionicons name="close" size={20} color={colors.text} />
            <Text style={styles.deleteToolbarCancelText}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.deleteToolbarCount}>
            {selectedForDelete.size} seleccionada(s)
          </Text>
          <TouchableOpacity 
            style={[
              styles.deleteToolbarConfirm,
              selectedForDelete.size === 0 && styles.deleteToolbarConfirmDisabled,
            ]} 
            onPress={handleDeleteSelected}
          >
            <Ionicons name="trash" size={18} color="#FFF" />
            <Text style={styles.deleteToolbarConfirmText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {cuentas.length > 0 ? (
          cuentas.map((cuenta) => {
            const ganancia = calcularGanancia(cuenta.precio_compra || 0, cuenta.precio_venta || 0);
            const bgColor = getCardBackgroundColor(cuenta.estado_principal || 'Disponible');
            const isSelected = selectedForDelete.has(cuenta.id);
            const isDeleting = deletingIds.has(cuenta.id);
            
            return (
              <TouchableOpacity 
                key={cuenta.id}
                style={[
                  styles.accountCard, 
                  { backgroundColor: bgColor },
                  isSelected && styles.accountCardSelected,
                  isDeleting && styles.accountCardDeleting,
                ]}
                onPress={() => abrirEdicion(cuenta)}
                onLongPress={() => {
                  if (!deleteMode) {
                    setDeleteMode(true);
                    setSelectedForDelete(new Set([cuenta.id]));
                  }
                }}
                activeOpacity={0.7}
                disabled={isDeleting}
              >
                <View style={styles.cardContent}>
                  {/* Select checkbox in delete mode */}
                  {deleteMode && (
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                    </View>
                  )}

                  {cuenta.foto_base64 ? (
                    <Image source={{ uri: cuenta.foto_base64 }} style={styles.accountPhoto} />
                  ) : (
                    <View style={[styles.accountPhoto, styles.accountPhotoPlaceholder]}>
                      <Ionicons name="person" size={20} color={colors.textMuted} />
                    </View>
                  )}

                  <View style={styles.accountInfo}>
                    <View style={styles.titleRow}>
                      <Text style={styles.accountTitle} numberOfLines={1}>{cuenta.titulo}</Text>
                      <View style={styles.badgesRow}>
                        {cuenta.estados_secundarios && cuenta.estados_secundarios.length > 0 && (
                          cuenta.estados_secundarios.map((es) => (
                            <View key={es} style={styles.estadoSecBadge}>
                              <Text style={styles.estadoSecBadgeText}>{es}</Text>
                            </View>
                          ))
                        )}
                        <View style={styles.regionBadge}>
                          <Text style={styles.regionBadgeText}>{cuenta.region}</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.accountEmail} numberOfLines={1}>{cuenta.email}</Text>
                    
                    <View style={styles.pricesRow}>
                      <Text style={styles.priceLabel}>C: <Text style={styles.priceValue}>S/{cuenta.precio_compra?.toFixed(2) || '0.00'}</Text></Text>
                      <Text style={styles.priceLabel}>V: <Text style={styles.priceValueVenta}>S/{cuenta.precio_venta?.toFixed(2) || '0.00'}</Text></Text>
                      <Text style={[styles.ganancia, ganancia >= 0 ? styles.gananciaPositiva : styles.gananciaNegativa]}>
                        G: S/{ganancia.toFixed(2)}
                      </Text>
                    </View>

                    {(cuenta.vendedor || cuenta.comprador) && (
                      <View style={styles.tradeInfoRow}>
                        {cuenta.vendedor ? (
                          <Text style={styles.tradeInfoText} numberOfLines={1}>
                            <Text style={styles.tradeInfoLabel}>Vendedor: </Text>{cuenta.vendedor}
                          </Text>
                        ) : null}
                        {cuenta.comprador ? (
                          <Text style={styles.tradeInfoText} numberOfLines={1}>
                            <Text style={styles.tradeInfoLabel}>Comprador: </Text>{cuenta.comprador}
                          </Text>
                        ) : null}
                      </View>
                    )}
                  </View>

                  {/* Delete button on card - always visible */}
                  {!deleteMode && (
                    <TouchableOpacity
                      style={styles.cardDeleteButton}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        handleDeleteSingle(cuenta.id, cuenta.titulo);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      {isDeleting ? (
                        <ActivityIndicator size="small" color={colors.error} />
                      ) : (
                        <Ionicons name="trash-outline" size={18} color={colors.error} />
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="game-controller-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyText}>No hay cuentas</Text>
            <Text style={styles.emptySubtext}>Presiona + para agregar</Text>
          </View>
        )}
      </ScrollView>

      {/* FAB buttons */}
      {!deleteMode && (
        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}

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
  loadingContainer: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  header: { 
    backgroundColor: colors.primary, 
    paddingTop: 50, 
    paddingBottom: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  abstractShape1: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  abstractShape2: {
    position: 'absolute',
    bottom: -10,
    left: -10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  title: { 
    fontSize: 16, 
    fontWeight: '900', 
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 1,
    fontStyle: 'italic',
  },
  // Delete toolbar
  deleteToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
  },
  deleteToolbarCancel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  deleteToolbarCancelText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  deleteToolbarCount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.error,
  },
  deleteToolbarConfirm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteToolbarConfirmDisabled: {
    opacity: 0.4,
  },
  deleteToolbarConfirmText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  scrollView: { flex: 1 },
  listContent: { padding: 10, paddingBottom: 100 },
  accountCard: { 
    borderRadius: 10, 
    padding: 8, 
    marginBottom: 6,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  accountCardSelected: {
    borderWidth: 2,
    borderColor: colors.error,
  },
  accountCardDeleting: {
    opacity: 0.4,
  },
  cardContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.error,
  },
  accountPhoto: { width: 50, height: 50, borderRadius: 25 },
  accountPhotoPlaceholder: { backgroundColor: colors.chipInactive, alignItems: 'center', justifyContent: 'center' },
  accountInfo: { flex: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2, gap: 4 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, alignItems: 'center' },
  accountTitle: { fontSize: 13, fontWeight: '600', color: colors.text, flex: 1, marginRight: 4 },
  regionBadge: { backgroundColor: colors.primary, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 },
  regionBadgeText: { fontSize: 8, fontWeight: 'bold', color: '#FFFFFF' },
  estadoSecBadge: { backgroundColor: '#8B5CF6', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3 },
  estadoSecBadgeText: { fontSize: 7, fontWeight: '600', color: '#FFFFFF' },
  accountEmail: { fontSize: 10, color: colors.textSecondary, marginBottom: 3 },
  pricesRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  priceLabel: { fontSize: 10, color: colors.textMuted },
  priceValue: { fontWeight: '600', color: colors.text },
  priceValueVenta: { fontWeight: '600', color: colors.success },
  ganancia: { fontSize: 10, fontWeight: 'bold' },
  gananciaPositiva: { color: colors.success },
  gananciaNegativa: { color: colors.error },
  tradeInfoRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  tradeInfoText: { fontSize: 9, color: colors.textSecondary, flex: 1 },
  tradeInfoLabel: { fontWeight: '600', color: colors.textMuted },
  cardDeleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: colors.text, marginTop: 16 },
  emptySubtext: { fontSize: 14, color: colors.textSecondary, marginTop: 8 },
  fab: { position: 'absolute', right: 20, bottom: 80, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 6 },
  modalContainer: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalScrollView: { flex: 1 },
  modalContent: { backgroundColor: colors.backgroundCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, minHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 12 },
  photoSelector: { width: '100%', height: 160, borderRadius: 12, overflow: 'hidden', marginBottom: 8 },
  photoPreview: { width: '100%', height: '100%' },
  photoPlaceholder: { width: '100%', height: '100%', backgroundColor: colors.chipInactive, alignItems: 'center', justifyContent: 'center' },
  photoPlaceholderText: { marginTop: 8, fontSize: 13, color: colors.textMuted },
  input: { backgroundColor: colors.background, borderRadius: 10, padding: 12, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  plataformaContainer: { flexDirection: 'row', gap: 8, paddingBottom: 8 },
  plataformaButton: { backgroundColor: colors.chipInactive, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  plataformaButtonActive: { backgroundColor: colors.primary },
  plataformaText: { fontSize: 13, fontWeight: '600', color: colors.chipTextInactive },
  plataformaTextActive: { color: colors.chipTextActive },
  regionContainer: { flexDirection: 'row', gap: 8, paddingBottom: 8 },
  regionButton: { backgroundColor: colors.chipInactive, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  regionButtonActive: { backgroundColor: colors.primary },
  regionText: { fontSize: 13, fontWeight: '600', color: colors.chipTextInactive },
  regionTextActive: { color: colors.chipTextActive },
  estadoPrincipalContainer: { flexDirection: 'row', gap: 8 },
  estadoPrincipalButton: { flex: 1, backgroundColor: colors.chipInactive, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  estadoPrincipalActive: { backgroundColor: colors.primary },
  estadoPrincipalText: { fontSize: 13, fontWeight: '600', color: colors.chipTextInactive },
  estadoPrincipalTextActive: { color: colors.chipTextActive },
  estadosContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  estadoChip: { backgroundColor: colors.chipInactive, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  estadoChipActive: { backgroundColor: colors.primary },
  estadoChipText: { fontSize: 11, fontWeight: '600', color: colors.chipTextInactive },
  estadoChipTextActive: { color: colors.chipTextActive },
  saveButton: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  deleteButtonModal: {
    flexDirection: 'row',
    backgroundColor: colors.error,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
