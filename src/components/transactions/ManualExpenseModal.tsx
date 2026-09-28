import React from 'react';

interface ManualExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManualExpenseModal: React.FC<ManualExpenseModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Registrar Gasto</h2>
        <p className="text-gray-500 mb-4">Formulario de gasto manual</p>
        <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cerrar</button>
      </div>
    </div>
  );
};
