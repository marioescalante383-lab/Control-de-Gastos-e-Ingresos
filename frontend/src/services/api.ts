const API_BASE = '/api';

export class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('antigravity_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('antigravity_token', token);
    } else {
      localStorage.removeItem('antigravity_token');
    }
  }

  getToken(): string | null {
    return this.token || localStorage.getItem('antigravity_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Error en la petición al servidor' }));
      throw new Error(err.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    const data = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async register(email: string, password: string, fullName: string, currency: string = 'MXN') {
    const data = await this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName, currency }),
    });
    this.setToken(data.token);
    return data;
  }

  async getMe() {
    return this.request<any>('/auth/me');
  }

  async getGoogleAuthUrl() {
    return this.request<{ url: string }>('/auth/google/url');
  }

  // Categorías
  async getCategories() {
    return this.request<any[]>('/categories');
  }

  async createCategory(cat: { name: string; color: string; icon: string; type: string }) {
    return this.request<any>('/categories', {
      method: 'POST',
      body: JSON.stringify(cat),
    });
  }

  // Comprobantes
  async uploadReceipt(file: File) {
    const formData = new FormData();
    formData.append('image', file);
    return this.request<{
      receiptId: string;
      status: string;
      extractedData: any;
      duplicateWarning: any;
    }>('/receipts/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async confirmReceipt(receiptId: string, payload: any) {
    return this.request<any>(`/receipts/${receiptId}/confirm`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async dismissDuplicate(receiptId: string) {
    return this.request<any>(`/receipts/${receiptId}/dismiss-duplicate`, {
      method: 'POST',
    });
  }

  // Transacciones y Gastos
  async getTransactions(filters: { startDate?: string; endDate?: string; categoryId?: string; isManual?: boolean } = {}) {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.isManual !== undefined) params.append('isManual', String(filters.isManual));
    return this.request<any[]>(`/transactions?${params.toString()}`);
  }

  async createManualExpense(expenseData: any) {
    return this.request<any>('/transactions/manual', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
  }

  async deleteTransaction(id: string) {
    return this.request<any>(`/transactions/${id}`, { method: 'DELETE' });
  }

  // Ingresos
  async getIncomes(filters: { startDate?: string; endDate?: string } = {}) {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    return this.request<any[]>(`/incomes?${params.toString()}`);
  }

  async createIncome(incomeData: any) {
    return this.request<any>('/incomes', {
      method: 'POST',
      body: JSON.stringify(incomeData),
    });
  }

  async deleteIncome(id: string) {
    return this.request<any>(`/incomes/${id}`, { method: 'DELETE' });
  }

  // Inventario y Consumo
  async getInventory() {
    return this.request<any[]>('/inventory');
  }

  async recordInventoryMovement(movement: {
    productId: string;
    quantity: number;
    movementType: string;
    notes?: string;
  }) {
    return this.request<any>('/inventory/movement', {
      method: 'POST',
      body: JSON.stringify(movement),
    });
  }

  async getShoppingList() {
    return this.request<any[]>('/inventory/shopping-list');
  }

  async getProductKardex(productId: string) {
    return this.request<any>(`/inventory/kardex/${productId}`);
  }

  // Dashboard y Reportes
  async getDashboardSummary(period: string = 'month', from?: string, to?: string) {
    const params = new URLSearchParams({ period });
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    return this.request<any>(`/dashboard/summary?${params.toString()}`);
  }

  async getFinancialReport(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return this.request<any>(`/dashboard/reports?${params.toString()}`);
  }

  // Configuración y Reglas de Categorización
  async updateCategory(id: string, cat: { name?: string; color?: string; icon?: string; isActive?: boolean }) {
    return this.request<any>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cat),
    });
  }

  async deleteCategory(id: string) {
    return this.request<any>(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  async getCategoryRules() {
    return this.request<any[]>('/categories/rules');
  }

  async createCategoryRule(rule: { matchKeyword: string; targetCategoryId: string; matchField?: string; priority?: number }) {
    return this.request<any>('/categories/rules', {
      method: 'POST',
      body: JSON.stringify(rule),
    });
  }

  // Inventario y Productos
  async createProduct(productData: {
    name: string;
    categoryId: string;
    initialStock?: number;
    minStock?: number;
    desiredStock?: number;
    unitOfMeasure?: string;
    referencePrice?: number;
  }) {
    return this.request<any>('/inventory/product', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProductSettings(productId: string, data: {
    minStock?: number;
    desiredStock?: number;
    unitOfMeasure?: string;
    categoryId?: string;
    defaultStoreId?: string;
  }) {
    return this.request<any>(`/inventory/product/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiService();

