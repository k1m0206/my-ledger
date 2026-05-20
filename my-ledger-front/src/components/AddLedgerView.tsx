import { useState, useEffect, FormEvent } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../api';
import { CategoryConfig, LedgerType } from '../types';
import { getCategoryIcon } from '../icons';
import { useToast } from '../toast';

interface AddLedgerViewProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function AddLedgerView({ onBack, onSuccess }: AddLedgerViewProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [type, setType] = useState<LedgerType>('expense');
  const [amount, setAmount] = useState('');
  const [categories, setCategories] = useState<CategoryConfig>({ income: [], expense: [] });
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  });
  const [time, setTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  });
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getCategoryConfig().then(data => {
      setCategories(data);
      if (data.expense.length > 0) setCategory(data.expense[0].name);
    }).catch(() => showToast(t('addLedger.categoryLoadFailed'), 'error'));
  }, []);

  const currentCategories = type === 'income' ? categories.income : categories.expense;
  const amountColorClass = type === 'income' ? 'text-[#c05656]' : 'text-[#4d7c6b]';

  const handleTypeChange = (newType: LedgerType) => {
    setType(newType);
    const cats = newType === 'income' ? categories.income : categories.expense;
    if (cats.length > 0) setCategory(cats[0].name);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) {
      showToast(t('addLedger.invalidAmount'), 'error');
      return;
    }
    if (!category) {
      showToast(t('addLedger.selectCategory'), 'error');
      return;
    }

    setSubmitting(true);
    try {
      const dateTime = `${date}T${time}:00`;
      await api.addLedger({
        amount: Number(amount),
        type,
        category,
        date: dateTime,
        note: note.trim() || null
      });
      showToast(t('addLedger.saveSuccess'), 'success');
      onSuccess();
    } catch (e) {
      showToast(t('addLedger.saveFailed'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#fdfcfb] z-30 absolute inset-0 text-[#4a4a46] items-center">
      <div className="w-full lg:max-w-[450px] lg:border-l lg:border-r border-[#e5e5e5] h-full flex flex-col bg-[#fdfcfb]">
        {/* Header */}
        <div className="bg-[#fdfcfb] px-6 py-6 flex items-center border-b border-[#f0ede6]">
          <button onClick={onBack} className="p-2 -ml-2 text-[#8b9d83] hover:bg-[#f0ede6] rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-serif font-medium flex-1 text-center pr-8">{t('addLedger.title')}</h1>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto w-full px-6">
          <form onSubmit={handleSubmit} className="py-4 space-y-6">

            {/* Type Toggle */}
            <div className="flex bg-[#f9f8f5] p-1 rounded-xl">
              <button
                type="button"
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${type === 'expense' ? 'bg-white shadow-sm text-[#4d7c6b]' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => handleTypeChange('expense')}
              >
                {t('common.expense')}
              </button>
              <button
                type="button"
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${type === 'income' ? 'bg-white shadow-sm text-[#c05656]' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => handleTypeChange('income')}
              >
                {t('common.income')}
              </button>
            </div>

            {/* Amount input */}
            <div className="bg-[#f9f8f5] p-5 rounded-2xl">
              <label className="block text-xs font-bold uppercase tracking-tighter text-[#8b9d83] mb-2">{t('addLedger.amount')}</label>
              <div className={`flex items-center text-4xl font-serif ${amountColorClass}`}>
                <span className="mr-2 font-sans text-3xl opacity-60">¥</span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  onWheel={e => {
                    e.preventDefault();
                    const delta = e.deltaY > 0 ? -1 : 1;
                    const current = parseFloat(amount) || 0;
                    setAmount(Math.max(0, current + delta).toString());
                  }}
                  placeholder="0.00"
                  className="w-full outline-none bg-transparent placeholder-gray-300"
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* Details */}
            <div className="bg-[#f9f8f5] p-5 rounded-2xl space-y-5">

              <div>
                 <label className="block text-xs font-bold uppercase tracking-tighter text-[#8b9d83] mb-3">{t('addLedger.category')}</label>
                 <div className="grid grid-cols-5 gap-2">
                   {currentCategories.map(cat => {
                     const IconComponent = getCategoryIcon(cat.name, cat.icon);
                     return (
                       <button
                         key={cat.name}
                         type="button"
                         onClick={() => setCategory(cat.name)}
                         className={`py-2 px-1 text-xs rounded-xl transition-colors font-medium border flex flex-col items-center gap-1 ${
                           category === cat.name
                            ? 'bg-[#8b9d83] border-[#8b9d83] text-white'
                            : 'bg-white border-transparent text-[#4a4a46] shadow-sm hover:border-[#8b9d83]/30'
                         }`}
                       >
                         <IconComponent size={18} />
                         <span className="truncate w-full text-center leading-tight">{t(`categories.${cat.name}`, cat.name)}</span>
                       </button>
                     );
                   })}
                 </div>
              </div>

              <div className="pt-3 border-t border-[#f0ede6]">
                <label className="block text-xs font-bold uppercase tracking-tighter text-[#8b9d83] mb-2">{t('addLedger.dateTime')}</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="flex-1 text-sm outline-none px-3 py-2 bg-white rounded-lg border border-transparent focus:border-[#8b9d83]/50 transition-colors shadow-sm"
                    required
                  />
                  <input
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-28 text-sm outline-none px-3 py-2 bg-white rounded-lg border border-transparent focus:border-[#8b9d83]/50 transition-colors shadow-sm"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#f0ede6]">
                <label className="block text-xs font-bold uppercase tracking-tighter text-[#8b9d83] mb-2">{t('addLedger.noteOptional')}</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder={t('addLedger.notePlaceholder')}
                  rows={2}
                  maxLength={500}
                  className="w-full text-sm outline-none px-3 py-2 bg-white rounded-lg border border-transparent focus:border-[#8b9d83]/50 transition-colors resize-none shadow-sm"
                />
              </div>

            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#8b9d83] hover:bg-[#788871] active:scale-95 transition-all text-white py-4 rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-[#8b9d83]/20 flex items-center justify-center gap-2 mt-4"
            >
              {submitting ? t('common.saving') : (
                <>
                  <Check size={18} strokeWidth={2.5} /> {t('common.save')}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
