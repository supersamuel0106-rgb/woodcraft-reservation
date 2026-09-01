/**
 * 我的預約視圖 (MyReservationsView) - 1:1 截圖 2
 * 
 * 包含：
 * 1. 支援依 reservationId 精確啟動 / 結束預約
 * 2. 底部提供「🗑️ 清除已完成預約紀錄」按鈕，一鍵從 Supabase Database 刪除歷史紀錄
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Play, Square, Calendar, User, Clock, Trash2 } from 'lucide-react';

export const MyReservationsView: React.FC = () => {
  const { 
    reservations, 
    activeUser, 
    cancelReservation, 
    startMachineUsage, 
    finishMachineUsage,
    clearCompletedReservations
  } = useApp();

  const [isClearing, setIsClearing] = useState(false);

  // 篩選與當前使用者相關之預約
  const myReservations = reservations
    .filter(r => r.email === activeUser.mail || r.students.includes(activeUser.name))
    .sort((a, b) => {
      const statusWeight = (s: string) => {
        if (s === '使用中') return 1;
        if (s === '等候報到') return 2;
        if (s === '排隊中' || s === '等待中') return 3;
        return 4;
      };
      const wDiff = statusWeight(a.status) - statusWeight(b.status);
      if (wDiff !== 0) return wDiff;
      return a.startMinutes - b.startMinutes;
    });

  // 是否有可清除的歷史紀錄
  const completedList = myReservations.filter(r => r.status === '已完成' || r.status === '已取消');
  const hasCompleted = completedList.length > 0;

  const handleClearCompleted = async () => {
    if (!hasCompleted) {
      alert('目前沒有已完成或已取消的歷史紀錄需要清除！');
      return;
    }

    const ok = window.confirm(
      `確定要清除【${activeUser.name}】所有的已完成預約紀錄嗎？\n\n共 ${completedList.length} 筆歷史紀錄將從 Database 中永久移除。`
    );
    if (!ok) return;

    setIsClearing(true);
    try {
      const res = await clearCompletedReservations();
      alert(res.message);
    } catch (err: any) {
      alert(`清除失敗：${err.message || '系統錯誤'}`);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-3 pb-2">
      {myReservations.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 text-slate-500 space-y-2">
          <Calendar size={36} className="mx-auto text-slate-300 mb-1" />
          <p className="font-bold text-sm text-slate-800">目前尚無任何預約紀錄</p>
          <p className="text-xs text-slate-400">請至「機台列表」點擊新增預約或現場排隊。</p>
        </div>
      ) : (
        myReservations.map(res => {
          const isFinished = res.status === '已完成' || res.status === '已取消';
          const isInUse = res.status === '使用中';

          return (
            <div
              key={res.id}
              className={`bg-white rounded-2xl p-5 shadow-xs border transition-all ${
                isInUse ? 'border-red-200 ring-1 ring-red-100 bg-red-50/10' : 'border-slate-200'
              }`}
            >
              {/* 學生姓名清單 */}
              <div className="mb-1">
                <h4 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <User size={16} className="text-slate-400" />
                  <span>{res.students.join(', ')}</span>
                </h4>
              </div>

              {/* 機台名稱與時間細節 */}
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-1.5">{res.machineName}</h3>
                
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded">
                    {res.type}
                  </span>
                  
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {res.startTimeFormatted} ～ {res.endTimeFormatted} ({res.durationMinutes} 分)
                  </span>

                  <span
                    className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                      isInUse
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : res.status === '等候報到'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : res.status === '已完成'
                        ? 'bg-slate-100 text-slate-500'
                        : 'bg-blue-50 text-blue-600 border border-blue-200'
                    }`}
                  >
                    [{res.status}]
                  </span>
                </div>
              </div>

              {/* 底部操作按鈕 */}
              {!isFinished && (
                <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex items-center justify-between">
                  {/* 取消按鈕 */}
                  {!isInUse ? (
                    <button
                      onClick={() => cancelReservation(res.id)}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      取消
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">使用中（結束請按右側按鈕）</span>
                  )}

                  {/* 狀態按鈕 */}
                  {!isInUse ? (
                    <button
                      onClick={() => startMachineUsage(res.machineId, res.id)}
                      className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-transform active:scale-95 shadow-md"
                      title="開始使用 (立即報到)"
                    >
                      <Play size={16} className="fill-current ml-0.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => finishMachineUsage(res.machineId, res.id)}
                      className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-transform active:scale-95 shadow-md shadow-red-500/20"
                      title="結束使用 (系統將自動呼叫下一位同學)"
                    >
                      <Square size={14} className="fill-current" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* 底部：清除已完成預約紀錄按鈕 */}
      {hasCompleted && (
        <div className="pt-2 text-center">
          <button
            type="button"
            disabled={isClearing}
            onClick={handleClearCompleted}
            className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs font-bold shadow-xs hover:border-red-300 transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <Trash2 size={15} />
            <span>{isClearing ? '正在自 Database 清除中...' : `清除已完成預約紀錄 (${completedList.length} 筆)`}</span>
          </button>
        </div>
      )}
    </div>
  );
};
