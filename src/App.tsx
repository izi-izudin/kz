import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { CalculatorScreen } from './components/CalculatorScreen';
import { StandardKeypad } from './components/StandardKeypad';
import { ScientificKeypad } from './components/ScientificKeypad';
import { AiAssistantTab } from './components/AiAssistantTab';
import { FinancialCalculatorTab } from './components/FinancialCalculatorTab';
import { DailyChallengeTab } from './components/DailyChallengeTab';
import { HistoryAndSettingsTab } from './components/HistoryAndSettingsTab';
import { BottomNav } from './components/BottomNav';
import { AppSettings, AppTab, HistoryItem } from './types';
import { safeEvaluate, sanitizeNumber } from './utils/mathEngine';
import {
  loadSettings,
  saveSettings,
  loadHistory,
  saveHistory,
  loadMemory,
  saveMemory,
  translations,
} from './utils/storageAndI18n';
import { playKeySound, triggerHaptic } from './utils/soundAndHaptics';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory);
  const [memoryValue, setMemoryValue] = useState<number>(loadMemory);

  const [currentTab, setCurrentTab] = useState<AppTab>('calculator');
  const [displayValue, setDisplayValue] = useState<string>('0');
  const [expression, setExpression] = useState<string>('');
  const [isNewInput, setIsNewInput] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [pendingOperator, setPendingOperator] = useState<string | null>(null);
  const [financeOrChallengeTab, setFinanceOrChallengeTab] = useState<'finance' | 'challenge'>('finance');

  // PWA install prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Sync settings changes
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      saveSettings(updated);
      return updated;
    });
  };

  // Sync theme to root HTML element
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
      root.style.backgroundColor = '#090F1E';
    } else {
      root.classList.remove('dark');
      root.style.backgroundColor = '#F8FAFC';
    }
  }, [settings.theme]);

  // Capture PWA beforeinstallprompt
  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // 1. Digit input
  const handleDigit = useCallback(
    (digit: string) => {
      if (isError) {
        setDisplayValue(digit === '.' ? '0.' : digit);
        setExpression('');
        setIsError(false);
        setIsNewInput(false);
        return;
      }

      if (digit === '.') {
        if (isNewInput) {
          setDisplayValue('0.');
          setIsNewInput(false);
          return;
        }
        if (!displayValue.includes('.')) {
          setDisplayValue((prev) => prev + '.');
        }
        return;
      }

      if (isNewInput || displayValue === '0') {
        setDisplayValue(digit);
        setIsNewInput(false);
      } else {
        // Prevent overflow beyond 16 digits
        if (displayValue.replace(/[^0-9]/g, '').length < 16) {
          setDisplayValue((prev) => prev + digit);
        }
      }
    },
    [displayValue, isNewInput, isError]
  );

  // 2. Binary Operators (+, −, ×, ÷)
  const handleOperator = useCallback(
    (op: string) => {
      if (isError) return;

      if (expression && !isNewInput) {
        // Evaluate running expression first (chained calculations: 2 + 3 + 4)
        const fullExpr = `${expression} ${displayValue}`;
        const evalRes = safeEvaluate(fullExpr, { angleUnit: settings.angleUnit });
        if (evalRes.success && evalRes.result !== undefined) {
          const resStr = String(evalRes.result);
          setDisplayValue(resStr);
          setExpression(`${resStr} ${op}`);
        } else {
          setExpression(`${displayValue} ${op}`);
        }
      } else {
        setExpression(`${displayValue} ${op}`);
      }

      setIsNewInput(true);
      setPendingOperator(op);
    },
    [displayValue, expression, isNewInput, isError, settings.angleUnit]
  );

  // 3. Clear All (C)
  const handleClear = useCallback(() => {
    setDisplayValue('0');
    setExpression('');
    setIsNewInput(true);
    setIsError(false);
    setPendingOperator(null);
  }, []);

  // 4. Delete / Backspace (⌫)
  const handleDelete = useCallback(() => {
    if (isError) {
      handleClear();
      return;
    }
    if (isNewInput) return;

    if (displayValue.length > 1) {
      const next = displayValue.slice(0, -1);
      setDisplayValue(next === '-' ? '0' : next);
    } else {
      setDisplayValue('0');
      setIsNewInput(true);
    }
  }, [displayValue, isNewInput, isError, handleClear]);

  // 5. Toggle Sign (±)
  const handleToggleSign = useCallback(() => {
    if (isError || displayValue === '0') return;
    setDisplayValue((prev) => (prev.startsWith('-') ? prev.substring(1) : '-' + prev));
  }, [displayValue, isError]);

  // 6. Percentage (%)
  const handlePercent = useCallback(() => {
    if (isError) return;
    const num = parseFloat(displayValue);
    if (isNaN(num)) return;

    // If chained after + or - (e.g. 200 + 10% -> 200 + 20)
    if (expression.endsWith('+') || expression.endsWith('−')) {
      const baseNum = parseFloat(expression);
      if (!isNaN(baseNum)) {
        const pctVal = (baseNum * num) / 100;
        setDisplayValue(String(sanitizeNumber(pctVal)));
        return;
      }
    }

    const pct = num / 100;
    setDisplayValue(String(sanitizeNumber(pct)));
    setIsNewInput(true);
  }, [displayValue, expression, isError]);

  // 7. Calculate Equals (=)
  const handleEqual = useCallback(() => {
    if (isError) return;

    let fullExpr = '';
    if (expression) {
      fullExpr = `${expression} ${displayValue}`;
    } else {
      fullExpr = displayValue;
    }

    const evalRes = safeEvaluate(fullExpr, { angleUnit: settings.angleUnit });

    if (!evalRes.success || evalRes.result === undefined) {
      setDisplayValue(evalRes.error || 'Error');
      setIsError(true);
      if (settings.soundEnabled) playKeySound('error');
      if (settings.vibrationEnabled) triggerHaptic(30);
    } else {
      const finalNumber = evalRes.result;
      const finalStr = String(finalNumber);

      // Save to history
      const historyItem: HistoryItem = {
        id: Math.random().toString(),
        expression: fullExpr,
        result: finalStr,
        timestamp: Date.now(),
        mode: currentTab === 'scientific' ? 'scientific' : 'standard',
      };

      const updatedHistory = [historyItem, ...history].slice(0, 100);
      setHistory(updatedHistory);
      saveHistory(updatedHistory);

      setExpression(fullExpr + ' =');
      setDisplayValue(finalStr);
      setIsNewInput(true);
      setPendingOperator(null);
    }
  }, [displayValue, expression, isError, settings, history, currentTab]);

  // 8. Scientific Function Insertion
  const handleInsertFunction = useCallback(
    (funcPattern: string) => {
      if (isError) setIsError(false);

      if (funcPattern === '!') {
        // Postfix factorial on current display value
        const full = `${displayValue}!`;
        const res = safeEvaluate(full, { angleUnit: settings.angleUnit });
        if (res.success && res.result !== undefined) {
          setDisplayValue(String(res.result));
          setExpression(full);
          setIsNewInput(true);
        } else {
          setDisplayValue(res.error || 'Error');
          setIsError(true);
        }
        return;
      }

      if (funcPattern === '^2') {
        const full = `(${displayValue})^2`;
        const res = safeEvaluate(full, { angleUnit: settings.angleUnit });
        if (res.success && res.result !== undefined) {
          setDisplayValue(String(res.result));
          setExpression(full);
          setIsNewInput(true);
        }
        return;
      }

      if (funcPattern.endsWith('(')) {
        // Functional call wrapping
        if (displayValue !== '0' && isNewInput) {
          setExpression((prev) => `${prev} ${funcPattern}`);
        } else {
          setExpression(`${funcPattern}${displayValue})`);
          const res = safeEvaluate(`${funcPattern}${displayValue})`, {
            angleUnit: settings.angleUnit,
          });
          if (res.success && res.result !== undefined) {
            setDisplayValue(String(res.result));
            setIsNewInput(true);
          }
        }
      } else {
        setExpression((prev) => `${prev} ${displayValue} ${funcPattern}`);
        setIsNewInput(true);
      }
    },
    [displayValue, isNewInput, isError, settings.angleUnit]
  );

  // 9. Constants Insertion (π, e)
  const handleInsertConstant = useCallback((constVal: string) => {
    if (constVal === 'π') {
      setDisplayValue(String(Math.PI));
    } else if (constVal === 'e') {
      setDisplayValue(String(Math.E));
    }
    setIsNewInput(true);
  }, []);

  // 10. Memory Actions (MC, MR, M+, M-, MS)
  const handleMemoryAction = useCallback(
    (action: 'MC' | 'MR' | 'M+' | 'M-' | 'MS') => {
      const current = parseFloat(displayValue) || 0;
      let newMem = memoryValue;

      if (action === 'MC') {
        newMem = 0;
      } else if (action === 'MR') {
        setDisplayValue(String(memoryValue));
        setIsNewInput(true);
      } else if (action === 'MS') {
        newMem = current;
      } else if (action === 'M+') {
        newMem += current;
      } else if (action === 'M-') {
        newMem -= current;
      }

      setMemoryValue(newMem);
      saveMemory(newMem);
    },
    [displayValue, memoryValue]
  );

  // 11. Insert Value directly from AI / Photo / Voice / Finance to Calculator
  const handleInsertValueFromExternal = useCallback((val: string) => {
    const clean = val.replace(/[^0-9.-]/g, '');
    if (clean) {
      setDisplayValue(clean);
      setExpression('');
      setIsNewInput(true);
      setIsError(false);
      setCurrentTab('calculator');
    }
  }, []);

  // 12. Reuse History Item
  const handleReuseHistory = useCallback((item: HistoryItem) => {
    setDisplayValue(item.result);
    setExpression(item.expression);
    setIsNewInput(true);
    setIsError(false);
    setCurrentTab('calculator');
  }, []);

  // Physical Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture keyboard inside input fields
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key >= '0' && e.key <= '9') {
        if (settings.soundEnabled) playKeySound('number');
        if (settings.vibrationEnabled) triggerHaptic(10);
        handleDigit(e.key);
      } else if (e.key === '.') {
        if (settings.soundEnabled) playKeySound('number');
        handleDigit('.');
      } else if (e.key === '+') {
        if (settings.soundEnabled) playKeySound('operator');
        handleOperator('+');
      } else if (e.key === '-') {
        if (settings.soundEnabled) playKeySound('operator');
        handleOperator('−');
      } else if (e.key === '*' || e.key === 'x') {
        if (settings.soundEnabled) playKeySound('operator');
        handleOperator('×');
      } else if (e.key === '/') {
        e.preventDefault();
        if (settings.soundEnabled) playKeySound('operator');
        handleOperator('÷');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        if (settings.soundEnabled) playKeySound('equal');
        handleEqual();
      } else if (e.key === 'Backspace') {
        if (settings.soundEnabled) playKeySound('action');
        handleDelete();
      } else if (e.key === 'Escape') {
        if (settings.soundEnabled) playKeySound('action');
        handleClear();
      } else if (e.key === '%') {
        handlePercent();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleDigit,
    handleOperator,
    handleEqual,
    handleDelete,
    handleClear,
    handlePercent,
    settings.soundEnabled,
    settings.vibrationEnabled,
  ]);

  const isDark = settings.theme === 'dark';

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-300 pb-24 ${
        isDark ? 'bg-[#090F1E] text-slate-100' : 'bg-[#F8FAFC] text-slate-800'
      }`}
    >
      {/* Top Header */}
      <Header
        settings={settings}
        onUpdateSettings={updateSettings}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-md mx-auto px-3.5 sm:px-4 py-3 flex flex-col">
        {/* TAB 1: STANDARD CALCULATOR */}
        {currentTab === 'calculator' && (
          <div className="flex-1 flex flex-col justify-between">
            {/* Screen */}
            <CalculatorScreen
              expression={expression}
              displayValue={displayValue}
              memoryValue={memoryValue}
              settings={settings}
              onClear={handleClear}
              onDelete={handleDelete}
              isError={isError}
            />

            {/* Standard Keypad */}
            <div className="mt-auto">
              <StandardKeypad
                onDigit={handleDigit}
                onOperator={handleOperator}
                onClear={handleClear}
                onDelete={handleDelete}
                onEqual={handleEqual}
                onToggleSign={handleToggleSign}
                onPercent={handlePercent}
                settings={settings}
              />
            </div>
          </div>
        )}

        {/* TAB 2: SCIENTIFIC CALCULATOR */}
        {currentTab === 'scientific' && (
          <div className="flex-1 flex flex-col justify-between">
            {/* Screen */}
            <CalculatorScreen
              expression={expression}
              displayValue={displayValue}
              memoryValue={memoryValue}
              settings={settings}
              onClear={handleClear}
              onDelete={handleDelete}
              isError={isError}
            />

            {/* Scientific Function Bar */}
            <ScientificKeypad
              onInsertFunction={handleInsertFunction}
              onInsertConstant={handleInsertConstant}
              onMemoryAction={handleMemoryAction}
              settings={settings}
              onToggleAngleUnit={() =>
                updateSettings({
                  angleUnit: settings.angleUnit === 'deg' ? 'rad' : 'deg',
                })
              }
            />

            {/* Standard Keypad */}
            <div className="mt-auto">
              <StandardKeypad
                onDigit={handleDigit}
                onOperator={handleOperator}
                onClear={handleClear}
                onDelete={handleDelete}
                onEqual={handleEqual}
                onToggleSign={handleToggleSign}
                onPercent={handlePercent}
                settings={settings}
              />
            </div>
          </div>
        )}

        {/* TAB 3: PANZ AI ASSISTANT, PHOTO MATH, VOICE & EXPLAINER */}
        {currentTab === 'ai' && (
          <AiAssistantTab
            settings={settings}
            currentDisplay={displayValue}
            onInsertToCalculator={handleInsertValueFromExternal}
          />
        )}

        {/* TAB 4: FINANCIAL TOOLS & DAILY MATH CHALLENGE */}
        {currentTab === 'finance' && (
          <div className="flex flex-col gap-3">
            {/* Mini Toggle between Finance and Challenge */}
            <div
              className={`grid grid-cols-2 p-1 rounded-2xl border text-xs font-semibold ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}
            >
              <button
                onClick={() => setFinanceOrChallengeTab('finance')}
                className={`py-2 rounded-xl transition-all ${
                  financeOrChallengeTab === 'finance'
                    ? 'bg-blue-600 text-white shadow-md'
                    : isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kalkulator Finansial
              </button>
              <button
                onClick={() => setFinanceOrChallengeTab('challenge')}
                className={`py-2 rounded-xl transition-all ${
                  financeOrChallengeTab === 'challenge'
                    ? 'bg-blue-600 text-white shadow-md'
                    : isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tantangan Matematika Harian 🔥
              </button>
            </div>

            {financeOrChallengeTab === 'finance' ? (
              <FinancialCalculatorTab
                settings={settings}
                onInsertToCalculator={handleInsertValueFromExternal}
              />
            ) : (
              <DailyChallengeTab settings={settings} />
            )}
          </div>
        )}

        {/* TAB 5: SMART HISTORY, SETTINGS & ANDROID APK GUIDE */}
        {currentTab === 'history_settings' && (
          <HistoryAndSettingsTab
            history={history}
            onClearHistory={() => {
              setHistory([]);
              saveHistory([]);
            }}
            onDeleteHistoryItem={(id) => {
              const updated = history.filter((item) => item.id !== id);
              setHistory(updated);
              saveHistory(updated);
            }}
            onReuseHistory={handleReuseHistory}
            settings={settings}
            onUpdateSettings={updateSettings}
            deferredPrompt={deferredPrompt}
            onInstallPwa={handleInstallPwa}
          />
        )}
      </main>

      {/* Modern Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        settings={settings}
      />
    </div>
  );
}
