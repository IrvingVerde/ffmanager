import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { initDatabase } from '../src/services/database';
import { useStore } from '../src/store/useStore';
import NetInfo from '@react-native-community/netinfo';

export default function RootLayout() {
  const setIsOnline = useStore(state => state.setIsOnline);

  useEffect(() => {
    // Inicializar base de datos SQLite
    initDatabase();

    // Monitorear estado de conexión
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
