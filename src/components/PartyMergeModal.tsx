import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  X,
  GitMerge,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Users,
  Search,
  Phone
} from 'lucide-react';
import { Party, Language, BusinessProfile } from '../types';
import { getTranslation } from '../i18n/translations';
import { formatCurrency, formatDisplayPhone } from '../utils/formatters';

interface PartyMergeModalProps {
  parties: Party[];
  profile: BusinessProfile;
  lang: Language;
  onMerge: (sourceId: string, targetId: string) => boolean;
  onClose: () => void;
}

export const PartyMergeModal: React.FC<PartyMergeModalProps> = ({
  parties,
  profile,
  lang,
  onMerge,
  onClose,
}) => {
  const t = getTranslation(lang);
  const isRtl = lang === 'ar';
  const currency = profile.currency || 'SAR';

  const [primaryPartyId, setPrimaryPartyId] = useState<string>('');
  const [duplicatePartyId, setDuplicatePartyId] = useState<string>('');
  const [searchPrimary, setSearchPrimary] = useState('');
  const [searchDuplicate, setSearchDuplicate] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Active parties
  const activeParties = useMemo(() => parties.filter((p) => !p.isDeleted), [parties]);

  // Potential duplicate suggestions based on identical phone number or similar names
  const suggestedDuplicates = useMemo(() => {
    const suggestions: { party1: Party; party2: Party; reason: string }[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < activeParties.length; i++) {
      for (let j = i + 1; j < activeParties.length; j++) {
        const p1 = activeParties[i];
        const p2 = activeParties[j];
        if (p1.type !== p2.type) continue;

        // Check phone match
        if (p1.phone && p2.phone && p1.phone.replace(/\D/g, '') === p2.phone.replace(/\D/g, '')) {
          const key = [p1.id, p2.id].sort().join(':');
          if (!seen.has(key)) {
            seen.add(key);
            suggestions.push({
              party1: p1,
              party2: p2,
              reason: isRtl ? 'تطابق في رقم الجوال' : 'Identical phone number',
            });
          }
        } else if (p1.name.trim().toLowerCase() === p2.name.trim().toLowerCase()) {
          const key = [p1.id, p2.id].sort().join(':');
          if (!seen.has(key)) {
            seen.add(key);
            suggestions.push({
              party1: p1,
              party2: p2,
              reason: isRtl ? 'تطابق تام في الاسم' : 'Exact name match',
            });
          }
        }
      }
    }
    return suggestions;
  }, [activeParties, isRtl]);

  const primaryParty = useMemo(() => activeParties.find((p) => p.id === primaryPartyId), [activeParties, primaryPartyId]);
  const duplicateParty = useMemo(() => activeParties.find((p) => p.id === duplicatePartyId), [activeParties, duplicatePartyId]);

  const combinedBalance = useMemo(() => {
    const b1 = primaryParty?.currentBalance || 0;
    const b2 = duplicateParty?.currentBalance || 0;
    return Math.round((b1 + b2) * 100) / 100;
  }, [primaryParty, duplicateParty]);

  const handleExecuteMerge = () => {
    if (!primaryPartyId || !duplicatePartyId || primaryPartyId === duplicatePartyId) return;
    const ok = onMerge(duplicatePartyId, primaryPartyId);
    if (ok) {
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1400);
    }
  };

  return (
    <motion.div
      id="modal-party-merge-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      <motion.div
        id="modal-party-merge-container"
        initial={{ opacity: 0, y: 32, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ type: 'spring', damping: 28, stiffness: 340, mass: 0.8 }}
        className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 space-y-4 shadow-2xl max-h-[96vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">{t.mergePartiesTitle}</h2>
              <p className="text-[11px] text-slate-500">{t.mergePartiesDesc}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Suggested Duplicates Quick Selection */}
          {suggestedDuplicates.length > 0 && (
            <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/80 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{isRtl ? 'تم رصد حسابات متطابقة مقترحة للدمج:' : 'Detected potential duplicate matches:'}</span>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {suggestedDuplicates.map((s, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setPrimaryPartyId(s.party1.id);
                      setDuplicatePartyId(s.party2.id);
                    }}
                    className="p-2 bg-white rounded-xl border border-amber-200/60 hover:border-amber-400 cursor-pointer text-xs flex items-center justify-between transition-colors group shadow-2xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-bold text-slate-800">{s.party1.name}</span>
                      <span className="text-slate-400">↔</span>
                      <span className="font-bold text-slate-800">{s.party2.name}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-lg shrink-0">
                      {s.reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dual Column Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Column 1: Primary Account */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <label className="block font-bold text-emerald-800">
                1. {t.primaryParty}
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2 start-2.5" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchPrimary}
                  onChange={(e) => setSearchPrimary(e.target.value)}
                  className="w-full bg-white text-slate-900 text-xs rounded-xl ps-8 pe-3 py-1.5 border border-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1">
                {activeParties
                  .filter((p) => p.id !== duplicatePartyId)
                  .filter((p) => !searchPrimary || p.name.toLowerCase().includes(searchPrimary.toLowerCase()) || p.phone.includes(searchPrimary))
                  .map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setPrimaryPartyId(p.id)}
                      className={`p-2 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        primaryPartyId === p.id
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                          : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="truncate">
                        <p className="truncate">{p.name}</p>
                        <p className="text-[10px] font-mono text-slate-400">{p.phone || '-'}</p>
                      </div>
                      <span className="font-mono text-[11px] shrink-0 font-bold">
                        {formatCurrency(p.currentBalance, currency, lang)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Column 2: Duplicate Account to merge */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <label className="block font-bold text-rose-800">
                2. {t.duplicateParty}
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2 start-2.5" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchDuplicate}
                  onChange={(e) => setSearchDuplicate(e.target.value)}
                  className="w-full bg-white text-slate-900 text-xs rounded-xl ps-8 pe-3 py-1.5 border border-slate-200 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1">
                {activeParties
                  .filter((p) => p.id !== primaryPartyId)
                  .filter((p) => !searchDuplicate || p.name.toLowerCase().includes(searchDuplicate.toLowerCase()) || p.phone.includes(searchDuplicate))
                  .map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setDuplicatePartyId(p.id)}
                      className={`p-2 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        duplicatePartyId === p.id
                          ? 'bg-rose-50 border-rose-400 text-rose-950 font-bold'
                          : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="truncate">
                        <p className="truncate">{p.name}</p>
                        <p className="text-[10px] font-mono text-slate-400">{p.phone || '-'}</p>
                      </div>
                      <span className="font-mono text-[11px] shrink-0 font-bold">
                        {formatCurrency(p.currentBalance, currency, lang)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Merge Preview & Resulting Balance */}
          {primaryParty && duplicateParty && (
            <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-200 text-xs space-y-2.5">
              <div className="flex items-center justify-between text-indigo-950 font-bold">
                <span>{isRtl ? 'معاينة نتيجة الدمج:' : 'Merge Preview Result:'}</span>
                <span className="font-mono font-black text-sm text-indigo-700">
                  {formatCurrency(combinedBalance, currency, lang)}
                </span>
              </div>
              <p className="text-[11px] text-indigo-800 leading-relaxed">
                {isRtl
                  ? `سيتم تحويل جميع فواتير وسندات (${duplicateParty.name}) إلى حساب (${primaryParty.name})، وجمع الأرصدة الافتتاحية والحالية تلقائياً مع حذف الحساب المكرر بأمان.`
                  : `All transactions of (${duplicateParty.name}) will be transferred to (${primaryParty.name}) with opening balances combined.`}
              </p>
            </div>
          )}

          {isSuccess && (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{t.mergeSuccess}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 pt-3 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
          >
            {t.close}
          </button>
          <button
            type="button"
            disabled={!primaryPartyId || !duplicatePartyId || primaryPartyId === duplicatePartyId || isSuccess}
            onClick={handleExecuteMerge}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-950/20 flex items-center gap-1.5 transition-all"
          >
            <GitMerge className="w-4 h-4" />
            <span>{t.confirmMerge}</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
