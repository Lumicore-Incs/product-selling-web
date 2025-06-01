import React, { useState } from 'react';
import { SalesForm } from '../components/SalesForm';
import { SalesTable } from '../components/SalesTable';

interface Sale {
  id: string;
  customerName: string;
  address: string;
  contact1: string;
  contact2: string;
  quantity: number;
}

export const SalesManagement: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const addSale = (sale: Omit<Sale, 'id'>) => {
    const newSale = {
      ...sale,
      id: Date.now().toString()
    };
    setSales([...sales, newSale]);
  };

  const updateSale = (updatedSale: Sale) => {
    setSales(sales.map(sale => sale.id === updatedSale.id ? updatedSale : sale));
    setCurrentSale(null);
    setIsEditing(false);
  };

  const deleteSale = (id: string) => {
    setSales(sales.filter(sale => sale.id !== id));
    if (currentSale?.id === id) {
      setCurrentSale(null);
      setIsEditing(false);
    }
  };

  const editSale = (sale: Sale) => {
    setCurrentSale(sale);
    setIsEditing(true);
  };

  const exportSales = () => {
    const dataStr = JSON.stringify(sales, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `sales-data-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Sales Management</h1>
            <p className="text-gray-600 mt-2">
              Add, edit, and manage your sales entries
            </p>
          </div>
          <button
            onClick={exportSales}
            disabled={sales.length === 0}
            className={`px-4 py-2 rounded-md text-white ${sales.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            Export Sales
          </button>
        </div>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <SalesForm 
            onSave={addSale} 
            onUpdate={updateSale} 
            currentSale={currentSale} 
            isEditing={isEditing} 
            onCancelEdit={() => {
              setCurrentSale(null);
              setIsEditing(false);
            }} 
          />
        </div>
        <div className="lg:col-span-2">
          <SalesTable sales={sales} onEdit={editSale} onDelete={deleteSale} />
        </div>
      </div>
    </div>
  );
};