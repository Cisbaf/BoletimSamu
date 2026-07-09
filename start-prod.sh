#!/usr/bin/env bash
# Sobe o ambiente de PRODUÇÃO: Gunicorn (build integrado do Vite) + Nginx.
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "Erro: arquivo .env não encontrado." >&2
  echo "Copie .env.example para .env e preencha DJANGO_SECRET_KEY, DATABASE_URL e BOLETIM_PORT." >&2
  exit 1
fi

echo "Subindo ambiente de PRODUÇÃO..."
docker compose -f docker-compose.yml up --build -d
echo "Pronto. Logs: docker compose -f docker-compose.yml logs -f"
