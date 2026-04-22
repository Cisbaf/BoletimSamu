# =========================
# Etapa 1: build do Vite
# =========================
FROM node:22-alpine AS builder

WORKDIR /app

# Copia apenas os arquivos de dependência (cache)
COPY boletim-vite/package*.json ./

RUN npm install

# Copia o restante do frontend
COPY boletim-vite/ .

# Build
RUN npm run build

# =========================
# Etapa 2: backend Python
# =========================
FROM python:3.12-slim

# Instala dependências de runtime necessárias para mysqlclient funcionar
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev pkg-config default-libmysqlclient-dev poppler-utils && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*


# Evita arquivos .pyc e buffer
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Padta Principal
WORKDIR /app

# Copia backend
COPY django/ ./

# Copia build do Vite para dentro do Django (ex: static)
COPY --from=builder /app/dist ./src/static/frontend

# Instala dependências Python
COPY django/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Porta padrão
EXPOSE 8000

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

WORKDIR /app/src

ENTRYPOINT ["/entrypoint.sh"]
