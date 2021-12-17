FROM node:alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
ARG LOG_CONTAINER
COPY . .
CMD ["node", "./src/index.js", "--container=${LOG_CONTAINER}"]