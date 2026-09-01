/**
 * 頂部導覽列 (Header)
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { Wrench, Bell, Smartphone, Monitor, RefreshCw, Database, LogOut, User } from 'lucide-react';

interface HeaderProps {
  onOpenNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNotifications }) => {
  const { 
    activeUser, 
    viewMode, 
    setViewMode, 
    isLiveSupabase, 
    notifications,
    logout,
    refreshData 
  } = useApp();

  return (
    <header className="bg-slate-900 text-white shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo & 標題 */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-inner">
            <Wrench size={20} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg leading-tight">工廠機臺預約系統</h1>
              <span className="text-[11px] bg-blue-500/20 text-blue-300 font-semibold px-2 py-0.5 rounded border border-blue-400/30">
                v0.4 獨立版
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">木工機台排隊與時段預約系統</p>
          </div>
        </div>

        {/* 右側操作區 */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Supabase 狀態指示燈 */}
          <div 
            className={`hidden md:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
              isLiveSupabase 
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30' 
                : 'bg-amber-950/60 text-amber-300 border-amber-500/30'
            }`}
            title={isLiveSupabase ? '已連接雲端 Supabase PostgreSQL' : '本地離線快取模式'}
          >
            <Database size={12} />
            <span>{isLiveSupabase ? 'Supabase 連線中' : '本地快取'}</span>
          </div>

          {/* 手機 / 電腦視圖切換 */}
          <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setViewMode('mobile')}
              className={`p-1.5 rounded-md text-xs flex items-center gap-1 transition-colors ${
                viewMode === 'mobile' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
              title="手機模擬器視圖 (390px)"
            >
              <Smartphone size={14} />
              <span className="hidden sm:inline">手機</span>
            </button>
            <button
              onClick={() => setViewMode('desktop')}
              className={`p-1.5 rounded-md text-xs flex items-center gap-1 transition-colors ${
                viewMode === 'desktop' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
              title="電腦網頁視圖"
            >
              <Monitor size={14} />
              <span className="hidden sm:inline">電腦</span>
            </button>
          </div>

          {/* 目前登入者資訊 */}
          <div className="flex items-center gap-1.5 text-xs bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
            <User size={13} className="text-blue-400" />
            <span className="font-semibold text-white">{activeUser.name}</span>
            <span className="text-[10px] text-slate-400 hidden lg:inline">({activeUser.mail})</span>
          </div>

          {/* 刷新按鈕 */}
          <button
            onClick={() => refreshData()}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="手動同步最新資料"
          >
            <RefreshCw size={16} />
          </button>

          {/* 通知鈴鐺 */}
          <button
            onClick={onOpenNotifications}
            className="relative p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="查看叫號與系統通知"
          >
            <Bell size={16} />
            {notifications.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>

          {/* 登出 / 切換帳號按鈕 */}
          <button
            onClick={logout}
            className="flex items-center gap-1 text-xs bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/30 px-2.5 py-1.5 rounded-lg transition-colors"
            title="返回登入介面"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">登出</span>
          </button>
        </div>
      </div>
    </header>
  );
};
