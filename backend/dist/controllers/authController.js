"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../config/db");
const env_1 = require("../config/env");
const googleDriveService_1 = require("../services/googleDriveService");
class AuthController {
    async register(req, res) {
        try {
            const { email, password, fullName, currency } = req.body;
            if (!email || !password || !fullName) {
                res.status(400).json({ error: 'Todos los campos obligatorios deben ser proporcionados.' });
                return;
            }
            const existing = await db_1.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
            if (existing) {
                res.status(400).json({ error: 'Ya existe una cuenta con este correo electrónico.' });
                return;
            }
            const salt = await bcryptjs_1.default.genSalt(10);
            const passwordHash = await bcryptjs_1.default.hash(password, salt);
            const user = await db_1.prisma.user.create({
                data: {
                    email: email.toLowerCase(),
                    passwordHash,
                    fullName,
                    currency: currency || 'MXN',
                },
            });
            const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, env_1.config.jwtSecret, { expiresIn: '30d' });
            res.status(201).json({
                message: 'Usuario registrado con éxito',
                token,
                user: { id: user.id, email: user.email, fullName: user.fullName, currency: user.currency },
            });
        }
        catch (err) {
            console.error('Error en register:', err);
            res.status(500).json({ error: 'Error interno del servidor al registrar usuario.' });
        }
    }
    async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                res.status(400).json({ error: 'Correo y contraseña requeridos.' });
                return;
            }
            const user = await db_1.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
            if (!user || !user.passwordHash) {
                res.status(401).json({ error: 'Credenciales inválidas.' });
                return;
            }
            const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
            if (!isMatch) {
                res.status(401).json({ error: 'Credenciales inválidas.' });
                return;
            }
            const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, env_1.config.jwtSecret, { expiresIn: '30d' });
            res.json({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    currency: user.currency,
                    hasGoogleDrive: Boolean(user.googleRefreshToken),
                },
            });
        }
        catch (err) {
            console.error('Error en login:', err);
            res.status(500).json({ error: 'Error interno del servidor al iniciar sesión.' });
        }
    }
    async me(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'No autorizado' });
                return;
            }
            const user = await db_1.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    currency: true,
                    driveFolderId: true,
                    googleRefreshToken: true,
                    createdAt: true,
                },
            });
            if (!user) {
                res.status(404).json({ error: 'Usuario no encontrado' });
                return;
            }
            res.json({
                ...user,
                hasGoogleDrive: Boolean(user.googleRefreshToken),
                googleRefreshToken: undefined, // Nunca exponer el token real
            });
        }
        catch (err) {
            res.status(500).json({ error: 'Error al obtener perfil' });
        }
    }
    async getGoogleAuthUrl(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'No autorizado' });
                return;
            }
            const url = googleDriveService_1.googleDriveService.getAuthUrl(userId);
            res.json({ url });
        }
        catch (err) {
            res.status(500).json({ error: 'Error al generar URL de Google Auth: ' + err.message });
        }
    }
    async handleGoogleCallback(req, res) {
        try {
            const { code, state: userId } = req.query;
            if (!code || !userId) {
                res.status(400).send('Faltan parámetros de autorización de Google.');
                return;
            }
            await googleDriveService_1.googleDriveService.handleCallback(code, userId);
            res.send(`
        <html>
          <body style="font-family: sans-serif; text-align: center; padding: 50px; background: #0f172a; color: #fff;">
            <h2>¡Google Drive conectado exitosamente!</h2>
            <p>Ya puedes cerrar esta ventana y regresar a la aplicación.</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
                window.close();
              }
            </script>
          </body>
        </html>
      `);
        }
        catch (err) {
            res.status(500).send('Error conectando con Google Drive: ' + err.message);
        }
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
