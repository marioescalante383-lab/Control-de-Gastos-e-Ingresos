export interface Item {
  name: string;
  quantity: number;
  price: number;
  total: number;
  category?: string;
}

export interface Expense {
  id: string;
  store: string;
  date: string;
  items: Item[];
  total: number;
  source: 'receipt' | 'manual';
}