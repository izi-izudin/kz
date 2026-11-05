import React, { useState } from 'react';
import {
  History,
  Settings,
  Smartphone,
  Trash2,
  Copy,
  Check,
  Search,
  RotateCcw,
  Volume2,
  VolumeX,
  Vibrate,
  Moon,
  Sun,
  Globe,
  Shield,
  Info,
  Download,
  Code2,
  Terminal,
  ExternalLink,
} from 'lucide-react';
import { AppSettings, HistoryItem } from '../types';
import { translations, saveHistory } from '../utils/storageAndI18n';
import { playKeySound, triggerHaptic } from '../utils/soundAndHaptics';

interface HistoryAndSettingsTabProps {
  history: HistoryItem[];
  onClearHistory: () => void;
  onDeleteHistoryItem: (id: string) => void;
  onReuseHistory: (item: HistoryItem) => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  deferredPrompt: any;
  onInstallPwa: () => void;
}

export const HistoryAndSettingsTab: React.FC<HistoryAndSettingsTabProps> = ({
  history,
  onClearHistory,
  onDeleteHistoryItem,
  onReuseHistory,
  settings,
  onUpdateSettings,
  deferredPrompt,
  onInstallPwa,
}) => {
  const t = translations[settings.language];
  const isDark = settings.theme === 'dark';
  const isEn = settings.language === 'en';

  const [activeSubTab, setActiveSubTab] = useState<'history' | 'settings' | 'apk'>('history');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const handleCopy = async (text: string, id: string) => {
    try {
      if (settings.soundEnabled) playKeySound('action');
      if (settings.vibrationEnabled) triggerHaptic(15);
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {}
  };

  // Filter history
  const filteredHistory = history.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return item.expression.toLowerCase().includes(q) || item.result.toLowerCase().includes(q);
  });

  // Group by date
  const groupHistoryByDate = (items: HistoryItem[]) => {
    const groups: { [key: string]: HistoryItem[] } = {};
    const now = new Date();
    const todayStr = now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    items.forEach((item) => {
      const itemDate = new Date(item.timestamp).toDateString();
      let label = isEn ? 'Older' : 'Lebih Lama';
      if (itemDate === todayStr) {
        label = isEn ? 'Today' : 'Hari Ini';
      } else if (itemDate === yesterdayStr) {
        label = isEn ? 'Yesterday' : 'Kemarin';
      } else {
        label = new Date(item.timestamp).toLocaleDateString(isEn ? 'en-US' : 'id-ID', {
          month: 'short',
          day: 'numeric',
        });
      }

      if (!groups[label]) groups[label] = [];
      groups[label].push(item);
    });

    return groups;
  };

  const grouped = groupHistoryByDate(filteredHistory);

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Subtab navigation */}
      <div
        className={`grid grid-cols-3 p-1 rounded-2xl border text-xs font-semibold ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}
      >
        <button
          onClick={() => setActiveSubTab('history')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${
            activeSubTab === 'history'
              ? 'bg-blue-600 text-white shadow-md'
              : isDark
              ? 'text-slate-400 hover:text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <History size={14} />
          <span>{t.subTabs.history}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('settings')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${
            activeSubTab === 'settings'
              ? 'bg-blue-600 text-white shadow-md'
              : isDark
              ? 'text-slate-400 hover:text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Settings size={14} />
          <span>{t.subTabs.settings}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('apk')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${
            activeSubTab === 'apk'
              ? 'bg-blue-600 text-white shadow-md'
              : isDark
              ? 'text-slate-400 hover:text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Smartphone size={14} />
          <span>{t.subTabs.androidBuild}</span>
        </button>
      </div>

      {/* 1. SMART HISTORY */}
      {activeSubTab === 'history' && (
        <div className="flex flex-col gap-3">
          {/* Search bar & Clear all action */}
          <div className="flex items-center gap-2">
            <div
              className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border ${
                isDark ? 'bg-slate-900/80 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <Search size={14} className="text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isEn ? 'Search calculation history...' : 'Cari riwayat perhitungan...'}
                className="bg-transparent text-xs w-full focus:outline-none placeholder:text-slate-500"
              />
            </div>

            {history.length > 0 && (
              <button
                onClick={() => {
                  if (confirm(t.settings.clearConfirm)) {
                    onClearHistory();
                  }
                }}
                className={`p-2.5 rounded-xl border text-rose-400 transition-all ${
                  isDark ? 'bg-slate-900/80 border-slate-800 hover:bg-rose-950/40' : 'bg-white border-slate-200 hover:bg-rose-50'
                }`}
                title="Hapus Semua Riwayat"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>

          {/* Empty state */}
          {filteredHistory.length === 0 && (
            <div
              className={`p-8 rounded-3xl border text-center flex flex-col items-center justify-center ${
                isDark ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
              }`}
            >
              <History size={32} className="text-slate-500 mb-2 opacity-50" />
              <p className="text-xs font-medium">{t.calculator.historyEmpty}</p>
            </div>
          )}

          {/* Grouped History List */}
          {Object.entries(grouped).map(([dateLabel, items]) => (
            <div key={dateLabel} className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                {dateLabel}
              </span>
              <div className="space-y-1.5">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between group ${
                      isDark
                        ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                        : 'bg-white border-slate-200 hover:border-blue-300 shadow-sm'
                    }`}
                  >
                    {/* Clickable expression to load back into calculator */}
                    <div
                      onClick={() => onReuseHistory(item)}
                      className="cursor-pointer flex-1 pr-3"
                    >
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                        <span>{item.expression}</span>
                      </div>
                      <div className={`text-base font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        = {item.result}
                      </div>
                    </div>

                    {/* Actions: Copy & Delete */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopy(item.result, item.id)}
                        className={`p-2 rounded-xl transition-all ${
                          copiedId === item.id
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : isDark
                            ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                        }`}
                        title="Salin Hasil"
                      >
                        {copiedId === item.id ? <Check size={14} /> : <Copy size={14} />}
                      </button>

                      <button
                        onClick={() => onDeleteHistoryItem(item.id)}
                        className={`p-2 rounded-xl transition-all text-slate-400 hover:text-rose-400 ${
                          isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                        }`}
                        title="Hapus"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. SETTINGS */}
      {activeSubTab === 'settings' && (
        <div className="flex flex-col gap-4">
          {/* Card: Appearance */}
          <div
            className={`p-5 rounded-3xl border shadow-lg space-y-4 ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
              {t.settings.appearance}
            </h4>

            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isDark ? <Moon size={18} className="text-amber-400" /> : <Sun size={18} className="text-amber-500" />}
                <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {t.settings.theme}
                </span>
              </div>
              <div className="flex gap-1 p-0.5 rounded-xl border border-slate-700/50 bg-slate-800/40">
                <button
                  onClick={() => onUpdateSettings({ theme: 'dark' })}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                    isDark ? 'bg-blue-600 text-white' : 'text-slate-400'
                  }`}
                >
                  {t.settings.dark}
                </button>
                <button
                  onClick={() => onUpdateSettings({ theme: 'light' })}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                    !isDark ? 'bg-blue-600 text-white' : 'text-slate-400'
                  }`}
                >
                  {t.settings.light}
                </button>
              </div>
            </div>

            {/* Language Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-sky-400" />
                <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {t.settings.language}
                </span>
              </div>
              <div className="flex gap-1 p-0.5 rounded-xl border border-slate-700/50 bg-slate-800/40">
                <button
                  onClick={() => onUpdateSettings({ language: 'id' })}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                    settings.language === 'id' ? 'bg-blue-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Indonesia
                </button>
                <button
                  onClick={() => onUpdateSettings({ language: 'en' })}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                    settings.language === 'en' ? 'bg-blue-600 text-white' : 'text-slate-400'
                  }`}
                >
                  English
                </button>
              </div>
            </div>
          </div>

          {/* Card: Feedback (Sound & Vibration) */}
          <div
            className={`p-5 rounded-3xl border shadow-lg space-y-4 ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
              {t.settings.feedback}
            </h4>

            {/* Sound Effects */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {settings.soundEnabled ? <Volume2 size={18} className="text-blue-400" /> : <VolumeX size={18} className="text-slate-500" />}
                <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {t.settings.sound}
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
                className="w-5 h-5 accent-blue-600 cursor-pointer rounded"
              />
            </div>

            {/* Haptic Vibration */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Vibrate size={18} className="text-blue-400" />
                <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {t.settings.vibration}
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.vibrationEnabled}
                onChange={(e) => onUpdateSettings({ vibrationEnabled: e.target.checked })}
                className="w-5 h-5 accent-blue-600 cursor-pointer rounded"
              />
            </div>
          </div>

          {/* Card: Calculation Formatting */}
          <div
            className={`p-5 rounded-3xl border shadow-lg space-y-4 ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
              {t.settings.calculation}
            </h4>

            {/* Decimal places */}
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {t.settings.decimals}
              </span>
              <select
                value={settings.decimalPlaces}
                onChange={(e) => onUpdateSettings({ decimalPlaces: parseInt(e.target.value) })}
                className={`text-xs p-2 rounded-xl border font-mono ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <option value={-1}>{t.settings.auto}</option>
                <option value={2}>2 desimal</option>
                <option value={4}>4 desimal</option>
                <option value={6}>6 desimal</option>
              </select>
            </div>

            {/* Thousand separator */}
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {t.settings.thousandSep}
              </span>
              <select
                value={settings.thousandSeparator}
                onChange={(e) => onUpdateSettings({ thousandSeparator: e.target.value as any })}
                className={`text-xs p-2 rounded-xl border font-mono ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <option value="dot">{t.settings.dotExample}</option>
                <option value="comma">{t.settings.commaExample}</option>
              </select>
            </div>
          </div>

          {/* PWA Install Button */}
          {deferredPrompt && (
            <div className="p-4 rounded-3xl border border-blue-500/30 bg-gradient-to-r from-blue-600/20 via-sky-500/20 to-transparent flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Smartphone size={20} className="text-sky-400" />
                <div>
                  <h4 className="text-xs font-bold text-white">{t.settings.pwaInstall}</h4>
                  <p className="text-[10px] text-slate-400">Jalankan offline layaknya aplikasi native</p>
                </div>
              </div>
              <button
                onClick={onInstallPwa}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20"
              >
                Install
              </button>
            </div>
          )}

          {/* About App & Privacy */}
          <div
            className={`p-5 rounded-3xl border shadow-lg space-y-3 ${
              isDark ? 'bg-slate-900/90 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-md ring-1 ring-blue-500/30">
                <img
                  src="/assets/aistudio/Ikon_Aplikasi_Kalkulator_P_Biru_446c0cd6.png"
                  alt="PanzKalkulator"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-white">PanzKalkulator</h4>
                <p className="text-xs text-sky-400 font-medium">{t.settings.version}</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Kalkulator pintar multiguna berkecepatan tinggi dengan integrasi AI, pemindai foto soal matematika, pengenal suara, dan kalkulator finansial terpadu.
            </p>

            <div className="pt-2 border-t border-slate-800/40 flex items-center justify-between text-xs">
              <button
                onClick={() => setShowPrivacy(true)}
                className="text-sky-400 hover:underline flex items-center gap-1"
              >
                <Shield size={12} />
                <span>{t.settings.privacyPolicy}</span>
              </button>
              <span className="text-slate-500 text-[11px]">© 2026 Panz Tech Studio</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. CAPACITOR ANDROID APK BUILD GUIDE */}
      {activeSubTab === 'apk' && (
        <div className="flex flex-col gap-4">
          <div
            className={`p-5 rounded-3xl border shadow-lg space-y-4 ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400">
                <Smartphone size={22} />
              </div>
              <div>
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {t.apk.title}
                </h3>
                <p className="text-xs text-slate-400">{t.apk.subtitle}</p>
              </div>
            </div>

            {/* Step 1 */}
            <div className="p-3.5 rounded-2xl border border-slate-800/60 bg-slate-800/30 space-y-1.5">
              <span className="text-xs font-bold text-sky-400">{t.apk.step1Title}</span>
              <p className="text-xs text-slate-300">{t.apk.step1Desc}</p>
              <div className="p-2.5 rounded-xl bg-slate-950 font-mono text-[11px] text-emerald-400 border border-slate-800 flex items-center justify-between">
                <span>npm install @capacitor/core @capacitor/cli @capacitor/android</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 rounded-2xl border border-slate-800/60 bg-slate-800/30 space-y-1.5">
              <span className="text-xs font-bold text-sky-400">{t.apk.step2Title}</span>
              <p className="text-xs text-slate-300">Tambahkan folder native Android ke dalam proyek:</p>
              <div className="p-2.5 rounded-xl bg-slate-950 font-mono text-[11px] text-emerald-400 border border-slate-800">
                npx cap add android
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 rounded-2xl border border-slate-800/60 bg-slate-800/30 space-y-1.5">
              <span className="text-xs font-bold text-sky-400">{t.apk.step3Title}</span>
              <p className="text-xs text-slate-300">Kompilasi web assets ke folder dist lalu sinkronkan:</p>
              <div className="p-2.5 rounded-xl bg-slate-950 font-mono text-[11px] text-emerald-400 border border-slate-800 space-y-1">
                <p>npm run build</p>
                <p>npx cap sync</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-3.5 rounded-2xl border border-slate-800/60 bg-slate-800/30 space-y-1.5">
              <span className="text-xs font-bold text-sky-400">{t.apk.step4Title}</span>
              <p className="text-xs text-slate-300">Buka langsung di Android Studio untuk generate APK / AAB:</p>
              <div className="p-2.5 rounded-xl bg-slate-950 font-mono text-[11px] text-emerald-400 border border-slate-800">
                npx cap open android
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                Di Android Studio, pilih menu <strong>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong>.
              </p>
            </div>

            {/* Capacitor Config Preview */}
            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Code2 size={13} className="text-sky-400" />
                capacitor.config.json (Sudah Dikonfigurasi)
              </span>
              <pre className="p-3 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-[10px] text-slate-300 overflow-x-auto">
{`{
  "appId": "com.panzkalkulator.app",
  "appName": "PanzKalkulator",
  "webDir": "dist",
  "bundledWebRuntime": false
}`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`max-w-md w-full p-6 rounded-3xl border shadow-2xl space-y-3 ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-800">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Shield size={16} className="text-blue-500" />
                {t.settings.privacyPolicy}
              </h3>
              <button
                onClick={() => setShowPrivacy(false)}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                Tutup
              </button>
            </div>
            <div className="text-xs space-y-2 leading-relaxed text-slate-400 max-h-60 overflow-y-auto">
              <p>
                <strong>PanzKalkulator</strong> menghormati privasi data Anda. Aplikasi ini berjalan secara lokal di perangkat Anda:
              </p>
              <p>
                1. <strong>Penyimpanan Lokal:</strong> Riwayat perhitungan, preferensi tema, dan statistik kuis disimpan di LocalStorage perangkat Anda dan tidak dibagikan ke pihak ketiga.
              </p>
              <p>
                2. <strong>Kalkulator Dasar:</strong> Berfungsi 100% offline tanpa koneksi internet.
              </p>
              <p>
                3. <strong>Fitur AI:</strong> Pertanyaan atau foto soal yang dikirim ke Panz AI diproses secara anonim dan aman melalui server-side proxy Google Gemini API tanpa menyimpan identitas pengguna.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
