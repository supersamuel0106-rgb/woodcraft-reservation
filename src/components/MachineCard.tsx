/**
 * 機台卡片元件 (MachineCard)
 * 
 * 1. 1:1 還原 AppSheet 機台外觀與動態背景色
 *    • 🟢 空閒: #E8F5E9 (提供「+ 新增預約 / 排隊」按鈕)
 *    • 🔴 使用中: #FFEBEE (純狀態展示，由使用者在「我的預約」按結束)
 *    • 🟡 等待報到: #FFF8E1 (純狀態展示，由被叫號者在「我的預約」按開始使用)
 * 2. 顯示「目前使用：XXX 下一位：YYY (等候報到中)」
 */

import React from 'react';
import { Machine } from '../types';
import { useApp } from '../context/AppContext';
import { getMachineColor } from '../domain/rules';
import { Plus, Share2, Wrench, Clock } from 'lucide-react';

interface MachineCardProps {
  machine: Machine;
  onOpenReservationModal: (machineId: string) => void;
}

export const MachineCard: React.FC<MachineCardProps> = ({ machine, onOpenReservationModal }) => {
  const colorInfo = getMachineColor(machine.status);

  return (
    <div
      className={`p-5 rounded-2xl shadow-xs border flex flex-col justify-between transition-all hover:shadow-md ${colorInfo.bgClass}`}
      style={{ backgroundColor: colorInfo.hexBg }}
    >
      <div>
        {/* 頂部圖示與狀態標籤 */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center mb-2">
              <Wrench size={18} className="text-slate-700" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 leading-snug">{machine.name}</h3>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">空間</p>
          </div>

          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border shadow-2xs ${colorInfo.badgeClass}`}
          >
            {colorInfo.badgeText}
          </span>
        </div>

        {/* 目前使用者與下一位 */}
        <div className="mt-3 mb-4 pt-3 border-t border-black/5">
          <p className="text-sm font-medium text-slate-800">
            目前使用：{machine.currentUserName || '—'} 下一位：{machine.nextUserName || '—'}
          </p>
        </div>
      </div>

      {/* 底部操作區 */}
      <div className="pt-3 border-t border-black/5 flex items-center gap-2">
        {/* 1. 空閒狀態：開放新增預約 / 排隊 */}
        {machine.status === '空閒' && (
          <button
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 px-3 rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-colors"
            onClick={() => onOpenReservationModal(machine.id)}
          >
            <Plus size={15} />
            <span>新增預約 / 排隊</span>
          </button>
        )}

        {/* 2. 等待報到狀態：純狀態提示 (由同學於「我的預約」操作開始使用) */}
        {machine.status === '等待報到' && (
          <div className="flex-1 py-2 px-3 text-xs font-bold text-amber-800 bg-amber-100/70 rounded-xl text-center border border-amber-200/80 select-none flex items-center justify-center gap-1.5">
            <Clock size={13} className="text-amber-700 animate-pulse" />
            <span>等候同學報到中</span>
          </div>
        )}

        {/* 3. 使用中狀態：純狀態提示 (由同學於「我的預約」操作結束使用) */}
        {machine.status === '使用中' && (
          <div className="flex-1 py-2 px-3 text-xs font-bold text-red-700/80 bg-red-100/60 rounded-xl text-center border border-red-200/60 select-none">
            機台使用中
          </div>
        )}

        {/* 分享 / 複製連結 */}
        <button
          className="p-2.5 rounded-xl bg-white/70 hover:bg-white text-slate-600 border border-black/10 transition-colors"
          onClick={() => alert(`已複製【${machine.name}】機台狀態！`)}
          title="複製機台狀態"
        >
          <Share2 size={15} />
        </button>
      </div>
    </div>
  );
};
