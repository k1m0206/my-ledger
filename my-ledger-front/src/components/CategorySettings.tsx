import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowDown, ArrowUp, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../api';
import { getCategoryIcon } from '../icons';
import { CategoryConfig, CategoryItem, LedgerType } from '../types';
import { useToast } from '../toast';
import { IconPicker } from './IconPicker';

const emptyConfig: CategoryConfig = { income: [], expense: [] };

interface CategorySettingsProps {
  onBack: () => void;
}

export function CategorySettings({ onBack }: CategorySettingsProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [categories, setCategories] = useState<CategoryConfig>(emptyConfig);
  const [activeType, setActiveType] = useState<LedgerType>('expense');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getCategoryConfig()
      .then(setCategories)
      .catch(() => showToast(t('categorySettings.loadFailed'), 'error'));
  }, [showToast, t]);

  const currentItems = categories[activeType];

  const updateItems = (items: CategoryItem[]) => {
    setCategories(current => ({ ...current, [activeType]: items }));
  };

  const updateItem = (index: number, patch: Partial<CategoryItem>) => {
    updateItems(currentItems.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= currentItems.length) return;
    const next = [...currentItems];
    [next[index], next[target]] = [next[target], next[index]];
    updateItems(next);
  };

  const addItem = () => {
    updateItems([...currentItems, { name: t('categorySettings.newCategory'), icon: 'circle-dollar-sign' }]);
  };

  const removeItem = (index: number) => {
    updateItems(currentItems.filter((_, itemIndex) => itemIndex !== index));
  };

  const saveCategories = async () => {
    const names = currentItems.map(item => item.name.trim()).filter(Boolean);
    if (names.length !== currentItems.length) {
      showToast(t('categorySettings.nameEmpty'), 'error');
      return;
    }
    if (new Set(names).size !== names.length) {
      showToast(t('categorySettings.nameDuplicate'), 'error');
      return;
    }

    setSaving(true);
    try {
      const normalized: CategoryConfig = {
        income: categories.income.map(item => ({ ...item, name: item.name.trim() })),
        expense: categories.expense.map(item => ({ ...item, name: item.name.trim() })),
      };
      const saved = await api.updateCategoryConfig(normalized);
      setCategories(saved);
      showToast(t('categorySettings.saveSuccess'), 'success');
    } catch {
      showToast(t('categorySettings.saveFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetCategories = async () => {
    setSaving(true);
    try {
      const saved = await api.resetCategoryConfig();
      setCategories(saved);
      showToast(t('categorySettings.resetSuccess'), 'success');
    } catch {
      showToast(t('categorySettings.resetFailed'), 'error');
    } finally {
      setSaving(false);
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
          <h1 className="text-lg font-serif font-medium flex-1 text-center pr-8">{t('categorySettings.title')}</h1>
          <button title={t('categorySettings.restoreDefault')} onClick={resetCategories} className="p-2 text-gray-400 hover:text-[#8b9d83]" disabled={saving}>
            <RotateCcw size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto w-full px-6 py-6">
          <div className="flex bg-[#f9f8f5] p-1 rounded-xl mb-6">
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

          <div className="space-y-2">
            {currentItems.map((item, index) => {
              const Icon = getCategoryIcon(item.name, item.icon);
              return (
                <div key={`${item.name}-${index}`} className="rounded-xl bg-[#f9f8f5] p-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-5 w-10 h-10 rounded-xl bg-white text-[#8b9d83] flex items-center justify-center flex-shrink-0">
                      <Icon size={18} />
                    </div>

                    <div className="min-w-0 flex-1 grid grid-cols-[minmax(0,1fr)_112px] gap-2">
                      <label className="min-w-0">
                        <span className="block text-[10px] font-bold uppercase tracking-tighter text-[#8b9d83] mb-1">{t('categorySettings.name')}</span>
                        <input
                          value={item.name}
                          onChange={event => updateItem(index, { name: event.target.value })}
                          className="w-full min-w-0 text-sm outline-none bg-white rounded-lg px-3 py-2"
                          placeholder={t('categorySettings.categoryName')}
                        />
                      </label>

                      <label>
                        <span className="block text-[10px] font-bold uppercase tracking-tighter text-[#8b9d83] mb-1">{t('categorySettings.icon')}</span>
                        <IconPicker
                          value={item.icon}
                          onChange={icon => updateItem(index, { icon })}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end gap-1 border-t border-[#f0ede6] pt-2">
                    <button title={t('categorySettings.moveUp')} onClick={() => moveItem(index, -1)} disabled={index === 0} className="p-1.5 text-gray-300 hover:text-[#8b9d83] disabled:opacity-30">
                      <ArrowUp size={14} />
                    </button>
                    <button title={t('categorySettings.moveDown')} onClick={() => moveItem(index, 1)} disabled={index === currentItems.length - 1} className="p-1.5 text-gray-300 hover:text-[#8b9d83] disabled:opacity-30">
                      <ArrowDown size={14} />
                    </button>
                    <button title={t('categorySettings.deleteCategory')} onClick={() => removeItem(index)} className="p-1.5 text-gray-300 hover:text-[#c05656]">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <button onClick={addItem} className="rounded-xl bg-[#f9f8f5] py-3 text-sm font-bold text-[#8b9d83] flex items-center justify-center gap-2 hover:bg-[#f0ede6] transition-colors">
              <Plus size={16} />
              {t('categorySettings.add')}
            </button>
            <button onClick={saveCategories} disabled={saving} className="rounded-xl bg-[#8b9d83] py-3 text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-[#788871] transition-colors">
              <Save size={16} />
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
