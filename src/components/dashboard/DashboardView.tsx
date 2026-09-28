import React, { useState } from 'react';

type Movement = {
  id: number;
  type: 'ingreso' | 'gasto';
  description: string;
  amount: number;
  date: string;
};

export const DashboardView: React.FC<{ user: { name: string } }> = ({ user }) => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [type, setType] = useState<'ingreso' | 'gasto'>('ingreso');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const totalIngresos = movements.filter(m => m.type === 'ingreso').reduce((s, m) => s + m.amount, 0);
  const totalGastos = movements.filter(m => m.type === 'gasto').reduce((s, m) => s + m.amount, 0);
  const saldo = totalIngresos - totalGastos;

  const guardar = () => {
    if (!description || !amount) return;
    setMovements([{
      id: Date.now(),
      type,
      description,
      amount: parseFloat(amount),
      date
    }, ...movements]);
    setDescription('');
    setAmount('');
  };

  return (
    <div style={{padding: '20px', maxWidth: '800px', margin: '0 auto'}}>
      <h1>Control de Gastos — {user.name}</h1>
      
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', margin: '20px 0'}}>
        <div style={{padding: '15px', background: '#d1fae5', borderRadius: '8px'}}>
          <p>Ingresos</p>
          <p style={{fontSize: '22px', fontWeight: 'bold', color: '#047857'}}>${totalIngresos.toFixed(2)}</p>
        </div>
        <div style={{padding: '15px', background: '#fee2e2', borderRadius: '8px'}}>
          <p>Gastos</p>
          <p style={{fontSize: '22px', fontWeight: 'bold', color: '#b91c1c'}}>${totalGastos.toFixed(2)}</p>
        </div>
        <div style={{padding: '15px', background: '#fef3c7', borderRadius: '8px'}}>
          <p>Saldo</p>
          <p style={{fontSize: '22px', fontWeight: 'bold', color: '#d97706'}}>${saldo.toFixed(2)}</p>
        </div>
      </div>

      <div style={{padding: '20px', background: '#f9fafb', borderRadius: '8px', marginBottom: '20px'}}>
        <h3>Nuevo Movimiento</h3>
        
        <div style={{display: 'flex', gap: '10px', margin: '10px 0'}}>
          <button onClick={() => setType('ingreso')} style={{
            padding: '10px 20px',
            background: type === 'ingreso' ? '#10b981' : '#e5e7eb',
            color: type === 'ingreso' ? 'white' : '#374151',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}>Ingreso</button>
          <button onClick={() => setType('gasto')} style={{
            padding: '10px 20px',
            background: type === 'gasto' ? '#ef4444' : '#e5e7eb',
            color: type === 'gasto' ? 'white' : '#374151',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}>Gasto</button>
        </div>

        <div style={{margin: '10px 0'}}>
          <label>Descripción: </label>
          <input 
            type="text" 
            value={description} 
            onChange={e => setDescription(e.target.value)}
            placeholder="Ej: Sueldo, compra..."
            style={{width: '100%', padding: '8px', marginTop: '5px'}}
          />
        </div>

        <div style={{display: 'flex', gap: '10px', margin: '10px 0'}}>
          <div style={{flex: 1}}>
            <label>Monto: </label>
            <input 
              type="number" 
              value={amount} 
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              style={{width: '100%', padding: '8px', marginTop: '5px'}}
            />
          </div>
          <div style={{flex: 1}}>
            <label>Fecha: </label>
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)}
              style={{width: '100%', padding: '8px', marginTop: '5px'}}
            />
          </div>
        </div>

        <button onClick={guardar} style={{
          padding: '12px 24px',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '16px',
          cursor: 'pointer',
          marginTop: '10px'
        }}>💾 Guardar</button>
      </div>

      <div>
        <h3>Lista de Movimientos ({movements.length})</h3>
        {movements.length === 0 ? (
          <p style={{color: '#6b7280'}}>No hay movimientos registrados</p>
        ) : (
          movements.map(m => (
            <div key={m.id} style={{
              padding: '12px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <p style={{fontWeight: 'bold', margin: 0}}>{m.description}</p>
                <p style={{fontSize: '12px', color: '#6b7280', margin: 0}}>{m.date}</p>
              </div>
              <p style={{
                fontWeight: 'bold',
                fontSize: '18px',
                color: m.type === 'ingreso' ? '#047857' : '#b91c1c'
              }}>
                {m.type === 'ingreso' ? '+' : '-'}${m.amount.toFixed(2)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
