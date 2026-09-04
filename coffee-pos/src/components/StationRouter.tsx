import React, { useState, useEffect, useId } from 'react';
import { StationRole } from '../types';
import { posStore, usePosStore } from '../state/store';
import {
  Car,
  ChefHat,
  CreditCard,
  ShieldAlert,
  Lock,
  Unlock,
  Radio,
  RefreshCw,
  X,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { DriveThruStation } from '../stations/DriveThruStation';
import { KdsStation } from '../stations/KdsStation';

interface StationRouterProps {
  renderStation?: (station: StationRole) => React.ReactNode;
}

const MASTER_PINS = ['7788', '1234'];
const STATION_STORAGE_KEY = 'COFFEE_POS_STATION_ROLE';
const LOCK_STORAGE_KEY = 'COFFEE_POS_STATION_LOCKED';

export const StationRouter: React.FC<StationRouterProps> = ({ renderStation }) => {
  const store = usePosStore();
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(LOCK_STORAGE_KEY) === 'true';
    }
    return false;
  });

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinTargetAction, setPinTargetAction] = useState<{
    type: 'SWITCH_STATION' | 'TOGGLE_LOCK';
    targetStation?: StationRole;
  } | null>(null);

  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');

  // 1. URL Query Parameter Override and LocalStorage Initialization
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const stationParam = params.get('station')?.toLowerCase();

    let targetRole: StationRole | null = null;
    if (stationParam === 'drive-thru' || stationParam === 'drive_thru' || stationParam === 'drivethru') {
      targetRole = 'DRIVE_THRU';
    } else if (stationParam === 'kds' || stationParam === 'kitchen') {
      targetRole = 'KDS';
    } else if (stationParam === 'cashier') {
      targetRole = 'CASHIER';
    } else if (stationParam === 'owner' || stationParam === 'admin') {
      targetRole = 'OWNER';
    }

    if (targetRole) {
      posStore.setActiveStation(targetRole);
    } else {
      const savedRole = localStorage.getItem(STATION_STORAGE_KEY) as StationRole;
      if (savedRole && ['DRIVE_THRU', 'KDS', 'CASHIER', 'OWNER'].includes(savedRole)) {
        posStore.setActiveStation(savedRole);
      }
    }
  }, []);

  const handleStationClick = (role: StationRole) => {
    if (role === store.activeStation) return;

    // Owner station ALWAYS requires PIN challenge
    if (role === 'OWNER') {
      setPinTargetAction({ type: 'SWITCH_STATION', targetStation: role });
      setEnteredPin('');
      setPinError('');
      setIsPinModalOpen(true);
      return;
    }

    // If station is currently locked, switching requires PIN challenge
    if (isLocked) {
      setPinTargetAction({ type: 'SWITCH_STATION', targetStation: role });
      setEnteredPin('');
      setPinError('');
      setIsPinModalOpen(true);
      return;
    }

    posStore.setActiveStation(role);
  };

  const handleToggleLock = () => {
    if (isLocked) {
      // Unlocking requires PIN
      setPinTargetAction({ type: 'TOGGLE_LOCK' });
      setEnteredPin('');
      setPinError('');
      setIsPinModalOpen(true);
    } else {
      // Locking can be done immediately
      setIsLocked(true);
      localStorage.setItem(LOCK_STORAGE_KEY, 'true');
    }
  };

  const handlePinSubmit = () => {
    if (MASTER_PINS.includes(enteredPin)) {
      setPinError('');
      setIsPinModalOpen(false);

      if (pinTargetAction?.type === 'SWITCH_STATION' && pinTargetAction.targetStation) {
        posStore.setActiveStation(pinTargetAction.targetStation);
      } else if (pinTargetAction?.type === 'TOGGLE_LOCK') {
        setIsLocked(false);
        localStorage.setItem(LOCK_STORAGE_KEY, 'false');
      }

      setPinTargetAction(null);
      setEnteredPin('');
    } else {
      setPinError('رمز PIN غير صحيح. جرّب 7788 أو 1234');
      setEnteredPin('');
    }
  };

  const handleNumpadPress = (digit: string) => {
    if (enteredPin.length < 4) {
      setEnteredPin((prev) => prev + digit);
    }
  };

  const handleNumpadClear = () => {
    setEnteredPin('');
    setPinError('');
  };

  const stationsMeta: { role: StationRole; labelAr: string; labelEn: string; icon: any; color: string }[] = [
    {
      role: 'DRIVE_THRU',
      labelAr: 'طلبات السيارات',
      labelEn: 'Drive-Thru',
      icon: Car,
      color: 'from-amber-500/20 to-amber-600/10 text-amber-400 border-amber-500/30',
    },
    {
      role: 'KDS',
      labelAr: 'شاشة المطبخ (KDS)',
      labelEn: 'Kitchen Board',
      icon: ChefHat,
      color: 'from-emerald-500/20 to-emerald-600/10 text-emerald-400 border-emerald-500/30',
    },
    {
      role: 'CASHIER',
      labelAr: 'نقطة الكاشير',
      labelEn: 'Cashier POS',
      icon: CreditCard,
      color: 'from-blue-500/20 to-blue-600/10 text-blue-400 border-blue-500/30',
    },
    {
      role: 'OWNER',
      labelAr: 'إدارة المالك',
      labelEn: 'Owner & Reports',
      icon: ShieldAlert,
      color: 'from-purple-500/20 to-purple-600/10 text-purple-400 border-purple-500/30',
    },
  ];

  const currentMeta = stationsMeta.find((s) => s.role === store.activeStation)!;

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 selection:bg-amber-500/30">
      {/* Station Navigation & Status Header */}
      <header className="sticky top-0 z-40 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Active Station Branding */}
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl bg-gradient-to-br border ${currentMeta.color}`}
            >
              <currentMeta.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm tracking-wide text-zinc-100">
                  {currentMeta.labelAr}
                </h1>
                <span className="text-xs text-zinc-400 font-mono hidden sm:inline">
                  [{currentMeta.labelEn}]
                </span>
                {isLocked && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                    <Lock className="w-2.5 h-2.5" /> مقفل
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {posStore.getTransport().getTransportName() === 'supabase'
                    ? 'Supabase Realtime'
                    : 'BroadcastChannel (خاطف)'}
                </span>
                <span>•</span>
                <span>وردية #{store.currentShift.id.slice(-4)}</span>
              </div>
            </div>
          </div>

          {/* Station Tabs */}
          <nav className="flex items-center gap-1 bg-zinc-950/60 p-1 rounded-xl border border-zinc-800">
            {stationsMeta.map((s) => {
              const isActive = store.activeStation === s.role;
              const Icon = s.icon;
              return (
                <button
                  key={s.role}
                  onClick={() => handleStationClick(s.role)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                  }`}
                  title={s.labelAr}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{s.labelAr}</span>
                  {s.role === 'OWNER' && (
                    <KeyRound className="w-3 h-3 text-zinc-500" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Actions: Station Lock & Reset */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToggleLock}
              className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
                isLocked
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                  : 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
              }`}
              title={isLocked ? 'إلغاء قفل المحطة (يتطلب PIN)' : 'قفل المحطة على هذا الجهاز'}
            >
              {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                if (window.confirm('هل تريد إعادة ضبط بيانات العرض التجريبي؟')) {
                  posStore.resetToDefaults();
                }
              }}
              className="p-2 rounded-lg bg-zinc-800/80 border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              title="إعادة ضبط البيانات الافتراضية"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6">
        {renderStation ? (
          renderStation(store.activeStation)
        ) : store.activeStation === 'DRIVE_THRU' ? (
          <DriveThruStation />
        ) : store.activeStation === 'KDS' ? (
          <KdsStation />
        ) : (
          <DefaultStationView station={store.activeStation} />
        )}
      </main>

      {/* Master PIN Challenge Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
            <button
              onClick={() => {
                setIsPinModalOpen(false);
                setPinTargetAction(null);
                setEnteredPin('');
                setPinError('');
              }}
              className="absolute top-4 left-4 text-zinc-400 hover:text-zinc-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 mb-3">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-zinc-100">رمز المرور الإداري (Master PIN)</h2>
              <p className="text-xs text-zinc-400 mt-1">
                {pinTargetAction?.type === 'SWITCH_STATION'
                  ? `الانتقال إلى محطة ${pinTargetAction.targetStation} محمي برمز PIN`
                  : 'إلغاء قفل المحطة يتطلب صلاحية المشرف'}
              </p>
              <p className="text-[11px] text-zinc-500 mt-1 font-mono">
                [تجريبي: 7788 أو 1234]
              </p>
            </div>

            {/* PIN Dots Indicator */}
            <div className="flex justify-center gap-3 mb-6">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border transition-all ${
                    idx < enteredPin.length
                      ? 'bg-amber-400 border-amber-400 scale-110 shadow-sm shadow-amber-400/50'
                      : 'border-zinc-700 bg-zinc-800'
                  }`}
                />
              ))}
            </div>

            {pinError && (
              <div className="mb-4 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg text-center font-medium">
                {pinError}
              </div>
            )}

            {/* Touch Numpad */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleNumpadPress(digit)}
                  className="h-12 text-lg font-bold rounded-xl bg-zinc-800 border border-zinc-700/80 hover:bg-zinc-700 active:scale-95 transition-all text-zinc-100"
                >
                  {digit}
                </button>
              ))}
              <button
                onClick={handleNumpadClear}
                className="h-12 text-sm font-semibold rounded-xl bg-zinc-800/50 border border-zinc-800 text-zinc-400 hover:text-zinc-200 active:scale-95 transition-all"
              >
                مسح
              </button>
              <button
                onClick={() => handleNumpadPress('0')}
                className="h-12 text-lg font-bold rounded-xl bg-zinc-800 border border-zinc-700/80 hover:bg-zinc-700 active:scale-95 transition-all text-zinc-100"
              >
                0
              </button>
              <button
                onClick={handlePinSubmit}
                disabled={enteredPin.length === 0}
                className="h-12 text-sm font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                دخول
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DefaultStationView: React.FC<{ station: StationRole }> = ({ station }) => {
  const store = usePosStore();

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-zinc-100">
              المحطة النشطة: {station}
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              جاهزية البنية التحتية، الاتصال الفوري بنواقل البيانات، والتحكم بالصلاحيات
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              حالة النظام: نشط ومزامن 100%
            </span>
          </div>
        </div>

        {/* Realtime Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80">
            <div className="text-xs text-zinc-400">إجمالي الطلبات</div>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {store.orders.length}
            </div>
          </div>
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80">
            <div className="text-xs text-zinc-400">قيد التحضير (المطبخ)</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {store.orders.filter((o) => o.status === 'IN_PREPARATION').length}
            </div>
          </div>
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80">
            <div className="text-xs text-zinc-400">جاهز للاستلام (الكاشير)</div>
            <div className="text-2xl font-black text-blue-400 mt-1">
              {store.orders.filter((o) => o.status === 'READY_FOR_PICKUP').length}
            </div>
          </div>
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80">
            <div className="text-xs text-zinc-400">العملاء بالدفتر (آجل)</div>
            <div className="text-2xl font-black text-purple-400 mt-1">
              {store.customers.length}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Live Preview of Orders */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
        <h3 className="text-base font-bold text-zinc-100 mb-4 flex items-center justify-between">
          <span>قائمة الطلبات المباشرة (Live Realtime Queue)</span>
          <span className="text-xs text-zinc-500 font-mono">
            {store.orders.length} orders
          </span>
        </h3>
        <div className="space-y-3">
          {store.orders.map((order) => (
            <div
              key={order.id}
              className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-amber-400 text-sm">
                  {order.formattedOrderNumber}
                </span>
                <div>
                  <div className="text-sm font-semibold text-zinc-200">
                    {order.tagValue} {order.vehicleModel ? `(${order.vehicleModel})` : ''}
                  </div>
                  <div className="text-xs text-zinc-400">
                    {order.items.map((it) => `${it.quantity}x ${it.nameAr}`).join(' + ')}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-mono font-bold text-zinc-100">
                  {order.total.toFixed(2)} ر.س
                </span>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    order.status === 'IN_PREPARATION'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : order.status === 'READY_FOR_PICKUP'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : order.status === 'COMPLETED'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {order.status}
                </span>
                {order.status === 'IN_PREPARATION' && (
                  <button
                    onClick={() => posStore.bumpOrder(order.id)}
                    className="text-xs px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                  >
                    جاهز (Bump)
                  </button>
                )}
                {order.status === 'READY_FOR_PICKUP' && (
                  <button
                    onClick={() =>
                      posStore.completeOrder(order.id, {
                        paymentMethod: 'CASH',
                        cashTendered: order.total,
                        changeDue: 0,
                      })
                    }
                    className="text-xs px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium"
                  >
                    سداد نقد (Pay)
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
