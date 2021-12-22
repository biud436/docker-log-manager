#!/bin/sh
sudo kill -9 `ps -xa | grep docker-log-manager | awk '{print $1}' | head -n 1`