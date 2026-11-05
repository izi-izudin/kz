import React, { useState } from 'react';
import { Copy, Check, History, Delete, CornerDownLeft } from 'lucide-react';
import { AppSettings } from '../types';
import { formatDisplayNumber } from '../utils/mathEngine';
import { playKeySound, triggerHaptic } from '../utils/soundAndHaptics';

interface CalculatorScreenProps {
  expression: string;
  displayValue: string;
  memoryValue: number;
  settings: AppSettings;
  onClear: () => void;
  onDelete: () => void;
  isError?: boolean;
}

export const CalculatorScreen: React.FC<CalculatorScreenProps> = ({
  expression,
  displayValue,
  memoryValue,
  settings,
  onClear,
  onDelete,
  isError,
}) => {
  const [copied, setCopied] = useState(false);
  const isDark = settings.theme === 'dark';

  const handleCopy = async () => {
    try {
      if (settings.soundEnabled) playKeySound('action');
      if (settings.vibrationEnabled) triggerHaptic(20);
      await navigator.clipboard.writeText(displayValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  // Format display for thousands
  const formattedNumber = isError
    ? displayValue
    : formatDisplayNumber(displayValue, settings.thousandSeparator, settings.decimalPlaces);

  // Dynamic font sizing based on length
  const getFontSizeClass = (text: string) => {
    const len = text.length;
    if (len > 18) return 'text-2xl sm:text-3xl';
    if (len > 13) return 'text-3xl sm:text-4xl';
    if (len > 9) return 'text-4xl sm:text-5xl';
    return 'text-5xl sm:text-6xl';
  };

  return (
    <div
      className={`relative w-full rounded-3xl p-5 mb-4 shadow-xl transition-all duration-300 border flex flex-col justify-between min-h-[170px] ${
        isDark
          ? 'bg-gradient-to-b from-slate-900/90 to-slate-950/90 border-slate-800/80 shadow-black/40'
          : 'bg-gradient-to-b from-white to-slate-50 border-slate-200/80 shadow-slate-200/50'
      }`}
    >
      {/* Top row: Badges, indicators, Copy button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Angle Mode Badge */}
          <span
            className={`text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-md border ${
              isDark
                ? 'bg-slate-800/80 border-slate-700 text-sky-400'
                : 'bg-slate-100 border-slate-200 text-blue-600'
            }`}
          >
            {settings.angleUnit.toUpperCase()}
          </span>

          {/* Memory Badge */}
          {memoryValue !== 0 && (
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border animate-pulse ${
                isDark
                  ? 'bg-blue-950/60 border-blue-700 text-blue-300'
                  : 'bg-blue-50 border-blue-200 text-blue-700'
              }`}
            >
              M ({memoryValue})
            </span>
          )}
        </div>

        {/* Action icons: Copy */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-xl font-medium border transition-all ${
              copied
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : isDark
                ? 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:text-white hover:bg-slate-800'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
            title="Salin hasil"
          >
            {copied ? (
              <>
                <Check size={13} className="text-emerald-400" />
                <span className="text-[11px] font-semibold text-emerald-400">Tersalin</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span className="text-[11px]">Salin</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Middle row: Expression History */}
      <div className="mt-2 text-right overflow-x-auto whitespace-nowrap scrollbar-none">
        <span
          className={`font-mono text-sm tracking-wide ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          {expression || '\u00A0'}
        </span>
      </div>

      {/* Main result number display */}
      <div className="w-full text-right mt-1 overflow-x-auto overflow-y-hidden whitespace-nowrap select-all scrollbar-none py-1">
        <span
          className={`font-mono font-bold tracking-tight transition-all duration-150 inline-block ${
            isError
              ? 'text-rose-500 text-2xl sm:text-3xl font-semibold'
              : `${getFontSizeClass(formattedNumber)} ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`
          }`}
        >
          {formattedNumber}
        </span>
      </div>
    </div>
  );
};
