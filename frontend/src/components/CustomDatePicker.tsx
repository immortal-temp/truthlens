import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, X, Check } from 'lucide-react';

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

  // View Mode: 'days' | 'wheel_picker'
  const [viewMode, setViewMode] = useState<'days' | 'wheel_picker'>('days');

  // Active view date
  const parsedDate = value ? new Date(value + 'T00:00:00') : new Date();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [viewYear, setViewYear] = useState<number>(parsedDate.getFullYear() || currentYear);
  const [viewMonth, setViewMonth] = useState<number>(parsedDate.getMonth() || currentMonth);

  // Staged values while scrolling inside the Month/Year Wheel Picker
  const [rollerMonth, setRollerMonth] = useState<number>(viewMonth);
  const [rollerYear, setRollerYear] = useState<number>(viewYear);

  const monthScrollRef = useRef<HTMLDivElement>(null);
  const yearScrollRef = useRef<HTMLDivElement>(null);

  // Keep view in sync when value changes or dialog opens
  useEffect(() => {
    if (value) {
      setTempSelectedDate(value);
      const d = new Date(value + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        const y = Math.min(d.getFullYear(), currentYear);
        const m = d.getMonth();
        setViewYear(y);
        setViewMonth(m);
        setRollerYear(y);
        setRollerMonth(m);
      }
    }
  }, [value, isOpen, currentYear]);

  // Sync roller when entering wheel_picker mode & auto-scroll into center
  useEffect(() => {
    if (viewMode === 'wheel_picker') {
      setRollerMonth(viewMonth);
      setRollerYear(viewYear);

      setTimeout(() => {
        if (monthScrollRef.current) {
          const activeMonthEl = monthScrollRef.current.querySelector(`[data-month="${viewMonth}"]`) as HTMLElement;
          if (activeMonthEl) {
            activeMonthEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
        }
        if (yearScrollRef.current) {
          const activeYearEl = yearScrollRef.current.querySelector(`[data-year="${viewYear}"]`) as HTMLElement;
          if (activeYearEl) {
            activeYearEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
        }
      }, 50);
    }
  }, [viewMode, viewMonth, viewYear]);

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

  // Month navigation arrows in Days view
  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      if (viewYear < currentYear) {
        setViewMonth(0);
        setViewYear(prev => prev + 1);
      }
    } else {
      if (viewYear < currentYear || viewMonth < 11) {
        setViewMonth(prev => prev + 1);
      }
    }
  };

  const handleSelectDay = (year: number, month: number, day: number) => {
    const mStr = String(month + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    const formatted = `${year}-${mStr}-${dStr}`;
    setTempSelectedDate(formatted);
  };

  // Confirm Month-Year Wheel Roller selection
  const handleConfirmRoller = () => {
    setViewMonth(rollerMonth);
    setViewYear(rollerYear);
    setViewMode('days');
  };

  const handleCancelRoller = () => {
    setRollerMonth(viewMonth);
    setRollerYear(viewYear);
    setViewMode('days');
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
    setRollerYear(y);
    setRollerMonth(today.getMonth());
    setViewMode('days');
  };

  // Generate calendar days for Day view
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

  // Available Years strictly bounded up to current year (e.g. 2026 down to 1970)
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
            {/* Modal Top Header */}
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

            {/* Main Calendar View: Day Grid with Single Combined Month-Year Header Button */}
            {viewMode === 'days' && (
              <>
                {/* Header with single button for Month & Year */}
                <div className="flex items-center justify-between px-1 py-1 shrink-0">
                  {/* Single combined month & year button */}
                  <button
                    type="button"
                    onClick={() => setViewMode('wheel_picker')}
                    className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 hover:border-sky-500/40 text-sm sm:text-base font-extrabold text-white flex items-center gap-2 transition-all cursor-pointer group shadow-sm"
                    title="Click to change Month and Year"
                  >
                    <span className="group-hover:text-sky-300 transition-colors">
                      {MONTH_NAMES[viewMonth]} {viewYear}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-sky-400 group-hover:translate-y-0.5 transition-transform" />
                  </button>

                  {/* Previous / Next Month Arrows */}
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Previous Month"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      disabled={viewYear >= currentYear && viewMonth >= 11}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Next Month"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

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
                      onClick={() => setIsOpen(false)}
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
              </>
            )}

            {/* VIEW 2: Month & Year Scroll Wheel / Drum Picker (Matching User's Reference Layout) */}
            {viewMode === 'wheel_picker' && (
              <div className="space-y-4 py-2">
                {/* Header: Dynamic Selected Month - Year (e.g. JANUARY - 2000) */}
                <div className="text-center pb-2 border-b border-slate-800/80">
                  <h4 className="text-base sm:text-lg font-black text-white tracking-wider uppercase font-mono">
                    {MONTH_NAMES[rollerMonth]} - {rollerYear}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Scroll to select month and past year up to {currentYear}
                  </p>
                </div>

                {/* Dual-Wheel Scroll Roller Container */}
                <div className="relative h-48 sm:h-52 w-full bg-slate-950/60 rounded-2xl border border-slate-800 overflow-hidden flex">
                  
                  {/* Center Selection Focus Window with Upper & Lower Glass Divider Lines */}
                  <div className="pointer-events-none absolute inset-x-3 top-1/2 -translate-y-1/2 h-11 border-y-2 border-sky-500/40 bg-sky-500/10 rounded-lg shadow-sm shadow-sky-500/10" />

                  {/* Top & Bottom Fade Overlay Masks for 3D Roller Effect */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-[#0d1322] via-[#0d1322]/80 to-transparent z-10" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#0d1322] via-[#0d1322]/80 to-transparent z-10" />

                  {/* Left Column: Month Roller */}
                  <div 
                    ref={monthScrollRef}
                    className="flex-1 h-full overflow-y-auto py-18 px-2 scroll-smooth text-center scrollbar-none space-y-1"
                    style={{ scrollSnapType: 'y mandatory' }}
                  >
                    {MONTH_NAMES.map((mName, idx) => {
                      const isSelected = rollerMonth === idx;
                      return (
                        <button
                          key={mName}
                          data-month={idx}
                          type="button"
                          onClick={() => setRollerMonth(idx)}
                          style={{ scrollSnapAlign: 'center' }}
                          className={`w-full py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center ${
                            isSelected
                              ? 'text-sky-300 font-extrabold text-sm sm:text-base scale-110 shadow-sm'
                              : 'text-slate-500 hover:text-slate-300 opacity-60 hover:opacity-90'
                          }`}
                        >
                          <span>{MONTH_SHORT[idx]}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Subtle Vertical Divider */}
                  <div className="w-[1px] bg-slate-800/80 my-4 z-20" />

                  {/* Right Column: Year Roller (Current Year down to 1970) */}
                  <div 
                    ref={yearScrollRef}
                    className="flex-1 h-full overflow-y-auto py-18 px-2 scroll-smooth text-center scrollbar-none space-y-1"
                    style={{ scrollSnapType: 'y mandatory' }}
                  >
                    {availableYears.map(yr => {
                      const isSelected = rollerYear === yr;
                      return (
                        <button
                          key={yr}
                          data-year={yr}
                          type="button"
                          onClick={() => setRollerYear(yr)}
                          style={{ scrollSnapAlign: 'center' }}
                          className={`w-full py-2 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all cursor-pointer flex items-center justify-center ${
                            isSelected
                              ? 'text-sky-300 font-extrabold text-sm sm:text-base scale-110 shadow-sm'
                              : 'text-slate-500 hover:text-slate-300 opacity-60 hover:opacity-90'
                          }`}
                        >
                          <span>{yr}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Roller Footer Actions: CANCEL and OK (Matching user's reference) */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={handleCancelRoller}
                    className="px-4 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmRoller}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs sm:text-sm font-extrabold uppercase tracking-wider shadow-md shadow-sky-500/25 transition-all cursor-pointer"
                  >
                    OK
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
