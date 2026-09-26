"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMiddleware = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const env_1 = require("../config/env");
if (!fs_1.default.existsSync(env_1.config.uploadDir)) {
    fs_1.default.mkdirSync(env_1.config.uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, env_1.config.uploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        cb(null, `receipt-${uniqueSuffix}${ext}`);
    },
});
exports.uploadMiddleware = (0, multer_1.default)({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    fileFilter: (_req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp|heic|pdf/;
        const ext = path_1.default.extname(file.originalname).toLowerCase().replace('.', '');
        const mime = file.mimetype;
        if (allowed.test(ext) || allowed.test(mime)) {
            cb(null, true);
        }
        else {
            cb(new Error('Formato de archivo no soportado. Debe ser imagen (JPEG, PNG, WebP) o PDF.'));
        }
    },
});
