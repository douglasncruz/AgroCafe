#!/bin/bash
# Restore Automático - Agro Café
# Script para recuperar a aplicação em caso de desastre.

BACKUP_FILE=$1
ENCRYPTION_KEY=${BACKUP_ENCRYPTION_KEY:-"CHAVE_SUPER_SECRETA_AGROCAFE_2026"}
APP_DIR="/opt/agrocafe/app"

if [ -z "$BACKUP_FILE" ]; then
    echo "Uso: ./restore.sh <caminho_para_backup.tar.gz.enc>"
    exit 1
fi

echo "=== Iniciando Restauração Agro Café ==="

DECRYPTED_FILE="${BACKUP_FILE%.enc}"

# 1. Descriptografia
echo "Descriptografando backup..."
openssl aes-256-cbc -d -pbkdf2 -in "$BACKUP_FILE" -out "$DECRYPTED_FILE" -k "$ENCRYPTION_KEY"

if [ $? -ne 0 ]; then
    echo "Falha na descriptografia. Verifique a chave e o arquivo."
    rm -f "$DECRYPTED_FILE"
    exit 1
fi

# 2. Extração
echo "Extraindo arquivos..."
rm -rf /tmp/agrocafe_restore
mkdir -p /tmp/agrocafe_restore
tar -xzf "$DECRYPTED_FILE" -C /tmp/agrocafe_restore

# 3. Restaurando Arquivos Locais
echo "Restaurando uploads e banco de dados local..."
mkdir -p $APP_DIR/backend/uploads
cp -r /tmp/agrocafe_restore/agrocafe_backup/uploads/* $APP_DIR/backend/uploads/ 2>/dev/null || true
cp /tmp/agrocafe_restore/agrocafe_backup/agrocafe.sqlite $APP_DIR/backend/ 2>/dev/null || true

# 4. Restaurando Postgres
if [ -f "/tmp/agrocafe_restore/agrocafe_backup/postgres_dump.sql" ]; then
    echo "Dump Postgres encontrado! Restaurando..."
    cat /tmp/agrocafe_restore/agrocafe_backup/postgres_dump.sql | docker exec -i agrocafe_db psql -U postgres -d agrocafe
fi

# 5. Limpeza
rm -rf /tmp/agrocafe_restore
rm -f "$DECRYPTED_FILE"

echo "=== Restauração Concluída! ==="
echo "Por favor, reinicie os containers com: docker-compose down && docker-compose up -d"
