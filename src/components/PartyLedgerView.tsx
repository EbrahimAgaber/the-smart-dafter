import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Phone,
  MapPin,
  FileSpreadsheet,
  MessageSquare,
  ArrowDownLeft,
  ArrowUpRight,
  ShoppingBag,
  Truck,
  FileText,
  Calendar,
  Filter,
  Plus,
  Share2,
  Printer,
  ChevronDown,
  Trash2,
} from 'lucide-react';
import { BusinessProfile, Language, Party, Transaction, TransactionType } from '../types';
import { getTranslation } from '../i18n/translations';
import { formatCurrency, formatDate, formatShortDate, sanitizePhoneNumber, buildWhatsAppMessage } from '../utils/formatters';
import { getAvatarColorClass } from '../utils/speechFeedback';

interface PartyLedgerViewProps {
  party: Party;
  transactions: Transaction[];
  profile: BusinessProfile;
  lang: Language;
  onBack: () => void;
  onOpenReceivePayment: () => void;
  onOpenNewSale: () => void;
  onOpenStatementPdf: () => void;
  onSelectTransaction: (tx: Transaction) => void;
  onVoidTransaction?: (txId: string) => void;
}

export const PartyLedgerView: React.FC<PartyLedgerViewProps> = ({
  party,
  transactions,
  profile,
  lang,
  onBack,
  onOpenReceivePayment,
  onOpenNewSale,
  onOpenStatementPdf,
  onSelectTransaction,
  onVoidTransaction,
}) => {
  const t = getTranslation(lang);
  const currency = profile.currency || 'SAR';
  const isRtl = lang === 'ar';
  const isCustomer = party.type === 'CUSTOMER';

  const [typeFilter, setTypeFilter] = useState<'ALL' | TransactionType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Compute rolling running balances deterministically
  // Sort ascending by date for chronological rolling calculation
  const chronologicalEntries = useMemo(() => {
    const sortedAsc = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let rolling = Number(party.openingBalance) || 0;
    return sortedAsc.map((tx) => {
      let debit = 0;
      let credit = 0;

      if (!tx.isVoided) {
        if (isCustomer) {
          if (tx.type === 'SALE_CREDIT') {
            debit = tx.totalAmount - tx.paidAmount;
            rolling += debit;
          } else if (tx.type === 'PAYMENT_RECEIVED') {
            credit = tx.paidAmount;
            rolling -= credit;
          }
        } else {
          // Distributor
          if (tx.type === 'SUPPLY_CREDIT') {
            credit = tx.totalAmount - tx.paidAmount;
            rolling += credit;
          } else if (tx.type === 'PAYMENT_PAID') {
            debit = tx.paidAmount;
            rolling -= debit;
          }
        }
      }

      return {
        transaction: tx,
        debit,
        credit,
        runningBalance: Math.round(rolling * 100) / 100,
      };
    });
  }, [transactions, isCustomer, party.openingBalance]);

  // Then display descending (most recent first) with filters
  const displayEntries = useMemo(() => {
    let list = [...chronologicalEntries].reverse();
    if (typeFilter !== 'ALL') {
      list = list.filter((e) => e.transaction.type === typeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.transaction.receiptNumber.toLowerCase().includes(q) ||
          e.transaction.notes?.toLowerCase().includes(q) ||
          e.transaction.items?.some((i) => i.name.toLowerCase().includes(q))
      );
    }
    return list;
  }, [chronologicalEntries, typeFilter, searchQuery]);

  const handleWhatsAppShare = () => {
    const cleanPhone = sanitizePhoneNumber(party.phone);
    const msg = buildWhatsAppMessage(party, null, profile, lang);
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${msg}`
      : `https://wa.me/?text=${msg}`;
    window.open(url, '_blank');
  };

  return (
    <div id="party-ledger-view" className="p-4 space-y-4">
      {/* Back Navigation & Title */}
      <div className="flex items-center justify-between">
        <button
          id="btn-back-to-parties"
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 transition-colors shadow-2xs"
        >
          {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          <span>{isRtl ? 'العودة للقائمة' : 'Back to Directory'}</span>
        </button>

        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full border shadow-2xs ${
            isCustomer
              ? 'bg-green-50/80 text-green-600 border-green-200/40'
              : 'bg-amber-50/80 text-amber-600 border-amber-200/40'
          }`}
        >
          {isCustomer ? t.customer : t.distributor}
        </span>
      </div>

      {/* Party Profile & Outstanding Balance Card */}
      <div
        id="party-ledger-header-card"
        className="bg-white rounded-3xl p-4 border border-slate-200 space-y-3 relative overflow-hidden shadow-md"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {/* Visual Avatar Badge */}
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base shrink-0 shadow-2xs ${getAvatarColorClass(party.name)}`}>
              {party.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900">
                  {party.name}
                </h1>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
                {party.phone && (
                  <a
                    href={`tel:${party.phone}`}
                    className="flex items-center gap-1 font-mono text-green-600 hover:underline"
                  >
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{party.phone}</span>
                  </a>
                )}
                {party.address && (
                  <div className="flex items-center gap-1 text-slate-400">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate max-w-[180px]">{party.address}</span>
                  </div>
                )}
              </div>
              {party.notes && (
                <p className="text-xs text-slate-400 mt-1 italic">
                  "{party.notes}"
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Big Balance Highlight */}
        <div
          id="party-current-balance-banner"
          className={`p-3.5 rounded-2xl border flex items-center justify-between shadow-2xs ${
            party.currentBalance === 0
              ? 'bg-green-50 border-green-200 text-green-700'
              : isCustomer
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <div>
            <div className="text-xs font-semibold opacity-90">
              {party.currentBalance === 0
                ? t.settled
                : isCustomer
                ? t.customerOwes
                : t.merchantOwes}
            </div>
            <div className="text-xl font-black font-mono mt-0.5 tracking-tight">
              {formatCurrency(party.currentBalance, currency, lang)}
            </div>
          </div>

          <div className="text-end">
            <span className="text-xs uppercase font-bold tracking-wider px-2 py-1 rounded-md bg-black/30 border border-white/10 shadow-2xs">
              {t.runningBalance}
            </span>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {/* Primary Financial Action: Receive Payment / Pay */}
          <button
            id="btn-ledger-record-payment"
            onClick={onOpenReceivePayment}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-sky-950/30 transition-all active:scale-98 border border-sky-400/20"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>{isCustomer ? t.receivePayment : t.payDistributor}</span>
          </button>

          {/* Secondary Financial Action: New Sale / Intake */}
          <button
            id="btn-ledger-new-sale"
            onClick={onOpenNewSale}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-cyan-950/30 transition-all active:scale-98 border border-cyan-400/20"
          >
            {isCustomer ? <ShoppingBag className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
            <span>{isCustomer ? t.newCreditSale : t.newSupplyIntake}</span>
          </button>

          {/* Statement PDF Export */}
          <button
            id="btn-ledger-statement-pdf"
            onClick={onOpenStatementPdf}
            className="flex items-center justify-center gap-1.5 min-h-[44px] py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-300/60 shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />
            <span>{t.generateStatementPdf}</span>
          </button>

          {/* WhatsApp Direct Share */}
          <button
            id="btn-ledger-whatsapp"
            onClick={handleWhatsAppShare}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-300/60 shadow-2xs transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-green-600" />
            <span>{t.shareWhatsApp}</span>
          </button>
        </div>
      </div>

      {/* Search Filter inside Ledger */}
      <div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={isRtl ? 'بحث في السندات أو الأصناف أو الملاحظات...' : 'Search entries, items, notes...'}
          className="w-full bg-white text-slate-900 placeholder-slate-400 text-xs rounded-xl px-3 py-2 border border-slate-200 focus:outline-none focus:border-cyan-500 shadow-2xs"
        />
      </div>

      {/* Statement Entries History */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-slate-700">
            {t.accountStatement} ({displayEntries.length})
          </h2>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                typeFilter === 'ALL'
                  ? 'bg-slate-800 text-white font-bold border border-slate-700 shadow-2xs'
                  : 'bg-white text-slate-500 hover:text-slate-800 border border-slate-200'
              }`}
            >
              {t.allTypes}
            </button>
            <button
              onClick={() => setTypeFilter(isCustomer ? 'SALE_CREDIT' : 'SUPPLY_CREDIT')}
              className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                typeFilter === (isCustomer ? 'SALE_CREDIT' : 'SUPPLY_CREDIT')
                  ? 'bg-slate-800 text-white font-bold border border-slate-700 shadow-2xs'
                  : 'bg-white text-slate-500 hover:text-slate-800 border border-slate-200'
              }`}
            >
              {isCustomer ? t.salesOnly : t.suppliesOnly}
            </button>
            <button
              onClick={() => setTypeFilter(isCustomer ? 'PAYMENT_RECEIVED' : 'PAYMENT_PAID')}
              className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                typeFilter === (isCustomer ? 'PAYMENT_RECEIVED' : 'PAYMENT_PAID')
                  ? 'bg-slate-800 text-white font-bold border border-slate-700 shadow-2xs'
                  : 'bg-white text-slate-500 hover:text-slate-800 border border-slate-200'
              }`}
            >
              {t.paymentsOnly}
            </button>
          </div>
        </div>

        {displayEntries.length === 0 ? (
          <div className="bg-white/60 rounded-2xl p-8 text-center border border-slate-200/60">
            <FileText className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-60" />
            <p className="text-xs text-slate-400">{t.noTransactionsYet}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayEntries.map((entry) => {
              const tx = entry.transaction;
              const isSale = tx.type === 'SALE_CREDIT';
              const isReceipt = tx.type === 'PAYMENT_RECEIVED';
              const isSupply = tx.type === 'SUPPLY_CREDIT';
              const isVoid = tx.isVoided;

              return (
                <div
                  key={tx.id}
                  id={`ledger-row-${tx.id}`}
                  onClick={() => onSelectTransaction(tx)}
                  className={`bg-white hover:bg-slate-50 cursor-pointer p-3 rounded-2xl border transition-all shadow-2xs group ${
                    isVoid ? 'border-rose-200/80 bg-rose-50/20 opacity-75' : 'border-slate-200/80 hover:border-slate-300/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    {/* Left: Transaction Description & Date */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-mono text-xs font-bold ${isVoid ? 'text-rose-600 line-through' : 'text-green-600'}`}>
                          {tx.receiptNumber}
                        </span>
                        {isVoid && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold">
                            {isRtl ? 'ملغي' : 'Voided'}
                          </span>
                        )}
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5 text-slate-400" />
                          {formatDate(tx.date, lang)}
                        </span>
                      </div>

                      {/* Line items summary or notes */}
                      <div className={`text-xs font-medium mt-1 truncate ${isVoid ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        {tx.notes || (isSale ? t.creditSaleTitle : isReceipt ? t.receiptTitle : t.supplyIntakeTitle)}
                      </div>

                      {tx.items && tx.items.length > 0 && (
                        <div className="text-xs text-slate-400 mt-0.5 truncate">
                          {tx.items.map((i) => `${i.name} (${i.quantity})`).join(', ')}
                        </div>
                      )}
                    </div>

                    {/* Right: Amount & Running Balance */}
                    <div className="text-end shrink-0 ps-2">
                      <div className="flex items-center justify-end gap-1">
                        {/* Debit or Credit impact */}
                        {entry.debit > 0 && (
                          <div className={`text-xs font-black font-mono ${isVoid ? 'text-slate-400 line-through' : 'text-rose-600'}`}>
                            +{formatCurrency(entry.debit, currency, lang)}
                          </div>
                        )}
                        {entry.credit > 0 && (
                          <div className={`text-xs font-black font-mono ${isVoid ? 'text-slate-400 line-through' : 'text-green-600'}`}>
                            -{formatCurrency(entry.credit, currency, lang)}
                          </div>
                        )}

                        {/* Void button */}
                        {!isVoid && onVoidTransaction && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(isRtl ? `هل أنت متأكد من إلغاء القيد رقم ${tx.receiptNumber}؟` : `Void transaction ${tx.receiptNumber}?`)) {
                                onVoidTransaction(tx.id);
                              }
                            }}
                            title={isRtl ? 'إلغاء القيد' : 'Void transaction'}
                            aria-label={isRtl ? 'إلغاء القيد' : 'Void transaction'}
                            className="min-w-[44px] min-h-[44px] -my-2.5 -me-2.5 flex items-center justify-center rounded-xl text-slate-700 hover:text-rose-600 hover:bg-rose-50 active:scale-95 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Rolling Balance */}
                      <div className="text-xs font-mono text-slate-400 mt-0.5">
                        <span>{t.runningBalance}: </span>
                        <span className="font-bold text-slate-700">
                          {formatCurrency(entry.runningBalance, currency, lang)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Baseline Opening Balance Card */}
            {party.openingBalance !== undefined && party.openingBalance !== 0 && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs mt-2 shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-600" />
                  <div>
                    <span className="font-bold text-slate-800 block">
                      {isRtl ? 'الرصيد الافتتاحي المبدئي' : 'Initial Opening Balance'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {isRtl ? 'الرصيد المسجل عند فتح الحساب' : 'Recorded at onboarding'}
                    </span>
                  </div>
                </div>
                <div className="text-end font-mono font-bold text-slate-800">
                  {formatCurrency(party.openingBalance, currency, lang)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
