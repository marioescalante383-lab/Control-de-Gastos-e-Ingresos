"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardController = exports.DashboardController = void 0;
const db_1 = require("../config/db");
const reportService_1 = require("../services/reportService");
class DashboardController {
    async getSummary(req, res) {
        try {
            const userId = req.user.id;
            const { period = 'month', from, to } = req.query;
            let startDate = new Date();
            let endDate = new Date();
            endDate.setHours(23, 59, 59, 999);
            if (from && to) {
                startDate = new Date(from);
                endDate = new Date(to);
            }
            else {
                switch (period) {
                    case 'today':
                        startDate.setHours(0, 0, 0, 0);
                        break;
                    case 'week':
                        startDate.setDate(startDate.getDate() - 7);
                        startDate.setHours(0, 0, 0, 0);
                        break;
                    case 'month':
                        startDate.setDate(1);
                        startDate.setHours(0, 0, 0, 0);
                        break;
                    case 'lastMonth':
                        startDate.setMonth(startDate.getMonth() - 1);
                        startDate.setDate(1);
                        startDate.setHours(0, 0, 0, 0);
                        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59);
                        break;
                    case 'year':
                        startDate = new Date(startDate.getFullYear(), 0, 1, 0, 0, 0);
                        break;
                    default:
                        startDate = new Date(2020, 0, 1);
                }
            }
            // 1. Obtener transacciones e ingresos en el periodo
            const [transactions, incomes, lowStockItems] = await Promise.all([
                db_1.prisma.transaction.findMany({
                    where: {
                        userId,
                        date: { gte: startDate, lte: endDate },
                    },
                    include: {
                        store: true,
                        items: { include: { category: true, product: true } },
                    },
                    orderBy: { date: 'asc' },
                }),
                db_1.prisma.income.findMany({
                    where: {
                        userId,
                        date: { gte: startDate, lte: endDate },
                    },
                    include: { category: true },
                    orderBy: { date: 'asc' },
                }),
                db_1.prisma.inventoryItem.findMany({
                    where: { userId },
                    include: { product: { include: { category: true } } },
                }),
            ]);
            const totalExpenses = transactions.reduce((acc, t) => acc + t.total, 0);
            const totalIncomes = incomes.reduce((acc, inc) => acc + inc.amount, 0);
            const balance = totalIncomes - totalExpenses;
            const purchasesCount = transactions.length;
            const averageTicket = purchasesCount > 0 ? totalExpenses / purchasesCount : 0;
            // 2. Gastos por categoría
            const categoryMap = {};
            for (const t of transactions) {
                for (const item of t.items) {
                    const catName = item.category.name;
                    if (!categoryMap[catName]) {
                        categoryMap[catName] = {
                            name: catName,
                            color: item.category.color,
                            total: 0,
                            count: 0,
                        };
                    }
                    categoryMap[catName].total += item.totalPrice;
                    categoryMap[catName].count += item.quantity;
                }
            }
            const topCategories = Object.values(categoryMap).sort((a, b) => b.total - a.total);
            // 3. Gastos por tienda
            const storeMap = {};
            for (const t of transactions) {
                const store = t.store?.name || 'Varios / Sin tienda';
                if (!storeMap[store]) {
                    storeMap[store] = { name: store, total: 0, purchases: 0 };
                }
                storeMap[store].total += t.total;
                storeMap[store].purchases += 1;
            }
            const topStores = Object.values(storeMap).sort((a, b) => b.total - a.total);
            // 4. Agrupación diaria para gráficos de evolución
            const timelineMap = {};
            for (const t of transactions) {
                const day = t.date.toISOString().split('T')[0];
                if (!timelineMap[day])
                    timelineMap[day] = { date: day, expenses: 0, incomes: 0 };
                timelineMap[day].expenses += t.total;
            }
            for (const inc of incomes) {
                const day = inc.date.toISOString().split('T')[0];
                if (!timelineMap[day])
                    timelineMap[day] = { date: day, expenses: 0, incomes: 0 };
                timelineMap[day].incomes += inc.amount;
            }
            const dailyTimeline = Object.values(timelineMap).sort((a, b) => a.date.localeCompare(b.date));
            // 5. Alertas de inventario bajo
            const alerts = lowStockItems
                .filter((inv) => inv.currentStock <= inv.product.minStock)
                .map((inv) => ({
                productId: inv.productId,
                productName: inv.product.name,
                currentStock: inv.currentStock,
                minStock: inv.product.minStock,
                unit: inv.unitOfMeasure,
                category: inv.product.category.name,
            }));
            // 6. Análisis de productos con aumento de precio
            const productsWithHistory = await db_1.prisma.product.findMany({
                where: { userId },
                include: {
                    priceHistories: {
                        orderBy: { date: 'asc' },
                    },
                },
            });
            const priceIncreases = [];
            for (const p of productsWithHistory) {
                if (p.priceHistories.length >= 2) {
                    const firstPrice = p.priceHistories[0].unitPrice;
                    const lastPrice = p.priceHistories[p.priceHistories.length - 1].unitPrice;
                    if (lastPrice > firstPrice) {
                        const diffPercent = Math.round(((lastPrice - firstPrice) / firstPrice) * 100);
                        priceIncreases.push({
                            productId: p.id,
                            productName: p.name,
                            initialPrice: firstPrice,
                            currentPrice: lastPrice,
                            increasePercentage: diffPercent,
                        });
                    }
                }
            }
            res.json({
                period,
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                totalExpenses,
                totalIncomes,
                balance,
                purchasesCount,
                averageTicket,
                topCategories,
                topStores,
                dailyTimeline,
                lowStockAlerts: alerts,
                priceIncreases,
            });
        }
        catch (err) {
            res.status(500).json({ error: 'Error al obtener resumen de dashboard: ' + err.message });
        }
    }
    async exportCsv(req, res) {
        try {
            const userId = req.user.id;
            const { startDate, endDate } = req.query;
            const csv = await reportService_1.reportService.exportTransactionsToCsv(userId, startDate, endDate);
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', 'attachment; filename="gastos_reporte.csv"');
            res.status(200).send('\uFEFF' + csv); // \uFEFF añade BOM para compatibilidad perfecta con Excel
        }
        catch (err) {
            res.status(500).json({ error: 'Error al exportar CSV: ' + err.message });
        }
    }
    async getFinancialReport(req, res) {
        try {
            const userId = req.user.id;
            const { startDate, endDate } = req.query;
            const report = await reportService_1.reportService.getFinancialReport(userId, startDate, endDate);
            res.json(report);
        }
        catch (err) {
            res.status(500).json({ error: 'Error al generar reporte financiero: ' + err.message });
        }
    }
}
exports.DashboardController = DashboardController;
exports.dashboardController = new DashboardController();
