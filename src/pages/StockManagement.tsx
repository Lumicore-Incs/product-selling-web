import { useState } from 'react';
import StockForm from '../components/stock/StockForm';
import Filters from '../components/stock/Filters';
import StockTable from '../components/stock/StockTable';

interface StockItem {
  id: number;
  type: string;
  date: string;
  quantity: number;
}

const initialData: StockItem[] = [
  { id: 1, type: 'Electronics', date: '2025-04-01', quantity: 10 },
  { id: 2, type: 'Groceries', date: '2025-04-02', quantity: 25 },
];

export const StockManagement = () => {
  const [items, setItems] = useState<StockItem[]>(initialData);
  const [editItem, setEditItem] = useState<StockItem | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');

  const handleSave = (data: StockItem) => {
    if (data.id) {
      setItems(items.map((i) => (i.id === data.id ? data : i)));
    } else {
      const newItem = { ...data, id: Date.now() };
      setItems([...items, newItem]);
    }
    setEditItem(null);
  };

  const handleEdit = (item: StockItem) => {
    setEditItem(item);
  };

  const handleDelete = (id: number) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const handleFilterChange = ({ type, date }: { type: string; date: string }) => {
    setFilterType(type);
    setFilterDate(date);
  };

  return <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-6">Stock Management</h1>
      <StockForm onSubmit={handleSave} initialValues={editItem} />
      <Filters onFilterChange={handleFilterChange} />
      <StockTable
        items={items}
        onEdit={handleEdit}
        onDelete={handleDelete}
        filterType={filterType}
        filterDate={filterDate}
      />
    </div>;
};