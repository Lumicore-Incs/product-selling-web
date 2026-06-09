import { FileBarChart2, ShoppingBag, CalendarDays, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BackgroundIcons } from '../components/BackgroundIcons';

export const Reports = () => {
  const navigate = useNavigate();

  const reportCards = [
    {
      icon: FileBarChart2,
      title: 'Monthly Report',
      description: 'Track monthly order counts and user performance metrics.',
      color: 'from-violet-500 to-violet-600',
      bg: 'from-violet-50 to-violet-100',
      border: 'border-violet-200',
      textColor: 'text-violet-600',
      route: '/monthly-report',
    },
    {
      icon: CalendarDays,
      title: 'Daily Report',
      description: 'View daily product counts and sales breakdown by date.',
      color: 'from-blue-500 to-blue-600',
      bg: 'from-blue-50 to-blue-100',
      border: 'border-blue-200',
      textColor: 'text-blue-600',
      route: '/daily-report',
    },
    {
      icon: ShoppingBag,
      title: 'My Orders',
      description: 'Track your submitted orders and their current status.',
      color: 'from-green-500 to-green-600',
      bg: 'from-green-50 to-green-100',
      border: 'border-green-200',
      textColor: 'text-green-600',
      route: '/user-orders',
    },
    {
      icon: TrendingUp,
      title: 'Sales Summary',
      description: 'Get an overview of sales and product movement trends.',
      color: 'from-purple-500 to-purple-600',
      bg: 'from-purple-50 to-purple-100',
      border: 'border-purple-200',
      textColor: 'text-purple-600',
      route: '/sales-summary',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <BackgroundIcons />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-3 rounded-xl shadow-lg">
              <FileBarChart2 size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Reports</h1>
              <p className="text-gray-500 mt-1 text-sm">
                Access all available reports and order summaries below.
              </p>
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.title}
                onClick={() => navigate(card.route)}
                className={`
                  group relative bg-gradient-to-br ${card.bg} border ${card.border}
                  rounded-2xl p-6 text-left shadow-sm hover:shadow-xl
                  transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02]
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400
                `}
              >
                <div
                  className={`inline-flex items-center justify-center bg-gradient-to-br ${card.color} p-3 rounded-xl shadow-md mb-4`}
                >
                  <Icon size={24} className="text-white" />
                </div>
                <h2 className={`text-lg font-bold ${card.textColor} mb-2`}>{card.title}</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{card.description}</p>
                <div
                  className={`mt-4 text-xs font-semibold ${card.textColor} flex items-center gap-1 group-hover:gap-2 transition-all`}
                >
                  View Report <span className="text-base">→</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
