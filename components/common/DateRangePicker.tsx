import React, { useState, useEffect, useRef } from 'react';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '../../components/icons';

interface DateRange {
    startDate: Date;
    endDate: Date;
}

interface DateRangePickerProps {
    onChange: (range: DateRange) => void;
    initialStartDate?: Date;
    initialEndDate?: Date;
}

const Presets = [
    { label: 'Today', getValue: () => { const d = new Date(); return { startDate: d, endDate: d }; } },
    { label: 'Yesterday', getValue: () => { const d = new Date(); d.setDate(d.getDate() - 1); return { startDate: d, endDate: d }; } },
    { label: 'This week (Sun - Today)', getValue: () => { const end = new Date(); const start = new Date(); start.setDate(start.getDate() - start.getDay()); return { startDate: start, endDate: end }; } },
    { label: 'Last 7 days', getValue: () => { const end = new Date(); const start = new Date(); start.setDate(start.getDate() - 6); return { startDate: start, endDate: end }; } },
    { label: 'Last 14 days', getValue: () => { const end = new Date(); const start = new Date(); start.setDate(start.getDate() - 13); return { startDate: start, endDate: end }; } },
    { label: 'Last 28 days', getValue: () => { const end = new Date(); const start = new Date(); start.setDate(start.getDate() - 27); return { startDate: start, endDate: end }; } },
    { label: 'Last 30 days', getValue: () => { const end = new Date(); const start = new Date(); start.setDate(start.getDate() - 29); return { startDate: start, endDate: end }; } },
    { label: 'This month', getValue: () => { const end = new Date(); const start = new Date(end.getFullYear(), end.getMonth(), 1); return { startDate: start, endDate: end }; } },
    { label: 'Last month', getValue: () => { const now = new Date(); const start = new Date(now.getFullYear(), now.getMonth() - 1, 1); const end = new Date(now.getFullYear(), now.getMonth(), 0); return { startDate: start, endDate: end }; } },
];

const DateRangePicker: React.FC<DateRangePickerProps> = ({ onChange, initialStartDate, initialEndDate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [range, setRange] = useState<DateRange>({
        startDate: initialStartDate || new Date(new Date().setDate(new Date().getDate() - 28)),
        endDate: initialEndDate || new Date()
    });

    // For calendar navigation
    const [viewDate, setViewDate] = useState(new Date()); // The month currently being viewed
    const [tempRange, setTempRange] = useState<DateRange>(range);

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getDayOfWeek = (year: number, month: number, day: number) => {
        return new Date(year, month, day).getDay();
    };

    const renderCalendar = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const startDay = getDayOfWeek(year, month, 1); // 0 = Sunday

        const days = [];
        // Empty slots for days before start of month
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="p-2"></div>);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const currentDate = new Date(year, month, d);
            const isSelected = (currentDate >= tempRange.startDate && currentDate <= tempRange.endDate) ||
                (currentDate.toDateString() === tempRange.startDate.toDateString());

            // Check if it matches exactly start or end for rounding styles
            const isStart = currentDate.toDateString() === tempRange.startDate.toDateString();
            const isEnd = currentDate.toDateString() === tempRange.endDate.toDateString();

            days.push(
                <button
                    key={d}
                    onClick={() => handleDateClick(currentDate)}
                    className={`
                        p-2 text-sm w-8 h-8 flex items-center justify-center rounded-full
                        ${isStart || isEnd ? 'bg-blue-600 text-white' : ''}
                        ${!isStart && !isEnd && isSelected ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-none' : ''}
                        ${!isSelected ? 'hover:bg-gray-100 dark:hover:bg-slate-700 dark:text-gray-300' : ''}
                        ${isSelected && !isStart && !isEnd ? 'mx-0 w-full' : ''}
                    `}
                >
                    {d}
                </button>
            );
        }
        return days;
    };

    const handleDateClick = (date: Date) => {
        // Logic: 
        // 1. If we clicked a date, and we already have a full range, reset to just this date as start.
        // 2. If we have a start but no end (conceptually, though our state always has both), check if date > start.
        //    Since state always has both, we use a simple heuristic:
        //    If selecting a date < current start, make it start using same end ?? No, simpler:
        //    Start fresh selection cycle?

        // Better logic for range picker:
        // Case A: User is adjusting. 
        // Try this: If clicked date is before start, it becomes start.
        // If clicked date is after start, it becomes end.
        // But users often click start then end.

        // Let's create a 'selectingMode' state implicitly? 
        // If start === end (single day selected or reset), then clicking > start sets end.
        // If start !== end, clicking resets to new start.

        if (tempRange.startDate.getTime() === tempRange.endDate.getTime()) {
            if (date > tempRange.startDate) {
                setTempRange({ ...tempRange, endDate: date });
            } else {
                setTempRange({ startDate: date, endDate: date }); // Reset to new start
            }
        } else {
            setTempRange({ startDate: date, endDate: date }); // Reset to new single day
        }
    };

    const handleApply = () => {
        setRange(tempRange);
        onChange(tempRange);
        setIsOpen(false);
    };

    const handlePresetClick = (preset: { getValue: () => DateRange }) => {
        const newRange = preset.getValue();
        setTempRange(newRange);
        // Also center calendar on the end date
        setViewDate(new Date(newRange.endDate));
    };

    const changeMonth = (offset: number) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
        setViewDate(newDate);
    };

    return (
        <div className="relative" ref={containerRef}>
            {/* Trigger Button */}
            <button
                onClick={() => { setIsOpen(!isOpen); setTempRange(range); }}
                className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 px-3 py-2 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
                <CalendarIcon className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {formatDate(range.startDate)} - {formatDate(range.endDate)}
                </span>
            </button>

            {/* Popover */}
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-600 z-50 flex flex-col md:flex-row w-[320px] md:w-[600px] overflow-hidden">
                    {/* Presets Sidebar */}
                    <div className="w-full md:w-48 border-b md:border-b-0 md:border-r border-gray-200 dark:border-slate-600 p-2 bg-gray-50 dark:bg-slate-900/50 overflow-y-auto max-h-[300px] md:max-h-none">
                        {Presets.map((preset, idx) => (
                            <button
                                key={idx}
                                onClick={() => handlePresetClick(preset)}
                                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 p-4">
                        {/* Inputs */}
                        <div className="flex gap-2 mb-4">
                            <div className="flex-1">
                                <label className="block text-xs text-gray-500 mb-1">Start date</label>
                                <div className="border border-gray-300 dark:border-slate-600 rounded px-2 py-1 text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-white">
                                    {formatDate(tempRange.startDate)}
                                </div>
                            </div>
                            <div className="flex items-center text-gray-400">-</div>
                            <div className="flex-1">
                                <label className="block text-xs text-gray-500 mb-1">End date</label>
                                <div className="border border-gray-300 dark:border-slate-600 rounded px-2 py-1 text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-white">
                                    {formatDate(tempRange.endDate)}
                                </div>
                            </div>
                        </div>

                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-4">
                            <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full">
                                <ChevronLeftIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                            </button>
                            <span className="font-bold text-gray-800 dark:text-white">
                                {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </span>
                            <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full">
                                <ChevronRightIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                            </button>
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1 text-center mb-2">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                                <div key={d} className="text-xs font-bold text-gray-400">{d}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-y-1">
                            {renderCalendar()}
                        </div>

                        {/* Actions */}
                        <div className="mt-4 flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-slate-700">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleApply}
                                className="px-4 py-2 text-sm bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 shadow-sm"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DateRangePicker;
