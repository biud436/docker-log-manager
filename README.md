# Introduction

도커 로그 파일의 크기를 0으로 만드는 아주 간단한 스크립트입니다. commander 노드 모듈을 이용하여 매개변수를 입력하지 않았을 때의 처리나 chalk를 이용한 터미널 색상 변경 처리 등의 휘황찬란한 코드는 일단 제거하였으며 스케줄러를 통하여 정기적인 간격으로 실행하는 방식을 쓰면 적절합니다.

```sh
node ./src/index.js --container=<container_name>
```

실용적인 예제는 다음과 같습니다.

```sh
sudo node ./src/index.js --container=nginx_proxy
```

도커 컨테이너 명을 전달하면 자동으로 로그 파일의 크기를 0으로 만들어 줍니다, 이 명령은 동기 모드로 동작합니다. 기본적으로 노드의 파일 시스템 API를 이용하지 않아도, 터미널 명령어를 통해 리눅스에서 다음과 같이 처리가 가능합니다.

```sh
sudo sh -c "truncate -s 0 <log_file_path>"
```

하지만 정기 실행보다는 docker-compose 상에서의 로그의 크기를 제한하는 것이 더 합리적이라고 생각되지만, 중간에 서버를 끌 수가 없는 경우에만 이 명령을 사용하는 것이 좋습니다.

# 실행 방법

노드 12버전 이상을 nvm을 통하여 설치해주시고, yarn을 통하여 패키지를 설치하세요.

```sh
npm install -g yarn
yarn install
```
