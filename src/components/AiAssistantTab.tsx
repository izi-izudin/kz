import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Camera,
  Mic,
  MicOff,
  BookOpen,
  Send,
  ArrowRight,
  Calculator,
  Upload,
  RefreshCw,
  Volume2,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { AppSettings, AiSolution, AiSubTab } from '../types';
import { translations } from '../utils/storageAndI18n';
import { playKeySound, triggerHaptic } from '../utils/soundAndHaptics';

interface AiAssistantTabProps {
  settings: AppSettings;
  currentDisplay: string;
  onInsertToCalculator: (value: string) => void;
  initialSubTab?: AiSubTab;
}

export const AiAssistantTab: React.FC<AiAssistantTabProps> = ({
  settings,
  currentDisplay,
  onInsertToCalculator,
  initialSubTab = 'assistant',
}) => {
  const t = translations[settings.language];
  const isDark = settings.theme === 'dark';
  const isEn = settings.language === 'en';

  const [subTab, setSubTab] = useState<AiSubTab>(initialSubTab);

  // AI Assistant Chat State
  const [chatPrompt, setChatPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSolution, setAiSolution] = useState<AiSolution | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Photo Calculator State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);
  const [photoSolution, setPhotoSolution] = useState<AiSolution | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice Calculator State
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceResult, setVoiceResult] = useState<{
    expression: string;
    result: string;
    insertValue: string;
    explanation?: string;
  } | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Math Explainer State
  const [selectedCategory, setSelectedCategory] = useState<'algebra' | 'geometry' | 'trig' | 'finance'>('geometry');
  const [explainerVars, setExplainerVars] = useState<Record<string, number>>({ a: 10, b: 15, h: 8, r: 7 });

  // Quick Prompt Chips
  const promptChips = isEn
    ? [
        'What is 25% of 500,000?',
        'Calculate loan payment for $10,000 at 5% for 3 years',
        'How to calculate area of triangle with base 12 and height 8?',
        'What is 125 × 45?',
        'Solve 2x + 7 = 25',
      ]
    : [
        'Berapa 25% dari 500.000?',
        'Hitungkan cicilan pinjaman Rp 50.000.000 bunga 6% 3 tahun',
        'Bagaimana cara menghitung luas segitiga alas 12 tinggi 8?',
        'Berapa hasil 125 × 45?',
        'Selesaikan persamaan 2x + 7 = 25',
      ];

  // Sample math images for quick testing
  const sampleEquations = [
    {
      title: isEn ? 'Quadratic Equation' : 'Persamaan Kuadrat',
      expr: 'x² - 5x + 6 = 0',
      description: 'ax² + bx + c = 0',
      svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100" viewBox="0 0 300 100"><rect width="100%" height="100%" fill="%230F172A"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="%2338BDF8" font-family="monospace" font-size="24" font-weight="bold">x² - 5x + 6 = 0</text></svg>`,
    },
    {
      title: isEn ? 'Trigonometry' : 'Trigonometri',
      expr: 'sin(30°) + cos(60°)',
      description: 'Identitas sudut istimewa',
      svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100" viewBox="0 0 300 100"><rect width="100%" height="100%" fill="%230F172A"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="%2338BDF8" font-family="monospace" font-size="22" font-weight="bold">sin(30°) + cos(60°)</text></svg>`,
    },
    {
      title: isEn ? 'Percentage Word Problem' : 'Soal Persentase',
      expr: 'Diskon 35% dari Rp 750.000',
      description: 'Perhitungan diskon toko',
      svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100" viewBox="0 0 300 100"><rect width="100%" height="100%" fill="%230F172A"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="%2338BDF8" font-family="sans-serif" font-size="18" font-weight="bold">Diskon 35% dari Rp 750.000</text></svg>`,
    },
  ];

  // Handle AI Assistant Question
  const handleAskAssistant = async (query?: string) => {
    const promptToSend = query || chatPrompt;
    if (!promptToSend.trim()) return;

    if (settings.soundEnabled) playKeySound('action');
    if (settings.vibrationEnabled) triggerHaptic(15);

    setIsAiLoading(true);
    setAiError(null);

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToSend,
          language: settings.language,
          context: { currentDisplay },
        }),
      });

      if (!res.ok) {
        throw new Error('Gagal menghubungi Panz AI');
      }

      const data: AiSolution = await res.json();
      setAiSolution(data);
      if (settings.soundEnabled) playKeySound('success');
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Terjadi kesalahan saat memproses pertanyaan.');
      if (settings.soundEnabled) playKeySound('error');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Handle Photo Upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSelectedImage(base64);
      setPhotoSolution(null);
      setPhotoError(null);
      // Auto-scan
      handleScanPhoto(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleScanPhoto = async (imageSrc?: string) => {
    const imgData = imageSrc || selectedImage;
    if (!imgData) return;

    if (settings.soundEnabled) playKeySound('action');
    setIsPhotoLoading(true);
    setPhotoError(null);

    try {
      const res = await fetch('/api/ai/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imgData,
          language: settings.language,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Gagal memindai gambar.');
      }

      const data: AiSolution = await res.json();
      setPhotoSolution(data);
      if (settings.soundEnabled) playKeySound('success');
    } catch (err: any) {
      console.error(err);
      setPhotoError(err.message || 'Gagal mengenali persamaan dalam gambar.');
      if (settings.soundEnabled) playKeySound('error');
    } finally {
      setIsPhotoLoading(false);
    }
  };

  // Voice Speech Recognition setup
  useEffect(() => {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = settings.language === 'en' ? 'en-US' : 'id-ID';

      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoiceTranscript(transcript);
        setIsListening(false);
        // Process transcript
        processVoiceCommand(transcript);
      };

      recognition.onerror = (e: any) => {
        console.error('Speech recognition error:', e);
        setIsListening(false);
        setVoiceError(isEn ? 'Could not capture voice. Please try typing.' : 'Gagal menangkap suara. Silakan coba kembali.');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [settings.language]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setVoiceError(
        isEn
          ? 'Web Speech API is not supported in this browser. Please type below.'
          : 'Fitur input suara belum didukung di browser ini. Silakan ketik pertanyaan di bawah.'
      );
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setVoiceError(null);
      setVoiceResult(null);
      try {
        recognitionRef.current.lang = settings.language === 'en' ? 'en-US' : 'id-ID';
        recognitionRef.current.start();
        setIsListening(true);
        if (settings.soundEnabled) playKeySound('action');
      } catch (err) {
        console.error(err);
      }
    }
  };

  const processVoiceCommand = async (transcript: string) => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/voice-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          language: settings.language,
        }),
      });
      const data = await res.json();
      setVoiceResult(data);
      if (settings.soundEnabled) playKeySound('success');

      // Optional text-to-speech feedback
      speakText(`${isEn ? 'Result is' : 'Hasilnya adalah'} ${data.result}`);
    } catch (err: any) {
      setVoiceError(err.message || 'Gagal memproses suara.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = settings.language === 'en' ? 'en-US' : 'id-ID';
        utterance.rate = 1.0;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Sub-tab navigation */}
      <div className={`grid grid-cols-4 p-1 rounded-2xl border text-xs font-semibold ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-200'
      }`}>
        <button
          onClick={() => setSubTab('assistant')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${
            subTab === 'assistant'
              ? 'bg-blue-600 text-white shadow-md'
              : isDark
              ? 'text-slate-400 hover:text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles size={14} />
          <span className="truncate">{t.subTabs.assistant}</span>
        </button>

        <button
          onClick={() => setSubTab('photo')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${
            subTab === 'photo'
              ? 'bg-blue-600 text-white shadow-md'
              : isDark
              ? 'text-slate-400 hover:text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Camera size={14} />
          <span className="truncate">{t.subTabs.photo}</span>
        </button>

        <button
          onClick={() => setSubTab('voice')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${
            subTab === 'voice'
              ? 'bg-blue-600 text-white shadow-md'
              : isDark
              ? 'text-slate-400 hover:text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Mic size={14} />
          <span className="truncate">{t.subTabs.voice}</span>
        </button>

        <button
          onClick={() => setSubTab('explainer')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${
            subTab === 'explainer'
              ? 'bg-blue-600 text-white shadow-md'
              : isDark
              ? 'text-slate-400 hover:text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen size={14} />
          <span className="truncate">{t.subTabs.explainer}</span>
        </button>
      </div>

      {/* 1. PANZ AI ASSISTANT CHAT */}
      {subTab === 'assistant' && (
        <div className="flex flex-col gap-3">
          {/* Input Box */}
          <div
            className={`p-3 rounded-2xl border transition-all ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={chatPrompt}
                onChange={(e) => setChatPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskAssistant()}
                placeholder={t.ai.askPlaceholder}
                className={`flex-1 bg-transparent text-sm focus:outline-none ${
                  isDark ? 'text-white placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'
                }`}
              />
              <button
                onClick={() => handleAskAssistant()}
                disabled={isAiLoading || !chatPrompt.trim()}
                className={`p-2.5 rounded-xl font-semibold transition-all flex items-center justify-center ${
                  chatPrompt.trim() && !isAiLoading
                    ? 'bg-blue-600 text-white hover:bg-blue-500 active:scale-95 shadow-md shadow-blue-500/20'
                    : 'bg-slate-800/40 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isAiLoading ? (
                  <RefreshCw size={16} className="animate-spin text-sky-400" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>

            {/* Prompt Chips */}
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-800/40">
              <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-1">
                <Sparkles size={11} className="text-sky-400" />
                Contoh:
              </span>
              {promptChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setChatPrompt(chip);
                    handleAskAssistant(chip);
                  }}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all text-left ${
                    isDark
                      ? 'bg-slate-800/70 border-slate-700/60 text-slate-300 hover:text-sky-400 hover:border-sky-500/50'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-400'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* AI Thinking Indicator */}
          {isAiLoading && (
            <div
              className={`p-5 rounded-2xl border flex items-center justify-center gap-3 animate-pulse ${
                isDark ? 'bg-slate-900/60 border-slate-800 text-sky-400' : 'bg-blue-50/80 border-blue-100 text-blue-600'
              }`}
            >
              <RefreshCw size={18} className="animate-spin" />
              <span className="text-sm font-medium">{t.ai.thinking}</span>
            </div>
          )}

          {/* Error Message */}
          {aiError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{aiError}</span>
            </div>
          )}

          {/* Solution Card */}
          {aiSolution && !isAiLoading && (
            <div
              className={`p-5 rounded-3xl border shadow-lg space-y-4 animate-in fade-in slide-in-from-bottom-2 ${
                isDark ? 'bg-slate-900/90 border-slate-800 shadow-black/30' : 'bg-white border-slate-200 shadow-slate-200/50'
              }`}
            >
              {/* Header / Expression */}
              <div className="flex items-center justify-between border-b pb-3 border-slate-800/40">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400">Pertanyaan</h4>
                    <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {aiSolution.expression}
                    </p>
                  </div>
                </div>
                {aiSolution.isOfflineMode && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Offline Solver
                  </span>
                )}
              </div>

              {/* Final Answer Big Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600/15 via-sky-500/15 to-transparent border border-blue-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-sky-400">Hasil Akhir:</span>
                  <div className={`text-2xl sm:text-3xl font-mono font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {aiSolution.result}
                  </div>
                </div>

                {aiSolution.canInsertToCalc && aiSolution.insertValue && (
                  <button
                    onClick={() => {
                      if (settings.soundEnabled) playKeySound('action');
                      onInsertToCalculator(aiSolution.insertValue || '');
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white shadow-md shadow-blue-500/20 transition-all"
                  >
                    <Calculator size={14} />
                    <span>{t.ai.insertToCalc}</span>
                  </button>
                )}
              </div>

              {/* Formula */}
              {aiSolution.formula && (
                <div className={`p-3 rounded-xl border text-xs font-mono ${isDark ? 'bg-slate-800/50 border-slate-700/50 text-sky-300' : 'bg-slate-50 border-slate-200 text-blue-700'}`}>
                  <span className="text-[10px] uppercase font-sans font-bold tracking-wider text-slate-400 block mb-1">
                    {t.ai.formulaUsed}
                  </span>
                  {aiSolution.formula}
                </div>
              )}

              {/* Steps */}
              {aiSolution.steps && aiSolution.steps.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-400 block">
                    {t.ai.steps}
                  </span>
                  <div className="space-y-1">
                    {aiSolution.steps.map((step, sIdx) => (
                      <div
                        key={sIdx}
                        className={`text-xs p-2.5 rounded-xl border font-mono flex items-start gap-2 ${
                          isDark ? 'bg-slate-800/40 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {sIdx + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Explanation */}
              {aiSolution.explanation && (
                <div className="space-y-1 pt-1">
                  <span className="text-xs font-bold text-slate-400 block">
                    {t.ai.explanation}
                  </span>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {aiSolution.explanation}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. PHOTO CALCULATOR */}
      {subTab === 'photo' && (
        <div className="flex flex-col gap-3">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />

          {/* Photo Upload / Camera Card */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer p-6 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center group ${
              isDark
                ? 'bg-slate-900/60 border-slate-700 hover:border-blue-500 hover:bg-slate-900/80'
                : 'bg-white border-slate-300 hover:border-blue-500 hover:bg-blue-50/20'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-600/10 text-blue-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Camera size={28} />
            </div>
            <h4 className={`text-sm font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {t.ai.uploadPrompt}
            </h4>
            <p className="text-xs text-slate-400 max-w-xs">
              {t.ai.uploadNotice}
            </p>
            <button
              type="button"
              className="mt-3 px-4 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20"
            >
              Pilih dari Galeri / Kamera
            </button>
          </div>

          {/* Sample Equations for Instant Demo */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
              <Sparkles size={12} className="text-sky-400" />
              {t.ai.sampleQuestions}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {sampleEquations.map((sample, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedImage(sample.svg);
                    handleScanPhoto(sample.svg);
                  }}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] ${
                    isDark
                      ? 'bg-slate-900/80 border-slate-800 hover:border-sky-500'
                      : 'bg-white border-slate-200 hover:border-blue-400 shadow-sm'
                  }`}
                >
                  <p className="text-xs font-bold text-sky-400">{sample.title}</p>
                  <p className={`text-xs font-mono font-semibold my-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {sample.expr}
                  </p>
                  <span className="text-[10px] text-slate-400">{sample.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Image Preview & Scanning Status */}
          {selectedImage && (
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400">Gambar yang dipilih</span>
                <button
                  onClick={() => handleScanPhoto()}
                  disabled={isPhotoLoading}
                  className="text-xs text-sky-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw size={12} className={isPhotoLoading ? 'animate-spin' : ''} />
                  Pindai Ulang
                </button>
              </div>
              <div className="max-h-48 overflow-hidden rounded-xl border border-slate-800 flex items-center justify-center bg-black/40">
                <img src={selectedImage} alt="Math upload" className="max-h-48 object-contain" />
              </div>
            </div>
          )}

          {isPhotoLoading && (
            <div className={`p-5 rounded-2xl border flex items-center justify-center gap-3 animate-pulse ${
              isDark ? 'bg-slate-900/60 border-slate-800 text-sky-400' : 'bg-blue-50 border-blue-100 text-blue-600'
            }`}>
              <RefreshCw size={18} className="animate-spin" />
              <span className="text-sm font-medium">{t.ai.scanning}</span>
            </div>
          )}

          {photoError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{photoError}</span>
            </div>
          )}

          {/* Photo Math Solution Output */}
          {photoSolution && !isPhotoLoading && (
            <div
              className={`p-5 rounded-3xl border shadow-lg space-y-4 animate-in fade-in slide-in-from-bottom-2 ${
                isDark ? 'bg-slate-900/90 border-slate-800 shadow-black/30' : 'bg-white border-slate-200 shadow-slate-200/50'
              }`}
            >
              <div className="flex items-center justify-between border-b pb-3 border-slate-800/40">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                    <Camera size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400">Soal Terdeteksi</h4>
                    <p className={`text-sm font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {photoSolution.expression}
                    </p>
                  </div>
                </div>
              </div>

              {/* Final Answer Big Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600/15 via-sky-500/15 to-transparent border border-blue-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-sky-400">Hasil Akhir:</span>
                  <div className={`text-2xl sm:text-3xl font-mono font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {photoSolution.result}
                  </div>
                </div>

                {photoSolution.canInsertToCalc && photoSolution.insertValue && (
                  <button
                    onClick={() => {
                      if (settings.soundEnabled) playKeySound('action');
                      onInsertToCalculator(photoSolution.insertValue || '');
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white shadow-md shadow-blue-500/20 transition-all"
                  >
                    <Calculator size={14} />
                    <span>{t.ai.insertToCalc}</span>
                  </button>
                )}
              </div>

              {/* Steps */}
              {photoSolution.steps && photoSolution.steps.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-400 block">{t.ai.steps}</span>
                  <div className="space-y-1">
                    {photoSolution.steps.map((step, sIdx) => (
                      <div
                        key={sIdx}
                        className={`text-xs p-2.5 rounded-xl border font-mono flex items-start gap-2 ${
                          isDark ? 'bg-slate-800/40 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {sIdx + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. VOICE CALCULATOR */}
      {subTab === 'voice' && (
        <div className="flex flex-col gap-4 items-center">
          {/* Big Mic Button */}
          <div className="relative py-4 flex flex-col items-center">
            {isListening && (
              <div className="absolute inset-0 m-auto w-24 h-24 rounded-full bg-blue-500/20 animate-ping pointer-events-none" />
            )}
            <button
              onClick={toggleListening}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95 ${
                isListening
                  ? 'bg-rose-600 text-white shadow-rose-600/40 animate-pulse'
                  : 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-blue-500/30 hover:scale-105'
              }`}
            >
              {isListening ? <MicOff size={32} /> : <Mic size={32} />}
            </button>
            <p className="mt-3 text-sm font-semibold text-center text-slate-300">
              {isListening ? t.ai.listening : t.ai.voicePrompt}
            </p>
          </div>

          {/* Voice status & transcript */}
          {voiceTranscript && (
            <div className={`w-full p-4 rounded-2xl border text-center ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'}`}>
              <span className="text-xs text-slate-400 block mb-1">{t.ai.voiceResult}</span>
              <p className="text-base font-bold text-sky-400">"{voiceTranscript}"</p>
            </div>
          )}

          {/* Voice Error */}
          {voiceError && (
            <div className="w-full p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{voiceError}</span>
            </div>
          )}

          {/* Voice Calculation Result */}
          {voiceResult && (
            <div className={`w-full p-5 rounded-3xl border shadow-lg space-y-3 ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">Persamaan Suara:</span>
                  <p className="text-sm font-mono font-bold text-white">{voiceResult.expression}</p>
                </div>
                <button
                  onClick={() => speakText(`${isEn ? 'Result is' : 'Hasilnya adalah'} ${voiceResult.result}`)}
                  className="p-2 rounded-xl bg-slate-800 text-sky-400 hover:bg-slate-700"
                  title="Baca suara"
                >
                  <Volume2 size={16} />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
                <div>
                  <span className="text-xs text-sky-400 font-semibold">Hasil:</span>
                  <div className="text-2xl font-mono font-bold text-white">{voiceResult.result}</div>
                </div>
                <button
                  onClick={() => onInsertToCalculator(voiceResult.insertValue || voiceResult.result)}
                  className="px-3 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-500 flex items-center gap-1.5 shadow-md"
                >
                  <Calculator size={14} />
                  <span>{t.ai.insertToCalc}</span>
                </button>
              </div>

              {voiceResult.explanation && (
                <p className="text-xs text-slate-400 leading-relaxed">{voiceResult.explanation}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. MATH EXPLAINER & FORMULA ENCYCLOPEDIA */}
      {subTab === 'explainer' && (
        <div className="flex flex-col gap-3">
          {/* Category Tabs */}
          <div className="grid grid-cols-4 gap-1.5 text-xs font-semibold">
            {[
              { id: 'geometry', label: 'Geometri' },
              { id: 'algebra', label: 'Aljabar' },
              { id: 'trig', label: 'Trigonometri' },
              { id: 'finance', label: 'Finansial' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`py-2 rounded-xl border text-center transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : isDark
                    ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Interactive Formula Card */}
          <div className={`p-5 rounded-3xl border shadow-lg space-y-4 ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            {selectedCategory === 'geometry' && (
              <>
                <div className="border-b border-slate-800/60 pb-3">
                  <h4 className="text-sm font-bold text-sky-400">Luas Segitiga</h4>
                  <p className="text-xs text-slate-400">L = 1/2 × alas × tinggi</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Alas (a)</label>
                    <input
                      type="number"
                      value={explainerVars.a}
                      onChange={(e) => setExplainerVars({ ...explainerVars, a: parseFloat(e.target.value) || 0 })}
                      className={`w-full p-2.5 rounded-xl border text-sm font-mono ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Tinggi (t)</label>
                    <input
                      type="number"
                      value={explainerVars.h}
                      onChange={(e) => setExplainerVars({ ...explainerVars, h: parseFloat(e.target.value) || 0 })}
                      className={`w-full p-2.5 rounded-xl border text-sm font-mono ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-sky-400 font-semibold">Hasil Luas:</span>
                    <div className="text-2xl font-mono font-bold text-white">
                      {(0.5 * explainerVars.a * explainerVars.h).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => onInsertToCalculator(String(0.5 * explainerVars.a * explainerVars.h))}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-500"
                  >
                    Salin ke Kalkulator
                  </button>
                </div>

                <div className="text-xs text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-300">Langkah Penyelesaian:</p>
                  <p>1. Masukkan nilai: L = 1/2 × {explainerVars.a} × {explainerVars.h}</p>
                  <p>2. Kalikan alas dan tinggi: {explainerVars.a * explainerVars.h}</p>
                  <p>3. Bagi dua: {(explainerVars.a * explainerVars.h) / 2}</p>
                </div>
              </>
            )}

            {selectedCategory === 'algebra' && (
              <>
                <div className="border-b border-slate-800/60 pb-3">
                  <h4 className="text-sm font-bold text-sky-400">Teorema Pythagoras</h4>
                  <p className="text-xs text-slate-400">c = √(a² + b²)</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Sisi a</label>
                    <input
                      type="number"
                      value={explainerVars.a}
                      onChange={(e) => setExplainerVars({ ...explainerVars, a: parseFloat(e.target.value) || 0 })}
                      className={`w-full p-2.5 rounded-xl border text-sm font-mono ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Sisi b</label>
                    <input
                      type="number"
                      value={explainerVars.b}
                      onChange={(e) => setExplainerVars({ ...explainerVars, b: parseFloat(e.target.value) || 0 })}
                      className={`w-full p-2.5 rounded-xl border text-sm font-mono ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-sky-400 font-semibold">Sisi Miring (c):</span>
                    <div className="text-2xl font-mono font-bold text-white">
                      {Math.hypot(explainerVars.a, explainerVars.b).toFixed(2)}
                    </div>
                  </div>
                  <button
                    onClick={() => onInsertToCalculator(Math.hypot(explainerVars.a, explainerVars.b).toFixed(2))}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-500"
                  >
                    Salin ke Kalkulator
                  </button>
                </div>
              </>
            )}

            {selectedCategory === 'trig' && (
              <>
                <div className="border-b border-slate-800/60 pb-3">
                  <h4 className="text-sm font-bold text-sky-400">Trigonometri Dasar</h4>
                  <p className="text-xs text-slate-400">sin²(θ) + cos²(θ) = 1</p>
                </div>
                <div className="space-y-2 text-xs text-slate-300">
                  <p>• <strong>Sinus (sin):</strong> Sisi Depan / Sisi Miring</p>
                  <p>• <strong>Cosinus (cos):</strong> Sisi Samping / Sisi Miring</p>
                  <p>• <strong>Tangen (tan):</strong> Sisi Depan / Sisi Samping (sin / cos)</p>
                  <p className="pt-2 text-slate-400">
                    Nilai sudut istimewa 0°, 30°, 45°, 60°, 90° dapat dihitung secara instan di tab Kalkulator Ilmiah.
                  </p>
                </div>
              </>
            )}

            {selectedCategory === 'finance' && (
              <>
                <div className="border-b border-slate-800/60 pb-3">
                  <h4 className="text-sm font-bold text-sky-400">Rumus Persentase & Margin</h4>
                  <p className="text-xs text-slate-400">Margin = ((Harga Jual - Modal) / Harga Jual) × 100%</p>
                </div>
                <div className="space-y-2 text-xs text-slate-300">
                  <p>• <strong>Diskon:</strong> Potongan = Harga Asli × (% / 100)</p>
                  <p>• <strong>Bunga Sederhana:</strong> Total = Pokok × (1 + (bunga × tahun))</p>
                  <p>• <strong>Bunga Majemuk:</strong> Total = Pokok × (1 + bunga)ⁿ</p>
                  <p className="pt-2 text-sky-400">
                    Gunakan tab Finansial di bawah untuk kalkulasi cicilan, tabungan, dan pajak otomatis!
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
