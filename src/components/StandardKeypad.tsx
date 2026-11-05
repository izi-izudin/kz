import React from 'react';
import { Delete, RotateCcw, Percent, Plus, Minus, X, Divide, Equal } from 'lucide-react';
import { AppSettings } from '../types';
import { playKeySound, triggerHaptic } from '../utils/soundAndHaptics';

interface StandardKeypadProps {
  onDigit: (digit: string) => void;
  onOperator: (op: string) => void;
  onClear: () => void;
  onDelete: () => void;
  onEqual: () => void;
  onToggleSign: () => void;
  onPercent: () => void;
  settings: AppSettings;
}

export const StandardKeypad: React.FC<StandardKeypadProps> = ({
  onDigit,
  onOperator,
  onClear,
  onDelete,
  onEqual,
  onToggleSign,
  onPercent,
  settings,
}) => {
  const isDark = settings.theme === 'dark';

  const handlePress = (action: () => void, soundType: 'number' | 'operator' | 'action' | 'equal') => {
    if (settings.soundEnabled) playKeySound(soundType);
    if (settings.vibrationEnabled) triggerHaptic(15);
    action();
  };

  // Base styling for rounded rectangular keys
  const baseKey =
    'h-14 sm:h-16 rounded-2xl font-semibold text-xl sm:text-2xl transition-all duration-100 flex items-center justify-center active:scale-95 select-none shadow-sm';

  const numKey = isDark
    ? `${baseKey} bg-slate-800/90 text-white hover:bg-slate-750 active:bg-slate-700 border border-slate-700/50 shadow-slate-950/20`
    : `${baseKey} bg-white text-slate-800 hover:bg-slate-50 active:bg-slate-100 border border-slate-200/90 shadow-slate-200/60`;

  const actionKey = isDark
    ? `${baseKey} bg-slate-800/40 text-rose-400 hover:bg-slate-800 active:bg-rose-950/40 border border-slate-700/40`
    : `${baseKey} bg-slate-100 text-rose-600 hover:bg-slate-200 active:bg-rose-100/50 border border-slate-200`;

  const utilKey = isDark
    ? `${baseKey} bg-slate-800/50 text-sky-400 hover:bg-slate-800 active:bg-sky-950/40 border border-slate-700/40`
    : `${baseKey} bg-slate-100 text-sky-700 hover:bg-slate-200 active:bg-sky-100 border border-slate-200`;

  const opKey = isDark
    ? `${baseKey} bg-blue-950/60 text-sky-400 hover:bg-blue-900/60 active:bg-blue-800/60 border border-blue-800/40 text-2xl`
    : `${baseKey} bg-blue-50 text-blue-600 hover:bg-blue-100 active:bg-blue-200 border border-blue-200/80 text-2xl font-bold`;

  const equalKey = `${baseKey} bg-gradient-to-r from-blue-600 to-sky-500 text-white hover:from-blue-500 hover:to-sky-400 active:from-blue-700 active:to-sky-600 shadow-lg shadow-blue-500/25 border border-sky-400/30 text-2xl font-bold`;

  return (
    <div className="grid grid-cols-4 gap-2.5 sm:gap-3 w-full">
      {/* Row 1: C, DEL, %, ÷ */}
      <button
        onClick={() => handlePress(onClear, 'action')}
        className={actionKey}
        title="Clear All (C)"
      >
        <span className="font-bold">C</span>
      </button>

      <button
        onClick={() => handlePress(onDelete, 'action')}
        className={utilKey}
        title="Delete (Backspace)"
      >
        <Delete size={22} />
      </button>

      <button
        onClick={() => handlePress(onPercent, 'operator')}
        className={utilKey}
        title="Percentage (%)"
      >
        <Percent size={20} />
      </button>

      <button
        onClick={() => handlePress(() => onOperator('÷'), 'operator')}
        className={opKey}
        title="Divide (÷)"
      >
        ÷
      </button>

      {/* Row 2: 7, 8, 9, × */}
      <button onClick={() => handlePress(() => onDigit('7'), 'number')} className={numKey}>
        7
      </button>
      <button onClick={() => handlePress(() => onDigit('8'), 'number')} className={numKey}>
        8
      </button>
      <button onClick={() => handlePress(() => onDigit('9'), 'number')} className={numKey}>
        9
      </button>
      <button
        onClick={() => handlePress(() => onOperator('×'), 'operator')}
        className={opKey}
        title="Multiply (×)"
      >
        ×
      </button>

      {/* Row 3: 4, 5, 6, − */}
      <button onClick={() => handlePress(() => onDigit('4'), 'number')} className={numKey}>
        4
      </button>
      <button onClick={() => handlePress(() => onDigit('5'), 'number')} className={numKey}>
        5
      </button>
      <button onClick={() => handlePress(() => onDigit('6'), 'number')} className={numKey}>
        6
      </button>
      <button
        onClick={() => handlePress(() => onOperator('−'), 'operator')}
        className={opKey}
        title="Subtract (−)"
      >
        −
      </button>

      {/* Row 4: 1, 2, 3, + */}
      <button onClick={() => handlePress(() => onDigit('1'), 'number')} className={numKey}>
        1
      </button>
      <button onClick={() => handlePress(() => onDigit('2'), 'number')} className={numKey}>
        2
      </button>
      <button onClick={() => handlePress(() => onDigit('3'), 'number')} className={numKey}>
        3
      </button>
      <button
        onClick={() => handlePress(() => onOperator('+'), 'operator')}
        className={opKey}
        title="Add (+)"
      >
        +
      </button>

      {/* Row 5: ±, 0, ., = */}
      <button
        onClick={() => handlePress(onToggleSign, 'operator')}
        className={numKey}
        title="Plus/Minus (±)"
      >
        ±
      </button>
      <button onClick={() => handlePress(() => onDigit('0'), 'number')} className={numKey}>
        0
      </button>
      <button
        onClick={() => handlePress(() => onDigit('.'), 'number')}
        className={numKey}
        title="Decimal Point"
      >
        .
      </button>
      <button
        onClick={() => handlePress(onEqual, 'equal')}
        className={equalKey}
        title="Calculate (=)"
      >
        =
      </button>
    </div>
  );
};
