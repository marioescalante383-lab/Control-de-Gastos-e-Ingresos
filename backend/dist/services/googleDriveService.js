"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleDriveService = exports.GoogleDriveService = void 0;
const googleapis_1 = require("googleapis");
const env_1 = require("../config/env");
const db_1 = require("../config/db");
class GoogleDriveService {
    getOAuthClient() {
        return new googleapis_1.google.auth.OAuth2(env_1.config.google.clientId, env_1.config.google.clientSecret, env_1.config.google.redirectUri);
    }
    /**
     * Genera la URL para autorizar Google Drive con alcance seguro
     */
    getAuthUrl(userId) {
        const oauth2Client = this.getOAuthClient();
        const scopes = [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/drive.readonly',
            'https://www.googleapis.com/auth/drive.file',
        ];
        return oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: scopes,
            state: userId,
        });
    }
    /**
     * Procesa el callback y almacena los tokens del usuario
     */
    async handleCallback(code, userId) {
        const oauth2Client = this.getOAuthClient();
        const { tokens } = await oauth2Client.getToken(code);
        if (tokens.refresh_token) {
            await db_1.prisma.user.update({
                where: { id: userId },
                data: { googleRefreshToken: tokens.refresh_token },
            });
        }
        return tokens;
    }
    /**
     * Obtiene un cliente autenticado para un usuario específico
     */
    async getAuthenticatedDriveClient(userId) {
        const user = await db_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.googleRefreshToken) {
            throw new Error('Google Drive no está conectado para este usuario.');
        }
        const oauth2Client = this.getOAuthClient();
        oauth2Client.setCredentials({ refresh_token: user.googleRefreshToken });
        return googleapis_1.google.drive({ version: 'v3', auth: oauth2Client });
    }
    /**
     * Lista archivos de imagen en la carpeta especificada de Google Drive
     */
    async listFilesFromFolder(userId, folderId) {
        const drive = await this.getAuthenticatedDriveClient(userId);
        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false and (mimeType contains 'image/' or mimeType = 'application/pdf')`,
            fields: 'files(id, name, mimeType, size, webViewLink, thumbnailLink, createdTime)',
            pageSize: 50,
        });
        return res.data.files || [];
    }
    /**
     * Descarga el archivo de Drive a un buffer
     */
    async downloadFile(userId, fileId) {
        const drive = await this.getAuthenticatedDriveClient(userId);
        const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
        return Buffer.from(res.data);
    }
}
exports.GoogleDriveService = GoogleDriveService;
exports.googleDriveService = new GoogleDriveService();
