import { useEffect, useState } from 'react';
import { Plus, Calendar, List, PieChart, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../api';
import { CategoryConfig, LedgerItem, LedgerSummary } from '../types';
import { Charts } from './Charts';
import { getCategoryIcon } from '../icons';
import { LedgerDetailView } from './LedgerDetailView';
import { MonthPicker } from './MonthPicker';
import { YearPicker } from './YearPicker';
import { useToast } from '../toast';

interface HomeViewProps {
  onAddClick: () => void;
  onSettingsClick: () => void;
}

export function HomeView({ onAddClick, onSettingsClick }: HomeViewProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [ledgers, setLedgers] = useState<LedgerItem[]>([]);
  const [chartLedgers, setChartLedgers] = useState<LedgerItem[]>([]);
  const [summary, setSummary] = useState<LedgerSummary>({ total_income: 0, total_expense: 0, net_income: 0, count: 0 });
  const [categoryConfig, setCategoryConfig] = useState<CategoryConfig>({ income: [], expense: [] });
  const [selectedLedger, setSelectedLedger] = useState<LedgerItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ledger' | 'stats'>('ledger');
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}`;
  });
  const [currentYear, setCurrentYear] = useState(() => {
    return new Date().getFullYear().toString();
  });

  const toLocalISOString = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().replace('Z', '+08:00');
  };

  const getMonthRange = (monthValue: string) => {
    const [yearStr, monthStr] = monthValue.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);

    return {
      startDate: toLocalISOString(new Date(year, month - 1, 1)),
      endDate: toLocalISOString(new Date(year, month, 0, 23, 59, 59, 999))
    };
  };

  const getYearRange = (yearValue: string) => {
    const year = Number(yearValue);

    return {
      startDate: toLocalISOString(new Date(year, 0, 1)),
      endDate: toLocalISOString(new Date(year, 11, 31, 23, 59, 59, 999))
    };
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const detailRange = getMonthRange(currentMonth);
      const chartRange = viewMode === 'month' ? detailRange : getYearRange(currentYear);

      const [lRes, sRes, chartRes] = await Promise.all([
        api.getLedgers({ start_date: detailRange.startDate, end_date: detailRange.endDate }),
        api.getSummary({ start_date: detailRange.startDate, end_date: detailRange.endDate }),
        api.getLedgers({ start_date: chartRange.startDate, end_date: chartRange.endDate })
      ]);
      setLedgers(lRes);
      setSummary(sRes);
      setChartLedgers(chartRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentMonth, currentYear, viewMode]);

  const formatCurrency = (amount: number) =>
    amount.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  };

  const groupLedgersByDate = (items: LedgerItem[]) => {
    const groups: { date: string; items: LedgerItem[] }[] = [];
    let currentDate = '';

    items.forEach(item => {
      const date = formatDate(item.date);
      if (date !== currentDate) {
        currentDate = date;
        groups.push({ date, items: [item] });
      } else {
        groups[groups.length - 1].items.push(item);
      }
    });

    return groups;
  };

  const getCategoryMeta = (ledger: LedgerItem) => {
    const items = ledger.type === 'income' ? categoryConfig.income : categoryConfig.expense;
    return items.find(item => item.name === ledger.category);
  };

  const handleLedgerSaved = (ledger: LedgerItem) => {
    setSelectedLedger(null);
    setLedgers(items => items.map(item => item.id === ledger.id ? ledger : item));
    fetchData();
  };

  const handleLedgerDeleted = (id: number) => {
    setSelectedLedger(null);
    setLedgers(items => items.filter(item => item.id !== id));
    fetchData();
  };

  const renderSummaryCard = () => (
    <div className="px-6 pt-8 pb-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <MonthPicker value={currentMonth} onChange={setCurrentMonth} />
        </div>
      </div>

      <div className="bg-[#8b9d83] rounded-3xl p-6 text-white shadow-lg shadow-[#8b9d83]/20">
        <p className="text-xs opacity-80 uppercase tracking-widest font-medium mb-1">{t('home.balance')}</p>
        <h2 className="text-3xl font-serif mb-4">{formatCurrency(summary.net_income)}</h2>
        <div className="grid grid-cols-2 gap-4 border-t border-white/20 pt-4">
          <div>
            <p className="text-[10px] opacity-70 uppercase tracking-widest">{t('common.income')}</p>
            <p className="text-lg font-medium">+{formatCurrency(summary.total_income).replace('¥', '')}</p>
          </div>
          <div>
            <p className="text-[10px] opacity-70 uppercase tracking-widest">{t('common.expense')}</p>
            <p className="text-lg font-medium">-{formatCurrency(summary.total_expense).replace('¥', '')}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLedgerList = () => {
    const groupedLedgers = groupLedgersByDate(ledgers);

    return (
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="flex justify-between items-center py-4 px-6 sticky top-0 bg-[#fdfcfb]/90 backdrop-blur z-10 border-b border-[#f0ede6]">
          <h2 className="font-serif text-lg">{t('home.recentDetails')}</h2>
          <span className="text-xs text-[#8b9d83] font-bold uppercase tracking-tighter">{t('common.total', { count: summary.count })}</span>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-2 pb-6">
          {loading ? (
            <p className="text-center text-gray-400 mt-10 text-sm">{t('common.loading')}</p>
          ) : ledgers.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-gray-400 mt-20">
               <Calendar size={48} className="mb-4 opacity-30 text-[#8b9d83]" />
               <p className="text-sm">{t('home.noRecords')}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedLedgers.map(group => (
                <div key={group.date}>
                  <div className="sticky top-0 bg-[#fdfcfb]/90 backdrop-blur py-2 mb-2">
                    <span className="text-xs font-bold text-[#8b9d83] uppercase tracking-wider">{group.date}</span>
                  </div>
                  <div className="space-y-3">
                    {group.items.map(l => {
                      const categoryMeta = getCategoryMeta(l);
                      const IconComponent = getCategoryIcon(l.category, categoryMeta?.icon);
                      return (
                        <button
                          key={l.id}
                          onClick={() => setSelectedLedger(l)}
                          className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#f9f8f5] hover:shadow-md transition-shadow text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#8b9d83] shadow-sm">
                              <IconComponent size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{t(`categories.${l.category}`, l.category)}</p>
                              <p className="text-[10px] text-gray-400">{formatTime(l.date)} {l.note && `• ${l.note}`}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-bold ${l.type === 'income' ? 'text-[#c05656]' : 'text-[#4d7c6b]'}`}>
                              {l.type === 'income' ? '+' : '-'}{formatCurrency(l.amount).replace('¥', '')}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStats = () => (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      <div className="py-4 px-6 sticky top-0 bg-[#fdfcfb]/90 backdrop-blur z-10 border-b border-[#f0ede6]">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg">{t('home.analysisCharts')}</h2>
          <div className="flex items-center gap-2 relative">
            <div className="flex bg-[#f9f8f5] p-0.5 rounded-lg">
              <button
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === 'month' ? 'bg-white shadow-sm text-[#8b9d83]' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setViewMode('month')}
              >
                {t('home.byMonth')}
              </button>
              <button
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === 'year' ? 'bg-white shadow-sm text-[#8b9d83]' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setViewMode('year')}
              >
                {t('home.byYear')}
              </button>
            </div>
            {viewMode === 'month' ? (
              <MonthPicker value={currentMonth} onChange={setCurrentMonth} align="right" />
            ) : (
              <YearPicker value={currentYear} onChange={setCurrentYear} align="right" />
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {!loading ? (
          <Charts
            ledgers={chartLedgers}
            viewMode={viewMode}
            currentMonth={currentMonth}
            currentYear={currentYear}
          />
        ) : (
          <p className="text-center text-gray-400 mt-10 text-sm">{t('common.loading')}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full bg-[#fdfcfb] text-[#4a4a46] relative">

      {/* Desktop Layout */}
       <div className="hidden lg:flex flex-row h-full w-full">
         {/* Left Sidebar */}
         <div className="w-[320px] border-r border-[#e5e5e5] h-full flex flex-col bg-white">
            {renderSummaryCard()}

            <div className="px-6 mt-4 space-y-3">
               <button onClick={() => setActiveTab('ledger')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-colors ${activeTab === 'ledger' ? 'bg-[#8b9d83] text-white shadow-md shadow-[#8b9d83]/20' : 'hover:bg-[#f9f8f5] text-[#4a4a46]'}`}>
                 <List size={22} />
                 <span className="font-bold tracking-widest text-sm uppercase">{t('common.details')}</span>
               </button>
               <button onClick={() => setActiveTab('stats')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-colors ${activeTab === 'stats' ? 'bg-[#8b9d83] text-white shadow-md shadow-[#8b9d83]/20' : 'hover:bg-[#f9f8f5] text-[#4a4a46]'}`}>
                 <PieChart size={22} />
                 <span className="font-bold tracking-widest text-sm uppercase">{t('common.statistics')}</span>
               </button>
               <button onClick={onSettingsClick} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-colors hover:bg-[#f9f8f5] text-[#4a4a46]">
                 <Settings size={22} />
                 <span className="font-bold tracking-widest text-sm uppercase">{t('common.settings')}</span>
               </button>
            </div>

            <div className="mt-auto p-6">
              <button onClick={onAddClick} className="w-full bg-[#8b9d83] hover:bg-[#788871] text-white py-4 rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-[#8b9d83]/20 flex items-center justify-center gap-2 transition-transform active:scale-95">
                <Plus size={22} strokeWidth={2.5} /> {t('common.addEntry')}
              </button>
            </div>
         </div>

         {/* Right Content */}
         <div className="flex-1 h-full flex flex-col bg-[#fdfcfb] overflow-hidden">
            {activeTab === 'ledger' ? renderLedgerList() : renderStats()}
         </div>
      </div>

      {/* Mobile Layout */}
      <div className="flex lg:hidden flex-col h-full w-full">
         <div className="flex-1 overflow-hidden flex flex-col pb-[80px]">
            {activeTab === 'ledger' ? (
               <>
                 <div className="flex-none">
                    {renderSummaryCard()}
                 </div>
                 {renderLedgerList()}
               </>
            ) : (
               <>
                 <div className="flex-none">
                    {renderSummaryCard()}
                 </div>
                 {renderStats()}
               </>
            )}
         </div>

         {/* Bottom Navigation */}
         <div className="absolute bottom-0 w-full h-20 bg-white border-t border-[#f0ede6] flex items-center justify-around px-4 z-10 shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
           <button onClick={() => setActiveTab('ledger')} className={`p-3 flex flex-col items-center transition-colors ${activeTab === 'ledger' ? 'text-[#8b9d83]' : 'text-gray-300'}`}>
             <List size={26} strokeWidth={activeTab === 'ledger' ? 2.5 : 2} />
             <span className="text-[10px] mt-1 font-bold tracking-widest uppercase">{t('common.details')}</span>
           </button>

           <div className="w-16 flex-shrink-0"></div>

           <button onClick={() => setActiveTab('stats')} className={`p-3 flex flex-col items-center transition-colors ${activeTab === 'stats' ? 'text-[#8b9d83]' : 'text-gray-300'}`}>
             <PieChart size={26} strokeWidth={activeTab === 'stats' ? 2.5 : 2} />
             <span className="text-[10px] mt-1 font-bold tracking-widest uppercase">{t('common.statistics')}</span>
           </button>

           <div className="absolute top-[-32px] left-1/2 transform -translate-x-1/2">
             <button
                onClick={onAddClick}
                className="w-16 h-16 rounded-full bg-[#8b9d83] border-[6px] border-[#fdfcfb] text-white flex items-center justify-center shadow-lg transform active:scale-95 transition-transform hover:bg-[#788871] box-content"
             >
                <Plus size={32} strokeWidth={2.5} />
             </button>
           </div>
         </div>

         {/* Settings button - mobile */}
         <div className="absolute top-4 right-4 z-20">
           <button onClick={onSettingsClick} className="p-2 rounded-full bg-white/80 backdrop-blur hover:bg-white transition-colors text-gray-400 hover:text-[#8b9d83]">
             <Settings size={20} />
           </button>
         </div>
      </div>
      {selectedLedger && (
        <LedgerDetailView
          ledger={selectedLedger}
          categories={categoryConfig}
          onBack={() => setSelectedLedger(null)}
          onSaved={handleLedgerSaved}
          onDeleted={handleLedgerDeleted}
        />
      )}
    </div>
  );
}
