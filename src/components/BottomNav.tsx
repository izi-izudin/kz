import React from 'react';
import { Calculator, Atom, Sparkles, CircleDollarSign, History, Sliders } from 'lucide-react';
import { AppSettings, AppTab } from '../types';
import { translations } from '../utils/storageAndI18n';
import { playKeySound, triggerHaptic } from '../utils/soundAndHaptics';

interface BottomNavProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  settings: AppSettings;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  settings,
}) => {
  const t = translations[settings.language];
  const isDark = settings.theme === 'dark';

  const navItems: { id: AppTab; label: string; icon: React.ReactNode }[] = [
    { id: 'calculator', label: t.tabs.standard, icon: <Calculator size={19} /> },
    { id: 'scientific', label: t.tabs.scientific, icon: <Atom size={19} /> },
    { id: 'ai', label: t.tabs.ai, icon: <Sparkles size={19} /> },
    { id: 'finance', label: isDark ? 'Finansial' : 'Finance', icon: <CircleDollarSign size={19} /> },
    { id: 'history_settings', label: isDark ? 'Opsi' : 'More', icon: <Sliders size={19} /> },
  ];

  const handleSelect = (id: AppTab) => {
    if (settings.soundEnabled) playKeySound('action');
    if (settings.vibrationEnabled) triggerHaptic(12);
    onSelectTab(id);
  };

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-40 px-3 pt-2 pb-3 backdrop-blur-xl border-t transition-colors duration-200 safe-bottom ${
        isDark
          ? 'bg-slate-900/90 border-slate-800 text-slate-400'
          : 'bg-white/95 border-slate-200 text-slate-500 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]'
      }`}
    >
      <div className="max-w-md mx-auto grid grid-cols-5 gap-1">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all relative group select-none active:scale-90 ${
                isActive
                  ? isDark
                    ? 'text-sky-400 font-bold'
                    : 'text-blue-600 font-bold'
                  : 'hover:text-slate-300'
              }`}
            >
              {/* Highlight pill / active glow */}
              {isActive && (
                <div
                  className={`absolute inset-0 rounded-2xl -z-10 transition-all ${
                    isDark ? 'bg-sky-500/10' : 'bg-blue-500/10'
                  }`}
                />
              )}

              <div
                className={`transition-transform duration-200 ${
                  isActive ? 'scale-110' : 'group-hover:scale-105'
                }`}
              >
                {item.icon}
              </div>

              <span className="text-[10px] mt-1 tracking-tight truncate max-w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
