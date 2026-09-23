export interface User {
  id: string;
  email: string;
  fullName: string;
  currency: string;
  hasGoogleDrive?: boolean;
  driveFolderId?: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'EXPENSE' | 'INCOME' | 'BOTH';
  color: string;
  icon: string;
  isSystem: boolean;
  isActive: boolean;
}

export interface TransactionItem {
  id?: string;
  productId?: string;
  productName?: string;
  categoryId: string;
  categoryName?: string;
  rawDescription: string;
  normalizedName?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
  totalPrice: number;
  confidenceScore?: number;
  affectsInventory?: boolean;
  unitOfMeasure?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  receiptId?: string;
  store?: { id: string; name: string; rfc?: string };
  date: string;
  time?: string;
  ticketNumber?: string;
  paymentMethod: string;
  currency: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  isManual: boolean;
  notes?: string;
  items: TransactionItem[];
}

export interface Income {
  id: string;
  userId: string;
  categoryId: string;
  category?: Category;
  date: string;
  concept: string;
  amount: number;
  paymentMethod: string;
  sourceEntity?: string;
  notes?: string;
}

export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  categoryName: string;
  categoryColor: string;
  storeName?: string;
  currentStock: number;
  minStock: number;
  desiredStock: number;
  unitOfMeasure: string;
  lastPricePaid?: number;
  referencePrice?: number;
  lastPurchasedDate?: string;
  status: 'OUT_OF_STOCK' | 'LOW' | 'OPTIMAL';
}

export interface ShoppingListItem {
  productId: string;
  productName: string;
  categoryName: string;
  categoryColor: string;
  storeName: string;
  storeId?: string;
  currentStock: number;
  minStock: number;
  desiredStock: number;
  unitOfMeasure: string;
  suggestedQuantity: number;
  lastPricePaid?: number;
  estimatedCost: number;
  urgency: 'CRITICAL' | 'WARNING';
}

export interface DashboardSummary {
  period: string;
  startDate: string;
  endDate: string;
  totalExpenses: number;
  totalIncomes: number;
  balance: number;
  purchasesCount: number;
  averageTicket: number;
  topCategories: { name: string; color: string; total: number; count: number }[];
  topStores: { name: string; total: number; purchases: number }[];
  dailyTimeline: { date: string; expenses: number; incomes: number }[];
  lowStockAlerts: { productId: string; productName: string; currentStock: number; minStock: number; unit: string; category: string }[];
  priceIncreases: { productId: string; productName: string; initialPrice: number; currentPrice: number; increasePercentage: number }[];
}

export interface ExtractedReceiptData {
  store_name: string;
  rfc: string | null;
  date: string;
  time: string | null;
  ticket_number: string | null;
  payment_method: string;
  currency: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  items: {
    raw_description: string;
    normalized_name: string;
    quantity: number;
    unit_price: number;
    discount?: number;
    tax?: number;
    total_price: number;
    suggested_category: string;
    confidence: number;
    affects_inventory?: boolean;
  }[];
  overall_confidence: number;
}
