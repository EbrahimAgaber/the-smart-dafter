import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Printer,
  Calendar,
  AlertCircle,
  History,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Receipt,
  FileText,
  BadgeCheck
} from 'lucide-react';
import { BusinessProfile, Language, Transaction, DailyClosingSession } from '../types';
import { getTranslation } from '../i18n/translations';
import { formatCurrency, formatDate } from '../utils/formatters';

interface DailyClosingModalProps {
  profile: BusinessProfile;
  lang: Language;
  transactions: Transaction[];
  closingSessions: DailyClosingSession[];
  onSaveSession: (session: DailyClosingSession) => void;
  onClose: () => void;
}

export const DailyClosingModal: React.FC<DailyClosingModalProps> = ({
  profile,
  lang,
  transactions,
  closingSessions,
  onSaveSession,
  onClose,
}) => {
  const t = getTranslation(lang);
  const isRtl = lang === 'ar';
  const currency = profile.currency || 'SAR';

  const [activeTab, setActiveTab] = useState<'close' | 'history'>('close');
  const [openingCashInput, setOpeningCashInput] = useState<string>(() => {
    // Default to last session's counted cash if available, else 0
    if (closingSessions.length > 0) {
      return closingSessions[0].actualCashCounted.toString();
    }
    return '0';
  });
  const [actualCashInput, setActualCashInput] = useState<string>('');
  const [closingNotes, setClosingNotes] = useState<string>('');
  const [isSaved, setIsSaved] = useState(false);

  // Today's date YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filter today's non-voided transactions
  const todaysTx = useMemo(() => {
    return transactions.filter(
      (tx) => !tx.isVoided && tx.type !== 'QUOTATION' && tx.date.startsWith(todayStr)
    );
  }, [transactions, todayStr]);

  // Calculations
  const cashSales = useMemo(() => {
    return todaysTx
      .filter((tx) => tx.type === 'SALE_CREDIT' && (tx.paymentMethod === 'CASH' || !tx.paymentMethod) && tx.paidAmount > 0)
      .reduce((sum, tx) => sum + tx.paidAmount, 0);
  }, [todaysTx]);

  const cashReceipts = useMemo(() => {
    return todaysTx
      .filter((tx) => tx.type === 'PAYMENT_RECEIVED' && (tx.paymentMethod === 'CASH' || !tx.paymentMethod))
      .reduce((sum, tx) => sum + tx.paidAmount, 0);
  }, [todaysTx]);

  const cashPaidOut = useMemo(() => {
    return todaysTx
      .filter((tx) => (tx.type === 'PAYMENT_PAID' || tx.type === 'SUPPLY_CREDIT') && (tx.paymentMethod === 'CASH' || !tx.paymentMethod) && tx.paidAmount > 0)
      .reduce((sum, tx) => sum + tx.paidAmount, 0);
  }, [todaysTx]);

  const openingCash = parseFloat(openingCashInput) || 0;
  const expectedCash = Math.round((openingCash + cashSales + cashReceipts - cashPaidOut) * 100) / 100;
  const actualCashCounted = actualCashInput.trim() !== '' ? parseFloat(actualCashInput) || 0 : expectedCash;
  const discrepancy = Math.round((actualCashCounted - expectedCash) * 100) / 100;

  const status: 'BALANCED' | 'SURPLUS' | 'SHORTAGE' =
    Math.abs(discrepancy) < 0.01 ? 'BALANCED' : discrepancy > 0 ? 'SURPLUS' : 'SHORTAGE';

  const handleFinalize = () => {
    const session: DailyClosingSession = {
      id: `CLS-${todayStr}-${Date.now().toString().slice(-4)}`,
      date: todayStr,
      closedAt: new Date().toISOString(),
      openingCash,
      cashSales,
      cashReceipts,
      cashPaidOut,
      expectedCash,
      actualCashCounted,
      discrepancy,
      status,
      notes: closingNotes.trim() || undefined,
    };

    onSaveSession(session);
    setIsSaved(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div
      id="modal-daily-closing-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static"
    >
      <motion.div
        id="modal-daily-closing-container"
        initial={{ opacity: 0, y: 32, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ type: 'spring', damping: 28, stiffness: 340, mass: 0.8 }}
        className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 space-y-4 shadow-2xl max-h-[96vh] flex flex-col overflow-hidden print:max-h-none print:shadow-none print:border-none print:p-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">{t.dailyClosingTitle}</h2>
              <p className="text-[11px] text-slate-500">{t.dailyClosingDesc}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl print:hidden">
          <button
            type="button"
            onClick={() => setActiveTab('close')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'close'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isRtl ? 'جرد وإغلاق اليوم' : 'Today Drawer Reconciliation'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-indigo-600" />
            <span>{t.previousClosings} ({closingSessions.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {activeTab === 'close' ? (
            <>
              {/* Date & Store Banner */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>{formatDate(todayStr, lang)}</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  {todaysTx.length} {isRtl ? 'عمليات نقدية مسجلة' : 'cash transactions'}
                </span>
              </div>

              {/* Cash Reconciliation Calculation Breakdown */}
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 text-xs">
                {/* 1. Opening Drawer Cash */}
                <div className="p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="font-bold text-slate-800">{t.openingCash}</span>
                      <p className="text-[10px] text-slate-400">{isRtl ? 'عهدة الصندوق بداية اليوم' : 'Drawer cash at shift start'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 max-w-[140px]">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={openingCashInput}
                      onChange={(e) => setOpeningCashInput(e.target.value)}
                      className="w-full text-right font-mono font-bold text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:bg-white focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] font-mono text-slate-500">{currency}</span>
                  </div>
                </div>

                {/* 2. Cash Sales Today */}
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold text-slate-700">{t.cashSales}</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-700">
                    +{formatCurrency(cashSales, currency, lang)}
                  </span>
                </div>

                {/* 3. Cash Debt Collections Today */}
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold text-slate-700">{t.cashReceipts}</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-700">
                    +{formatCurrency(cashReceipts, currency, lang)}
                  </span>
                </div>

                {/* 4. Cash Payments to Suppliers */}
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-rose-500" />
                    <span className="font-semibold text-slate-700">{t.cashPaidOut}</span>
                  </div>
                  <span className="font-mono font-bold text-rose-600">
                    -{formatCurrency(cashPaidOut, currency, lang)}
                  </span>
                </div>

                {/* 5. Total Expected Drawer Cash */}
                <div className="p-3.5 bg-slate-50 flex items-center justify-between rounded-b-2xl">
                  <span className="font-bold text-slate-900">{t.expectedCash}</span>
                  <span className="font-mono font-black text-base text-slate-900">
                    {formatCurrency(expectedCash, currency, lang)}
                  </span>
                </div>
              </div>

              {/* Physical Cash Counted Input */}
              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-2">
                <label className="block text-xs font-bold text-emerald-950">
                  {t.actualCash}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={expectedCash.toFixed(2)}
                    value={actualCashInput}
                    onChange={(e) => setActualCashInput(e.target.value)}
                    className="w-full bg-white text-slate-900 font-mono font-black text-base rounded-xl px-4 py-2.5 border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
                  />
                  <div className="absolute top-1/2 -translate-y-1/2 end-3 text-xs font-mono font-bold text-emerald-700 pointer-events-none">
                    {currency}
                  </div>
                </div>

                {/* Discrepancy Status Card */}
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                    status === 'BALANCED'
                      ? 'bg-white text-emerald-800 border-emerald-300'
                      : status === 'SURPLUS'
                      ? 'bg-blue-50 text-blue-900 border-blue-300'
                      : 'bg-rose-50 text-rose-900 border-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {status === 'BALANCED' ? (
                      <BadgeCheck className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className={`w-4 h-4 ${status === 'SURPLUS' ? 'text-blue-600' : 'text-rose-600'}`} />
                    )}
                    <span>
                      {status === 'BALANCED' ? t.balanced : status === 'SURPLUS' ? t.surplus : t.shortage}
                    </span>
                  </div>
                  <span className="font-mono font-black">
                    {discrepancy > 0 ? `+${discrepancy.toFixed(2)}` : discrepancy.toFixed(2)} {currency}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  {isRtl ? 'ملاحظات الإغلاق (اختياري)' : 'Closing Notes (Optional)'}
                </label>
                <input
                  type="text"
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder={isRtl ? 'مثال: تم تسليم النقد للمدير، أو يوجد كسر عملات...' : 'e.g. Cash handed to owner...'}
                  className="w-full bg-slate-50 text-slate-900 text-xs rounded-xl px-3 py-2 border border-slate-200 focus:bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Confirmation Notification */}
              {isSaved && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{isRtl ? 'تم حفظ واعتماد إغلاق الصندوق بنجاح في السجل!' : 'Closing session saved to ledger!'}</span>
                </div>
              )}
            </>
          ) : (
            /* History of Closings */
            <div className="space-y-2.5">
              {closingSessions.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  {isRtl ? 'لا توجد جلسات إغلاق سابقة مسجلة' : 'No previous closing sessions recorded'}
                </div>
              ) : (
                closingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900">{session.date}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          session.status === 'BALANCED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : session.status === 'SURPLUS'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {session.status === 'BALANCED'
                          ? t.balanced
                          : session.status === 'SURPLUS'
                          ? `+${session.discrepancy.toFixed(2)} ${currency}`
                          : `${session.discrepancy.toFixed(2)} ${currency}`}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-100">
                      <div>
                        <span>{t.expectedCash}: </span>
                        <span className="font-mono font-bold">{formatCurrency(session.expectedCash, currency, lang)}</span>
                      </div>
                      <div>
                        <span>{t.actualCash}: </span>
                        <span className="font-mono font-bold">{formatCurrency(session.actualCashCounted, currency, lang)}</span>
                      </div>
                    </div>

                    {session.notes && (
                      <p className="text-[10px] text-slate-500 italic">"{session.notes}"</p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-200 pt-3 flex items-center justify-between gap-2 shrink-0 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>{isRtl ? 'طباعة تقرير Z-Report' : 'Print Z-Report'}</span>
          </button>

          {activeTab === 'close' && (
            <button
              type="button"
              onClick={handleFinalize}
              className="flex-1 max-w-[220px] py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs shadow-md shadow-emerald-950/20 flex items-center justify-center gap-1.5 transition-all"
            >
              <BadgeCheck className="w-4 h-4" />
              <span>{isRtl ? 'اعتماد وقفل الصندوق' : 'Finalize & Close'}</span>
            </button>
          )}
        </div>

        {/* Printable Z-Report Layout for physical thermal or A4 printers */}
        <div className="hidden print:block text-slate-900 p-6 space-y-4 max-w-sm mx-auto font-mono text-xs">
          <div className="text-center space-y-1 border-b pb-3">
            <h1 className="text-base font-bold">{profile.name}</h1>
            <p className="text-xs">{t.dailyClosingTitle}</p>
            <p className="text-[11px]">{todayStr} - {new Date().toLocaleTimeString()}</p>
          </div>

          <div className="space-y-1.5 border-b pb-3">
            <div className="flex justify-between">
              <span>{t.openingCash}:</span>
              <span className="font-bold">{formatCurrency(openingCash, currency, lang)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t.cashSales}:</span>
              <span className="font-bold">+{formatCurrency(cashSales, currency, lang)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t.cashReceipts}:</span>
              <span className="font-bold">+{formatCurrency(cashReceipts, currency, lang)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t.cashPaidOut}:</span>
              <span className="font-bold">-{formatCurrency(cashPaidOut, currency, lang)}</span>
            </div>
          </div>

          <div className="space-y-1.5 border-b pb-3 font-bold text-sm">
            <div className="flex justify-between">
              <span>{t.expectedCash}:</span>
              <span>{formatCurrency(expectedCash, currency, lang)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t.actualCash}:</span>
              <span>{formatCurrency(actualCashCounted, currency, lang)}</span>
            </div>
            <div className="flex justify-between text-xs pt-1">
              <span>{t.discrepancy}:</span>
              <span>{discrepancy.toFixed(2)} {currency} ({status})</span>
            </div>
          </div>

          <div className="pt-8 text-center border-t border-dashed">
            <p className="text-[10px] text-slate-500">توقيع المسؤول / الكاشير</p>
            <div className="mt-8 border-b border-slate-400 w-40 mx-auto" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
