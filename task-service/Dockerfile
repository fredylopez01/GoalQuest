FROM node:20-alpine

WORKDIR /app

# Dependencias del sistema necesarias para Prisma en Alpine
RUN apk add --no-cache openssl

# Copiar el script de entrada
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3001

CMD ["/docker-entrypoint.sh"]