import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Check } from 'lucide-react';

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (dateStr: string) => void;
  required?: boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempSelectedDate, setTempSelectedDate] = useState<string>(value);

  // View Mode: 'days' | 'months' | 'years'
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');

  // Parse initial selected date or default to current date
  const parsedDate = value ? new Date(value + 'T00:00:00') : new Date();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [viewYear, setViewYear] = useState<number>(parsedDate.getFullYear() || currentYear);
  const [viewMonth, setViewMonth] = useState<number>(parsedDate.getMonth() || currentMonth);

  const yearListRef = useRef<HTMLDivElement>(null);
  const selectedYearRef = useRef<HTMLButtonElement>(null);

  // Keep view in sync when value changes or dialog opens
  useEffect(() => {
    if (value) {
      setTempSelectedDate(value);
      const d = new Date(value + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        setViewYear(Math.min(d.getFullYear(), currentYear));
        setViewMonth(d.getMonth());
      }
    }
  }, [value, isOpen, currentYear]);

  // When switching to 'years' mode, auto-scroll to the selected year
  useEffect(() => {
    if (viewMode === 'years') {
      setTimeout(() => {
        if (selectedYearRef.current) {
          selectedYearRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }, 50);
    }
  }, [viewMode]);

  // Lock body scroll and handle Escape key when modal is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (viewMode !== 'days') {
          setViewMode('days');
        } else {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
      setViewMode('days');
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, viewMode]);

  // Header navigation arrows
  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMode === 'days') {
      if (viewMonth === 0) {
        setViewMonth(11);
        setViewYear(prev => prev - 1);
      } else {
        setViewMonth(prev => prev - 1);
      }
    } else if (viewMode === 'months') {
      // Decrement year when selecting months
      setViewYear(prev => prev - 1);
    } else if (viewMode === 'years') {
      // Scroll or shift years back
      if (yearListRef.current) {
        yearListRef.current.scrollBy({ top: -120, behavior: 'smooth' });
      }
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMode === 'days') {
      if (viewMonth === 11) {
        if (viewYear < currentYear) {
          setViewMonth(0);
          setViewYear(prev => prev + 1);
        }
      } else {
        // Can advance month as long as year is <= currentYear
        if (viewYear < currentYear || viewMonth < 11) {
          setViewMonth(prev => prev + 1);
        }
      }
    } else if (viewMode === 'months') {
      // Increment year up to currentYear
      if (viewYear < currentYear) {
        setViewYear(prev => prev + 1);
      }
    } else if (viewMode === 'years') {
      // Scroll or shift years forward
      if (yearListRef.current) {
        yearListRef.current.scrollBy({ top: 120, behavior: 'smooth' });
      }
    }
  };

  const handleSelectDay = (year: number, month: number, day: number) => {
    const mStr = String(month + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    const formatted = `${year}-${mStr}-${dStr}`;
    setTempSelectedDate(formatted);
  };

  const handleSelectMonth = (monthIndex: number) => {
    setViewMonth(monthIndex);
    setViewMode('days');
  };

  const handleSelectYear = (year: number) => {
    setViewYear(year);
    setViewMode('months'); // Proceed to month selection or directly to days
  };

  const handleApply = () => {
    if (tempSelectedDate) {
      onChange(tempSelectedDate);
    }
    setIsOpen(false);
    setViewMode('days');
  };

  const handleSetToday = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const formatted = `${y}-${m}-${d}`;
    setTempSelectedDate(formatted);
    setViewYear(y);
    setViewMonth(today.getMonth());
    setViewMode('days');
  };

  // Generate calendar days
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const prevMonthDays = [];
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    prevMonthDays.push(daysInPrevMonth - i);
  }

  const currentMonthDays = [];
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    currentMonthDays.push(d);
  }

  const totalRendered = prevMonthDays.length + currentMonthDays.length;
  const nextMonthDaysCount = totalRendered > 35 ? 42 - totalRendered : 35 - totalRendered;
  const nextMonthDays = [];
  for (let d = 1; d <= nextMonthDaysCount; d++) {
    nextMonthDays.push(d);
  }

  const today = new Date();
  const isTodayDate = (d: number) =>
    today.getFullYear() === viewYear &&
    today.getMonth() === viewMonth &&
    today.getDate() === d;

  const isSelectedDate = (d: number) => {
    if (!tempSelectedDate) return false;
    const [selY, selM, selD] = tempSelectedDate.split('-').map(Number);
    return selY === viewYear && selM === viewMonth + 1 && selD === d;
  };

  // Generate Year list strictly up to current year (e.g. 2026 down to 1970)
  const startYear = 1970;
  const availableYears = [];
  for (let y = currentYear; y >= startYear; y--) {
    availableYears.push(y);
  }

  const formattedDisplay = (dateStr: string) => {
    if (!dateStr) return 'Select associated event date...';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      {/* Date Trigger Input Box */}
      <div
        onClick={() => {
          setIsOpen(true);
          setViewMode('days');
        }}
        className="w-full flex items-center justify-between bg-slate-900/90 border border-slate-700/80 hover:border-sky-500/50 rounded-2xl px-4 py-3.5 text-sm cursor-pointer select-none transition-all duration-200 group hover:shadow-lg hover:shadow-sky-500/5"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 group-hover:bg-sky-500/20 flex items-center justify-center text-sky-400 transition-colors">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-slate-100 block tracking-tight text-sm">
              {formattedDisplay(value)}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-sky-500/20 text-slate-300 hover:text-sky-300 border border-slate-700/60 transition-all cursor-pointer"
        >
          Change Date
        </button>
      </div>

      {/* Centered Modal Dialog Box */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => {
            setIsOpen(false);
            setViewMode('days');
          }}
        >
          <div
            className="w-full max-w-sm sm:max-w-md bg-[#0d1322] border border-slate-700/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl shadow-black/90 relative animate-in zoom-in-95 duration-150 space-y-3.5 sm:space-y-4 max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 p-0.5 shadow-md shadow-sky-500/20 shrink-0">
                  <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                    <CalendarIcon className="w-4 h-4 text-sky-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-white">Select Event Date</h3>
                  <p className="text-[10px] text-slate-400">Used to detect old news presented as new</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setViewMode('days');
                }}
                className="w-7 h-7 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Calendar Controls (Month / Year interactive triggers) */}
            <div className="flex items-center justify-between px-1 py-1 shrink-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Clickable Month Trigger */}
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === 'months' ? 'days' : 'months')}
                  className={`px-2.5 py-1 rounded-xl text-sm sm:text-base font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                    viewMode === 'months'
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 ring-1 ring-sky-300'
                      : 'text-white hover:bg-slate-800 hover:text-sky-300'
                  }`}
                  title="Click to select month"
                >
                  <span>{MONTH_NAMES[viewMonth]}</span>
                </button>

                {/* Clickable Year Trigger */}
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === 'years' ? 'days' : 'years')}
                  className={`px-2.5 py-1 rounded-xl text-sm sm:text-base font-bold font-mono transition-all cursor-pointer flex items-center gap-1 ${
                    viewMode === 'years'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 ring-1 ring-indigo-300'
                      : 'text-sky-400 hover:bg-slate-800 hover:text-sky-200'
                  }`}
                  title="Click to select year"
                >
                  <span>{viewYear}</span>
                </button>
              </div>

              {/* Back / Forward Controls (Context-Aware) */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title={
                    viewMode === 'days'
                      ? 'Previous Month'
                      : viewMode === 'months'
                      ? 'Previous Year'
                      : 'Scroll Past Years'
                  }
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={
                    (viewMode === 'months' && viewYear >= currentYear) ||
                    (viewMode === 'days' && viewYear >= currentYear && viewMonth >= 11)
                  }
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  title={
                    viewMode === 'days'
                      ? 'Next Month'
                      : viewMode === 'months'
                      ? 'Next Year'
                      : 'Scroll Recent Years'
                  }
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* VIEW 1: Standard Days Calendar View */}
            {viewMode === 'days' && (
              <div className="space-y-1">
                {/* Weekdays Header */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {DAYS_OF_WEEK.map(day => (
                    <span key={day} className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase py-1">
                      {day}
                    </span>
                  ))}
                </div>

                {/* Day Cells Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Prev month days */}
                  {prevMonthDays.map(d => (
                    <button
                      key={`prev-${d}`}
                      type="button"
                      onClick={() => {
                        const m = viewMonth === 0 ? 11 : viewMonth - 1;
                        const y = viewMonth === 0 ? viewYear - 1 : viewYear;
                        handleSelectDay(y, m, d);
                      }}
                      className="h-8 w-8 sm:h-9 sm:w-9 mx-auto rounded-xl flex items-center justify-center text-[11px] sm:text-xs text-slate-600 hover:text-slate-400 hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      {d}
                    </button>
                  ))}

                  {/* Current month days */}
                  {currentMonthDays.map(d => {
                    const selected = isSelectedDate(d);
                    const isToday = isTodayDate(d);

                    return (
                      <button
                        key={`curr-${d}`}
                        type="button"
                        onClick={() => handleSelectDay(viewYear, viewMonth, d)}
                        className={`h-8 w-8 sm:h-9 sm:w-9 mx-auto rounded-xl flex items-center justify-center text-[11px] sm:text-xs font-semibold transition-all duration-150 cursor-pointer relative ${
                          selected
                            ? 'bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-extrabold shadow-lg shadow-sky-500/30 scale-105 ring-2 ring-sky-400'
                            : isToday
                            ? 'bg-sky-500/15 text-sky-300 border border-sky-500/40 font-bold hover:bg-sky-500/25'
                            : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        {d}
                        {isToday && !selected && (
                          <span className="absolute bottom-1 w-1 h-1 rounded-full bg-sky-400" />
                        )}
                      </button>
                    );
                  })}

                  {/* Next month days */}
                  {nextMonthDays.map(d => (
                    <button
                      key={`next-${d}`}
                      type="button"
                      onClick={() => {
                        const m = viewMonth === 11 ? 0 : viewMonth + 1;
                        const y = viewMonth === 11 ? viewYear + 1 : viewYear;
                        if (y <= currentYear) {
                          handleSelectDay(y, m, d);
                        }
                      }}
                      className="h-8 w-8 sm:h-9 sm:w-9 mx-auto rounded-xl flex items-center justify-center text-[11px] sm:text-xs text-slate-600 hover:text-slate-400 hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 2: Months Grid View (4 columns x 3 rows) */}
            {viewMode === 'months' && (
              <div className="space-y-3 py-2">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>Select Month for <b className="text-sky-300 font-mono">{viewYear}</b>:</span>
                  <button
                    type="button"
                    onClick={() => setViewMode('days')}
                    className="text-[11px] text-sky-400 hover:underline"
                  >
                    Back to Days
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
                  {MONTH_NAMES.map((mName, idx) => {
                    const isSelectedMonth = viewMonth === idx;
                    const isCurrentMonthNow = currentYear === viewYear && currentMonth === idx;

                    return (
                      <button
                        key={mName}
                        type="button"
                        onClick={() => handleSelectMonth(idx)}
                        className={`py-3 sm:py-3.5 px-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                          isSelectedMonth
                            ? 'bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-extrabold shadow-lg shadow-sky-500/25 ring-2 ring-sky-400 scale-105'
                            : isCurrentMonthNow
                            ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 hover:bg-sky-500/25'
                            : 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-800'
                        }`}
                      >
                        <span>{MONTH_SHORT[idx]}</span>
                        <span className="text-[9px] font-normal opacity-70 hidden sm:inline">{mName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIEW 3: Scrollable Years View (Up to Current Year 2026, scroll down for past) */}
            {viewMode === 'years' && (
              <div className="space-y-2 py-1">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>Select Year (Past up to <b className="text-sky-300 font-mono">{currentYear}</b>):</span>
                  <button
                    type="button"
                    onClick={() => setViewMode('days')}
                    className="text-[11px] text-sky-400 hover:underline"
                  >
                    Back to Days
                  </button>
                </div>

                <div 
                  ref={yearListRef}
                  className="max-h-56 sm:max-h-64 overflow-y-auto pr-1 grid grid-cols-4 gap-2 scrollbar-thin scrollbar-thumb-slate-700"
                >
                  {availableYears.map(yr => {
                    const isSelectedYr = viewYear === yr;
                    const isCurrentYrNow = currentYear === yr;

                    return (
                      <button
                        key={yr}
                        ref={isSelectedYr ? selectedYearRef : null}
                        type="button"
                        onClick={() => handleSelectYear(yr)}
                        className={`py-3 px-2 rounded-2xl text-xs sm:text-sm font-mono font-bold transition-all cursor-pointer flex items-center justify-center ${
                          isSelectedYr
                            ? 'bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-extrabold shadow-lg shadow-sky-500/25 ring-2 ring-sky-400 scale-105'
                            : isCurrentYrNow
                            ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 hover:bg-sky-500/25'
                            : 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-800'
                        }`}
                      >
                        {yr}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom Actions Bar */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={handleSetToday}
                className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-800/80 hover:bg-sky-500/20 text-slate-300 hover:text-sky-300 border border-slate-700/60 text-[11px] sm:text-xs font-bold transition-all cursor-pointer"
              >
                Today
              </button>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setViewMode('days');
                  }}
                  className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-[11px] sm:text-xs font-extrabold shadow-md shadow-sky-500/20 transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply Date</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
