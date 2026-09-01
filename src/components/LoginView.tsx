/**
 * 登入與身份驗證視圖元件 (LoginView)
 * 
 * 驗證 Email 是否存在於「修課名單」Database 中
 * 支援 LocalStorage 自動記住登入狀態
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LogIn, Wrench, AlertCircle } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { loginWithEmail, isLoading } = useApp();
  const [emailInput, setEmailInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!emailInput.trim()) {
      setErrorMessage('請輸入您的 Email！');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await loginWithEmail(emailInput.trim());
      if (!result.success) {
        setErrorMessage(result.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      {/* 登入卡片主體 */}
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* 頂部標誌與系統名稱 */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30 text-white mb-3">
            <Wrench size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">工廠機台預約系統</h2>
          <p className="text-xs font-semibold text-slate-500">
            請輸入修課名單登記之 Email 以進入預約系統
          </p>
        </div>

        {/* 登入表單 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              電子郵件 (Email)：
            </label>
            <input
              type="email"
              value={emailInput}
              onChange={e => {
                setEmailInput(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="example@gmail.com"
              disabled={isLoading || isSubmitting}
              className="w-full border-2 border-slate-300 focus:border-blue-600 rounded-xl p-3 text-sm font-semibold text-slate-900 bg-white focus:outline-none transition-colors"
            />
          </div>

          {/* 錯誤提示 */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700 font-medium">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 送出按鈕 */}
          <button
            type="submit"
            disabled={isLoading || isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 text-sm"
          >
            <LogIn size={18} />
            {isSubmitting ? '驗證修課名單中...' : '驗證身分並進入系統'}
          </button>
        </form>

        {/* 說明文字 */}
        <div className="text-center text-[11px] text-slate-400">
          系統將自動記錄您的登入狀態，下次開啟可直接進入。
        </div>
      </div>
    </div>
  );
};
