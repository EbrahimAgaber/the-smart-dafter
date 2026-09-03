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
      className="no-print absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 px-3 py-2 flex items-center justify-around select-none shadow-xl"
    >
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            id={`nav-tab-${item.id}`}
            onClick={() => onSelectTab(item.id)}
            className={`relative flex flex-col items-center justify-center py-2 px-4 rounded-2xl transition-all duration-200 ${
              isActive
                ? 'text-cyan-600 font-bold bg-cyan-50 border border-cyan-100'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <div className="relative">
              {item.icon}
              {item.badge !== undefined && (
                <span
                  id={`nav-badge-${item.id}`}
                  className="absolute -top-1.5 -end-2 bg-red-500 text-white text-[10px] font-mono font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-xs"
                >
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-xs mt-1 font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
