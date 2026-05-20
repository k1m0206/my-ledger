import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, Check, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../api';
import { getCategoryIcon } from '../icons';
import { CategoryConfig, LedgerItem, LedgerType } from '../types';
import { useToast } from '../toast';

interface LedgerDetailViewProps {
  ledger: LedgerItem;
  categories: CategoryConfig;
  onBack: () => void;
  onSaved: (ledger: LedgerItem) => void;
  onDeleted: (id: number) => void;
}

function toDateValue(dateString: string) {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function toTimeValue(dateString: string) {
  const date = new Date(dateString);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function LedgerDetailView({ ledger, categories, onBack, onSaved, onDeleted }: LedgerDetailViewProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [type, setType] = useState<LedgerType>(ledger.type);
  const [amount, setAmount] = useState(String(ledger.amount));
  const [category, setCategory] = useState(ledger.category);
  const [date, setDate] = useState(toDateValue(ledger.date));
  const [time, setTime] = useState(toTimeValue(ledger.date));
  const [note, setNote] = useState(ledger.note || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const currentCategories = type === 'income' ? categories.income : categories.expense;
  const amountColorClass = type === 'income' ? 'text-[#c05656]' : 'text-[#4d7c6b]';

  useEffect(() => {
    if (!currentCategories.some(item => item.name === category) && currentCategories.length > 0) {
      setCategory(currentCategories[0].name);
    }
  }, [currentCategories, category]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!amount || isNaN(Number(amount))) {
      showToast(t('addLedger.invalidAmount'), 'error');
      return;
    }
    if (!category) {
      showToast(t('addLedger.selectCategory'), 'error');
      return;
    }

    setSaving(true);
    try {
      const saved = await api.updateLedger(ledger.id, {
        amount: Number(amount),
        type,
        category,
        date: new Date(`${date}T${time}:00`).toISOString(),
        note: note.trim() || null,
      });
      showToast(t('editLedger.saveSuccess'), 'success');
      onSaved(saved);
    } catch {
      showToast(t('editLedger.saveFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteLedger(ledger.id);
      showToast(t('editLedger.deleteSuccess'), 'success');
      onDeleted(ledger.id);
    } catch {
      showToast(t('editLedger.deleteFailed'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center bg-[#fdfcfb] text-[#4a4a46]">
      <div className="flex h-full w-full flex-col bg-[#fdfcfb] lg:max-w-[450px] lg:border-x lg:border-[#e5e5e5]">
        <div className="flex items-center border-b border-[#f0ede6] px-6 py-6">
          <button onClick={onBack} className="p-2 -ml-2 text-[#8b9d83] hover:bg-[#f0ede6] rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-serif font-medium flex-1 text-center">{t('editLedger.title')}</h1>
          <button onClick={onBack} className="p-2 text-gray-300 hover:text-gray-500 hover:bg-[#f0ede6] rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          <form onSubmit={handleSubmit} className="py-4 space-y-6">
            <div className="flex bg-[#f9f8f5] p-1 rounded-xl">
              <button
                type="button"
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${type === 'expense' ? 'bg-white shadow-sm text-[#4d7c6b]' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setType('expense')}
              >
                {t('common.expense')}
              </button>
              <button
                type="button"
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${type === 'income' ? 'bg-white shadow-sm text-[#c05656]' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setType('income')}
              >
                {t('common.income')}
              </button>
            </div>

            <div className="bg-[#f9f8f5] p-5 rounded-2xl">
              <label className="block text-xs font-bold uppercase tracking-tighter text-[#8b9d83] mb-2">{t('addLedger.amount')}</label>
              <div className={`flex items-center text-4xl font-serif ${amountColorClass}`}>
                <span className="mr-2 font-sans text-3xl opacity-60">¥</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={event => setAmount(event.target.value)}
                  className="w-full outline-none bg-transparent placeholder-gray-300"
                  required
                />
              </div>
            </div>

            <div className="bg-[#f9f8f5] p-5 rounded-2xl space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-tighter text-[#8b9d83] mb-3">{t('addLedger.category')}</label>
                <div className="flex flex-wrap gap-2">
                  {currentCategories.map(item => {
                    const IconComponent = getCategoryIcon(item.name, item.icon);
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setCategory(item.name)}
                        className={`px-3 py-1.5 text-sm rounded-full transition-colors font-medium border flex items-center gap-1.5 ${
                          category === item.name
                            ? 'bg-[#8b9d83] border-[#8b9d83] text-white'
                            : 'bg-white border-transparent text-[#4a4a46] shadow-sm hover:border-[#8b9d83]/30'
                        }`}
                      >
                        <IconComponent size={14} />
                        {t(`categories.${item.name}`, item.name)}
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
                    onChange={event => setDate(event.target.value)}
                    className="flex-1 min-w-0 text-sm outline-none px-3 py-2 bg-white rounded-lg border border-transparent focus:border-[#8b9d83]/50 transition-colors shadow-sm"
                    required
                  />
                  <input
                    type="time"
                    value={time}
                    onChange={event => setTime(event.target.value)}
                    className="w-28 text-sm outline-none px-3 py-2 bg-white rounded-lg border border-transparent focus:border-[#8b9d83]/50 transition-colors shadow-sm"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#f0ede6]">
                <label className="block text-xs font-bold uppercase tracking-tighter text-[#8b9d83] mb-2">{t('addLedger.note')}</label>
                <textarea
                  value={note}
                  onChange={event => setNote(event.target.value)}
                  placeholder={t('addLedger.notePlaceholder')}
                  rows={3}
                  maxLength={500}
                  className="w-full text-sm outline-none px-3 py-2 bg-white rounded-lg border border-transparent focus:border-[#8b9d83]/50 transition-colors resize-none shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-3 pb-6">
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#8b9d83] hover:bg-[#788871] disabled:opacity-50 text-white py-4 rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-[#8b9d83]/20 flex items-center justify-center gap-2"
              >
                <Check size={18} strokeWidth={2.5} />
                {saving ? t('common.saving') : t('editLedger.saveChanges')}
              </button>

              {confirmDelete ? (
                <div className="rounded-2xl border border-[#f3d7d7] bg-[#fff7f7] p-4">
                  <p className="text-sm text-[#8a3a3a] mb-3">{t('editLedger.deleteConfirm')}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1 rounded-xl bg-[#c05656] py-3 text-sm font-bold text-white disabled:opacity-50"
                    >
                      {deleting ? t('common.deleting') : t('editLedger.confirmDelete')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="flex-1 rounded-xl bg-white py-3 text-sm font-bold text-gray-500"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="w-full border border-[#f0dada] text-[#c05656] hover:bg-[#fff7f7] py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Trash2 size={16} />
                  {t('editLedger.deleteEntry')}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
