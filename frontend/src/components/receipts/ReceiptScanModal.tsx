import React, { useState, useRef } from 'react';
import {
  Camera,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Sparkles,
  X,
  FileText,
  Loader2,
  Check,
} from 'lucide-react';
import { api } from '../../services/api';
import { ExtractedReceiptData, Category } from '../../types';

interface ReceiptScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: Category[];
}

export const ReceiptScanModal: React.FC<ReceiptScanModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  categories,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<any>(null);
  const [data, setData] = useState<ExtractedReceiptData | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      processFile(selected);
    }
  };

  const processFile = async (uploadedFile: File) => {
    setLoading(true);
    setDuplicateWarning(null);
    setData(null);
    try {
      const res = await api.uploadReceipt(uploadedFile);
      setReceiptId(res.receiptId);
      setData(res.extractedData);
      setItems(
        (res.extractedData.items || []).map((it: any) => ({
          rawDescription: it.raw_description,
          normalizedName: it.normalized_name,
          quantity: it.quantity,
          unitPrice: it.unit_price,
          totalPrice: it.total_price,
          categoryName: it.suggested_category,
          confidenceScore: it.confidence,
          affectsInventory: it.affects_inventory !== false,
        }))
      );

      if (res.duplicateWarning) {
        setDuplicateWarning(res.duplicateWarning);
      }
    } catch (err: any) {
      alert('Error procesando el comprobante: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDismissDuplicate = async () => {
    if (!receiptId) return;
    try {
      await api.dismissDuplicate(receiptId);
      setDuplicateWarning(null);
    } catch (err: any) {
      alert('Error descartando advertencia: ' + err.message);
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index][field] = value;
    if (field === 'quantity' || field === 'unitPrice') {
      const qty = Number(updated[index].quantity) || 0;
      const price = Number(updated[index].unitPrice) || 0;
      updated[index].totalPrice = Number((qty * price).toFixed(2));
    }
    setItems(updated);

    // Recalcular total del comprobante
    const newTotal = updated.reduce((acc, it) => acc + (Number(it.totalPrice) || 0), 0);
    if (data) {
      setData({ ...data, total: Number(newTotal.toFixed(2)) });
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        rawDescription: 'Nuevo Producto',
        normalizedName: 'Nuevo Producto',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        categoryName: 'Alimentos',
        confidenceScore: 100,
        affectsInventory: true,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    const newTotal = updated.reduce((acc, it) => acc + (Number(it.totalPrice) || 0), 0);
    if (data) {
      setData({ ...data, total: Number(newTotal.toFixed(2)) });
    }
  };

  const handleConfirm = async () => {
    if (!receiptId || !data) return;
    setIsSubmitting(true);
    try {
      await api.confirmReceipt(receiptId, {
        storeName: data.store_name,
        rfc: data.rfc,
        date: data.date,
        time: data.time,
        ticketNumber: data.ticket_number,
        paymentMethod: data.payment_method,
        currency: data.currency,
        subtotal: data.subtotal,
        discount: data.discount,
        tax: data.tax,
        total: data.total,
        items,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      alert('Error al confirmar compra: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: '840px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <Camera size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
                {data ? 'Revisión y Validación de Comprobante' : 'Escanear Ticket o Factura'}
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {data
                  ? 'Verifica los datos extraídos por la IA antes de actualizar inventario y balances.'
                  : 'Toma una foto con tu cámara o arrastra una imagen existente.'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Pantalla 1: Selección / Carga de Foto */}
          {!data && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*,application/pdf"
                capture="environment" // Habilita la cámara en móviles de inmediato
                onChange={handleFileChange}
              />

              <div className="dropzone" onClick={() => fileInputRef.current?.click()}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(99, 102, 241, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                  }}
                >
                  <Camera size={32} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem' }}>
                    Toca aquí para tomar fotografía o seleccionar archivo
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Admite fotos de tickets, facturas (JPEG, PNG, WebP) o documentos PDF.
                  </p>
                </div>
                <button className="btn btn-primary btn-sm" style={{ marginTop: '10px' }}>
                  <UploadCloud size={16} /> Seleccionar de Galería / Archivo
                </button>
              </div>
            </div>
          )}

          {/* Pantalla 2: Cargando con IA Gemini */}
          {loading && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
                textAlign: 'center',
                gap: '16px',
              }}
            >
              <div style={{ position: 'relative' }}>
                <Loader2 size={48} className="spin" color="var(--primary)" />
                <Sparkles
                  size={20}
                  color="var(--accent)"
                  style={{ position: 'absolute', top: -4, right: -4 }}
                />
              </div>
              <div>
                <h4 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>
                  Gemini 2.0 Analizando Comprobante...
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                  Extrayendo tienda, fecha, folio, desglose de productos y calculando confianza.
                </p>
              </div>
            </div>
          )}

          {/* Pantalla 3: Alerta de Duplicado */}
          {duplicateWarning && (
            <div
              style={{
                background: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '18px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
              }}
            >
              <AlertTriangle size={24} color="var(--expense)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: 'var(--expense)', fontSize: '0.95rem' }}>
                  Advertencia: Este comprobante parece estar registrado previamente
                </div>
                <p style={{ margin: '4px 0 12px', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  {duplicateWarning.reason} (Similitud: {duplicateWarning.similarityPercentage}%)
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={onClose} className="btn btn-danger btn-sm">
                    Descartar este comprobante
                  </button>
                  <button onClick={handleDismissDuplicate} className="btn btn-secondary btn-sm">
                    No es duplicado, continuar de todos modos
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pantalla 4: Revisión y Corrección de Datos Extraídos */}
          {data && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Metadatos Generales del Ticket */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '14px',
                  background: 'var(--bg-surface-elevated)',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Establecimiento / Tienda</label>
                  <input
                    type="text"
                    className="input"
                    value={data.store_name}
                    onChange={(e) => setData({ ...data, store_name: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Fecha de Compra</label>
                  <input
                    type="date"
                    className="input"
                    value={data.date}
                    onChange={(e) => setData({ ...data, date: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Número de Ticket / Folio</label>
                  <input
                    type="text"
                    className="input"
                    value={data.ticket_number || ''}
                    placeholder="Sin folio"
                    onChange={(e) => setData({ ...data, ticket_number: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Método de Pago</label>
                  <select
                    className="select"
                    value={data.payment_method}
                    onChange={(e) => setData({ ...data, payment_method: e.target.value })}
                  >
                    <option value="CASH">Efectivo</option>
                    <option value="DEBIT_CARD">Tarjeta de Débito</option>
                    <option value="CREDIT_CARD">Tarjeta de Crédito</option>
                    <option value="TRANSFER">Transferencia</option>
                    <option value="OTHER">Otro</option>
                  </select>
                </div>
              </div>

              {/* Lista Detallada de Ítems / Productos */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                  }}
                >
                  <h4 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Productos Detectados ({items.length})
                  </h4>
                  <button onClick={handleAddItem} className="btn btn-secondary btn-sm">
                    <Plus size={14} /> Agregar Producto
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {items.map((it, idx) => {
                    const isLowConfidence = (it.confidenceScore || 100) < 80;
                    return (
                      <div
                        key={idx}
                        style={{
                          background: 'var(--bg-surface)',
                          border: isLowConfidence
                            ? '1px solid rgba(245, 158, 11, 0.5)'
                            : '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                        }}
                      >
                        {/* Fila 1: Nombre formal y Categoría */}
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <div style={{ flex: 1 }}>
                            <input
                              type="text"
                              className="input"
                              value={it.normalizedName}
                              placeholder="Nombre del producto"
                              onChange={(e) => handleItemChange(idx, 'normalizedName', e.target.value)}
                            />
                          </div>

                          <div style={{ width: '180px' }}>
                            <select
                              className="select"
                              value={it.categoryName}
                              onChange={(e) => handleItemChange(idx, 'categoryName', e.target.value)}
                            >
                              {categories
                                .filter((c) => c.type !== 'INCOME')
                                .map((cat) => (
                                  <option key={cat.id} value={cat.name}>
                                    {cat.name}
                                  </option>
                                ))}
                            </select>
                          </div>

                          <button
                            onClick={() => handleRemoveItem(idx)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--expense)',
                              cursor: 'pointer',
                              padding: '6px',
                            }}
                            title="Eliminar producto"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Fila 2: Cantidad, Precio Unitario, Total e Impacto en Inventario */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                            flexWrap: 'wrap',
                            fontSize: '0.85rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Cant:</span>
                            <input
                              type="number"
                              className="input"
                              style={{ width: '70px', padding: '6px 10px' }}
                              min="1"
                              step="any"
                              value={it.quantity}
                              onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            />
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Precio U:</span>
                            <input
                              type="number"
                              className="input"
                              style={{ width: '90px', padding: '6px 10px' }}
                              step="any"
                              value={it.unitPrice}
                              onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                            />
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Total:</span>
                            <span style={{ fontWeight: 700, color: 'var(--text-white)' }}>
                              ${Number(it.totalPrice).toFixed(2)}
                            </span>
                          </div>

                          <label
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: 'pointer',
                              marginLeft: 'auto',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={it.affectsInventory}
                              onChange={(e) =>
                                handleItemChange(idx, 'affectsInventory', e.target.checked)
                              }
                            />
                            <span>Sumar a Inventario</span>
                          </label>

                          {/* Indicador de Confianza de IA */}
                          <div
                            style={{
                              fontSize: '0.75rem',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              background: isLowConfidence ? 'var(--warning-bg)' : 'rgba(16, 185, 129, 0.1)',
                              color: isLowConfidence ? 'var(--warning)' : 'var(--income)',
                              fontWeight: 600,
                            }}
                            title={
                              isLowConfidence
                                ? 'La IA tiene baja confianza en este renglón. Por favor verifica los valores.'
                                : 'Extracción de alta confianza.'
                            }
                          >
                            Confianza: {it.confidenceScore || 90}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Resumen Total del Ticket */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '20px',
                  padding: '16px',
                  background: 'var(--bg-surface-elevated)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Total Compra:
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--income)' }}>
                  ${Number(data.total).toFixed(2)} {data.currency}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
            Cancelar
          </button>
          {data && (
            <button
              onClick={handleConfirm}
              className="btn btn-primary"
              disabled={isSubmitting || !!duplicateWarning}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="spin" /> Guardando...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} /> Confirmar y Actualizar Inventario
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
