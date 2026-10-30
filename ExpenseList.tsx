import React from 'react';
import { Expense } from '../types';
import { TrashIcon, PencilIcon } from './icons';

interface ExpenseListProps {
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
  onEditExpense: (id: string) => void;
}

const ExpenseCard: React.FC<{ expense: Expense; onDelete: (id: string) => void; onEdit: (id: string) => void }> = ({ expense, onDelete, onEdit }) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md transition-all hover:shadow-lg">
      <div className="flex justify-between items-start">
        <div>
          <p className={`text-xs font-semibold uppercase ${expense.source === 'receipt' ? 'text-teal-500' : 'text-amber-500'}`}>
            {expense.source === 'receipt' ? 'Recibo (IA)' : 'Manual'}
          </p>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{expense.store}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(expense.date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
            {expense.total.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
          </p>
          <div className="flex items-center justify-end mt-1 space-x-2">
            <button onClick={() => onEdit(expense.id)} className="text-slate-400 hover:text-primary-500 transition-colors" title="Editar fecha">
                <PencilIcon className="w-5 h-5" />
            </button>
            <button onClick={() => onDelete(expense.id)} className="text-slate-400 hover:text-red-500 transition-colors" title="Eliminar gasto">
                <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-2">
        <ul className="text-sm space-y-1">
          {expense.items.map((item, index) => (
            <li key={index} className="flex justify-between items-center text-slate-600 dark:text-slate-300">
              <div>
                {item.name} <span className="text-slate-400 dark:text-slate-500 text-xs">({item.quantity}x)</span>
                {item.category && <span className="ml-2 text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">{item.category}</span>}
              </div>
              <span>{item.total.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};


const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onDeleteExpense, onEditExpense }) => {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-10 px-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">No hay gastos registrados</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Añade tu primer gasto usando el formulario.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {expenses.map(expense => (
        <ExpenseCard key={expense.id} expense={expense} onDelete={onDeleteExpense} onEdit={onEditExpense} />
      ))}
    </div>
  );
};

export default ExpenseList;