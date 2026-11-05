import { AppSettings, HistoryItem } from '../types';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  language: 'id',
  soundEnabled: true,
  vibrationEnabled: true,
  decimalPlaces: -1, // Auto
  thousandSeparator: 'dot',
  angleUnit: 'deg',
};

const SETTINGS_KEY = 'panzkalkulator_settings';
const HISTORY_KEY = 'panzkalkulator_history';
const MEMORY_KEY = 'panzkalkulator_memory';
const CHALLENGE_KEY = 'panzkalkulator_challenge';

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

export function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveHistory(items: HistoryItem[]) {
  try {
    // Keep last 100 entries
    const trimmed = items.slice(0, 100);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch {}
}

export function loadMemory(): number {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    if (raw) return parseFloat(raw) || 0;
  } catch {}
  return 0;
}

export function saveMemory(val: number) {
  try {
    localStorage.setItem(MEMORY_KEY, String(val));
  } catch {}
}

export interface ChallengeStats {
  streak: number;
  lastPlayedDate: string;
  highScore: number;
  totalCorrect: number;
  totalPlayed: number;
}

export function loadChallengeStats(): ChallengeStats {
  try {
    const raw = localStorage.getItem(CHALLENGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    streak: 0,
    lastPlayedDate: '',
    highScore: 0,
    totalCorrect: 0,
    totalPlayed: 0,
  };
}

export function saveChallengeStats(stats: ChallengeStats) {
  try {
    localStorage.setItem(CHALLENGE_KEY, JSON.stringify(stats));
  } catch {}
}

// i18n Dictionary
export const translations = {
  id: {
    appName: 'PanzKalkulator',
    tagline: 'Kalkulator Pintar Generasi Baru',
    greeting: 'Halo, mau hitung apa hari ini?',
    tabs: {
      standard: 'Standar',
      scientific: 'Ilmiah',
      ai: 'Panz AI',
      finance: 'Finansial & Kuis',
      history_settings: 'Riwayat & Opsi',
    },
    subTabs: {
      assistant: 'Asisten AI',
      photo: 'Foto Soal',
      voice: 'Suara',
      explainer: 'Penjelas Rumus',
      financeTools: 'Kalkulator Finansial',
      challenge: 'Tantangan Harian',
      history: 'Riwayat',
      settings: 'Pengaturan',
      androidBuild: 'Build APK',
    },
    calculator: {
      copied: 'Hasil disalin ke clipboard!',
      copy: 'Salin',
      clear: 'Hapus Semua',
      del: 'Hapus Karakter',
      memoryStored: 'Tersimpan di Memori',
      memoryCleared: 'Memori Dikosongkan',
      deg: 'DEG',
      rad: 'RAD',
      historyEmpty: 'Belum ada riwayat perhitungan',
    },
    ai: {
      askPlaceholder: 'Tanyakan soal matematika atau keuangan...',
      send: 'Kirim',
      thinking: 'Panz AI sedang menganalisa...',
      insertToCalc: 'Masukkan ke Kalkulator',
      formulaUsed: 'Rumus yang digunakan',
      steps: 'Langkah Perhitungan',
      explanation: 'Penjelasan',
      uploadPrompt: 'Ambil Foto atau Pilih Gambar Soal',
      uploadNotice: 'Dukung tulisan tangan, persamaan cetak, aljabar, dan geometri.',
      scanNow: 'Pindai Soal dengan AI',
      scanning: 'Sedang memindai gambar...',
      sampleQuestions: 'Contoh Soal Cepat',
      voicePrompt: 'Tekan mikrofon dan ucapkan soal matematika...',
      listening: 'Mendengarkan suara Anda...',
      stopListening: 'Hentikan',
      voiceResult: 'Teks terdeteksi',
      speechSynthesis: 'Baca Suara',
    },
    finance: {
      discount: 'Diskon',
      tax: 'Pajak / PPN',
      loan: 'Cicilan Pinjaman',
      savings: 'Tabungan & Investasi',
      profit: 'Untung & Rugi',
      tip: 'Tip & Bagi Tagihan',
      originalPrice: 'Harga Asli',
      discountPercent: 'Diskon (%)',
      finalPrice: 'Harga Akhir',
      savingsAmount: 'Total Hemat',
      taxRate: 'Tarif Pajak (%)',
      priceBeforeTax: 'Harga Sebelum Pajak',
      priceAfterTax: 'Harga Setelah Pajak',
      taxAmount: 'Nominal Pajak',
      principal: 'Jumlah Pinjaman',
      interestRate: 'Suku Bunga (%) / Tahun',
      tenureMonths: 'Jangka Waktu (Bulan)',
      monthlyPayment: 'Cicilan per Bulan',
      totalInterest: 'Total Bunga',
      totalPayment: 'Total Pembayaran',
      initialDeposit: 'Setoran Awal',
      monthlyDeposit: 'Setoran Bulanan',
      annualReturn: 'Estimasi Bunga (%) / Tahun',
      durationYears: 'Jangka Waktu (Tahun)',
      futureValue: 'Estimasi Nilai Akhir',
      totalInvested: 'Total Modal Disetor',
      totalGains: 'Total Keuntungan',
      buyPrice: 'Harga Beli (Modal)',
      sellPrice: 'Harga Jual',
      grossProfit: 'Laba Bersih',
      margin: 'Margin Laba (%)',
      billAmount: 'Total Tagihan',
      tipPercent: 'Tip (%)',
      peopleCount: 'Jumlah Orang',
      totalWithTip: 'Total + Tip',
      perPerson: 'Bayar per Orang',
      calculate: 'Hitung Sekarang',
    },
    challenge: {
      title: 'Tantangan Matematika Harian',
      desc: 'Latih ketajaman otak dan pertahankan streak setiap hari!',
      streak: 'Hari Berturut-turut',
      score: 'Skor Saat Ini',
      highScore: 'Skor Tertinggi',
      timeLeft: 'Sisa Waktu',
      startGame: 'Mulai Tantangan',
      playAgain: 'Main Lagi',
      gameOver: 'Waktu Habis!',
      correct: 'Tepat Sekali! +10 Poin',
      wrong: 'Kurang Tepat!',
      easy: 'Mudah',
      medium: 'Sedang',
      hard: 'Sulit',
    },
    settings: {
      appearance: 'Tampilan',
      theme: 'Tema Aplikasi',
      dark: 'Mode Gelap',
      light: 'Mode Terang',
      language: 'Bahasa',
      feedback: 'Umpan Balik',
      sound: 'Efek Suara Tombol',
      vibration: 'Getaran Tombol (Haptic)',
      calculation: 'Perhitungan',
      decimals: 'Presisi Angka Desimal',
      auto: 'Otomatis',
      thousandSep: 'Format Pemisah Ribuan',
      dotExample: 'Titik (1.000,50 - ID)',
      commaExample: 'Koma (1,000.50 - EN)',
      dataManagement: 'Manajemen Data',
      clearHistory: 'Hapus Semua Riwayat',
      clearConfirm: 'Apakah Anda yakin ingin menghapus semua riwayat?',
      historyCleared: 'Semua riwayat berhasil dihapus',
      about: 'Tentang PanzKalkulator',
      version: 'Versi 1.2.0 (Pro Edition)',
      developer: 'Panz Tech Studio',
      privacyPolicy: 'Kebijakan Privasi',
      pwaInstall: 'Pasang Aplikasi di Perangkat (PWA)',
      pwaInstalled: 'Aplikasi Sudah Terpasang',
    },
    apk: {
      title: 'Panduan Ekspor Android APK',
      subtitle: 'Siapkan dan build APK asli menggunakan Capacitor & Android Studio',
      step1Title: '1. Persiapan Folder & Dependencies',
      step1Desc: 'Aplikasi sudah dilengkapi file capacitor.config.json siap pakai.',
      step2Title: '2. Tambahkan Platform Android',
      step3Title: '3. Build & Sinkronisasi',
      step4Title: '4. Buka di Android Studio & Generate APK',
      downloadConfig: 'Unduh File Konfigurasi Capacitor',
    },
  },
  en: {
    appName: 'PanzKalkulator',
    tagline: 'Next-Gen Smart Calculator',
    greeting: 'Hello, what would you like to calculate today?',
    tabs: {
      standard: 'Standard',
      scientific: 'Scientific',
      ai: 'Panz AI',
      finance: 'Finance & Quiz',
      history_settings: 'History & More',
    },
    subTabs: {
      assistant: 'AI Assistant',
      photo: 'Photo Math',
      voice: 'Voice',
      explainer: 'Formula Explainer',
      financeTools: 'Financial Tools',
      challenge: 'Daily Challenge',
      history: 'History',
      settings: 'Settings',
      androidBuild: 'Build APK',
    },
    calculator: {
      copied: 'Result copied to clipboard!',
      copy: 'Copy',
      clear: 'Clear All',
      del: 'Delete',
      memoryStored: 'Saved to Memory',
      memoryCleared: 'Memory Cleared',
      deg: 'DEG',
      rad: 'RAD',
      historyEmpty: 'No calculation history yet',
    },
    ai: {
      askPlaceholder: 'Ask any math or financial problem...',
      send: 'Send',
      thinking: 'Panz AI is analyzing...',
      insertToCalc: 'Insert to Calculator',
      formulaUsed: 'Formula Used',
      steps: 'Calculation Steps',
      explanation: 'Explanation',
      uploadPrompt: 'Take a Photo or Select Math Image',
      uploadNotice: 'Supports handwritten equations, printed text, algebra & geometry.',
      scanNow: 'Scan Equation with AI',
      scanning: 'Scanning image...',
      sampleQuestions: 'Quick Sample Equations',
      voicePrompt: 'Tap microphone and speak your math problem...',
      listening: 'Listening to your voice...',
      stopListening: 'Stop',
      voiceResult: 'Detected speech',
      speechSynthesis: 'Read Aloud',
    },
    finance: {
      discount: 'Discount',
      tax: 'Tax / VAT',
      loan: 'Loan / EMI',
      savings: 'Savings & Investment',
      profit: 'Profit & Loss',
      tip: 'Tip & Split Bill',
      originalPrice: 'Original Price',
      discountPercent: 'Discount (%)',
      finalPrice: 'Final Price',
      savingsAmount: 'Total Saved',
      taxRate: 'Tax Rate (%)',
      priceBeforeTax: 'Price Before Tax',
      priceAfterTax: 'Price After Tax',
      taxAmount: 'Tax Amount',
      principal: 'Loan Amount',
      interestRate: 'Interest Rate (%) / Year',
      tenureMonths: 'Term (Months)',
      monthlyPayment: 'Monthly Payment (EMI)',
      totalInterest: 'Total Interest',
      totalPayment: 'Total Payment',
      initialDeposit: 'Initial Deposit',
      monthlyDeposit: 'Monthly Deposit',
      annualReturn: 'Estimated Return (%) / Year',
      durationYears: 'Duration (Years)',
      futureValue: 'Future Value',
      totalInvested: 'Total Invested',
      totalGains: 'Total Gains',
      buyPrice: 'Cost Price',
      sellPrice: 'Selling Price',
      grossProfit: 'Net Profit',
      margin: 'Profit Margin (%)',
      billAmount: 'Bill Amount',
      tipPercent: 'Tip (%)',
      peopleCount: 'Number of People',
      totalWithTip: 'Total + Tip',
      perPerson: 'Each Person Pays',
      calculate: 'Calculate Now',
    },
    challenge: {
      title: 'Daily Math Challenge',
      desc: 'Sharpen your mind and keep your daily streak alive!',
      streak: 'Day Streak',
      score: 'Current Score',
      highScore: 'High Score',
      timeLeft: 'Time Left',
      startGame: 'Start Challenge',
      playAgain: 'Play Again',
      gameOver: "Time's Up!",
      correct: 'Correct! +10 Points',
      wrong: 'Incorrect!',
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
    },
    settings: {
      appearance: 'Appearance',
      theme: 'App Theme',
      dark: 'Dark Mode',
      light: 'Light Mode',
      language: 'Language',
      feedback: 'Feedback',
      sound: 'Key Sound Effects',
      vibration: 'Key Haptic Vibration',
      calculation: 'Calculation',
      decimals: 'Decimal Places Precision',
      auto: 'Auto',
      thousandSep: 'Thousands Separator',
      dotExample: 'Dot (1.000,50 - ID)',
      commaExample: 'Comma (1,000.50 - EN)',
      dataManagement: 'Data Management',
      clearHistory: 'Clear All History',
      clearConfirm: 'Are you sure you want to delete all history?',
      historyCleared: 'All history successfully deleted',
      about: 'About PanzKalkulator',
      version: 'Version 1.2.0 (Pro Edition)',
      developer: 'Panz Tech Studio',
      privacyPolicy: 'Privacy Policy',
      pwaInstall: 'Install App on Device (PWA)',
      pwaInstalled: 'App Already Installed',
    },
    apk: {
      title: 'Android APK Export Guide',
      subtitle: 'Prepare and build a native APK using Capacitor & Android Studio',
      step1Title: '1. Folder & Dependencies Setup',
      step1Desc: 'This app is pre-configured with capacitor.config.json ready for build.',
      step2Title: '2. Add Android Platform',
      step3Title: '3. Build & Sync',
      step4Title: '4. Open in Android Studio & Generate APK',
      downloadConfig: 'Download Capacitor Config',
    },
  },
};
