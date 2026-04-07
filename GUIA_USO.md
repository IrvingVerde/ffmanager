# 🎮 Gestor de Cuentas Free Fire

Aplicación móvil profesional para gestionar y revender cuentas de Free Fire con seguimiento financiero integrado.

## ✨ Características Principales

### 📊 Gestión Financiera
- **Dashboard Completo**: Visualiza tus ganancias, gastos e inversiones en tiempo real
- **Soporte Multi-moneda**: PEN (Soles Peruanos) y USD (Dólares Americanos)
- **Transacciones**:
  - Ingresos (ventas de cuentas)
  - Gastos (compra de cuentas, inversiones)
  - Inversiones
- **Cálculo Automático**: Ganancia neta calculada automáticamente
- **Historial Completo**: Ve todas tus transacciones ordenadas por fecha

### 🎯 Gestión de Cuentas
- **Inventario Completo**: Gestiona todas tus cuentas de Free Fire
- **Información Detallada**:
  - Título de la cuenta
  - Plataforma vinculada (Facebook, Google, VK, Twitter, Otro)
  - **Credenciales destacadas** con botón de copia rápida
  - Estados múltiples (Disponible, Vendida, Reservada, En Proceso, etc.)
  - Región (USA, Sudamérica)
  - Notas personalizadas
  - Fechas de compra y venta
- **Búsqueda Inteligente**: Encuentra cuentas por título, email, notas o plataforma
- **Vista Detallada**: Acceso rápido a toda la información de cada cuenta

### 🔄 Sincronización Offline/Online
- **Modo Offline**: Trabaja sin internet, todos los datos se guardan localmente
- **Sincronización Automática**: Cuando hay internet, los datos se sincronizan con la nube
- **Indicador de Estado**: Ve si estás en línea u offline en todo momento
- **AsyncStorage**: Persistencia local de datos para acceso instantáneo

### 🎨 Diseño Moderno
- **UI Profesional**: Inspirada en aplicaciones fintech
- **Modo Oscuro**: Interfaz elegante y moderna
- **Navegación Intuitiva**: Tabs para acceso rápido a cada módulo
- **Animaciones Suaves**: Experiencia de usuario fluida
- **Responsive**: Optimizada para todos los tamaños de pantalla móvil

## 🛠️ Stack Tecnológico

### Frontend
- **React Native** con **Expo Router** (navegación file-based)
- **TypeScript** para type-safety
- **Zustand** para manejo de estado global
- **AsyncStorage** para persistencia local
- **Axios** para peticiones HTTP
- **React Navigation** para navegación por tabs
- **Expo Vector Icons** para iconografía

### Backend
- **FastAPI** (Python) - API REST moderna y rápida
- **MongoDB** - Base de datos NoSQL para almacenamiento en la nube
- **Motor** - Driver asíncrono de MongoDB
- **Pydantic** - Validación de datos

## 💡 Cómo Usar la Aplicación

### 1. Gestión Financiera

#### Dashboard
- Visualiza tus totales de ganancias, gastos, inversiones y ganancia neta
- Todo separado por moneda (PEN y USD)
- Pull to refresh para actualizar

#### Agregar Transacción
1. Ve a la pestaña "Transacciones"
2. Presiona el botón "+"
3. Selecciona el tipo (Ingreso, Gasto o Inversión)
4. Elige la moneda (PEN o USD)
5. Ingresa el monto
6. Agrega notas opcionales
7. Guarda

### 2. Gestión de Cuentas

#### Ver Cuentas
- Ve a la pestaña "Cuentas"
- Visualiza todas tus cuentas con su estado
- Toca cualquier cuenta para ver detalles completos

#### Agregar Cuenta
1. Presiona el botón "+"
2. Completa la información:
   - **Título**: Nombre identificador (ej: "Cuenta FF #1")
   - **Plataforma**: Facebook, Google, VK, Twitter u Otro
   - **Email**: Correo de la cuenta ⭐
   - **Contraseña**: Contraseña de acceso ⭐
   - **Región**: USA o Sudamérica
   - **Estados**: Disponible, Reservada, Vendida, etc.
   - **Notas**: Información adicional
3. Guarda

#### Ver Detalles y Copiar Credenciales
1. Toca una cuenta de la lista
2. Se abrirá la vista detallada
3. En la sección "CREDENCIALES" (destacada):
   - Email y Contraseña están visibles
   - Toca el ícono de copiar al lado de cada uno
   - Se copiará automáticamente al portapapeles
4. Ve toda la información: plataforma, región, estados, notas

## 📊 Estados de Cuenta Disponibles

- ✅ **Disponible**: Cuenta lista para vender
- 🔄 **En Proceso**: Cuenta en negociación
- 📦 **Reservada**: Cuenta apartada para un cliente
- ✔️ **Vendida**: Cuenta ya vendida
- 📧 **Email Confirmado**: Email verificado
- ❌ **Email Perdido**: Sin acceso al email

---

**Desarrollado con ❤️ para revendedores de cuentas Free Fire**
