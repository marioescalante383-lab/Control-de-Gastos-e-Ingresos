import React, { useState, useRef } from 'react';

type Movement = {
  id: number;
  type: 'ingreso' | 'gasto';
  description: string;
  category: string;
  amount: number;
  date: string;
  file?: { name: string; type: string };
};

export const DashboardView: React.FC<{ user: { name: string } }> = ({ user }) => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [type, setType] = useState<'ingreso' | 'gasto'>('ingreso');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Vivienda');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalIngresos = movements.filter(m => m.type === 'ingreso').reduce((s, m) => s + m.amount, 0);
  const totalGastos = movements.filter(m => m.type === 'gasto').reduce((s, m) => s + m.amount, 0);
  const saldo = totalIngresos - totalGastos;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
  };

  const guardar = () => {
    if (!description || !amount || parseFloat(amount) <= 0) {
      alert('Completa la descripción y un monto válido ✅');
      return;
    }
    const nuevo: Movement = {
      id: Date.now(),
      type,
      description,
      category,
      amount: parseFloat(amount),
      date,
      file: selectedFile ? { name: selectedFile.name, type: selectedFile.type } : undefined
    };
    setMovements([nuevo, ...movements]);
    setDescription('');
    setAmount('');
    setSelectedFile(null);
  };

  const limpiar = () => {
    setDescription('');
    setAmount('');
    setSelectedFile(null);
    setDate(new Date().toISOString().split('T')[0]);
  };

  const categorias = ['Vivienda', 'Alimentación', 'Transporte', 'Salud', 'Entretenimiento', 'Educación', 'Otros'];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span className="text-emerald-600">$</span> Libro
        </h1>
        <p className="text-gray-500">Control de gastos e ingresos — {user.name}</p>
        <p className="text-sm text-gray-400 mt-1">Lunes, 28 de septiembre de 2026</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-emerald-500">
          <p className="text-sm text-gray-500">Ingresos Totales</p>
          <p className="text-2xl font-bold text-emerald-600">${totalIngresos.toFixed(2)}</p>
          <p className="text-xs text-gray-400">{movements.filter(m => m.type === 'ingreso').length} movimientos</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-red-500">
          <p className="text-sm text-gray-500">Gastos Totales</p>
          <p className="text-2xl font-bold text-red-600">${totalGastos.toFixed(2)}</p>
          <p className="text-xs text-gray-400">{movements.filter(m => m.type === 'gasto').length} movimientos</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-amber-500">
          <p className="text-sm text-gray-500">Saldo Disponible</p>
          <p className={text-2xl font-bold ${saldo >= 0 ? 'text-amber-600' : 'text-red-600'}}>${saldo.toFixed(2)}</p>
          <p className="text-xs text-gray-400">Actualizado en tiempo real</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Nuevo movimiento</h2>
          <p className="text-sm text-gray-400 mb-4">Completa los datos y adjunta tu comprobante 📎</p>

          <div className="flex gap-2 mb-5">
            <button type="button" onClick={() => setType('ingreso')}
              className={flex-1 py-2 rounded-lg font-medium transition ${type === 'ingreso' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}}>
              ↑ Ingreso
            </button>
            <button type="button" onClick={() => setType('gasto')}
              className={flex-1 py-2 rounded-lg font-medium transition ${type === 'gasto' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'}}>
              ↓ Gasto
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Descripción</label>
              <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Ej: Sueldo, supermercado, gasolina..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Categoría</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
                {categorias.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Monto</label>
                <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Fecha</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Comprobante (PDF o imagen) 📎</label>
              <input type="file" ref={fileInputRef} onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.gif" className="hidden" />
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-emerald-500 hover:text-emerald-600 transition">
                📎 Seleccionar archivo
              </button>
              {selectedFile && (
                <p className="mt-2 text-sm text-emerald-600 flex items-center gap-2">
                  ✅ {selectedFile.name}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={guardar}
                className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition">
                💾 Guardar movimiento
              </button>
              <button onClick={limpiar}
                className="px-4 py-2.5 bg-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-300 transition">
                Limpiar
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Movimientos</h2>
          
          {movements.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">Todavía no hay movimientos</p>
              <p className="text-sm mt-2">Registra tu primer ingreso o gasto desde el formulario ✍️</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {movements.map(m => (
                <div key={m.id} className="p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">{m.description}</p>
                      <p className="text-xs text-gray-400">{m.category} — {m.date}</p>
                      {m.file && (
                        <p className="text-xs text-emerald-500 mt-1">📎 {m.file.name}</p>
                      )}
                    </div>
                    <p className={font-bold ${m.type === 'ingreso' ? 'text-emerald-600' : 'text-red-600'}}>
                      {m.type === 'ingreso' ? '+' : '-'}${m.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
