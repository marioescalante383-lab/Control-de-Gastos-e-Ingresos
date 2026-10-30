import React, { useMemo } from 'react';
import { Expense } from '../types';

interface DashboardProps {
  expenses: Expense[];
}

const CategoryChart: React.FC<{ data: { name: string; total: number }[] }> = ({ data }) => {
    const maxTotal = Math.max(...data.map(d => d.total), 0);
    const sortedData = [...data].sort((a, b) => b.total - a.total);

    return (
        <div className="space-y-4">
            {sortedData.map(({ name, total }) => (
                <div key={name} className="flex items-center">
                    <span className="w-32 truncate text-sm text-slate-600 dark:text-slate-400" title={name}>{name}</span>
                    <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-6 ml-2">
                        <div
                            className="bg-primary-500 h-6 rounded-full flex items-center justify-end pr-2"
                            style={{ width: `${maxTotal > 0 ? (total / maxTotal) * 100 : 0}%` }}
                        >
                           <span className="text-xs font-bold text-white">{total.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ expenses }) => {
    const summary = useMemo(() => {
        const total = expenses.reduce((sum, expense) => sum + expense.total, 0);
        const count = expenses.length;
        const average = count > 0 ? total / count : 0;
        return { total, count, average };
    }, [expenses]);

    const categoryTotals = useMemo(() => {
        const totals: { [key: string]: number } = {};
        expenses.forEach(expense => {
            expense.items.forEach(item => {
                const category = item.category || 'Sin Categoría';
                const itemTotal = item.price * item.quantity;
                totals[category] = (totals[category] || 0) + itemTotal;
            });
        });
        return Object.entries(totals).map(([name, total]) => ({ name, total }));
    }, [expenses]);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Gasto Total</h3>
                    <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                        {summary.total.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total de Transacciones</h3>
                    <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">{summary.count}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Gasto Promedio</h3>
                    <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                        {summary.average.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Gastos por Categoría</h3>
                {categoryTotals.length > 0 ? (
                     <CategoryChart data={categoryTotals} />
                ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No hay datos de categorías para mostrar. Registra algunos gastos primero.</p>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
