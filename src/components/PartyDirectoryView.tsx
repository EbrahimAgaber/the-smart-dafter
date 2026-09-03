import React, { useState, useMemo } from 'react';
import {
  Search,
  UserPlus,
  Phone,
  MapPin,
  FileSpreadsheet,
  ArrowDownLeft,
  ArrowUpRight,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Filter,
  Plus,
  Trash2,
  Edit2,
  X,
} from 'lucide-react';
import { BusinessProfile, Language, Party, PartyType } from '../types';
import { getTranslation } from '../i18n/translations';
import { formatCurrency, sanitizePhoneNumber, buildWhatsAppMessage } from '../utils/formatters';

interface PartyDirectoryViewProps {
  parties: Party[];
  profile: BusinessProfile;
  lang: Language;
  onSelectPartyLedger: (party: Party) => void;
  onOpenReceivePaymentForParty: (party: Party) => void;
  onOpenNewSaleForParty: (party: Party) => void;
  onAddParty: (party: Omit<Party, 'id' | 'currentBalance' | 'createdAt'>) => void;
  onUpdateParty: (id: string, updates: Partial<Party>) => void;
  onDeleteParty: (id: string) => void;
}

export const PartyDirectoryView: React.FC<PartyDirectoryViewProps> = ({
  parties,
  profile,
  lang,
  onSelectPartyLedger,
  onOpenReceivePaymentForParty,
  onOpenNewSaleForParty,
  onAddParty,
  onUpdateParty,
  onDeleteParty,
}) => {
  const t = getTranslation(lang);
  const currency = profile.currency || 'SAR';
  const isRtl = lang === 'ar';

  const [activeSegment, setActiveSegment] = useState<PartyType>('CUSTOMER');
  const [searchQuery, setSearchQuery] = useState('');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'debtors' | 'settled'>('all');

  // Modal State for Adding/Editing Party
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formType, setFormType] = useState<PartyType>('CUSTOMER');

  // Open add modal
  const handleOpenAdd = () => {
    setEditingParty(null);
    setFormName('');
    setFormPhone('');
    setFormAddress('');
    setFormNotes('');
    setFormType(activeSegment);
    setIsAddModalOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (party: Party, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingParty(party);
    setFormName(party.name);
    setFormPhone(party.phone);
    setFormAddress(party.address);
    setFormNotes(party.notes);
    setFormType(party.type);
    setIsAddModalOpen(true);
  };

  const handleSaveParty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingParty) {
      onUpdateParty(editingParty.id, {
        name: formName.trim(),
        phone: formPhone.trim(),
        address: formAddress.trim(),
        notes: formNotes.trim(),
        type: formType,
      });
    } else {
      onAddParty({
        name: formName.trim(),
        phone: formPhone.trim(),
        address: formAddress.trim(),
        notes: formNotes.trim(),
        type: formType,
      });
    }
    setIsAddModalOpen(false);
  };

  // Filtered and searched parties
  const filteredParties = useMemo(() => {
    return parties
      .filter((p) => p.type === activeSegment)
      .filter((p) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.phone.includes(q) ||
          p.address.toLowerCase().includes(q)
        );
      })
      .filter((p) => {
        if (balanceFilter === 'debtors') return p.currentBalance > 0;
        if (balanceFilter === 'settled') return p.currentBalance === 0;
        return true;
      })
      .sort((a, b) => b.currentBalance - a.currentBalance);
  }, [parties, activeSegment, searchQuery, balanceFilter]);

  const totalOutstanding = useMemo(() => {
    return filteredParties.reduce((sum, p) => sum + p.currentBalance, 0);
  }, [filteredParties]);

  const handleWhatsAppClick = (party: Party, e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanPhone = sanitizePhoneNumber(party.phone);
    const textMsg = buildWhatsAppMessage(party, null, profile, lang);
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${textMsg}`
      : `https://wa.me/?text=${textMsg}`;
    window.open(url, '_blank');
  };

  const handlePhoneCall = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `tel:${phone}`;
  };

  return (
    <div id="party-directory-view" className="p-4 space-y-4">
      {/* Header & Segmented Control */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-slate-100">
              {t.partiesTitle}
            </h1>
            <p className="text-xs text-slate-400">
              {activeSegment === 'CUSTOMER'
                ? t.customersTab
                : t.distributorsTab}
            </p>
          </div>

          <button
            id="btn-open-add-party"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm shadow-emerald-950/30 transition-all active:scale-98"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>
              {activeSegment === 'CUSTOMER' ? t.addCustomer : t.addDistributor}
            </span>
          </button>
        </div>

        {/* Segmented Control (Customers vs Distributors) */}
        <div
          id="party-segmented-control"
          className="grid grid-cols-2 p-1 bg-slate-900 rounded-xl border border-slate-800 shadow-2xs"
        >
          <button
            id="tab-segment-customers"
            onClick={() => setActiveSegment('CUSTOMER')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              activeSegment === 'CUSTOMER'
                ? 'bg-slate-800 text-emerald-400 shadow-xs border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            {t.customersTab}
          </button>
          <button
            id="tab-segment-distributors"
            onClick={() => setActiveSegment('DISTRIBUTOR')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              activeSegment === 'DISTRIBUTOR'
                ? 'bg-slate-800 text-amber-400 shadow-xs border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            {t.distributorsTab}
          </button>
        </div>

        {/* Search Bar & Filter Chips */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="input-search-parties"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full bg-slate-900 text-slate-100 placeholder-slate-400 text-xs rounded-xl ps-9 pe-3 py-2.5 border border-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setBalanceFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                balanceFilter === 'all'
                  ? 'bg-slate-800 text-slate-100 font-bold border border-slate-700 shadow-2xs'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-850 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              {t.allBalances} ({parties.filter((p) => p.type === activeSegment).length})
            </button>
            <button
              onClick={() => setBalanceFilter('debtors')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                balanceFilter === 'debtors'
                  ? 'bg-rose-950 text-rose-300 font-bold border border-rose-800/40 shadow-2xs'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-850 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              {t.onlyDebtors}
            </button>
            <button
              onClick={() => setBalanceFilter('settled')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                balanceFilter === 'settled'
                  ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-800/40 shadow-2xs'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-850 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              {t.onlyZeroBalance}
            </button>
          </div>
        </div>
      </div>

      {/* Directory Total Banner */}
      <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 shadow-sm flex items-center justify-between text-xs">
        <span className="text-slate-400">
          {activeSegment === 'CUSTOMER' ? t.totalReceivable : t.totalPayable}:
        </span>
        <span
          className={`font-black font-mono text-sm ${
            activeSegment === 'CUSTOMER' ? 'text-rose-400' : 'text-amber-400'
          }`}
        >
          {formatCurrency(totalOutstanding, currency, lang)}
        </span>
      </div>

      {/* Party List Cards */}
      <div id="parties-list-container" className="space-y-2.5">
        {filteredParties.length === 0 ? (
          <div className="bg-slate-900/60 rounded-2xl p-8 text-center border border-slate-800/60">
            <AlertCircle className="w-8 h-8 mx-auto text-slate-500 mb-2 opacity-60" />
            <p className="text-xs text-slate-400">
              {searchQuery
                ? (isRtl ? 'لا توجد نتائج مطابقة لبحثك' : 'No matching parties found')
                : (isRtl ? 'لا توجد حسابات مسجلة في هذا القسم' : 'No accounts recorded in this section')}
            </p>
          </div>
        ) : (
          filteredParties.map((party) => {
            const isSettled = party.currentBalance === 0;
            const isCustomer = party.type === 'CUSTOMER';

            // Balance Indicator Color Scheme:
            // Customer: Red = Overdue / owes money, Green = Settled 0
            // Distributor: Yellow/Amber = Merchant owes distributor, Green = Settled 0
            let badgeBg = 'bg-rose-950/70 border-rose-800/40 text-rose-300';
            let badgeText = isRtl ? 'مطلوب منه (له)' : 'Receivable';

            if (isSettled) {
              badgeBg = 'bg-emerald-950/70 border-emerald-800/40 text-emerald-300';
              badgeText = t.settled;
            } else if (!isCustomer) {
              badgeBg = 'bg-amber-950/70 border-amber-800/40 text-amber-300';
              badgeText = isRtl ? 'مستحق له (عليه)' : 'Payable';
            }

            return (
              <div
                key={party.id}
                id={`party-item-${party.id}`}
                onClick={() => onSelectPartyLedger(party)}
                className="bg-slate-900 hover:bg-slate-850 cursor-pointer p-3.5 rounded-2xl border border-slate-800/80 hover:border-slate-700/80 transition-all shadow-2xs group"
              >
                <div className="flex items-start justify-between gap-2">
                  {/* Party Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-100 truncate group-hover:text-emerald-400 transition-colors">
                        {party.name}
                      </h3>
                      {isSettled ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : null}
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-3 mt-1 flex-wrap">
                      {party.phone && (
                        <button
                          onClick={(e) => handlePhoneCall(party.phone, e)}
                          className="flex items-center gap-1 hover:text-slate-200"
                        >
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span className="font-mono">{party.phone}</span>
                        </button>
                      )}
                      {party.address && (
                        <div className="flex items-center gap-1 truncate max-w-[160px]">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{party.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Balance Display */}
                  <div className="text-end shrink-0 ps-2">
                    <div className="text-xs font-black font-mono text-slate-100">
                      {formatCurrency(party.currentBalance, currency, lang)}
                    </div>
                    <span
                      className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border mt-1 shadow-2xs ${badgeBg}`}
                    >
                      {badgeText}
                    </span>
                  </div>
                </div>

                {/* Quick Card Action Buttons */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    {/* Open Detailed Ledger */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPartyLedger(party);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-[11px] border border-slate-700/50 shadow-2xs transition-colors"
                    >
                      <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                      <span>{t.accountStatement}</span>
                    </button>

                    {/* Receive Payment / Pay */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenReceivePaymentForParty(party);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-[11px] border border-slate-700/50 shadow-2xs transition-colors"
                    >
                      {isCustomer ? (
                        <>
                          <ArrowDownLeft className="w-3 h-3 text-sky-400" />
                          <span>{t.receivePayment}</span>
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="w-3 h-3 text-purple-400" />
                          <span>{t.payDistributor}</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* WhatsApp Quick Message */}
                    <button
                      onClick={(e) => handleWhatsAppClick(party, e)}
                      title={t.shareWhatsApp}
                      className="p-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/40 shadow-2xs transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>

                    {/* Edit Party Info */}
                    <button
                      onClick={(e) => handleOpenEdit(party, e)}
                      title={t.editParty}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 border border-slate-700/50 shadow-2xs transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Party */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(t.deleteConfirm)) {
                          onDeleteParty(party.id);
                        }
                      }}
                      title={t.deleteParty}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700/50 shadow-2xs transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Party Modal */}
      {isAddModalOpen && (
        <div
          id="modal-add-party-backdrop"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end md:items-center justify-center p-0 md:p-4"
        >
          <div
            id="modal-add-party-container"
            className="w-full max-w-md bg-slate-900 rounded-t-3xl md:rounded-3xl border border-slate-800 p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-100">
                {editingParty
                  ? t.editParty
                  : formType === 'CUSTOMER'
                  ? t.addCustomer
                  : t.addDistributor}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveParty} className="space-y-3">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  {t.partyType}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType('CUSTOMER')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      formType === 'CUSTOMER'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-700/50 shadow-2xs'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {t.customer}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('DISTRIBUTOR')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      formType === 'DISTRIBUTOR'
                        ? 'bg-amber-950 text-amber-400 border-amber-700/50 shadow-2xs'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {t.distributor}
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  {t.partyName} <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={
                    formType === 'CUSTOMER'
                      ? (isRtl ? 'مثال: بقالة الأمل - خالد' : 'e.g. Hope Grocery - Khaled')
                      : (isRtl ? 'مثال: شركة المراعي للتوزيع' : 'e.g. Almarai Distribution Co.')
                  }
                  className="w-full bg-slate-950 text-slate-100 placeholder-slate-500 text-xs rounded-xl px-3 py-2.5 border border-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 shadow-2xs"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  {t.partyPhone}
                </label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+966 5x xxx xxxx"
                  className="w-full bg-slate-950 text-slate-100 placeholder-slate-500 text-xs rounded-xl px-3 py-2.5 border border-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 font-mono shadow-2xs"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  {t.partyAddress}
                </label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder={isRtl ? 'الحي / الشارع / المدينة' : 'District / Street / City'}
                  className="w-full bg-slate-950 text-slate-100 placeholder-slate-500 text-xs rounded-xl px-3 py-2.5 border border-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 shadow-2xs"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  {t.partyNotes}
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder={isRtl ? 'ملاحظات الاتفاق على السداد أو شروط الآجل...' : 'Payment terms or credit agreement...'}
                  className="w-full bg-slate-950 text-slate-100 placeholder-slate-500 text-xs rounded-xl px-3 py-2 border border-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 resize-none shadow-2xs"
                />
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-750 transition-colors border border-slate-700/50 shadow-2xs"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/30 transition-all active:scale-98"
                >
                  {t.saveParty}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
