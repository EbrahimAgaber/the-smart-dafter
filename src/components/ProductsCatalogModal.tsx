import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Package,
  Plus,
  Trash2,
  Edit2,
  Search,
  Barcode,
  X,
  Check,
  Camera,
} from 'lucide-react';
import { BusinessProfile, Language, Product } from '../types';
import { getTranslation } from '../i18n/translations';
import { formatCurrency } from '../utils/formatters';

interface ProductsCatalogModalProps {
  products: Product[];
  profile: BusinessProfile;
  lang: Language;
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (id: string, updates: Partial<Product>) => void;
  onDeleteProduct: (id: string) => void;
}

export const ProductsCatalogModal: React.FC<ProductsCatalogModalProps> = ({
  products,
  profile,
  lang,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}) => {
  const t = getTranslation(lang);
  const currency = profile.currency || 'SAR';
  const isRtl = lang === 'ar';

  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [name, setName] = useState('');
  const [unit, setUnit] = useState('قطعة');
  const [salePrice, setSalePrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [barcode, setBarcode] = useState('');

  // Barcode Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [scanTarget, setScanTarget] = useState<'search' | 'form'>('search');
  const [hasBarcodeDetector, setHasBarcodeDetector] = useState<boolean>(true);
  const [manualBarcodeInput, setManualBarcodeInput] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animFrame: number | null = null;

    if (isScanning) {
      const detectorSupported = 'BarcodeDetector' in window;
      setHasBarcodeDetector(detectorSupported);

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
                      if (scanTarget === 'form') {
                        setBarcode(detected);
                      } else {
                        setSearch(detected);
                      }
                      setIsScanning(false);
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
        .catch((err) => {
          console.warn('Camera scanner access error:', err);
          alert(isRtl ? 'تعذر الوصول إلى الكاميرا لمسح الباركود' : 'Could not access camera for barcode scan');
          setIsScanning(false);
        });
    }

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isScanning, scanTarget, isRtl]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    setUnit(isRtl ? 'قطعة' : 'Piece');
    setSalePrice('');
    setCostPrice('');
    setBarcode('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setUnit(p.unit);
    setSalePrice(p.defaultSalePrice.toString());
    setCostPrice(p.defaultCostPrice.toString());
    setBarcode(p.barcode);
    setIsAddModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const sp = parseFloat(salePrice) || 0;
    const cp = parseFloat(costPrice) || 0;

    if (editingProduct) {
      onUpdateProduct(editingProduct.id, {
        name: name.trim(),
        unit: unit.trim(),
        defaultSalePrice: sp,
        defaultCostPrice: cp,
        barcode: barcode.trim(),
      });
    } else {
      onAddProduct({
        name: name.trim(),
        unit: unit.trim(),
        defaultSalePrice: sp,
        defaultCostPrice: cp,
        barcode: barcode.trim(),
      });
    }
    setIsAddModalOpen(false);
  };

  const filtered = products.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.barcode.includes(q);
  });

  return (
    <div id="products-catalog-view" className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">
            {t.productsTitle}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {products.length} {isRtl ? 'أصناف مسجلة بالكتالوج' : 'Registered items in catalog'}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-cyan-950/20 transition-all active:scale-95 border border-cyan-400/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addProduct}</span>
        </button>
      </div>

      {/* Search Bar & Barcode Scanner */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchProducts}
            className="w-full bg-white text-slate-900 placeholder-slate-400 text-xs rounded-xl ps-9 pe-3 py-2.5 border border-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 shadow-2xs transition-all"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setScanTarget('search');
            setIsScanning(true);
          }}
          title={isRtl ? 'مسح باركود بالكاميرا' : 'Scan barcode'}
          className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 shrink-0 transition-colors shadow-2xs"
        >
          <Camera className="w-4 h-4 text-cyan-600" />
        </button>
      </div>

      {/* Products Grid / List */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-2 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-bold text-slate-800">
              {search.trim() ? (isRtl ? 'لا توجد نتائج بحث مطابقة' : 'No matching products found') : (isRtl ? 'لا توجد منتجات مسجلة حتى الآن' : 'No products added yet')}
            </h3>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              {isRtl ? 'أضف منتجاتك لتسهيل اختيارها أثناء إنشاء الفواتير وحساب المبيعات تلقائيًا.' : 'Add your items to easily pick them when creating invoices.'}
            </p>
          </div>
        ) : (
          filtered.map((product) => (
            <div
              key={product.id}
              className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 flex items-center justify-between shadow-2xs transition-all hover:shadow-xs"
            >
              <div className="min-w-0 flex-1 pe-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0 border border-cyan-100">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {product.name}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-200">
                        {product.unit}
                      </span>
                      {product.barcode && (
                        <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                          <Barcode className="w-3 h-3 text-slate-400" />
                          {product.barcode}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-end shrink-0 ps-2">
                <div className="text-sm font-black font-mono text-emerald-600">
                  {formatCurrency(product.defaultSalePrice, currency, lang)}
                </div>
                {product.defaultCostPrice > 0 && (
                  <div className="text-[11px] text-slate-400 font-mono">
                    {isRtl ? 'تكلفة: ' : 'Cost: '}
                    {formatCurrency(product.defaultCostPrice, currency, lang)}
                  </div>
                )}

                <div className="flex items-center gap-1.5 mt-1.5 justify-end">
                  <button
                    onClick={() => handleOpenEdit(product)}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors shadow-2xs"
                    title={isRtl ? 'تعديل الصنف' : 'Edit product'}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(isRtl ? `هل أنت متأكد من حذف ${product.name}؟` : `Delete ${product.name}?`)) {
                        onDeleteProduct(product.id);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition-colors shadow-2xs"
                    title={isRtl ? 'حذف الصنف' : 'Delete product'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Product Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsAddModalOpen(false);
            }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 48, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 32, scale: 0.98 }}
              transition={{ type: 'spring', damping: 28, stiffness: 340, mass: 0.8 }}
              className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-2xl"
            >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-sm font-bold text-slate-900">
                {editingProduct ? (isRtl ? 'تعديل المنتج' : 'Edit Product') : t.addProduct}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                aria-label={isRtl ? 'إغلاق' : 'Close'}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  {t.productName} <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isRtl ? 'مثال: أرز بسمتي 10 كجم' : 'e.g. Basmati Rice 10kg'}
                  className="w-full bg-slate-50 text-slate-900 text-xs rounded-xl px-3 py-2.5 border border-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    {t.productUnit}
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder={isRtl ? 'قطعة / كيس / كرتون' : 'Piece / Box / Kg'}
                    className="w-full bg-slate-50 text-slate-900 text-xs rounded-xl px-3 py-2 border border-slate-200 focus:outline-none focus:border-cyan-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    {t.barcode}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="628..."
                      className="flex-1 bg-slate-50 text-slate-900 text-xs font-mono rounded-xl px-3 py-2 border border-slate-200 focus:outline-none focus:border-cyan-500 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setScanTarget('form');
                        setIsScanning(true);
                      }}
                      title={isRtl ? 'مسح بالكاميرا' : 'Scan'}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 shrink-0 transition-colors shadow-2xs"
                    >
                      <Camera className="w-3.5 h-3.5 text-cyan-600" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    {t.defaultSalePrice}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-50 text-slate-900 text-xs font-mono rounded-xl px-3 py-2 border border-slate-200 focus:outline-none focus:border-cyan-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    {t.defaultCostPrice}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-50 text-slate-900 text-xs font-mono rounded-xl px-3 py-2 border border-slate-200 focus:outline-none focus:border-cyan-500 shadow-2xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-300/50 shadow-2xs transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-950/30 border border-cyan-400/20 active:scale-98 transition-all"
                >
                  {t.saveProduct}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Live Camera Barcode Scanner Modal */}
    {isScanning && (
      <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-slate-900 rounded-3xl p-5 space-y-4 border border-slate-800 text-center shadow-2xl">
          <div className="flex items-center justify-between text-white border-b border-slate-800 pb-2">
            <span className="text-xs font-bold flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-cyan-400" />
              <span>{isRtl ? 'المسح الضوئي للباركود' : 'Barcode Camera Scanner'}</span>
            </span>
            <button
              onClick={() => setIsScanning(false)}
              aria-label={isRtl ? 'إغلاق' : 'Close'}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black border-2 border-cyan-500/50 flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse pointer-events-none" />
          </div>

          <p className="text-xs text-slate-400">
            {isRtl
              ? 'وجّه كاميرا الهاتف نحو رمز الباركود للمنتج'
              : 'Point your camera at the product barcode'}
          </p>

          {/* BarcodeDetector Missing Fallback UI */}
          {!hasBarcodeDetector && (
            <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-2xl text-start space-y-2">
              <p className="text-xs text-amber-300 font-bold">
                {isRtl
                  ? 'المتصفح لا يدعم التعرف التلقائي على الباركود (BarcodeDetector غير متوفر)'
                  : 'Automatic barcode detection is not supported in this browser'}
              </p>
              <p className="text-[11px] text-slate-300">
                {isRtl
                  ? 'يمكنك إدخال رمز أو رقم الباركود يدويًا هنا للمتابعة فورا:'
                  : 'You can enter the barcode number manually below to continue:'}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={manualBarcodeInput}
                  onChange={(e) => setManualBarcodeInput(e.target.value)}
                  placeholder={isRtl ? 'أدخل رقم الباركود...' : 'Enter barcode digits...'}
                  className="flex-1 bg-slate-800 text-white font-mono text-xs rounded-xl px-3 py-2 min-h-[44px] border border-slate-700 focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (manualBarcodeInput.trim()) {
                      if (scanTarget === 'form') {
                        setBarcode(manualBarcodeInput.trim());
                      } else {
                        setSearch(manualBarcodeInput.trim());
                      }
                      setIsScanning(false);
                      setManualBarcodeInput('');
                    }
                  }}
                  className="min-h-[44px] px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition-colors shrink-0 flex items-center justify-center"
                >
                  {isRtl ? 'تطبيق' : 'Apply'}
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => setIsScanning(false)}
            className="w-full min-h-[44px] py-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition-colors flex items-center justify-center"
          >
            {isRtl ? 'إلغاء' : 'Cancel'}
          </button>
        </div>
      </div>
    )}
  </div>
);
};
