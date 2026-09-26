import React, { useState, useEffect } from 'react';
import {
  Settings,
  Tag,
  Sliders,
  Sparkles,
  Cloud,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  Edit2,
  X,
} from 'lucide-react';
import { api } from '../../services/api';
import { Category } from '../../types';

export const SettingsView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'categories' | 'rules' | 'ai_drive'>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Nueva Categoría
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState('EXPENSE');
  const [catColor, setCatColor] = useState('#6366f1');
  const [savingCat, setSavingCat] = useState(false);

  // Modal Nueva Regla
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [ruleKeyword, setRuleKeyword] = useState('');
  const [ruleCategoryId, setRuleCategoryId] = useState('');
  const [savingRule, setSavingRule] = useState(false);

  // Feedback
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const predefinedColors = [
    '#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#22c55e',
    '#84cc16', '#eab308', '#f97316', '#ef4444', '#ec4899',
    '#8b5cf6', '#a855f7', '#64748b'
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, rls] = await Promise.all([
        api.getCategories(),
        api.getCategoryRules().catch(() => []),
      ]);
      setCategories(cats);
      setRules(rls);
      if (cats.length > 0 && !ruleCategoryId) {
        setRuleCategoryId(cats[0].id);
      }
    } catch (err: any) {
      console.error('Error cargando configuración:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setSavingCat(true);
    try {
      await api.createCategory({
        name: catName.trim(),
        type: catType,
        color: catColor,
        icon: 'Tag',
      });
      setIsCatModalOpen(false);
      setCatName('');
      setFeedbackMsg({ text: 'Categoría creada con éxito', type: 'success' });
      await loadData();
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Error al crear categoría', type: 'error' });
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('¿Deseas desactivar esta categoría personalizada?')) return;
    try {
      await api.deleteCategory(id);
      setFeedbackMsg({ text: 'Categoría desactivada', type: 'success' });
      await loadData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleKeyword.trim() || !ruleCategoryId) return;
    setSavingRule(true);
    try {
      await api.createCategoryRule({
        matchKeyword: ruleKeyword.trim(),
        targetCategoryId: ruleCategoryId,
        matchField: 'RAW_DESCRIPTION',
        priority: 1,
      });
      setIsRuleModalOpen(false);
      setRuleKeyword('');
      setFeedbackMsg({ text: 'Regla de autoclasificación guardada', type: 'success' });
      await loadData();
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Error al guardar regla', type: 'error' });
    } finally {
      setSavingRule(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Configuración del Sistema</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            Administra tus categorías personalizadas, reglas inteligentes de autogestión y conexiones de IA.
          </p>
        </div>

        {/* Pestañas de Ajustes */}
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
            onClick={() => setActiveSubTab('categories')}
            style={{
              background: activeSubTab === 'categories' ? 'var(--primary)' : 'transparent',
              color: activeSubTab === 'categories' ? '#fff' : 'var(--text-secondary)',
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
            <Tag size={15} /> Categorías
          </button>
          <button
            onClick={() => setActiveSubTab('rules')}
            style={{
              background: activeSubTab === 'rules' ? 'var(--primary)' : 'transparent',
              color: activeSubTab === 'rules' ? '#fff' : 'var(--text-secondary)',
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
            <Sliders size={15} /> Reglas IA
          </button>
          <button
            onClick={() => setActiveSubTab('ai_drive')}
            style={{
              background: activeSubTab === 'ai_drive' ? 'var(--primary)' : 'transparent',
              color: activeSubTab === 'ai_drive' ? '#fff' : 'var(--text-secondary)',
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
            <Sparkles size={15} /> Motor & Drive
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: 'var(--radius-md)',
            background: feedbackMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
            border: `1px solid ${feedbackMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            color: feedbackMsg.type === 'success' ? 'var(--income)' : 'var(--expense)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{feedbackMsg.text}</span>
          <button
            onClick={() => setFeedbackMsg(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Subtab 1: Categorías */}
      {activeSubTab === 'categories' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Total: {categories.length} categorías activas en el sistema
            </span>
            <button
              onClick={() => setIsCatModalOpen(true)}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} /> Nueva Categoría
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '14px',
            }}
          >
            {categories.map((c) => (
              <div
                key={c.id}
                className="glass-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  borderLeft: `4px solid ${c.color || 'var(--primary)'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: `${c.color || '#6366f1'}20`,
                      color: c.color || '#6366f1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Tag size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{c.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {c.type === 'EXPENSE' ? 'Gasto' : c.type === 'INCOME' ? 'Ingreso' : 'Ambos'} •{' '}
                      {c.isSystem ? 'Sistema' : 'Personalizada'}
                    </div>
                  </div>
                </div>

                {!c.isSystem && (
                  <button
                    onClick={() => handleDeleteCategory(c.id)}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '6px', color: 'var(--expense)' }}
                    title="Desactivar categoría"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab 2: Reglas de Autoclasificación */}
      {activeSubTab === 'rules' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Reglas de Autoclasificación Rápida</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Cuando el OCR o tú registren un comprobante con estas palabras clave, se asignará la categoría automáticamente.
              </p>
            </div>
            <button
              onClick={() => setIsRuleModalOpen(true)}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} /> Nueva Regla
            </button>
          </div>

          <div className="table-container glass-card" style={{ padding: 0 }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Palabra Clave / Patrón</th>
                  <th>Categoría Asignada</th>
                  <th>Prioridad</th>
                  <th>Fecha de Creación</th>
                </tr>
              </thead>
              <tbody>
                {rules.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No tienes reglas adicionales configuradas. El sistema utiliza el modelo de IA Gemini 2.0 y su memoria de alias histórica.
                    </td>
                  </tr>
                ) : (
                  rules.map((r: any) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>
                        <code style={{ background: 'var(--bg-surface-elevated)', padding: '2px 8px', borderRadius: '4px' }}>
                          {r.matchKeyword}
                        </code>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            background: `${r.targetCategory?.color || '#38bdf8'}20`,
                            color: r.targetCategory?.color || '#38bdf8',
                            fontWeight: 600,
                          }}
                        >
                          {r.targetCategory?.name || 'Categoría'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>Alta ({r.priority})</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString('es-MX') : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 3: Estado de Motor IA & Google Drive */}
      {activeSubTab === 'ai_drive' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Card Gemini */}
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                <Sparkles size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Motor Multimodal Google Gemini</h3>
                <span className="badge badge-income" style={{ marginTop: '4px' }}>
                  <CheckCircle2 size={13} /> Motor Inteligente Activo
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Antigravity Finance utiliza <strong>Gemini 2.0 Flash</strong> para analizar imágenes de tickets, recibos y facturas en tiempo real. Extrae automáticamente totales, impuestos, desglose de ítems y confianza (`confidence_score`).
            </p>

            <div
              style={{
                background: 'var(--bg-surface-elevated)',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text-white)', marginBottom: '4px' }}>
                Configuración en `backend/.env`:
              </div>
              <code>GEMINI_API_KEY="AIzaSy..."</code>
              <div style={{ marginTop: '8px', fontSize: '0.75rem' }}>
                * Si no tienes una clave ingresada, el sistema utiliza el emulador de alta fidelidad para que disfrutes de todas las funciones sin costos.
              </div>
            </div>
          </div>

          {/* Card Google Drive */}
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                <Cloud size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Respaldo en Google Drive</h3>
                <span className="badge badge-warning" style={{ marginTop: '4px' }}>
                  Almacenamiento Seguro
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Permite subir automáticamente copias de tus comprobantes y tickets físicos a tu unidad privada de Google Drive en una carpeta dedicada <code>Antigravity_Receipts</code>.
            </p>

            <div
              style={{
                background: 'var(--bg-surface-elevated)',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text-white)', marginBottom: '4px' }}>
                Beneficios de la Integración:
              </div>
              <ul style={{ margin: '6px 0 0', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li>Respaldo fiscal permanente ante pérdidas o daños.</li>
                <li>Enlaces directos a tus archivos desde la tabla de movimientos.</li>
                <li>Sincronización segura con OAuth 2.0.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nueva Categoría */}
      {isCatModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Nueva Categoría</h3>
              <button
                onClick={() => setIsCatModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCategory}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Nombre de la Categoría</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ej. Colegiaturas, Farmacia..."
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <select
                    className="input"
                    value={catType}
                    onChange={(e) => setCatType(e.target.value)}
                  >
                    <option value="EXPENSE">Gasto</option>
                    <option value="INCOME">Ingreso</option>
                    <option value="BOTH">Ambos</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Color Distintivo</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {predefinedColors.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setCatColor(col)}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: col,
                          border: catColor === col ? '3px solid #fff' : 'none',
                          cursor: 'pointer',
                          boxShadow: catColor === col ? '0 0 10px rgba(255,255,255,0.5)' : 'none',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingCat}
                >
                  {savingCat ? 'Guardando...' : 'Crear Categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nueva Regla */}
      {isRuleModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Nueva Regla de Clasificación</h3>
              <button
                onClick={() => setIsRuleModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateRule}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Palabra clave en el ticket o producto</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ej. GASOLINA, STARBUCKS, OXXO..."
                    value={ruleKeyword}
                    onChange={(e) => setRuleKeyword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Categoría a Asignar</label>
                  <select
                    className="input"
                    value={ruleCategoryId}
                    onChange={(e) => setRuleCategoryId(e.target.value)}
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.type === 'EXPENSE' ? 'Gasto' : 'Ingreso'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingRule}
                >
                  {savingRule ? 'Guardando...' : 'Guardar Regla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
