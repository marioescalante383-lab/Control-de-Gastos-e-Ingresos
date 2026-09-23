import { prisma } from '../config/db';

export class ReportService {
  /**
   * Genera el contenido CSV estructurado para transacciones
   */
  async exportTransactionsToCsv(userId: string, startDate?: string, endDate?: string): Promise<string> {
    const where: any = { userId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        store: true,
        items: { include: { category: true } },
      },
      orderBy: { date: 'desc' },
    });

    const headers = [
      'ID_Transaccion',
      'Fecha',
      'Hora',
      'Comercio',
      'RFC',
      'Folio',
      'Metodo_Pago',
      'Moneda',
      'Subtotal',
      'Descuento',
      'Impuestos',
      'Total',
      'Es_Manual',
      'Items_Detalle',
    ];

    const rows = transactions.map((t) => {
      const itemsSummary = t.items
        .map((it) => `${it.quantity}x ${it.rawDescription} ($${it.totalPrice.toFixed(2)}) [${it.category.name}]`)
        .join('; ');

      return [
        t.id,
        t.date.toISOString().split('T')[0],
        t.time || '',
        `"${(t.store?.name || '').replace(/"/g, '""')}"`,
        t.store?.rfc || '',
        t.ticketNumber || '',
        t.paymentMethod,
        t.currency,
        t.subtotal.toFixed(2),
        t.discount.toFixed(2),
        t.tax.toFixed(2),
        t.total.toFixed(2),
        t.isManual ? 'SI' : 'NO',
        `"${itemsSummary.replace(/"/g, '""')}"`,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Genera datos agregados para reportes ejecutivos en pantalla y PDF
   */
  async getFinancialReport(userId: string, startDate?: string, endDate?: string) {
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const hasDateFilter = Object.keys(dateFilter).length > 0;

    const [transactions, incomes] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          userId,
          ...(hasDateFilter ? { date: dateFilter } : {}),
        },
        include: {
          store: true,
          items: { include: { category: true } },
        },
      }),
      prisma.income.findMany({
        where: {
          userId,
          ...(hasDateFilter ? { date: dateFilter } : {}),
        },
        include: { category: true },
      }),
    ]);

    const totalExpenses = transactions.reduce((acc, t) => acc + t.total, 0);
    const totalIncomes = incomes.reduce((acc, inc) => acc + inc.amount, 0);
    const netBalance = totalIncomes - totalExpenses;

    // Desglose por categorías de gasto
    const expensesByCategory: Record<string, { name: string; color: string; total: number }> = {};
    for (const t of transactions) {
      for (const item of t.items) {
        const catName = item.category.name;
        if (!expensesByCategory[catName]) {
          expensesByCategory[catName] = {
            name: catName,
            color: item.category.color,
            total: 0,
          };
        }
        expensesByCategory[catName].total += item.totalPrice;
      }
    }

    // Desglose por tienda
    const expensesByStore: Record<string, { name: string; total: number; count: number }> = {};
    for (const t of transactions) {
      const storeName = t.store?.name || 'Varios / No especificado';
      if (!expensesByStore[storeName]) {
        expensesByStore[storeName] = { name: storeName, total: 0, count: 0 };
      }
      expensesByStore[storeName].total += t.total;
      expensesByStore[storeName].count += 1;
    }

    return {
      summary: {
        totalExpenses,
        totalIncomes,
        netBalance,
        transactionsCount: transactions.length,
        incomesCount: incomes.length,
        averageTicket: transactions.length > 0 ? totalExpenses / transactions.length : 0,
      },
      expensesByCategory: Object.values(expensesByCategory).sort((a, b) => b.total - a.total),
      expensesByStore: Object.values(expensesByStore).sort((a, b) => b.total - a.total),
      transactions,
      incomes,
    };
  }
}

export const reportService = new ReportService();
