import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config/env';

import authRoutes from './routes/authRoutes';
import categoryRoutes from './routes/categoryRoutes';
import receiptRoutes from './routes/receiptRoutes';
import transactionRoutes from './routes/transactionRoutes';
import incomeRoutes from './routes/incomeRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import dashboardRoutes from './routes/dashboardRoutes';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir comprobantes e imágenes de manera estática
app.use('/uploads', express.static(config.uploadDir));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/incomes', incomeRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Endpoint de verificación de salud
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Antigravity Finance & Inventory API',
    hasGeminiKey: Boolean(config.geminiApiKey),
  });
});

// Manejador global de errores
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error no controlado:', err);
  res.status(500).json({
    error: err.message || 'Ocurrió un error inesperado en el servidor.',
  });
});

app.listen(config.port, () => {
  console.log(`=======================================================`);
  console.log(` Servidor Backend Antigravity ejecutándose en:`);
  console.log(` http://localhost:${config.port}`);
  console.log(` Base de datos: SQLite con Prisma ORM`);
  console.log(` Modo IA: ${config.geminiApiKey ? 'Gemini 2.0 Flash Activo' : 'Simulación Inteligente de OCR Activa'}`);
  console.log(`=======================================================`);
});
