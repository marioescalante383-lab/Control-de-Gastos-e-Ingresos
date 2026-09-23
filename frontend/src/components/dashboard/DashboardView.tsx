import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ShoppingBag,
  AlertTriangle,
  Flame,
  Calendar,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { api } from '../../services/api';
import { DashboardSummary } from '../../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardViewProps {
  onGoToShoppingList: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onGoToShoppingList }) => {
  const [period, setPeriod] = useState<string>('month');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSummary = async (selectedPeriod: string) => {
    setLoading(true);
    try {
      const data = await api.getDashboardSummary(selectedPeriod);
      setSummary(data);
    } catch (err) {
      console.error('Error cargando dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(period);
  }, [period]);

  const periods = [
    { id: 'today', label: 'Hoy' },
    { id: 'week', label: 'Esta semana' },
    { id: 'month', label: 'Este mes' },
    { id: 'lastMonth', label: 'Mes anterior' },
    { id: 'year', label: 'Este año' },
    { id: 'all', label: 'Todo el historial' },
  ];

  // Configuración de Gráfico de Líneas (Evolución diaria)
  const lineChartData = {
    labels: summary?.dailyTimeline.map((d) => d.date.slice(5)) || [],
    datasets: [
      {
        label: 'Ingresos',
        data: summary?.dailyTimeline.map((d) => d.incomes) || [],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.35,
        borderWidth: 2,
      },
      {
        label: 'Gastos',
        data: summary?.dailyTimeline.map((d) => d.expenses) || [],
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244, 63, 94, 0.1)',
        fill: true,
        tension: 0.35,
        borderWidth: 2,
      },
    ],
  };

  // Configuración de Gráfico Donut (Categorías)
  const doughnutData = {
    labels: summary?.topCategories.map((c) => c.name) || [],
    datasets: [
      {
        data: summary?.topCategories.map((c) => c.total) || [],
        backgroundColor:
          summary?.topCategories.map(
            (c, i) =>
              c.color ||
              [
                '#6366f1',
                '#10b981',
                '#f59e0b',
                '#ec4899',
                '#06b6d4',
                '#8b5cf6',
                '#64748b',
              ][i % 7]
          ) || [],
        borderColor: '#0f172a',
        borderWidth: 2,
      },
    ],
  };

  // Configuración de Gráfico de Barras (Tiendas)
  const barData = {
    labels: summary?.topStores.slice(0, 6).map((s) => s.name) || [],
    datasets: [
      {
        label: 'Gasto por Tienda',
        data: summary?.topStores.slice(0, 6).map((s) => s.total) || [],
        backgroundColor: 'rgba(99, 102, 241, 0.85)',
        borderRadius: 6,
      },
    ],
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#94a3b8',
          font: { family: 'Plus Jakarta Sans', size: 12 },
        },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#fff',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#64748b' },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#64748b' },
      },
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Selector de Periodo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Panel de Control Financiero</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            Visión global de tus flujos de caja, consumo de artículos e impacto en inventario.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            background: 'var(--bg-surface-elevated)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            overflowX: 'auto',
            maxWidth: '100%',
          }}
        >
          {periods.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              style={{
                background: period === p.id ? 'var(--primary)' : 'transparent',
                color: period === p.id ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all var(--transition-fast)',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        {/* Ingresos */}
        <div className="kpi-card">
          <div className="kpi-icon-box" style={{ background: 'var(--income-bg)' }}>
            <TrendingUp size={26} color="var(--income)" />
          </div>
          <div>
            <div className="kpi-label">Ingresos del Periodo</div>
            <div className="kpi-value" style={{ color: 'var(--income)' }}>
              ${summary ? summary.totalIncomes.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </div>
          </div>
        </div>

        {/* Gastos */}
        <div className="kpi-card">
          <div className="kpi-icon-box" style={{ background: 'var(--expense-bg)' }}>
            <TrendingDown size={26} color="var(--expense)" />
          </div>
          <div>
            <div className="kpi-label">Gastos del Periodo</div>
            <div className="kpi-value" style={{ color: 'var(--expense)' }}>
              ${summary ? summary.totalExpenses.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </div>
          </div>
        </div>

        {/* Balance */}
        <div className="kpi-card">
          <div
            className="kpi-icon-box"
            style={{
              background: (summary?.balance || 0) >= 0 ? 'var(--income-bg)' : 'var(--expense-bg)',
            }}
          >
            <Wallet
              size={26}
              color={(summary?.balance || 0) >= 0 ? 'var(--income)' : 'var(--expense)'}
            />
          </div>
          <div>
            <div className="kpi-label">Balance Neto</div>
            <div
              className="kpi-value"
              style={{
                color: (summary?.balance || 0) >= 0 ? 'var(--income)' : 'var(--expense)',
              }}
            >
              ${summary ? summary.balance.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </div>
          </div>
        </div>

        {/* Compras y Ticket Promedio */}
        <div className="kpi-card">
          <div className="kpi-icon-box" style={{ background: 'rgba(99, 102, 241, 0.15)' }}>
            <ShoppingBag size={26} color="var(--primary)" />
          </div>
          <div>
            <div className="kpi-label">Compras Realizadas</div>
            <div className="kpi-value">
              {summary?.purchasesCount || 0}{' '}
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                (prom. ${summary?.averageTicket.toFixed(2)})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Fila de Alertas Rápidas (Stock Bajo y Aumentos de Precios) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Alerta de Stock Bajo */}
        <div
          className="glass-card"
          style={{
            borderLeft: '4px solid var(--warning)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'var(--warning-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={22} color="var(--warning)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                {summary?.lowStockAlerts.length || 0} Productos con Stock Bajo
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {summary && summary.lowStockAlerts.length > 0
                  ? summary.lowStockAlerts.slice(0, 2).map((a) => a.productName).join(', ') +
                    (summary.lowStockAlerts.length > 2 ? ` y ${summary.lowStockAlerts.length - 2} más` : '')
                  : 'Inventario en niveles óptimos'}
              </div>
            </div>
          </div>

          <button onClick={onGoToShoppingList} className="btn btn-secondary btn-sm">
            Ver Lista
          </button>
        </div>

        {/* Alerta de Variación e Inflación de Precios */}
        <div
          className="glass-card"
          style={{
            borderLeft: '4px solid #f43f5e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'rgba(244, 63, 94, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Flame size={22} color="#f43f5e" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                {summary?.priceIncreases.length || 0} Productos Subieron de Precio
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {summary && summary.priceIncreases.length > 0
                  ? summary.priceIncreases.slice(0, 1).map((p) => `${p.productName} (+${p.increasePercentage}%)`).join('')
                  : 'Sin aumentos detectados en el periodo'}
              </div>
            </div>
          </div>

          <span className="badge badge-expense">Histórico IA</span>
        </div>
      </div>

      {/* Gráficos Principales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
        {/* Evolución Diaria de Ingresos vs Gastos */}
        <div className="glass-card" style={{ height: '360px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Evolución Financiera (Ingresos vs Gastos)</h3>
          <div style={{ flex: 1, position: 'relative' }}>
            {summary && summary.dailyTimeline.length > 0 ? (
              <Line data={lineChartData} options={chartOptions} />
            ) : (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.9rem',
                }}
              >
                No hay movimientos registrados en este periodo.
              </div>
            )}
          </div>
        </div>

        {/* Distribución por Categorías */}
        <div className="glass-card" style={{ height: '360px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Gastos por Categoría</h3>
          <div style={{ flex: 1, position: 'relative' }}>
            {summary && summary.topCategories.length > 0 ? (
              <Doughnut
                data={doughnutData}
                options={{
                  ...chartOptions,
                  cutout: '70%',
                  scales: { x: { display: false }, y: { display: false } },
                }}
              />
            ) : (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.9rem',
                }}
              >
                Sin gastos categorizados en este periodo.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gastos por Tienda */}
      <div className="glass-card" style={{ minHeight: '280px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Top Establecimientos de Compra</h3>
        <div style={{ height: '220px', position: 'relative' }}>
          {summary && summary.topStores.length > 0 ? (
            <Bar data={barData} options={chartOptions} />
          ) : (
            <div
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
              }}
            >
              No se han registrado tiendas en este periodo.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
