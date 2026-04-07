import * as SQLite from 'expo-sqlite';
import { Transaction, Account } from '../types';

let db: SQLite.SQLiteDatabase | null = null;

export const initDatabase = async () => {
  try {
    db = await SQLite.openDatabaseAsync('freefire_accounts.db');
    
    // Crear tabla de transacciones
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS transacciones (
        id TEXT PRIMARY KEY,
        tipo TEXT NOT NULL,
        monto REAL NOT NULL,
        moneda TEXT NOT NULL,
        fecha TEXT NOT NULL,
        cuenta_relacionada TEXT,
        notas TEXT,
        created_at TEXT NOT NULL,
        sync_status TEXT DEFAULT 'pending'
      );
    `);
    
    // Crear tabla de cuentas
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS cuentas (
        id TEXT PRIMARY KEY,
        titulo TEXT NOT NULL,
        plataforma TEXT NOT NULL,
        plataforma_otro TEXT,
        email TEXT NOT NULL,
        password TEXT NOT NULL,
        codigos_respaldo TEXT,
        estado TEXT,
        region TEXT NOT NULL,
        notas TEXT,
        fecha_compra TEXT,
        fecha_venta TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        sync_status TEXT DEFAULT 'pending'
      );
    `);
    
    console.log('Base de datos SQLite inicializada');
  } catch (error) {
    console.error('Error inicializando base de datos:', error);
  }
};

// ============ TRANSACCIONES LOCALES ============

export const guardarTransaccionLocal = async (transaction: Transaction) => {
  if (!db) return;
  
  try {
    await db.runAsync(
      `INSERT OR REPLACE INTO transacciones 
       (id, tipo, monto, moneda, fecha, cuenta_relacionada, notas, created_at, sync_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transaction.id,
        transaction.tipo,
        transaction.monto,
        transaction.moneda,
        transaction.fecha,
        transaction.cuenta_relacionada || null,
        transaction.notas || null,
        transaction.created_at,
        'synced'
      ]
    );
  } catch (error) {
    console.error('Error guardando transacción local:', error);
  }
};

export const obtenerTransaccionesLocales = async (): Promise<Transaction[]> => {
  if (!db) return [];
  
  try {
    const result = await db.getAllAsync<Transaction>(
      'SELECT * FROM transacciones ORDER BY fecha DESC'
    );
    return result;
  } catch (error) {
    console.error('Error obteniendo transacciones locales:', error);
    return [];
  }
};

export const eliminarTransaccionLocal = async (id: string) => {
  if (!db) return;
  
  try {
    await db.runAsync('DELETE FROM transacciones WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error eliminando transacción local:', error);
  }
};

// ============ CUENTAS LOCALES ============

export const guardarCuentaLocal = async (account: Account) => {
  if (!db) return;
  
  try {
    await db.runAsync(
      `INSERT OR REPLACE INTO cuentas 
       (id, titulo, plataforma, plataforma_otro, email, password, codigos_respaldo, 
        estado, region, notas, fecha_compra, fecha_venta, created_at, updated_at, sync_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        account.id,
        account.titulo,
        account.plataforma,
        account.plataforma_otro || null,
        account.email,
        account.password,
        account.codigos_respaldo || null,
        JSON.stringify(account.estado),
        account.region,
        account.notas || null,
        account.fecha_compra || null,
        account.fecha_venta || null,
        account.created_at,
        account.updated_at,
        'synced'
      ]
    );
  } catch (error) {
    console.error('Error guardando cuenta local:', error);
  }
};

export const obtenerCuentasLocales = async (): Promise<Account[]> => {
  if (!db) return [];
  
  try {
    const result = await db.getAllAsync<any>(
      'SELECT * FROM cuentas ORDER BY created_at DESC'
    );
    
    return result.map(cuenta => ({
      ...cuenta,
      estado: JSON.parse(cuenta.estado || '[]')
    }));
  } catch (error) {
    console.error('Error obteniendo cuentas locales:', error);
    return [];
  }
};

export const eliminarCuentaLocal = async (id: string) => {
  if (!db) return;
  
  try {
    await db.runAsync('DELETE FROM cuentas WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error eliminando cuenta local:', error);
  }
};
