import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MonthPickerProps {
  value: string; // format: YYYY-MM
  onChange: (value: string) => void;
  align?: 'left' | 'right'; // dropdown alignment relative to the trigger
}

const MONTHS_ZH = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function MonthPicker({ value, onChange, align = 'left' }: MonthPickerProps) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [year, setYear] = useState(() => {
    const [y] = value.split('-');
    return Number(y);
  });
  const ref = useRef<HTMLDivElement>(null);

  const [selectedYear, selectedMonth] = value.split('-');
  const months = i18n.language === 'en' ? MONTHS_EN : MONTHS_ZH;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (month: number) => {
    const newMonth = String(month).padStart(2, '0');
    onChange(`${year}-${newMonth}`);
    setIsOpen(false);
  };

  const displayText = i18n.language === 'en'
    ? `${MONTHS_EN[Number(selectedMonth) - 1]} ${selectedYear}`
    : `${selectedYear}年${Number(selectedMonth)}月`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white transition-colors text-sm font-medium text-[#4a4a46] shadow-sm"
      >
        <span>{displayText}</span>
      </button>

      {isOpen && (
        <div className={`absolute z-50 top-full mt-2 bg-white rounded-2xl shadow-lg border border-[#f0ede6] p-4 w-[320px] ${align === 'right' ? 'right-0' : 'left-0'}`}>
          {/* Year Selector */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setYear(y => y - 1)}
              className="p-1.5 rounded-lg hover:bg-[#f9f8f5] text-gray-500 hover:text-[#8b9d83] transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="font-serif text-lg font-medium text-[#4a4a46]">{year}</span>
            <button
              onClick={() => setYear(y => y + 1)}
              className="p-1.5 rounded-lg hover:bg-[#f9f8f5] text-gray-500 hover:text-[#8b9d83] transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Months Grid */}
          <div className="grid grid-cols-4 gap-2">
            {months.map((month, index) => {
              const monthNum = index + 1;
              const isSelected = Number(selectedYear) === year && Number(selectedMonth) === monthNum;
              const isCurrent = new Date().getFullYear() === year && new Date().getMonth() + 1 === monthNum;

              return (
                <button
                  key={month}
                  onClick={() => handleSelect(monthNum)}
                  className={`py-2.5 text-sm font-medium rounded-xl transition-colors ${
                    isSelected
                      ? 'bg-[#8b9d83] text-white shadow-sm'
                      : isCurrent
                        ? 'bg-[#f0ede6] text-[#8b9d83] font-bold'
                        : 'hover:bg-[#f9f8f5] text-[#4a4a46]'
                  }`}
                >
                  {month}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
