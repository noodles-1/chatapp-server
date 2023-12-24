FROM node:17-alpine

WORKDIR /chatapp-server

COPY package.json .

RUN npm install

COPY . .

CMD npm run start