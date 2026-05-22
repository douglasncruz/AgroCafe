#!/bin/bash
# Backup Automático - Agro Café
# Script gerado para execução diária via Cron Job.

# Variáveis
BACKUP_DIR="/opt/agrocafe/backups"
APP_DIR="/opt/agrocafe/app" # Diretório raiz do app onde estão os uploads, db e env
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_full_$DATE.tar.gz"
ENCRYPTED_FILE="$BACKUP_FILE.enc"
ENCRYPTION_KEY=${BACKUP_ENCRYPTION_KEY:-"CHAVE_SUPER_SECRETA_AGROCAFE_2026"}
RCLONE_REMOTE="gdrive:AgroCafe_Backups" # Nome do remote configurado no rclone

mkdir -p "$BACKUP_DIR"

echo "=== Iniciando Backup Agro Café: $DATE ==="

# 1. Copiando arquivos críticos
mkdir -p /tmp/agrocafe_backup
cp -r $APP_DIR/backend/uploads /tmp/agrocafe_backup/uploads 2>/dev/null || true
cp $APP_DIR/backend/agrocafe.sqlite /tmp/agrocafe_backup/ 2>/dev/null || true
cp $APP_DIR/docker-compose.yml /tmp/agrocafe_backup/ 2>/dev/null || true

# 2. Dump do Postgres (Se em uso no docker)
docker exec agrocafe_db pg_dump -U postgres agrocafe > /tmp/agrocafe_backup/postgres_dump.sql 2>/dev/null || echo "Postgres não detectado ou falha no dump, usando fallback local."

# 3. Compactação
tar -czf "$BACKUP_FILE" -C /tmp agrocafe_backup

# 4. Criptografia
openssl aes-256-cbc -salt -pbkdf2 -in "$BACKUP_FILE" -out "$ENCRYPTED_FILE" -k "$ENCRYPTION_KEY"

# 5. Limpeza de Temporários e Arquivo Não Criptografado
rm -rf /tmp/agrocafe_backup
rm "$BACKUP_FILE"

# 6. Sincronização Nuvem (Google Drive/OneDrive via Rclone)
echo "Enviando para a nuvem via Rclone..."
rclone copy "$ENCRYPTED_FILE" "$RCLONE_REMOTE"

# 7. Retenção (Mantém 7 backups diários locais)
echo "Aplicando política de retenção local (7 dias)..."
find "$BACKUP_DIR" -type f -name "*.enc" -mtime +7 -exec rm {} \;

echo "=== Backup Concluído com Sucesso! ==="
