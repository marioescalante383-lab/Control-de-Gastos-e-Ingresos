import React, { useState, useEffect, useCallback } from 'react';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import Summary from './components/Summary';
import Dashboard from './components/Dashboard';
import Report from './components/Report';
import ImportData from './components/ImportData';
import Navigation from './components/Navigation';
import EditExpenseModal from './components/EditExpenseModal';
import { Expense } from './types';
import { SparklesIcon } from './components/icons';

export type View = 'dashboard' | 'register' | 'report' | 'import';

const App: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  useEffect(() => {
    try {
      const storedExpenses = localStorage.getItem('family-expenses');
      if (storedExpenses) {
        const parsedExpenses: Expense[] = JSON.parse(storedExpenses);
        // Migrate old data that doesn't have item.total
        const migratedExpenses = parsedExpenses.map(expense => ({
          ...expense,
          items: expense.items.map(item => ({
            ...item,
            total: (item as any).total ?? item.quantity * item.price,
          })),
        }));
        setExpenses(migratedExpenses);
      }
    } catch (error) {
      console.error("Failed to parse expenses from localStorage", error);
      setExpenses([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('family-expenses', JSON.stringify(expenses));
  }, [expenses]);

  const addExpense = useCallback((newExpenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...newExpenseData,
      id: new Date().toISOString() + Math.random(),
    };
    setExpenses(prevExpenses => [newExpense, ...prevExpenses]);
  }, []);
  
  const deleteExpense = useCallback((id: string) => {
    setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== id));
  }, []);

  const handleImportData = (importedExpenses: Expense[]) => {
      if (window.confirm("¿Quieres reemplazar tus gastos actuales con los datos importados? Se perderán los datos no guardados.")) {
        setExpenses(importedExpenses);
        setActiveView('dashboard');
      }
  };

  const handleOpenEditModal = (id: string) => {
    const expenseToEdit = expenses.find(e => e.id === id);
    if (expenseToEdit) {
      setEditingExpense(expenseToEdit);
    }
  };

  const handleCloseEditModal = () => {
    setEditingExpense(null);
  };

  const handleUpdateExpenseDate = (id: string, newDate: string) => {
    setExpenses(prevExpenses =>
      prevExpenses.map(expense =>
        expense.id === id ? { ...expense, date: newDate } : expense
      )
    );
    handleCloseEditModal();
  };

  const renderContent = () => {
    switch (activeView) {
        case 'dashboard':
            return <Dashboard expenses={expenses} />;
        case 'register':
            return (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-2">
                        <div className="sticky top-8">
                        <ExpenseForm onAddExpense={addExpense} isLoading={isLoading} setIsLoading={setIsLoading} setErrorMessage={setErrorMessage} />
                        </div>
                    </div>
                    <div className="lg:col-span-3 space-y-8">
                        <Summary expenses={expenses} />
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white border-b-2 border-primary-500 pb-2">Historial de Gastos</h2>
                        <ExpenseList expenses={expenses} onDeleteExpense={deleteExpense} onEditExpense={handleOpenEditModal} />
                    </div>
                </div>
            );
        case 'report':
            return <Report expenses={expenses} />;
        case 'import':
            return <ImportData onImport={handleImportData} allExpenses={expenses} />;
        default:
            return <Dashboard expenses={expenses} />;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {editingExpense && (
          <EditExpenseModal 
            expense={editingExpense} 
            onUpdateDate={handleUpdateExpenseDate} 
            onClose={handleCloseEditModal} 
          />
        )}

        <header className="text-center mb-8">
            <div className="inline-flex items-center justify-center space-x-3">
                <SparklesIcon className="w-8 h-8 text-primary-500" />
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Control de Gastos Familiares AI
                </h1>
            </div>
          <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
            Tu centro de control financiero inteligente.
          </p>
        </header>
        
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl flex items-center space-x-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                <span className="text-slate-700 dark:text-slate-200">Analizando recibo con IA...</span>
            </div>
          </div>
        )}

        {errorMessage && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6" role="alert">
                <p className="font-bold">Error</p>
                <p>{errorMessage}</p>
                <button onClick={() => setErrorMessage('')} className="mt-2 text-sm font-semibold">Cerrar</button>
            </div>
        )}

        <Navigation activeView={activeView} setActiveView={setActiveView} />

        <main className="mt-8">
            {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;