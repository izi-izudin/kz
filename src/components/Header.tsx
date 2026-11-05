import React from 'react';
import { Sun, Moon, Volume2, VolumeX, Smartphone, Sparkles, BookOpen } from 'lucide-react';
import { AppSettings, AppTab } from '../types';
import { translations } from '../utils/storageAndI18n';
import { playKeySound, triggerHaptic } from '../utils/soundAndHaptics';

interface HeaderProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onUpdateSettings,
  currentTab,
  onSelectTab,
}) => {
  const t = translations[settings.language];
  const isDark = settings.theme === 'dark';

  const toggleTheme = () => {
    if (settings.soundEnabled) playKeySound('action');
    if (settings.vibrationEnabled) triggerHaptic(15);
    onUpdateSettings({ theme: isDark ? 'light' : 'dark' });
  };

  const toggleSound = () => {
    if (settings.vibrationEnabled) triggerHaptic(15);
    onUpdateSettings({ soundEnabled: !settings.soundEnabled });
  };

  const toggleAngle = () => {
    if (settings.soundEnabled) playKeySound('action');
    if (settings.vibrationEnabled) triggerHaptic(15);
    onUpdateSettings({ angleUnit: settings.angleUnit === 'deg' ? 'rad' : 'deg' });
  };

  return (
    <header className={`sticky top-0 z-40 px-4 py-2.5 transition-colors duration-200 border-b backdrop-blur-md safe-top ${
      isDark 
        ? 'bg-slate-900/85 border-slate-800 text-slate-100' 
        : 'bg-white/90 border-slate-200 text-slate-800'
    }`}>
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand / Logo */}
        <div 
          onClick={() => onSelectTab('calculator')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-md shadow-blue-500/20 ring-1 ring-blue-500/30 transition-transform duration-200 group-hover:scale-105">
            <img 
              src="/assets/aistudio/Ikon_Aplikasi_Kalkulator_P_Biru_446c0cd6.png" 
              alt="PanzKalkulator Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-blue-500 via-sky-400 to-blue-600 bg-clip-text text-transparent">
                PanzKalkulator
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                PRO
              </span>
            </div>
            <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} line-clamp-1`}>
              Smart Math & AI Assistant
            </p>
          </div>
        </div>

        {/* Action icons / Quick controls */}
        <div className="flex items-center gap-1.5">
          {/* Angle unit toggle for quick math access */}
          <button
            onClick={toggleAngle}
            title={`Mode Sudut: ${settings.angleUnit.toUpperCase()}`}
            className={`px-2 py-1 text-xs font-mono font-bold rounded-lg border transition-all ${
              isDark 
                ? 'bg-slate-800/80 border-slate-700 text-sky-400 hover:border-sky-500/50' 
                : 'bg-slate-100 border-slate-300 text-blue-600 hover:border-blue-400'
            }`}
          >
            {settings.angleUnit.toUpperCase()}
          </button>

          {/* Sound toggle */}
          <button
            onClick={toggleSound}
            title={settings.soundEnabled ? 'Matikan Suara' : 'Aktifkan Suara'}
            className={`p-2 rounded-lg border transition-all ${
              isDark 
                ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600' 
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            {settings.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} className="text-slate-400" />}
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Mode Terang' : 'Mode Gelap'}
            className={`p-2 rounded-lg border transition-all ${
              isDark 
                ? 'bg-slate-800/80 border-slate-700 text-amber-400 hover:border-amber-400/50' 
                : 'bg-slate-100 border-slate-200 text-amber-500 hover:border-amber-400'
            }`}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>
    </header>
  );
};
