import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  Receipt,
  FileSpreadsheet,
  Camera,
} from 'lucide-react';

interface MobileTabBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenScan: () => void;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  activeTab,
  setActiveTab,
  onOpenScan,
}) => {
  return (
    <nav
      className="mobile-tab-bar"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '68px',
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 100,
        padding: '0 8px',
      }}
    >
      <button
        onClick={() => setActiveTab('dashboard')}
        style={{
          background: 'none',
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          color: activeTab === 'dashboard' ? 'var(--primary)' : 'var(--text-muted)',
          fontSize: '0.7rem',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <LayoutDashboard size={20} />
        <span>Inicio</span>
      </button>

      <button
        onClick={() => setActiveTab('inventory')}
        style={{
          background: 'none',
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          color: activeTab === 'inventory' ? 'var(--primary)' : 'var(--text-muted)',
          fontSize: '0.7rem',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <Boxes size={20} />
        <span>Stock</span>
      </button>

      {/* Botón flotante central de escaneo para smartphones */}
      <button
        onClick={onOpenScan}
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
          color: '#fff',
          border: '3px solid var(--bg-main)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 15px var(--primary-glow)',
          transform: 'translateY(-12px)',
          cursor: 'pointer',
        }}
        title="Tomar foto de ticket con la cámara"
      >
        <Camera size={24} />
      </button>

      <button
        onClick={() => setActiveTab('shopping')}
        style={{
          background: 'none',
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          color: activeTab === 'shopping' ? 'var(--primary)' : 'var(--text-muted)',
          fontSize: '0.7rem',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <ShoppingCart size={20} />
        <span>Compras</span>
      </button>

      <button
        onClick={() => setActiveTab('reports')}
        style={{
          background: 'none',
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          color: activeTab === 'reports' ? 'var(--primary)' : 'var(--text-muted)',
          fontSize: '0.7rem',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <FileSpreadsheet size={20} />
        <span>Reportes</span>
      </button>
    </nav>
  );
};
