#!/usr/bin/env bash

# ==============================================================================
# Script de Prueba para el Webhook de n8n (Google Drive Obsidian Sync)
# ==============================================================================
# Uso:
#   ./scripts/test-drive-sync.sh [URL_DEL_WEBHOOK] [SECRET]
#
# Ejemplos:
#   ./scripts/test-drive-sync.sh https://n8n.ncodem.com/webhook-test/drive-sync
#   ./scripts/test-drive-sync.sh https://n8n.ncodem.com/webhook/drive-sync mi_super_secreto_webhook_12345
# ==============================================================================

set -euo pipefail

# Obtener directorio raíz del proyecto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Cargar variables de entorno si existen
if [ -f "${ROOT_DIR}/.env" ]; then
  # export de variables sin sobrescribir las ya definidas en la shell
  set -a
  source <(grep -v '^#' "${ROOT_DIR}/.env" | sed -e 's/\r$//' | awk 'NF')
  set +a
elif [ -f "${ROOT_DIR}/backend/.env" ]; then
  set -a
  source <(grep -v '^#' "${ROOT_DIR}/backend/.env" | sed -e 's/\r$//' | awk 'NF')
  set +a
fi

WEBHOOK_URL="${1:-${N8N_DRIVE_WEBHOOK_URL:-https://n8n.ncodem.com/webhook-test/drive-sync}}"
SECRET="${2:-${WEBHOOK_SECRET:-mi_super_secreto_webhook_12345}}"

echo "================================================================"
echo "Probando Webhook de n8n para Google Drive"
echo "URL destino: ${WEBHOOK_URL}"
echo "Header X-Webhook-Secret: ${SECRET}"
echo "================================================================"

TEST_PAYLOAD=$(cat <<EOF
{
  "id": "test-$(date +%s)",
  "videoTitle": "Prueba de Sincronización n8n y Google Drive",
  "channelName": "NCodem Dev",
  "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "markdownContent": "---\nid: test-$(date +%s)\nfecha: $(date '+%Y-%m-%d %H:%M:%S')\ncanal: NCodem Dev\nurl: https://www.youtube.com/watch?v=dQw4w9WgXcQ\n---\n\n# Prueba de Sincronización n8n y Google Drive\n\nEste archivo fue generado automáticamente mediante el script de prueba para validar la integración entre **NestJS**, **n8n** y **Google Drive (Obsidian)**.\n\n## Puntos Clave\n1. Webhook recibido correctamente en n8n.\n2. Texto Markdown convertido a binario UTF-8 por el nodo Code.\n3. Archivo .md subido a la carpeta configurada en Google Drive.\n\n#resumen #n8n #drive #obsidian"
}
EOF
)

echo "Enviando payload..."
HTTP_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "${WEBHOOK_URL}" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: ${SECRET}" \
  -d "${TEST_PAYLOAD}")

HTTP_BODY=$(echo "${HTTP_RESPONSE}" | sed -e '$d')
HTTP_STATUS=$(echo "${HTTP_RESPONSE}" | tail -n1 | sed -e 's/HTTP_STATUS://')

echo "----------------------------------------------------------------"
echo "Respuesta del Servidor (Status HTTP: ${HTTP_STATUS}):"
echo "${HTTP_BODY}"
echo "----------------------------------------------------------------"

if [ "${HTTP_STATUS}" -ge 200 ] && [ "${HTTP_STATUS}" -lt 300 ]; then
  echo "✅ ¡Petición enviada exitosamente a n8n!"
  echo "Si estabas usando la URL de test (webhook-test), verifica la ejecución en la interfaz de n8n."
else
  echo "❌ Error al enviar petición (HTTP ${HTTP_STATUS})."
  echo "Verifica que n8n esté activo o que la URL esté escuchando."
  exit 1
fi
