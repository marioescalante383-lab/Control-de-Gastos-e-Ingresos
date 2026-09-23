import React, { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Filter,
  FileText,
  Calendar,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { api } from '../../services/api';

export const ReportsView: React.FC = () => {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await api.getFinancialReport(startDate, endDate);
      setReport(data);
    } catch (err) {
      console.error('Error al generar reporte:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  const handleDownloadCsv = () => {
    const token = api.getToken();
    const url = `/api/dashboard/export/csv?startDate=${startDate}&endDate=${endDate}`;

    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `reporte_gastos_${startDate}_a_${endDate}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((err) => alert('Error descargando CSV: ' + err.message));
  };

  const handleExportPdf = () => {
    if (!report) return;
    const doc = new jsPDF();

    // Encabezado Ejecutivo
    doc.setFontSize(20);
    doc.setTextColor(99, 102, 241);
    doc.text('Antigravity Finance', 14, 20);

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Reporte Financiero y Control de Gastos`, 14, 28);
    doc.text(`Periodo: ${startDate} al ${endDate}`, 14, 34);

    // Resumen Ejecutivo
    doc.setFontSize(10);
    doc.setTextColor(50);
    const summaryText = [
      `Total Ingresos: $${report.summary.totalIncomes.toFixed(2)}`,
      `Total Gastos: $${report.summary.totalExpenses.toFixed(2)}`,
      `Balance Neto: $${report.summary.netBalance.toFixed(2)}`,
      `Ticket Promedio: $${report.summary.averageTicket.toFixed(2)} (${report.summary.transactionsCount} compras)`,
    ];
    doc.text(summaryText.join('   |   '), 14, 44);

    // Tabla de Gastos
    const tableRows = report.transactions.map((t: any) => [
      t.date.slice(0, 10),
      t.store?.name || 'Varios',
      t.ticketNumber || '-',
      t.paymentMethod,
      t.isManual ? 'Manual' : 'Ticket IA',
      `$${t.total.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 50,
      head: [['Fecha', 'Comercio', 'Folio', 'Método Pago', 'Origen', 'Monto Total']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255] },
      styles: { fontSize: 9 },
    });

    doc.save(`reporte_financiero_${startDate}_al_${endDate}.pdf`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Reportes y Exportación</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            Filtra tus movimientos y expórtalos en formatos ejecutivos PDF y Excel / CSV.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleDownloadCsv} className="btn btn-secondary btn-sm">
            <FileSpreadsheet size={16} color="var(--income)" /> Descargar CSV / Excel
          </button>
          <button onClick={handleExportPdf} className="btn btn-primary btn-sm">
            <Download size={16} /> Exportar a PDF
          </button>
        </div>
      </div>

      {/* Barra de Filtros de Fecha */}
      <div
        className="glass-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          padding: '16px 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} color="var(--primary)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Rango de Fechas:</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Desde:</span>
          <input
            type="date"
            className="input"
            style={{ width: '160px', padding: '6px 10px' }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Hasta:</span>
          <input
            type="date"
            className="input"
            style={{ width: '160px', padding: '6px 10px' }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* KPI Cards de Periodo Filtrado */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-box" style={{ background: 'var(--income-bg)' }}>
            <TrendingUp size={24} color="var(--income)" />
          </div>
          <div>
            <div className="kpi-label">Ingresos Filtrados</div>
            <div className="kpi-value" style={{ color: 'var(--income)' }}>
              ${report ? report.summary.totalIncomes.toFixed(2) : '0.00'}
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-box" style={{ background: 'var(--expense-bg)' }}>
            <TrendingDown size={24} color="var(--expense)" />
          </div>
          <div>
            <div className="kpi-label">Gastos Filtrados</div>
            <div className="kpi-value" style={{ color: 'var(--expense)' }}>
              ${report ? report.summary.totalExpenses.toFixed(2) : '0.00'}
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-box" style={{ background: 'rgba(99, 102, 241, 0.15)' }}>
            <Wallet size={24} color="var(--primary)" />
          </div>
          <div>
            <div className="kpi-label">Balance del Periodo</div>
            <div
              className="kpi-value"
              style={{
                color: (report?.summary?.netBalance || 0) >= 0 ? 'var(--income)' : 'var(--expense)',
              }}
            >
              ${report ? report.summary.netBalance.toFixed(2) : '0.00'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla Resumen de Transacciones */}
      <div className="table-container glass-card" style={{ padding: 0 }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Comercio</th>
              <th>Tipo / Origen</th>
              <th>Folio</th>
              <th>Método de Pago</th>
              <th style={{ textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  Generando reporte...
                </td>
              </tr>
            ) : report?.transactions?.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No se encontraron gastos en este rango de fechas.
                </td>
              </tr>
            ) : (
              report?.transactions?.map((t: any) => (
                <tr key={t.id}>
                  <td>{t.date.slice(0, 10)}</td>
                  <td style={{ fontWeight: 600 }}>{t.store?.name || 'Varios'}</td>
                  <td>
                    <span className={`badge ${t.isManual ? 'badge-info' : 'badge-income'}`}>
                      {t.isManual ? 'Manual' : 'Ticket con IA'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{t.ticketNumber || '-'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{t.paymentMethod}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--expense)' }}>
                    ${t.total.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
