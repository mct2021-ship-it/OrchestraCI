FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
RUN npm install --include=dev
COPY . .
RUN npm run build
CMD ["npx", "tsx", "server.ts"]
