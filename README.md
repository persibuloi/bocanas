# 🎳 Sistema de Gestión de Apuestas Deportivas de Boliche

Una aplicación web moderna y completamente funcional para gestionar apuestas deportivas en torneos de boliche, integrada directamente con Airtable como base de datos.

## ✨ Características Principales

### 🎯 Funcionalidades Core
- **Dashboard Intuitivo**: Vista general con métricas en tiempo real y apuestas pendientes
- **Registro de Apuestas**: Formulario optimizado para crear nuevas apuestas rápidamente durante eventos
- **Gestión de Apostadores**: CRUD completo para administrar usuarios del sistema
- **Historial Completo**: Lista filtrable y ordenable de todas las apuestas con búsqueda avanzada
- **Estadísticas Avanzadas**: Análisis detallado de rendimiento con múltiples métricas
- **Cálculos Automáticos**: Ganancias y pérdidas calculadas automáticamente

### 🎨 Diseño y UX
- **Diseño Deportivo Moderno**: Paleta de colores verde, azul y blanco inspirada en deportes
- **Completamente Responsivo**: Optimizado para móviles, tablets y desktop
- **Interfaz Rápida**: Diseñada para uso durante eventos deportivos en vivo
- **Navegación Intuitiva**: Sidebar con iconos descriptivos y navegación clara
- **Feedback Visual**: Notificaciones toast y estados visuales claros

### 🔧 Tecnologías Utilizadas
- **Frontend**: React 18.3 + TypeScript + Vite
- **Styling**: TailwindCSS 3.4 con diseño personalizado
- **Base de Datos**: Airtable API (integración directa)
- **Iconos**: Lucide React
- **Notificaciones**: React Hot Toast
- **Estado**: React Hooks personalizados
- **Routing**: React Router 6

## 🆕 Cambios recientes – Bocanas

Se implementaron mejoras enfocadas en la experiencia del usuario para la gestión de bocanas:

- **Persistencia de filtros en listado de bocanas** (`src/pages/Bocanas.tsx`):
  - Guarda automáticamente filtros, búsqueda y orden en `localStorage`.
  - Carga filtros desde `localStorage` al abrir y también desde query params (URL).
  - Nuevo botón “Ir al dashboard” que navega a `'/bocanas-dashboard'` conservando los filtros en la URL.

- **Persistencia de filtros en Dashboard** (`src/pages/BocanasDashboard.tsx`):
  - Inicializa filtros desde query params y, si no existen, desde `localStorage`.
  - Sincroniza URL y estado, permitiendo compartir enlaces con filtros activos.
  - Acceso rápido de vuelta al listado manteniendo contexto.

- **Mejoras UX en Nueva Bocana** (`src/pages/NuevaBocana.tsx`):
  - Autocomplete de jugador con sugerencias filtradas y persistencia del último seleccionado.
  - Validación inline de campos (jugador, torneo, jornada ≥ 1, tipo).
  - Atajos de teclado: `Esc` limpia el formulario y `Enter` envía.
  - Normalización de jornada: mínimo 1 y entero.

Estas mejoras apuntan a reducir fricción, mantener el contexto entre vistas y acelerar el registro y gestión de penalidades.

## 🚀 URL de la Aplicación

**🌐 Aplicación Desplegada**: [https://jlg1fzp69me2.space.minimax.io](https://jlg1fzp69me2.space.minimax.io)

## 📊 Estructura de Datos (Airtable)

### Tabla: Apostadores
| Campo | Tipo | Descripción |
|-------|------|-------------|
| Nombre | Text | Nombre completo del apostador |
| Email | Email | Correo electrónico (opcional) |
| Telefono | Phone Number | Teléfono de contacto (opcional) |
| Activo | Checkbox | Estado activo/inactivo |
| Fecha_Registro | Date | Fecha de registro automática |
| Total_Apostado | Currency | Monto total apostado |
| Total_Ganado | Currency | Total de ganancias |
| Balance | Currency | Balance neto actual |

### Tabla: Apuestas
| Campo | Tipo | Descripción |
|-------|------|-------------|
| Apostador_ID | Link to Record | Referencia al apostador |
| Torneo | Single Select | Nombre del torneo |
| Tipo_Apuesta | Single Select | Tipo de apuesta (Strike, Spare, etc.) |
| Descripcion | Long Text | Descripción adicional |
| Monto | Currency | Monto apostado |
| Odds | Number | Cuota/multiplicador |
| Resultado_Esperado | Text | Descripción del resultado esperado |
| Estado | Single Select | Pendiente/Ganada/Perdida |
| Fecha_Creacion | Date | Timestamp de creación |
| Fecha_Resolucion | Date | Fecha de resolución |
| Ganancia_Potencial | Currency | Ganancia calculada si gana |
| Ganancia_Real | Currency | Ganancia/pérdida real |

## 🎮 Guía de Uso

### 1. Dashboard Principal
- **Vista general** de todas las métricas importantes
- **Apuestas pendientes** con detalles rápidos
- **Estadísticas resumidas** en tiempo real
- **Acciones rápidas** para navegación

### 2. Registro de Nueva Apuesta
- **Selección de apostador** desde lista de usuarios activos
- **Selección de torneo** con opciones predefinidas
- **Tipos de apuesta** específicos para boliche
- **Calculadora automática** de ganancias potenciales
- **Validación en tiempo real** de todos los campos

### 3. Gestión de Apostadores
- **Lista completa** con información de contacto
- **Estadísticas por apostador** (balance, total apostado)
- **Crear/Editar/Eliminar** apostadores
- **Filtro de búsqueda** por nombre o email
- **Estados activo/inactivo**

### 4. Historial de Apuestas
- **Lista completa** de todas las apuestas
- **Filtros avanzados**: por estado, apostador, torneo
- **Búsqueda en tiempo real**
- **Edición rápida** de estado y detalles
- **Información detallada** de cada apuesta

### 5. Estadísticas y Análisis
- **Métricas generales**: tasa de éxito, ROI, promedios
- **Top apostadores** por volumen y rendimiento
- **Análisis por tipos** de apuesta
- **Rendimiento por torneo**
- **Resumen financiero** completo

## 🔄 Flujo de Trabajo Típico

1. **Configuración Inicial**:
   - Crear apostadores en el sistema
   - Configurar torneos disponibles

2. **Durante un Evento Deportivo**:
   - Abrir "Nueva Apuesta" rápidamente
   - Seleccionar apostador y torneo
   - Ingresar detalles y monto
   - Confirmar con cálculo automático

3. **Seguimiento**:
   - Monitorear apuestas pendientes desde Dashboard
   - Actualizar estados cuando se resuelvan
   - Ver estadísticas actualizadas

4. **Análisis**:
   - Revisar historial completo
   - Analizar rendimiento en Estadísticas
   - Tomar decisiones basadas en datos

## 📱 Características Móviles

- **Navegación adaptativa** con menú hamburguesa
- **Formularios optimizados** para pantallas táctiles
- **Tablas responsivas** con scroll horizontal
- **Botones de tamaño adecuado** para dedos
- **Interfaz rápida** para uso en vivo

## 🎯 Casos de Uso Principales

1. **Gestión durante Torneos**: Registro rápido de apuestas en tiempo real
2. **Seguimiento de Apostadores**: Control de balances y rendimiento individual
3. **Análisis de Rendimiento**: Identificar patrones y tendencias
4. **Administración Financiera**: Control total de flujo de dinero
5. **Reportes**: Estadísticas detalladas para toma de decisiones

## 🔐 Integración con Airtable

La aplicación utiliza Airtable como backend, proporcionando:
- **Almacenamiento confiable** en la nube
- **Acceso desde cualquier lugar**
- **Backup automático** de datos
- **API robusta** para operaciones CRUD
- **Interfaz adicional** en Airtable si es necesario

## 🎨 Filosofía de Diseño

- **Claridad Visual**: Información importante siempre visible
- **Eficiencia**: Mínimo número de clics para tareas comunes
- **Consistencia**: Patrones de diseño unificados
- **Accesibilidad**: Contrastes adecuados y navegación clara
- **Deportivo**: Colores y elementos que reflejan el contexto

---

**Desarrollado por MiniMax Agent** - Sistema completo de gestión de apuestas deportivas con integración directa a Airtable.# bocanas
