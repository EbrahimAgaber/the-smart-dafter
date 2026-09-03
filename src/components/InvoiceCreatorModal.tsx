import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Plus,
  Trash2,
  ShoppingBag,
  Truck,
  Coins,
  Package,
  Check,
  AlertCircle,
  Search,
} from 'lucide-react';
import { BusinessProfile, Language, LineItem, Party, Product, TransactionType } from '../types';
import { getTranslation } from '../i18n/translations';
import { formatCurrency } from '../utils/formatters';

interface InvoiceCreatorModalProps {
  type: 'SALE_CREDIT' | 'SUPPLY_CREDIT';
  parties: Party[];
  products: Product[];
  profile: BusinessProfile;
  lang: Language;
  initialPartyId?: string;
  onClose: () => void;
  onSubmit: (txData: {
    partyId: string;
    type: TransactionType;
    items: LineItem[];
    totalAmount: number;
    paidAmount: number;
    remainingBalanceDelta: number;
    notes: string;
    paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE';
  }) => void;
}

export const InvoiceCreatorModal: React.FC<InvoiceCreatorModalProps> = ({
  type,
  parties,
  products,
  profile,
  lang,
  initialPartyId,
  onClose,
  onSubmit,
}) => {
  const t = getTranslation(lang);
  const currency = profile.currency || 'SAR';
  const isRtl = lang === 'ar';
  const isSale = type === 'SALE_CREDIT';
  const targetPartyType = isSale ? 'CUSTOMER' : 'DISTRIBUTOR';

  // Filter parties by type
  const eligibleParties = useMemo(() => {
    return parties.filter((p) => p.type === targetPartyType);
  }, [parties, targetPartyType]);

  const [selectedPartyId, setSelectedPartyId] = useState<string>(
    initialPartyId || (eligibleParties[0]?.id || '')
  );

  const [items, setItems] = useState<LineItem[]>([
    {
      name: '',
      quantity: 1,
      unitPrice: 0,
      subtotal: 0,
    },
  ]);

  const [paidNowInput, setPaidNowInput] = useState<string>('0');
  const [notes, setNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'CHEQUE'>('CASH');
  const [validationError, setValidationError] = useState<string>('');

  // Calculate invoice subtotal
  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
  }, [items]);

  const paidAmount = useMemo(() => {
    const p = parseFloat(paidNowInput);
    return isNaN(p) || p < 0 ? 0 : p;
  }, [paidNowInput]);

  const remainingBalanceDelta = useMemo(() => {
    return Math.max(0, totalAmount - paidAmount);
  }, [totalAmount, paidAmount]);

  // Selected party object
  const selectedParty = useMemo(() => {
    return parties.find((p) => p.id === selectedPartyId);
  }, [parties, selectedPartyId]);

  // Handle item change
  const handleItemChange = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    if (field === 'quantity' || field === 'unitPrice') {
      const q = Math.max(0, Number(item.quantity) || 0);
      const p = Math.max(0, Number(item.unitPrice) || 0);
      item.subtotal = Math.round(q * p * 100) / 100;
    }

    updated[index] = item;
    setItems(updated);
  };

  // Add line item
  const handleAddItem = () => {
    setItems([
      ...items,
      {
        name: '',
        quantity: 1,
        unitPrice: 0,
        subtotal: 0,
      },
    ]);
  };

  // Remove line item
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Quick select product from catalog
  const handleSelectProduct = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const updated = [...items];
    const unitPrice = isSale ? prod.defaultSalePrice : prod.defaultCostPrice;
    const quantity = updated[index].quantity || 1;

    updated[index] = {
      productId: prod.id,
      name: prod.name,
      quantity,
      unitPrice,
      subtotal: Math.round(quantity * unitPrice * 100) / 100,
    };
    setItems(updated);
  };

  // Quick payment split helpers
  const handleSetPaidZero = () => {
    setPaidNowInput('0');
  };

  const handleSetPaidFull = () => {
    setPaidNowInput(totalAmount.toString());
  };

  const handleSetPaidHalf = () => {
    setPaidNowInput((Math.round((totalAmount / 2) * 100) / 100).toString());
  };

  // Form submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!selectedPartyId) {
      setValidationError(isRtl ? 'يرجى اختيار الحساب أولاً' : 'Please select an account');
      return;
    }

    // Validate items
    const validItems = items.filter((item) => item.name.trim() !== '' && item.quantity > 0);
    if (validItems.length === 0) {
      setValidationError(
        isRtl
          ? 'يرجى إضافة صنف واحد على الأقل مع اسم وكمية صحيحة'
          : 'Please add at least one line item with valid name and quantity'
      );
      return;
    }

    if (totalAmount <= 0) {
      setValidationError(isRtl ? 'إجمالي الفاتورة يجب أن يكون أكبر من صفر' : 'Invoice total must be greater than zero');
      return;
    }

    if (paidAmount > totalAmount) {
      setValidationError(
        isRtl
          ? 'المبلغ المسدد نقدًا لا يمكن أن يتجاوز إجمالي الفاتورة'
          : 'Paid amount cannot exceed total invoice amount'
      );
      return;
    }

    onSubmit({
      partyId: selectedPartyId,
      type,
      items: validItems,
      totalAmount,
      paidAmount,
      remainingBalanceDelta,
      notes: notes.trim(),
      paymentMethod,
    });
  };

  return (
    <motion.div
      id="modal-invoice-creator-backdrop"
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
        id="modal-invoice-creator-container"
        initial={{ opacity: 0, y: 64, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 48, scale: 0.98 }}
        transition={{ type: 'spring', damping: 28, stiffness: 340, mass: 0.8 }}
        className="w-full max-w-lg bg-slate-900 rounded-t-3xl md:rounded-3xl border border-slate-800 p-5 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isSale
                  ? 'bg-rose-950/70 text-rose-400 border border-rose-800/40'
                  : 'bg-amber-950/70 text-amber-400 border border-amber-800/40'
              }`}
            >
              {isSale ? <ShoppingBag className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                {isSale ? t.creditSaleTitle : t.supplyIntakeTitle}
              </h2>
              <p className="text-[11px] text-slate-400">
                {isRtl ? 'تسجيل بضاعة وقيد محاسبي فوري' : 'Fast credit invoice entry'}
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

        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Step 1: Pick Party */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              {t.selectParty} <span className="text-rose-400">*</span>
            </label>
            <select
              id="select-invoice-party"
              value={selectedPartyId}
              onChange={(e) => setSelectedPartyId(e.target.value)}
              required
              className="w-full bg-slate-950 text-slate-100 text-xs rounded-xl px-3 py-2.5 border border-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 shadow-2xs"
            >
              {eligibleParties.length === 0 ? (
                <option value="">
                  {isRtl ? 'لا يوجد حسابات متاحة - أضف حساب أولاً' : 'No accounts available - add one first'}
                </option>
              ) : (
                eligibleParties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({t.currentBalance}: {formatCurrency(p.currentBalance, currency, lang)})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Step 2: Line Items */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">
                {t.itemsList} ({items.length})
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.addItem}</span>
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 relative shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    {/* Catalog Dropdown Preset */}
                    {products.length > 0 && (
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleSelectProduct(idx, e.target.value);
                          }
                        }}
                        className="w-1/3 bg-slate-900 text-slate-300 text-[11px] rounded-lg px-2 py-1.5 border border-slate-800"
                        defaultValue=""
                      >
                        <option value="" disabled>
                          {t.selectFromCatalog}...
                        </option>
                        {products.map((prod) => (
                          <option key={prod.id} value={prod.id}>
                            {prod.name}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Custom Item Name */}
                    <input
                      type="text"
                      placeholder={t.itemName}
                      value={item.name}
                      onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                      required
                      className="flex-1 bg-slate-900 text-slate-100 placeholder-slate-500 text-xs rounded-lg px-2.5 py-1.5 border border-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                    />

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-400 hover:text-rose-400 p-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Qty, Unit Price, Subtotal */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">
                        {t.quantity}
                      </span>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-slate-900 text-slate-100 text-xs font-mono rounded-lg px-2 py-1 border border-slate-800 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">
                        {t.unitPrice}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-slate-900 text-slate-100 text-xs font-mono rounded-lg px-2 py-1 border border-slate-800 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">
                        {t.subtotal}
                      </span>
                      <div className="w-full bg-slate-900 text-emerald-400 text-xs font-bold font-mono rounded-lg px-2 py-1 border border-slate-800 text-end shadow-inner">
                        {formatCurrency(item.subtotal, currency, lang)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step 3: Payment Split & Math Breakdown */}
          <div
            id="payment-split-box"
            className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 shadow-2xs"
          >
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
              <span className="font-bold text-slate-300">{t.invoiceTotal}:</span>
              <span className="text-base font-black font-mono text-slate-100">
                {formatCurrency(totalAmount, currency, lang)}
              </span>
            </div>

            {/* Paid Now Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">
                  {t.paidNow}
                </label>
                {/* Helper chips */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleSetPaidZero}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold border border-slate-700/50"
                  >
                    {t.payZero}
                  </button>
                  <button
                    type="button"
                    onClick={handleSetPaidHalf}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold border border-slate-700/50"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={handleSetPaidFull}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold border border-slate-700/50"
                  >
                    {t.payInFull}
                  </button>
                </div>
              </div>

              <input
                id="input-invoice-paid-amount"
                type="number"
                min="0"
                max={totalAmount}
                step="any"
                value={paidNowInput}
                onChange={(e) => setPaidNowInput(e.target.value)}
                className="w-full bg-slate-900 text-slate-100 font-mono text-sm font-bold rounded-xl px-3 py-2 border border-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-end shadow-2xs"
              />
            </div>

            {/* Remaining Debt Highlight */}
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-xs text-rose-300 font-bold block">
                  {t.remainingDebtDelta}
                </span>
                <span className="text-[10px] text-slate-400">
                  {isRtl ? 'يُضاف إلى دفتر الحسابات' : 'Will be posted to ledger'}
                </span>
              </div>
              <div className="text-base font-black font-mono text-rose-400">
                +{formatCurrency(remainingBalanceDelta, currency, lang)}
              </div>
            </div>

            {/* Payment Method */}
            {paidAmount > 0 && (
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  {t.paymentMethod}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      paymentMethod === 'CASH'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-700/60 shadow-2xs'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {t.cash}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('BANK_TRANSFER')}
                    className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      paymentMethod === 'BANK_TRANSFER'
                        ? 'bg-sky-950 text-sky-400 border-sky-700/60 shadow-2xs'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {t.bankTransfer}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CHEQUE')}
                    className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      paymentMethod === 'CHEQUE'
                        ? 'bg-purple-950 text-purple-400 border-purple-700/60 shadow-2xs'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {t.cheque}
                  </button>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t.notesPlaceholder}
                className="w-full bg-slate-900 text-slate-200 placeholder-slate-500 text-xs rounded-xl px-3 py-2 border border-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 shadow-2xs"
              />
            </div>
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
              id="btn-confirm-save-invoice"
              type="submit"
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-950/30 transition-all active:scale-98 border border-emerald-400/20"
            >
              {t.saveTransaction}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
