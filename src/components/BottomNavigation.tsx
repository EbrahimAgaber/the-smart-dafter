import React from 'react';
import { LayoutDashboard, Users, Package, Settings } from 'lucide-react';
import { ActiveTab, Language } from '../types';
import { getTranslation } from '../i18n/translations';

interface BottomNavigationProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  lang: Language;
  receivablesCount?: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onSelectTab,
  lang,
  receivablesCount = 0,
}) => {
  const t = getTranslation(lang);

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'dashboard',
      label: t.navDashboard,
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'parties',
      label: t.navParties,
      icon: <Users className="w-5 h-5" />,
      badge: receivablesCount > 0 ? receivablesCount : undefined,
    },
    {
      id: 'products',
      label: t.navProducts,
      icon: <Package className="w-5 h-5" />,
    },
    {
      id: 'settings',
      label: t.navSettings,
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <nav
      id="bottom-tab-bar"
      className="no-print absolute bottom-0 inset-x-0 bg-white/90 backdrop-blur-xl border-t border-slate-200/80 z-30 px-2 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom,0px))] flex items-center justify-around select-none shadow-lg"
    >
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            id={`nav-tab-${item.id}`}
            onClick={() => onSelectTab(item.id)}
            className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 min-w-[64px] active:scale-95 ${
              isActive
                ? 'text-cyan-600'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-cyan-50 text-cyan-600' : 'bg-transparent'}`}>
              {item.icon}
              {item.badge !== undefined && (
                <span
                  id={`nav-badge-${item.id}`}
                  className="absolute -top-1 -end-1 bg-red-500 text-white text-[10px] font-mono font-black px-1.5 py-0.2 rounded-full min-w-[16px] text-center shadow-xs"
                >
                  {item.badge}
                </span>
              )}
            </div>
            <span className={`text-[11px] mt-0.5 tracking-tight ${isActive ? 'font-bold text-cyan-700' : 'font-medium text-slate-500'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
