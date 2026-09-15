FROM node:22-alpine
WORKDIR /app
COPY . .
RUN npm ci --omit=dev && npm ci --omit=dev --prefix game-1-ktane && npm ci --omit=dev --prefix game-2-overcooked && npm ci --omit=dev --prefix game-3-falling-blocks && npm ci --omit=dev --prefix game-4-skribbl
EXPOSE 4100 4101 4102 4103 4104
CMD ["npm","start"]
