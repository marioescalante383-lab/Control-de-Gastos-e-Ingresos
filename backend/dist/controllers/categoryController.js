"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryController = exports.CategoryController = void 0;
const db_1 = require("../config/db");
class CategoryController {
    async getCategories(req, res) {
        try {
            const userId = req.user?.id;
            const categories = await db_1.prisma.category.findMany({
                where: {
                    OR: [{ isSystem: true }, { userId }],
                    isActive: true,
                },
                orderBy: { name: 'asc' },
            });
            res.json(categories);
        }
        catch (err) {
            res.status(500).json({ error: 'Error al obtener categorías: ' + err.message });
        }
    }
    async createCategory(req, res) {
        try {
            const userId = req.user?.id;
            const { name, color, icon, type } = req.body;
            if (!name) {
                res.status(400).json({ error: 'El nombre de la categoría es requerido.' });
                return;
            }
            const category = await db_1.prisma.category.create({
                data: {
                    userId,
                    name,
                    color: color || '#3b82f6',
                    icon: icon || 'Tag',
                    type: type || 'EXPENSE',
                    isSystem: false,
                    isActive: true,
                },
            });
            res.status(201).json(category);
        }
        catch (err) {
            res.status(500).json({ error: 'Error al crear categoría: ' + err.message });
        }
    }
    async updateCategory(req, res) {
        try {
            const userId = req.user?.id;
            const id = req.params.id;
            const { name, color, icon, isActive } = req.body;
            const existing = await db_1.prisma.category.findUnique({ where: { id } });
            if (!existing || (existing.userId && existing.userId !== userId)) {
                res.status(404).json({ error: 'Categoría no encontrada o no autorizada.' });
                return;
            }
            const updated = await db_1.prisma.category.update({
                where: { id },
                data: {
                    name: name ?? existing.name,
                    color: color ?? existing.color,
                    icon: icon ?? existing.icon,
                    isActive: isActive !== undefined ? isActive : existing.isActive,
                },
            });
            res.json(updated);
        }
        catch (err) {
            res.status(500).json({ error: 'Error al actualizar categoría: ' + err.message });
        }
    }
    async deleteCategory(req, res) {
        try {
            const userId = req.user?.id;
            const id = req.params.id;
            const existing = await db_1.prisma.category.findUnique({ where: { id } });
            if (!existing || existing.isSystem || existing.userId !== userId) {
                res.status(400).json({ error: 'Las categorías del sistema o de otros usuarios no pueden eliminarse.' });
                return;
            }
            // Desactivación lógica para no romper registros históricos
            await db_1.prisma.category.update({
                where: { id },
                data: { isActive: false },
            });
            res.json({ message: 'Categoría desactivada correctamente.' });
        }
        catch (err) {
            res.status(500).json({ error: 'Error al eliminar categoría: ' + err.message });
        }
    }
    async getRules(req, res) {
        try {
            const userId = req.user?.id;
            const rules = await db_1.prisma.categorizationRule.findMany({
                where: { userId },
                include: { targetCategory: true },
                orderBy: { priority: 'desc' },
            });
            res.json(rules);
        }
        catch (err) {
            res.status(500).json({ error: 'Error al obtener reglas de clasificación.' });
        }
    }
    async createRule(req, res) {
        try {
            const userId = req.user.id;
            const { matchKeyword, matchField, targetCategoryId, priority } = req.body;
            if (!matchKeyword || !targetCategoryId) {
                res.status(400).json({ error: 'Palabra clave y categoría destino requeridas.' });
                return;
            }
            const rule = await db_1.prisma.categorizationRule.create({
                data: {
                    userId,
                    matchKeyword,
                    matchField: matchField || 'RAW_DESCRIPTION',
                    targetCategoryId,
                    priority: priority || 0,
                },
                include: { targetCategory: true },
            });
            res.status(201).json(rule);
        }
        catch (err) {
            res.status(500).json({ error: 'Error al crear regla: ' + err.message });
        }
    }
}
exports.CategoryController = CategoryController;
exports.categoryController = new CategoryController();
