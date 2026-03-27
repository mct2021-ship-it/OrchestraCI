FROM node:22
WORKDIR /app
COPY package.json ./
RUN npm install
ENV NODE_ENV=production
COPY . .
RUN npm run build
CMD ["npm", "start"]
