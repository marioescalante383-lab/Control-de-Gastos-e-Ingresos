import React from 'react';
import { View } from '../App';
import { DashboardIcon, PencilIcon, DocumentReportIcon, UploadCloudIcon } from './icons';

interface NavigationProps {
  activeView: View;
  setActiveView: (view: View) => void;
}

const NavButton: React.FC<{
  label: string;
  view: View;
  activeView: View;
  onClick: (view: View) => void;
  children: React.ReactNode;
}> = ({ label, view, activeView, onClick, children }) => {
  const isActive = activeView === view;
  return (
    <button
      onClick={() => onClick(view)}
      className={`flex-1 sm:flex-none flex flex-col sm:flex-row items-center justify-center sm:justify-start space-y-1 sm:space-y-0 sm:space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
        isActive
          ? 'bg-primary-500 text-white shadow'
          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700'
      }`}
    >
      {children}
      <span>{label}</span>
    </button>
  );
};


const Navigation: React.FC<NavigationProps> = ({ activeView, setActiveView }) => {
  return (
    <nav className="bg-white dark:bg-slate-800 p-2 rounded-xl shadow-lg flex flex-col sm:flex-row sm:space-x-2">
        <NavButton label="Dashboard" view="dashboard" activeView={activeView} onClick={setActiveView}>
            <DashboardIcon className="w-5 h-5" />
        </NavButton>
        <NavButton label="Registro" view="register" activeView={activeView} onClick={setActiveView}>
            <PencilIcon className="w-5 h-5" />
        </NavButton>
        <NavButton label="Reportes" view="report" activeView={activeView} onClick={setActiveView}>
            <DocumentReportIcon className="w-5 h-5" />
        </NavButton>
        <NavButton label="Importar/Exportar" view="import" activeView={activeView} onClick={setActiveView}>
            <UploadCloudIcon className="w-5 h-5" />
        </NavButton>
    </nav>
  );
};

export default Navigation;
