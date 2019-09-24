FROM node:12.2-alpine

COPY package.json ./
COPY server.ts ./
COPY tsconfig.json ./

COPY ./src ./src
COPY ./utils ./utils
COPY ./definitions ./definitions

RUN npm install --no-package-lock

EXPOSE 3000

CMD npm run start:docker