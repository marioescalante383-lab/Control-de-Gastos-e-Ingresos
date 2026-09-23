import React, { useEffect, useState } from 'react';
import { ShoppingCart, CheckSquare, Square, Store, DollarSign, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { ShoppingListItem } from '../../types';

export const ShoppingListView: React.FC = () => {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const fetchShoppingList = async () => {
    setLoading(true);
    try {
      const data = await api.getShoppingList();
      setItems(data);
    } catch (err) {
      console.error('Error cargando lista de compras:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShoppingList();
  }, []);

  const toggleCheck = (productId: string) => {
    setCheckedItems((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  const totalEstimated = items.reduce((acc, it) => acc + it.estimatedCost, 0);
  const pendingCount = items.filter((it) => !checkedItems[it.productId]).length;

  // Agrupar por tienda habitual
  const groupedByStore = items.reduce((acc: Record<string, ShoppingListItem[]>, it) => {
    const store = it.storeName || 'Cualquier supermercado';
    if (!acc[store]) acc[store] = [];
    acc[store].push(it);
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Lista Inteligente de Compras</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            Generada automáticamente a partir de tus productos con stock bajo o agotado.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchShoppingList} className="btn btn-secondary btn-sm">
            <RefreshCw size={15} /> Actualizar
          </button>
        </div>
      </div>

      {/* Resumen de Presupuesto Estimado */}
      <div
        className="glass-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '20px 24px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <ShoppingCart size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Artículos Pendientes</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>
              {pendingCount} de {items.length} sugeridos
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Gasto Total Estimado</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--income)' }}>
            ${totalEstimated.toFixed(2)} MXN
          </div>
        </div>
      </div>

      {/* Lista agrupada por tienda */}
      {items.length === 0 ? (
        <div
          className="glass-card"
          style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}
        >
          <ShoppingCart size={48} color="var(--primary)" style={{ opacity: 0.5, marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-white)' }}>¡Tu inventario está completo!</h3>
          <p style={{ fontSize: '0.85rem', margin: '4px 0 0' }}>
            No tienes productos por debajo del stock mínimo configurado.
          </p>
        </div>
      ) : (
        Object.entries(groupedByStore).map(([storeName, storeItems]) => (
          <div key={storeName} className="glass-card" style={{ padding: '20px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '14px',
                paddingBottom: '10px',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <Store size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '1.05rem', margin: 0 }}>{storeName}</h3>
              <span className="badge badge-info" style={{ marginLeft: 'auto' }}>
                {storeItems.length} artículos
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {storeItems.map((it) => {
                const isChecked = Boolean(checkedItems[it.productId]);
                return (
                  <div
                    key={it.productId}
                    onClick={() => toggleCheck(it.productId)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: isChecked ? 'rgba(255, 255, 255, 0.02)' : 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      opacity: isChecked ? 0.45 : 1,
                      textDecoration: isChecked ? 'line-through' : 'none',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <div style={{ color: isChecked ? 'var(--income)' : 'var(--text-muted)' }}>
                      {isChecked ? <CheckSquare size={20} /> : <Square size={20} />}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-white)' }}>
                        {it.productName}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Existencia: {it.currentStock} {it.unitOfMeasure} (Mínimo: {it.minStock}) · {it.categoryName}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--primary)' }}>
                        Comprar {it.suggestedQuantity} {it.unitOfMeasure}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {it.lastPricePaid ? `~$${(it.lastPricePaid * it.suggestedQuantity).toFixed(2)}` : 'Sin precio ref.'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
};
