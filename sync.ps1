# Script de Automação AgroCafé
# Este script salva todas as alterações, faz o commit e envia para o GitHub

$commitMsg = $args[0]
if (-not $commitMsg) {
    $commitMsg = "Update: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
}

Write-Host "--- Iniciando Sincronização ---" -ForegroundColor Cyan

# Tentar localizar o git se não estiver no PATH
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    $gitPaths = @(
        "C:\Program Files\Git\bin\git.exe",
        "C:\Program Files (x86)\Git\bin\git.exe",
        "$env:LOCALAPPDATA\Programs\Git\bin\git.exe"
    )
    foreach ($path in $gitPaths) {
        if (Test-Path $path) {
            function git { & $path $args }
            Write-Host "Git localizado em: $path" -ForegroundColor Yellow
            break
        }
    }
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "ERRO: Git não encontrado. Por favor, instale o Git ou adicione-o ao PATH." -ForegroundColor Red
    exit 1
}

# Adicionar arquivos
Write-Host "Adicionando arquivos..."
git add .

# Commit
Write-Host "Realizando commit: $commitMsg"
git commit -m $commitMsg

# Push
Write-Host "Enviando para o GitHub (branch main)..."
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "--- Sincronização Concluída com Sucesso! ---" -ForegroundColor Green
    Write-Host "O deployment na Vercel começará automaticamente em instantes."
} else {
    Write-Host "--- Erro na Sincronização ---" -ForegroundColor Red
    Write-Host "Verifique se há conflitos ou se você está logado no Git."
}
