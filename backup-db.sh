#!/bin/bash
# Script de backup do banco Supabase (degenscult)
# Uso: ./backup-db.sh

# Carrega a DIRECT_URL do arquivo .env automaticamente
DIRECT_URL=$(grep '^DIRECT_URL=' .env | cut -d '=' -f2- | tr -d '"')

if [ -z "$DIRECT_URL" ]; then
  echo "Erro: DIRECT_URL não encontrada no .env"
  exit 1
fi

DATE=$(date +%Y%m%d)
FILENAME="backup_${DATE}.sql"

echo "Iniciando backup do banco..."
pg_dump "$DIRECT_URL" > "$FILENAME"

if [ $? -eq 0 ]; then
  echo "Backup criado com sucesso: $FILENAME"
  echo "Lembre-se de copiar esse arquivo para o Google Drive e depois apagar a cópia local."
else
  echo "Erro ao criar o backup. Confira a DIRECT_URL no .env."
  exit 1
fi
