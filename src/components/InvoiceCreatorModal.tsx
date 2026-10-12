import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  ChevronDown,
  Layers,
  Phone,
  Barcode,
  Flame,
  UserPlus,
  LayoutGrid,
  List,
  Camera,
  RotateCcw,
} from 'lucide-react';
import { BusinessProfile, Language, LineItem, Party, Product, TransactionType } from '../types';
import { getTranslation } from '../i18n/translations';
import { formatCurrency, sanitizePhoneNumber } from '../utils/formatters';
import { playSuccessChime, getAvatarColorClass } from '../utils/speechFeedback';

interface InvoiceCreatorModalProps {
  type: TransactionType;
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
    customerPhone?: string;
    autoSendWhatsApp?: boolean;
    dueDate?: string;
    supplierInvoiceAttachment?: string;
  }) => void;
  onAddParty?: (partyData: Omit<Party, 'id' | 'currentBalance' | 'createdAt'>) => Party;
  onAddProduct?: (prodData: Omit<Product, 'id'>) => Product;
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
  onAddParty,
  onAddProduct,
}) => {
  const t = getTranslation(lang);
  const currency = profile.currency || 'SAR';
  const isRtl = lang === 'ar';

  const [docMode, setDocMode] = useState<TransactionType>(type);
  const isSale = docMode === 'SALE_CREDIT' || docMode === 'QUOTATION' || docMode === 'RETURN_SALE';
  const targetPartyType = isSale ? 'CUSTOMER' : 'DISTRIBUTOR';

  // Eligible parties by role
  const eligibleParties = useMemo(() => {
    return parties.filter((p) => p.type === targetPartyType);
  }, [parties, targetPartyType]);

  const [selectedPartyId, setSelectedPartyId] = useState<string>(
    initialPartyId || (eligibleParties[0]?.id || '')
  );

  // Selected party object
  const selectedParty = useMemo(() => {
    return parties.find((p) => p.id === selectedPartyId);
  }, [parties, selectedPartyId]);

  // Customer phone number state for direct WhatsApp dispatch
  const [customerPhone, setCustomerPhone] = useState<string>(() => {
    return selectedParty?.phone || '';
  });

  // Keep customerPhone in sync when party changes
  useEffect(() => {
    if (selectedParty) {
      setCustomerPhone(selectedParty.phone || '');
    }
  }, [selectedParty]);

  // Auto-send invoice via WhatsApp toggle
  const [autoSendWhatsApp, setAutoSendWhatsApp] = useState<boolean>(true);

  // Party search query & modal dropdown
  const [partySearchQuery, setPartySearchQuery] = useState('');
  const [isPartySearchOpen, setIsPartySearchOpen] = useState(false);

  // Inline new customer creation state
  const [isAddingCustomerInline, setIsAddingCustomerInline] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [customerCreateFeedback, setCustomerCreateFeedback] = useState<string>('');

  // Product catalog state (handling 100+ items smoothly)
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFullCatalogOpen, setIsFullCatalogOpen] = useState(false);
  const [saveCustomToCatalog, setSaveCustomToCatalog] = useState(true);

  // Barcode Scanner state
  const [isScanningBarcode, setIsScanningBarcode] = useState(false);
  const [barcodeScanFeedback, setBarcodeScanFeedback] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Autocomplete state for inline item name editing
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number | null>(null);

  // Line items state (start empty or with 1 clean row if user wants custom)
  const [items, setItems] = useState<LineItem[]>([]);

  const [paidNowInput, setPaidNowInput] = useState<string>('0');
  const [discountInput, setDiscountInput] = useState<string>('0');
  const [applyVat, setApplyVat] = useState<boolean>(profile.isVatEnabled ?? true);
  const [notes, setNotes] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [supplierInvoicePhoto, setSupplierInvoicePhoto] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'CHEQUE'>('CASH');
  const [validationError, setValidationError] = useState<string>('');

  // Normalize text helper for Arabic & digit search
  const normalizeSearch = (str: string) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/[٠-٩]/g, (d) => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)])
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/[\u064B-\u065F]/g, '')
      .trim();
  };

  // Extract smart categories dynamically from catalog products
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.unit && p.unit.trim()) {
        set.add(p.unit.trim());
      }
    });
    return Array.from(set);
  }, [products]);

  // Top favorites / most used products
  const topFavoriteProducts = useMemo(() => {
    return products.slice(0, 8);
  }, [products]);

  // Filtered parties for search dropdown
  const filteredParties = useMemo(() => {
    const q = normalizeSearch(partySearchQuery);
    if (!q) return eligibleParties;
    return eligibleParties.filter((p) => {
      const name = normalizeSearch(p.name);
      const phone = normalizeSearch(p.phone);
      const addr = normalizeSearch(p.address || '');
      return name.includes(q) || phone.includes(q) || addr.includes(q);
    });
  }, [eligibleParties, partySearchQuery]);

  // Filtered products for catalog shelf (optimized for 100+ products)
  const filteredProducts = useMemo(() => {
    const q = normalizeSearch(productSearchQuery);

    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== 'all' && selectedCategory !== 'favorites') {
        if (p.unit !== selectedCategory) return false;
      } else if (selectedCategory === 'favorites') {
        if (!topFavoriteProducts.some((top) => top.id === p.id)) return false;
      }

      // Text query
      if (!q) return true;
      const name = normalizeSearch(p.name);
      const barcode = normalizeSearch(p.barcode || '');
      const unit = normalizeSearch(p.unit || '');
      return name.includes(q) || barcode.includes(q) || unit.includes(q);
    });
  }, [products, productSearchQuery, selectedCategory, topFavoriteProducts]);

  // Map of currently added products by product ID and quantity
  const addedProductQuantities = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((item) => {
      if (item.productId) {
        map.set(item.productId, (map.get(item.productId) || 0) + (item.quantity || 0));
      } else if (item.name.trim()) {
        const matched = products.find(
          (p) => p.name.trim().toLowerCase() === item.name.trim().toLowerCase()
        );
        if (matched) {
          map.set(matched.id, (map.get(matched.id) || 0) + (item.quantity || 0));
        }
      }
    });
    return map;
  }, [items, products]);

  // Calculate invoice subtotal, discounts, and tax
  const itemsSubtotal = useMemo(() => {
    return Math.round(items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0) * 100) / 100;
  }, [items]);

  const discountAmount = useMemo(() => {
    const d = parseFloat(discountInput);
    return isNaN(d) || d < 0 ? 0 : Math.min(itemsSubtotal, Math.round(d * 100) / 100);
  }, [discountInput, itemsSubtotal]);

  const netBeforeTax = useMemo(() => {
    return Math.max(0, Math.round((itemsSubtotal - discountAmount) * 100) / 100);
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
    return isNaN(p) || p < 0 ? 0 : Math.round(p * 100) / 100;
  }, [paidNowInput]);

  const remainingBalanceDelta = useMemo(() => {
    if (docMode === 'QUOTATION') return 0;
    if (docMode === 'RETURN_SALE') {
      return -Math.max(0, Math.round((totalAmount - paidAmount) * 100) / 100);
    }
    return Math.max(0, Math.round((totalAmount - paidAmount) * 100) / 100);
  }, [totalAmount, paidAmount, docMode]);

  // Rapid One-Tap Product Add or Increment
  const handleQuickAddProduct = (prod: Product, targetQty = 1) => {
    const unitPrice = isSale ? prod.defaultSalePrice : prod.defaultCostPrice;

    // Check if product is already in the list
    const existingIndex = items.findIndex(
      (i) => i.productId === prod.id || (i.name.trim() === prod.name.trim() && i.name.trim() !== '')
    );

    if (existingIndex >= 0) {
      const updated = [...items];
      const cur = updated[existingIndex];
      const newQty = (cur.quantity || 0) + targetQty;
      updated[existingIndex] = {
        ...cur,
        productId: prod.id,
        quantity: newQty,
        unitPrice: cur.unitPrice || unitPrice,
        subtotal: Math.round(newQty * (cur.unitPrice || unitPrice) * 100) / 100,
      };
      setItems(updated);
    } else {
      const newItem: LineItem = {
        productId: prod.id,
        name: prod.name,
        quantity: targetQty,
        unitPrice,
        subtotal: Math.round(targetQty * unitPrice * 100) / 100,
      };
      setItems([...items, newItem]);
    }

    setValidationError('');
  };

  // Decrement product quantity or remove
  const handleQuickDecrementProduct = (prod: Product) => {
    const existingIndex = items.findIndex(
      (i) => i.productId === prod.id || (i.name.trim() === prod.name.trim() && i.name.trim() !== '')
    );
    if (existingIndex < 0) return;

    const updated = [...items];
    const cur = updated[existingIndex];
    if (cur.quantity > 1) {
      const newQty = cur.quantity - 1;
      updated[existingIndex] = {
        ...cur,
        quantity: newQty,
        subtotal: Math.round(newQty * cur.unitPrice * 100) / 100,
      };
      setItems(updated);
    } else {
      setItems(items.filter((_, idx) => idx !== existingIndex));
    }
  };

  // Quick Wholesale Quantity Increment directly on a line item
  const handleIncrementItemQty = (index: number, delta: number) => {
    const updated = [...items];
    const cur = updated[index];
    const newQty = Math.max(1, (cur.quantity || 1) + delta);
    updated[index] = {
      ...cur,
      quantity: newQty,
      subtotal: Math.round(newQty * (cur.unitPrice || 0) * 100) / 100,
    };
    setItems(updated);
  };

  // Handle direct item property changes
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

  // Select autocomplete suggestion
  const handleSelectSuggestion = (index: number, prod: Product) => {
    const unitPrice = isSale ? prod.defaultSalePrice : prod.defaultCostPrice;
    const currentQty = items[index]?.quantity || 1;

    const updated = [...items];
    updated[index] = {
      productId: prod.id,
      name: prod.name,
      quantity: currentQty,
      unitPrice,
      subtotal: Math.round(currentQty * unitPrice * 100) / 100,
    };
    setItems(updated);
    setActiveSuggestionIndex(null);
  };

  // Add custom unlisted line item
  const handleAddCustomItem = () => {
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
    setItems(items.filter((_, idx) => idx !== index));
  };

  // Clear all items in invoice
  const handleClearAllItems = () => {
    setItems([]);
  };

  // Quick settlement helpers
  const handleSetPaidZero = () => setPaidNowInput('0');
  const handleSetPaidHalf = () => setPaidNowInput((totalAmount / 2).toFixed(2));
  const handleSetPaidFull = () => setPaidNowInput(totalAmount.toString());

  const handleAddPaidIncrement = (inc: number) => {
    const current = parseFloat(paidNowInput) || 0;
    const nextVal = Math.min(totalAmount, current + inc);
    setPaidNowInput(nextVal.toString());
  };

  // Inline new customer submit handler
  const handleCreateCustomerInline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;

    if (onAddParty) {
      const created = onAddParty({
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim(),
        type: targetPartyType,
        openingBalance: 0,
      });

      if (created) {
        setSelectedPartyId(created.id);
        setCustomerPhone(created.phone || '');
        setCustomerCreateFeedback(isRtl ? 'تم إضافة واختيار العميل بنجاح!' : 'Account created & selected!');
        setIsAddingCustomerInline(false);
        setNewCustomerName('');
        setNewCustomerPhone('');
        setTimeout(() => setCustomerCreateFeedback(''), 3000);
      }
    }
  };

  // Camera Barcode Scanning Handler
  useEffect(() => {
    let stream: MediaStream | null = null;
    let animFrame: number | null = null;

    if (isScanningBarcode) {
      const detectorSupported = 'BarcodeDetector' in window;
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: 'environment' } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play();

            if (detectorSupported) {
              // @ts-ignore
              const detector = new (window as any).BarcodeDetector({
                formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code'],
              });

              const detect = async () => {
                if (videoRef.current && videoRef.current.readyState === 4) {
                  try {
                    const barcodes = await detector.detect(videoRef.current);
                    if (barcodes.length > 0) {
                      const detected = barcodes[0].rawValue;
                      const matchedProd = products.find((p) => p.barcode === detected);
                      if (matchedProd) {
                        handleQuickAddProduct(matchedProd);
                        playSuccessChime();
                        setBarcodeScanFeedback(`${matchedProd.name} (+1)`);
                      } else {
                        setProductSearchQuery(detected);
                        setBarcodeScanFeedback(detected);
                      }
                      setIsScanningBarcode(false);
                      return;
                    }
                  } catch (e) {}
                }
                animFrame = requestAnimationFrame(detect);
              };
              animFrame = requestAnimationFrame(detect);
            }
          }
        })
        .catch(() => {
          setIsScanningBarcode(false);
        });
    }

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
  }, [isScanningBarcode, products]);

  // Hardware USB/Bluetooth Barcode Scanner Auto-Detection
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      const diff = now - lastKeyTime;
      lastKeyTime = now;

      if (e.key === 'Enter') {
        if (buffer.length >= 3 && diff < 90) {
          e.preventDefault();
          const code = buffer.trim();
          const matchedProd = products.find((p) => p.barcode === code);
          if (matchedProd) {
            handleQuickAddProduct(matchedProd);
            playSuccessChime();
            setBarcodeScanFeedback(`${matchedProd.name} (+1)`);
            setTimeout(() => setBarcodeScanFeedback(''), 2500);
          } else {
            setProductSearchQuery(code);
            setBarcodeScanFeedback(code);
            setTimeout(() => setBarcodeScanFeedback(''), 2500);
          }
          buffer = '';
        } else {
          buffer = '';
        }
      } else if (e.key.length === 1) {
        if (diff > 120) {
          buffer = e.key;
        } else {
          buffer += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products]);

  // Form submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!selectedPartyId) {
      setValidationError(isRtl ? 'يرجى اختيار العميل أو المورد' : 'Please select account');
      return;
    }

    // Filter valid items
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
      setValidationError(
        isRtl
          ? 'إجمالي الفاتورة يجب أن يكون أكبر من صفر'
          : 'Invoice total must be greater than zero'
      );
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

    // Optionally auto-save custom items to catalog
    if (saveCustomToCatalog && onAddProduct) {
      validItems.forEach((item) => {
        if (!item.productId && item.name.trim()) {
          const exists = products.some(
            (p) => p.name.trim().toLowerCase() === item.name.trim().toLowerCase()
          );
          if (!exists) {
            onAddProduct({
              name: item.name.trim(),
              unit: isRtl ? 'قطعة' : 'Piece',
              defaultSalePrice: isSale ? item.unitPrice : item.unitPrice * 1.2,
              defaultCostPrice: isSale ? item.unitPrice * 0.8 : item.unitPrice,
            });
          }
        }
      });
    }

    playSuccessChime();

    const finalNotes = returnReason
      ? `${isRtl ? 'سبب الإرجاع: ' : 'Return Reason: '}${returnReason}${notes.trim() ? ` - ${notes.trim()}` : ''}`
      : notes.trim();

    onSubmit({
      partyId: selectedPartyId,
      type: docMode,
      items: validItems,
      subtotalBeforeTax: netBeforeTax,
      discountAmount,
      taxRate,
      taxAmount,
      totalAmount,
      paidAmount,
      remainingBalanceDelta,
      notes: finalNotes,
      paymentMethod,
      customerPhone: customerPhone.trim(),
      autoSendWhatsApp,
      dueDate: dueDate || undefined,
      supplierInvoiceAttachment: supplierInvoicePhoto || undefined,
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
        className="w-full max-w-2xl bg-white rounded-t-3xl md:rounded-3xl border border-slate-200 p-4 md:p-5 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto flex flex-col pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+1rem))]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-2xs ${
                isSale
                  ? 'bg-rose-50 text-rose-600 border border-rose-200/50'
                  : 'bg-amber-50 text-amber-600 border border-amber-200/50'
              }`}
            >
              {isSale ? <ShoppingBag className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                {isSale ? t.creditSaleTitle : t.supplyIntakeTitle}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isRtl ? 'تسجيل فوري مع إرسال تلقائي للواتساب وحفظ الرقم' : 'Instant invoice entry & auto WhatsApp'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label={isRtl ? 'إغلاق' : 'Close'}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-2xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {validationError && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{validationError}</span>
          </div>
        )}

        {customerCreateFeedback && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shrink-0">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{customerCreateFeedback}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4 flex-1">
          {/* Document Type Mode Switcher */}
          {targetPartyType === 'CUSTOMER' && (
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setDocMode('SALE_CREDIT')}
                className={`py-2 px-1.5 rounded-xl font-bold transition-all text-center min-h-[38px] ${
                  docMode === 'SALE_CREDIT'
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.docModeInvoice}
              </button>
              <button
                type="button"
                onClick={() => setDocMode('QUOTATION')}
                className={`py-2 px-1.5 rounded-xl font-bold transition-all text-center min-h-[38px] ${
                  docMode === 'QUOTATION'
                    ? 'bg-white text-indigo-700 shadow-2xs border border-indigo-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.docModeQuotation}
              </button>
              <button
                type="button"
                onClick={() => setDocMode('RETURN_SALE')}
                className={`py-2 px-1.5 rounded-xl font-bold transition-all text-center min-h-[38px] ${
                  docMode === 'RETURN_SALE'
                    ? 'bg-white text-rose-700 shadow-2xs border border-rose-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.docModeReturn}
              </button>
            </div>
          )}

          {/* Quotation / Credit Note Guidance Notice */}
          {docMode === 'QUOTATION' && (
            <div className="p-2.5 bg-indigo-50/80 rounded-xl border border-indigo-200 text-indigo-900 text-[11px] font-semibold leading-relaxed">
              ℹ️ {t.quotationNotice}
            </div>
          )}
          {docMode === 'RETURN_SALE' && (
            <div className="p-2.5 bg-rose-50/80 rounded-xl border border-rose-200 text-rose-900 text-[11px] font-semibold leading-relaxed">
              ⚠️ {t.creditNoteNotice}
            </div>
          )}

          {/* Tax / Standard Invoice Selector */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setApplyVat(false)}
              className={`py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 min-h-[40px] ${
                !applyVat
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{isRtl ? 'فاتورة عادية (0% بدون ضريبة)' : 'Standard (0% VAT)'}</span>
            </button>
            <button
              type="button"
              onClick={() => setApplyVat(true)}
              className={`py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 min-h-[40px] ${
                applyVat
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{isRtl ? 'فاتورة ضريبية (15% VAT)' : 'Tax Invoice (15% VAT)'}</span>
            </button>
          </div>

          {/* Section 1: Customer Account & Phone Number */}
          <div className="space-y-2.5 p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                {t.selectParty} <span className="text-rose-500">*</span>
              </label>

              <div className="flex items-center gap-2">
                {/* Search Account Toggle */}
                {eligibleParties.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setIsPartySearchOpen(!isPartySearchOpen)}
                    className="text-[11px] text-cyan-600 hover:text-cyan-700 font-bold flex items-center gap-1 min-h-[36px] px-2"
                  >
                    <Search className="w-3 h-3" />
                    <span>
                      {isPartySearchOpen
                        ? isRtl ? 'إخفاء' : 'Hide'
                        : isRtl ? 'بحث الحسابات' : 'Search'}
                    </span>
                  </button>
                )}

                {/* Inline New Customer Button */}
                {onAddParty && (
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomerInline(!isAddingCustomerInline)}
                    className="text-[11px] bg-cyan-50 hover:bg-cyan-100 text-cyan-800 font-bold px-2.5 py-1.5 rounded-xl border border-cyan-200 flex items-center gap-1 transition-colors min-h-[36px]"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-cyan-600" />
                    <span>{isRtl ? '+ إضافة عميل جديد' : '+ New Customer'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Inline Customer Creation Form */}
            <AnimatePresence>
              {isAddingCustomerInline && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 bg-white rounded-2xl border border-cyan-200 space-y-2.5 shadow-2xs overflow-hidden"
                >
                  <div className="text-xs font-bold text-cyan-900 flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-cyan-600" />
                    <span>{isRtl ? 'إضافة عميل جديد مباشرة للفاتورة' : 'Add new customer directly to invoice'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <input
                        type="text"
                        value={newCustomerName}
                        onChange={(e) => setNewCustomerName(e.target.value)}
                        placeholder={isRtl ? 'اسم العميل / المؤسسة...' : 'Customer or company name...'}
                        className="w-full bg-slate-50 text-slate-900 text-xs font-bold rounded-xl px-3 py-2 border border-slate-200 focus:outline-none focus:border-cyan-500 min-h-[40px]"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="bg-slate-100 text-slate-600 text-xs font-mono font-bold px-2 py-2 rounded-xl border border-slate-200 shrink-0">
                        🇸🇦 +966
                      </div>
                      <input
                        type="tel"
                        value={newCustomerPhone}
                        onChange={(e) => setNewCustomerPhone(e.target.value)}
                        placeholder="05XXXXXXXX"
                        className="flex-1 bg-slate-50 text-slate-900 text-xs font-mono font-bold rounded-xl px-3 py-2 border border-slate-200 focus:outline-none focus:border-cyan-500 min-h-[40px]"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingCustomerInline(false)}
                      className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 rounded-xl"
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateCustomerInline}
                      disabled={!newCustomerName.trim()}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-2xs transition-all"
                    >
                      {isRtl ? 'حفظ واختيار العميل' : 'Save & Select Account'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Fast Party Search Input */}
            {isPartySearchOpen && (
              <div className="relative">
                <Search className={`w-3.5 h-3.5 text-slate-400 absolute top-2.5 ${isRtl ? 'right-3' : 'left-3'} pointer-events-none`} />
                <input
                  type="text"
                  value={partySearchQuery}
                  onChange={(e) => setPartySearchQuery(e.target.value)}
                  placeholder={t.searchPartiesPlaceholder}
                  className={`w-full bg-white text-slate-900 text-xs rounded-xl py-2 border border-slate-200 focus:outline-none focus:border-cyan-500 ${
                    isRtl ? 'pr-8 pl-3' : 'pl-8 pr-3'
                  }`}
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              {selectedParty && (
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${getAvatarColorClass(
                    selectedParty.name
                  )}`}
                >
                  {selectedParty.name.charAt(0)}
                </div>
              )}
              <div className="relative flex-1">
                <select
                  id="select-invoice-party"
                  value={selectedPartyId}
                  onChange={(e) => {
                    setSelectedPartyId(e.target.value);
                    const party = parties.find((p) => p.id === e.target.value);
                    if (party) {
                      setCustomerPhone(party.phone || '');
                    }
                    setValidationError('');
                  }}
                  required
                  className="w-full bg-white text-slate-900 text-xs font-bold rounded-xl px-3 py-2.5 border border-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 shadow-2xs min-h-[44px]"
                >
                  {filteredParties.length === 0 ? (
                    <option value="">
                      {isRtl ? 'لا يوجد حسابات مطابقة' : 'No matching accounts'}
                    </option>
                  ) : (
                    filteredParties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ({t.currentBalance}: {formatCurrency(p.currentBalance, currency, lang)})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Seamless Phone Number Input (NO COUNTRY CODE REQUIRED) */}
            <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-cyan-600" />
                  <span>{t.customerPhoneLabel}</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {isRtl ? 'تلقائيًا بدون كتابة +966' : 'No +966 needed'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-white rounded-xl border border-slate-200 px-2.5 py-1.5 shrink-0 shadow-2xs">
                  <span className="text-xs font-bold text-slate-700 font-mono">🇸🇦 +966</span>
                </div>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="05XXXXXXXX"
                  className="flex-1 bg-white text-slate-900 font-mono font-bold text-xs rounded-xl px-3 py-2 border border-slate-200 focus:outline-none focus:border-cyan-500 shadow-2xs min-h-[40px]"
                />
              </div>

              {/* Automatic WhatsApp Direct Send Toggle */}
              <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoSendWhatsApp}
                  onChange={(e) => setAutoSendWhatsApp(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800 block">
                    {t.autoSendWhatsApp}
                  </span>
                  <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                    {t.autoSendWhatsAppDesc}
                  </span>
                </div>
              </label>
            </div>

            {/* Payment Due Date for Credit Sales */}
            {docMode === 'SALE_CREDIT' && (
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 shrink-0">
                  <span>📅</span>
                  <span>{t.dueDate}</span>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-white text-slate-900 font-mono text-xs rounded-xl px-3 py-1.5 border border-slate-200 focus:outline-none focus:border-cyan-500 shadow-2xs"
                />
              </div>
            )}

            {/* Return Reason for Credit Notes */}
            {docMode === 'RETURN_SALE' && (
              <div className="pt-2 border-t border-rose-200/60 space-y-1">
                <label className="text-[11px] font-bold text-rose-800">
                  {t.returnReason}
                </label>
                <input
                  type="text"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder={isRtl ? 'مثال: بضاعة تالفة، مقاس غير مناسب، رغبة العميل...' : 'e.g. Damaged goods, return...'}
                  className="w-full bg-white text-slate-900 text-xs rounded-xl px-3 py-2 border border-rose-200 focus:outline-none focus:border-rose-500 shadow-2xs"
                />
              </div>
            )}

            {/* Attach Supplier Invoice for Supply Intake */}
            {docMode === 'SUPPLY_CREDIT' && (
              <div className="pt-2 border-t border-amber-200/60 space-y-1.5">
                <label className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-amber-600" />
                  <span>{t.attachSupplierInvoice}</span>
                </label>
                {supplierInvoicePhoto ? (
                  <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-amber-200">
                    <img src={supplierInvoicePhoto} alt="Supplier Invoice" className="w-12 h-12 object-cover rounded-lg" />
                    <span className="text-xs font-bold text-emerald-700 flex-1">{isRtl ? 'تم إرفاق فاتورة المورد' : 'Supplier invoice attached'}</span>
                    <button
                      type="button"
                      onClick={() => setSupplierInvoicePhoto(null)}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2 py-1"
                    >
                      {isRtl ? 'حذف' : 'Remove'}
                    </button>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          setSupplierInvoicePhoto(evt.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200"
                  />
                )}
              </div>
            )}
          </div>

          {/* Section 2: 100+ Products Solution (Catalog Shelf + Multi-Category + Barcode) */}
          <div className="space-y-2.5 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Package className="w-4 h-4 text-cyan-600" />
                <label className="text-xs font-bold text-slate-800">
                  {t.quickAddProducts} ({products.length} {isRtl ? 'صنف' : 'items'})
                </label>
              </div>

              <div className="flex items-center gap-1.5">
                {/* View Mode Toggle: Grid vs List */}
                <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    title={isRtl ? 'عرض شبكة' : 'Grid View'}
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewMode === 'grid' ? 'bg-white text-cyan-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    title={isRtl ? 'عرض قائمة' : 'List View'}
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewMode === 'list' ? 'bg-white text-cyan-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Barcode Camera Scanner */}
                <button
                  type="button"
                  onClick={() => setIsScanningBarcode(!isScanningBarcode)}
                  className={`p-1.5 rounded-xl border flex items-center gap-1 text-xs font-bold transition-colors ${
                    isScanningBarcode
                      ? 'bg-rose-50 text-rose-700 border-rose-300'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                  title={isRtl ? 'مسح باركود بالكاميرا' : 'Scan barcode'}
                >
                  <Barcode className="w-3.5 h-3.5 text-cyan-600" />
                  <span className="hidden sm:inline">{isRtl ? 'باركود' : 'Barcode'}</span>
                </button>

                {/* Browse Full Catalog Button */}
                {products.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsFullCatalogOpen(true)}
                    className="text-xs bg-cyan-50 hover:bg-cyan-100 text-cyan-800 font-bold px-2.5 py-1.5 rounded-xl border border-cyan-200 flex items-center gap-1 transition-colors min-h-[36px]"
                  >
                    <Layers className="w-3.5 h-3.5 text-cyan-600" />
                    <span>{t.browseFullCatalog}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Active Barcode Camera Scanner Viewport */}
            {isScanningBarcode && (
              <div className="p-3 bg-slate-900 rounded-2xl text-white space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-cyan-400" />
                    {isRtl ? 'وجّه الكاميرا نحو باركود الصنف' : 'Point camera at product barcode'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsScanningBarcode(false)}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-h-48 flex items-center justify-center">
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                  <div className="absolute inset-x-8 inset-y-6 border-2 border-dashed border-cyan-400/70 rounded-lg pointer-events-none" />
                </div>
                {barcodeScanFeedback && (
                  <div className="text-center text-xs text-cyan-300 font-bold">
                    {barcodeScanFeedback}
                  </div>
                )}
              </div>
            )}

            {/* Quick Filter Categories Strip (for 100+ items catalog) */}
            {products.length > 0 && (
              <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                {/* Search Bar with instant debounce-free filter */}
                <div className="relative">
                  <Search className={`w-3.5 h-3.5 text-slate-400 absolute top-2.5 ${isRtl ? 'right-3' : 'left-3'} pointer-events-none`} />
                  <input
                    type="text"
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    placeholder={t.searchCatalogProducts}
                    className={`w-full bg-white text-slate-900 text-xs rounded-xl py-2 border border-slate-200 focus:outline-none focus:border-cyan-500 shadow-2xs ${
                      isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'
                    }`}
                  />
                  {productSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setProductSearchQuery('')}
                      className={`absolute top-2 ${isRtl ? 'left-2.5' : 'right-2.5'} text-slate-400 hover:text-slate-600 p-0.5`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-cyan-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {t.allCategories} ({products.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedCategory('favorites')}
                    className={`px-2.5 py-1 rounded-lg font-bold shrink-0 flex items-center gap-1 transition-colors ${
                      selectedCategory === 'favorites'
                        ? 'bg-amber-500 text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <Flame className="w-3 h-3 text-amber-300" />
                    <span>{t.topFavorites}</span>
                  </button>

                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-colors ${
                        selectedCategory === cat
                          ? 'bg-cyan-600 text-white shadow-2xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Quick-Tap Product Shelf: GRID MODE */}
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-0.5">
                    {filteredProducts.slice(0, 24).map((prod) => {
                      const price = isSale ? prod.defaultSalePrice : prod.defaultCostPrice;
                      const qtyAdded = addedProductQuantities.get(prod.id) || 0;

                      return (
                        <div
                          key={prod.id}
                          className={`p-2 rounded-xl border transition-all relative flex flex-col justify-between min-h-[58px] ${
                            qtyAdded > 0
                              ? 'bg-cyan-50/90 border-cyan-400 shadow-2xs'
                              : 'bg-white hover:bg-slate-100 border-slate-200'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleQuickAddProduct(prod)}
                            className="w-full text-start flex-1"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-bold text-slate-900 truncate pe-1">
                                {prod.name}
                              </span>
                              {qtyAdded > 0 && (
                                <span className="text-[10px] font-black text-cyan-800 bg-cyan-100 px-1.5 py-0.5 rounded-md font-mono shrink-0">
                                  ×{qtyAdded}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mt-1">
                              <span className="font-bold text-slate-700">
                                {formatCurrency(price, currency, lang)}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {prod.unit}
                              </span>
                            </div>
                          </button>

                          {/* Quick decrement stepper right on card */}
                          {qtyAdded > 0 && (
                            <div className="pt-1 mt-1 border-t border-cyan-200/50 flex items-center justify-between text-[10px]">
                              <button
                                type="button"
                                onClick={() => handleQuickDecrementProduct(prod)}
                                className="px-2 py-0.5 bg-white text-slate-600 hover:text-rose-600 rounded-md border border-slate-200 font-bold"
                              >
                                -
                              </button>
                              <span className="font-mono text-cyan-900 font-bold">
                                {formatCurrency(price * qtyAdded, currency, lang)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleQuickAddProduct(prod)}
                                className="px-2 py-0.5 bg-cyan-600 text-white rounded-md font-bold"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {filteredProducts.length === 0 && (
                      <div className="col-span-full py-4 text-center text-xs text-slate-400">
                        {isRtl ? 'لا توجد أصناف مطابقة للبحث' : 'No items match filter'}
                      </div>
                    )}
                  </div>
                )}

                {/* Quick-Tap Product Shelf: COMPACT LIST MODE (For dense 100+ items browsing) */}
                {viewMode === 'list' && (
                  <div className="divide-y divide-slate-100 max-h-44 overflow-y-auto bg-white rounded-xl border border-slate-200">
                    {filteredProducts.slice(0, 30).map((prod) => {
                      const price = isSale ? prod.defaultSalePrice : prod.defaultCostPrice;
                      const qtyAdded = addedProductQuantities.get(prod.id) || 0;

                      return (
                        <div
                          key={prod.id}
                          className={`p-2 flex items-center justify-between gap-2 transition-colors ${
                            qtyAdded > 0 ? 'bg-cyan-50/60' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div
                            onClick={() => handleQuickAddProduct(prod)}
                            className="min-w-0 flex-1 cursor-pointer"
                          >
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {prod.name}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {formatCurrency(price, currency, lang)} · {prod.unit}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {qtyAdded > 0 && (
                              <button
                                type="button"
                                onClick={() => handleQuickDecrementProduct(prod)}
                                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs"
                              >
                                -
                              </button>
                            )}

                            <span
                              className={`w-6 text-center font-mono font-bold text-xs ${
                                qtyAdded > 0 ? 'text-cyan-800' : 'text-slate-400'
                              }`}
                            >
                              {qtyAdded}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleQuickAddProduct(prod)}
                              className="w-6 h-6 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold flex items-center justify-center text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {filteredProducts.length > 24 && (
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setIsFullCatalogOpen(true)}
                      className="text-xs text-cyan-700 hover:text-cyan-800 font-bold underline underline-offset-2"
                    >
                      {isRtl ? `عرض باقي الأصناف بالكامل (+${filteredProducts.length - 24} صنف)` : `View remaining ${filteredProducts.length - 24} items`}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Section 3: Line Items in Invoice with Wholesale Bulk Steppers */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-800">
                    {t.itemsInInvoice} ({items.length})
                  </label>
                  {items.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllItems}
                      className="text-[11px] text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{isRtl ? 'تفريغ السلة' : 'Clear Basket'}</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAddCustomItem}
                  className="text-xs text-cyan-700 hover:text-cyan-800 font-bold flex items-center gap-1 min-h-[36px] px-2 rounded-lg hover:bg-cyan-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.addCustomItemManual}</span>
                </button>
              </div>

              {items.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center space-y-1">
                  <p className="text-xs font-bold text-slate-600">
                    {isRtl ? 'لم يتم إضافة أي صنف بعد' : 'No items added yet'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {isRtl
                      ? 'اضغط على الأصناف في الكتالوج أعلاه لإضافتها بنقرة واحدة، أو أضف صنفًا يدويًا'
                      : 'Tap any product from the shelf above to add instantly, or add a custom item'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-0.5">
                  {items.map((item, idx) => {
                    const itemQuery = normalizeSearch(item.name);
                    const matchingSuggestions =
                      activeSuggestionIndex === idx && itemQuery.length >= 1
                        ? products
                            .filter((p) => normalizeSearch(p.name).includes(itemQuery))
                            .slice(0, 4)
                        : [];

                    return (
                      <div
                        key={idx}
                        className="p-3 bg-white rounded-2xl border border-slate-200 space-y-2 relative shadow-2xs hover:border-slate-300 transition-colors"
                      >
                        {/* Item Name Row with Autocomplete Trigger */}
                        <div className="relative">
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <input
                                type="text"
                                placeholder={t.itemName}
                                value={item.name}
                                onChange={(e) => {
                                  handleItemChange(idx, 'name', e.target.value);
                                  setActiveSuggestionIndex(idx);
                                }}
                                onFocus={() => setActiveSuggestionIndex(idx)}
                                required
                                className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 text-xs font-bold rounded-xl px-3 py-2 border border-slate-200 focus:outline-none focus:border-cyan-500 shadow-2xs min-h-[40px]"
                              />
                            </div>

                            <div className="font-mono font-bold text-xs text-green-700 bg-green-50 px-2.5 py-1.5 rounded-xl border border-green-100 shrink-0">
                              {formatCurrency(item.subtotal, currency, lang)}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              aria-label={isRtl ? 'حذف الصنف' : 'Delete item'}
                              className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Floating Autocomplete Dropdown */}
                          {matchingSuggestions.length > 0 && (
                            <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden divide-y divide-slate-100">
                              {matchingSuggestions.map((sug) => {
                                const sugPrice = isSale ? sug.defaultSalePrice : sug.defaultCostPrice;
                                return (
                                  <button
                                    key={sug.id}
                                    type="button"
                                    onClick={() => handleSelectSuggestion(idx, sug)}
                                    className="w-full px-3 py-2 text-start flex items-center justify-between hover:bg-cyan-50 transition-colors text-xs"
                                  >
                                    <div>
                                      <span className="font-bold text-slate-900">{sug.name}</span>
                                      <span className="text-[10px] text-slate-400 ms-1">({sug.unit})</span>
                                    </div>
                                    <span className="font-mono font-bold text-cyan-800">
                                      {formatCurrency(sugPrice, currency, lang)}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Qty Stepper & Unit Price Row */}
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                          {/* Quantity Stepper */}
                          <div>
                            <span className="text-[10px] text-slate-400 block mb-0.5 font-bold">
                              {t.quantity}
                            </span>
                            <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                              <button
                                type="button"
                                onClick={() =>
                                  handleItemChange(idx, 'quantity', Math.max(1, (item.quantity || 1) - 1))
                                }
                                aria-label={isRtl ? 'إنقاص الكمية' : 'Decrease quantity'}
                                className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold active:scale-95 transition-all text-sm shrink-0"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="0.01"
                                step="any"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)
                                }
                                className="w-full bg-white text-slate-900 text-xs font-mono font-bold min-h-[44px] px-1 text-center focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleItemChange(idx, 'quantity', (item.quantity || 0) + 1)
                                }
                                aria-label={isRtl ? 'زيادة الكمية' : 'Increase quantity'}
                                className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold active:scale-95 transition-all text-sm shrink-0"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Unit Price */}
                          <div>
                            <span className="text-[10px] text-slate-400 block mb-0.5 font-bold">
                              {t.unitPrice} ({currency})
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.unitPrice}
                              onChange={(e) =>
                                handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)
                              }
                              className="w-full bg-slate-50 text-slate-900 text-xs font-mono font-bold min-h-[44px] rounded-xl px-3 border border-slate-200 focus:outline-none focus:border-cyan-500 shadow-2xs"
                            />
                          </div>
                        </div>

                        {/* Wholesale Bulk Quantity Jump Chips (+1, +5, +10, +25, +50) */}
                        <div className="flex items-center gap-1 pt-1 overflow-x-auto">
                          <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                            {isRtl ? 'زيادة بالجملة:' : 'Bulk add:'}
                          </span>
                          {[1, 5, 10, 25, 50].map((step) => (
                            <button
                              key={step}
                              type="button"
                              onClick={() => handleIncrementItemQty(idx, step)}
                              className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-100 hover:bg-cyan-100 hover:text-cyan-800 text-slate-600 rounded-md transition-colors"
                            >
                              +{step}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Save unlisted custom items to catalog toggle */}
            {items.some((i) => !i.productId && i.name.trim()) && (
              <label className="flex items-center gap-2 p-2 bg-cyan-50/70 rounded-xl text-xs cursor-pointer border border-cyan-100">
                <input
                  type="checkbox"
                  checked={saveCustomToCatalog}
                  onChange={(e) => setSaveCustomToCatalog(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-600 border-slate-300"
                />
                <span className="font-bold text-cyan-900">
                  {isRtl
                    ? 'حفظ الأصناف اليدوية الجديدة في الكتالوج تلقائيًا للمرات القادمة'
                    : 'Save custom items to product catalog for future invoices'}
                </span>
              </label>
            )}
          </div>

          {/* Section 4: Financial Reconciliation & Split Payment */}
          <div
            id="payment-split-box"
            className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 shadow-2xs"
          >
            {/* Subtotal, Discount & Tax Itemization */}
            <div className="space-y-2 pb-2.5 border-b border-slate-200 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>{isRtl ? 'إجمالي الأصناف:' : 'Items Subtotal:'}</span>
                <span className="font-mono font-bold text-slate-800">
                  {formatCurrency(itemsSubtotal, currency, lang)}
                </span>
              </div>

              {/* Discount Row */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600 font-medium">{isRtl ? 'الخصم / الحسم:' : 'Discount:'}</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max={itemsSubtotal}
                      step="any"
                      value={discountInput}
                      onChange={(e) => setDiscountInput(e.target.value)}
                      placeholder="0"
                      className="w-24 bg-white text-slate-900 text-xs font-mono font-bold text-end rounded-xl px-2.5 py-1.5 min-h-[38px] border border-slate-200 focus:outline-none focus:border-cyan-500 shadow-2xs"
                    />
                    <span className="text-xs text-slate-400 font-mono">{currency}</span>
                  </div>
                </div>

                {/* Quick Discount Chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[0, 5, 10, 20, 50].map((disc) => (
                    <button
                      key={disc}
                      type="button"
                      onClick={() => setDiscountInput(disc.toString())}
                      className={`min-h-[36px] min-w-[36px] px-2.5 py-1 rounded-xl text-xs font-mono font-bold border transition-colors flex items-center justify-center ${
                        parseFloat(discountInput) === disc
                          ? 'bg-cyan-100 text-cyan-900 border-cyan-400 shadow-2xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
                      }`}
                    >
                      {disc === 0 ? (isRtl ? 'صفر' : '0') : `-${disc}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* VAT Row */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">
                    {isRtl ? `ضريبة القيمة المضافة (${taxRate}%):` : `VAT (${taxRate}%):`}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    {applyVat ? (isRtl ? 'مطبقة' : 'Active') : (isRtl ? 'معفي' : 'Exempt')}
                  </span>
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  {t.paidNow}
                </label>
                {/* Fast Settlement Chips */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSetPaidZero}
                    className={`min-h-[36px] px-2.5 py-1 rounded-xl font-bold text-xs border transition-colors flex items-center justify-center ${
                      paidAmount === 0
                        ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {t.payZero}
                  </button>
                  <button
                    type="button"
                    onClick={handleSetPaidHalf}
                    className="min-h-[36px] px-2.5 py-1 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 flex items-center justify-center font-mono"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={handleSetPaidFull}
                    className={`min-h-[36px] px-2.5 py-1 rounded-xl font-bold text-xs border transition-colors flex items-center justify-center ${
                      paidAmount === totalAmount && totalAmount > 0
                        ? 'bg-green-50 text-green-700 border-green-300 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
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
                className="w-full bg-white text-slate-900 font-mono text-sm font-bold rounded-xl px-3 py-2 border border-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 text-end shadow-2xs min-h-[44px]"
              />

              {/* Quick POS Increment Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[10, 50, 100, 500].map((inc) => (
                  <button
                    key={inc}
                    type="button"
                    onClick={() => handleAddPaidIncrement(inc)}
                    className="min-h-[36px] min-w-[44px] text-xs px-2.5 py-1 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-mono font-bold border border-slate-200 shadow-2xs transition-colors flex items-center justify-center"
                  >
                    +{inc}
                  </button>
                ))}
              </div>
            </div>

            {/* Remaining Debt Highlight Notice */}
            <div
              className={`p-3 rounded-xl border flex items-center justify-between shadow-2xs transition-colors ${
                remainingBalanceDelta > 0
                  ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                  : 'bg-green-50/70 border-green-200 text-green-900'
              }`}
            >
              <div>
                <span className="text-xs font-bold block">
                  {remainingBalanceDelta > 0 ? t.remainingDebtDelta : isRtl ? 'مسدد بالكامل' : 'Fully Paid'}
                </span>
                <span className="text-[11px] opacity-80">
                  {remainingBalanceDelta > 0
                    ? isSale
                      ? isRtl
                        ? 'يُضاف كدين على العميل في الدفتر'
                        : 'Will be posted as customer debt'
                      : isRtl
                      ? 'يُضاف كالتزام للمورد في الدفتر'
                      : 'Will be posted as supplier payable'
                    : isRtl
                    ? 'لا يترتب أي دين على هذه الفاتورة'
                    : 'No debt will be posted'}
                </span>
              </div>
              <div className="text-base font-black font-mono">
                {remainingBalanceDelta > 0 ? `+${formatCurrency(remainingBalanceDelta, currency, lang)}` : `0.00 ${currency}`}
              </div>
            </div>

            {/* Payment Method */}
            {paidAmount > 0 && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  {t.paymentMethod}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all min-h-[40px] ${
                      paymentMethod === 'CASH'
                        ? 'bg-green-600 text-white border-green-600 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {t.cash}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('BANK_TRANSFER')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all min-h-[40px] ${
                      paymentMethod === 'BANK_TRANSFER'
                        ? 'bg-cyan-600 text-white border-cyan-600 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {t.bankTransfer}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CHEQUE')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all min-h-[40px] ${
                      paymentMethod === 'CHEQUE'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
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
                className="w-full bg-white text-slate-800 placeholder-slate-400 text-xs rounded-xl px-3 py-2 border border-slate-200 focus:outline-none focus:border-cyan-500 shadow-2xs min-h-[40px]"
              />
            </div>
          </div>

          {/* Sticky Action Buttons */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-2 border-t border-slate-100 flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors border border-slate-200 min-h-[48px]"
            >
              {t.cancel}
            </button>
            <button
              id="btn-confirm-save-invoice"
              type="submit"
              className="flex-2 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs shadow-md shadow-cyan-950/20 transition-all active:scale-98 min-h-[48px] flex items-center justify-center gap-2"
            >
              <span>{t.saveTransaction}</span>
              <span className="font-mono bg-cyan-700/80 px-2 py-0.5 rounded-lg text-[11px]">
                {formatCurrency(totalAmount, currency, lang)}
              </span>
            </button>
          </div>
        </form>
      </motion.div>

      {/* Full Catalog Multi-Select Modal (Ideal for 100+ Products) */}
      <AnimatePresence>
        {isFullCatalogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 bg-black/85 backdrop-blur-xs flex items-end md:items-center justify-center p-0 md:p-4"
          >
            <motion.div
              initial={{ y: 80 }}
              animate={{ y: 0 }}
              exit={{ y: 80 }}
              className="w-full max-w-2xl bg-white rounded-t-3xl md:rounded-3xl border border-slate-200 p-4 space-y-3.5 shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {t.browseFullCatalog} ({products.length} {isRtl ? 'صنف' : 'items'})
                    </h3>
                    <p className="text-xs text-slate-500">
                      {isRtl ? 'اضغط + أو - على الأصناف لإضافتها مباشرة للفاتورة' : 'Tap + or - on any product to adjust quantity'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFullCatalogOpen(false)}
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search & Categories inside full catalog modal */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className={`w-3.5 h-3.5 text-slate-400 absolute top-3 ${isRtl ? 'right-3' : 'left-3'} pointer-events-none`} />
                  <input
                    type="text"
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    placeholder={t.searchCatalogProducts}
                    className={`w-full bg-slate-50 text-slate-900 text-xs rounded-xl py-2.5 border border-slate-200 focus:outline-none focus:border-cyan-500 ${
                      isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'
                    }`}
                  />
                </div>

                {/* Categories */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {t.allCategories} ({products.length})
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition-colors ${
                        selectedCategory === cat
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Product Grid with Steppers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto max-h-[50vh] pr-1 flex-1">
                {filteredProducts.map((prod) => {
                  const price = isSale ? prod.defaultSalePrice : prod.defaultCostPrice;
                  const qtyAdded = addedProductQuantities.get(prod.id) || 0;

                  return (
                    <div
                      key={prod.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                        qtyAdded > 0
                          ? 'bg-cyan-50/70 border-cyan-300'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {prod.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                          <span className="font-bold text-slate-700">
                            {formatCurrency(price, currency, lang)}
                          </span>
                          <span>•</span>
                          <span>{prod.unit}</span>
                          {prod.barcode && (
                            <>
                              <span>•</span>
                              <span className="text-[10px] text-slate-400">{prod.barcode}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Stepper buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {qtyAdded > 0 && (
                          <button
                            type="button"
                            onClick={() => handleQuickDecrementProduct(prod)}
                            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-sm active:scale-95 transition-all"
                          >
                            -
                          </button>
                        )}

                        <span
                          className={`w-7 text-center font-mono font-bold text-xs ${
                            qtyAdded > 0 ? 'text-cyan-800' : 'text-slate-400'
                          }`}
                        >
                          {qtyAdded}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleQuickAddProduct(prod)}
                          className="w-8 h-8 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold flex items-center justify-center text-sm active:scale-95 transition-all shadow-2xs"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Apply Strip */}
              <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                <div className="text-xs">
                  <span className="text-slate-500 block">
                    {t.itemsInInvoice}: <strong className="text-slate-800 font-mono">{items.length}</strong>
                  </span>
                  <span className="text-sm font-bold text-cyan-800 font-mono">
                    {formatCurrency(itemsSubtotal, currency, lang)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFullCatalogOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-md transition-all active:scale-98"
                >
                  {isRtl ? 'تم، العودة للفاتورة' : 'Done, back to invoice'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
