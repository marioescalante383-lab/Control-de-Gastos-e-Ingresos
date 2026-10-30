import React from 'react';
import { Expense } from '../types';

interface SummaryProps {
  expenses: Expense[];
}

const Summary: React.FC<SummaryProps> = ({ expenses }) => {
  const total = expenses.reduce((sum, expense) => sum + expense.total, 0);

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">Gasto Total de esta Sesión</h2>
                <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                {total.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                </p>
            </div>
      </div>
    </div>
  );
};

export default Summary;
