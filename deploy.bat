@echo off
echo 🚀 Iniciando Deploy Automatizado AgroCafe...
powershell -ExecutionPolicy Bypass -File ".\sync.ps1" "Update automatizado e validacao de build"
echo ✅ Processo finalizado. Verifique seu GitHub Actions para ver a validacao.
pause
