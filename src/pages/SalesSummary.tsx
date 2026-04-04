import { useEffect, useMemo, useState } from 'react';
import {
  Users,
  TrendingUp,
  Package,
  DollarSign,
  ChevronRight,
  Calendar,
  ShoppingCart,
  ArrowDown,
  ArrowUp,
  BarChart2,
  Search,
} from 'lucide-react';
import { BackgroundIcons } from '../components/BackgroundIcons';
import { getSummaryDetails } from '../services/orders/orderService';
import { userService, User } from '../services/users/userService';
import { UserSummaryResponse } from '../models/summary';

function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/* ==================== Main Component ==================== */
export const SalesSummary = () => {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const [selectedMonth, setSelectedMonth] = useState<string>(toMonthKey(nextMonth));
  const [users, setUsers] = useState<User[]>([]);
  const [summary, setSummary] = useState<UserSummaryResponse | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  /* ---- load users on mount ---- */
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const allUsers = await userService.getAllUsers();
        const nonAdmins = allUsers.filter(
          (u) => u.role !== 'ADMIN' && u.role !== 'SUPER USER' && u.role !== 'SUPER_USER',
        );
        setUsers(nonAdmins);
        if (nonAdmins.length > 0) setSelectedUserId(nonAdmins[0].id);
      } catch (err) {
        console.error('SalesSummary load failed:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ---- fetch summary when user or month changes ---- */
  useEffect(() => {
    if (!selectedUserId) {
      setSummary(null);
      return;
    }
    (async () => {
      setDetailsLoading(true);
      try {
        const [, mo] = selectedMonth.split('-');
        const data = await getSummaryDetails(selectedUserId, Number(mo));
        setSummary(data);
      } catch (err) {
        console.error('Fetch summary failed:', err);
        setSummary(null);
      } finally {
        setDetailsLoading(false);
      }
    })();
  }, [selectedUserId, selectedMonth]);

  /* ---- filtered user list ---- */
  const filteredUsers = useMemo(() => {
    return users.filter((u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
    );
  }, [users, search]);

  /* ---- selected user info ---- */
  const selectedUser = useMemo(
    () => filteredUsers.find((u) => u.id === selectedUserId) ?? null,
    [filteredUsers, selectedUserId],
  );

  /* ---- summary items for right panel, sorted ---- */
  const displayedItems = useMemo(() => {
    if (!summary?.summery) return [];
    const sorted = [...summary.summery].sort((a, b) =>
      sortDir === 'desc' ? (b.qty ?? 0) - (a.qty ?? 0) : (a.qty ?? 0) - (b.qty ?? 0),
    );
    return sorted;
  }, [summary, sortDir]);

  /* ---- month label ---- */
  const monthLabel = useMemo(() => {
    const [yr, mo] = selectedMonth.split('-');
    return new Date(Number(yr), Number(mo) - 1, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }, [selectedMonth]);

  /* ==================== RENDER ==================== */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      <BackgroundIcons />

      <div className="relative z-10 p-6 max-w-[1400px] mx-auto">

        {/* ===== Header ===== */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3.5 rounded-2xl shadow-lg shadow-indigo-200">
              <BarChart2 size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Sales Summary</h1>
              <p className="text-gray-500 mt-0.5 text-sm">
                Monthly order breakdown by user — sorted by quantity
              </p>
            </div>
          </div>
        </div>

        {/* ===== Main grid ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">

          {/* ---- LEFT PANEL: User List ---- */}
          <div className="flex flex-col gap-4">

            {/* Month picker */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                <Calendar size={14} />
                Select Month
              </label>
              <input
                type="month"
                value={selectedMonth}
                max={toMonthKey(nextMonth)}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              />
              <p className="mt-2 text-xs text-indigo-600 font-semibold">{monthLabel}</p>
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm transition"
              />
            </div>

            {/* User cards */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-1">
              <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                <h2 className="font-semibold text-gray-700 flex items-center gap-2 text-sm">
                  <Users size={15} className="text-indigo-500" />
                  Users
                </h2>
                <span className="text-xs bg-indigo-50 text-indigo-600 font-semibold px-2 py-0.5 rounded-full">
                  {filteredUsers.length}
                </span>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-14 gap-3">
                  <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
                  <p className="text-sm text-gray-400">Loading users…</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">No users found</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {filteredUsers.map((user) => {
                    const isActive = selectedUserId === user.id;
                    return (
                      <button
                        key={user.id}
                        onClick={() => setSelectedUserId(user.id)}
                        className={`
                          w-full text-left px-4 py-3.5 flex items-center gap-3 transition-all duration-200
                          hover:bg-indigo-50 group
                          ${isActive ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500' : 'border-l-4 border-transparent'}
                        `}
                      >
                        {/* Avatar */}
                        <div
                          className={`
                            w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-all
                            ${isActive
                              ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-200'
                              : 'bg-gray-100 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'}
                          `}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${isActive ? 'text-indigo-700' : 'text-gray-800'}`}>
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>

                        <ChevronRight
                          size={14}
                          className={`transition-transform shrink-0 ${isActive ? 'text-indigo-500 translate-x-0.5' : 'text-gray-300'}`}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ---- RIGHT PANEL: Orders ---- */}
          <div className="flex flex-col gap-4">
            {!selectedUser ? (
              <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center py-24 text-gray-400">
                <ShoppingCart size={48} className="mb-4 opacity-30" />
                <p className="text-lg font-medium">Select a user to view their orders</p>
              </div>
            ) : (
              <>
                {/* User header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 shadow-lg shadow-indigo-200 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white bg-opacity-20 flex items-center justify-center font-bold text-xl">
                        {selectedUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-lg font-bold">{selectedUser.name}</h2>
                        <p className="text-indigo-200 text-sm">{selectedUser.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-indigo-200 text-xs uppercase tracking-wider">Period</p>
                      <p className="font-semibold text-sm mt-0.5">{monthLabel}</p>
                    </div>
                  </div>
                </div>

                {/* Stat cards */}
                {summary && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      {
                        icon: <ShoppingCart size={20} />,
                        label: 'Total Orders',
                        value: summary.totalOrders,
                        bg: 'bg-blue-50',
                        text: 'text-blue-600',
                      },
                      {
                        icon: <Package size={20} />,
                        label: 'Total Items',
                        value: summary.totalItem,
                        bg: 'bg-purple-50',
                        text: 'text-purple-600',
                      },
                      {
                        icon: <TrendingUp size={20} />,
                        label: 'Delivered',
                        value: summary.deleverd,
                        bg: 'bg-emerald-50',
                        text: 'text-emerald-600',
                      },
                      {
                        icon: <DollarSign size={20} />,
                        label: 'Revenue (LKR)',
                        value: (summary.total || 0).toLocaleString('en-LK', { maximumFractionDigits: 2 }),
                        bg: 'bg-amber-50',
                        text: 'text-amber-600',
                      },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
                      >
                        <div className={`inline-flex p-2 rounded-xl ${s.bg} ${s.text} mb-2`}>
                          {s.icon}
                        </div>
                        <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                        <p className={`text-xl font-bold mt-0.5 ${s.text}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Orders table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-1">
                  {/* Table header */}
                  <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                      <Package size={15} className="text-indigo-500" />
                      Orders for {monthLabel}
                      {summary && (
                        <span className="ml-1 text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-semibold">
                          {summary.summery.length}
                        </span>
                      )}
                    </h3>
                    {/* Sort toggle */}
                    <button
                      onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
                      className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition"
                    >
                      Qty
                      {sortDir === 'desc' ? <ArrowDown size={13} /> : <ArrowUp size={13} />}
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    {detailsLoading ? (
                      <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
                        <p className="text-sm text-gray-400">Loading summary data…</p>
                      </div>
                    ) : displayedItems.length === 0 ? (
                      <div className="text-center py-16 text-gray-400">
                        <Package size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-medium">No details found for {monthLabel}</p>
                      </div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            <th className="px-6 py-3 text-left">#</th>
                            <th className="px-6 py-3 text-left">Date</th>
                            <th className="px-6 py-3 text-center">Qty ↕</th>
                            <th className="px-6 py-3 text-right">Commission (LKR)</th>
                            <th className="px-6 py-3 text-right">Total (LKR)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {displayedItems.map((item, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-indigo-50/40 transition-colors"
                            >
                              <td className="px-6 py-3.5 text-gray-400 text-xs">{idx + 1}</td>
                              <td className="px-6 py-3.5 text-gray-500">
                                {item.date
                                  ? new Date(item.date).toLocaleDateString('en-US', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  : '—'}
                              </td>
                              <td className="px-6 py-3.5 text-center">
                                <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-sm">
                                  {item.qty ?? 0}
                                </span>
                              </td>
                              <td className="px-6 py-3.5 text-right text-gray-500 font-medium">
                                {(item.commission ?? 0).toLocaleString('en-LK', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td className="px-6 py-3.5 text-right font-bold text-gray-800">
                                {(item.total ?? 0).toLocaleString('en-LK', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
