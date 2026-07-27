import { useEffect, useMemo, useState, useRef } from 'react';
import {
  Users,
  Calendar,
  BarChart2,
  Search,
  ChevronRight,
  ShoppingCart,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Menu,
  X,
} from 'lucide-react';
import { BackgroundIcons } from '../components/BackgroundIcons';
import { userService, User } from '../services/users/userService';
import monthlyReportService from '../services/monthlyReport/monthlyReportService';

interface MonthlyOrderData {
  date: string;
  totalOrders: number;
  totalItems: number;
}

function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function parseMonthKey(key: string) {
  const [yr, mo] = key.split('-');
  return new Date(Number(yr), Number(mo) - 1, 1);
}

/** Sort array of MonthlyOrderData by date ascending */
function sortByDate(data: MonthlyOrderData[]): MonthlyOrderData[] {
  return [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}

export const MonthlyReport = () => {
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const [selectedMonth, setSelectedMonth] = useState<string>(toMonthKey(currentMonth));
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [monthlyData, setMonthlyData] = useState<MonthlyOrderData[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [sortBy, setSortBy] = useState<'qty' | 'date'>('date');
  const [dateFilter, setDateFilter] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  /* ---- Load users on mount ---- */
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
        console.error('MonthlyReport load failed:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ---- Fetch monthly data when user or month changes ---- */
  useEffect(() => {
    if (!selectedUserId) {
      setMonthlyData([]);
      return;
    }
    (async () => {
      setDataLoading(true);
      try {
        const [yr, mo] = selectedMonth.split('-');
        const data = await monthlyReportService.getMonthlyOrderCount(
          selectedUserId,
          Number(yr),
          Number(mo),
        );
        setMonthlyData(data);
      } catch (err) {
        console.error('Fetch monthly data failed:', err);
        setMonthlyData([]);
      } finally {
        setDataLoading(false);
      }
    })();
  }, [selectedUserId, selectedMonth]);

  /* ---- Close sidebar when clicking outside (mobile) ---- */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setSidebarOpen(false);
      }
    };
    if (sidebarOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [sidebarOpen]);

  /* ---- Filtered user list ---- */
  const filteredUsers = useMemo(
    () =>
      users.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()),
      ),
    [users, search],
  );

  /* ---- Selected user info ---- */
  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId) ?? null,
    [users, selectedUserId],
  );

  /* ---- Month label ---- */
  const monthLabel = useMemo(() => {
    const date = parseMonthKey(selectedMonth);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  /* ---- Summary stats ---- */
  const stats = useMemo(() => {
    const totalOrders = monthlyData.reduce((sum, d) => sum + d.totalOrders, 0);
    const totalItems = monthlyData.reduce((sum, d) => sum + d.totalItems, 0);
    const avgOrdersPerDay =
      monthlyData.length > 0 ? (totalOrders / monthlyData.length).toFixed(1) : 0;
    return { totalOrders, totalItems, avgOrdersPerDay };
  }, [monthlyData]);

  /* ---- Chart data: last 14 days, sorted by date asc ---- */
  const chartData = useMemo(() => {
    const sorted = sortByDate(monthlyData);
    return sorted.slice(-14);
  }, [monthlyData]);

  /* ---- Filtered and sorted table data ---- */
  const tableData = useMemo(() => {
    let filtered = monthlyData;
    if (dateFilter) {
      filtered = filtered.filter((d) => d.date.includes(dateFilter));
    }
    if (sortBy === 'qty') {
      return [...filtered].sort((a, b) =>
        sortDir === 'desc' ? b.totalOrders - a.totalOrders : a.totalOrders - b.totalOrders
      );
    } else {
      return [...filtered].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortDir === 'desc' ? dateB - dateA : dateA - dateB;
      });
    }
  }, [monthlyData, dateFilter, sortDir, sortBy]);

  /* ==================== RENDER ==================== */
  return (
    <div className="min-h-screen relative overflow-hidden">
      <BackgroundIcons />

      <div className="relative z-10 p-4 sm:p-6 max-w-[1400px] mx-auto">

        {/* ===== Header ===== */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Mobile sidebar toggle */}
            <button
              className="lg:hidden p-2 rounded-xl bg-white border border-gray-200 shadow-sm"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open user list"
            >
              <Menu size={20} className="text-gray-600" />
            </button>

            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 sm:p-3.5 rounded-2xl shadow-lg shadow-indigo-200">
              <BarChart2 size={22} className="text-white sm:w-7 sm:h-7" />
            </div>
            <div>
              <h1
                className="text-2xl sm:text-3xl font-bold tracking-tight"
                style={{ color: '#0E626E', letterSpacing: '-0.5px', fontFamily: 'Inter', fontWeight: 'bold' }}
              >
                Monthly Report
              </h1>
              <p className="text-gray-500 mt-0.5 text-xs sm:text-sm">
                Track monthly order counts and user performance
              </p>
            </div>
          </div>
        </div>

        {/* ===== Main grid ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">

          {/* ---- Mobile Overlay Sidebar ---- */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 bg-black/40 lg:hidden">
              <div
                ref={sidebarRef}
                className="absolute left-0 top-0 h-full w-[320px] bg-gray-50 shadow-2xl flex flex-col p-4 gap-4 overflow-y-auto"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-gray-700">Select User</h2>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-gray-200 transition"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Month picker (mobile) */}
                <div className="bg-[#0c968a] rounded-2xl p-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-white uppercase tracking-wider mb-2">
                    <Calendar size={14} />
                    Select Month
                  </label>
                  <input
                    type="month"
                    value={selectedMonth}
                    max={toMonthKey(nextMonth)}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                    style={{ background: 'rgba(255,255,255,0.36)' }}
                  />
                  <p className="mt-2 text-xs text-indigo-200 font-semibold">{monthLabel}</p>
                </div>

                {/* Search (mobile) */}
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
                    style={{ background: 'rgba(255,255,255,0.9)' }}
                  />
                </div>

                {/* User cards (mobile) */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-1">
                  <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-700 flex items-center gap-2 text-sm">
                      <Users size={15} className="text-indigo-500" /> Users
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
                            onClick={() => {
                              setSelectedUserId(user.id);
                              setSidebarOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3.5 flex items-center gap-3 transition-all duration-200 hover:bg-indigo-50 group
                              ${isActive ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500' : 'border-l-4 border-transparent'}`}
                          >
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-all
                                ${isActive ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-200' : 'bg-gray-100 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}
                            >
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold truncate ${isActive ? 'text-indigo-700' : 'text-gray-800'}`}>
                                {user.name}
                              </p>
                              <p className="text-xs text-gray-400 truncate">{user.email}</p>
                            </div>
                            <ChevronRight size={14} className={`transition-transform shrink-0 ${isActive ? 'text-indigo-500 translate-x-0.5' : 'text-gray-300'}`} />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ---- LEFT PANEL: User List (desktop only) ---- */}
          <div className="hidden lg:flex flex-col gap-4">

            {/* Month picker */}
            <div className="bg-[#0c968a] rounded-2xl shadow-sm border border-gray-100 p-4">
              <label className="flex items-center gap-2 text-xs font-semibold text-white uppercase tracking-wider mb-2">
                <Calendar size={14} />
                Select Month
              </label>
              <input
                type="month"
                value={selectedMonth}
                max={toMonthKey(nextMonth)}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                style={{ background: 'rgba(255,255,255,0.36)' }}
              />
              <p className="mt-2 text-xs text-indigo-200 font-semibold">{monthLabel}</p>
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm transition"
                style={{ background: 'rgba(255,255,255,0.77)' }}
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
                <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                  {filteredUsers.map((user) => {
                    const isActive = selectedUserId === user.id;
                    return (
                      <button
                        key={user.id}
                        onClick={() => setSelectedUserId(user.id)}
                        className={`w-full text-left px-4 py-3.5 flex items-center gap-3 transition-all duration-200 hover:bg-indigo-50 group
                          ${isActive ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500' : 'border-l-4 border-transparent'}`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-all
                            ${isActive ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-200' : 'bg-gray-100 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </div>
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

          {/* ---- RIGHT PANEL: Charts and Table ---- */}
          <div className="flex flex-col gap-4">
            {!selectedUser ? (
              <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center py-24 text-gray-400">
                <ShoppingCart size={48} className="mb-4 opacity-30" />
                <p className="text-base sm:text-lg font-medium text-center px-4">
                  Select a user to view their monthly report
                </p>
              </div>
            ) : (
              <>
                {/* User header */}
                <div className="bg-[#0c968a] rounded-2xl p-4 sm:p-5 shadow-lg shadow-indigo-200 text-white">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white bg-opacity-20 flex items-center justify-center font-bold text-lg sm:text-xl shrink-0">
                        {selectedUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-base sm:text-lg font-bold truncate">{selectedUser.name}</h2>
                        <p className="text-indigo-200 text-xs sm:text-sm truncate">{selectedUser.email}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-indigo-200 text-xs uppercase tracking-wider">Period</p>
                      <p className="font-semibold text-xs sm:text-sm mt-0.5">{monthLabel}</p>
                    </div>
                  </div>
                </div>

                {/* Stat cards */}
                {dataLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-pulse"
                      >
                        <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
                        <div className="h-4 bg-gray-100 rounded w-1/3" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    {[
                      {
                        icon: <ShoppingCart size={18} />,
                        label: 'Total Orders',
                        value: stats.totalOrders,
                        bg: 'bg-blue-50',
                        text: 'text-blue-600',
                      },
                      {
                        icon: <TrendingUp size={18} />,
                        label: 'Total Items',
                        value: stats.totalItems,
                        bg: 'bg-purple-50',
                        text: 'text-purple-600',
                      },
                      {
                        icon: <BarChart2 size={18} />,
                        label: 'Avg Orders/Day',
                        value: stats.avgOrdersPerDay,
                        bg: 'bg-emerald-50',
                        text: 'text-emerald-600',
                      },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4 hover:shadow-md transition-shadow"
                      >
                        <div className={`inline-flex p-2 rounded-xl ${s.bg} ${s.text} mb-2`}>
                          {s.icon}
                        </div>
                        <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                        <p className={`text-lg sm:text-xl font-bold mt-0.5 ${s.text}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* ---- Chart: Item Count Trend (last 14 days) ---- */}
                {dataLoading ? (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-72 sm:h-80 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
                      <p className="text-sm text-gray-400">Loading chart…</p>
                    </div>
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-72 sm:h-80 flex items-center justify-center text-gray-400">
                    <p>No data available for this period</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                      <BarChart2 size={16} className="text-indigo-500" />
                      Item Count Trend
                      <span className="ml-1 text-xs font-normal text-gray-400">(Last 14 days)</span>
                    </h3>

                    {/* ---- DESKTOP chart: vertical bars ---- */}
                    <div className="hidden sm:block h-72 sm:h-80">
                      <div className="h-full flex items-stretch justify-between gap-1 px-1">
                        {(() => {
                          const maxCount = Math.max(...chartData.map((d) => d.totalItems), 1);
                          return chartData.map((item, idx) => {
                            const heightPercent = (item.totalItems / maxCount) * 100;
                            const dateObj = new Date(item.date);
                            const dateStr = dateObj.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            });
                            return (
                              <div
                                key={idx}
                                className="flex-1 h-full flex flex-col items-center justify-end group"
                                title={`${item.date}: ${item.totalItems} items`}
                              >
                                <div className="relative w-full flex-1 flex flex-col justify-end">
                                  <div
                                    className="w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-lg transition-all duration-500 hover:from-purple-600 hover:to-purple-500 cursor-pointer shadow-sm"
                                    style={{
                                      height: `${heightPercent}%`,
                                      minHeight: heightPercent > 0 ? '3px' : '0',
                                    }}
                                  >
                                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                      {item.totalItems}
                                    </div>
                                  </div>
                                </div>
                                <p className="text-[10px] text-gray-500 text-center truncate w-full mt-1 shrink-0">
                                  {dateStr}
                                </p>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* ---- MOBILE chart: horizontal bars (rotated 90°) ---- */}
                    <div className="block sm:hidden overflow-x-auto">
                      <div className="flex flex-col gap-2 min-w-0">
                        {(() => {
                          const maxCount = Math.max(...chartData.map((d) => d.totalItems), 1);
                          return chartData.map((item, idx) => {
                            const widthPercent = (item.totalItems / maxCount) * 100;
                            const dateObj = new Date(item.date);
                            const dateStr = dateObj.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            });
                            return (
                              <div key={idx} className="flex items-center gap-2">
                                {/* Date label */}
                                <span className="text-[10px] text-gray-500 w-14 shrink-0 text-right">
                                  {dateStr}
                                </span>
                                {/* Bar */}
                                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden relative">
                                  <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-500"
                                    style={{
                                      width: `${widthPercent}%`,
                                      minWidth: widthPercent > 0 ? '4px' : '0',
                                    }}
                                  />
                                </div>
                                {/* Value */}
                                <span className="text-xs font-semibold text-purple-600 w-8 shrink-0">
                                  {item.totalItems}
                                </span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* ---- Table ---- */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h3 className="text-sm font-bold text-gray-900">Monthly Order Breakdown</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (sortBy === 'date') setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
                          else { setSortBy('date'); setSortDir('desc'); }
                        }}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                          sortBy === 'date'
                            ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                            : 'text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        Date
                        {sortBy === 'date' && (
                          sortDir === 'desc' ? <ArrowDown size={13} /> : <ArrowUp size={13} />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          if (sortBy === 'qty') setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
                          else { setSortBy('qty'); setSortDir('desc'); }
                        }}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                          sortBy === 'qty'
                            ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                            : 'text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        Qty
                        {sortBy === 'qty' && (
                          sortDir === 'desc' ? <ArrowDown size={13} /> : <ArrowUp size={13} />
                        )}
                      </button>
                      
                      <div className="flex items-center gap-2 ml-1 sm:ml-2 border-l border-gray-200 pl-2 sm:pl-3">
                        <input
                          type="date"
                          value={dateFilter}
                          onChange={(e) => setDateFilter(e.target.value)}
                          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 w-full sm:w-auto"
                          placeholder="Filter by date"
                        />
                        {dateFilter && (
                          <button
                            onClick={() => setDateFilter('')}
                            className="text-xs text-gray-400 hover:text-gray-600 transition px-2 py-1.5 border border-gray-200 rounded-lg"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {dataLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
                        <p className="text-sm text-gray-400">Loading table…</p>
                      </div>
                    </div>
                  ) : tableData.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 text-sm">
                      No data found for the selected date
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50">
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              <button
                                onClick={() => setSortDir(sortDir === 'desc' ? 'asc' : 'desc')}
                                className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                              >
                                Total Orders
                                {sortDir === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                              </button>
                            </th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Total Items
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {tableData.map((item, idx) => (
                            <tr key={idx} className="hover:bg-indigo-50 transition-colors">
                              <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                                {new Date(item.date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </td>
                              <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm">
                                <span className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold bg-indigo-100 text-indigo-700">
                                  {item.totalOrders}
                                </span>
                              </td>
                              <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium text-gray-900">
                                {item.totalItems}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};