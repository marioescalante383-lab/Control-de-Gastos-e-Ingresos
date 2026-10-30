import React, { useState, useRef } from 'react';
import { Expense } from '../types';
import { DownloadIcon, UploadCloudIcon } from './icons';

interface ImportDataProps {
  onImport: (expenses: Expense[]) => void;
  allExpenses: Expense[];
}

const ImportData: React.FC<ImportDataProps> = ({ onImport, allExpenses }) => {
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error("El archivo no es válido.");
        }
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
          // Basic validation could be improved
          onImport(data as Expense[]);
          setMessage({ type: 'success', text: 'Datos importados correctamente.' });
        } else {
          throw new Error("El formato del JSON no es válido. Se esperaba un array de gastos.");
        }
      } catch (error: any) {
        setMessage({ type: 'error', text: error.message || "Error al procesar el archivo." });
      } finally {
        if(fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
        setMessage({ type: 'error', text: "No se pudo leer el archivo." });
    };
    reader.readAsText(file);
  };

  const handleDownload = () => {
    const dataStr = JSON.stringify(allExpenses, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'gastos_familiares.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="space-y-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Importar Datos</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Carga un archivo <code>gastos_familiares.json</code> para restaurar tus datos. Esto reemplazará los gastos actuales.
            </p>
            <label htmlFor="import-json" className="w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <UploadCloudIcon className="w-12 h-12 text-slate-400 dark:text-slate-500" />
                <span className="mt-2 text-sm text-slate-500 dark:text-slate-400">Haz clic para subir un archivo JSON</span>
            </label>
            <input id="import-json" type="file" accept="application/json" className="hidden" onChange={handleFileChange} ref={fileInputRef} />
            
            {message && (
                <div className={`mt-4 p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.text}
                </div>
            )}
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Exportar Datos</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Guarda todos tus gastos en un archivo <code>gastos_familiares.json</code> en tu dispositivo como respaldo.
            </p>
            <button
                onClick={handleDownload}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
                <DownloadIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Descargar Respaldo</span>
            </button>
        </div>
    </div>
  );
};

export default ImportData;
