import React from 'react';

interface SettingsViewProps {
  user: { name: string; email: string } | null;
  onLogout: () => void;
  onConnectDrive: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  onLogout,
  onConnectDrive
}) => {
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Configuración</h1>
      
      {user && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h2 className="font-semibold mb-2">Tu Cuenta</h2>
          <p className="text-gray-700"><strong>Nombre:</strong> {user.name}</p>
          <p className="text-gray-700"><strong>Correo:</strong> {user.email}</p>
        </div>
      )}
      
      <div className="space-y-4">
        <button
          onClick={onConnectDrive}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Conectar Google Drive
        </button>
        
        <button
          onClick={onLogout}
          className="w-full py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};
