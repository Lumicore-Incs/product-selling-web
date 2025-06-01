import { UsersIcon, ShoppingCartIcon, CreditCardIcon, TrendingUpIcon } from 'lucide-react';
import { SalesTable } from '../components/SalesTable';

type StatCardProps = {
  icon: React.ComponentType<any>;
  label: string;
  value: string;
  trend: string;
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  trend
}: StatCardProps) => (
  <div className="bg-white bg-opacity-70 backdrop-filter backdrop-blur-lg rounded-xl p-6 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <h3 className="text-2xl font-bold text-gray-800 mt-1">{value}</h3>
      </div>
      <div className="p-3 bg-blue-50 rounded-lg">
        <Icon size={24} className="text-blue-500" />
      </div>
    </div>
    <div className="flex items-center mt-4">
      <TrendingUpIcon size={16} className="text-green-500 mr-1" />
      <span className="text-sm text-green-500">{trend}</span>
    </div>
  </div>
);

export const Dashboard = () => {
  // Sample sales data
  const sampleSales = [
    {
      id: '1',
      customerName: 'John Doe',
      address: '123 Main St, Colombo',
      contact1: '0712345678',
      contact2: '0112345678',
      status:"pending",
      quantity: 5
    },
    {
      id: '2',
      customerName: 'Jane Smith',
      address: '456 Galle Rd, Kandy',
      contact1: '0776543210',
      contact2: '0812345678',
      status:"pending",
      quantity: 3
    },
    {
      id: '3',
      customerName: 'Raj Patel',
      address: '789 Marine Dr, Galle',
      contact1: '0765432109',
      contact2: '0912345678',
      status:"deleverd",
      quantity: 7
    },
    {
      id: '4',
      customerName: 'Priya Fernando',
      address: '321 Hill St, Nuwara Eliya',
      contact1: '0754321098',
      contact2: '',
      status:"processing",
      quantity: 2
    },
    {
      id: '5',
      customerName: 'David Perera',
      address: '654 Beach Rd, Negombo',
      contact1: '0723456789',
      contact2: '0312345678',
      status:"completed",
      quantity: 4
    },
    {
      id: '5',
      customerName: 'David Perera',
      address: '654 Beach Rd, Negombo',
      contact1: '0723456789',
      contact2: '0312345678',
      status:"cancelled",
      quantity: 4
    }
  ];

  // Mock functions for table actions
  const handleEdit = (sale: any) => {
    console.log('Editing:', sale);
    // Add your edit logic here
  };

  const handleDelete = (id: string) => {
    console.log('Deleting:', id);
    // Add your delete logic here
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={UsersIcon} label="Total Users" value="2,543" trend="+12.5% from last month" />
        <StatCard icon={ShoppingCartIcon} label="Total Orders" value="1,234" trend="+8.2% from last month" />
        <StatCard icon={CreditCardIcon} label="Revenue" value="$45,678" trend="+15.3% from last month" />
        <StatCard icon={TrendingUpIcon} label="Growth" value="23.5%" trend="+4.1% from last month" />
      </div>
      
      <div className="bg-white bg-opacity-70 backdrop-filter backdrop-blur-lg rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Recent Sales</h2>
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-blue-100 bg-opacity-70 hover:bg-opacity-100 text-blue-600 rounded-lg transition-all duration-200 flex items-center">
              <span>Vac</span>
            </button>
            <button className="px-4 py-2 bg-green-100 bg-opacity-70 hover:bg-opacity-100 text-green-600 rounded-lg transition-all duration-200 flex items-center">
              <span>Sugur End</span>
            </button>
            <button className="px-4 py-2 bg-purple-100 bg-opacity-70 hover:bg-opacity-100 text-purple-600 rounded-lg transition-all duration-200 flex items-center">
              <span>Other</span>
            </button>
          </div>
        </div>
        <div className="lg:col-span-2">
          <SalesTable
            sales={sampleSales}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
};