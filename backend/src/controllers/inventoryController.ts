import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middlewares/auth';
import { inventoryService } from '../services/inventoryService';

export class InventoryController {
  async getInventory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const items = await prisma.inventoryItem.findMany({
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
        let status: 'OUT_OF_STOCK' | 'LOW' | 'OPTIMAL' = 'OPTIMAL';
        if (inv.currentStock <= 0) status = 'OUT_OF_STOCK';
        else if (inv.currentStock <= p.minStock) status = 'LOW';

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
    } catch (err: any) {
      res.status(500).json({ error: 'Error al consultar inventario: ' + err.message });
    }
  }

  async recordMovement(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { productId, quantity, movementType, notes } = req.body;

      if (!productId || quantity === undefined || !movementType) {
        res.status(400).json({ error: 'Producto, cantidad y tipo de movimiento son requeridos.' });
        return;
      }

      const result = await inventoryService.recordMovement(
        userId,
        productId,
        Number(quantity),
        movementType,
        notes
      );

      res.json({
        message: 'Movimiento de inventario registrado con éxito.',
        ...result,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Error al procesar movimiento de inventario.' });
    }
  }

  async getShoppingList(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const shoppingList = await inventoryService.generateShoppingList(userId);
      res.json(shoppingList);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al generar lista de compras: ' + err.message });
    }
  }

  async getProductKardex(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const productId = req.params.productId as string;

      const movements = await prisma.inventoryMovement.findMany({
        where: { userId, productId },
        orderBy: { date: 'desc' },
      });

      const priceHistory = await prisma.priceHistory.findMany({
        where: { productId },
        include: { store: true },
        orderBy: { date: 'asc' },
      });

      res.json({
        movements,
        priceHistory,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Error al obtener historial del producto.' });
    }
  }

  async updateProductSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const productId = req.params.productId as string;
      const { minStock, desiredStock, unitOfMeasure, categoryId, defaultStoreId } = req.body;

      const prod = await prisma.product.findUnique({ where: { id: productId } });
      if (!prod || prod.userId !== userId) {
        res.status(404).json({ error: 'Producto no encontrado.' });
        return;
      }

      const updated = await prisma.product.update({
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
    } catch (err: any) {
      res.status(500).json({ error: 'Error al actualizar configuración del producto.' });
    }
  }
}

export const inventoryController = new InventoryController();
