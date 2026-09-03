import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  CheckCircle2,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { BusinessProfile, Language, Party, PaymentMethod, TransactionType } from '../types';
import { getTranslation } from '../i18n/translations';
import { formatCurrency } from '../utils/formatters';

interface PaymentReceiptModalProps {
  type: 'PAYMENT_RECEIVED' | 'PAYMENT_PAID';
  parties: Party[];
  profile: BusinessProfile;
  lang: Language;
  initialPartyId?: string;
  onClose: () => void;
  onSubmit: (data: {
    partyId: string;
    type: TransactionType;
    amount: number;
    paymentMethod: PaymentMethod;
    notes: string;
  }) => void;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  type,
  parties,
  profile,
  lang,
  initialPartyId,
  onClose,
  onSubmit,
}) => {
  const t = getTranslation(lang);
  const currency = profile.currency || 'SAR';
  const isRtl = lang === 'ar';
  const isReceipt = type === 'PAYMENT_RECEIVED'; // Received from customer
  const targetPartyType = isReceipt ? 'CUSTOMER' : 'DISTRIBUTOR';

  const eligibleParties = useMemo(() => {
    return parties.filter((p) => p.type === targetPartyType);
  }, [parties, targetPartyType]);

  const [selectedPartyId, setSelectedPartyId] = useState<string>(
    initialPartyId || (eligibleParties[0]?.id || '')
  );

  const selectedParty = useMemo(() => {
    return parties.find((p) => p.id === selectedPartyId);
  }, [parties, selectedPartyId]);

  const currentOutstanding = selectedParty ? selectedParty.currentBalance : 0;

  const [amountInput, setAmountInput] = useState<string>(
    currentOutstanding > 0 ? currentOutstanding.toString() : ''
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [notes, setNotes] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');

  const parsedAmount = useMemo(() => {
    const a = parseFloat(amountInput);
    return isNaN(a) || a < 0 ? 0 : a;
  }, [amountInput]);

  const handlePayFull = () => {
    setAmountInput(currentOutstanding.toString());
  };

  const handlePayHalf = () => {
    setAmountInput((Math.round((currentOutstanding / 2) * 100) / 100).toString());
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!selectedPartyId) {
      setValidationError(isRtl ? 'يرجى اختيار الحساب' : 'Please select an account');
      return;
    }

    if (parsedAmount <= 0) {
      setValidationError(isRtl ? 'يرجى إدخال مبلغ صحيح أكبر من صفر' : 'Please enter a valid amount greater than 0');
      return;
    }

    onSubmit({
      partyId: selectedPartyId,
      type,
      amount: parsedAmount,
      paymentMethod,
      notes: notes.trim(),
    });
  };

  return (
    <motion.div
      id="modal-payment-receipt-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end md:items-center justify-center p-0 md:p-4 overflow-y-auto"
    >
      <motion.div
        id="modal-payment-receipt-container"
        initial={{ opacity: 0, y: 64, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 48, scale: 0.98 }}
        transition={{ type: 'spring', damping: 28, stiffness: 340, mass: 0.8 }}
        className="w-full max-w-md bg-slate-900 rounded-t-3xl md:rounded-3xl border border-slate-800 p-5 space-y-4 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isReceipt
                  ? 'bg-sky-950/70 text-sky-400 border border-sky-800/40'
                  : 'bg-purple-950/70 text-purple-400 border border-purple-800/40'
              }`}
            >
              {isReceipt ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                {isReceipt ? t.receiptTitle : t.voucherTitle}
              </h2>
              <p className="text-[11px] text-slate-400">
                {isReceipt ? t.receiptDesc : t.voucherDesc}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {validationError && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800/60 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-3.5">
          {/* Party Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              {isReceipt ? (isRtl ? 'استلمنا من السيد / العميل:' : 'Received From Customer:') : (isRtl ? 'صُرف إلى المورد / الجهة:' : 'Paid To Supplier:')}
            </label>
            <select
              id="select-receipt-party"
              value={selectedPartyId}
              onChange={(e) => {
                setSelectedPartyId(e.target.value);
                const target = parties.find((p) => p.id === e.target.value);
                if (target && target.currentBalance > 0) {
                  setAmountInput(target.currentBalance.toString());
                }
              }}
              required
              className="w-full bg-slate-950 text-slate-100 text-xs rounded-xl px-3 py-2.5 border border-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 shadow-2xs"
            >
              {eligibleParties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({t.currentBalance}: {formatCurrency(p.currentBalance, currency, lang)})
                </option>
              ))}
            </select>
          </div>

          {/* Current Outstanding Notice */}
          {selectedParty && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs shadow-2xs">
              <span className="text-slate-400">{t.currentOutstanding}:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-rose-300">
                  {formatCurrency(currentOutstanding, currency, lang)}
                </span>
                {currentOutstanding > 0 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handlePayHalf}
                      className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-750 text-[10px] font-semibold text-slate-200 border border-slate-700/50"
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={handlePayFull}
                      className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-750 text-[10px] font-semibold text-slate-200 border border-slate-700/50"
                    >
                      {t.payAllDebt}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Amount Paid Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              {t.amount} <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                id="input-receipt-amount"
                type="number"
                min="0.01"
                step="any"
                required
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-950 text-slate-100 font-mono text-lg font-black rounded-xl ps-3 pe-12 py-2.5 border border-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 shadow-2xs"
              />
              <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                {currency}
              </span>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              {t.paymentMethod}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  paymentMethod === 'CASH'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700/60 shadow-2xs'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {t.cash}
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('BANK_TRANSFER')}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  paymentMethod === 'BANK_TRANSFER'
                    ? 'bg-sky-950 text-sky-300 border-sky-700/60 shadow-2xs'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {t.bankTransfer}
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('CHEQUE')}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  paymentMethod === 'CHEQUE'
                    ? 'bg-purple-950 text-purple-300 border-purple-700/60 shadow-2xs'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {t.cheque}
              </button>
            </div>
          </div>

          {/* Notes / Reference */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              {t.partyNotes}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                isReceipt
                  ? (isRtl ? 'مثال: سداد نقدي جزئي / رقم الحوالة البنكية' : 'e.g. Cash payment / Bank transfer ref')
                  : (isRtl ? 'مثال: سداد فاتورة توريد / شيك رقم...' : 'e.g. Payment for supply invoice / Cheque #')
              }
              className="w-full bg-slate-950 text-slate-100 placeholder-slate-500 text-xs rounded-xl px-3 py-2.5 border border-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 shadow-2xs"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs transition-colors border border-slate-700/50 shadow-2xs"
            >
              {t.cancel}
            </button>
            <button
              id="btn-confirm-save-receipt"
              type="submit"
              className={`flex-1 py-3 rounded-xl text-white font-bold text-xs shadow-md transition-all active:scale-98 border ${
                isReceipt
                  ? 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 shadow-sky-950/30 border-sky-400/20'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-950/30 border-purple-400/20'
              }`}
            >
              {isRtl ? 'تأكيد السند وترحيل الحساب' : 'Confirm & Post Voucher'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
