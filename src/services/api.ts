// Servicios de API — Control de Gastos e Ingresos
export interface Transaction {
  id?: string;
  type: 'expense' | 'income';
  amount: number;
  description: string;
  category: string;
  date: string;
}

export const api = {
  // Obtener todas las transacciones
  async getTransactions() {
    return [] as Transaction[];
  },

  // Crear nueva transacción
  async addTransaction(transaction: Omit<Transaction, 'id'>) {
    console.log('Guardando transacción:', transaction);
    return { success: true, message: 'Transacción registrada ✅' };
  },

  // Conectar Google Drive
  async connectDrive() {
    console.log('Conectando con Google Drive...');
    return { success: true, message: 'Google Drive conectado ✅' };
  }
};
