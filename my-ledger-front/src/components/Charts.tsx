import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip as PieTooltip, BarChart, Bar, XAxis, YAxis, Tooltip as BarTooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTranslation } from 'react-i18next';
import { LedgerItem, LedgerType } from '../types';

interface ChartsProps {
  ledgers: LedgerItem[];
  viewMode: 'month' | 'year';
}

export function Charts({ ledgers, viewMode }: ChartsProps) {
  const { t } = useTranslation();
  const [activeType, setActiveType] = useState<LedgerType>('expense');

  const categoryData = useMemo(() => {
    const filtered = ledgers.filter(l => l.type === activeType);
    const categoryMap = new Map<string, number>();
    filtered.forEach(l => {
      categoryMap.set(l.category, (categoryMap.get(l.category) || 0) + l.amount);
    });
    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [ledgers, activeType]);

  const COLORS = ['#8b9d83', '#4d7c6b', '#c05656', '#d9a05b', '#7c6a50', '#a0b09a', '#6b8e7b', '#b8956e'];

  const barData = useMemo(() => {
    if (viewMode === 'month') {
      const valueMap = new Map<string, number>();
      const datesSet = new Set<string>();

      ledgers.filter(l => l.type === activeType).forEach(l => {
        const dateStr = l.date.split('T')[0];
        datesSet.add(dateStr);
        valueMap.set(dateStr, (valueMap.get(dateStr) || 0) + l.amount);
      });

      const sortedDates = Array.from(datesSet).sort();
      return sortedDates.map(date => {
        const dateObj = new Date(date);
        return {
          name: `${dateObj.getMonth() + 1}/${dateObj.getDate()}`,
          value: valueMap.get(date) || 0,
        };
      });
    } else {
      const valueMap = new Map<string, number>();
      const monthsSet = new Set<string>();

      ledgers.filter(l => l.type === activeType).forEach(l => {
        const dateObj = new Date(l.date);
        const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        monthsSet.add(monthKey);
        valueMap.set(monthKey, (valueMap.get(monthKey) || 0) + l.amount);
      });

      const sortedMonths = Array.from(monthsSet).sort();
      return sortedMonths.map(month => {
        const [, monthNum] = month.split('-');
        return {
          name: `${parseInt(monthNum)}${t('charts.monthSuffix')}`,
          value: valueMap.get(month) || 0,
        };
      });
    }
  }, [ledgers, viewMode, activeType, t]);

  const totalAmount = categoryData.reduce((sum, item) => sum + item.value, 0);

  // 计算日均和月均
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const avgDaily = totalAmount / daysInMonth;
  const avgMonthly = totalAmount / (new Date().getMonth() + 1);

  if (ledgers.length === 0) return null;

  const typeLabel = activeType === 'expense' ? t('common.expense') : t('common.income');

  return (
    <div className="px-6 py-4 space-y-6">
      {/* Type Toggle */}
      <div className="flex bg-[#f9f8f5] p-1 rounded-xl">
        <button
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeType === 'expense' ? 'bg-white shadow-sm text-[#4d7c6b]' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveType('expense')}
        >
          {t('common.expense')}
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeType === 'income' ? 'bg-white shadow-sm text-[#c05656]' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveType('income')}
        >
          {t('common.income')}
        </button>
      </div>

      {/* Category Pie Chart */}
      {categoryData.length > 0 && (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#f0ede6]">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-serif text-md text-[#4a4a46]">
              {t('charts.categoryDistribution', { type: typeLabel })}
            </h3>
            <span className="text-xs text-gray-400">
              {t('charts.total', { amount: totalAmount.toFixed(2) })}
            </span>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <PieTooltip
                  formatter={(value: number) => `¥${value.toFixed(2)}`}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Bar Chart */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#f0ede6]">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-serif text-md text-[#4a4a46]">
            {viewMode === 'month'
              ? t('charts.dailyTrend', { type: typeLabel })
              : t('charts.monthlyTrend', { type: typeLabel })}
          </h3>
          <div className="flex gap-4">
            {viewMode === 'month' ? (
              <div className="text-right">
                <p className="text-[10px] text-gray-400">日均</p>
                <p className="text-sm font-bold text-[#4a4a46]">¥{avgDaily.toFixed(0)}</p>
              </div>
            ) : (
              <div className="text-right">
                <p className="text-[10px] text-gray-400">月均</p>
                <p className="text-sm font-bold text-[#4a4a46]">¥{avgMonthly.toFixed(0)}</p>
              </div>
            )}
          </div>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8b9d83' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8b9d83' }} />
              <BarTooltip
                formatter={(value: number) => `¥${value.toFixed(2)}`}
                cursor={{ fill: '#f9f8f5' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Bar
                dataKey="value"
                name={typeLabel}
                fill={activeType === 'expense' ? '#4d7c6b' : '#c05656'}
                radius={[4, 4, 0, 0]}
                barSize={12}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
