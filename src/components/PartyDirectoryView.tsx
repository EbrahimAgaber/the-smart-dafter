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
  Contact,
} from 'lucide-react';
import { BusinessProfile, Language, Party, PartyType } from '../types';
import { getTranslation } from '../i18n/translations';
import { formatCurrency, sanitizePhoneNumber, buildWhatsAppMessage } from '../utils/formatters';
import { playSuccessChime, getAvatarColorClass } from '../utils/speechFeedback';

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
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

  // Modal State for Adding/Editing Party
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formRegion, setFormRegion] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formOpeningBalance, setFormOpeningBalance] = useState('0');
  const [formType, setFormType] = useState<PartyType>('CUSTOMER');

  const popularRegions = isRtl
    ? ['حي الياسمين', 'حي النرجس', 'حي الصحافة', 'حي الملقا', 'حي العقيق', 'حي العليا', 'حي اليرموك', 'حي الروضة']
    : ['Al-Yasmin', 'Al-Narjis', 'Al-Sahafa', 'Al-Malqa', 'Al-Aqiq', 'Al-Olaya', 'Al-Yarmouk', 'Al-Rawdah'];

  // Dynamically extract distinct regions/neighborhoods from existing parties
  const availableRegions = useMemo(() => {
    const regionSet = new Set<string>();
    parties
      .filter((p) => p.type === activeSegment)
      .forEach((p) => {
        const reg = (p.region || '').trim();
        if (reg) {
          regionSet.add(reg);
        } else if (p.address && p.address.trim()) {
          const match = p.address.match(/(?:حي\s+[^\s,]+)|(?:[^\s,]+\s+District)/i);
          if (match) {
            regionSet.add(match[0].trim());
          } else {
            regionSet.add(p.address.trim());
          }
        }
      });
    return Array.from(regionSet).sort((a, b) => a.localeCompare(b, isRtl ? 'ar' : 'en'));
  }, [parties, activeSegment, isRtl]);

  const getRegionPartyCount = (reg: string) => {
    return parties.filter((p) => {
      if (p.type !== activeSegment) return false;
      const r = (p.region || '').toLowerCase();
      const a = (p.address || '').toLowerCase();
      const target = reg.toLowerCase();
      return r === target || a.includes(target);
    }).length;
  };

  // Open add modal
  const handleOpenAdd = () => {
    setEditingParty(null);
    setFormName('');
    setFormPhone('');
    setFormAddress('');
    setFormRegion(selectedRegion !== 'all' ? selectedRegion : '');
    setFormNotes('');
    setFormOpeningBalance('0');
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
    setFormRegion(party.region || '');
    setFormNotes(party.notes);
    setFormOpeningBalance((party.openingBalance || 0).toString());
    setFormType(party.type);
    setIsAddModalOpen(true);
  };

  const handleSaveParty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const opening = parseFloat(formOpeningBalance) || 0;

    if (editingParty) {
      onUpdateParty(editingParty.id, {
        name: formName.trim(),
        phone: formPhone.trim(),
        address: formAddress.trim(),
        region: formRegion.trim() || undefined,
        notes: formNotes.trim(),
        type: formType,
        openingBalance: opening,
      });
    } else {
      onAddParty({
        name: formName.trim(),
        phone: formPhone.trim(),
        address: formAddress.trim(),
        region: formRegion.trim() || undefined,
        notes: formNotes.trim(),
        type: formType,
        openingBalance: opening,
      });
    }
    setIsAddModalOpen(false);
  };

  // Filtered and searched parties
  const filteredParties = useMemo(() => {
    return parties
      .filter((p) => p.type === activeSegment)
      .filter((p) => {
        if (selectedRegion === 'all') return true;
        const partyReg = (p.region || '').toLowerCase();
        const partyAddr = (p.address || '').toLowerCase();
        const target = selectedRegion.toLowerCase();
        return partyReg === target || partyAddr.includes(target);
      })
      .filter((p) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.phone.includes(q) ||
          (p.region && p.region.toLowerCase().includes(q)) ||
          p.address.toLowerCase().includes(q)
        );
      })
      .filter((p) => {
        if (balanceFilter === 'debtors') return p.currentBalance > 0;
        if (balanceFilter === 'settled') return p.currentBalance === 0;
        return true;
      })
      .sort((a, b) => b.currentBalance - a.currentBalance);
  }, [parties, activeSegment, selectedRegion, searchQuery, balanceFilter]);

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

  const handleImportContact = async () => {
    try {
      if ('contacts' in navigator && 'ContactsManager' in window) {
        const props = ['name', 'tel'];
        const contacts = await (navigator as any).contacts.select(props, { multiple: false });
        if (contacts && contacts[0]) {
          const c = contacts[0];
          const contactName = (c.name && c.name[0]) || '';
          const contactTel = (c.tel && c.tel[0]) || '';
          if (contactName) {
            handleOpenAdd();
            setFormName(contactName);
            setFormPhone(contactTel);
          }
        }
      } else {
        alert(isRtl ? 'استيراد جهات الاتصال مدعوم عبر متصفح الجوال' : 'Contact import is supported on mobile browser');
      }
    } catch (e) {
      console.warn('Contact picker cancelled or failed', e);
    }
  };

  return (
    <div id="party-directory-view" className="p-4 space-y-4">
      {/* Header & Segmented Control */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-slate-900">
              {t.partiesTitle}
            </h1>
            <p className="text-xs text-slate-400">
              {activeSegment === 'CUSTOMER'
                ? t.customersTab
                : t.distributorsTab}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleImportContact}
              title={isRtl ? 'استيراد من جهات الاتصال' : 'Import from Contacts'}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300/60 shadow-2xs transition-all"
            >
              <Contact className="w-3.5 h-3.5 text-cyan-600" />
              <span className="hidden sm:inline">{isRtl ? 'جهات الاتصال' : 'Contacts'}</span>
            </button>
            <button
              id="btn-open-add-party"
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-sm shadow-cyan-950/30 transition-all active:scale-98"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>
                {activeSegment === 'CUSTOMER' ? t.addCustomer : t.addDistributor}
              </span>
            </button>
          </div>
        </div>

        {/* Segmented Control (Customers vs Distributors) */}
        <div
          id="party-segmented-control"
          className="grid grid-cols-2 p-1 bg-white rounded-xl border border-slate-200 shadow-2xs"
        >
          <button
            id="tab-segment-customers"
            onClick={() => setActiveSegment('CUSTOMER')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              activeSegment === 'CUSTOMER'
                ? 'bg-slate-100 text-green-600 shadow-xs border border-slate-300/60'
                : 'text-slate-400 hover:text-slate-800 border border-transparent'
            }`}
          >
            {t.customersTab}
          </button>
          <button
            id="tab-segment-distributors"
            onClick={() => setActiveSegment('DISTRIBUTOR')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              activeSegment === 'DISTRIBUTOR'
                ? 'bg-slate-100 text-amber-600 shadow-xs border border-slate-300/60'
                : 'text-slate-400 hover:text-slate-800 border border-transparent'
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
              className="w-full bg-white text-slate-900 placeholder-slate-400 text-xs rounded-xl ps-9 pe-11 py-2.5 border border-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label={isRtl ? 'مسح البحث' : 'Clear search'}
                className="absolute end-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setBalanceFilter('all')}
              className={`min-h-[44px] px-3.5 py-2.5 rounded-xl font-medium transition-all inline-flex items-center justify-center shrink-0 ${
                balanceFilter === 'all'
                  ? 'bg-slate-100 text-slate-900 font-bold border border-slate-300 shadow-2xs'
                  : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-slate-200/80'
              }`}
            >
              {t.allBalances} ({parties.filter((p) => p.type === activeSegment).length})
            </button>
            <button
              onClick={() => setBalanceFilter('debtors')}
              className={`min-h-[44px] px-3.5 py-2.5 rounded-xl font-medium transition-all inline-flex items-center justify-center shrink-0 ${
                balanceFilter === 'debtors'
                  ? 'bg-rose-50 text-rose-700 font-bold border border-rose-200 shadow-2xs'
                  : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-slate-200/80'
              }`}
            >
              {t.onlyDebtors}
            </button>
            <button
              onClick={() => setBalanceFilter('settled')}
              className={`min-h-[44px] px-3.5 py-2.5 rounded-xl font-medium transition-all inline-flex items-center justify-center shrink-0 ${
                balanceFilter === 'settled'
                  ? 'bg-green-50 text-green-700 font-bold border border-green-200 shadow-2xs'
                  : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-slate-200/80'
              }`}
            >
              {t.onlyZeroBalance}
            </button>
          </div>

          {/* Regional Neighborhood Filter Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs pt-0.5">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 shrink-0 ps-1">
              <MapPin className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
              <span>{t.region}:</span>
            </span>
            <button
              onClick={() => setSelectedRegion('all')}
              className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center justify-center shrink-0 ${
                selectedRegion === 'all'
                  ? 'bg-cyan-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {t.allRegions}
            </button>
            {availableRegions.map((reg) => {
              const count = getRegionPartyCount(reg);
              const isSelected = selectedRegion.toLowerCase() === reg.toLowerCase();
              return (
                <button
                  key={reg}
                  onClick={() => setSelectedRegion(isSelected ? 'all' : reg)}
                  className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? 'bg-cyan-700 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  <span>{reg}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Directory Total Banner */}
      <div className="bg-white/90 p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-medium">
            {selectedRegion !== 'all'
              ? `${isRtl ? 'مستحقات' : 'Outstanding in'} (${selectedRegion})`
              : activeSegment === 'CUSTOMER'
              ? t.totalReceivable
              : t.totalPayable}
            :
          </span>
          {selectedRegion !== 'all' && (
            <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200">
              {filteredParties.length} {isRtl ? 'جهة' : 'parties'}
            </span>
          )}
        </div>
        <span
          className={`font-black font-mono text-sm ${
            activeSegment === 'CUSTOMER' ? 'text-rose-600' : 'text-amber-600'
          }`}
        >
          {formatCurrency(totalOutstanding, currency, lang)}
        </span>
      </div>

      {/* Party List Cards */}
      <div id="parties-list-container" className="space-y-2.5">
        {filteredParties.length === 0 ? (
          <div className="bg-white/60 rounded-2xl p-8 text-center border border-slate-200/60">
            <AlertCircle className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-60" />
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
            // Distributor: Amber = Merchant owes distributor, Green = Settled 0
            let badgeBg = 'bg-rose-50 border border-rose-200 text-rose-700';
            let badgeText = isRtl ? 'مطلوب منه (له)' : 'Receivable';

            if (isSettled) {
              badgeBg = 'bg-green-50 border border-green-200 text-green-700';
              badgeText = t.settled;
            } else if (!isCustomer) {
              badgeBg = 'bg-amber-50 border border-amber-200 text-amber-800';
              badgeText = isRtl ? 'مستحق له (عليه)' : 'Payable';
            }

            return (
              <div
                key={party.id}
                id={`party-item-${party.id}`}
                onClick={() => onSelectPartyLedger(party)}
                className="bg-white hover:bg-slate-50 cursor-pointer p-3.5 rounded-2xl border border-slate-200/80 hover:border-slate-300/80 transition-all shadow-2xs group"
              >
                <div className="flex items-start justify-between gap-2.5">
                  {/* Visual Avatar Badge for Low-literacy Identification */}
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${getAvatarColorClass(party.name)}`}>
                    {party.name.charAt(0)}
                  </div>

                  {/* Party Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-green-600 transition-colors">
                        {party.name}
                      </h3>
                      {isSettled ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                      ) : null}
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-3 mt-1 flex-wrap">
                      {party.phone && (
                        <button
                          onClick={(e) => handlePhoneCall(party.phone, e)}
                          className="flex items-center gap-1 hover:text-slate-800"
                        >
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span className="font-mono">{party.phone}</span>
                        </button>
                      )}
                      {(party.region || party.address) && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-50 border border-cyan-200/60 text-cyan-800 text-[11px] font-medium truncate max-w-[180px]">
                          <MapPin className="w-3 h-3 text-cyan-600 shrink-0" />
                          <span className="truncate">{party.region || party.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Balance Display */}
                  <div className="text-end shrink-0 ps-2">
                    <div className="text-xs font-black font-mono text-slate-900">
                      {formatCurrency(party.currentBalance, currency, lang)}
                    </div>
                    <span
                      className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border mt-1 shadow-2xs ${badgeBg}`}
                    >
                      {badgeText}
                    </span>
                  </div>
                </div>

                {/* Quick Card Action Buttons */}
                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    {/* Open Detailed Ledger */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPartyLedger(party);
                      }}
                      className="flex items-center gap-1 min-h-[44px] px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-300/50 shadow-2xs transition-colors"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />
                      <span>{t.accountStatement}</span>
                    </button>

                    {/* Receive Payment / Pay */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenReceivePaymentForParty(party);
                      }}
                      className="flex items-center gap-1 min-h-[44px] px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-300/50 shadow-2xs transition-colors"
                    >
                      {isCustomer ? (
                        <>
                          <ArrowDownLeft className="w-3.5 h-3.5 text-sky-600" />
                          <span>{t.receivePayment}</span>
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="w-3.5 h-3.5 text-purple-600" />
                          <span>{t.payDistributor}</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* WhatsApp Quick Message */}
                    <button
                      onClick={(e) => handleWhatsAppClick(party, e)}
                      title={t.shareWhatsApp}
                      aria-label={t.shareWhatsApp}
                      className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 shadow-2xs transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>

                    {/* Edit Party Info */}
                    <button
                      onClick={(e) => handleOpenEdit(party, e)}
                      title={t.editParty}
                      aria-label={t.editParty}
                      className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-300/50 shadow-2xs transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete Party */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (party.currentBalance !== 0) {
                          const confirmMsg = isRtl
                            ? `تنبيه: هذا الحساب لديه رصيد نشط (${formatCurrency(party.currentBalance, currency, lang)}). هل أنت متأكد من رغبتك في أرشفة الحساب؟`
                            : `Warning: This account has an active balance of ${formatCurrency(party.currentBalance, currency, lang)}. Are you sure you want to archive it?`;
                          if (!window.confirm(confirmMsg)) return;
                        } else if (!window.confirm(t.deleteConfirm)) {
                          return;
                        }
                        onDeleteParty(party.id);
                      }}
                      title={t.deleteParty}
                      aria-label={t.deleteParty}
                      className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-300/50 shadow-2xs transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
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
            className="w-full max-w-md bg-white rounded-t-3xl md:rounded-3xl border border-slate-200 p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+1rem))]"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-sm font-bold text-slate-900">
                {editingParty
                  ? t.editParty
                  : formType === 'CUSTOMER'
                  ? t.addCustomer
                  : t.addDistributor}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                aria-label={isRtl ? 'إغلاق' : 'Close'}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-800 transition-colors"
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
                        ? 'bg-green-50 text-green-600 border-cyan-700/50 shadow-2xs'
                        : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-800'
                    }`}
                  >
                    {t.customer}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('DISTRIBUTOR')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      formType === 'DISTRIBUTOR'
                        ? 'bg-amber-50 text-amber-600 border-amber-700/50 shadow-2xs'
                        : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-800'
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
                  className="w-full bg-slate-50 text-slate-900 placeholder-slate-500 text-xs rounded-xl px-3 py-2.5 border border-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 shadow-2xs"
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
                  className="w-full bg-slate-50 text-slate-900 placeholder-slate-500 text-xs rounded-xl px-3 py-2.5 border border-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 font-mono shadow-2xs"
                />
              </div>

              {/* Region / Neighborhood */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs text-slate-500 font-medium">
                    {t.region}
                  </label>
                  <span className="text-[10px] text-cyan-600 font-bold">
                    {isRtl ? 'تصنيف جغرافي ومسارات' : 'Route & Regional tag'}
                  </span>
                </div>
                {/* Popular neighborhood quick chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 mb-1.5 text-[11px]">
                  {popularRegions.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setFormRegion(r);
                        if (!formAddress.trim()) setFormAddress(r);
                      }}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-semibold shrink-0 transition-colors ${
                        formRegion === r
                          ? 'bg-cyan-700 text-white border-cyan-800'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300/60'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={formRegion}
                  onChange={(e) => setFormRegion(e.target.value)}
                  placeholder={isRtl ? 'اسم الحي (مثال: حي الياسمين)' : 'e.g. Al-Yasmin District'}
                  className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 text-xs rounded-xl px-3 py-2.5 border border-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 shadow-2xs"
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
                  placeholder={isRtl ? 'الشارع / رقم المبنى / المعلم' : 'Street / Building / Landmark'}
                  className="w-full bg-slate-50 text-slate-900 placeholder-slate-500 text-xs rounded-xl px-3 py-2.5 border border-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 shadow-2xs"
                />
              </div>

              {/* Opening Balance (رصيد افتتاحي) */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  {isRtl ? 'الرصيد الافتتاحي (ديون سابقة)' : 'Opening Balance (Initial Credit)'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={formOpeningBalance}
                    onChange={(e) => setFormOpeningBalance(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-50 text-slate-900 placeholder-slate-500 text-xs rounded-xl px-3 py-2.5 border border-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 font-mono font-bold shadow-2xs"
                  />
                  <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                    {currency}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {isRtl
                    ? 'أدخل الرصيد المتبقي على العميل أو للمورد قبل استخدام التطبيق'
                    : 'Enter existing debt balance from prior ledgers'}
                </p>
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
                  className="w-full bg-slate-50 text-slate-900 placeholder-slate-500 text-xs rounded-xl px-3 py-2 border border-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 resize-none shadow-2xs"
                />
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-colors border border-slate-300/50 shadow-2xs"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-950/30 transition-all active:scale-98"
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
