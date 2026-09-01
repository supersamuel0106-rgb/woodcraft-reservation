/**
 * 底部導覽列元件 (MobileBottomNav)
 * 
 * 1:1 還原 AppSheet 截圖 1-4 之 4 大分頁圖示、文字與藍色 Active 底線
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { LayoutGrid, ListFilter, CalendarRange, SlidersHorizontal } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const tabs = [
    { id: 'machines', label: '機台列表', icon: LayoutGrid },
    { id: 'reservations', label: '我的預約', icon: ListFilter },
    { id: 'courses', label: '課程場次', icon: CalendarRange },
    { id: 'settings', label: '預約設定', icon: SlidersHorizontal }
  ] as const;

  return (
    <div className="h-16 bg-white border-t border-slate-200 flex items-center justify-around z-20 select-none shadow-lg">
      {tabs.map(t => {
        const isActive = activeTab === t.id;
        const Icon = t.icon;

        return (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 h-full flex flex-col items-center justify-center gap-1 transition-colors relative ${
              isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon size={19} className={isActive ? 'stroke-[2.5]' : 'stroke-2'} />
            <span className="text-[11px] leading-none">{t.label}</span>
            {isActive && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-600 rounded-t-full" />
            )}
          </button>
        );
      })}
    </div>
  );
};
