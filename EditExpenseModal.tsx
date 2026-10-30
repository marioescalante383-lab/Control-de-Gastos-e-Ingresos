import React, { useState, useEffect } from 'react';
import { Expense } from '../types';

interface EditExpenseModalProps {
  expense: Expense;
  onUpdateDate: (id: string, newDate: string) => void;
  onClose: () => void;
}

const EditExpenseModal: React.FC<EditExpenseModalProps> = ({ expense, onUpdateDate, onClose }) => {
  const [date, setDate] = useState(expense.date);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateDate(expense.id, date);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          Editar Fecha del Gasto
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Modificando el gasto de: <span className="font-semibold">{expense.store}</span>
        </p>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="expense-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Fecha
            </label>
            <input
              type="date"
              id="expense-date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="mt-1 block w-full bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-600 rounded-md hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditExpenseModal;
