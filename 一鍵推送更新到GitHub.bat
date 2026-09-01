@echo off
chcp 65001 > nul
echo ========================================================
echo   🪵 木工機台預約系統 - GitHub 一鍵同步更新
echo ========================================================
echo.

set /p commit_msg="請輸入本次更新說明 (直接按 Enter 預設為 'update'): "
if "%commit_msg%"=="" set commit_msg=update

echo.
echo [1/3] 加入所有變更檔案...
git add .

echo.
echo [2/3] 建立版本 Commit: %commit_msg%...
git commit -m "%commit_msg%"

echo.
echo [3/3] 推送到 GitHub...
git push origin main

echo.
echo ========================================================
echo   ✅ 更新完成！GitHub Pages 將於 1~2 分鐘內自動同步！
echo ========================================================
echo.
pause
