import React, { useState } from 'react';
import { ArrowUpCircle, X, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { Category } from '../../types';

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: Category[];
}

export const IncomeModal: React.FC<IncomeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  categories,
}) => {
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('TRANSFER');
  const [sourceEntity, setSourceEntity] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const incomeCategories = categories.filter((c) => c.type === 'INCOME' || c.type === 'BOTH');
  const activeCategoryId = categoryId || incomeCategories[0]?.id || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept || !amount) {
      alert('Concepto y monto son obligatorios.');
      return;
    }

    setLoading(true);
    try {
      await api.createIncome({
        concept,
        amount: Number(amount),
        date,
        categoryId: activeCategoryId,
        paymentMethod,
        sourceEntity,
        notes,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      alert('Error al registrar ingreso: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'var(--income-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--income)',
              }}
            >
              <ArrowUpCircle size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Registrar Ingreso</h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Suma dinero a tu flujo financiero (sueldo, freelance, ventas, inversiones).
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

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Monto del Ingreso ($ MXN)</label>
              <input
                type="number"
                step="any"
                className="input"
                style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--income)' }}
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Concepto o Descripción</label>
              <input
                type="text"
                className="input"
                placeholder="Ej. Quincena de Nómina, Pago Proyecto Web"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select
                  className="select"
                  value={activeCategoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  {incomeCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Fecha</label>
                <input
                  type="date"
                  className="input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Método de Cobro</label>
                <select
                  className="select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="TRANSFER">Transferencia (SPEI)</option>
                  <option value="CASH">Efectivo</option>
                  <option value="DEPOSIT">Depósito</option>
                  <option value="CHECK">Cheque</option>
                  <option value="OTHER">Otro</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Fuente / Empresa / Persona</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ej. Empresa SA de CV"
                  value={sourceEntity}
                  onChange={(e) => setSourceEntity(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notas</label>
              <textarea
                className="textarea"
                rows={2}
                placeholder="Detalles adicionales..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn btn-success" disabled={loading}>
              <CheckCircle2 size={18} /> Guardar Ingreso
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
