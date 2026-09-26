"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const categoryRoutes_1 = __importDefault(require("./routes/categoryRoutes"));
const receiptRoutes_1 = __importDefault(require("./routes/receiptRoutes"));
const transactionRoutes_1 = __importDefault(require("./routes/transactionRoutes"));
const incomeRoutes_1 = __importDefault(require("./routes/incomeRoutes"));
const inventoryRoutes_1 = __importDefault(require("./routes/inventoryRoutes"));
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// Servir comprobantes e imágenes de manera estática
app.use('/uploads', express_1.default.static(env_1.config.uploadDir));
// Rutas de la API
app.use('/api/auth', authRoutes_1.default);
app.use('/api/categories', categoryRoutes_1.default);
app.use('/api/receipts', receiptRoutes_1.default);
app.use('/api/transactions', transactionRoutes_1.default);
app.use('/api/incomes', incomeRoutes_1.default);
app.use('/api/inventory', inventoryRoutes_1.default);
app.use('/api/dashboard', dashboardRoutes_1.default);
// Endpoint de verificación de salud
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Antigravity Finance & Inventory API',
        hasGeminiKey: Boolean(env_1.config.geminiApiKey),
    });
});
// Manejador global de errores
app.use((err, _req, res, _next) => {
    console.error('Error no controlado:', err);
    res.status(500).json({
        error: err.message || 'Ocurrió un error inesperado en el servidor.',
    });
});
app.listen(env_1.config.port, () => {
    console.log(`=======================================================`);
    console.log(` Servidor Backend Antigravity ejecutándose en:`);
    console.log(` http://localhost:${env_1.config.port}`);
    console.log(` Base de datos: SQLite con Prisma ORM`);
    console.log(` Modo IA: ${env_1.config.geminiApiKey ? 'Gemini 2.0 Flash Activo' : 'Simulación Inteligente de OCR Activa'}`);
    console.log(`=======================================================`);
});
