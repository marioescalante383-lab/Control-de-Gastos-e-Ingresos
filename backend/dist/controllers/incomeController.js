"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incomeController = exports.IncomeController = void 0;
const db_1 = require("../config/db");
class IncomeController {
    async getIncomes(req, res) {
        try {
            const userId = req.user.id;
            const { startDate, endDate, categoryId } = req.query;
            const where = { userId };
            if (startDate || endDate) {
                where.date = {};
                if (startDate)
                    where.date.gte = new Date(startDate);
                if (endDate)
                    where.date.lte = new Date(endDate);
            }
            if (categoryId)
                where.categoryId = categoryId;
            const incomes = await db_1.prisma.income.findMany({
                where,
                include: { category: true },
                orderBy: { date: 'desc' },
            });
            res.json(incomes);
        }
        catch (err) {
            res.status(500).json({ error: 'Error al consultar ingresos: ' + err.message });
        }
    }
    async createIncome(req, res) {
        try {
            const userId = req.user.id;
            const { date, concept, categoryId, amount, paymentMethod, sourceEntity, notes } = req.body;
            if (!concept || !amount) {
                res.status(400).json({ error: 'Concepto y monto son obligatorios.' });
                return;
            }
            let category = null;
            if (categoryId) {
                category = await db_1.prisma.category.findUnique({ where: { id: categoryId } });
            }
            if (!category) {
                category = await db_1.prisma.category.findFirst({
                    where: { type: 'INCOME', isSystem: true, name: 'Sueldo' },
                });
            }
            const income = await db_1.prisma.income.create({
                data: {
                    userId,
                    categoryId: category.id,
                    date: new Date(date || Date.now()),
                    concept,
                    amount: Number(amount),
                    paymentMethod: paymentMethod || 'TRANSFER',
                    sourceEntity: sourceEntity || null,
                    notes: notes || null,
                },
                include: { category: true },
            });
            await db_1.prisma.auditLog.create({
                data: {
                    userId,
                    action: 'CREATE',
                    entityType: 'INCOME',
                    entityId: income.id,
                    afterState: JSON.stringify(income),
                },
            });
            res.status(201).json(income);
        }
        catch (err) {
            res.status(500).json({ error: 'Error al registrar ingreso: ' + err.message });
        }
    }
    async deleteIncome(req, res) {
        try {
            const userId = req.user.id;
            const id = req.params.id;
            const income = await db_1.prisma.income.findUnique({ where: { id } });
            if (!income || income.userId !== userId) {
                res.status(404).json({ error: 'Ingreso no encontrado' });
                return;
            }
            await db_1.prisma.income.delete({ where: { id } });
            res.json({ message: 'Ingreso eliminado correctamente.' });
        }
        catch (err) {
            res.status(500).json({ error: 'Error al eliminar ingreso: ' + err.message });
        }
    }
}
exports.IncomeController = IncomeController;
exports.incomeController = new IncomeController();
