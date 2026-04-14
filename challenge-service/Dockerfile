# ── Etapa 1: Build ───────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código fuente
COPY . .

# Compilar TypeScript
RUN npm run build

# ── Etapa 2: Producción ─────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# Instalar solo dependencias de producción
RUN npm install --omit=dev

# Copiar build desde la etapa anterior
COPY --from=builder /app/dist ./dist

# Exponer puerto
EXPOSE 3002

CMD ["node", "dist/main.js"]