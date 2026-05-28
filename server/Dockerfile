FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json ./server/

RUN npm ci --workspace server --omit=dev

COPY db ./db
COPY server ./server

WORKDIR /app/server

RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh

ENV NODE_ENV=production
EXPOSE 4000

ENTRYPOINT ["sh", "./docker-entrypoint.sh"]
CMD ["node", "src/server.js"]
