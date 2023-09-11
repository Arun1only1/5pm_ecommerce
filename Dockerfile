FROM node:18-alpine

EXPOSE  8000



RUN  mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY package.json package.json

RUN npm install && npm cache -f clean

COPY . .

CMD ["npm", "start"]

