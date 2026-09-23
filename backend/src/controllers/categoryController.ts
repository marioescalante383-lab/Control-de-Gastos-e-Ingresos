import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middlewares/auth';

export class CategoryController {
  async getCategories(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const categories = await prisma.category.findMany({
        where: {
          OR: [{ isSystem: true }, { userId }],
          isActive: true,
        },
        orderBy: { name: 'asc' },
      });
      res.json(categories);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al obtener categorías: ' + err.message });
    }
  }

  async createCategory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { name, color, icon, type } = req.body;

      if (!name) {
        res.status(400).json({ error: 'El nombre de la categoría es requerido.' });
        return;
      }

      const category = await prisma.category.create({
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
    } catch (err: any) {
      res.status(500).json({ error: 'Error al crear categoría: ' + err.message });
    }
  }

  async updateCategory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const id = req.params.id as string;
      const { name, color, icon, isActive } = req.body;

      const existing = await prisma.category.findUnique({ where: { id } });
      if (!existing || (existing.userId && existing.userId !== userId)) {
        res.status(404).json({ error: 'Categoría no encontrada o no autorizada.' });
        return;
      }

      const updated = await prisma.category.update({
        where: { id },
        data: {
          name: name ?? existing.name,
          color: color ?? existing.color,
          icon: icon ?? existing.icon,
          isActive: isActive !== undefined ? isActive : existing.isActive,
        },
      });

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al actualizar categoría: ' + err.message });
    }
  }

  async deleteCategory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const id = req.params.id as string;

      const existing = await prisma.category.findUnique({ where: { id } });
      if (!existing || existing.isSystem || existing.userId !== userId) {
        res.status(400).json({ error: 'Las categorías del sistema o de otros usuarios no pueden eliminarse.' });
        return;
      }

      // Desactivación lógica para no romper registros históricos
      await prisma.category.update({
        where: { id },
        data: { isActive: false },
      });

      res.json({ message: 'Categoría desactivada correctamente.' });
    } catch (err: any) {
      res.status(500).json({ error: 'Error al eliminar categoría: ' + err.message });
    }
  }

  async getRules(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const rules = await prisma.categorizationRule.findMany({
        where: { userId },
        include: { targetCategory: true },
        orderBy: { priority: 'desc' },
      });
      res.json(rules);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al obtener reglas de clasificación.' });
    }
  }

  async createRule(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { matchKeyword, matchField, targetCategoryId, priority } = req.body;

      if (!matchKeyword || !targetCategoryId) {
        res.status(400).json({ error: 'Palabra clave y categoría destino requeridas.' });
        return;
      }

      const rule = await prisma.categorizationRule.create({
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
    } catch (err: any) {
      res.status(500).json({ error: 'Error al crear regla: ' + err.message });
    }
  }
}

export const categoryController = new CategoryController();
