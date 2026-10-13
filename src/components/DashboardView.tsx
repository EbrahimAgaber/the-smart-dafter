import React, { useState, useMemo } from 'react';
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
  MapPin,
  Search,
  X,
  Edit2,
} from 'lucide-react';
import { BusinessProfile, Language, Party, Transaction } from '../types';
import { getTranslation } from '../i18n/translations';
import { formatCurrency, formatDate, formatShortDate } from '../utils/formatters';
import { getDocumentNaming } from '../utils/messageEngine';

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
  onNavigateParties: (region?: string) => void;
  onEditTransaction?: (tx: Transaction) => void;
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
  onEditTransaction,
}) => {
  const t = getTranslation(lang);
  const currency = profile.currency || 'SAR';
  const isRtl = lang === 'ar';

  const getPartyName = (partyId: string) => {
    const p = parties.find((party) => party.id === partyId);
    return p ? p.name : (lang === 'ar' ? 'جهة غير محددة' : 'Unknown Party');
  };

  // Group outstanding customer credit by region / neighborhood for geographical distribution
  const regionalReceivables = useMemo(() => {
    const regionMap: Record<string, { totalDebt: number; count: number }> = {};
    parties
      .filter((p) => p.type === 'CUSTOMER' && p.currentBalance > 0)
      .forEach((p) => {
        let reg = (p.region || '').trim();
        if (!reg && p.address && p.address.trim()) {
          const match = p.address.match(/(?:حي\s+[^\s,]+)|(?:[^\s,]+\s+District)/i);
          reg = match ? match[0].trim() : p.address.trim();
        }
        if (!reg) reg = isRtl ? 'أحياء أخرى' : 'Other Districts';

        if (!regionMap[reg]) {
          regionMap[reg] = { totalDebt: 0, count: 0 };
        }
        regionMap[reg].totalDebt += p.currentBalance;
        regionMap[reg].count += 1;
      });

    return Object.entries(regionMap)
      .map(([region, data]) => ({ region, ...data }))
      .sort((a, b) => b.totalDebt - a.totalDebt);
  }, [parties, isRtl]);

  const [searchQuery, setSearchQuery] = useState('');

  // Helper to normalize digits and Arabic characters for resilient search
  const normalizeText = (str: string): string => {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/[٠-٩]/g, (d) => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)])
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/[\u064B-\u065F]/g, ''); // strip Arabic tashkeel/diacritics
  };

  // Filter transactions by date, party name, or notes
  const filteredTransactions = useMemo(() => {
    const rawQuery = searchQuery.trim();
    if (!rawQuery) {
      return recentTransactions;
    }

    const q = normalizeText(rawQuery);

    return recentTransactions.filter((tx) => {
      // 1. Party name & phone & address
      const party = parties.find((p) => p.id === tx.partyId);
      const partyNameNorm = normalizeText(party ? party.name : '');
      const partyPhoneNorm = normalizeText(party ? party.phone : '');

      // 2. Notes
      const notesNorm = normalizeText(tx.notes || '');

      // 3. Receipt / Invoice number
      const receiptNumNorm = normalizeText(tx.receiptNumber || '');

      // 4. Dates: raw ISO date, localized formatted dates in Arabic & English, and short dates
      const rawDateNorm = normalizeText(tx.date || '');
      const formattedArNorm = normalizeText(formatDate(tx.date, 'ar'));
      const formattedEnNorm = normalizeText(formatDate(tx.date, 'en'));
      const shortArNorm = normalizeText(formatShortDate(tx.date, 'ar'));
      const shortEnNorm = normalizeText(formatShortDate(tx.date, 'en'));

      // 5. Line items (if applicable)
      const itemsNorm = normalizeText((tx.items || []).map((i) => i.name).join(' '));

      return (
        partyNameNorm.includes(q) ||
        partyPhoneNorm.includes(q) ||
        notesNorm.includes(q) ||
        receiptNumNorm.includes(q) ||
        rawDateNorm.includes(q) ||
        formattedArNorm.includes(q) ||
        formattedEnNorm.includes(q) ||
        shortArNorm.includes(q) ||
        shortEnNorm.includes(q) ||
        itemsNorm.includes(q)
      );
    });
  }, [recentTransactions, parties, searchQuery]);

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

      {/* Primary KPI Cards (Owed to Me, I Owe, Cash Collected, Working Capital) */}
      <div id="kpi-cards-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Money Owed to Me (مستحقات - له) */}
        <div
          id="kpi-card-owed-to-me"
          onClick={() => onNavigateParties()}
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

          <div className="text-sm text-slate-500 font-medium truncate">
            {t.totalReceivable}
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 mt-1 tracking-tight font-mono">
            {formatCurrency(metrics.totalOwedToMe, currency, lang)}
          </div>
        </div>

        {/* Card 2: Total Money I Owe (التزامات - عليه) */}
        <div
          id="kpi-card-i-owe"
          onClick={() => onNavigateParties()}
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

          <div className="text-sm text-slate-500 font-medium truncate">
            {t.totalPayable}
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 mt-1 tracking-tight font-mono">
            {formatCurrency(metrics.totalIOwe, currency, lang)}
          </div>
        </div>

        {/* Card 3: Cash Collected Today */}
        <div
          id="kpi-card-cash-collected"
          className="bg-white hover:bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-sm transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-cyan-700 bg-cyan-50 px-2 py-1 rounded-lg">
              {isRtl ? 'تحصيل اليوم' : 'Today'}
            </span>
          </div>
          <div className="text-sm text-slate-500 font-medium truncate">
            {t.cashCollectedToday}
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 mt-1 tracking-tight font-mono">
            {formatCurrency(metrics.cashCollectedToday, currency, lang)}
          </div>
        </div>

        {/* Card 4: Working Capital / Net Liquidity */}
        <div
          id="kpi-card-working-capital"
          className="bg-white hover:bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-sm transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
              {isRtl ? 'الصافي' : 'Net'}
            </span>
          </div>
          <div className="text-sm text-slate-500 font-medium truncate">
            {isRtl ? 'صافي رأس المال' : 'Net Capital'}
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 mt-1 tracking-tight font-mono">
            {formatCurrency(metrics.netWorkingCapital, currency, lang)}
          </div>
        </div>
      </div>

      {/* Quick Action Bar */}
      <div id="quick-action-bar-container" className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 px-1">
          {t.quickActions}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Quick 1: New Credit Sale */}
          <button
            id="btn-quick-credit-sale"
            onClick={onOpenNewSale}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-white hover:bg-slate-50 text-slate-900 font-bold text-sm shadow-sm transition-all border border-slate-100 min-h-[96px]"
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
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-white hover:bg-slate-50 text-slate-900 font-bold text-sm shadow-sm transition-all border border-slate-100 min-h-[96px]"
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
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-white hover:bg-slate-50 text-slate-900 font-bold text-sm shadow-sm transition-all border border-slate-100 min-h-[96px]"
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
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-white hover:bg-slate-50 text-slate-900 font-bold text-sm shadow-sm transition-all border border-slate-100 min-h-[96px]"
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

      {/* Dual Column Layout on Desktop: Main Activity & Regional Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 items-start">
        {/* Column 1: Recent Transactions Section with Global Search Bar (Takes 7-8 cols on lg) */}
        <div id="recent-activity-section" className="lg:col-span-7 xl:col-span-8 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                {searchQuery.trim()
                  ? (isRtl ? `نتائج البحث (${filteredTransactions.length})` : `Search Results (${filteredTransactions.length})`)
                  : t.recentActivity}
              </h3>
              {searchQuery.trim() && (
                <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200">
                  {isRtl ? 'تصفية نشطة' : 'Filter active'}
                </span>
              )}
            </div>
            <button
              id="btn-dashboard-view-parties"
              onClick={() => onNavigateParties()}
              className="text-sm text-cyan-600 hover:text-cyan-700 font-semibold flex items-center gap-1 transition-colors"
            >
              <span>{t.viewAll}</span>
              {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

        {/* Global Transaction Search Bar */}
        {recentTransactions.length > 0 && (
          <div id="transaction-search-container" className="space-y-1.5">
            <div className="relative flex items-center">
              <Search
                className={`w-4 h-4 text-slate-400 absolute ${
                  isRtl ? 'right-3.5' : 'left-3.5'
                } pointer-events-none`}
              />
              <input
                id="input-transaction-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setSearchQuery('');
                }}
                placeholder={t.searchTransactionsPlaceholder}
                className={`w-full bg-white border border-slate-200 focus:border-cyan-600 focus:ring-3 focus:ring-cyan-500/15 rounded-2xl py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 transition-all outline-none shadow-2xs ${
                  isRtl ? 'pr-10 pl-10' : 'pl-10 pr-10'
                }`}
                aria-label={t.searchTransactionsLabel}
              />
              {searchQuery && (
                <button
                  type="button"
                  id="btn-clear-transaction-search"
                  onClick={() => setSearchQuery('')}
                  className={`absolute ${
                    isRtl ? 'left-2.5' : 'right-2.5'
                  } p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors`}
                  title={t.clearSearch}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Active search filter details & clear action */}
            {searchQuery.trim() && (
              <div className="flex items-center justify-between text-xs px-1 text-slate-500">
                <span className="text-[11px]">
                  {isRtl
                    ? `عرض ${filteredTransactions.length} من إجمالي ${recentTransactions.length} حركة`
                    : `Showing ${filteredTransactions.length} of ${recentTransactions.length} entries`}
                </span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-[11px] text-cyan-600 hover:text-cyan-700 font-bold underline underline-offset-2"
                >
                  {t.clearSearch}
                </button>
              </div>
            )}
          </div>
        )}

        {/* State 1: No transactions in the app at all */}
        {recentTransactions.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm">
            <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">{t.noTransactionsYet}</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          /* State 2: Active search returned 0 results */
          <div className="bg-white rounded-3xl p-7 text-center border border-slate-100 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                {t.noMatchingTransactions}
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                {isRtl
                  ? `لم نجد أي عمليات مطابقة لـ "${searchQuery}" في رقم السند أو اسم الجهة أو الملاحظات`
                  : `No records matched "${searchQuery}" in receipt number, party name, or notes`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 text-xs font-bold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 rounded-xl transition-colors inline-block"
            >
              {t.clearSearch}
            </button>
          </div>
        ) : (
          /* State 3: Display transactions */
          <div className="space-y-3">
            {(searchQuery.trim() ? filteredTransactions : filteredTransactions.slice(0, 6)).map((tx) => {
              const partyName = getPartyName(tx.partyId);
              const txNaming = getDocumentNaming(tx.type, lang, Boolean(tx.taxAmount && tx.taxAmount > 0));

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
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-base ${txNaming.badgeBg} ${txNaming.badgeText} border ${txNaming.badgeBorder}`}
                    >
                      <span>{txNaming.icon}</span>
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">
                        {partyName}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="font-mono text-slate-400 font-bold">
                          {tx.receiptNumber}
                        </span>
                        <span>•</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${txNaming.badgeBg} ${txNaming.badgeText}`}>
                          {txNaming.shortLabel}
                        </span>
                        <span>•</span>
                        <span>{formatDate(tx.date, lang)}</span>
                      </div>
                      {tx.notes && (
                        <div className="text-[11px] text-slate-500 truncate mt-1 flex items-center gap-1">
                          <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{tx.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial amount and delta badge */}
                  <div className="flex items-center gap-2 shrink-0 ps-2">
                    <div className="text-end">
                      <div className="text-sm font-black text-slate-900 font-mono">
                        {formatCurrency(tx.totalAmount, currency, lang)}
                      </div>
                      {tx.paidAmount > 0 && tx.type === 'SALE_CREDIT' && (
                        <div className="text-[11px] text-green-600 font-mono font-medium mt-0.5">
                          {isRtl ? `مسدد: ${formatCurrency(tx.paidAmount, currency, lang)}` : `Paid: ${formatCurrency(tx.paidAmount, currency, lang)}`}
                        </div>
                      )}
                      {tx.type === 'QUOTATION' && (
                        <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md inline-block mt-1">
                          {isRtl ? 'عرض سعر' : 'Quotation'}
                        </span>
                      )}
                      {tx.type === 'RETURN_SALE' && (
                        <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md inline-block mt-1 font-mono">
                          {isRtl ? `مرتجع: -${formatCurrency(tx.totalAmount - tx.paidAmount, currency, lang)}` : `Return: -${formatCurrency(tx.totalAmount - tx.paidAmount, currency, lang)}`}
                        </span>
                      )}
                      {(tx.type === 'SALE_CREDIT' || tx.type === 'SUPPLY_CREDIT') && tx.totalAmount - tx.paidAmount > 0 && (
                        <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md inline-block mt-1 font-mono">
                          {isRtl ? `آجل: +${formatCurrency(tx.totalAmount - tx.paidAmount, currency, lang)}` : `Debt: +${formatCurrency(tx.totalAmount - tx.paidAmount, currency, lang)}`}
                        </span>
                      )}
                      {tx.type === 'PAYMENT_RECEIVED' && (
                        <span className="text-[11px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md inline-block mt-1">
                          {isRtl ? `تم التحصيل` : `Collected`}
                        </span>
                      )}
                    </div>

                    {/* Quick Edit button (within 5-day grace period) */}
                    {!tx.isVoided && onEditTransaction && (tx.type === 'SALE_CREDIT' || tx.type === 'SUPPLY_CREDIT' || tx.type === 'RETURN_SALE' || tx.type === 'QUOTATION') && (() => {
                      const txTime = new Date(tx.date).getTime();
                      const elapsedMs = Date.now() - txTime;
                      const isWithin5Days = !isNaN(txTime) && elapsedMs <= 5 * 24 * 60 * 60 * 1000;
                      const remainingDays = isWithin5Days ? Math.ceil(Math.max(0, 5 * 24 * 60 * 60 * 1000 - elapsedMs) / (1000 * 60 * 60 * 24)) : 0;
                      return (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isWithin5Days) {
                              onEditTransaction(tx);
                            } else {
                              alert(isRtl ? 'انتهت مهلة التعديل (مسموح خلال 5 أيام فقط من تاريخ الإصدار)' : 'Modification period expired (5 days limit)');
                            }
                          }}
                          title={isWithin5Days
                            ? `${t.editInvoice} (${isRtl ? `متبقي ${remainingDays} أيام` : `${remainingDays} days remaining`})`
                            : (isRtl ? 'انتهت مهلة التعديل (5 أيام)' : '5-day edit period expired')}
                          aria-label={t.editInvoice}
                          className={`min-w-[34px] min-h-[34px] p-2 flex items-center justify-center rounded-xl transition-all ${
                            isWithin5Days
                              ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 active:scale-95 border border-transparent hover:border-amber-200'
                              : 'text-slate-200 cursor-not-allowed'
                          }`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      );
                    })()}
                  </div>
                </div>
              );
            })}

            {!searchQuery.trim() && filteredTransactions.length > 6 && (
              <button
                type="button"
                onClick={() => onNavigateParties()}
                className="w-full py-2.5 px-4 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl transition-colors text-center shadow-2xs"
              >
                {isRtl
                  ? `عرض جميع العمليات في سجل الحسابات (+${filteredTransactions.length - 6})`
                  : `View all ledger entries (+${filteredTransactions.length - 6} more)`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Column 2: Regional Receivables Distribution Widget (Takes 4-5 cols on lg) */}
      <div id="regional-receivables-section" className="lg:col-span-5 xl:col-span-4 space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-cyan-600" />
            <h3 className="text-sm font-bold text-slate-900">
              {t.regionalReceivables}
            </h3>
          </div>
          <button
            onClick={() => onNavigateParties()}
            className="text-xs text-cyan-600 hover:text-cyan-700 font-semibold"
          >
            {t.viewAll}
          </button>
        </div>

        {regionalReceivables.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
            {regionalReceivables.slice(0, 6).map((r) => (
              <div
                key={r.region}
                onClick={() => onNavigateParties(r.region)}
                className="bg-white hover:bg-slate-50 cursor-pointer p-3.5 rounded-2xl border border-slate-100 shadow-2xs transition-all group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800 truncate group-hover:text-cyan-700">
                    {r.region}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 font-mono">
                    {r.count} {isRtl ? 'عملاء' : 'clients'}
                  </span>
                </div>
                <div className="text-sm font-black text-rose-600 font-mono">
                  {formatCurrency(r.totalDebt, currency, lang)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 bg-white rounded-2xl border border-slate-100 text-center text-slate-400 text-xs">
            {isRtl ? 'لا توجد ديون مستحقة حسب الأحياء حالياً' : 'No outstanding regional debt'}
          </div>
        )}
      </div>
    </div>
  </div>
);
};
