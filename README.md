# Introduction

도커 로그 파일의 크기를 0으로 만드는 아주 간단한 스크립트입니다. commander 노드 모듈을 이용하여 매개변수를 입력하지 않았을 때의 처리나 chalk를 이용한 터미널 색상 변경 처리 등의 휘황찬란한 코드는 일단 제거하였으며 스케줄러를 통하여 정기적인 간격으로 실행하는 방식을 쓰면 적절합니다.

## 모든 컨테이너의 로그 삭제

모든 로그를 삭제하려면 다음과 같이 하시기 바랍니다.

```sh
sudo npx ts-node ./src/index.ts --all
```

일별 자동 삭제는 다음과 같습니다 (매일 오전 0시에 자동 실행됩니다)

```sh
sudo npx ts-node ./src/index.ts --all -d
```

## 데몬 프로세스 종료

```sh
ps -xa | grep docker-log-manager
sudo kill -9 `ps -xa | grep docker-log-manager | awk '{print $1}' | head -n 1`
```

## 특정 컨테이너의 로그 삭제

```sh
npx ts-node ./src/index.ts --container=<container_name>
```

실용적인 예제는 다음과 같습니다.

```sh
sudo npx ts-node ./src/index.ts --container=nginx_proxy
```

도커 컨테이너 명을 전달하면 자동으로 로그 파일의 크기를 0으로 만들어 줍니다, 이 명령은 동기 모드로 동작합니다. 기본적으로 노드의 파일 시스템 API를 이용하지 않아도, 터미널 명령어를 통해 리눅스에서 다음과 같이 처리가 가능합니다.

```sh
sudo sh -c "truncate -s 0 <log_file_path>"
```

하지만 정기 실행보다는 docker-compose 상에서의 로그의 크기를 제한하는 것이 더 합리적이라고 생각되지만, 중간에 서버를 끌 수가 없는 경우에만 이 명령을 사용하는 것이 좋습니다.

## 웹훅 서버로 로그 전송

다음과 같이 `config.json` 파일에 `webhook`(웹훅 URL)을 적으면 로그의 내용을 서버로 전송할 수 있습니다. 데이터는 POST 요청으로 전송됩니다.

```json
{
  "windows": {
    "targetFolder": "./test/logs",
    "interval": "daily",
    "oldFileDeleteDays": 31,
    "webhook": "http://localhost:3000/a"
  },
  "linux": {
    "targetFolder": "/home/ubuntu/logs",
    "interval": "daily",
    "oldFileDeleteDays": 31,
    "webhook": "http://localhost:3000/a"
  }
}
```

스케줄러가 동작할 때, 웹훅 서버에서는 아래와 같이 로그 데이터를 수신 받게 됩니다.

<p align="center">
<img src="./docs/img/webhook.png">
</p>

`daily` 주기이므로, 매일밤 자정(0시)에 웹훅 서버에 전송됩니다. 이 기능을 사용하려면 웹훅 서버가 준비되어있어야 합니다.

# 실행 방법

노드 12버전 이상을 nvm을 통하여 설치해주시고, yarn을 통하여 패키지를 설치하세요.

```sh
# 노드 패키지 설치
npm install -g yarn
yarn install
```

# docker-compose의 로깅 옵션 사용

[https://docs.docker.com/compose/compose-file/compose-file-v3/#logging](https://docs.docker.com/compose/compose-file/compose-file-v3/#logging) 를 보면 저장되는 로그의 용량을 제한할 수 있습니다. 도커 설정 파일을 다시 적용한다면 이 옵션을 적용할 수 있습니다.

```yml
version: "3.9"
services:
  some-service:
    image: some-service
    logging:
      driver: "json-file"
      options:
        max-size: "200k"
        max-file: "10"
```

로깅 스토리지를 제한하면 쾌적한 서버 환경을 구축할 수 있습니다.
