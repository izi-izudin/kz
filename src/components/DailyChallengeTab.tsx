import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Flame, Trophy, Timer, Play, RotateCcw, CheckCircle2, XCircle, Award } from 'lucide-react';
import { AppSettings, ChallengeQuestion } from '../types';
import { translations, loadChallengeStats, saveChallengeStats } from '../utils/storageAndI18n';
import { playKeySound, triggerHaptic } from '../utils/soundAndHaptics';

interface DailyChallengeTabProps {
  settings: AppSettings;
}

export const DailyChallengeTab: React.FC<DailyChallengeTabProps> = ({ settings }) => {
  const t = translations[settings.language];
  const isDark = settings.theme === 'dark';

  const [stats, setStats] = useState(loadChallengeStats);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<ChallengeQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Generate dynamic question
  const generateQuestion = (diff: 'easy' | 'medium' | 'hard'): ChallengeQuestion => {
    let question = '';
    let correct = 0;
    let explanation = '';

    if (diff === 'easy') {
      const type = Math.floor(Math.random() * 3);
      if (type === 0) {
        // Addition
        const a = Math.floor(Math.random() * 80) + 10;
        const b = Math.floor(Math.random() * 80) + 10;
        correct = a + b;
        question = `${a} + ${b} = ?`;
        explanation = `${a} + ${b} = ${correct}`;
      } else if (type === 1) {
        // Subtraction
        const a = Math.floor(Math.random() * 90) + 20;
        const b = Math.floor(Math.random() * a);
        correct = a - b;
        question = `${a} − ${b} = ?`;
        explanation = `${a} − ${b} = ${correct}`;
      } else {
        // Simple multiplication
        const a = Math.floor(Math.random() * 12) + 2;
        const b = Math.floor(Math.random() * 12) + 2;
        correct = a * b;
        question = `${a} × ${b} = ?`;
        explanation = `${a} × ${b} = ${correct}`;
      }
    } else if (diff === 'medium') {
      const type = Math.floor(Math.random() * 3);
      if (type === 0) {
        // Chained arithmetic
        const a = Math.floor(Math.random() * 15) + 5;
        const b = Math.floor(Math.random() * 8) + 2;
        const c = Math.floor(Math.random() * 20) + 1;
        correct = a * b + c;
        question = `(${a} × ${b}) + ${c} = ?`;
        explanation = `${a} × ${b} = ${a * b}, lalu + ${c} = ${correct}`;
      } else if (type === 1) {
        // Percentage
        const p = [10, 20, 25, 50][Math.floor(Math.random() * 4)];
        const total = (Math.floor(Math.random() * 20) + 2) * 50;
        correct = (p / 100) * total;
        question = `${p}% dari ${total} = ?`;
        explanation = `${p}% × ${total} = ${correct}`;
      } else {
        // Powers / Roots
        const base = Math.floor(Math.random() * 12) + 2;
        correct = base * base;
        question = `√${correct} = ?`;
        explanation = `${base}² = ${correct}, maka √${correct} = ${base}`;
        correct = base;
      }
    } else {
      // Hard: Algebra / Order of Operations
      const type = Math.floor(Math.random() * 3);
      if (type === 0) {
        const x = Math.floor(Math.random() * 15) + 2;
        const a = Math.floor(Math.random() * 6) + 2;
        const b = Math.floor(Math.random() * 20) + 5;
        const total = a * x + b;
        question = `Jika ${a}x + ${b} = ${total}, nilai x = ?`;
        correct = x;
        explanation = `${a}x = ${total} - ${b} = ${total - b} → x = ${x}`;
      } else if (type === 1) {
        const a = Math.floor(Math.random() * 10) + 3;
        const b = Math.floor(Math.random() * 10) + 3;
        const c = Math.floor(Math.random() * 4) + 2;
        correct = a * b - Math.pow(c, 2);
        question = `${a} × ${b} − ${c}² = ?`;
        explanation = `${a * b} − ${Math.pow(c, 2)} = ${correct}`;
      } else {
        const p = 15;
        const total = 400;
        correct = 60;
        question = `15% dari 400 + 12² = ?`;
        correct = 60 + 144;
        explanation = `60 + 144 = 204`;
      }
    }

    // Generate 3 plausible distractors
    const options = new Set<string>();
    options.add(String(correct));
    while (options.size < 4) {
      const delta = (Math.floor(Math.random() * 5) + 1) * (Math.random() > 0.5 ? 1 : -1);
      const fake = correct + delta;
      if (fake >= 0) options.add(String(fake));
    }

    const shuffled = Array.from(options).sort(() => Math.random() - 0.5);

    return {
      id: Math.random().toString(),
      question,
      options: shuffled,
      correctAnswer: String(correct),
      explanation,
      difficulty: diff,
    };
  };

  const startGame = () => {
    if (settings.soundEnabled) playKeySound('action');
    if (settings.vibrationEnabled) triggerHaptic(20);

    setScore(0);
    setTimeLeft(30);
    setFeedback(null);
    setSelectedOption(null);
    setIsPlaying(true);
    setCurrentQuestion(generateQuestion(difficulty));
  };

  const endGame = () => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);

    const todayStr = new Date().toISOString().split('T')[0];
    const isNewDay = stats.lastPlayedDate !== todayStr;
    const newStreak = isNewDay ? stats.streak + 1 : stats.streak;
    const newHighScore = Math.max(stats.highScore, score);

    const updatedStats = {
      streak: newStreak,
      lastPlayedDate: todayStr,
      highScore: newHighScore,
      totalCorrect: stats.totalCorrect + Math.floor(score / 10),
      totalPlayed: stats.totalPlayed + 1,
    };

    setStats(updatedStats);
    saveChallengeStats(updatedStats);

    if (score > 30) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
      if (settings.soundEnabled) playKeySound('success');
    }
  };

  // Timer countdown
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, score]);

  const handleSelectOption = (opt: string) => {
    if (!currentQuestion || selectedOption) return;

    setSelectedOption(opt);
    const isCorrect = opt === currentQuestion.correctAnswer;

    if (isCorrect) {
      if (settings.soundEnabled) playKeySound('success');
      if (settings.vibrationEnabled) triggerHaptic(15);
      setScore((s) => s + 10);
      setFeedback({ isCorrect: true, text: t.challenge.correct });
    } else {
      if (settings.soundEnabled) playKeySound('error');
      if (settings.vibrationEnabled) triggerHaptic(30);
      setFeedback({
        isCorrect: false,
        text: `${t.challenge.wrong} (${currentQuestion.explanation})`,
      });
    }

    setTimeout(() => {
      setSelectedOption(null);
      setFeedback(null);
      if (isPlaying) {
        setCurrentQuestion(generateQuestion(difficulty));
      }
    }, 1200);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Header Stats Bar */}
      <div className="grid grid-cols-3 gap-2">
        <div
          className={`p-3 rounded-2xl border text-center flex flex-col items-center ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-1 text-amber-500 text-xs font-bold mb-0.5">
            <Flame size={15} />
            <span>Streak</span>
          </div>
          <span className="text-xl font-extrabold text-amber-400 font-mono">
            {stats.streak} {t.challenge.streak.split(' ')[0]}
          </span>
        </div>

        <div
          className={`p-3 rounded-2xl border text-center flex flex-col items-center ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-1 text-blue-400 text-xs font-bold mb-0.5">
            <Trophy size={15} />
            <span>High Score</span>
          </div>
          <span className="text-xl font-extrabold text-sky-400 font-mono">
            {stats.highScore}
          </span>
        </div>

        <div
          className={`p-3 rounded-2xl border text-center flex flex-col items-center ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold mb-0.5">
            <Award size={15} />
            <span>Akurasi</span>
          </div>
          <span className="text-xl font-extrabold text-emerald-400 font-mono">
            {stats.totalPlayed > 0
              ? `${Math.round((stats.totalCorrect / (stats.totalPlayed * 3)) * 100)}%`
              : '100%'}
          </span>
        </div>
      </div>

      {/* Main Challenge Card */}
      <div
        className={`p-6 rounded-3xl border shadow-xl flex flex-col items-center justify-center text-center transition-all ${
          isDark
            ? 'bg-gradient-to-b from-slate-900/90 to-slate-950/90 border-slate-800 shadow-black/40'
            : 'bg-white border-slate-200 shadow-slate-200/60'
        }`}
      >
        {!isPlaying ? (
          <div className="space-y-4 py-2 w-full max-w-sm">
            <div className="w-16 h-16 rounded-3xl bg-blue-600/15 text-blue-500 flex items-center justify-center mx-auto shadow-inner">
              <Timer size={32} />
            </div>

            <div>
              <h3 className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {t.challenge.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1">{t.challenge.desc}</p>
            </div>

            {/* Difficulty Selector */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              {[
                { id: 'easy', label: t.challenge.easy },
                { id: 'medium', label: t.challenge.medium },
                { id: 'hard', label: t.challenge.hard },
              ].map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDifficulty(d.id as any)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    difficulty === d.id
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                      : isDark
                      ? 'bg-slate-800/60 border-slate-700 text-slate-300'
                      : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <button
              onClick={startGame}
              className="w-full py-3.5 mt-2 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Play size={18} />
              <span>{t.challenge.startGame} (30s)</span>
            </button>
          </div>
        ) : (
          <div className="w-full space-y-4">
            {/* Timer and Score bar */}
            <div className="flex items-center justify-between border-b pb-3 border-slate-800/60">
              <div className="flex items-center gap-1.5 text-rose-400 font-mono font-bold text-sm">
                <Timer size={16} />
                <span>{timeLeft}s</span>
              </div>

              <div className="text-xs font-semibold text-slate-400">
                Skor:{' '}
                <span className="text-base font-extrabold font-mono text-sky-400">
                  {score}
                </span>
              </div>
            </div>

            {/* Question Text */}
            <div className="py-4">
              <span className="text-xs font-semibold text-slate-400 block mb-1">
                Hitung Soal Ini:
              </span>
              <h2
                className={`text-2xl sm:text-3xl font-mono font-extrabold tracking-tight ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {currentQuestion?.question}
              </h2>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-2 gap-3 w-full">
              {currentQuestion?.options.map((opt, oIdx) => {
                let btnStyle = isDark
                  ? 'bg-slate-800/80 border-slate-700 text-white hover:bg-slate-700'
                  : 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200';

                if (selectedOption) {
                  if (opt === currentQuestion.correctAnswer) {
                    btnStyle = 'bg-emerald-600 text-white border-emerald-500 shadow-md';
                  } else if (opt === selectedOption) {
                    btnStyle = 'bg-rose-600 text-white border-rose-500 shadow-md';
                  }
                }

                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelectOption(opt)}
                    disabled={!!selectedOption}
                    className={`py-3.5 rounded-2xl font-mono font-bold text-lg border transition-all active:scale-95 ${btnStyle}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Instant Feedback */}
            {feedback && (
              <div
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 animate-in fade-in ${
                  feedback.isCorrect
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}
              >
                {feedback.isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                <span>{feedback.text}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
