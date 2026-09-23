import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  Receipt,
  FileSpreadsheet,
  Settings,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventario', icon: Boxes },
    { id: 'shopping', label: 'Lista de Compras', icon: ShoppingCart },
    { id: 'transactions', label: 'Transacciones', icon: Receipt },
    { id: 'reports', label: 'Reportes y Métricas', icon: FileSpreadsheet },
  ];

  return (
    <aside
      style={{
        width: '260px',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        position: 'fixed',
        top: '70px',
        bottom: 0,
        left: 0,
        display: 'none',
        flexDirection: 'column',
        padding: '24px 16px',
        zIndex: 90,
      }}
      className="desktop-sidebar"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
        <div
          style={{
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            fontWeight: 700,
            padding: '0 12px 10px',
          }}
        >
          Menú Principal
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: isActive ? 'var(--text-white)' : 'var(--text-secondary)',
                border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all var(--transition-fast)',
              }}
            >
              <Icon size={20} color={isActive ? 'var(--primary)' : 'var(--text-muted)'} />
              {item.label}
            </button>
          );
        })}
      </div>

      <div
        style={{
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
        }}
      >
        <div style={{ fontWeight: 700, color: 'var(--text-white)', marginBottom: '4px' }}>
          Motor IA Activo
        </div>
        <p style={{ margin: 0, fontSize: '0.75rem', lineHeight: 1.4 }}>
          Gemini 2.0 analiza fotos de comprobantes, detecta duplicados y actualiza stock.
        </p>
      </div>
    </aside>
  );
};
