#!/bin/sh
set -e
sudo kill -9 `ps -xa | grep docker-log-manager | awk '{print $1}' | head -n 1`
echo "Killed docker-log-manager"