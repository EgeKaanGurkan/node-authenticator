FROM node:lts-slim

WORKDIR /app
COPY package*.json ./

RUN npm install

COPY . .

ENV PORT=60000

EXPOSE 60000

CMD [ "npm", "start" ]
