import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileTabBar } from './components/layout/MobileTabBar';
import { DashboardView } from './components/dashboard/DashboardView';
import { InventoryView } from './components/inventory/InventoryView';
import { ShoppingListView } from './components/shopping/ShoppingListView';
import { TransactionsView } from './components/transactions/TransactionsView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { ReceiptScanModal } from './components/receipts/ReceiptScanModal';
import { ManualExpenseModal } from './components/transactions/ManualExpenseModal';
import { IncomeModal } from './components/transactions/IncomeModal';
import { api } from './services/api';
import { User, Category } from './types';
import { Sparkles, Lock, Mail, UserCheck } from 'lucide-react';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);

  // Estados de Modales
  const [isScanOpen, setIsScanOpen] = useState<boolean>(false);
  const [isManualExpenseOpen, setIsManualExpenseOpen] = useState<boolean>(false);
  const [isIncomeOpen, setIsIncomeOpen] = useState<boolean>(false);

  // Estados de Login / Registro
  const [authEmail, setAuthEmail] = useState<string>('demo@antigravity.finance');
  const [authPassword, setAuthPassword] = useState<string>('Demo1234!');
  const [authName, setAuthName] = useState<string>('Usuario Demo');
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const checkAuth = async () => {
    try {
      if (api.getToken()) {
        const u = await api.getMe();
        setUser(u);
        const cats = await api.getCategories();
        setCategories(cats);
      }
    } catch (err) {
      console.warn('Sesión no encontrada o expirada:', err);
      api.setToken(null);
      setUser(null);
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      if (isRegistering) {
        const res = await api.register(authEmail, authPassword, authName);
        setUser(res.user);
      } else {
        const res = await api.login(authEmail, authPassword);
        setUser(res.user);
      }
      const cats = await api.getCategories();
      setCategories(cats);
    } catch (err: any) {
      setAuthError(err.message || 'Error al iniciar sesión');
    }
  };

  const handleLogout = () => {
    api.setToken(null);
    setUser(null);
  };

  const handleConnectDrive = async () => {
    try {
      const res = await api.getGoogleAuthUrl();
      if (res.url) {
        window.open(res.url, 'GoogleDriveAuth', 'width=600,height=700');
      }
    } catch (err: any) {
      alert('Error al conectar con Google Drive: ' + err.message);
    }
  };

  // Escuchar mensaje de éxito desde la ventana popup de Google Drive
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        checkAuth();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (loadingInitial) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-main)',
          color: 'var(--text-white)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <Sparkles size={40} color="var(--primary)" className="spin" style={{ marginBottom: '12px' }} />
          <div>Cargando Antigravity Finance...</div>
        </div>
      </div>
    );
  }

  // Pantalla de Autenticación si no está logueado
  if (!user) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(ellipse at top, #1e1b4b 0%, #090d16 80%)',
          padding: '20px',
        }}
      >
        <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '36px 30px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, var(--primary) 0%, #8b5cf6 100%)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 0 25px var(--primary-glow)',
                marginBottom: '16px',
              }}
            >
              <Sparkles size={28} />
            </div>
            <h2 style={{ fontSize: '1.6rem', margin: 0, letterSpacing: '-0.02em' }}>
              Antigravity <span style={{ color: 'var(--primary)' }}>Finance</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '6px' }}>
              Control integral de gastos, inventario y comprobantes con IA
            </p>
          </div>

          {authError && (
            <div
              style={{
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: 'var(--expense)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                marginBottom: '18px',
              }}
            >
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {isRegistering && (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Nombre Completo</label>
                <div style={{ position: 'relative' }}>
                  <UserCheck size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    className="input"
                    style={{ paddingLeft: '38px' }}
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Correo Electrónico</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  className="input"
                  style={{ paddingLeft: '38px' }}
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Contraseña</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  className="input"
                  style={{ paddingLeft: '38px' }}
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '6px' }}>
              {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setAuthError(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {isRegistering ? '¿Ya tienes una cuenta? Inicia sesión aquí' : '¿No tienes cuenta? Regístrate aquí'}
            </button>
          </div>

          <div
            style={{
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              textAlign: 'center',
            }}
          >
            Tip de inicio rápido: Las credenciales del usuario Demo ya vienen ingresadas para probar de inmediato.
          </div>
        </div>
      </div>
    );
  }

  // App Principal Autenticada
  return (
    <div className="app-container">
      {/* Sidebar para pantallas de escritorio */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="main-content">
        {/* Navbar */}
        <Navbar
          user={user}
          onOpenScan={() => setIsScanOpen(true)}
          onOpenManualExpense={() => setIsManualExpenseOpen(true)}
          onOpenIncome={() => setIsIncomeOpen(true)}
          onLogout={handleLogout}
          onConnectDrive={handleConnectDrive}
        />

        {/* Vistas Dinámicas */}
        <main className="content-wrapper">
          {activeTab === 'dashboard' && (
            <DashboardView onGoToShoppingList={() => setActiveTab('shopping')} />
          )}

          {activeTab === 'inventory' && <InventoryView />}

          {activeTab === 'shopping' && <ShoppingListView />}

          {activeTab === 'transactions' && <TransactionsView />}

          {activeTab === 'reports' && <ReportsView />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Barra de navegación táctil para móviles */}
      <MobileTabBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenScan={() => setIsScanOpen(true)}
      />

      {/* Modales Globales */}
      <ReceiptScanModal
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        onSuccess={() => {
          setIsScanOpen(false);
          setActiveTab('dashboard');
        }}
        categories={categories}
      />

      <ManualExpenseModal
        isOpen={isManualExpenseOpen}
        onClose={() => setIsManualExpenseOpen(false)}
        onSuccess={() => {
          setIsManualExpenseOpen(false);
          setActiveTab('dashboard');
        }}
        categories={categories}
      />

      <IncomeModal
        isOpen={isIncomeOpen}
        onClose={() => setIsIncomeOpen(false)}
        onSuccess={() => {
          setIsIncomeOpen(false);
          setActiveTab('dashboard');
        }}
        categories={categories}
      />
    </div>
  );
};
