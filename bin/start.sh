#!/bin/sh
cd ../
INDEX_FILE=$(readlink -f ../src/index.ts)
sudo npx ts-node $INDEX_FILE --all -d
echo "started docker-log-manager"