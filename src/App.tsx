import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  ActiveTab,
  BusinessProfile,
  Language,
  LineItem,
  Party,
  PaymentMethod,
  Product,
  Transaction,
  TransactionType,
} from './types';
import { SQLiteLedgerStore } from './db/sqliteStorage';
import { MobileFrame } from './components/MobileFrame';
import { BottomNavigation } from './components/BottomNavigation';
import { DashboardView } from './components/DashboardView';
import { PartyDirectoryView } from './components/PartyDirectoryView';
import { PartyLedgerView } from './components/PartyLedgerView';
import { ProductsCatalogModal } from './components/ProductsCatalogModal';
import { SettingsView } from './components/SettingsView';
import { InvoiceCreatorModal } from './components/InvoiceCreatorModal';
import { PaymentReceiptModal } from './components/PaymentReceiptModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';

// Lazy-loaded modals to shrink initial bundle and isolate heavy PDF / QR dependencies
const InvoicePdfModal = lazy(() =>
  import('./components/InvoicePdfModal').then((m) => ({ default: m.InvoicePdfModal }))
);
const StatementPdfModal = lazy(() =>
  import('./components/StatementPdfModal').then((m) => ({ default: m.StatementPdfModal }))
);
const PhonePairingModal = lazy(() =>
  import('./components/PhonePairingModal').then((m) => ({ default: m.PhonePairingModal }))
);
const StoreSetupWizardModal = lazy(() =>
  import('./components/StoreSetupWizardModal').then((m) => ({ default: m.StoreSetupWizardModal }))
);
const SecurityGuardModal = lazy(() =>
  import('./components/SecurityGuardModal').then((m) => ({ default: m.SecurityGuardModal }))
);
const AdminKeyGeneratorModal = lazy(() =>
  import('./components/AdminKeyGeneratorModal').then((m) => ({ default: m.AdminKeyGeneratorModal }))
);
import { ActivationGateView } from './components/ActivationGateView';
import { checkCanCreateInvoice, getLicenseStatus, LicenseStatus } from './utils/licenseManager';

type ModalType =
  | null
  | 'invoice-sale'
  | 'invoice-supply'
  | 'receipt'
  | 'voucher'
  | 'invoice-pdf'
  | 'statement-pdf'
  | 'phone-pairing'
  | 'store-setup'
  | 'security-guard'
  | 'admin-keygen';

const ModalLoadingSpinner: React.FC<{ lang: Language }> = ({ lang }) => (
  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
    <div className="bg-white px-5 py-4 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold text-slate-700 border border-slate-200">
      <div className="w-5 h-5 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
      <span>{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</span>
    </div>
  </div>
);

export default function App() {
  const store = useMemo(() => SQLiteLedgerStore.getInstance(), []);

  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('daftar_smart_lang') as Language) || 'ar';
  });

  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus>(() => getLicenseStatus());

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [parties, setParties] = useState<Party[]>(() => store.getParties());
  const [products, setProducts] = useState<Product[]>(() => store.getProducts());
  const [transactions, setTransactions] = useState<Transaction[]>(() => store.getTransactions());
  const [profile, setProfile] = useState<BusinessProfile>(() => store.getProfile());
  const [metrics, setMetrics] = useState(() => store.getDashboardMetrics());

  // Navigation states
  const [selectedPartyForLedger, setSelectedPartyForLedger] = useState<Party | null>(null);

  // Memoized party transactions to prevent redundant canvas pre-renders
  const selectedPartyTransactions = useMemo(() => {
    if (!selectedPartyForLedger) return [];
    return transactions.filter((tx) => tx.partyId === selectedPartyForLedger.id);
  }, [transactions, selectedPartyForLedger]);

  // Modals state
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [modalParty, setModalParty] = useState<Party | null>(null);
  const [activeTxForPdf, setActiveTxForPdf] = useState<Transaction | null>(null);

  // Sync HTML dir and lang
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('daftar_smart_lang', lang);
  }, [lang]);

  // Prompt setup wizard if fresh start and app is activated
  useEffect(() => {
    if (licenseStatus.isActive && !profile.name) {
      setActiveModal('store-setup');
    }
  }, [profile.name, licenseStatus.isActive]);

  // Refresh local state from store and license manager
  const refreshStoreData = useCallback(() => {
    setParties(store.getParties());
    setProducts(store.getProducts());
    setTransactions(store.getTransactions());
    setProfile(store.getProfile());
    setMetrics(store.getDashboardMetrics());
    setLicenseStatus(getLicenseStatus());

    // Update selected party reference if open
    setSelectedPartyForLedger((prev) => (prev ? store.getPartyById(prev.id) || null : null));
  }, [store]);

  // Subscribe to store updates (e.g. IndexedDB async hydration)
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      refreshStoreData();
    });
    return unsubscribe;
  }, [store, refreshStoreData]);

  const handleToggleLang = () => {
    setLang((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  // Transaction submission handler
  const handleCreateTransaction = (txData: {
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
  }) => {
    if (!checkCanCreateInvoice()) {
      setActiveModal('security-guard');
      return;
    }
    const newTx = store.addTransaction(txData);
    refreshStoreData();
    setActiveModal(null);

    // Prompt receipt / invoice PDF for immediate view or WhatsApp sharing
    const party = store.getPartyById(txData.partyId);
    if (party) {
      setActiveTxForPdf(newTx);
      setModalParty(party);
      setActiveModal('invoice-pdf');
    }
  };

  // Transaction void handler
  const handleVoidTransaction = (txId: string) => {
    store.voidTransaction(txId);
    refreshStoreData();
  };

  // Gatekeepers for Invoice / Receipt / Voucher Creation via Security Guard
  const handleOpenSaleModal = (party?: Party | null) => {
    if (!checkCanCreateInvoice()) {
      setActiveModal('security-guard');
      return;
    }
    setModalParty(party || null);
    setActiveModal('invoice-sale');
  };

  const handleOpenSupplyModal = (party?: Party | null) => {
    if (!checkCanCreateInvoice()) {
      setActiveModal('security-guard');
      return;
    }
    setModalParty(party || null);
    setActiveModal('invoice-supply');
  };

  const handleOpenReceiptModal = (party?: Party | null) => {
    if (!checkCanCreateInvoice()) {
      setActiveModal('security-guard');
      return;
    }
    setModalParty(party || null);
    setActiveModal('receipt');
  };

  const handleOpenVoucherModal = (party?: Party | null) => {
    if (!checkCanCreateInvoice()) {
      setActiveModal('security-guard');
      return;
    }
    setModalParty(party || null);
    setActiveModal('voucher');
  };

  // Payment receipt submission handler
  const handleCreateReceipt = (data: {
    partyId: string;
    type: TransactionType;
    amount: number;
    paymentMethod: PaymentMethod;
    notes: string;
  }) => {
    if (!checkCanCreateInvoice()) {
      setActiveModal('security-guard');
      return;
    }
    const newTx = store.addTransaction({
      partyId: data.partyId,
      type: data.type,
      date: new Date().toISOString(),
      items: [],
      totalAmount: data.amount,
      paidAmount: data.amount,
      remainingBalanceDelta: -data.amount,
      notes: data.notes,
      paymentMethod: data.paymentMethod,
    });

    refreshStoreData();
    setActiveModal(null);

    const party = store.getPartyById(data.partyId);
    if (party) {
      setActiveTxForPdf(newTx);
      setModalParty(party);
      setActiveModal('invoice-pdf');
    }
  };

  // Party CRUD handlers
  const handleAddParty = (partyData: Omit<Party, 'id' | 'currentBalance' | 'createdAt'>) => {
    store.addParty(partyData);
    refreshStoreData();
  };

  const handleUpdateParty = (id: string, updates: Partial<Party>) => {
    store.updateParty(id, updates);
    refreshStoreData();
  };

  const handleDeleteParty = (id: string) => {
    store.deleteParty(id);
    if (selectedPartyForLedger?.id === id) {
      setSelectedPartyForLedger(null);
    }
    refreshStoreData();
  };

  // Product CRUD handlers
  const handleAddProduct = (prodData: Omit<Product, 'id'>) => {
    store.addProduct(prodData);
    refreshStoreData();
  };

  const handleUpdateProduct = (id: string, updates: Partial<Product>) => {
    store.updateProduct(id, updates);
    refreshStoreData();
  };

  const handleDeleteProduct = (id: string) => {
    store.deleteProduct(id);
    refreshStoreData();
  };

  // Profile Update
  const handleUpdateProfile = (updates: Partial<BusinessProfile>) => {
    store.updateProfile(updates);
    refreshStoreData();
  };

  // Export / Import / Reset demo data
  const handleExportBackup = () => {
    const json = store.exportDataJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daftar_smart_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (jsonString: string) => {
    const ok = store.importDataJSON(jsonString);
    if (ok) {
      refreshStoreData();
    }
    return ok;
  };

  const handleResetDemoData = () => {
    store.resetToDefaults();
    setSelectedPartyForLedger(null);
    refreshStoreData();
  };

  const handleSaveStoreSetup = (
    updatedProfile: Partial<BusinessProfile>,
    freshStart: boolean
  ) => {
    if (freshStart) {
      store.clearToFreshStart(updatedProfile);
      setSelectedPartyForLedger(null);
    } else {
      store.updateProfile(updatedProfile);
    }
    refreshStoreData();
  };

  // Count active debtors for bottom badge
  const activeDebtorsCount = useMemo(() => {
    return parties.filter((p) => p.type === 'CUSTOMER' && p.currentBalance > 0).length;
  }, [parties]);

  return (
    <MobileFrame
      lang={lang}
      onToggleLang={handleToggleLang}
      onOpenPhonePairing={() => setActiveModal('phone-pairing')}
      bottomBar={
        !licenseStatus.isActive ? undefined : (
          <BottomNavigation
            activeTab={activeTab}
            onSelectTab={(tab) => {
              setSelectedPartyForLedger(null);
              setActiveTab(tab);
            }}
            lang={lang}
            receivablesCount={activeDebtorsCount}
          />
        )
      }
    >
      {/* PWA Install Banner */}
      {licenseStatus.isActive && (
        <PWAInstallBanner
          lang={lang}
          onOpenPhonePairing={() => setActiveModal('phone-pairing')}
        />
      )}

      {/* View routing depending on activeTab, dedicated ledger view, or activation gate */}
      {!licenseStatus.isActive ? (
        <ActivationGateView
          lang={lang}
          profile={profile}
          onToggleLang={handleToggleLang}
          onActivated={(status) => {
            setLicenseStatus(status);
            refreshStoreData();
          }}
          onOpenOwnerKeyGen={() => setActiveModal('admin-keygen')}
        />
      ) : selectedPartyForLedger ? (
        <PartyLedgerView
          party={selectedPartyForLedger}
          transactions={selectedPartyTransactions}
          profile={profile}
          lang={lang}
          onBack={() => setSelectedPartyForLedger(null)}
          onOpenReceivePayment={() => {
            if (selectedPartyForLedger.type === 'CUSTOMER') {
              handleOpenReceiptModal(selectedPartyForLedger);
            } else {
              handleOpenVoucherModal(selectedPartyForLedger);
            }
          }}
          onOpenNewSale={() => {
            if (selectedPartyForLedger.type === 'CUSTOMER') {
              handleOpenSaleModal(selectedPartyForLedger);
            } else {
              handleOpenSupplyModal(selectedPartyForLedger);
            }
          }}
          onOpenStatementPdf={() => {
            setActiveModal('statement-pdf');
          }}
          onSelectTransaction={(tx) => {
            setActiveTxForPdf(tx);
            setModalParty(selectedPartyForLedger);
            setActiveModal('invoice-pdf');
          }}
          onVoidTransaction={handleVoidTransaction}
        />
      ) : activeTab === 'dashboard' ? (
        <DashboardView
          metrics={metrics}
          parties={parties}
          recentTransactions={transactions}
          profile={profile}
          lang={lang}
          onOpenNewSale={() => handleOpenSaleModal(null)}
          onOpenReceivePayment={() => handleOpenReceiptModal(null)}
          onOpenNewSupply={() => handleOpenSupplyModal(null)}
          onOpenPayDistributor={() => handleOpenVoucherModal(null)}
          onSelectTransaction={(tx) => {
            const p = store.getPartyById(tx.partyId);
            if (p) {
              setActiveTxForPdf(tx);
              setModalParty(p);
              setActiveModal('invoice-pdf');
            }
          }}
          onNavigateParties={() => setActiveTab('parties')}
        />
      ) : activeTab === 'parties' ? (
        <PartyDirectoryView
          parties={parties}
          profile={profile}
          lang={lang}
          onSelectPartyLedger={(party) => setSelectedPartyForLedger(party)}
          onOpenReceivePaymentForParty={(party) => {
            if (party.type === 'CUSTOMER') {
              handleOpenReceiptModal(party);
            } else {
              handleOpenVoucherModal(party);
            }
          }}
          onOpenNewSaleForParty={(party) => {
            if (party.type === 'CUSTOMER') {
              handleOpenSaleModal(party);
            } else {
              handleOpenSupplyModal(party);
            }
          }}
          onAddParty={handleAddParty}
          onUpdateParty={handleUpdateParty}
          onDeleteParty={handleDeleteParty}
        />
      ) : activeTab === 'products' ? (
        <ProductsCatalogModal
          products={products}
          profile={profile}
          lang={lang}
          onAddProduct={handleAddProduct}
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct}
        />
      ) : (
        <SettingsView
          profile={profile}
          lang={lang}
          onUpdateProfile={handleUpdateProfile}
          onToggleLang={handleToggleLang}
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
          onResetDemoData={handleResetDemoData}
          onOpenPhonePairing={() => setActiveModal('phone-pairing')}
          onOpenStoreSetup={() => setActiveModal('store-setup')}
          onOpenSecurityGuard={() => setActiveModal('security-guard')}
          onOpenKeyGenerator={() => setActiveModal('admin-keygen')}
        />
      )}

      {/* Modals with AnimatePresence */}
      <AnimatePresence>
        {/* Modal: Fast POS / Credit Sale */}
        {activeModal === 'invoice-sale' && (
          <InvoiceCreatorModal
            key="modal-invoice-sale"
            type="SALE_CREDIT"
            parties={parties}
            products={products}
            profile={profile}
            lang={lang}
            initialPartyId={modalParty?.id}
            onClose={() => setActiveModal(null)}
            onSubmit={handleCreateTransaction}
          />
        )}

        {/* Modal: Fast POS / Supply Intake */}
        {activeModal === 'invoice-supply' && (
          <InvoiceCreatorModal
            key="modal-invoice-supply"
            type="SUPPLY_CREDIT"
            parties={parties}
            products={products}
            profile={profile}
            lang={lang}
            initialPartyId={modalParty?.id}
            onClose={() => setActiveModal(null)}
            onSubmit={handleCreateTransaction}
          />
        )}

        {/* Modal: Payment Receipt (سند قبض من عميل) */}
        {activeModal === 'receipt' && (
          <PaymentReceiptModal
            key="modal-payment-receipt"
            type="PAYMENT_RECEIVED"
            parties={parties}
            profile={profile}
            lang={lang}
            initialPartyId={modalParty?.id}
            onClose={() => setActiveModal(null)}
            onSubmit={handleCreateReceipt}
          />
        )}

        {/* Modal: Payment Voucher (سند صرف لمورد) */}
        {activeModal === 'voucher' && (
          <PaymentReceiptModal
            key="modal-payment-voucher"
            type="PAYMENT_PAID"
            parties={parties}
            profile={profile}
            lang={lang}
            initialPartyId={modalParty?.id}
            onClose={() => setActiveModal(null)}
            onSubmit={handleCreateReceipt}
          />
        )}

        {/* Modal: Invoice & Receipt PDF Preview */}
        {activeModal === 'invoice-pdf' && activeTxForPdf && modalParty && (
          <Suspense fallback={<ModalLoadingSpinner lang={lang} />}>
            <InvoicePdfModal
              key="modal-invoice-pdf"
              transaction={activeTxForPdf}
              party={modalParty}
              profile={profile}
              lang={lang}
              onClose={() => {
                setActiveModal(null);
                setActiveTxForPdf(null);
              }}
              onVoidTransaction={handleVoidTransaction}
            />
          </Suspense>
        )}

        {/* Modal: Detailed Account Statement PDF */}
        {activeModal === 'statement-pdf' && selectedPartyForLedger && (
          <Suspense fallback={<ModalLoadingSpinner lang={lang} />}>
            <StatementPdfModal
              key="modal-statement-pdf"
              party={selectedPartyForLedger}
              transactions={selectedPartyTransactions}
              profile={profile}
              lang={lang}
              onClose={() => setActiveModal(null)}
            />
          </Suspense>
        )}

        {/* Modal: Test on Phone / Mobile QR Pairing */}
        {activeModal === 'phone-pairing' && (
          <Suspense fallback={<ModalLoadingSpinner lang={lang} />}>
            <PhonePairingModal
              key="modal-phone-pairing"
              lang={lang}
              onClose={() => setActiveModal(null)}
              onOpenStoreSetup={() => setActiveModal('store-setup')}
            />
          </Suspense>
        )}

        {/* Modal: Real Store Setup Wizard */}
        {activeModal === 'store-setup' && (
          <Suspense fallback={<ModalLoadingSpinner lang={lang} />}>
            <StoreSetupWizardModal
              key="modal-store-setup"
              currentProfile={profile}
              lang={lang}
              onClose={() => setActiveModal(null)}
              onSaveSetup={handleSaveStoreSetup}
            />
          </Suspense>
        )}

        {/* Modal: Security Guard Licensing & Activation */}
        {activeModal === 'security-guard' && (
          <Suspense fallback={<ModalLoadingSpinner lang={lang} />}>
            <SecurityGuardModal
              key="modal-security-guard"
              profile={profile}
              lang={lang}
              onClose={() => setActiveModal(null)}
              onLicenseUpdated={(status) => {
                setLicenseStatus(status);
                refreshStoreData();
              }}
            />
          </Suspense>
        )}

        {/* Modal: Owner Master Key Generator */}
        {activeModal === 'admin-keygen' && (
          <Suspense fallback={<ModalLoadingSpinner lang={lang} />}>
            <AdminKeyGeneratorModal
              key="modal-admin-keygen"
              lang={lang}
              onClose={() => setActiveModal(null)}
              onLicenseActivated={(status) => {
                setLicenseStatus(status);
                refreshStoreData();
              }}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </MobileFrame>
  );
}
