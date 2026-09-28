import React from 'react';

export const ShoppingListView: React.FC = () => {
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Lista de Compras</h1>
      <p className="text-gray-500">Tu lista está vacía. Agrega productos aquí.</p>
    </div>
  );
};
