import React, { useEffect, useState } from 'react';
import { Receipt, ArrowUpCircle, ArrowDownCircle, Trash2, Search, Calendar, Store } from 'lucide-react';
import { api } from '../../services/api';
import { Transaction, Income } from '../../types';

export const TransactionsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'expenses' | 'incomes'>('expenses');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [txs, incs] = await Promise.all([
        api.getTransactions(),
        api.getIncomes(),
      ]);
      setTransactions(txs);
      setIncomes(incs);
    } catch (err) {
      console.error('Error al cargar transacciones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este gasto? Si los artículos afectaron inventario, las existencias serán revertidas.')) {
      return;
    }
    try {
      await api.deleteTransaction(id);
      fetchData();
    } catch (err: any) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const handleDeleteIncome = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este ingreso?')) return;
    try {
      await api.deleteIncome(id);
      fetchData();
    } catch (err: any) {
      alert('Error al eliminar ingreso: ' + err.message);
    }
  };

  const filteredTransactions = transactions.filter((t) =>
    (t.store?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.items.some((it) => it.rawDescription.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredIncomes = incomes.filter((i) =>
    i.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.sourceEntity || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Historial de Movimientos</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            Consulta todos tus gastos (registrados por IA o manuales) e ingresos.
          </p>
        </div>

        {/* Pestañas de Gastos vs Ingresos */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-surface-elevated)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <button
            onClick={() => setActiveTab('expenses')}
            style={{
              background: activeTab === 'expenses' ? 'var(--expense)' : 'transparent',
              color: activeTab === 'expenses' ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ArrowDownCircle size={15} /> Gastos ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab('incomes')}
            style={{
              background: activeTab === 'incomes' ? 'var(--income)' : 'transparent',
              color: activeTab === 'incomes' ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ArrowUpCircle size={15} /> Ingresos ({incomes.length})
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div style={{ position: 'relative', maxWidth: '360px' }}>
        <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          className="input"
          style={{ paddingLeft: '38px' }}
          placeholder="Buscar comercio, producto o concepto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabla de Gastos */}
      {activeTab === 'expenses' && (
        <div className="table-container glass-card" style={{ padding: 0 }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Establecimiento</th>
                <th>Tipo</th>
                <th>Detalle de Artículos</th>
                <th>Método de Pago</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th style={{ textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    {loading ? 'Cargando gastos...' : 'No hay gastos registrados.'}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id}>
                    <td>{t.date.slice(0, 10)}</td>
                    <td style={{ fontWeight: 600 }}>{t.store?.name || 'Varios'}</td>
                    <td>
                      <span className={`badge ${t.isManual ? 'badge-info' : 'badge-income'}`}>
                        {t.isManual ? 'Manual' : 'Ticket IA'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '300px' }}>
                      {t.items.map((it) => `${it.quantity}x ${it.rawDescription}`).join(', ')}
                    </td>
                    <td>{t.paymentMethod}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--expense)' }}>
                      ${t.total.toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleDeleteTransaction(t.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--expense)', cursor: 'pointer' }}
                        title="Eliminar gasto"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tabla de Ingresos */}
      {activeTab === 'incomes' && (
        <div className="table-container glass-card" style={{ padding: 0 }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Concepto</th>
                <th>Categoría</th>
                <th>Fuente / Empresa</th>
                <th>Método</th>
                <th style={{ textAlign: 'right' }}>Monto</th>
                <th style={{ textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncomes.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    {loading ? 'Cargando ingresos...' : 'No hay ingresos registrados.'}
                  </td>
                </tr>
              ) : (
                filteredIncomes.map((i) => (
                  <tr key={i.id}>
                    <td>{i.date.slice(0, 10)}</td>
                    <td style={{ fontWeight: 600 }}>{i.concept}</td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          background: `${i.category?.color || '#10b981'}20`,
                          color: i.category?.color || '#10b981',
                          fontWeight: 600,
                        }}
                      >
                        {i.category?.name || 'Ingreso'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{i.sourceEntity || '-'}</td>
                    <td>{i.paymentMethod}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--income)' }}>
                      +${i.amount.toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleDeleteIncome(i.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--expense)', cursor: 'pointer' }}
                        title="Eliminar ingreso"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
