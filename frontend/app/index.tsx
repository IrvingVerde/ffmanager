import React from 'react';
import { Redirect } from 'expo-router';

export default function Index() {
  // Redirigir directamente a la pantalla de tabs
  return <Redirect href="/(tabs)/dashboard" />;
}
