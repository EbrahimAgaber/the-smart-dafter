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
} from 'lucide-react';
import { BusinessProfile, Language, Party, Transaction, TransactionType } from '../types';
import { getTranslation } from '../i18n/translations';
import { formatCurrency, formatDate, formatShortDate, sanitizePhoneNumber, buildWhatsAppMessage } from '../utils/formatters';

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
}) => {
  const t = getTranslation(lang);
  const currency = profile.currency || 'SAR';
  const isRtl = lang === 'ar';
  const isCustomer = party.type === 'CUSTOMER';

  const [typeFilter, setTypeFilter] = useState<'ALL' | TransactionType>('ALL');

  // Compute rolling running balances deterministically
  // Sort ascending by date for chronological rolling calculation
  const chronologicalEntries = useMemo(() => {
    const sortedAsc = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let rolling = 0;
    return sortedAsc.map((tx) => {
      let debit = 0;
      let credit = 0;

      if (isCustomer) {
        if (tx.type === 'SALE_CREDIT') {
          // Debit increases customer's debt by the unpaid remaining balance
          debit = tx.totalAmount - tx.paidAmount;
          rolling += debit;
        } else if (tx.type === 'PAYMENT_RECEIVED') {
          // Credit decreases customer's debt
          credit = tx.paidAmount;
          rolling -= credit;
        }
      } else {
        // Distributor
        if (tx.type === 'SUPPLY_CREDIT') {
          // Credit increases merchant debt to distributor
          credit = tx.totalAmount - tx.paidAmount;
          rolling += credit;
        } else if (tx.type === 'PAYMENT_PAID') {
          // Debit decreases merchant debt to distributor
          debit = tx.paidAmount;
          rolling -= debit;
        }
      }

      return {
        transaction: tx,
        debit,
        credit,
        runningBalance: Math.round(rolling * 100) / 100,
      };
    });
  }, [transactions, isCustomer]);

  // Then display descending (most recent first)
  const displayEntries = useMemo(() => {
    let list = [...chronologicalEntries].reverse();
    if (typeFilter !== 'ALL') {
      list = list.filter((e) => e.transaction.type === typeFilter);
    }
    return list;
  }, [chronologicalEntries, typeFilter]);

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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 text-xs font-bold border border-slate-800 transition-colors shadow-2xs"
        >
          {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          <span>{isRtl ? 'العودة للقائمة' : 'Back to Directory'}</span>
        </button>

        <span
          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-2xs ${
            isCustomer
              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/40'
              : 'bg-amber-950/80 text-amber-400 border-amber-800/40'
          }`}
        >
          {isCustomer ? t.customer : t.distributor}
        </span>
      </div>

      {/* Party Profile & Outstanding Balance Card */}
      <div
        id="party-ledger-header-card"
        className="bg-slate-900 rounded-3xl p-4 border border-slate-800 space-y-3 relative overflow-hidden shadow-md"
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-base font-bold text-slate-100">
              {party.name}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
              {party.phone && (
                <a
                  href={`tel:${party.phone}`}
                  className="flex items-center gap-1 font-mono text-emerald-400 hover:underline"
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
              <p className="text-[11px] text-slate-400 mt-1 italic">
                "{party.notes}"
              </p>
            )}
          </div>
        </div>

        {/* Big Balance Highlight */}
        <div
          id="party-current-balance-banner"
          className={`p-3.5 rounded-2xl border flex items-center justify-between shadow-2xs ${
            party.currentBalance === 0
              ? 'bg-emerald-950/60 border-emerald-800/40 text-emerald-300'
              : isCustomer
              ? 'bg-rose-950/70 border-rose-800/40 text-rose-200'
              : 'bg-amber-950/70 border-amber-800/40 text-amber-200'
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
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md bg-black/30 border border-white/10 shadow-2xs">
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
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-950/30 transition-all active:scale-98 border border-emerald-400/20"
          >
            {isCustomer ? <ShoppingBag className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
            <span>{isCustomer ? t.newCreditSale : t.newSupplyIntake}</span>
          </button>

          {/* Statement PDF Export */}
          <button
            id="btn-ledger-statement-pdf"
            onClick={onOpenStatementPdf}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold text-xs border border-slate-700/60 shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.generateStatementPdf}</span>
          </button>

          {/* WhatsApp Direct Share */}
          <button
            id="btn-ledger-whatsapp"
            onClick={handleWhatsAppShare}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold text-xs border border-slate-700/60 shadow-2xs transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.shareWhatsApp}</span>
          </button>
        </div>
      </div>

      {/* Statement Entries History */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-slate-300">
            {t.accountStatement} ({displayEntries.length})
          </h2>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 text-[11px]">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                typeFilter === 'ALL'
                  ? 'bg-slate-800 text-white font-bold border border-slate-700 shadow-2xs'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {t.allTypes}
            </button>
            <button
              onClick={() => setTypeFilter(isCustomer ? 'SALE_CREDIT' : 'SUPPLY_CREDIT')}
              className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                typeFilter === (isCustomer ? 'SALE_CREDIT' : 'SUPPLY_CREDIT')
                  ? 'bg-slate-800 text-white font-bold border border-slate-700 shadow-2xs'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {isCustomer ? t.salesOnly : t.suppliesOnly}
            </button>
            <button
              onClick={() => setTypeFilter(isCustomer ? 'PAYMENT_RECEIVED' : 'PAYMENT_PAID')}
              className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                typeFilter === (isCustomer ? 'PAYMENT_RECEIVED' : 'PAYMENT_PAID')
                  ? 'bg-slate-800 text-white font-bold border border-slate-700 shadow-2xs'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {t.paymentsOnly}
            </button>
          </div>
        </div>

        {displayEntries.length === 0 ? (
          <div className="bg-slate-900/60 rounded-2xl p-8 text-center border border-slate-800/60">
            <FileText className="w-8 h-8 mx-auto text-slate-500 mb-2 opacity-60" />
            <p className="text-xs text-slate-400">{t.noTransactionsYet}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayEntries.map((entry) => {
              const tx = entry.transaction;
              const isSale = tx.type === 'SALE_CREDIT';
              const isReceipt = tx.type === 'PAYMENT_RECEIVED';
              const isSupply = tx.type === 'SUPPLY_CREDIT';

              return (
                <div
                  key={tx.id}
                  id={`ledger-row-${tx.id}`}
                  onClick={() => onSelectTransaction(tx)}
                  className="bg-slate-900 hover:bg-slate-850 cursor-pointer p-3 rounded-2xl border border-slate-800/80 hover:border-slate-700/80 transition-all shadow-2xs group"
                >
                  <div className="flex items-start justify-between gap-2">
                    {/* Left: Transaction Description & Date */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-400">
                          {tx.receiptNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5 text-slate-400" />
                          {formatDate(tx.date, lang)}
                        </span>
                      </div>

                      {/* Line items summary or notes */}
                      <div className="text-xs font-medium text-slate-200 mt-1 truncate">
                        {tx.notes || (isSale ? t.creditSaleTitle : isReceipt ? t.receiptTitle : t.supplyIntakeTitle)}
                      </div>

                      {tx.items && tx.items.length > 0 && (
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                          {tx.items.map((i) => `${i.name} (${i.quantity})`).join(', ')}
                        </div>
                      )}
                    </div>

                    {/* Right: Amount & Running Balance */}
                    <div className="text-end shrink-0 ps-2">
                      {/* Debit or Credit impact */}
                      {entry.debit > 0 && (
                        <div className="text-xs font-black text-rose-400 font-mono">
                          +{formatCurrency(entry.debit, currency, lang)}
                        </div>
                      )}
                      {entry.credit > 0 && (
                        <div className="text-xs font-black text-emerald-400 font-mono">
                          -{formatCurrency(entry.credit, currency, lang)}
                        </div>
                      )}

                      {/* Rolling Balance */}
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        <span>{t.runningBalance}: </span>
                        <span className="font-bold text-slate-300">
                          {formatCurrency(entry.runningBalance, currency, lang)}
                        </span>
                      </div>
                    </div>
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
