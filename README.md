# 🌸 Florería Perla – Sistema de Administración

Sistema de gestión de inventario y pedidos listo para producción, diseñado para una florería familiar que opera en entorno digital.  
Construido con **Next.js 14 · Prisma · Neon PostgreSQL · NextAuth · Netlify**.

---

## 🌺 Descripción General del Proyecto

**Florería Perla** es un negocio familiar emergente que opera completamente en un entorno digital, sin punto de venta físico. Sus pedidos se gestionan principalmente a través de WhatsApp y el principal reto operativo era la administración manual del inventario: un proceso propenso a errores humanos, sin trazabilidad histórica y sin visibilidad en tiempo real del estado del stock.

Este repositorio contiene el sistema de administración diseñado para digitalizar y automatizar esos procesos, tomando como base un análisis detallado de la problemática real del negocio. La solución fue desarrollada iterativamente, partiendo de entrevistas directas con las propietarias, análisis ontológico del dominio y validación continua de los requerimientos.

---

## 🔍 Contexto y Problemática Detectada

Durante el levantamiento de requerimientos con las propietarias de Florería Perla se identificaron los siguientes problemas críticos que motivaron el desarrollo de este sistema:

### Control Manual del Inventario
La operación del negocio se basaba en registros físicos (cuadernos, notas) susceptibles a errores de transcripción. Un número mal ingresado o una letra mal interpretada podía generar descuadres que impactaban directamente las decisiones de compra.

### Falta de Actualización en Tiempo Real
No existía un mecanismo para saber con exactitud qué había en inventario, qué se había vendido o cuánto quedaba disponible. Esto generaba una gestión reactiva: se descubría el desabasto cuando ya era tarde para reaccionar.

### Vulnerabilidad del Producto (Perecibilidad)
Las flores son productos biológicos perecederos con una vida útil limitada. A diferencia de productos no perecederos, el inventario floral requiere monitoreo constante de frescura para minimizar mermas. El negocio maneja aproximadamente **15 tipos de flores**, cada una con tiempos de vida variables (generalmente entre 7 y 10 días según proveedor y variedad).

### Ausencia de Historial y Análisis de Datos
Al ser un negocio relativamente nuevo (operando desde aproximadamente febrero), no contaba con registros históricos estructurados. Las decisiones de compra se tomaban de forma intuitiva, basadas en observación y experiencia subjetiva, sin datos que las sustentaran.

### Demanda Estacional No Gestionada
Fechas como el **14 de febrero (San Valentín)**, el **Día de la Madre** y el **Día de las Flores Amarillas** generan picos de demanda considerables. Sin un sistema de alerta o planificación, el negocio corría el riesgo de quedarse sin stock en sus temporadas más rentables.

### Escasez de Mercancía e Impacto Reputacional
Se reportaron casos en los que no se podían completar pedidos por falta de flores. Esto representa un impacto directo tanto económico como reputacional para un negocio que crece principalmente por recomendación.

---

## 🎯 Solución Propuesta y Requerimientos Clave

A partir del análisis ontológico y las sesiones de requerimientos, se definieron cuatro pilares para la solución:

### 1. Sistema Predictivo por Temporada
El sistema identifica temporadas altas y genera alertas proactivas para que el negocio pueda anticipar compras. Aunque el histórico de ventas es aún corto (menos de un año), la arquitectura está diseñada para acumular datos y mejorar sus predicciones con el tiempo. Las temporadas clave se pueden configurar manualmente como punto de partida.

### 2. Monitoreo en Tiempo Real del Inventario
Cada lote de flores ingresado al sistema lleva asociado su tiempo de vida estimado. El panel de inventario muestra visualmente el estado de frescura de cada lote (fresco, por vencer, vencido) con un código de colores, permitiendo tomar decisiones de venta o descarte sin necesidad de inspección física constante.

### 3. Negocio Familiar Digital y Escalable
El sistema está diseñado para operar desde cualquier dispositivo (mobile-first), sin depender de una tienda física. El control de acceso diferencia entre el rol de **Propietario** (administración completa) y **Empleado** (operación del día a día), pensando en la estructura familiar del negocio.

### 4. Reducción de Carga Operativa Manual
El registro de entradas, salidas y mermas del inventario se realiza en pocos clics, con soporte para registrar pedidos por unidad de flor (la modalidad acordada durante el análisis de requerimientos). Los pedidos más frecuentes (por ejemplo: ramos de 6, 8, 12, 24, 50 o 100 rosas) pueden registrarse de forma rápida ajustando cantidades directamente en el sistema.

---

## 🗺️ Proceso de Desarrollo: Del Análisis a la Implementación

El sistema se construyó siguiendo una metodología de Ingeniería de Requisitos estructurada:

### Fase 1 — Glosario Crítico-Analítico
Se definieron los conceptos clave del dominio: inventario, merma, ciclo de vida del producto, temporada, proveedor, pedido y cliente. Este glosario fue la base del lenguaje compartido entre el equipo de desarrollo y las propietarias.

### Fase 2 — Ontología del Dominio
Se modelaron las entidades y relaciones del negocio:

- **Actores**: Propietarios (admin), Empleados, Proveedores, Clientes
- **Eventos de inventario**: Compra, Venta, Merma (desgaste), Pedido
- **Ítem de inventario**: Instancia física de cada flor con su ciclo de vida (fresco → marchito)
- **Relaciones clave**: El desgaste *afecta directamente* al inventario; las ventas y compras también modifican el stock; cada pedido queda *registrado por* un empleado y *solicitado por* un cliente

### Fase 3 — Validación con Propietarias
Durante las sesiones de validación se resolvieron preguntas clave como:

- **¿Por unidad o por ramo?** → Se optó por gestión **por unidad de flor**. Dado que los arreglos varían en composición (4 rosas rojas + 4 blancas + 4 rosas + nube, por ejemplo), gestionar por unidad es más flexible y menos propenso a errores que intentar parametrizar cada tipo de ramo.
- **¿Qué tiempo de vida tienen las flores?** → Las propietarias cuentan con una tabla de tiempos de vida para cada una de sus 15 variedades, que fue compartida como insumo para la configuración del sistema.
- **¿Cómo se registran los pedidos?** → Los pedidos históricos (provenientes de WhatsApp) se analizaron para entender la estructura de las ventas. El formato más común incluye combinaciones de flores en cantidades estándar.

### Fase 4 — Implementación Técnica
Con los requerimientos validados, se construyó el sistema sobre Next.js 14 con Prisma y Neon PostgreSQL como backend, desplegado en Netlify con soporte serverless. La lógica FIFO para deducción de stock garantiza que los lotes más antiguos se consuman primero, minimizando mermas.

---

## 📐 Arquitectura

```
Navegador (PWA Mobile-first)
        │
        ▼
Netlify CDN  ──►  Next.js App Router (páginas estáticas + SSR)
                         │
                         ▼
             Netlify Functions (rutas API de Next.js)
                         │
                         ▼
              Neon PostgreSQL (Postgres serverless)
              vía Prisma ORM (connection pooling)
```

**Decisiones de diseño clave:**
- **Sesiones JWT sin estado** — compatibles con serverless (sin necesidad de sticky sessions)
- **Connection pooling** — el pgBouncer de Neon previene el agotamiento de conexiones en arranques en frío
- **Deducción de stock FIFO** — los pedidos confirmados consumen primero los lotes más antiguos (menor merma)
- **Polling cada 30 s** — alternativa ligera a tiempo real, sin necesidad de WebSocket

---

## 🗂️ Estructura de Carpetas

```
floreria-perla-admin/
├── app/
│   ├── (dashboard)/          # Grupo de rutas protegidas
│   │   ├── layout.tsx        # Guard de auth + barra lateral
│   │   ├── dashboard/page.tsx
│   │   ├── inventory/page.tsx
│   │   ├── flowers/page.tsx
│   │   ├── orders/page.tsx
│   │   ├── seasons/page.tsx
│   │   ├── alerts/page.tsx
│   │   └── users/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── dashboard/route.ts
│   │   ├── flowers/route.ts
│   │   ├── flowers/[id]/route.ts
│   │   ├── inventory/route.ts
│   │   ├── inventory/waste/route.ts
│   │   ├── orders/route.ts
│   │   ├── orders/[id]/route.ts
│   │   ├── orders/[id]/confirm/route.ts
│   │   ├── seasons/route.ts
│   │   ├── alerts/route.ts
│   │   └── users/route.ts
│   ├── login/page.tsx
│   ├── layout.tsx
│   ├── globals.css
│   └── providers.tsx
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   └── topbar.tsx
│   └── ui/
│       ├── badge.tsx, button.tsx, card.tsx, form.tsx, modal.tsx, toaster.tsx
├── lib/
│   ├── auth.ts               # Configuración de NextAuth
│   ├── prisma.ts             # Singleton de Prisma
│   ├── session.ts            # Guards de auth para rutas API
│   ├── utils.ts              # Formateadores + logger de auditoría
│   └── validations.ts        # Esquemas Zod
├── middleware.ts             # Protección de rutas
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── netlify.toml
└── .env.example
```

---

## 🚀 Despliegue en Netlify paso a paso

### 1. Crear base de datos Neon PostgreSQL

1. Ve a [neon.tech](https://neon.tech) → **Create project**
2. Copia el **Connection string** (con pooling) → `DATABASE_URL`
3. Copia el **Direct connection string** → `DIRECT_URL`

### 2. Hacer fork / push a GitHub

```bash
git init
git add .
git commit -m "feat: initial floreria perla admin"
git remote add origin https://github.com/TU_USUARIO/floreria-perla-admin.git
git push -u origin main
```

### 3. Conectar a Netlify

1. [app.netlify.com](https://app.netlify.com) → **Add new site → Import from Git**
2. Selecciona tu repositorio
3. Netlify detecta automáticamente el `netlify.toml` — confirma:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`

### 4. Configurar Variables de Entorno en Netlify

Ve a **Site configuration → Environment variables** y agrega:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | `postgresql://...?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | `postgresql://...` (sin pgbouncer) |
| `NEXTAUTH_SECRET` | Ejecuta `openssl rand -base64 32` localmente |
| `NEXTAUTH_URL` | `https://tu-sitio.netlify.app` |
| `LOW_STOCK_THRESHOLD` | `2` |
| `NEXT_PUBLIC_POLL_INTERVAL_MS` | `30000` |

### 5. Ejecutar migraciones de base de datos

```bash
# Desde tu máquina local con .env configurado
npm install
npx prisma migrate deploy
npx tsx prisma/seed.ts
```

O agrégalo al **Build command** de Netlify:
```
prisma migrate deploy && npm run build
```

### 6. Desplegar

Haz clic en **Deploy site** en Netlify. El primer build tarda ~2-3 minutos.

**Credenciales por defecto tras el seed:**
- Email: `admin@floreria.com`
- Contraseña: `Admin1234!`
- ⚠️ Cámbialas inmediatamente después del primer inicio de sesión

---

## 🌐 Referencia de API

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/api/auth/signin` | — | Inicio de sesión (NextAuth) |
| GET | `/api/dashboard` | Cualquier rol | Resumen de KPIs |
| GET | `/api/inventory` | Cualquier rol | Lista de lotes con frescura |
| POST | `/api/inventory` | Cualquier rol | Agregar stock entrante |
| POST | `/api/inventory/waste` | Cualquier rol | Registrar merma |
| GET | `/api/flowers` | Cualquier rol | Listar flores |
| POST | `/api/flowers` | Propietario | Crear flor |
| PATCH | `/api/flowers/:id` | Propietario | Actualizar flor |
| DELETE | `/api/flowers/:id` | Propietario | Baja lógica de flor |
| GET | `/api/orders` | Cualquier rol | Listar pedidos (filtrable) |
| POST | `/api/orders` | Cualquier rol | Crear pedido |
| GET | `/api/orders/:id` | Cualquier rol | Detalle de pedido |
| PATCH | `/api/orders/:id` | Cualquier rol | Actualizar estado |
| POST | `/api/orders/:id/confirm` | Cualquier rol | Confirmar + deducir stock (FIFO) |
| GET | `/api/seasons` | Cualquier rol | Listar temporadas |
| POST | `/api/seasons` | Propietario | Crear temporada |
| GET | `/api/alerts` | Cualquier rol | Stock bajo / por vencer / temporadas |
| GET | `/api/users` | Propietario | Listar usuarios |
| POST | `/api/users` | Propietario | Crear usuario |
| PATCH | `/api/users/:id` | Propietario | Actualizar rol / estado activo |

---

## 🔄 Estrategia de Actualizaciones en Tiempo Real

La app usa **polling del lado del cliente** (configurable vía `NEXT_PUBLIC_POLL_INTERVAL_MS`):

- Las páginas de Dashboard, Inventario y Alertas hacen polling automáticamente cada 30 s
- No requiere infraestructura de WebSocket → compatible con serverless
- El intervalo se limpia al desmontar el componente (sin fugas de memoria)

Para reducir la latencia, disminuye `NEXT_PUBLIC_POLL_INTERVAL_MS` a `10000` (10 s).

---

## 🔐 Seguridad

- Contraseñas hasheadas con **bcrypt (costo 12)**
- Sesiones firmadas con **JWT HS256** (`NEXTAUTH_SECRET`, nunca expuesto al cliente)
- Todas las rutas API requieren sesión válida (401 si falta)
- Las rutas exclusivas de Propietario retornan 403 para el rol EMPLEADO
- Entradas validadas con **Zod** en cada límite de API
- Solo **bajas lógicas** — ningún dato se borra permanentemente (trazabilidad de auditoría)
- Sin inyección SQL posible — Prisma usa consultas parametrizadas

---

## 🌸 Leyenda de Colores

| Color | Significado |
|-------|-------------|
| 🟢 Verde | Fresco (≥ 2 días restantes) |
| 🟡 Amarillo | Por vencer (< 2 días) |
| 🔴 Rojo | Vencido / Marchito |

---

## 📋 Glosario del Dominio

| Término | Definición en el contexto del sistema |
|---------|---------------------------------------|
| **Lote** | Conjunto de flores de una misma variedad ingresado en una compra específica, con fecha de entrada y vida útil asociada |
| **Merma** | Flores que se marchitaron o dañaron sin ser vendidas; se registran para mantener el inventario preciso |
| **FIFO** | "First In, First Out" — los lotes más antiguos se descuentan primero al confirmar un pedido |
| **Temporada** | Período del año con demanda elevada (San Valentín, Día de la Madre, inicio de primavera, etc.) |
| **Ciclo de vida** | Transición del estado de una flor de *Fresco* a *Por vencer* a *Marchito* conforme pasan los días |
| **Stock bajo** | Condición de alerta cuando las unidades disponibles caen por debajo del umbral configurado (`LOW_STOCK_THRESHOLD`) |
| **Pedido** | Solicitud de compra de un cliente; pasa por los estados: Pendiente → Confirmado → Entregado/Cancelado |

---

## 🛠️ Variables de Entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `DATABASE_URL` | ✅ | Cadena de conexión con pgBouncer para Prisma en producción |
| `DIRECT_URL` | ✅ | Cadena de conexión directa para migraciones |
| `NEXTAUTH_SECRET` | ✅ | Secreto para firmar JWTs (mín. 32 caracteres) |
| `NEXTAUTH_URL` | ✅ | URL pública del sitio desplegado |
| `LOW_STOCK_THRESHOLD` | ✅ | Unidades mínimas antes de disparar alerta (recomendado: `2`) |
| `NEXT_PUBLIC_POLL_INTERVAL_MS` | ✅ | Intervalo de polling en milisegundos (recomendado: `30000`) |
