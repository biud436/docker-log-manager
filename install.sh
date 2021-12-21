#!/bin/sh
INDEX_FILE_PATH=$(readlink -f ./bin/docker-log-manager)
ln -s $INDEX_FILE_PATH /usr/local/bin/docker-log-manager