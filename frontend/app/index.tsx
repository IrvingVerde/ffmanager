import React from 'react';
import { Redirect } from 'expo-router';

export default function Index() {
  // Redirigir directamente a Inventario (primera pesta\u00f1a)
  return <Redirect href="/(tabs)/inventario" />;
}
