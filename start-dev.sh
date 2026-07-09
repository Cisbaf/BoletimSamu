#!/usr/bin/env bash
# Sobe o ambiente de DESENVOLVIMENTO: Django (runserver :8000) + Vite (HMR :5173).
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f .env.dev ]; then
  echo "Arquivo .env.dev não encontrado. Criando a partir de .env.dev.example..."
  cp .env.dev.example .env.dev
fi

echo "Subindo ambiente de DESENVOLVIMENTO..."
echo "  Django:  http://localhost:8000"
echo "  Vite:    http://localhost:5173"
docker compose -f docker-compose.dev.yml --env-file .env.dev up --build
