FROM node:alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
ARG LOG_CONTAINER
COPY . .
ENTRYPOINT ["node", "/usr/src/app/src/index.js", "--container=${LOG_CONTAINER}"]