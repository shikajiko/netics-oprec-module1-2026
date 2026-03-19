FROM node:24.14.0-alpine
WORKDIR /src
COPY package.json ./
RUN npm install
COPY . .
CMD ["node", "api.js"]