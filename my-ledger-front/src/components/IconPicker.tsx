import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ICON_OPTIONS, ICON_COMPONENTS } from '../icons';
import { ChevronDown } from 'lucide-react';

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const SelectedIcon = ICON_COMPONENTS[value];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 text-xs bg-[#f9f8f5] rounded-lg px-2 py-2 outline-none hover:bg-[#f0ede6] transition-colors"
      >
        <div className="flex items-center gap-2">
          {SelectedIcon && <SelectedIcon size={16} />}
          <span>{ICON_OPTIONS.find(o => o.key === value)?.label || t('iconPicker.selectIcon')}</span>
        </div>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-1 bg-white rounded-xl shadow-lg border border-[#f0ede6] p-2 w-[280px] max-h-[300px] overflow-y-auto">
          <div className="grid grid-cols-5 gap-1">
            {ICON_OPTIONS.map(option => {
              const Icon = option.icon;
              const isSelected = option.key === value;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => {
                    onChange(option.key);
                    setIsOpen(false);
                  }}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-[#8b9d83] text-white'
                      : 'hover:bg-[#f9f8f5] text-gray-600'
                  }`}
                  title={option.label}
                >
                  <Icon size={18} />
                  <span className="text-[9px] truncate w-full text-center">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
