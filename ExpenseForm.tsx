import React, { useState, useRef } from 'react';
import { analyzeReceipt, suggestCategory } from '../services/geminiService';
import { Item, Expense } from '../types';
import { PlusIcon, SparklesIcon, TrashIcon, UploadIcon } from './icons';

interface ExpenseFormProps {
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setErrorMessage: (message: string) => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onAddExpense, isLoading, setIsLoading, setErrorMessage }) => {
  const [store, setStore] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<Item[]>([{ name: '', quantity: 1, price: 0, total: 0, category: '' }]);
  const [activeTab, setActiveTab] = useState<'receipt' | 'manual'>('receipt');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const parsedData = await analyzeReceipt(file);
        const total = parsedData.items.reduce((sum, item) => sum + item.total, 0);
        onAddExpense({ ...parsedData, total, source: 'receipt' });
      } catch (error: any) {
        setErrorMessage(error.message || 'Error al procesar el recibo.');
      } finally {
        setIsLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!store.trim() || items.some(item => !item.name.trim() || item.quantity <= 0 || item.price < 0)) {
        setErrorMessage("Por favor, complete todos los campos requeridos.");
        return;
    }
    const total = items.reduce((sum, item) => sum + item.total, 0);
    onAddExpense({ store, date, items, total, source: 'manual' });
    // Reset form
    setStore('');
    setDate(new Date().toISOString().split('T')[0]);
    setItems([{ name: '', quantity: 1, price: 0, total: 0, category: '' }]);
    setErrorMessage('');
  };

  const handleItemChange = (index: number, field: keyof Item, value: string | number) => {
    setItems(prevItems => {
        return prevItems.map((item, i) => {
            if (i !== index) {
                return item;
            }

            const updatedItem = { ...item };
            if (field === 'name' || field === 'category') {
                updatedItem[field] = value as string;
            } else if (field === 'quantity' || field === 'price') {
                (updatedItem as any)[field] = Number(value);
                updatedItem.total = updatedItem.quantity * updatedItem.price;
            }
            return updatedItem;
        });
    });
};
  
  const handleSuggestCategory = async (index: number) => {
      const item = items[index];
      if (!item.name) return;
      try {
          const category = await suggestCategory(item.name);
          handleItemChange(index, 'category', category);
      } catch (error) {
          console.error("Failed to suggest category", error);
      }
  };

  const addItem = () => {
    setItems([...items, { name: '', quantity: 1, price: 0, total: 0, category: '' }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-4">
        <button
          onClick={() => setActiveTab('receipt')}
          className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
            activeTab === 'receipt'
              ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Desde Recibo (IA)
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
            activeTab === 'manual'
              ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Registro Manual
        </button>
      </div>

      {activeTab === 'receipt' && (
        <div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Digitalizar Recibo</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Sube una foto de tu recibo y la IA extraerá y categorizará los datos automáticamente.</p>
          <label htmlFor="receipt-upload" className="w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <UploadIcon className="w-12 h-12 text-slate-400 dark:text-slate-500" />
            <span className="mt-2 text-sm text-slate-500 dark:text-slate-400">Haz clic para subir una imagen</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">PNG, JPG, WEBP</span>
          </label>
          <input id="receipt-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} ref={fileInputRef} disabled={isLoading} />
        </div>
      )}

      {activeTab === 'manual' && (
        <form onSubmit={handleManualSubmit}>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Registrar Gasto Manualmente</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="store" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Tienda</label>
              <input type="text" id="store" value={store} onChange={(e) => setStore(e.target.value)} required className="mt-1 block w-full bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Fecha</label>
              <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} required className="mt-1 block w-full bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
          </div>
          
          <h4 className="text-md font-semibold text-slate-800 dark:text-slate-100 mb-2">Artículos</h4>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-11 grid grid-cols-3 gap-2">
                    <input
                        type="text"
                        placeholder="Nombre del artículo"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                        required
                        className="col-span-3 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm"
                    />
                     <div className="col-span-3 grid grid-cols-5 gap-2 items-center">
                        <input
                        type="text"
                        placeholder="Categoría"
                        value={item.category}
                        onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                        className="col-span-2 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm"
                        />
                        <button type="button" onClick={() => handleSuggestCategory(index)} className="text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-200" title="Sugerir categoría con IA">
                            <SparklesIcon className="w-5 h-5" />
                        </button>
                        <input
                        type="number"
                        placeholder="Cant."
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        required
                        min="1"
                        className="col-span-1 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm"
                        />
                        <input
                        type="number"
                        placeholder="Precio"
                        value={item.price}
                        onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                        required
                        min="0"
                        step="0.01"
                        className="col-span-1 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm"
                        />
                    </div>
                </div>
                <button type="button" onClick={() => removeItem(index)} className="col-span-1 text-slate-400 hover:text-red-500 transition-colors">
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
          
          <button type="button" onClick={addItem} className="mt-4 flex items-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200">
            <PlusIcon className="w-4 h-4 mr-1" />
            Añadir artículo
          </button>

          <button type="submit" className="mt-6 w-full bg-primary-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200" disabled={isLoading}>
            Añadir Gasto Manual
          </button>
        </form>
      )}
    </div>
  );
};

export default ExpenseForm;