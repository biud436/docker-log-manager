FROM node:alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
ENTRYPOINT ["node", "/usr/src/app/src/index.js"]
CMD ["--container=nginx_proxy"]