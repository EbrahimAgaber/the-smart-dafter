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
    <div id="dashboard-view" className="p-4 space-y-6">
      {/* Business Header Banner */}
      <header
        id="dashboard-header"
        className="bg-gradient-to-br from-cyan-600 to-cyan-800 p-5 rounded-3xl shadow-md relative overflow-hidden text-white"
      >
        <div className="absolute -top-10 -end-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/10">
                {t.appName}
              </span>
              <span className="text-xs text-cyan-100 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date().toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            <h1 className="text-xl font-bold mt-1">
              {profile.name || t.appName}
            </h1>
            <p className="text-sm text-cyan-100/90 mt-0.5">
              {t.tagline}
            </p>
          </div>

          {/* Business Logo or Avatar */}
          <div className="w-14 h-14 rounded-2xl bg-white text-cyan-700 flex items-center justify-center font-black text-2xl shadow-sm overflow-hidden shrink-0">
            {profile.logoBase64 ? (
              <img
                src={profile.logoBase64}
                alt="Logo"
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{profile.name ? profile.name.charAt(0) : 'د'}</span>
            )}
          </div>
        </div>
      </header>

      {/* Primary KPI Cards (Owed to Me vs I Owe) */}
      <div id="kpi-cards-grid" className="grid grid-cols-2 gap-4">
        {/* Card 1: Total Money Owed to Me (مستحقات - له) */}
        <div
          id="kpi-card-owed-to-me"
          onClick={onNavigateParties}
          className="bg-white hover:bg-slate-50 cursor-pointer p-4 rounded-3xl border border-slate-100 shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded-lg">
              {isRtl ? 'له (مستحق)' : 'Receivables'}
            </span>
          </div>

          <div className="text-sm text-slate-500 font-medium">
            {t.totalReceivable}
          </div>
          <div className="text-xl font-black text-slate-900 mt-1 tracking-tight font-mono">
            {formatCurrency(metrics.totalOwedToMe, currency, lang)}
          </div>
        </div>

        {/* Card 2: Total Money I Owe (التزامات - عليه) */}
        <div
          id="kpi-card-i-owe"
          onClick={onNavigateParties}
          className="bg-white hover:bg-slate-50 cursor-pointer p-4 rounded-3xl border border-slate-100 shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-1 rounded-lg">
              {isRtl ? 'عليه (التزام)' : 'Payables'}
            </span>
          </div>

          <div className="text-sm text-slate-500 font-medium">
            {t.totalPayable}
          </div>
          <div className="text-xl font-black text-slate-900 mt-1 tracking-tight font-mono">
            {formatCurrency(metrics.totalIOwe, currency, lang)}
          </div>
        </div>
      </div>

      {/* Cash Collected Today Card */}
      <div
        id="kpi-card-cash-collected"
        className="bg-cyan-50/50 p-4 rounded-3xl border border-cyan-100 shadow-sm flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-600 flex items-center justify-center">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-slate-600 font-medium">
              {t.cashCollectedToday}
            </div>
            <div className="text-lg font-black text-slate-900 font-mono">
              {formatCurrency(metrics.cashCollectedToday, currency, lang)}
            </div>
          </div>
        </div>

        <div className="text-end">
          <span className="text-xs font-bold text-cyan-700 bg-cyan-100/80 px-3 py-1.5 rounded-xl flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            {t.cashCollectedTodayDesc}
          </span>
        </div>
      </div>

      {/* Quick Action Bar */}
      <div id="quick-action-bar-container" className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 px-1">
          {t.quickActions}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Quick 1: New Credit Sale */}
          <button
            id="btn-quick-credit-sale"
            onClick={onOpenNewSale}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-white hover:bg-slate-50 text-slate-900 font-bold text-sm shadow-sm transition-all border border-slate-100"
          >
            <div className="w-10 h-10 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="text-center">
              <div className="leading-tight">{t.newCreditSale}</div>
            </div>
          </button>

          {/* Quick 2: Receive Payment */}
          <button
            id="btn-quick-receive-payment"
            onClick={onOpenReceivePayment}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-white hover:bg-slate-50 text-slate-900 font-bold text-sm shadow-sm transition-all border border-slate-100"
          >
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <div className="text-center">
              <div className="leading-tight">{t.receivePayment}</div>
            </div>
          </button>

          {/* Quick 3: New Supply Intake */}
          <button
            id="btn-quick-supply-intake"
            onClick={onOpenNewSupply}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-white hover:bg-slate-50 text-slate-900 font-bold text-sm shadow-sm transition-all border border-slate-100"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div className="text-center">
              <div className="leading-tight">{t.newSupplyIntake}</div>
            </div>
          </button>

          {/* Quick 4: Pay Distributor */}
          <button
            id="btn-quick-pay-distributor"
            onClick={onOpenPayDistributor}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-white hover:bg-slate-50 text-slate-900 font-bold text-sm shadow-sm transition-all border border-slate-100"
          >
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div className="text-center">
              <div className="leading-tight">{t.payDistributor}</div>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div id="recent-activity-section" className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-900">
            {t.recentActivity}
          </h3>
          <button
            id="btn-dashboard-view-parties"
            onClick={onNavigateParties}
            className="text-sm text-cyan-600 hover:text-cyan-700 font-semibold flex items-center gap-1 transition-colors"
          >
            <span>{t.viewAll}</span>
            {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm">
            <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">{t.noTransactionsYet}</p>
          </div>
        ) : (
          <div className="space-y-3">
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
                  className="bg-white hover:bg-slate-50 cursor-pointer p-4 rounded-3xl border border-slate-100 transition-all flex items-center justify-between group shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Icon Badge */}
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                        isSale
                          ? 'bg-green-50 text-green-600'
                          : isReceipt
                          ? 'bg-cyan-50 text-cyan-600'
                          : isSupply
                          ? 'bg-amber-50 text-amber-500'
                          : 'bg-purple-50 text-purple-500'
                      }`}
                    >
                      {isSale && <ShoppingBag className="w-5 h-5" />}
                      {isReceipt && <ArrowDownLeft className="w-5 h-5" />}
                      {isSupply && <Truck className="w-5 h-5" />}
                      {tx.type === 'PAYMENT_PAID' && <ArrowUpRight className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">
                        {partyName}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
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
                    <div className="text-sm font-black text-slate-900 font-mono">
                      {formatCurrency(tx.totalAmount, currency, lang)}
                    </div>
                    {tx.paidAmount > 0 && tx.type === 'SALE_CREDIT' && (
                      <div className="text-[11px] text-green-600 font-mono font-medium mt-0.5">
                        {isRtl ? `مسدد: ${formatCurrency(tx.paidAmount, currency, lang)}` : `Paid: ${formatCurrency(tx.paidAmount, currency, lang)}`}
                      </div>
                    )}
                    {(isSale || isSupply) && tx.totalAmount - tx.paidAmount > 0 && (
                      <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md inline-block mt-1 font-mono">
                        {isRtl ? `آجل: +${formatCurrency(tx.totalAmount - tx.paidAmount, currency, lang)}` : `Debt: +${formatCurrency(tx.totalAmount - tx.paidAmount, currency, lang)}`}
                      </span>
                    )}
                    {isReceipt && (
                      <span className="text-[11px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md inline-block mt-1">
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
