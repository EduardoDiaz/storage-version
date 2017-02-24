FROM node:6.9.10

RUN mkdir -p /usr/src/app/server

WORKDIR /usr/src/app/server

COPY . /usr/src/app/server/
RUN npm install --production

EXPOSE 8000

CMD ["node", "/usr/src/app/server/bin/storage.js"]
