import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middlewares/auth';

export class IncomeController {
  async getIncomes(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { startDate, endDate, categoryId } = req.query;

      const where: any = { userId };
      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate as string);
        if (endDate) where.date.lte = new Date(endDate as string);
      }
      if (categoryId) where.categoryId = categoryId as string;

      const incomes = await prisma.income.findMany({
        where,
        include: { category: true },
        orderBy: { date: 'desc' },
      });

      res.json(incomes);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al consultar ingresos: ' + err.message });
    }
  }

  async createIncome(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { date, concept, categoryId, amount, paymentMethod, sourceEntity, notes } = req.body;

      if (!concept || !amount) {
        res.status(400).json({ error: 'Concepto y monto son obligatorios.' });
        return;
      }

      let category = null;
      if (categoryId) {
        category = await prisma.category.findUnique({ where: { id: categoryId } });
      }

      if (!category) {
        category = await prisma.category.findFirst({
          where: { type: 'INCOME', isSystem: true, name: 'Sueldo' },
        });
      }

      const income = await prisma.income.create({
        data: {
          userId,
          categoryId: category!.id,
          date: new Date(date || Date.now()),
          concept,
          amount: Number(amount),
          paymentMethod: paymentMethod || 'TRANSFER',
          sourceEntity: sourceEntity || null,
          notes: notes || null,
        },
        include: { category: true },
      });

      await prisma.auditLog.create({
        data: {
          userId,
          action: 'CREATE',
          entityType: 'INCOME',
          entityId: income.id,
          afterState: JSON.stringify(income),
        },
      });

      res.status(201).json(income);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al registrar ingreso: ' + err.message });
    }
  }

  async deleteIncome(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const id = req.params.id as string;

      const income = await prisma.income.findUnique({ where: { id } });
      if (!income || income.userId !== userId) {
        res.status(404).json({ error: 'Ingreso no encontrado' });
        return;
      }

      await prisma.income.delete({ where: { id } });
      res.json({ message: 'Ingreso eliminado correctamente.' });
    } catch (err: any) {
      res.status(500).json({ error: 'Error al eliminar ingreso: ' + err.message });
    }
  }
}

export const incomeController = new IncomeController();
