import React from 'react';
import { DashboardView } from './components/dashboard/DashboardView';

export const App: React.FC = () => {
  const user = { name: 'Mario' };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardView user={user} />
    </div>
  );
};
