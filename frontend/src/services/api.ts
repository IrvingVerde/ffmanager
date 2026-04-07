import axios from 'axios';
import { Transaction, TransactionCreate, FinancialSummary, Account, AccountCreate } from '../types';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============ TRANSACCIONES ============

export const crearTransaccion = async (data: TransactionCreate): Promise<Transaction> => {
  const response = await api.post('/transacciones', data);
  return response.data;
};

export const obtenerTransacciones = async (): Promise<Transaction[]> => {
  const response = await api.get('/transacciones');
  return response.data;
};

export const obtenerTransaccion = async (id: string): Promise<Transaction> => {
  const response = await api.get(`/transacciones/${id}`);
  return response.data;
};

export const actualizarTransaccion = async (id: string, data: TransactionCreate): Promise<Transaction> => {
  const response = await api.put(`/transacciones/${id}`, data);
  return response.data;
};

export const eliminarTransaccion = async (id: string): Promise<void> => {
  await api.delete(`/transacciones/${id}`);
};

export const obtenerResumenFinanciero = async (): Promise<FinancialSummary> => {
  const response = await api.get('/dashboard/financiero');
  return response.data;
};

// ============ CUENTAS ============

export const crearCuenta = async (data: AccountCreate): Promise<Account> => {
  const response = await api.post('/cuentas', data);
  return response.data;
};

export const obtenerCuentas = async (): Promise<Account[]> => {
  const response = await api.get('/cuentas');
  return response.data;
};

export const obtenerCuenta = async (id: string): Promise<Account> => {
  const response = await api.get(`/cuentas/${id}`);
  return response.data;
};

export const actualizarCuenta = async (id: string, data: AccountCreate): Promise<Account> => {
  const response = await api.put(`/cuentas/${id}`, data);
  return response.data;
};

export const eliminarCuenta = async (id: string): Promise<void> => {
  await api.delete(`/cuentas/${id}`);
};

export const buscarCuentas = async (query: string): Promise<Account[]> => {
  const response = await api.get(`/cuentas/buscar/${query}`);
  return response.data;
};
