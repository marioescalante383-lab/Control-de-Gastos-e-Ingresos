// Definiciones de tipos — Control de Gastos e Ingresos

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income';
  color?: string;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  categoryId: string;
  date: string;
  receiptUrl?: string;
}

export interface Income {
  id: string;
  amount: number;
  source: string;
  date: string;
}

export interface AppState {
  user: User | null;
  expenses: Expense[];
  incomes: Income[];
  categories: Category[];
}
