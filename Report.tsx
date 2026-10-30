import React, { useState, useMemo } from 'react';
import { Expense } from '../types';

interface ReportProps {
    expenses: Expense[];
}

type SortKey = 'date' | 'total';
type SortOrder = 'asc' | 'desc';

const Report: React.FC<ReportProps> = ({ expenses }) => {
    const [sortKey, setSortKey] = useState<SortKey>('date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    const sortedExpenses = useMemo(() => {
        const sorted = [...expenses].sort((a, b) => {
            if (sortKey === 'date') {
                return new Date(a.date).getTime() - new Date(b.date).getTime();
            }
            return a.total - b.total;
        });
        return sortOrder === 'asc' ? sorted : sorted.reverse();
    }, [expenses, sortKey, sortOrder]);

    const handleSort = (key: SortKey) => {
        if (key === sortKey) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('desc');
        }
    };
    
    const SortIndicator: React.FC<{ for: SortKey }> = ({ for: key }) => {
        if (sortKey !== key) return null;
        return <span>{sortOrder === 'asc' ? '▲' : '▼'}</span>;
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Reporte de Gastos</h2>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                        <tr>
                            <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('date')}>
                                Fecha <SortIndicator for="date" />
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Tienda
                            </th>
                            <th scope="col" className="px-6 py-3 cursor-pointer text-right" onClick={() => handleSort('total')}>
                                Total <SortIndicator for="total" />
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Origen
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedExpenses.map(expense => (
                            <tr key={expense.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                                <td className="px-6 py-4">
                                    {new Date(expense.date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </td>
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                                    {expense.store}
                                </td>
                                <td className="px-6 py-4 text-right font-mono">
                                    {expense.total.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                        expense.source === 'receipt' 
                                        ? 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200' 
                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                                    }`}>
                                        {expense.source === 'receipt' ? 'Recibo' : 'Manual'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {expenses.length === 0 && (
                <p className="text-center py-8 text-slate-500 dark:text-slate-400">No hay gastos para reportar.</p>
            )}
        </div>
    );
};

export default Report;
