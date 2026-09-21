# ==========================================================================
# Dockerfile para deploy do FoodTruck Pedidos no Railway
# ==========================================================================
FROM node:20-slim AS base

# OpenSSL e certificados são necessários para o Prisma
RUN apt-get update -y \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Habilita o Yarn moderno (v4) via corepack
RUN corepack enable

# --- Instalação de dependências (camada em cache) -------------------------
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --no-immutable

# --- Cópia do código e build ----------------------------------------------
COPY . .

# Gera o Prisma Client e compila a aplicação

RUN DATABASE_URL="postgresql://user:pass@localhost:5432/db" yarn prisma generate \
 && DATABASE_URL="postgresql://user:pass@localhost:5432/db" yarn build

# --- Runtime ---------------------------------------------------------------
ENV NODE_ENV=production
# O Railway injeta a porta via variável PORT; o Next.js a respeita automaticamente
EXPOSE 3000

# Aplica o schema ao banco (idempotente) e inicia o servidor
CMD ["sh", "-c", "yarn prisma db push --skip-generate --accept-data-loss && yarn start -p ${PORT:-3000} -H 0.0.0.0"]
