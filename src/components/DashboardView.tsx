import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  ShoppingBag,
  Truck,
  Receipt,
  FileText,
  Share2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { BusinessProfile, Language, Party, Transaction } from '../types';
import { getTranslation } from '../i18n/translations';
import { formatCurrency, formatDate } from '../utils/formatters';

interface DashboardViewProps {
  metrics: {
    totalOwedToMe: number;
    totalIOwe: number;
    cashCollectedToday: number;
    netWorkingCapital: number;
  };
  parties: Party[];
  recentTransactions: Transaction[];
  profile: BusinessProfile;
  lang: Language;
  onOpenNewSale: () => void;
  onOpenReceivePayment: () => void;
  onOpenNewSupply: () => void;
  onOpenPayDistributor: () => void;
  onSelectTransaction: (tx: Transaction) => void;
  onNavigateParties: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  parties,
  recentTransactions,
  profile,
  lang,
  onOpenNewSale,
  onOpenReceivePayment,
  onOpenNewSupply,
  onOpenPayDistributor,
  onSelectTransaction,
  onNavigateParties,
}) => {
  const t = getTranslation(lang);
  const currency = profile.currency || 'SAR';
  const isRtl = lang === 'ar';

  const getPartyName = (partyId: string) => {
    const p = parties.find((party) => party.id === partyId);
    return p ? p.name : (lang === 'ar' ? 'جهة غير محددة' : 'Unknown Party');
  };

  return (
    <div id="dashboard-view" className="p-4 space-y-4">
      {/* Business Header Banner */}
      <header
        id="dashboard-header"
        className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden"
      >
        <div className="absolute top-0 end-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
                {t.appName}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                {new Date().toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-100 mt-1">
              {profile.name || t.appName}
            </h1>
            <p className="text-xs text-slate-400">
              {t.tagline}
            </p>
          </div>

          {/* Business Logo or Avatar */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white font-black text-lg shadow-md border border-emerald-400/30">
            {profile.logoBase64 ? (
              <img
                src={profile.logoBase64}
                alt="Logo"
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <span>{profile.name ? profile.name.charAt(0) : 'د'}</span>
            )}
          </div>
        </div>
      </header>

      {/* Primary KPI Cards (Owed to Me vs I Owe) */}
      <div id="kpi-cards-grid" className="grid grid-cols-2 gap-3">
        {/* Card 1: Total Money Owed to Me (مستحقات - له) */}
        <div
          id="kpi-card-owed-to-me"
          onClick={onNavigateParties}
          className="bg-slate-900/90 hover:bg-slate-850 cursor-pointer p-3.5 rounded-2xl border border-rose-900/30 hover:border-rose-800/50 relative overflow-hidden transition-all group shadow-sm"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-rose-950/80 text-rose-400 flex items-center justify-center border border-rose-800/40 shadow-2xs">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-rose-400/90 bg-rose-950/60 px-1.5 py-0.5 rounded-md border border-rose-900/40">
              {isRtl ? 'له (مستحق)' : 'Receivables'}
            </span>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            {t.totalReceivable}
          </div>
          <div className="text-base font-black text-rose-300 mt-0.5 tracking-tight font-mono">
            {formatCurrency(metrics.totalOwedToMe, currency, lang)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{t.totalReceivableDesc}</span>
            {isRtl ? <ChevronLeft className="w-3 h-3 text-slate-400 group-hover:text-slate-300 transition-transform group-hover:-translate-x-0.5" /> : <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-slate-300 transition-transform group-hover:translate-x-0.5" />}
          </div>
        </div>

        {/* Card 2: Total Money I Owe (التزامات - عليه) */}
        <div
          id="kpi-card-i-owe"
          onClick={onNavigateParties}
          className="bg-slate-900/90 hover:bg-slate-850 cursor-pointer p-3.5 rounded-2xl border border-amber-900/30 hover:border-amber-800/50 relative overflow-hidden transition-all group shadow-sm"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-amber-950/80 text-amber-400 flex items-center justify-center border border-amber-800/40 shadow-2xs">
              <TrendingDown className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-amber-400/90 bg-amber-950/60 px-1.5 py-0.5 rounded-md border border-amber-900/40">
              {isRtl ? 'عليه (التزام)' : 'Payables'}
            </span>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            {t.totalPayable}
          </div>
          <div className="text-base font-black text-amber-300 mt-0.5 tracking-tight font-mono">
            {formatCurrency(metrics.totalIOwe, currency, lang)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{t.totalPayableDesc}</span>
            {isRtl ? <ChevronLeft className="w-3 h-3 text-slate-400 group-hover:text-slate-300 transition-transform group-hover:-translate-x-0.5" /> : <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-slate-300 transition-transform group-hover:translate-x-0.5" />}
          </div>
        </div>
      </div>

      {/* Cash Collected Today Card */}
      <div
        id="kpi-card-cash-collected"
        className="bg-gradient-to-r from-emerald-950/50 via-slate-900 to-teal-950/40 p-3.5 rounded-2xl border border-emerald-800/30 shadow-sm flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-900/70 border border-emerald-700/50 flex items-center justify-center text-emerald-300 shadow-inner">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">
              {t.cashCollectedToday}
            </div>
            <div className="text-base font-black text-emerald-300 font-mono">
              {formatCurrency(metrics.cashCollectedToday, currency, lang)}
            </div>
          </div>
        </div>

        <div className="text-end">
          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800/40 inline-flex items-center gap-1 shadow-2xs">
            <Sparkles className="w-2.5 h-2.5" />
            {t.cashCollectedTodayDesc}
          </span>
        </div>
      </div>

      {/* Quick Action Bar */}
      <div id="quick-action-bar-container" className="space-y-2">
        <h3 className="text-xs font-bold text-slate-300 px-1">
          {t.quickActions}
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          {/* Quick 1: New Credit Sale */}
          <button
            id="btn-quick-credit-sale"
            onClick={onOpenNewSale}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-950/30 transition-all active:scale-98 border border-emerald-400/20"
          >
            <div className="w-7 h-7 rounded-lg bg-black/20 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-emerald-100" />
            </div>
            <div className="text-start">
              <div className="leading-tight">{t.newCreditSale}</div>
              <div className="text-[10px] font-normal text-emerald-100/80">
                {isRtl ? 'تسجيل دين على عميل' : 'Customer Credit'}
              </div>
            </div>
          </button>

          {/* Quick 2: Receive Payment */}
          <button
            id="btn-quick-receive-payment"
            onClick={onOpenReceivePayment}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-sky-950/30 transition-all active:scale-98 border border-sky-400/20"
          >
            <div className="w-7 h-7 rounded-lg bg-black/20 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4 text-sky-100" />
            </div>
            <div className="text-start">
              <div className="leading-tight">{t.receivePayment}</div>
              <div className="text-[10px] font-normal text-sky-100/80">
                {isRtl ? 'سند قبض وتخفيض دين' : 'Reduce Debt'}
              </div>
            </div>
          </button>

          {/* Quick 3: New Supply Intake */}
          <button
            id="btn-quick-supply-intake"
            onClick={onOpenNewSupply}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 font-bold text-xs shadow-sm transition-all active:scale-98 border border-slate-800 hover:border-slate-700"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-950/60 border border-amber-800/40 text-amber-400 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <div className="text-start">
              <div className="leading-tight">{t.newSupplyIntake}</div>
              <div className="text-[10px] font-normal text-slate-400">
                {isRtl ? 'شراء بضاعة بالآجل' : 'Supplier Credit'}
              </div>
            </div>
          </button>

          {/* Quick 4: Pay Distributor */}
          <button
            id="btn-quick-pay-distributor"
            onClick={onOpenPayDistributor}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 font-bold text-xs shadow-sm transition-all active:scale-98 border border-slate-800 hover:border-slate-700"
          >
            <div className="w-7 h-7 rounded-lg bg-purple-950/60 border border-purple-800/40 text-purple-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div className="text-start">
              <div className="leading-tight">{t.payDistributor}</div>
              <div className="text-[10px] font-normal text-slate-400">
                {isRtl ? 'سند صرف وسداد مورد' : 'Supplier Payment'}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div id="recent-activity-section" className="space-y-2 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-300">
            {t.recentActivity}
          </h3>
          <button
            id="btn-dashboard-view-parties"
            onClick={onNavigateParties}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors"
          >
            <span>{t.viewAll}</span>
            {isRtl ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="bg-slate-900/60 rounded-2xl p-6 text-center border border-slate-800/60">
            <Receipt className="w-8 h-8 mx-auto text-slate-500 mb-2 opacity-60" />
            <p className="text-xs text-slate-400">{t.noTransactionsYet}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTransactions.slice(0, 6).map((tx) => {
              const isSale = tx.type === 'SALE_CREDIT';
              const isSupply = tx.type === 'SUPPLY_CREDIT';
              const isReceipt = tx.type === 'PAYMENT_RECEIVED';
              const partyName = getPartyName(tx.partyId);

              return (
                <div
                  key={tx.id}
                  id={`tx-card-${tx.id}`}
                  onClick={() => onSelectTransaction(tx)}
                  className="bg-slate-900 hover:bg-slate-850 cursor-pointer p-3 rounded-xl border border-slate-800/80 hover:border-slate-700/80 transition-all flex items-center justify-between group shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Icon Badge */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isSale
                          ? 'bg-rose-950/70 text-rose-400 border-rose-800/40'
                          : isReceipt
                          ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800/40'
                          : isSupply
                          ? 'bg-amber-950/70 text-amber-400 border-amber-800/40'
                          : 'bg-purple-950/70 text-purple-400 border-purple-800/40'
                      }`}
                    >
                      {isSale && <ShoppingBag className="w-4 h-4" />}
                      {isReceipt && <ArrowDownLeft className="w-4 h-4" />}
                      {isSupply && <Truck className="w-4 h-4" />}
                      {tx.type === 'PAYMENT_PAID' && <ArrowUpRight className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-200 group-hover:text-slate-100 truncate">
                        {partyName}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-slate-400">
                          {tx.receiptNumber}
                        </span>
                        <span>•</span>
                        <span>{formatDate(tx.date, lang)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial amount and delta badge */}
                  <div className="text-end shrink-0 ps-2">
                    <div className="text-xs font-black text-slate-100 font-mono">
                      {formatCurrency(tx.totalAmount, currency, lang)}
                    </div>
                    {tx.paidAmount > 0 && tx.type === 'SALE_CREDIT' && (
                      <div className="text-[10px] text-emerald-400 font-mono">
                        {isRtl ? `مسدد: ${formatCurrency(tx.paidAmount, currency, lang)}` : `Paid: ${formatCurrency(tx.paidAmount, currency, lang)}`}
                      </div>
                    )}
                    {(isSale || isSupply) && tx.totalAmount - tx.paidAmount > 0 && (
                      <span className="text-[10px] font-semibold text-rose-400 bg-rose-950/60 px-1.5 py-0.2 rounded-md border border-rose-900/40 font-mono">
                        {isRtl ? `آجل: +${formatCurrency(tx.totalAmount - tx.paidAmount, currency, lang)}` : `Debt: +${formatCurrency(tx.totalAmount - tx.paidAmount, currency, lang)}`}
                      </span>
                    )}
                    {isReceipt && (
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded-md border border-emerald-900/40">
                        {isRtl ? `تم التحصيل` : `Collected`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
