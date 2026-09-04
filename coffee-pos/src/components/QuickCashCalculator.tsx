import React from 'react';
import { Banknote, Check, AlertCircle, ArrowRight } from 'lucide-react';

export interface QuickCashCalculatorProps {
  total: number;
  tendered: number;
  onTenderedChange: (tendered: number) => void;
  onQuickCheckout?: () => void;
  className?: string;
}

export const SAUDI_DENOMINATIONS = [10, 20, 50, 100, 200, 500];

export function calculateChangeDue(total: number, tendered: number): {
  changeDue: number;
  isValid: boolean;
  underpayment: number;
} {
  const roundedTotal = Math.round(total * 100) / 100;
  const roundedTendered = Math.round(tendered * 100) / 100;
  const diff = Math.round((roundedTendered - roundedTotal) * 100) / 100;

  if (diff >= 0) {
    return {
      changeDue: diff,
      isValid: true,
      underpayment: 0,
    };
  }

  return {
    changeDue: 0,
    isValid: false,
    underpayment: Math.abs(diff),
  };
}

export const QuickCashCalculator: React.FC<QuickCashCalculatorProps> = ({
  total,
  tendered,
  onTenderedChange,
  onQuickCheckout,
  className = '',
}) => {
  const { changeDue, isValid, underpayment } = calculateChangeDue(total, tendered);

  const handleDenominationClick = (amount: number) => {
    onTenderedChange(amount);
  };

  const handleExactClick = () => {
    onTenderedChange(total);
  };

  return (
    <div className={`space-y-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 ${className}`}>
      {/* Header & Total Banner */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">حاسبة النقد السريع (Quick Cash)</h3>
            <p className="text-xs text-zinc-400">حساب الفكة والمبالغ المستلمة في أقل من 3 نقرات</p>
          </div>
        </div>
        <div className="text-left">
          <div className="text-xs text-zinc-400">إجمالي الفاتورة</div>
          <div className="text-lg font-black text-amber-400 font-mono">
            {total.toFixed(2)} <span className="text-xs font-normal text-zinc-400">ر.س</span>
          </div>
        </div>
      </div>

      {/* Prominent Live Change Due / Underpayment Display */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
          <span className="text-xs text-zinc-400 block mb-1">المبلغ المستلم (Tendered)</span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              step="any"
              min="0"
              value={tendered > 0 ? tendered : ''}
              placeholder="0.00"
              onChange={(e) => onTenderedChange(parseFloat(e.target.value) || 0)}
              className="w-full bg-transparent font-mono text-xl sm:text-2xl font-black text-zinc-100 focus:outline-none placeholder:text-zinc-600"
            />
            <span className="text-xs text-zinc-400">ر.س</span>
          </div>
        </div>

        <div
          className={`p-3.5 rounded-xl border transition-all ${
            isValid
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          <span className="text-xs block mb-1 font-medium">
            {isValid ? 'الفكة للعميل (Change Due)' : 'المبلغ المتبقي للتحصيل'}
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono">
            {isValid ? (
              <span>+{changeDue.toFixed(2)} <span className="text-xs font-normal">ر.س</span></span>
            ) : (
              <span>-{underpayment.toFixed(2)} <span className="text-xs font-normal">ر.س</span></span>
            )}
          </div>
        </div>
      </div>

      {/* Denominations Button Grid */}
      <div className="space-y-2">
        <div className="text-xs text-zinc-400 font-medium">الفئات النقدية الشائعة (Saudi Riyal):</div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {/* Exact Amount Button */}
          <button
            type="button"
            onClick={handleExactClick}
            className={`h-12 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
              Math.abs(tendered - total) < 0.01
                ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-lg shadow-emerald-500/20 scale-[1.02]'
                : 'bg-zinc-800/80 hover:bg-zinc-800 text-emerald-400 border-zinc-700/80 active:scale-95'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>المبلغ بالضبط</span>
          </button>

          {/* SAR Denominations */}
          {SAUDI_DENOMINATIONS.map((denom) => {
            const isSelected = Math.abs(tendered - denom) < 0.01;
            const isInsufficient = denom < total;

            return (
              <button
                key={denom}
                type="button"
                onClick={() => handleDenominationClick(denom)}
                className={`h-12 rounded-xl font-mono text-sm font-black border transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-lg shadow-amber-500/20 scale-[1.02]'
                    : isInsufficient
                    ? 'bg-zinc-950/60 hover:bg-zinc-800 text-zinc-400 border-zinc-800'
                    : 'bg-zinc-800/90 hover:bg-zinc-700 text-zinc-100 border-zinc-700'
                }`}
              >
                {denom} <span className="text-[11px] font-sans font-normal">ر.س</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Direct Quick Confirmation Action if provided */}
      {onQuickCheckout && (
        <button
          type="button"
          disabled={!isValid || tendered <= 0}
          onClick={onQuickCheckout}
          className="w-full h-12 mt-2 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none active:scale-98 shadow-lg shadow-emerald-500/20"
        >
          <span>تأكيد استلام النقد وإتمام البيع</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default QuickCashCalculator;
