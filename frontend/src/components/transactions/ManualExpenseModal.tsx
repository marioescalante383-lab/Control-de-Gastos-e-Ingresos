import React, { useState } from 'react';
import { ArrowDownCircle, Plus, Trash2, X, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { Category } from '../../types';

interface ManualExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: Category[];
}

export const ManualExpenseModal: React.FC<ManualExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  categories,
}) => {
  const [storeName, setStoreName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<any[]>([
    {
      name: '',
      categoryId: categories[0]?.id || '',
      quantity: 1,
      unitPrice: 0,
      affectsInventory: true,
      unitOfMeasure: 'PZA',
    },
  ]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        name: '',
        categoryId: categories[0]?.id || '',
        quantity: 1,
        unitPrice: 0,
        affectsInventory: true,
        unitOfMeasure: 'PZA',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const total = items.reduce(
    (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.some((it) => !it.name.trim())) {
      alert('Por favor ingresa una descripción o nombre para cada producto.');
      return;
    }

    setLoading(true);
    try {
      await api.createManualExpense({
        date,
        storeName,
        paymentMethod,
        notes,
        items,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      alert('Error al registrar gasto: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'var(--expense-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--expense)',
              }}
            >
              <ArrowDownCircle size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Registrar Gasto Manual</h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Introduce los detalles de tu compra o pago sin comprobante fotográfico.
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Comercio o Establecimiento</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ej. Tiendita de la esquina"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Fecha</label>
                <input
                  type="date"
                  className="input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Método de Pago</label>
                <select
                  className="select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="CASH">Efectivo</option>
                  <option value="DEBIT_CARD">Tarjeta de Débito</option>
                  <option value="CREDIT_CARD">Tarjeta de Crédito</option>
                  <option value="TRANSFER">Transferencia</option>
                  <option value="OTHER">Otro</option>
                </select>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label className="form-label" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  Productos o Conceptos
                </label>
                <button type="button" onClick={handleAddItem} className="btn btn-secondary btn-sm">
                  <Plus size={14} /> Añadir Ítem
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {items.map((it, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--bg-surface-elevated)',
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        className="input"
                        placeholder="Descripción o producto"
                        value={it.name}
                        onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                        required
                        style={{ flex: 1 }}
                      />
                      <select
                        className="select"
                        style={{ width: '170px' }}
                        value={it.categoryId}
                        onChange={(e) => handleItemChange(idx, 'categoryId', e.target.value)}
                      >
                        {categories
                          .filter((c) => c.type !== 'INCOME')
                          .map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                      </select>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          style={{ background: 'none', border: 'none', color: 'var(--expense)', cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Cant:</span>
                        <input
                          type="number"
                          className="input"
                          style={{ width: '65px', padding: '6px' }}
                          min="1"
                          step="any"
                          value={it.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Precio U:</span>
                        <input
                          type="number"
                          className="input"
                          style={{ width: '85px', padding: '6px' }}
                          step="any"
                          value={it.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total:</span>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                          ${((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)).toFixed(2)}
                        </span>
                      </div>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto', fontSize: '0.8rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={it.affectsInventory}
                          onChange={(e) => handleItemChange(idx, 'affectsInventory', e.target.checked)}
                        />
                        <span>Sumar a Inventario</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notas adicionales</label>
              <textarea
                className="textarea"
                rows={2}
                placeholder="Observaciones de la compra..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                background: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Total a Registrar:</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--expense)' }}>
                ${total.toFixed(2)} MXN
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <CheckCircle2 size={18} /> Guardar Gasto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
