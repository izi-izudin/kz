import React, { useState } from 'react';
import { Tag, Receipt, Landmark, PiggyBank, TrendingUp, Users, Calculator, ArrowRight } from 'lucide-react';
import { AppSettings, FinanceSubTab } from '../types';
import { translations } from '../utils/storageAndI18n';
import { playKeySound, triggerHaptic } from '../utils/soundAndHaptics';

interface FinancialCalculatorTabProps {
  settings: AppSettings;
  onInsertToCalculator: (val: string) => void;
}

export const FinancialCalculatorTab: React.FC<FinancialCalculatorTabProps> = ({
  settings,
  onInsertToCalculator,
}) => {
  const t = translations[settings.language];
  const isDark = settings.theme === 'dark';

  const [activeTool, setActiveTool] = useState<FinanceSubTab>('discount');

  // 1. Discount State
  const [origPrice, setOrigPrice] = useState('500000');
  const [discountPct, setDiscountPct] = useState('25');

  // 2. Tax State
  const [taxBasePrice, setTaxBasePrice] = useState('1000000');
  const [taxRate, setTaxRate] = useState('11');

  // 3. Loan / Cicilan State
  const [loanPrincipal, setLoanPrincipal] = useState('50000000');
  const [loanInterest, setLoanInterest] = useState('6.5');
  const [loanTenureMonths, setLoanTenureMonths] = useState('36');

  // 4. Savings / Bunga Majemuk State
  const [initialDeposit, setInitialDeposit] = useState('10000000');
  const [monthlyDeposit, setMonthlyDeposit] = useState('1500000');
  const [savingsRate, setSavingsRate] = useState('6');
  const [savingsYears, setSavingsYears] = useState('5');

  // 5. Profit & Loss State
  const [costPrice, setCostPrice] = useState('75000');
  const [sellPrice, setSellPrice] = useState('120000');

  // 6. Tip & Split Bill State
  const [billTotal, setBillTotal] = useState('350000');
  const [tipPct, setTipPct] = useState('10');
  const [peopleCount, setPeopleCount] = useState('4');

  const tools: { id: FinanceSubTab; label: string; icon: React.ReactNode }[] = [
    { id: 'discount', label: t.finance.discount, icon: <Tag size={16} /> },
    { id: 'tax', label: t.finance.tax, icon: <Receipt size={16} /> },
    { id: 'loan', label: t.finance.loan, icon: <Landmark size={16} /> },
    { id: 'savings', label: t.finance.savings, icon: <PiggyBank size={16} /> },
    { id: 'profit', label: t.finance.profit, icon: <TrendingUp size={16} /> },
    { id: 'tip', label: t.finance.tip, icon: <Users size={16} /> },
  ];

  // Helper formatting for currency
  const formatCur = (num: number) => {
    return Math.round(num).toLocaleString(settings.language === 'en' ? 'en-US' : 'id-ID');
  };

  // Calculations:
  // Discount:
  const discountAmount = ((parseFloat(origPrice) || 0) * (parseFloat(discountPct) || 0)) / 100;
  const finalDiscountedPrice = (parseFloat(origPrice) || 0) - discountAmount;

  // Tax:
  const taxAmount = ((parseFloat(taxBasePrice) || 0) * (parseFloat(taxRate) || 0)) / 100;
  const finalPriceWithTax = (parseFloat(taxBasePrice) || 0) + taxAmount;

  // Loan (EMI calculation):
  const principal = parseFloat(loanPrincipal) || 0;
  const annualRate = (parseFloat(loanInterest) || 0) / 100;
  const monthlyRate = annualRate / 12;
  const months = parseFloat(loanTenureMonths) || 1;
  let monthlyEmi = 0;
  if (monthlyRate === 0) {
    monthlyEmi = principal / months;
  } else {
    monthlyEmi =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);
  }
  const totalLoanPayment = monthlyEmi * months;
  const totalLoanInterest = totalLoanPayment - principal;

  // Savings (Compound interest with regular monthly additions):
  const p0 = parseFloat(initialDeposit) || 0;
  const pMonth = parseFloat(monthlyDeposit) || 0;
  const rMonth = (parseFloat(savingsRate) || 0) / 100 / 12;
  const totalMonths = (parseFloat(savingsYears) || 0) * 12;
  let futureVal = p0 * Math.pow(1 + rMonth, totalMonths);
  if (rMonth > 0) {
    futureVal += pMonth * ((Math.pow(1 + rMonth, totalMonths) - 1) / rMonth);
  } else {
    futureVal += pMonth * totalMonths;
  }
  const totalInvested = p0 + pMonth * totalMonths;
  const totalGains = futureVal - totalInvested;

  // Profit & Loss:
  const cost = parseFloat(costPrice) || 0;
  const sell = parseFloat(sellPrice) || 0;
  const profit = sell - cost;
  const profitMargin = sell > 0 ? (profit / sell) * 100 : 0;
  const markup = cost > 0 ? (profit / cost) * 100 : 0;

  // Tip & Split Bill:
  const bill = parseFloat(billTotal) || 0;
  const tipVal = (bill * (parseFloat(tipPct) || 0)) / 100;
  const billWithTip = bill + tipVal;
  const people = Math.max(1, parseInt(peopleCount) || 1);
  const perPersonTotal = billWithTip / people;

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Tool Selector Bar */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 p-1 rounded-2xl border text-xs font-semibold">
        {tools.map((tItem) => (
          <button
            key={tItem.id}
            onClick={() => {
              if (settings.soundEnabled) playKeySound('action');
              if (settings.vibrationEnabled) triggerHaptic(10);
              setActiveTool(tItem.id);
            }}
            className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl transition-all ${
              activeTool === tItem.id
                ? 'bg-blue-600 text-white shadow-md'
                : isDark
                ? 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            {tItem.icon}
            <span className="truncate text-[11px]">{tItem.label}</span>
          </button>
        ))}
      </div>

      {/* Tool Container */}
      <div
        className={`p-5 rounded-3xl border shadow-lg space-y-4 animate-in fade-in ${
          isDark
            ? 'bg-slate-900/90 border-slate-800 shadow-black/30'
            : 'bg-white border-slate-200 shadow-slate-200/50'
        }`}
      >
        {/* 1. DISCOUNT */}
        {activeTool === 'discount' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-sky-400 flex items-center gap-2">
              <Tag size={16} />
              {t.finance.discount}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">{t.finance.originalPrice}</label>
                <input
                  type="number"
                  value={origPrice}
                  onChange={(e) => setOrigPrice(e.target.value)}
                  className={`w-full p-3 rounded-xl border font-mono text-sm ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">{t.finance.discountPercent}</label>
                <div className="flex gap-1.5">
                  {[10, 20, 25, 50, 70].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setDiscountPct(String(pct))}
                      className={`px-2 py-1 text-xs rounded-lg border font-mono ${
                        discountPct === String(pct)
                          ? 'bg-blue-600 text-white border-blue-500 font-bold'
                          : isDark
                          ? 'bg-slate-800 border-slate-700 text-slate-300'
                          : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={discountPct}
                  onChange={(e) => setDiscountPct(e.target.value)}
                  className={`mt-2 w-full p-2.5 rounded-xl border font-mono text-sm ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
            </div>

            {/* Result Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600/15 via-sky-500/15 to-transparent border border-blue-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">{t.finance.finalPrice}:</span>
                <div className="text-2xl font-mono font-bold text-white">
                  Rp {formatCur(finalDiscountedPrice)}
                </div>
                <span className="text-xs text-emerald-400 font-medium">
                  Hemat: Rp {formatCur(discountAmount)} ({discountPct}%)
                </span>
              </div>
              <button
                onClick={() => onInsertToCalculator(String(Math.round(finalDiscountedPrice)))}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-500 flex items-center gap-1.5 shadow-md"
              >
                <Calculator size={14} />
                <span>Salin</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. TAX */}
        {activeTool === 'tax' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-sky-400 flex items-center gap-2">
              <Receipt size={16} />
              {t.finance.tax}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">{t.finance.priceBeforeTax}</label>
                <input
                  type="number"
                  value={taxBasePrice}
                  onChange={(e) => setTaxBasePrice(e.target.value)}
                  className={`w-full p-3 rounded-xl border font-mono text-sm ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">{t.finance.taxRate}</label>
                <div className="flex gap-1.5 mb-2">
                  {[10, 11, 12, 15].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setTaxRate(String(pct))}
                      className={`px-2.5 py-1 text-xs rounded-lg border font-mono ${
                        taxRate === String(pct)
                          ? 'bg-blue-600 text-white border-blue-500 font-bold'
                          : isDark
                          ? 'bg-slate-800 border-slate-700 text-slate-300'
                          : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border font-mono text-sm ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600/15 via-sky-500/15 to-transparent border border-blue-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">{t.finance.priceAfterTax}:</span>
                <div className="text-2xl font-mono font-bold text-white">
                  Rp {formatCur(finalPriceWithTax)}
                </div>
                <span className="text-xs text-amber-400 font-medium">
                  {t.finance.taxAmount}: Rp {formatCur(taxAmount)}
                </span>
              </div>
              <button
                onClick={() => onInsertToCalculator(String(Math.round(finalPriceWithTax)))}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-500 flex items-center gap-1.5 shadow-md"
              >
                <Calculator size={14} />
                <span>Salin</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. LOAN / CICILAN */}
        {activeTool === 'loan' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-sky-400 flex items-center gap-2">
              <Landmark size={16} />
              {t.finance.loan}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">{t.finance.principal}</label>
                <input
                  type="number"
                  value={loanPrincipal}
                  onChange={(e) => setLoanPrincipal(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border font-mono text-sm ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">{t.finance.interestRate}</label>
                <input
                  type="number"
                  step="0.1"
                  value={loanInterest}
                  onChange={(e) => setLoanInterest(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border font-mono text-sm ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">{t.finance.tenureMonths}</label>
                <input
                  type="number"
                  value={loanTenureMonths}
                  onChange={(e) => setLoanTenureMonths(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border font-mono text-sm ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600/15 via-sky-500/15 to-transparent border border-blue-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs text-sky-400 font-semibold">{t.finance.monthlyPayment}:</span>
                <div className="text-2xl font-mono font-bold text-white">
                  Rp {formatCur(monthlyEmi)} / bln
                </div>
                <div className="text-[11px] text-slate-400 space-x-3 mt-1">
                  <span>{t.finance.totalInterest}: Rp {formatCur(totalLoanInterest)}</span>
                  <span>•</span>
                  <span>{t.finance.totalPayment}: Rp {formatCur(totalLoanPayment)}</span>
                </div>
              </div>
              <button
                onClick={() => onInsertToCalculator(String(Math.round(monthlyEmi)))}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-500 flex items-center gap-1.5 shadow-md"
              >
                <Calculator size={14} />
                <span>Salin</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. SAVINGS / INVESTMENT */}
        {activeTool === 'savings' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-sky-400 flex items-center gap-2">
              <PiggyBank size={16} />
              {t.finance.savings}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">{t.finance.initialDeposit}</label>
                <input
                  type="number"
                  value={initialDeposit}
                  onChange={(e) => setInitialDeposit(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border font-mono text-sm ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">{t.finance.monthlyDeposit}</label>
                <input
                  type="number"
                  value={monthlyDeposit}
                  onChange={(e) => setMonthlyDeposit(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border font-mono text-sm ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">{t.finance.annualReturn}</label>
                <input
                  type="number"
                  step="0.1"
                  value={savingsRate}
                  onChange={(e) => setSavingsRate(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border font-mono text-sm ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">{t.finance.durationYears}</label>
                <input
                  type="number"
                  value={savingsYears}
                  onChange={(e) => setSavingsYears(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border font-mono text-sm ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600/15 via-sky-500/15 to-transparent border border-blue-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs text-sky-400 font-semibold">{t.finance.futureValue}:</span>
                <div className="text-2xl font-mono font-bold text-white">
                  Rp {formatCur(futureVal)}
                </div>
                <div className="text-[11px] text-slate-400 space-x-3 mt-1">
                  <span>Modal: Rp {formatCur(totalInvested)}</span>
                  <span>•</span>
                  <span className="text-emerald-400">Keuntungan: +Rp {formatCur(totalGains)}</span>
                </div>
              </div>
              <button
                onClick={() => onInsertToCalculator(String(Math.round(futureVal)))}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-500 flex items-center gap-1.5 shadow-md"
              >
                <Calculator size={14} />
                <span>Salin</span>
              </button>
            </div>
          </div>
        )}

        {/* 5. PROFIT & LOSS */}
        {activeTool === 'profit' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-sky-400 flex items-center gap-2">
              <TrendingUp size={16} />
              {t.finance.profit}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">{t.finance.buyPrice}</label>
                <input
                  type="number"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border font-mono text-sm ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">{t.finance.sellPrice}</label>
                <input
                  type="number"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border font-mono text-sm ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600/15 via-sky-500/15 to-transparent border border-blue-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">{t.finance.grossProfit}:</span>
                <div className={`text-2xl font-mono font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {profit >= 0 ? '+' : ''}Rp {formatCur(profit)}
                </div>
                <div className="text-[11px] text-slate-400 space-x-3 mt-1">
                  <span>Margin: {profitMargin.toFixed(1)}%</span>
                  <span>•</span>
                  <span>Markup: {markup.toFixed(1)}%</span>
                </div>
              </div>
              <button
                onClick={() => onInsertToCalculator(String(Math.round(profit)))}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-500 flex items-center gap-1.5 shadow-md"
              >
                <Calculator size={14} />
                <span>Salin</span>
              </button>
            </div>
          </div>
        )}

        {/* 6. TIP & SPLIT BILL */}
        {activeTool === 'tip' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-sky-400 flex items-center gap-2">
              <Users size={16} />
              {t.finance.tip}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">{t.finance.billAmount}</label>
                <input
                  type="number"
                  value={billTotal}
                  onChange={(e) => setBillTotal(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border font-mono text-sm ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">{t.finance.tipPercent}</label>
                <input
                  type="number"
                  value={tipPct}
                  onChange={(e) => setTipPct(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border font-mono text-sm ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">{t.finance.peopleCount}</label>
                <input
                  type="number"
                  min="1"
                  value={peopleCount}
                  onChange={(e) => setPeopleCount(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border font-mono text-sm ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600/15 via-sky-500/15 to-transparent border border-blue-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs text-sky-400 font-semibold">{t.finance.perPerson}:</span>
                <div className="text-2xl font-mono font-bold text-white">
                  Rp {formatCur(perPersonTotal)} / org
                </div>
                <div className="text-[11px] text-slate-400 space-x-3 mt-1">
                  <span>Total Tagihan: Rp {formatCur(billWithTip)}</span>
                  <span>•</span>
                  <span>Tip: Rp {formatCur(tipVal)}</span>
                </div>
              </div>
              <button
                onClick={() => onInsertToCalculator(String(Math.round(perPersonTotal)))}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-500 flex items-center gap-1.5 shadow-md"
              >
                <Calculator size={14} />
                <span>Salin</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
