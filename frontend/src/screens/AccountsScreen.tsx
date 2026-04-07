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
  Image,
} from 'react-native';
import { colors } from '../utils/colors';
import { useStore } from '../store/useStore';
import { 
  obtenerCuentas, 
  crearCuenta,
  actualizarCuenta,
} from '../services/api';
import { guardarCuentaLocal, obtenerCuentasLocales } from '../services/database';
import { Ionicons } from '@expo/vector-icons';
import { PlataformaType, EstadoCuenta, AccountCreate } from '../types';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';

type FilterType = 'todas' | 'disponible' | 'en_proceso' | 'correo_confirmado';

export default function AccountsScreen() {
  const { cuentas, setCuentas, agregarCuenta, actualizarCuentaStore, isOnline } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
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
  const [fotoBase64, setFotoBase64] = useState<string | undefined>(undefined);
  const [precioCompra, setPrecioCompra] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [estados, setEstados] = useState<EstadoCuenta[]>(['Disponible']);
  const [editingId, setEditingId] = useState<string | null>(null);

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
        estado: estados,
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
        estado: estados,
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

  const resetForm = () => {
    setTitulo('');
    setEmail('');
    setPassword('');
    setNotas('');
    setCodigosRespaldo('');
    setFotoBase64(undefined);
    setPrecioCompra('');
    setPrecioVenta('');
    setEstados(['Disponible']);
    setEditingId(null);
  };

  const abrirEdicion = (cuenta: any) => {
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
    setEstados(cuenta.estado);
    setEditModalVisible(true);
  };

  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copiado', `${label} copiado`);
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

  const filteredCuentas = cuentas.filter(cuenta => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        cuenta.titulo.toLowerCase().includes(query) ||
        cuenta.email.toLowerCase().includes(query) ||
        (cuenta.notas && cuenta.notas.toLowerCase().includes(query));
      
      if (!matchesSearch) return false;
    }

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

        {/* Foto */}
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
        <View style={styles.regionContainer}>
          <TouchableOpacity
            style={[styles.regionButton, region === 'USA' && styles.regionButtonActive]}
            onPress={() => setRegion('USA')}
          >
            <Text style={[styles.regionText, region === 'USA' && styles.regionTextActive]}>USA</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.regionButton, region === 'South America' && styles.regionButtonActive]}
            onPress={() => setRegion('South America')}
          >
            <Text style={[styles.regionText, region === 'South America' && styles.regionTextActive]}>Sudamérica</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Estados</Text>
        <View style={styles.estadosContainer}>
          {estadosDisponibles.map((estado) => (
            <TouchableOpacity
              key={estado}
              style={[styles.estadoChip, estados.includes(estado) && styles.estadoChipActive]}
              onPress={() => toggleEstado(estado)}
            >
              <Text style={[styles.estadoChipText, estados.includes(estado) && styles.estadoChipTextActive]}>
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
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventario</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filtros más pequeños */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
        <View style={styles.filtersContainer}>
          {[
            { key: 'todas' as FilterType, label: 'Todas' },
            { key: 'disponible' as FilterType, label: 'Disponible' },
            { key: 'en_proceso' as FilterType, label: 'En proceso' },
            { key: 'correo_confirmado' as FilterType, label: 'Confirmado' },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterChip, activeFilter === filter.key && styles.filterChipActive]}
              onPress={() => setActiveFilter(filter.key)}
            >
              <Text style={[styles.filterText, activeFilter === filter.key && styles.filterTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {filteredCuentas.length > 0 ? (
          filteredCuentas.map((cuenta) => {
            const ganancia = calcularGanancia(cuenta.precio_compra || 0, cuenta.precio_venta || 0);
            return (
              <TouchableOpacity 
                key={cuenta.id}
                style={styles.accountCard}
                onPress={() => abrirEdicion(cuenta)}
                activeOpacity={0.7}
              >
                <View style={styles.cardContent}>
                  {cuenta.foto_base64 ? (
                    <Image source={{ uri: cuenta.foto_base64 }} style={styles.accountPhoto} />
                  ) : (
                    <View style={[styles.accountPhoto, styles.accountPhotoPlaceholder]}>
                      <Ionicons name="person" size={24} color={colors.textMuted} />
                    </View>
                  )}

                  <View style={styles.accountInfo}>
                    <Text style={styles.accountTitle} numberOfLines={1}>{cuenta.titulo}</Text>
                    <Text style={styles.accountEmail} numberOfLines={1}>{cuenta.email}</Text>
                    
                    <View style={styles.pricesRow}>
                      <Text style={styles.priceLabel}>Compra: <Text style={styles.priceValue}>S/ {cuenta.precio_compra?.toFixed(2) || '0.00'}</Text></Text>
                      <Text style={styles.priceLabel}>Venta: <Text style={styles.priceValueVenta}>S/ {cuenta.precio_venta?.toFixed(2) || '0.00'}</Text></Text>
                    </View>
                    
                    <Text style={[styles.ganancia, ganancia >= 0 ? styles.gananciaPositiva : styles.gananciaNegativa]}>
                      Ganancia: S/ {ganancia.toFixed(2)}
                    </Text>
                  </View>
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

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
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
  loadingContainer: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: colors.primary, padding: 20, paddingTop: 60, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
  searchContainer: { padding: 12, backgroundColor: colors.background },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundCard, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  filtersScroll: { paddingHorizontal: 12, marginBottom: 4 },
  filtersContainer: { flexDirection: 'row', gap: 6, paddingBottom: 4 },
  filterChip: { backgroundColor: colors.chipInactive, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  filterChipActive: { backgroundColor: colors.chipActive },
  filterText: { fontSize: 11, fontWeight: '600', color: colors.chipTextInactive },
  filterTextActive: { color: colors.chipTextActive },
  scrollView: { flex: 1 },
  listContent: { padding: 12, paddingBottom: 100 },
  accountCard: { backgroundColor: colors.backgroundCard, borderRadius: 12, padding: 12, marginBottom: 10 },
  cardContent: { flexDirection: 'row', gap: 12 },
  accountPhoto: { width: 70, height: 70, borderRadius: 35 },
  accountPhotoPlaceholder: { backgroundColor: colors.chipInactive, alignItems: 'center', justifyContent: 'center' },
  accountInfo: { flex: 1 },
  accountTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  accountEmail: { fontSize: 13, color: colors.textSecondary, marginBottom: 6 },
  pricesRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  priceLabel: { fontSize: 11, color: colors.textMuted },
  priceValue: { fontWeight: '600', color: colors.text },
  priceValueVenta: { fontWeight: '600', color: colors.success },
  ganancia: { fontSize: 13, fontWeight: 'bold', marginTop: 2 },
  gananciaPositiva: { color: colors.success },
  gananciaNegativa: { color: colors.error },
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
  photoSelector: { width: '100%', height: 180, borderRadius: 12, overflow: 'hidden', marginBottom: 8 },
  photoPreview: { width: '100%', height: '100%' },
  photoPlaceholder: { width: '100%', height: '100%', backgroundColor: colors.chipInactive, alignItems: 'center', justifyContent: 'center' },
  photoPlaceholderText: { marginTop: 8, fontSize: 13, color: colors.textMuted },
  input: { backgroundColor: colors.background, borderRadius: 10, padding: 12, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  plataformaContainer: { flexDirection: 'row', gap: 8 },
  plataformaButton: { backgroundColor: colors.chipInactive, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  plataformaButtonActive: { backgroundColor: colors.primary },
  plataformaText: { fontSize: 13, fontWeight: '600', color: colors.chipTextInactive },
  plataformaTextActive: { color: colors.chipTextActive },
  regionContainer: { flexDirection: 'row', gap: 8 },
  regionButton: { flex: 1, backgroundColor: colors.chipInactive, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  regionButtonActive: { backgroundColor: colors.primary },
  regionText: { fontSize: 13, fontWeight: '600', color: colors.chipTextInactive },
  regionTextActive: { color: colors.chipTextActive },
  estadosContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  estadoChip: { backgroundColor: colors.chipInactive, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  estadoChipActive: { backgroundColor: colors.primary },
  estadoChipText: { fontSize: 11, fontWeight: '600', color: colors.chipTextInactive },
  estadoChipTextActive: { color: colors.chipTextActive },
  saveButton: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
});
