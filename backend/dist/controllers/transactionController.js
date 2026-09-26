"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionController = exports.TransactionController = void 0;
const db_1 = require("../config/db");
const inventoryService_1 = require("../services/inventoryService");
const normalizationService_1 = require("../services/normalizationService");
class TransactionController {
    async getTransactions(req, res) {
        try {
            const userId = req.user.id;
            const { startDate, endDate, categoryId, storeId, isManual } = req.query;
            const where = { userId };
            if (startDate || endDate) {
                where.date = {};
                if (startDate)
                    where.date.gte = new Date(startDate);
                if (endDate)
                    where.date.lte = new Date(endDate);
            }
            if (storeId)
                where.storeId = storeId;
            if (isManual !== undefined)
                where.isManual = isManual === 'true';
            const transactions = await db_1.prisma.transaction.findMany({
                where,
                include: {
                    store: true,
                    receipt: true,
                    items: {
                        include: {
                            category: true,
                            product: true,
                        },
                    },
                },
                orderBy: { date: 'desc' },
            });
            res.json(transactions);
        }
        catch (err) {
            res.status(500).json({ error: 'Error al consultar transacciones: ' + err.message });
        }
    }
    async createManualExpense(req, res) {
        try {
            const userId = req.user.id;
            const { date, storeName, paymentMethod, currency, notes, items, // array: [{ name, categoryId, quantity, unitPrice, affectsInventory }]
             } = req.body;
            if (!items || !Array.isArray(items) || items.length === 0) {
                res.status(400).json({ error: 'Debes incluir al menos un producto o concepto en el gasto.' });
                return;
            }
            let store = null;
            if (storeName) {
                const normStore = normalizationService_1.normalizationService.cleanText(storeName);
                store = await db_1.prisma.store.findFirst({ where: { userId, normalizedName: normStore } });
                if (!store) {
                    store = await db_1.prisma.store.create({
                        data: { userId, name: storeName, normalizedName: normStore },
                    });
                }
            }
            const total = items.reduce((acc, it) => acc + (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0), 0);
            const transaction = await db_1.prisma.transaction.create({
                data: {
                    userId,
                    storeId: store?.id || null,
                    date: new Date(date || Date.now()),
                    paymentMethod: paymentMethod || 'CASH',
                    currency: currency || 'MXN',
                    subtotal: total,
                    total,
                    isManual: true,
                    notes: notes || null,
                },
            });
            const stockItemsToProcess = [];
            for (const it of items) {
                const normName = normalizationService_1.normalizationService.cleanText(it.name);
                let product = await db_1.prisma.product.findFirst({
                    where: { userId, normalizedName: normName },
                });
                if (!product) {
                    product = await db_1.prisma.product.create({
                        data: {
                            userId,
                            categoryId: it.categoryId,
                            name: it.name,
                            normalizedName: normName,
                            unitOfMeasure: it.unitOfMeasure || 'PZA',
                            lastPricePaid: Number(it.unitPrice) || 0,
                            defaultStoreId: store?.id || null,
                            affectsInventory: it.affectsInventory !== false,
                        },
                    });
                }
                const txItem = await db_1.prisma.transactionItem.create({
                    data: {
                        transactionId: transaction.id,
                        productId: product.id,
                        categoryId: it.categoryId,
                        rawDescription: it.name,
                        quantity: Number(it.quantity) || 1,
                        unitPrice: Number(it.unitPrice) || 0,
                        totalPrice: (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0),
                        affectsInventory: it.affectsInventory !== false,
                        confidenceScore: 1.0,
                    },
                });
                if (it.affectsInventory !== false) {
                    stockItemsToProcess.push({
                        productId: product.id,
                        name: product.name,
                        categoryId: it.categoryId,
                        quantity: Number(it.quantity) || 1,
                        unitPrice: Number(it.unitPrice) || 0,
                        affectsInventory: true,
                        storeId: store?.id,
                        transactionItemId: txItem.id,
                    });
                }
            }
            if (stockItemsToProcess.length > 0) {
                await inventoryService_1.inventoryService.processPurchaseItems(userId, stockItemsToProcess, transaction.date, transaction.id);
            }
            await db_1.prisma.auditLog.create({
                data: {
                    userId,
                    action: 'CREATE',
                    entityType: 'TRANSACTION',
                    entityId: transaction.id,
                    afterState: JSON.stringify({ transactionId: transaction.id, total, isManual: true }),
                },
            });
            res.status(201).json({
                message: 'Gasto manual registrado con éxito',
                transactionId: transaction.id,
            });
        }
        catch (err) {
            res.status(500).json({ error: 'Error al registrar gasto manual: ' + err.message });
        }
    }
    async getTransactionById(req, res) {
        try {
            const userId = req.user.id;
            const id = req.params.id;
            const transaction = await db_1.prisma.transaction.findUnique({
                where: { id },
                include: {
                    store: true,
                    receipt: true,
                    items: { include: { category: true, product: true } },
                },
            });
            if (!transaction || transaction.userId !== userId) {
                res.status(404).json({ error: 'Transacción no encontrada' });
                return;
            }
            res.json(transaction);
        }
        catch (err) {
            res.status(500).json({ error: 'Error al obtener transacción: ' + err.message });
        }
    }
    async deleteTransaction(req, res) {
        try {
            const userId = req.user.id;
            const id = req.params.id;
            const tx = await db_1.prisma.transaction.findUnique({
                where: { id },
                include: { items: true },
            });
            if (!tx || tx.userId !== userId) {
                res.status(404).json({ error: 'Transacción no encontrada' });
                return;
            }
            // Revertir inventario si los productos afectaron existencias
            for (const item of tx.items) {
                if (item.affectsInventory && item.productId) {
                    const inv = await db_1.prisma.inventoryItem.findUnique({
                        where: { productId: item.productId },
                    });
                    if (inv) {
                        const revertedStock = Math.max(0, inv.currentStock - item.quantity);
                        await db_1.prisma.inventoryItem.update({
                            where: { id: inv.id },
                            data: { currentStock: revertedStock },
                        });
                        await db_1.prisma.inventoryMovement.create({
                            data: {
                                userId,
                                productId: item.productId,
                                movementType: 'MANUAL_ADJUSTMENT',
                                quantity: -item.quantity,
                                previousStock: inv.currentStock,
                                newStock: revertedStock,
                                notes: `Reversión por eliminación de transacción #${tx.id.slice(0, 8)}`,
                            },
                        });
                    }
                }
            }
            await db_1.prisma.auditLog.create({
                data: {
                    userId,
                    action: 'DELETE',
                    entityType: 'TRANSACTION',
                    entityId: tx.id,
                    beforeState: JSON.stringify(tx),
                },
            });
            await db_1.prisma.transaction.delete({ where: { id } });
            res.json({ message: 'Transacción eliminada e inventario ajustado correctamente.' });
        }
        catch (err) {
            res.status(500).json({ error: 'Error al eliminar transacción: ' + err.message });
        }
    }
}
exports.TransactionController = TransactionController;
exports.transactionController = new TransactionController();
