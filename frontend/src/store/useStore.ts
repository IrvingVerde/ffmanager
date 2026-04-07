import { create } from 'zustand';
import { Transaction, FinancialSummary, Account } from '../types';

interface AppState {
  // Transacciones
  transacciones: Transaction[];
  resumenFinanciero: FinancialSummary | null;
  setTransacciones: (transacciones: Transaction[]) => void;
  setResumenFinanciero: (resumen: FinancialSummary) => void;
  agregarTransaccion: (transaccion: Transaction) => void;
  eliminarTransaccionStore: (id: string) => void;
  
  // Cuentas
  cuentas: Account[];
  setCuentas: (cuentas: Account[]) => void;
  agregarCuenta: (cuenta: Account) => void;
  actualizarCuentaStore: (id: string, cuenta: Account) => void;
  eliminarCuentaStore: (id: string) => void;
  
  // Estado de red
  isOnline: boolean;
  setIsOnline: (status: boolean) => void;
  
  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  // Transacciones
  transacciones: [],
  resumenFinanciero: null,
  setTransacciones: (transacciones) => set({ transacciones }),
  setResumenFinanciero: (resumen) => set({ resumenFinanciero: resumen }),
  agregarTransaccion: (transaccion) => 
    set((state) => ({ transacciones: [transaccion, ...state.transacciones] })),
  eliminarTransaccionStore: (id) => 
    set((state) => ({ transacciones: state.transacciones.filter(t => t.id !== id) })),
  
  // Cuentas
  cuentas: [],
  setCuentas: (cuentas) => set({ cuentas }),
  agregarCuenta: (cuenta) => 
    set((state) => ({ cuentas: [cuenta, ...state.cuentas] })),
  actualizarCuentaStore: (id, cuenta) => 
    set((state) => ({ 
      cuentas: state.cuentas.map(c => c.id === id ? cuenta : c) 
    })),
  eliminarCuentaStore: (id) => 
    set((state) => ({ cuentas: state.cuentas.filter(c => c.id !== id) })),
  
  // Estado de red
  isOnline: true,
  setIsOnline: (status) => set({ isOnline: status }),
  
  // Loading
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
