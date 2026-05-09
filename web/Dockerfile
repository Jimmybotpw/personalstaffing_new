FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install

FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 py3-pip
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pip3 install --break-system-packages -r python/requirements.txt
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache python3 py3-pip
ENV NODE_ENV=production
COPY --from=builder /app .
RUN pip3 install --break-system-packages -r python/requirements.txt
EXPOSE 3000
CMD ["node", "scripts/start-with-db.mjs"]
