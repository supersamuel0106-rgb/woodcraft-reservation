@echo off
chcp 65001 > nul
title 工廠機台預約系統 v0.4 - 本地測試伺服器
cd /d "%~dp0"

echo ===================================================
echo  工廠機台預約系統 v0.4 (Supabase 雲端獨立版)
echo ===================================================
echo  正在啟動本地伺服器並開啟瀏覽器...
echo.

node server.js

if %errorlevel% neq 0 (
    echo.
    echo 啟動發生異常，嘗試直接以瀏覽器開啟 index.html...
    start "" "index.html"
)

pause
