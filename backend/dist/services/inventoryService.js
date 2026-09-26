"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryService = exports.InventoryService = void 0;
const db_1 = require("../config/db");
class InventoryService {
    /**
     * Actualiza el inventario y kárdex tras una compra confirmada
     */
    async processPurchaseItems(userId, items, date, transactionId) {
        for (const item of items) {
            if (item.affectsInventory === false)
                continue;
            let productId = item.productId;
            // Si no viene con ID de producto, buscar por nombre normalizado o crear uno nuevo
            if (!productId) {
                const norm = item.normalizedName || item.name.toLowerCase().trim();
                let existingProd = await db_1.prisma.product.findFirst({
                    where: { userId, normalizedName: norm },
                });
                if (!existingProd) {
                    existingProd = await db_1.prisma.product.create({
                        data: {
                            userId,
                            name: item.name,
                            normalizedName: norm,
                            categoryId: item.categoryId,
                            unitOfMeasure: item.unitOfMeasure || 'PZA',
                            lastPricePaid: item.unitPrice,
                            defaultStoreId: item.storeId || null,
                            affectsInventory: true,
                            minStock: 1,
                            desiredStock: 2,
                        },
                    });
                }
                productId = existingProd.id;
            }
            // 1. Obtener o inicializar registro en InventoryItem
            let inv = await db_1.prisma.inventoryItem.findUnique({
                where: { productId },
            });
            const prevStock = inv ? inv.currentStock : 0;
            const newStock = prevStock + item.quantity;
            if (!inv) {
                inv = await db_1.prisma.inventoryItem.create({
                    data: {
                        userId,
                        productId,
                        currentStock: newStock,
                        unitOfMeasure: item.unitOfMeasure || 'PZA',
                        lastPurchasedDate: date,
                        lastPricePaid: item.unitPrice,
                        referencePrice: item.unitPrice,
                    },
                });
            }
            else {
                await db_1.prisma.inventoryItem.update({
                    where: { id: inv.id },
                    data: {
                        currentStock: newStock,
                        lastPurchasedDate: date,
                        lastPricePaid: item.unitPrice,
                    },
                });
            }
            // 2. Registrar movimiento de entrada en Kárdex
            await db_1.prisma.inventoryMovement.create({
                data: {
                    userId,
                    productId,
                    movementType: 'PURCHASE_ENTRY',
                    quantity: item.quantity,
                    previousStock: prevStock,
                    newStock: newStock,
                    transactionItemId: item.transactionItemId || null,
                    notes: `Entrada por compra ($${item.unitPrice.toFixed(2)} c/u)`,
                    date: date,
                },
            });
            // 3. Registrar punto en historial de precios
            await db_1.prisma.priceHistory.create({
                data: {
                    productId,
                    storeId: item.storeId || null,
                    transactionId,
                    date,
                    unitPrice: item.unitPrice,
                },
            });
        }
    }
    /**
     * Registra una salida o consumo manual de producto
     */
    async recordMovement(userId, productId, quantity, movementType, notes) {
        const inv = await db_1.prisma.inventoryItem.findUnique({
            where: { productId },
        });
        if (!inv || inv.userId !== userId) {
            throw new Error('El producto no está registrado en el inventario.');
        }
        const prevStock = inv.currentStock;
        let newStock = prevStock;
        if (movementType === 'MANUAL_ADJUSTMENT') {
            newStock = quantity; // en ajuste manual, quantity representa el nuevo stock absoluto
        }
        else {
            newStock = Math.max(0, prevStock - Math.abs(quantity));
        }
        const diff = newStock - prevStock;
        await db_1.prisma.inventoryItem.update({
            where: { id: inv.id },
            data: { currentStock: newStock },
        });
        await db_1.prisma.inventoryMovement.create({
            data: {
                userId,
                productId,
                movementType,
                quantity: diff,
                previousStock: prevStock,
                newStock: newStock,
                notes: notes || `Salida por ${movementType}`,
                date: new Date(),
            },
        });
        return { previousStock: prevStock, newStock };
    }
    /**
     * Genera la lista de compras inteligente evaluando stocks mínimos
     */
    async generateShoppingList(userId) {
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
        });
        const lowStockItems = items
            .filter((inv) => inv.currentStock <= inv.product.minStock)
            .map((inv) => {
            const p = inv.product;
            const suggestedQty = Math.max(1, p.desiredStock > p.minStock ? p.desiredStock - inv.currentStock : 1);
            const estimatedCost = (inv.lastPricePaid || p.referencePrice || 0) * suggestedQty;
            return {
                productId: p.id,
                productName: p.name,
                categoryName: p.category.name,
                categoryColor: p.category.color,
                storeName: p.defaultStore?.name || 'Cualquier tienda',
                storeId: p.defaultStoreId,
                currentStock: inv.currentStock,
                minStock: p.minStock,
                desiredStock: p.desiredStock,
                unitOfMeasure: inv.unitOfMeasure,
                suggestedQuantity: suggestedQty,
                lastPricePaid: inv.lastPricePaid,
                estimatedCost,
                urgency: inv.currentStock === 0 ? 'CRITICAL' : 'WARNING',
            };
        });
        return lowStockItems;
    }
}
exports.InventoryService = InventoryService;
exports.inventoryService = new InventoryService();
