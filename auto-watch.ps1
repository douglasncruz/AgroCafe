# Auto-Deploy Watcher para AgroCafé
$Watcher = New-Object IO.FileSystemWatcher
$Watcher.Path = $PSScriptRoot
$Watcher.IncludeSubdirectories = $true
$Watcher.Filter = "*.*"
$Watcher.EnableRaisingEvents = $true

Write-Host "🚀 Monitoramento Ativo! Salvou, Deployou." -ForegroundColor Green
Write-Host "Pressione Ctrl+C para parar."

$Action = {
    $path = $Event.SourceEventArgs.FullPath
    # Ignorar pastas de sistema e git
    if ($path -notmatch "[\\/]\.git[\\/]" -and $path -notmatch "[\\/]\.git$" -and $path -notmatch "node_modules" -and $path -notmatch "\.next") {
        Write-Host ""
        Write-Host "⚡ Mudança detectada: $(Split-Path $path -Leaf) em $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Cyan
        powershell -ExecutionPolicy Bypass -File "$PSScriptRoot/sync.ps1" "Auto-deploy: $(Split-Path $path -Leaf)"
    }
}

$CreatedHandler = Register-ObjectEvent $Watcher "Created" -Action $Action
$ChangedHandler = Register-ObjectEvent $Watcher "Changed" -Action $Action

try {
    while ($true) {
        Start-Sleep 1
    }
} finally {
    Unregister-Event -SourceIdentifier $CreatedHandler.Name
    Unregister-Event -SourceIdentifier $ChangedHandler.Name
    $Watcher.Dispose()
    Write-Host "Observador parado." -ForegroundColor Yellow
}
