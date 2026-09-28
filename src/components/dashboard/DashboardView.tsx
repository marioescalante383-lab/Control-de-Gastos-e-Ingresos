import React from 'react';

interface DashboardViewProps {
  user: { name: string } | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ user }) => {
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Panel Principal</h1>
      <p className="text-gray-600 mb-6">
      Bienvenido{user?.name ? ', ' + user.name : ''}
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold">Gastos del Mes</h3>
          <p className="text-xl font-bold text-red-600">$0.00</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold">Ingresos</h3>
          <p className="text-xl font-bold text-green-600">$0.00</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-semibold">Saldo</h3>
          <p className="text-xl font-bold text-blue-600">$0.00</p>
        </div>
      </div>
    </div>
  );
};
