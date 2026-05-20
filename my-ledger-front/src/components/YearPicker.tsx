import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface YearPickerProps {
  value: string; // format: YYYY
  onChange: (value: string) => void;
  align?: 'left' | 'right'; // dropdown alignment relative to the trigger
}

const YEARS_PER_PAGE = 12;

export function YearPicker({ value, onChange, align = 'left' }: YearPickerProps) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const selectedYear = Number(value);
  const [pageStart, setPageStart] = useState(() => getPageStart(selectedYear));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPageStart(getPageStart(selectedYear));
  }, [selectedYear]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const years = Array.from({ length: YEARS_PER_PAGE }, (_, index) => pageStart + index);
  const currentYear = new Date().getFullYear();
  const displayText = i18n.language === 'en' ? value : `${value}年`;

  const handleSelect = (year: number) => {
    onChange(String(year));
    setIsOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white transition-colors text-sm font-medium text-[#4a4a46] shadow-sm"
      >
        <span>{displayText}</span>
      </button>

      {isOpen && (
        <div className={`absolute z-50 top-full mt-2 bg-white rounded-2xl shadow-lg border border-[#f0ede6] p-4 w-[280px] ${align === 'right' ? 'right-0' : 'left-0'}`}>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setPageStart(year => year - YEARS_PER_PAGE)}
              className="p-1.5 rounded-lg hover:bg-[#f9f8f5] text-gray-500 hover:text-[#8b9d83] transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="font-serif text-lg font-medium text-[#4a4a46]">
              {pageStart}-{pageStart + YEARS_PER_PAGE - 1}
            </span>
            <button
              onClick={() => setPageStart(year => year + YEARS_PER_PAGE)}
              className="p-1.5 rounded-lg hover:bg-[#f9f8f5] text-gray-500 hover:text-[#8b9d83] transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {years.map(year => {
              const isSelected = selectedYear === year;
              const isCurrent = currentYear === year;

              return (
                <button
                  key={year}
                  onClick={() => handleSelect(year)}
                  className={`py-2.5 text-sm font-medium rounded-xl transition-colors ${
                    isSelected
                      ? 'bg-[#8b9d83] text-white shadow-sm'
                      : isCurrent
                        ? 'bg-[#f0ede6] text-[#8b9d83] font-bold'
                        : 'hover:bg-[#f9f8f5] text-[#4a4a46]'
                  }`}
                >
                  {year}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function getPageStart(year: number) {
  return Math.floor(year / YEARS_PER_PAGE) * YEARS_PER_PAGE;
}
