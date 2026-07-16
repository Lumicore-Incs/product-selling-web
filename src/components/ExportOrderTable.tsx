import { Sale } from '../models/sales';

interface ExportOrderTableProps {
  orders: Sale[];
  selectedProductId: string;
  selectedIds: Set<string>;
  loading: boolean;
  onToggleSelectAll: () => void;
  onToggleSelectOne: (id: string) => void;
}

export const ExportOrderTable = ({
  orders,
  selectedProductId,
  selectedIds,
  loading,
  onToggleSelectAll,
  onToggleSelectOne,
}: ExportOrderTableProps) => {
  const visibleIds = orders.map((sale) => String(sale.id));
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg bg-[#FFFFFF7D]" style={{ backdropFilter: 'border-radius(18px)' }}>
      <table className="min-w-[960px] w-full text-sm">
        <thead className="bg-gray-50 text-gray-700">
          <tr>
            {selectedProductId !== 'all' && (
              <th className="px-3 py-3 text-left w-10">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={onToggleSelectAll}
                  aria-label="Select all"
                />
              </th>
            )}
            <th className="px-3 py-3 text-left">ID</th>
            <th className="px-3 py-3 text-left">Name</th>
            <th className="px-3 py-3 text-left">Address</th>
            <th className="px-3 py-3 text-left">Description</th>
            <th className="px-3 py-3 text-left">Whatsapp No</th>
            <th className="px-3 py-3 text-left">Contact02</th>
            <th className="px-3 py-3 text-left">Price</th>
            <th className="px-3 py-3 text-left">City</th>
            <th className="px-3 py-3 text-left">Note</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {loading ? (
            <tr>
              <td className="px-3 py-4 text-center text-gray-500" colSpan={10}>
                Loading orders...
              </td>
            </tr>
          ) : orders.length === 0 ? (
            <tr>
              <td className="px-3 py-4 text-center text-gray-500" colSpan={10}>
                No orders found.
              </td>
            </tr>
          ) : (
            orders.map((sale) => {
              const id = String(sale.id);
              const name = sale.customerName || sale.name || '';
              const address = sale.address || '';
              const whatsapp = sale.contact01 || '';
              const contact02 = sale.contact02 || '';
              const price = Number.isFinite(sale.totalPrice) ? sale.totalPrice.toFixed(2) : '0.00';
              const note = sale.remark || '';

              return (
                <tr key={id} className="hover:bg-gray-50">
                  {selectedProductId !== 'all' && (
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(id)}
                        onChange={() => onToggleSelectOne(id)}
                        aria-label={`Select ${name || id}`}
                      />
                    </td>
                  )}
                  <td className="px-3 py-3 text-gray-800">{id}</td>
                  <td className="px-3 py-3 text-gray-800">{name}</td>
                  <td className="px-3 py-3 text-gray-800">{address}</td>
                  <td className="px-3 py-3 text-gray-800"></td>
                  <td className="px-3 py-3 text-gray-800">{whatsapp}</td>
                  <td className="px-3 py-3 text-gray-800">{contact02}</td>
                  <td className="px-3 py-3 text-gray-800">{price}</td>
                  <td className="px-3 py-3 text-gray-800"></td>
                  <td className="px-3 py-3 text-gray-800">{note}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
