/**
 * 主應用程式元件 (App.tsx) - 純手機 App 視圖 (Mobile-Only)
 * 
 * 1:1 還原 AppSheet 手機直式排版，無多餘電腦版切換與外框雜訊
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginView } from './components/LoginView';
import { MachineCard } from './components/MachineCard';
import { MyReservationsView } from './components/MyReservationsView';
import { CourseSessionsView } from './components/CourseSessionsView';
import { BookingSettingsView } from './components/BookingSettingsView';
import { ReservationModal } from './components/ReservationModal';
import { NotificationModal } from './components/NotificationModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { PlusCircle, RefreshCw, LogOut, User } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { 
    machines, 
    activeTab, 
    isLoggedIn,
    activeUser,
    isLoading,
    logout,
    refreshData 
  } = useApp();

  const [selectedMachineForRes, setSelectedMachineForRes] = useState<string | null>(null);
  const [isResModalOpen, setIsResModalOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);

  const handleOpenReservation = (machineId?: string) => {
    setSelectedMachineForRes(machineId || null);
    setIsResModalOpen(true);
  };

  // 若尚未登入 / 尚未通過 Email 驗證，顯示登入畫面
  if (!isLoggedIn) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-slate-900 py-0 sm:py-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md h-screen sm:h-[840px] bg-slate-50 sm:rounded-[44px] sm:border-[10px] sm:border-slate-800 shadow-2xl overflow-hidden flex flex-col relative">
        {/* 手機頂部狀態列 */}
        <div className="h-10 bg-white flex items-center justify-between px-6 text-xs font-semibold text-slate-800 border-b border-slate-100 select-none">
          <span>09:41</span>
          <div className="flex items-center gap-1.5">
            <span>📶</span>
            <span>⚡ 100%</span>
          </div>
        </div>

        {/* 手機 App Header (1:1 截圖 1) */}
        <div className="bg-white px-4 py-3 border-b border-slate-200 flex items-center justify-between shadow-2xs relative z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={logout}
              className="p-1.5 text-slate-500 hover:text-red-600 rounded-xl hover:bg-slate-100 flex items-center gap-1 transition-colors"
              title="登出並返回驗證介面"
            >
              <LogOut size={17} />
            </button>
            <div>
              <h2 className="font-bold text-base text-slate-900 leading-tight">
                {activeTab === 'machines' && '機台列表'}
                {activeTab === 'reservations' && '我的預約'}
                {activeTab === 'courses' && '課程場次'}
                {activeTab === 'settings' && '預約設定'}
              </h2>
              <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                <User size={10} />
                {activeUser.name} ({activeUser.mail})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => refreshData()} 
              className="p-1.5 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100"
              title="重新整理"
            >
              <RefreshCw size={17} />
            </button>
            <button 
              onClick={() => handleOpenReservation()}
              className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-500/30 transition-transform active:scale-95"
              title="新增預約"
            >
              <PlusCircle size={18} />
            </button>
          </div>
        </div>

        {/* 手機主體內容滾動區 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-100/70">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-2">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold">資料同步中...</span>
            </div>
          ) : (
            <>
              {/* Tab 1: 機台列表 (1:1 截圖 1) */}
              {activeTab === 'machines' && (
                <div className="space-y-3">
                  {machines.map(m => (
                    <MachineCard
                      key={m.id}
                      machine={m}
                      onOpenReservationModal={id => handleOpenReservation(id)}
                    />
                  ))}
                </div>
              )}

              {/* Tab 2: 我的預約 (1:1 截圖 2) */}
              {activeTab === 'reservations' && <MyReservationsView />}

              {/* Tab 3: 課程場次 (1:1 截圖 3) */}
              {activeTab === 'courses' && <CourseSessionsView />}

              {/* Tab 4: 預約設定 (1:1 截圖 4) */}
              {activeTab === 'settings' && <BookingSettingsView />}
            </>
          )}
        </div>

        {/* 手機底部導覽列 (1:1 截圖 1-4 之 4 大 Tabs) */}
        <MobileBottomNav />
      </div>

      {/* 彈窗 Modals */}
      {isResModalOpen && (
        <ReservationModal
          initialMachineId={selectedMachineForRes || undefined}
          onClose={() => setIsResModalOpen(false)}
        />
      )}
      {isNotifModalOpen && (
        <NotificationModal
          onClose={() => setIsNotifModalOpen(false)}
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
};

export default App;
