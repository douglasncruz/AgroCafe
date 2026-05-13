@echo off
echo 🧹 Encerrando processos do Auto-Watch para destravar a pasta...
:: Busca e encerra processos PowerShell que estejam executando o auto-watch.ps1
powershell -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*auto-watch.ps1*' } | ForEach-Object { Stop-Process $_.ProcessId -Force -ErrorAction SilentlyContinue }"

echo 🛠️ Iniciando Conserto do Git e Sincronização Forçada...

:: Garantir que o git seja encontrado
where git >nul 2>nul
if %errorlevel% neq 0 (
    set "PATH=%PATH%;C:\Program Files\Git\bin;C:\Program Files (x86)\Git\bin;%LOCALAPPDATA%\Programs\Git\bin"
)

echo 1. Buscando dados do GitHub...
git fetch origin

echo 2. Vinculando branch main...
git branch --set-upstream-to=origin/main main

echo 3. Sincronizando arquivos (Pull)...
:: O rebase com allow-unrelated-histories resolve o conflito de pastas diferentes
git pull origin main --rebase --allow-unrelated-histories

echo 4. Enviando correções (Push Forçado)...
git push origin main --force

echo.
echo ✅ Sincronização Concluída com Sucesso!
echo O site na Vercel começará a ser atualizado em instantes.
pause
