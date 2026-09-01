/**
 * 叫號通知與系統日誌彈窗 (NotificationModal)
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { Bell, X, CheckCircle2 } from 'lucide-react';

interface NotificationModalProps {
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ onClose }) => {
  const { notifications } = useApp();

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">叫號推播與系統日誌</h3>
          </div>
          <button 
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-200 transition-colors" 
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-10 text-slate-400 space-y-1">
              <CheckCircle2 size={32} className="mx-auto text-slate-300" />
              <p className="font-semibold text-sm">目前尚無叫號推播通知</p>
              <p className="text-xs">當前一位同學結束使用時，系統將自動推播通知下一位排隊同學！</p>
            </div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className="bg-blue-50/60 border border-blue-200/80 p-4 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between text-xs text-blue-900 font-bold">
                  <span>{n.subject}</span>
                  <span className="text-[11px] text-blue-600 font-normal">{n.timestamp}</span>
                </div>
                <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                  {n.body}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
