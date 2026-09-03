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
  Volume2,
} from 'lucide-react';
import { BusinessProfile, Language, LineItem, Party, Product, TransactionType } from '../types';
import { getTranslation } from '../i18n/translations';
import { formatCurrency } from '../utils/formatters';
import { playSuccessChime, speakText, getAvatarColorClass } from '../utils/speechFeedback';

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
    subtotalBeforeTax?: number;
    discountAmount?: number;
    taxRate?: number;
    taxAmount?: number;
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
  const [discountInput, setDiscountInput] = useState<string>('0');
  const [applyVat, setApplyVat] = useState<boolean>(profile.isVatEnabled ?? true);
  const [notes, setNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'CHEQUE'>('CASH');
  const [validationError, setValidationError] = useState<string>('');

  // Calculate invoice subtotal, discounts, and tax
  const itemsSubtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
  }, [items]);

  const discountAmount = useMemo(() => {
    const d = parseFloat(discountInput);
    return isNaN(d) || d < 0 ? 0 : Math.min(itemsSubtotal, d);
  }, [discountInput, itemsSubtotal]);

  const netBeforeTax = useMemo(() => {
    return Math.max(0, itemsSubtotal - discountAmount);
  }, [itemsSubtotal, discountAmount]);

  const taxRate = applyVat ? (profile.defaultTaxRate ?? 15) : 0;
  const taxAmount = useMemo(() => {
    if (!applyVat || taxRate <= 0) return 0;
    return Math.round(netBeforeTax * (taxRate / 100) * 100) / 100;
  }, [applyVat, taxRate, netBeforeTax]);

  const totalAmount = useMemo(() => {
    return Math.round((netBeforeTax + taxAmount) * 100) / 100;
  }, [netBeforeTax, taxAmount]);

  const paidAmount = useMemo(() => {
    const p = parseFloat(paidNowInput);
    return isNaN(p) || p < 0 ? 0 : p;
  }, [paidNowInput]);

  const remainingBalanceDelta = useMemo(() => {
    return Math.max(0, totalAmount - paidAmount);
  }, [totalAmount, paidAmount]);

  // Quick increment for low-literacy users
  const handleAddPaidIncrement = (inc: number) => {
    const current = parseFloat(paidNowInput) || 0;
    const nextVal = Math.min(totalAmount, current + inc);
    setPaidNowInput(nextVal.toString());
  };

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
    const updated = items.filter((_, idx) => idx !== index);
    setItems(updated);
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

  // Quick paid helpers
  const handleSetPaidZero = () => setPaidNowInput('0');
  const handleSetPaidHalf = () => setPaidNowInput((totalAmount / 2).toFixed(2));
  const handleSetPaidFull = () => setPaidNowInput(totalAmount.toString());

  // Form submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!selectedPartyId) {
      setValidationError(isRtl ? 'يرجى اختيار العميل أو المورد' : 'Please select party');
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

    // Auditory & spoken feedback for low literacy / illiterate shopkeepers
    playSuccessChime();
    speakText(
      isRtl
        ? `تم تسجيل الفاتورة بمبلغ ${totalAmount} ريال على حساب ${selectedParty?.name || 'العميل'}`
        : `Invoice of ${totalAmount} saved for ${selectedParty?.name || 'customer'}`,
      isRtl ? 'ar' : 'en'
    );

    onSubmit({
      partyId: selectedPartyId,
      type,
      items: validItems,
      subtotalBeforeTax: netBeforeTax,
      discountAmount,
      taxRate,
      taxAmount,
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
        className="w-full max-w-lg bg-white rounded-t-3xl md:rounded-3xl border border-slate-200 p-5 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isSale
                  ? 'bg-rose-50/70 text-rose-400 border border-rose-200/40'
                  : 'bg-amber-50/70 text-amber-600 border border-amber-200/40'
              }`}
            >
              {isSale ? <ShoppingBag className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {isSale ? t.creditSaleTitle : t.supplyIntakeTitle}
              </h2>
              <p className="text-xs text-slate-400">
                {isRtl ? 'تسجيل بضاعة وقيد محاسبي فوري' : 'Fast credit invoice entry'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {validationError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Prominent Optional VAT Invoice Mode Selector */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setApplyVat(false)}
              className={`py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
                !applyVat
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>{isRtl ? 'فاتورة عادية (بدون ضريبة 0%)' : 'Standard (0% VAT)'}</span>
            </button>
            <button
              type="button"
              onClick={() => setApplyVat(true)}
              className={`py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
                applyVat
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>{isRtl ? 'فاتورة ضريبية (15% VAT)' : 'Tax Invoice (15% VAT)'}</span>
            </button>
          </div>

          {/* Step 1: Pick Party with Visual Avatar Badge & Audio Button */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                {t.selectParty} <span className="text-rose-400">*</span>
              </label>
              {selectedParty && (
                <button
                  type="button"
                  onClick={() => speakText(`${selectedParty.name}، الرصيد ${selectedParty.currentBalance} ريال`, isRtl ? 'ar' : 'en')}
                  title={isRtl ? 'استمع لاسم الحساب' : 'Listen'}
                  className="flex items-center gap-1 text-[11px] text-cyan-700 hover:text-cyan-800 font-semibold"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'استمع' : 'Listen'}</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selectedParty && (
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${getAvatarColorClass(selectedParty.name)}`}>
                  {selectedParty.name.charAt(0)}
                </div>
              )}
              <select
                id="select-invoice-party"
                value={selectedPartyId}
                onChange={(e) => setSelectedPartyId(e.target.value)}
                required
                className="flex-1 bg-slate-50 text-slate-900 text-xs rounded-xl px-3 py-2.5 border border-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 shadow-2xs"
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
          </div>

          {/* Step 2: Line Items */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                {t.itemsList} ({items.length})
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-green-600 hover:text-green-700 font-bold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.addItem}</span>
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 relative shadow-2xs"
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
                        className="w-1/3 bg-white text-slate-700 text-xs rounded-lg px-2 py-1.5 border border-slate-200"
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
                      className="flex-1 bg-white text-slate-900 placeholder-slate-500 text-xs rounded-lg px-2.5 py-1.5 border border-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
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
                      <span className="text-xs text-slate-400 block mb-0.5">
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
                        className="w-full bg-white text-slate-900 text-xs font-mono rounded-lg px-2 py-1 border border-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block mb-0.5">
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
                        className="w-full bg-white text-slate-900 text-xs font-mono rounded-lg px-2 py-1 border border-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block mb-0.5">
                        {t.subtotal}
                      </span>
                      <div className="w-full bg-white text-green-600 text-xs font-bold font-mono rounded-lg px-2 py-1 border border-slate-200 text-end shadow-inner">
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
            className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 shadow-2xs"
          >
            {/* Subtotal, Discount & Tax Itemization */}
            <div className="space-y-2 pb-3 border-b border-slate-200 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>{isRtl ? 'إجمالي الأصناف:' : 'Items Subtotal:'}</span>
                <span className="font-mono font-bold text-slate-800">
                  {formatCurrency(itemsSubtotal, currency, lang)}
                </span>
              </div>

              {/* Discount Row */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-600">{isRtl ? 'الخصم / الحسم:' : 'Discount:'}</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max={itemsSubtotal}
                    step="any"
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    placeholder="0"
                    className="w-20 bg-white text-slate-900 text-xs font-mono font-bold text-end rounded-lg px-2 py-1 border border-slate-200"
                  />
                  <span className="text-[11px] text-slate-400 font-mono">{currency}</span>
                </div>
              </div>

              {/* VAT Row */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">
                    {isRtl ? `ضريبة القيمة المضافة (${taxRate}%):` : `VAT (${taxRate}%):`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setApplyVat(!applyVat)}
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold transition-colors ${
                      applyVat
                        ? 'bg-cyan-100 text-cyan-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {applyVat ? (isRtl ? 'مطبقة' : 'Active') : (isRtl ? 'معفي' : 'Exempt')}
                  </button>
                </div>
                <span className="font-mono font-bold text-slate-800">
                  {formatCurrency(taxAmount, currency, lang)}
                </span>
              </div>
            </div>

            {/* Grand Total */}
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
              <span className="font-black text-slate-900 text-sm">
                {isRtl ? 'الإجمالي الصافي النهائي:' : 'Final Grand Total:'}
              </span>
              <span className="text-base font-black font-mono text-cyan-800">
                {formatCurrency(totalAmount, currency, lang)}
              </span>
            </div>

            {/* Paid Now Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  {t.paidNow}
                </label>
                {/* Helper chips */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleSetPaidZero}
                    className="text-xs px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-300/50"
                  >
                    {t.payZero}
                  </button>
                  <button
                    type="button"
                    onClick={handleSetPaidHalf}
                    className="text-xs px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-300/50"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={handleSetPaidFull}
                    className="text-xs px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-300/50"
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
                className="w-full bg-white text-slate-900 font-mono text-sm font-bold rounded-xl px-3 py-2 border border-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 text-end shadow-2xs"
              />

              {/* Quick POS Increment Buttons for Low-literacy Easy Tapping */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400 me-1">
                  {isRtl ? 'إضافة سريعة:' : 'Quick Add:'}
                </span>
                {[10, 50, 100, 500].map((inc) => (
                  <button
                    key={inc}
                    type="button"
                    onClick={() => handleAddPaidIncrement(inc)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-800 font-mono font-bold border border-slate-200 shadow-2xs transition-colors"
                  >
                    +{inc}
                  </button>
                ))}
              </div>
            </div>

            {/* Remaining Debt Highlight */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-xs text-rose-300 font-bold block">
                  {t.remainingDebtDelta}
                </span>
                <span className="text-xs text-slate-400">
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
                <label className="block text-xs text-slate-400 mb-1">
                  {t.paymentMethod}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      paymentMethod === 'CASH'
                        ? 'bg-green-50 text-green-600 border-cyan-700/60 shadow-2xs'
                        : 'bg-white text-slate-400 border-slate-200 hover:text-slate-800'
                    }`}
                  >
                    {t.cash}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('BANK_TRANSFER')}
                    className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      paymentMethod === 'BANK_TRANSFER'
                        ? 'bg-sky-50 text-sky-600 border-sky-700/60 shadow-2xs'
                        : 'bg-white text-slate-400 border-slate-200 hover:text-slate-800'
                    }`}
                  >
                    {t.bankTransfer}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CHEQUE')}
                    className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      paymentMethod === 'CHEQUE'
                        ? 'bg-purple-50 text-purple-600 border-purple-700/60 shadow-2xs'
                        : 'bg-white text-slate-400 border-slate-200 hover:text-slate-800'
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
                className="w-full bg-white text-slate-800 placeholder-slate-500 text-xs rounded-xl px-3 py-2 border border-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 shadow-2xs"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-750 text-slate-700 font-semibold text-xs transition-colors border border-slate-300/50 shadow-2xs"
            >
              {t.cancel}
            </button>
            <button
              id="btn-confirm-save-invoice"
              type="submit"
              className="flex-1 py-3 rounded-xl bg-cyan-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-cyan-950/30 transition-all active:scale-98 border border-cyan-400/20"
            >
              {t.saveTransaction}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
