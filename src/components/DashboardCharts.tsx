import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { Sale } from '../models/sales';

const CustomLegend = (props: any) => {
  const { payload } = props;
  return (
    <div className="flex gap-4 items-center justify-end text-sm text-gray-500 absolute top-[-30px] right-0">
      {payload.map((entry: any, index: number) => (
        <div key={`item-${index}`} className="flex items-center gap-1.5">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs font-medium uppercase text-gray-600">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export const DashboardCharts = ({ data }: { data?: any }) => {
  const revenueData = data?.revenueData || [{ name: 'No Data', value: 0 }];
  const sellingData = data?.sellingData || [];
  const topCustomers = data?.topCustomers || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-5 sm:mb-7">
      {/* Selling Chart */}
      <div
        className="rounded-2xl sm:rounded-3xl p-4 sm:p-6"
        style={{
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.9)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.06)',
        }}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-gray-900 font-bold text-lg">Selling Chart</h3>
            <p className="text-[#8F8F8F] text-xs mt-1">Daily selling rate by customer ($)</p>
          </div>
        </div>

        <div className="h-[250px] w-full relative mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sellingData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorB" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ea580c" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorC" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3977a8" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3977a8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickCount={5} tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Amount']}
              />
              <Legend verticalAlign="top" align="right" content={<CustomLegend />} />
              <Area name={topCustomers[0] || 'A'} type="monotone" dataKey="A" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#colorA)" />
              <Area name={topCustomers[1] || 'B'} type="monotone" dataKey="B" stroke="#ea580c" strokeWidth={2} fillOpacity={1} fill="url(#colorB)" />
              <Area name={topCustomers[2] || 'C'} type="monotone" dataKey="C" stroke="#3977a8" strokeWidth={2} fillOpacity={1} fill="url(#colorC)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue Chart */}
      <div
        className="rounded-2xl sm:rounded-3xl p-4 sm:p-6"
        style={{
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.9)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.06)',
        }}
      >
        <div className="mb-6">
          <h3 className="text-gray-900 font-bold text-lg">Revenue by Customer</h3>
          <p className="text-[#8F8F8F] text-xs mt-1">Daily revenue breakdown ($)</p>
        </div>

        <div className="h-[250px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickCount={5} tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
              <Tooltip
                cursor={{ fill: '#f3f4f6' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
              />
              <Bar dataKey="value" fill="#92487A" radius={[4, 4, 4, 4]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
