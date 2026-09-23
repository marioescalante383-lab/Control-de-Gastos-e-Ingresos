import React from 'react';
import { Camera, Plus, ArrowDownCircle, ArrowUpCircle, HardDrive, LogOut, Sparkles } from 'lucide-react';
import { User } from '../../types';

interface NavbarProps {
  user: User | null;
  onOpenScan: () => void;
  onOpenManualExpense: () => void;
  onOpenIncome: () => void;
  onLogout: () => void;
  onConnectDrive: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenScan,
  onOpenManualExpense,
  onOpenIncome,
  onLogout,
  onConnectDrive,
}) => {
  return (
    <header
      style={{
        height: '70px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--primary) 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 0 15px var(--primary-glow)',
          }}
        >
          <Sparkles size={20} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
            Antigravity <span style={{ color: 'var(--primary)' }}>Finance</span>
          </h1>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            IA Multimodal & Control de Stock
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Botón rápido Escanear Comprobante con IA */}
        <button
          onClick={onOpenScan}
          className="btn btn-primary"
          style={{
            padding: '8px 16px',
            fontSize: '0.85rem',
            fontWeight: 700,
          }}
        >
          <Camera size={18} />
          <span style={{ display: 'inline' }}>Escanear Ticket</span>
        </button>

        {/* Botón rápido Gasto Manual */}
        <button
          onClick={onOpenManualExpense}
          className="btn btn-secondary"
          style={{ padding: '8px 14px', fontSize: '0.85rem' }}
          title="Registrar gasto manual"
        >
          <ArrowDownCircle size={18} color="var(--expense)" />
          <span style={{ display: 'none' }} className="desktop-inline">+ Gasto</span>
        </button>

        {/* Botón rápido Registrar Ingreso */}
        <button
          onClick={onOpenIncome}
          className="btn btn-secondary"
          style={{ padding: '8px 14px', fontSize: '0.85rem' }}
          title="Registrar ingreso"
        >
          <ArrowUpCircle size={18} color="var(--income)" />
          <span style={{ display: 'none' }} className="desktop-inline">+ Ingreso</span>
        </button>

        {/* Estado de Google Drive */}
        <button
          onClick={onConnectDrive}
          className="btn btn-secondary"
          style={{
            padding: '8px 12px',
            fontSize: '0.8rem',
            borderColor: user?.hasGoogleDrive ? 'rgba(16, 185, 129, 0.4)' : undefined,
          }}
          title={user?.hasGoogleDrive ? 'Google Drive Conectado' : 'Conectar Google Drive'}
        >
          <HardDrive size={16} color={user?.hasGoogleDrive ? 'var(--income)' : 'var(--text-muted)'} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
            {user?.hasGoogleDrive ? 'Drive Activo' : 'Drive'}
          </span>
        </button>

        {/* Salir */}
        <button
          onClick={onLogout}
          className="btn btn-secondary"
          style={{ padding: '8px 10px', color: 'var(--text-muted)' }}
          title="Cerrar sesión"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};
