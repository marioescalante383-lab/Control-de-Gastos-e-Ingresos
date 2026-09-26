"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryController = exports.InventoryController = void 0;
const db_1 = require("../config/db");
const inventoryService_1 = require("../services/inventoryService");
class InventoryController {
    async getInventory(req, res) {
        try {
            const userId = req.user.id;
            const items = await db_1.prisma.inventoryItem.findMany({
                where: { userId },
                include: {
                    product: {
                        include: {
                            category: true,
                            defaultStore: true,
                        },
                    },
                },
                orderBy: { updatedAt: 'desc' },
            });
            const formatted = items.map((inv) => {
                const p = inv.product;
                let status = 'OPTIMAL';
                if (inv.currentStock <= 0)
                    status = 'OUT_OF_STOCK';
                else if (inv.currentStock <= p.minStock)
                    status = 'LOW';
                return {
                    id: inv.id,
                    productId: p.id,
                    productName: p.name,
                    categoryName: p.category.name,
                    categoryColor: p.category.color,
                    storeName: p.defaultStore?.name || null,
                    currentStock: inv.currentStock,
                    minStock: p.minStock,
                    desiredStock: p.desiredStock,
                    unitOfMeasure: inv.unitOfMeasure,
                    lastPricePaid: inv.lastPricePaid,
                    referencePrice: inv.referencePrice,
                    lastPurchasedDate: inv.lastPurchasedDate,
                    status,
                };
            });
            res.json(formatted);
        }
        catch (err) {
            res.status(500).json({ error: 'Error al consultar inventario: ' + err.message });
        }
    }
    async recordMovement(req, res) {
        try {
            const userId = req.user.id;
            const { productId, quantity, movementType, notes } = req.body;
            if (!productId || quantity === undefined || !movementType) {
                res.status(400).json({ error: 'Producto, cantidad y tipo de movimiento son requeridos.' });
                return;
            }
            const result = await inventoryService_1.inventoryService.recordMovement(userId, productId, Number(quantity), movementType, notes);
            res.json({
                message: 'Movimiento de inventario registrado con éxito.',
                ...result,
            });
        }
        catch (err) {
            res.status(400).json({ error: err.message || 'Error al procesar movimiento de inventario.' });
        }
    }
    async getShoppingList(req, res) {
        try {
            const userId = req.user.id;
            const shoppingList = await inventoryService_1.inventoryService.generateShoppingList(userId);
            res.json(shoppingList);
        }
        catch (err) {
            res.status(500).json({ error: 'Error al generar lista de compras: ' + err.message });
        }
    }
    async getProductKardex(req, res) {
        try {
            const userId = req.user.id;
            const productId = req.params.productId;
            const movements = await db_1.prisma.inventoryMovement.findMany({
                where: { userId, productId },
                orderBy: { date: 'desc' },
            });
            const priceHistory = await db_1.prisma.priceHistory.findMany({
                where: { productId },
                include: { store: true },
                orderBy: { date: 'asc' },
            });
            res.json({
                movements,
                priceHistory,
            });
        }
        catch (err) {
            res.status(500).json({ error: 'Error al obtener historial del producto.' });
        }
    }
    async updateProductSettings(req, res) {
        try {
            const userId = req.user.id;
            const productId = req.params.productId;
            const { minStock, desiredStock, unitOfMeasure, categoryId, defaultStoreId } = req.body;
            const prod = await db_1.prisma.product.findUnique({ where: { id: productId } });
            if (!prod || prod.userId !== userId) {
                res.status(404).json({ error: 'Producto no encontrado.' });
                return;
            }
            const updated = await db_1.prisma.product.update({
                where: { id: productId },
                data: {
                    minStock: minStock !== undefined ? Number(minStock) : prod.minStock,
                    desiredStock: desiredStock !== undefined ? Number(desiredStock) : prod.desiredStock,
                    unitOfMeasure: unitOfMeasure || prod.unitOfMeasure,
                    categoryId: categoryId || prod.categoryId,
                    defaultStoreId: defaultStoreId !== undefined ? defaultStoreId : prod.defaultStoreId,
                },
            });
            res.json(updated);
        }
        catch (err) {
            res.status(500).json({ error: 'Error al actualizar configuración del producto.' });
        }
    }
    async createProduct(req, res) {
        try {
            const userId = req.user.id;
            const { name, categoryId, initialStock, minStock, desiredStock, unitOfMeasure, referencePrice } = req.body;
            if (!name || !categoryId) {
                res.status(400).json({ error: 'Nombre de producto y categoría son requeridos.' });
                return;
            }
            const normalized = name.toUpperCase().trim();
            let product = await db_1.prisma.product.findFirst({
                where: { userId, normalizedName: normalized },
            });
            if (!product) {
                product = await db_1.prisma.product.create({
                    data: {
                        userId,
                        categoryId,
                        name: name.trim(),
                        normalizedName: normalized,
                        unitOfMeasure: unitOfMeasure || 'PZA',
                        minStock: minStock !== undefined ? Number(minStock) : 0,
                        desiredStock: desiredStock !== undefined ? Number(desiredStock) : 0,
                        referencePrice: referencePrice ? Number(referencePrice) : null,
                        affectsInventory: true,
                    },
                });
            }
            const stockQty = initialStock !== undefined ? Number(initialStock) : 0;
            let invItem = await db_1.prisma.inventoryItem.findUnique({
                where: { productId: product.id },
            });
            if (!invItem) {
                invItem = await db_1.prisma.inventoryItem.create({
                    data: {
                        userId,
                        productId: product.id,
                        currentStock: stockQty,
                        unitOfMeasure: unitOfMeasure || 'PZA',
                        referencePrice: referencePrice ? Number(referencePrice) : null,
                    },
                });
                if (stockQty > 0) {
                    await db_1.prisma.inventoryMovement.create({
                        data: {
                            userId,
                            productId: product.id,
                            movementType: 'MANUAL_ADJUSTMENT',
                            quantity: stockQty,
                            previousStock: 0,
                            newStock: stockQty,
                            notes: 'Alta inicial de producto en inventario',
                        },
                    });
                }
            }
            res.status(201).json({ product, inventoryItem: invItem });
        }
        catch (err) {
            res.status(500).json({ error: 'Error al crear producto: ' + err.message });
        }
    }
}
exports.InventoryController = InventoryController;
exports.inventoryController = new InventoryController();
