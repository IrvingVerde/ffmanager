export type MonedaType = 'PEN' | 'USD';
export type TipoTransaccion = 'ingreso' | 'gasto' | 'inversion';

export interface Transaction {
  id: string;
  tipo: TipoTransaccion;
  monto: number;
  moneda: MonedaType;
  fecha: string;
  cuenta_relacionada?: string;
  notas?: string;
  created_at: string;
}

export interface TransactionCreate {
  tipo: TipoTransaccion;
  monto: number;
  moneda: MonedaType;
  fecha: string;
  cuenta_relacionada?: string;
  notas?: string;
}

export interface FinancialSummary {
  total_ingresos_pen: number;
  total_ingresos_usd: number;
  total_gastos_pen: number;
  total_gastos_usd: number;
  total_inversiones_pen: number;
  total_inversiones_usd: number;
  ganancia_neta_pen: number;
  ganancia_neta_usd: number;
}

export type PlataformaType = 'Facebook' | 'Google' | 'VK' | 'Twitter' | 'Otro';
export type EstadoPrincipal = 'Disponible' | 'Vendida' | 'Reservada';
export type EstadoSecundario = 'En Proceso' | 'Correo Confirmado' | 'Correo Perdido' | 'Pura';

export interface Account {
  id: string;
  titulo: string;
  plataforma: PlataformaType;
  plataforma_otro?: string;
  email: string;
  password: string;
  codigos_respaldo?: string;
  foto_base64?: string;
  precio_compra: number;
  precio_venta: number;
  estado_principal: EstadoPrincipal;
  estados_secundarios: EstadoSecundario[];
  region: string;
  notas?: string;
  vendedor?: string;
  comprador?: string;
  fecha_compra?: string;
  fecha_venta?: string;
  created_at: string;
  updated_at: string;
}

export interface AccountCreate {
  titulo: string;
  plataforma: PlataformaType;
  plataforma_otro?: string;
  email: string;
  password: string;
  codigos_respaldo?: string;
  foto_base64?: string;
  precio_compra: number;
  precio_venta: number;
  estado_principal: EstadoPrincipal;
  estados_secundarios: EstadoSecundario[];
  region: string;
  notas?: string;
  vendedor?: string;
  comprador?: string;
  fecha_compra?: string;
  fecha_venta?: string;
}
