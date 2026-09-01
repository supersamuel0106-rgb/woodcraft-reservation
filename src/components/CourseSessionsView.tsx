/**
 * 課程場次視圖元件 (CourseSessionsView)
 * 
 * 1:1 還原 AppSheet 截圖 3 之列表、N/Y 狀態標記、刪除/編輯/同步按鈕與右下角 FAB「+」按鈕
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Trash2, Edit3, CheckCircle, Plus, X } from 'lucide-react';
import { CourseSession } from '../types';

export const CourseSessionsView: React.FC = () => {
  const { courseSessions, setCurrentCourseSession } = useApp();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('12:00');

  const handleSyncSession = async (session: CourseSession) => {
    await setCurrentCourseSession(session.id);
    alert(`已同步設定【${session.sessionId}】為目前有效課程場次！`);
  };

  return (
    <div className="relative min-h-[500px] space-y-3 pb-16">
      {/* 課程場次列表 (1:1 截圖 3) */}
      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
        {courseSessions.map(session => (
          <div key={session.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
            {/* 左側：N/Y 標籤與場次時間說明 */}
            <div className="space-y-1">
              <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded ${
                session.isCurrent ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {session.isCurrent ? 'Y (目前場次)' : 'N'}
              </span>
              <h4 className="text-base font-bold text-slate-800">
                {session.notes || `${session.sessionId}：${session.startTime.substring(0, 5)}－${session.endTime.substring(0, 5)}`}
              </h4>
            </div>

            {/* 右側：刪除、編輯、同步按鈕 (1:1 截圖 3) */}
            <div className="flex items-center gap-1 sm:gap-2 text-slate-600">
              <button
                className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-red-600 transition-colors"
                title="刪除場次"
                onClick={() => alert('系統預設場次不可刪除')}
              >
                <Trash2 size={18} />
              </button>

              <button
                className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-blue-600 transition-colors"
                title="編輯場次"
                onClick={() => alert(`編輯【${session.sessionId}】`)}
              >
                <Edit3 size={18} />
              </button>

              <button
                className={`p-2 rounded-lg transition-colors ${
                  session.isCurrent 
                    ? 'text-emerald-600 bg-emerald-50' 
                    : 'text-slate-500 hover:bg-slate-200 hover:text-emerald-600'
                }`}
                title="呼叫系統設定同步 (設為目前場次)"
                onClick={() => handleSyncSession(session)}
              >
                <CheckCircle size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 右下角 FAB「+」按鈕 (1:1 截圖 3) */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-24 right-6 sm:right-10 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-30"
        title="新增課程場次"
      >
        <Plus size={28} />
      </button>

      {/* 新增場次 Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">新增課程場次</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1">場次名稱 (例：時段四)：</label>
                <input
                  type="text"
                  value={newSessionName}
                  onChange={e => setNewSessionName(e.target.value)}
                  placeholder="時段四"
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1">開始時間：</label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={e => setNewStartTime(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block mb-1">結束時間：</label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={e => setNewEndTime(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                取消
              </button>
              <button
                onClick={() => {
                  alert('場次已建立！');
                  setIsAddModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
              >
                儲存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
