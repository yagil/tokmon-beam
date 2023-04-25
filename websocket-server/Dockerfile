FROM node:alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./

COPY . .

RUN npm install -g typescript
RUN tsc

EXPOSE ${WSS_PORT}

CMD ["node", "./build/relayserver.js"]