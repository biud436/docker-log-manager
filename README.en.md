# Introduction

This is a pretty simple script that it allows you to erase logs of docker container.

## To remove logs of all containers

To remove all logs of docker containers, run as below command.

```sh
sudo npx ts-node ./src/index.ts --all
```

if you want to remove logs of them daily at 0 am automatically, run as below command.

```sh
sudo npx ts-node ./src/index.ts --all -d
```

## How to kill started logger process with daemon

```sh
sudo kill -9 `ps -xa | grep docker-log-manager | awk '{print $1}' | head -n 1`
```

## To remove specific container logs

```sh
npx ts-node ./src/index.ts --container=<container_name>
```

The pretty useful command is below:

```sh
sudo npx ts-node ./src/index.ts --container=nginx_proxy
```

if you passed the container name as argument, it would be set the file size is to 0, and then this command will work with synchronously mode. basically, you can also use this comamnd handles it as belows, without a File System API of Node.js via terminal command on the system such as linux.

```sh
sudo sh -c "truncate -s 0 <log_file_path>"
```

하지만 정기 실행보다는 docker-compose 상에서의 로그의 크기를 제한하는 것이 더 합리적이라고 생각되지만, 중간에 서버를 끌 수가 없는 경우에만 이 명령을 사용하는 것이 좋습니다.

# 실행 방법

노드 12버전 이상을 nvm을 통하여 설치해주시고, yarn을 통하여 패키지를 설치하세요.

```sh
# 노드 패키지 설치
npm install -g yarn
yarn install
```
