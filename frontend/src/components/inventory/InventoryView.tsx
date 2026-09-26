import React, { useEffect, useState } from 'react';
import {
  Boxes,
  MinusCircle,
  PlusCircle,
  Search,
  History,
  AlertTriangle,
  CheckCircle,
  XCircle,
  X,
  TrendingUp,
  Plus,
  Sliders,
  Settings,
} from 'lucide-react';
import { api } from '../../services/api';
import { InventoryItem, Category } from '../../types';

export const InventoryView: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);

  // Estados de Modal de Consumo
  const [consumptionModalOpen, setConsumptionModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<InventoryItem | null>(null);
  const [consumeQty, setConsumeQty] = useState(1);
  const [movementType, setMovementType] = useState('CONSUMPTION');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Estados de Modal de Kárdex
  const [kardexModalOpen, setKardexModalOpen] = useState(false);
  const [kardexData, setKardexData] = useState<any>(null);
  const [loadingKardex, setLoadingKardex] = useState(false);

  // Estados de Modal Nuevo Producto
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newStock, setNewStock] = useState(1);
  const [newMinStock, setNewMinStock] = useState(2);
  const [newDesiredStock, setNewDesiredStock] = useState(5);
  const [newUnit, setNewUnit] = useState('PZA');
  const [newPrice, setNewPrice] = useState(0);
  const [creatingProduct, setCreatingProduct] = useState(false);

  // Estados de Modal Editar Configuración de Producto
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editMinStock, setEditMinStock] = useState(0);
  const [editDesiredStock, setEditDesiredStock] = useState(0);
  const [editUnit, setEditUnit] = useState('PZA');
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const [invData, cats] = await Promise.all([
        api.getInventory(),
        api.getCategories(),
      ]);
      setItems(invData);
      setCategories(cats);
      if (cats.length > 0 && !newCategoryId) {
        setNewCategoryId(cats[0].id);
      }
    } catch (err) {
      console.error('Error al cargar inventario:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const openConsumeModal = (item: InventoryItem) => {
    setActiveItem(item);
    setConsumeQty(1);
    setMovementType('CONSUMPTION');
    setNotes('');
    setConsumptionModalOpen(true);
  };

  const handleConsumeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;
    setSubmitting(true);
    try {
      await api.recordInventoryMovement({
        productId: activeItem.productId,
        quantity: consumeQty,
        movementType,
        notes,
      });

      setConsumptionModalOpen(false);
      fetchInventory();
    } catch (err: any) {
      alert('Error registrando consumo: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openKardexModal = async (item: InventoryItem) => {
    setSelectedProduct(item);
    setKardexModalOpen(true);
    setLoadingKardex(true);
    try {
      const data = await api.getProductKardex(item.productId);
      setKardexData(data);
    } catch (err) {
      console.error('Error cargando kárdex:', err);
    } finally {
      setLoadingKardex(false);
    }
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setEditMinStock(item.minStock);
    setEditDesiredStock(item.desiredStock);
    setEditUnit(item.unitOfMeasure);
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setSavingEdit(true);
    try {
      await api.updateProductSettings(editingItem.productId, {
        minStock: Number(editMinStock),
        desiredStock: Number(editDesiredStock),
        unitOfMeasure: editUnit,
      });
      setEditModalOpen(false);
      fetchInventory();
    } catch (err: any) {
      alert('Error actualizando configuración: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCategoryId) return;
    setCreatingProduct(true);
    try {
      await api.createProduct({
        name: newName.trim(),
        categoryId: newCategoryId,
        initialStock: Number(newStock),
        minStock: Number(newMinStock),
        desiredStock: Number(newDesiredStock),
        unitOfMeasure: newUnit,
        referencePrice: Number(newPrice) || undefined,
      });
      setCreateModalOpen(false);
      setNewName('');
      setNewStock(1);
      fetchInventory();
    } catch (err: any) {
      alert('Error creando producto: ' + err.message);
    } finally {
      setCreatingProduct(false);
    }
  };

  const filteredItems = items.filter((it) =>
    it.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    it.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Control de Inventario y Stock</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            Tus existencias se actualizan automáticamente tras cada compra y puedes registrar tus consumos diarios.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Buscador */}
          <div style={{ position: 'relative', width: '240px' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="input"
              style={{ paddingLeft: '38px' }}
              placeholder="Buscar producto o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} /> Nuevo Producto
          </button>
        </div>
      </div>

      {/* Tabla de Inventario */}
      <div className="table-container glass-card" style={{ padding: 0 }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Estado</th>
              <th>Stock Actual</th>
              <th>Stock Mínimo</th>
              <th>Último Precio</th>
              <th>Tienda Habitual</th>
              <th style={{ textAlign: 'right' }}>Acciones Rápidas</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  {loading ? 'Cargando inventario...' : 'No hay productos registrados en inventario aún.'}
                </td>
              </tr>
            ) : (
              filteredItems.map((it) => {
                let badgeClass = 'badge-income';
                let icon = <CheckCircle size={14} />;
                let label = 'Óptimo';

                if (it.status === 'OUT_OF_STOCK') {
                  badgeClass = 'badge-expense';
                  icon = <XCircle size={14} />;
                  label = 'Agotado';
                } else if (it.status === 'LOW') {
                  badgeClass = 'badge-warning';
                  icon = <AlertTriangle size={14} />;
                  label = 'Bajo Stock';
                }

                return (
                  <tr key={it.id}>
                    <td style={{ fontWeight: 600 }}>{it.productName}</td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          background: `${it.categoryColor}20`,
                          color: it.categoryColor || '#38bdf8',
                          fontWeight: 600,
                        }}
                      >
                        {it.categoryName}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${badgeClass}`}>
                        {icon} {label}
                      </span>
                    </td>
                    <td style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                      {it.currentStock} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{it.unitOfMeasure}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {it.minStock} {it.unitOfMeasure}
                    </td>
                    <td style={{ color: 'var(--text-white)' }}>
                      {it.lastPricePaid ? `$${it.lastPricePaid.toFixed(2)}` : '-'}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{it.storeName || 'Varios'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {/* Botón Consumir */}
                        <button
                          onClick={() => openConsumeModal(it)}
                          className="btn btn-secondary btn-sm"
                          style={{ borderColor: 'rgba(244, 63, 94, 0.3)' }}
                          title="Registrar consumo o salida de stock"
                        >
                          <MinusCircle size={15} color="var(--expense)" /> Consumir
                        </button>

                        {/* Botón Editar Umbrales */}
                        <button
                          onClick={() => openEditModal(it)}
                          className="btn btn-secondary btn-sm"
                          title="Editar umbrales de stock y medidas"
                        >
                          <Settings size={15} color="var(--primary)" />
                        </button>

                        {/* Botón Kárdex / Historial */}
                        <button
                          onClick={() => openKardexModal(it)}
                          className="btn btn-secondary btn-sm"
                          title="Ver Kárdex e Historial de Precios"
                        >
                          <History size={15} color="var(--text-muted)" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Consumo y Salidas */}
      {consumptionModalOpen && activeItem && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Registrar Salida de Inventario</h3>
              <button
                onClick={() => setConsumptionModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConsumeSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'var(--bg-surface-elevated)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Producto:</div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-white)' }}>
                    {activeItem.productName}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Existencia actual: <strong style={{ color: 'var(--primary)' }}>{activeItem.currentStock} {activeItem.unitOfMeasure}</strong>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Cantidad a Descontar ({activeItem.unitOfMeasure})</label>
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    className="input"
                    value={consumeQty}
                    onChange={(e) => setConsumeQty(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Motivo de Salida</label>
                  <select
                    className="select"
                    value={movementType}
                    onChange={(e) => setMovementType(e.target.value)}
                  >
                    <option value="CONSUMPTION">Consumo habitual</option>
                    <option value="EXPIRED">Producto caducado</option>
                    <option value="LOST">Producto perdido o roto</option>
                    <option value="GIFTED">Regalado o donado</option>
                    <option value="MANUAL_ADJUSTMENT">Ajuste manual de conteo</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Notas u Observaciones</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ej. Consumido para la comida..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setConsumptionModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-danger" disabled={submitting}>
                  Confirmar Salida
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Kárdex e Historial de Precios */}
      {kardexModalOpen && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <History size={20} color="var(--primary)" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Kárdex e Historial de Precios</h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{selectedProduct.productName}</span>
                </div>
              </div>
              <button
                onClick={() => setKardexModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Historial de Precios Pagados */}
              <div>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingUp size={16} color="var(--income)" /> Histórico de Precios Pagados en Tiendas
                </h4>

                {kardexData?.priceHistory && kardexData.priceHistory.length > 0 ? (
                  <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '6px' }}>
                    {kardexData.priceHistory.map((ph: any) => (
                      <div
                        key={ph.id}
                        style={{
                          background: 'var(--bg-surface-elevated)',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-md)',
                          minWidth: '140px',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {ph.date.slice(0, 10)}
                        </div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-white)' }}>
                          ${ph.unitPrice.toFixed(2)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {ph.store?.name || 'Tienda'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sin historial previo de compras.</p>
                )}
              </div>

              {/* Tabla de Movimientos del Kárdex */}
              <div>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '10px' }}>Movimientos Registrados</h4>
                <div className="table-container" style={{ maxHeight: '240px', overflowY: 'auto' }}>
                  <table className="custom-table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Cantidad</th>
                        <th>Antes</th>
                        <th>Nuevo Stock</th>
                        <th>Notas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kardexData?.movements && kardexData.movements.length > 0 ? (
                        kardexData.movements.map((m: any) => (
                          <tr key={m.id}>
                            <td>{m.date.slice(0, 10)}</td>
                            <td>
                              <span
                                className={`badge ${
                                  m.movementType === 'PURCHASE_ENTRY' ? 'badge-income' : 'badge-expense'
                                }`}
                              >
                                {m.movementType === 'PURCHASE_ENTRY' ? '+ Entrada Compra' : '- Salida Consumo'}
                              </span>
                            </td>
                            <td style={{ fontWeight: 700 }}>
                              {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                            </td>
                            <td style={{ color: 'var(--text-muted)' }}>{m.previousStock}</td>
                            <td style={{ fontWeight: 700, color: 'var(--text-white)' }}>{m.newStock}</td>
                            <td style={{ color: 'var(--text-secondary)' }}>{m.notes || '-'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                            No hay movimientos registrados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setKardexModalOpen(false)} className="btn btn-secondary">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Umbrales de Stock */}
      {editModalOpen && editingItem && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Configuración de Existencias</h3>
              <button
                onClick={() => setEditModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'var(--bg-surface-elevated)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Producto:</div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-white)' }}>
                    {editingItem.productName}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Unidad de Medida</label>
                  <select
                    className="select"
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                  >
                    <option value="PZA">Pieza (PZA)</option>
                    <option value="KG">Kilogramos (KG)</option>
                    <option value="L">Litros (L)</option>
                    <option value="G">Gramos (G)</option>
                    <option value="ML">Mililitros (ML)</option>
                    <option value="PAQ">Paquete (PAQ)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Stock Mínimo (Alerta y Lista de Compras)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    className="input"
                    value={editMinStock}
                    onChange={(e) => setEditMinStock(Number(e.target.value))}
                    required
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Si las existencias bajan a este nivel o menos, aparecerá en tu lista automática de compras.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Stock Deseado (Meta de Reabastecimiento)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    className="input"
                    value={editDesiredStock}
                    onChange={(e) => setEditDesiredStock(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setEditModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingEdit}>
                  {savingEdit ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nuevo Producto */}
      {createModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Agregar Producto al Inventario</h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProductSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Nombre del Producto</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ej. Leche Entera 1L, Detergente Líquido..."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <select
                    className="select"
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(e.target.value)}
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Stock Inicial</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="input"
                      value={newStock}
                      onChange={(e) => setNewStock(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Unidad de Medida</label>
                    <select
                      className="select"
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                    >
                      <option value="PZA">Pieza (PZA)</option>
                      <option value="KG">Kilogramos (KG)</option>
                      <option value="L">Litros (L)</option>
                      <option value="G">Gramos (G)</option>
                      <option value="ML">Mililitros (ML)</option>
                      <option value="PAQ">Paquete (PAQ)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Stock Mínimo (Alerta)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="input"
                      value={newMinStock}
                      onChange={(e) => setNewMinStock(Number(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Precio Referencial ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="input"
                      placeholder="0.00"
                      value={newPrice}
                      onChange={(e) => setNewPrice(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setCreateModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={creatingProduct}>
                  {creatingProduct ? 'Creando...' : 'Agregar al Inventario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
