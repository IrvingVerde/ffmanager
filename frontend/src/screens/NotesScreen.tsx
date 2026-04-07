import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../utils/colors';
import { Ionicons } from '@expo/vector-icons';

type NoteCategory = 'todas' | 'tareas' | 'notas' | 'ideas';

export default function NotesScreen() {
  const [activeCategory, setActiveCategory] = useState<NoteCategory>('todas');
  const [showOptions, setShowOptions] = useState(false);

  const categories: { key: NoteCategory; label: string; icon: any }[] = [
    { key: 'todas', label: 'Todas', icon: 'apps' },
    { key: 'tareas', label: 'Tareas', icon: 'checkmark-circle-outline' },
    { key: 'notas', label: 'Notas', icon: 'document-text-outline' },
    { key: 'ideas', label: 'Ideas', icon: 'bulb-outline' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notas</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>Mis Notas</Text>

        {/* Categorías */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          <View style={styles.categories}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.categoryChip,
                  activeCategory === cat.key && styles.categoryChipActive
                ]}
                onPress={() => setActiveCategory(cat.key)}
              >
                <Ionicons 
                  name={cat.icon} 
                  size={16} 
                  color={activeCategory === cat.key ? colors.chipTextActive : colors.chipTextInactive}
                  style={{ marginRight: 6 }}
                />
                <Text style={[
                  styles.categoryText,
                  activeCategory === cat.key && styles.categoryTextActive
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Estado vacío */}
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={80} color={colors.textMuted} />
          <Text style={styles.emptyText}>No hay notas</Text>
          <Text style={styles.emptySubtext}>Agrega una nueva</Text>
        </View>
      </View>

      {/* Botones flotantes */}
      {showOptions && (
        <>
          <TouchableOpacity 
            style={[styles.fabSecondary, { bottom: 200, backgroundColor: colors.warning }]}
            onPress={() => console.log('Nueva idea')}
          >
            <Ionicons name="bulb" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.fabSecondary, { bottom: 140, backgroundColor: '#9CA3AF' }]}
            onPress={() => console.log('Nueva nota')}
          >
            <Ionicons name="document-text" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity 
        style={styles.fabMain}
        onPress={() => setShowOptions(!showOptions)}
      >
        <Ionicons name={showOptions ? "close" : "add"} size={28} color="#FFFFFF" />
      </TouchableOpacity>
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
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  categoriesScroll: {
    marginBottom: 24,
  },
  categories: {
    flexDirection: 'row',
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.chipInactive,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  categoryChipActive: {
    backgroundColor: colors.chipActive,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.chipTextInactive,
  },
  categoryTextActive: {
    color: colors.chipTextActive,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
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
  },
  fabMain: {
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
  fabSecondary: {
    position: 'absolute',
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
});