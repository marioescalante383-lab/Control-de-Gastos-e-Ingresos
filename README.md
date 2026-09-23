# Antigravity Finance | Control Integral de Gastos, Ingresos, Inventario y Comprobantes con IA

Aplicación completa diseñada para gestionar finanzas personales y control de existencias en tiempo real, procesando comprobantes de compra (tickets, recibos, facturas) mediante **Google Gemini 2.0 Flash Multimodal** e integración con **Google Drive**.

---

## 🌟 Características Principales

1. **Digitalización de Tickets con IA Multimodal:**
   - Toma fotografías con la cámara del teléfono o sube imágenes/PDFs.
   - Extrae automáticamente: tienda, RFC, fecha, hora, número de folio/ticket, desglose de productos, cantidades, precios unitarios, descuentos, impuestos y total.
   - Pantalla interactiva de revisión para verificar y corregir datos antes de consolidar.
   - Cálculo de índice de confianza (`confidence_score`) por cada producto extraído.

2. **Detección de Comprobantes Duplicados en 4 Capas:**
   - **Capa 1:** Hash criptográfico `SHA-256` para archivos idénticos.
   - **Capa 2:** Hash perceptual `pHash/dHash` para fotos idénticas con compresión, recorte o diferente resolución.
   - **Capa 3:** Coincidencia fiscal y folio unívoco (RFC + Folio + Fecha + Total).
   - **Capa 4:** Similitud difusa de compra (Misma tienda + Fecha idéntica + Total exacto).

3. **Normalización Inteligente y Memoria de Alias:**
   - Reconoce variaciones de nombres impresos en tickets (ej. `"LECHE LALA 1L"` vs `"LALA LECHE 1 LT"`).
   - Cada corrección que realiza el usuario se memoriza en la base de datos para no volver a preguntar.

4. **Inventario y Kárdex Automatizado:**
   - Las compras confirmadas incrementan automáticamente el stock de productos configurados como inventariables.
   - Registro ultra-rápido de consumo o salidas (Consumo, Caducado, Perdido, Regalado, Ajuste manual).
   - Historial de precios pagados por producto a lo largo del tiempo.

5. **Lista Inteligente de Compras:**
   - Sugiere automáticamente qué artículos comprar evaluando `stock actual <= stock mínimo`.
   - Organiza la lista por tienda habitual y calcula el presupuesto estimado de compra.

6. **Dashboard Financiero y Analítica Visual:**
   - Gráficos interactivos (`Chart.js`): evolución de ingresos vs gastos, distribución por categoría y top establecimientos.
   - Alertas inmediatas de artículos con stock bajo y productos que han sufrido aumentos de precio (inflación).

7. **Reportes y Exportación:**
   - Generación de reportes ejecutivos en pantalla con rangos de fechas personalizados.
   - Descarga directa en **Excel / CSV** (con codificación UTF-8 BOM compatible) y exportación formal en **PDF** con tablas detalladas.

---

## 🚀 Puesta en Marcha

### Prerrequisitos
- **Node.js LTS (v20 o superior)** y **npm**.

### 1. Iniciar el Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```
El backend se levantará en `http://localhost:5000`.

### 2. Iniciar el Frontend
```bash
cd frontend
npm install
npm run dev
```
El frontend estará disponible en `http://localhost:3000`.

### 3. Credenciales de Prueba (Demo)
El sistema incluye un usuario precargado en la base de datos SQLite para pruebas inmediatas:
- **Correo:** `demo@antigravity.finance`
- **Contraseña:** `Demo1234!`

---

## ⚙️ Configuración de Variables de Entorno (`backend/.env`)

```ini
PORT=5000
NODE_ENV=development
JWT_SECRET=super_secret_jwt_key_gastos_ingresos_2026_antigravity
DATABASE_URL="file:./dev.db"

# Para habilitar la IA de Google Gemini (Gratuita en https://aistudio.google.com/)
GEMINI_API_KEY=""

# Para integración con Google Drive OAuth 2.0 (Opcional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_REDIRECT_URI="http://localhost:5000/api/auth/google/callback"
```

> **Nota sobre el modo sin API Key:** Si `GEMINI_API_KEY` está vacía, el sistema activa automáticamente un **motor de simulación de OCR inteligente**, permitiendo probar todo el flujo de escaneo, detección de duplicados, corrección y actualización de inventario sin depender de conexión a servicios de pago.
