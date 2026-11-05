import React, { useState } from 'react';
import { AppSettings } from '../types';
import { playKeySound, triggerHaptic } from '../utils/soundAndHaptics';

interface ScientificKeypadProps {
  onInsertFunction: (funcName: string) => void;
  onInsertConstant: (constVal: string) => void;
  onMemoryAction: (action: 'MC' | 'MR' | 'M+' | 'M-' | 'MS') => void;
  settings: AppSettings;
  onToggleAngleUnit: () => void;
}

export const ScientificKeypad: React.FC<ScientificKeypadProps> = ({
  onInsertFunction,
  onInsertConstant,
  onMemoryAction,
  settings,
  onToggleAngleUnit,
}) => {
  const [isSecond, setIsSecond] = useState(false);
  const isDark = settings.theme === 'dark';

  const handlePress = (
    action: () => void,
    soundType: 'operator' | 'action' | 'number' = 'operator'
  ) => {
    if (settings.soundEnabled) playKeySound(soundType);
    if (settings.vibrationEnabled) triggerHaptic(15);
    action();
  };

  const sciKey =
    'h-11 sm:h-12 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-100 flex items-center justify-center active:scale-95 select-none border font-mono';

  const primarySci = isDark
    ? `${sciKey} bg-slate-800/80 text-sky-300 hover:bg-slate-750 active:bg-sky-950/60 border-slate-700/60`
    : `${sciKey} bg-slate-100 text-blue-700 hover:bg-slate-200 active:bg-blue-100 border-slate-200`;

  const memoryKey = isDark
    ? `${sciKey} bg-indigo-950/40 text-indigo-300 hover:bg-indigo-900/50 border-indigo-800/40 font-bold`
    : `${sciKey} bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 font-bold`;

  const accentSci = isDark
    ? `${sciKey} bg-sky-950/60 text-sky-400 hover:bg-sky-900/60 border-sky-800/50`
    : `${sciKey} bg-sky-50 text-sky-800 hover:bg-sky-100 border-sky-200`;

  return (
    <div className="w-full space-y-2 mb-3">
      {/* Memory Bar */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        <button
          onClick={() => handlePress(() => onMemoryAction('MC'), 'action')}
          className={memoryKey}
          title="Memory Clear (MC)"
        >
          MC
        </button>
        <button
          onClick={() => handlePress(() => onMemoryAction('MR'), 'action')}
          className={memoryKey}
          title="Memory Recall (MR)"
        >
          MR
        </button>
        <button
          onClick={() => handlePress(() => onMemoryAction('M+'), 'action')}
          className={memoryKey}
          title="Memory Add (M+)"
        >
          M+
        </button>
        <button
          onClick={() => handlePress(() => onMemoryAction('M-'), 'action')}
          className={memoryKey}
          title="Memory Subtract (M-)"
        >
          M−
        </button>
        <button
          onClick={() => handlePress(() => onMemoryAction('MS'), 'action')}
          className={memoryKey}
          title="Memory Store (MS)"
        >
          MS
        </button>
      </div>

      {/* Scientific Functions Grid */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {/* Row 1: 2nd, DEG/RAD, sin/asin, cos/acos, tan/atan */}
        <button
          onClick={() => handlePress(() => setIsSecond(!isSecond), 'action')}
          className={`${accentSci} ${isSecond ? 'ring-2 ring-sky-400 font-bold' : ''}`}
        >
          2nd
        </button>
        <button
          onClick={() => handlePress(onToggleAngleUnit, 'action')}
          className={accentSci}
        >
          {settings.angleUnit.toUpperCase()}
        </button>
        <button
          onClick={() => handlePress(() => onInsertFunction(isSecond ? 'asin(' : 'sin('))}
          className={primarySci}
        >
          {isSecond ? 'sin⁻¹' : 'sin'}
        </button>
        <button
          onClick={() => handlePress(() => onInsertFunction(isSecond ? 'acos(' : 'cos('))}
          className={primarySci}
        >
          {isSecond ? 'cos⁻¹' : 'cos'}
        </button>
        <button
          onClick={() => handlePress(() => onInsertFunction(isSecond ? 'atan(' : 'tan('))}
          className={primarySci}
        >
          {isSecond ? 'tan⁻¹' : 'tan'}
        </button>

        {/* Row 2: ln/e^x, log/10^x, sqrt/cbrt, x^y/x^2, n! */}
        <button
          onClick={() => handlePress(() => onInsertFunction(isSecond ? 'exp(' : 'ln('))}
          className={primarySci}
        >
          {isSecond ? 'eˣ' : 'ln'}
        </button>
        <button
          onClick={() => handlePress(() => onInsertFunction(isSecond ? '10^(' : 'log('))}
          className={primarySci}
        >
          {isSecond ? '10ˣ' : 'log'}
        </button>
        <button
          onClick={() => handlePress(() => onInsertFunction(isSecond ? 'cbrt(' : 'sqrt('))}
          className={primarySci}
        >
          {isSecond ? '∛x' : '√x'}
        </button>
        <button
          onClick={() => handlePress(() => onInsertFunction(isSecond ? '^2' : '^'))}
          className={primarySci}
        >
          {isSecond ? 'x²' : 'xʸ'}
        </button>
        <button
          onClick={() => handlePress(() => onInsertFunction('!'))}
          className={primarySci}
          title="Faktorial (n!)"
        >
          n!
        </button>

        {/* Row 3: 1/x, pi, e, (, ) */}
        <button
          onClick={() => handlePress(() => onInsertFunction('1/('))}
          className={primarySci}
          title="Invers 1/x"
        >
          1/x
        </button>
        <button
          onClick={() => handlePress(() => onInsertConstant('π'), 'number')}
          className={primarySci}
          title="Pi (3.14159...)"
        >
          π
        </button>
        <button
          onClick={() => handlePress(() => onInsertConstant('e'), 'number')}
          className={primarySci}
          title="Euler (2.71828...)"
        >
          e
        </button>
        <button
          onClick={() => handlePress(() => onInsertFunction('('))}
          className={primarySci}
        >
          (
        </button>
        <button
          onClick={() => handlePress(() => onInsertFunction(')'))}
          className={primarySci}
        >
          )
        </button>
      </div>
    </div>
  );
};
